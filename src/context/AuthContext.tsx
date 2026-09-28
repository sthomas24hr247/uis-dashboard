import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const API_URL = import.meta.env.VITE_API_URL?.replace('/graphql', '') || 'https://api.uishealth.com';

interface User {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  practiceId: string;
  practiceName: string;
  pmsType: string;
  role: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  completeMfaLogin: (tempToken: string, code: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  error: string | null;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  displayName?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---- Session policy (HIPAA automatic logoff) ----
  // Tokens last only as long as the role's inactivity window (15 minutes; 30 for staff) and are
  // renewed while the person is active. A one-minute warning offers "Stay signed in".
  const [warnSeconds, setWarnSeconds] = useState<number | null>(null);
  const [signOutReason, setSignOutReason] = useState<string | null>(() => {
    try { return sessionStorage.getItem('uis_signout_reason'); } catch { return null; }
  });
  const lastActivityRef = React.useRef<number>(Date.now());
  const lastRefreshRef = React.useRef<number>(Date.now());
  const refreshingRef = React.useRef<boolean>(false);

  const tokenExpiryMs = (t: string | null): number => {
    if (!t) return 0;
    try {
      const part = t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = JSON.parse(atob(part + '==='.slice((part.length + 3) % 4)));
      return Number(json.exp || 0) * 1000;
    } catch { return 0; }
  };

  const endSession = React.useCallback((reason: string) => {
    try { sessionStorage.setItem('uis_signout_reason', reason); } catch { /* ignore */ }
    localStorage.removeItem('uis_token');
    localStorage.removeItem('uis_user');
    setToken(null);
    setUser(null);
    setWarnSeconds(null);
    setSignOutReason(reason);
  }, []);

  const renewSession = React.useCallback(async (): Promise<void> => {
    const current = localStorage.getItem('uis_token');
    if (!current || refreshingRef.current) return;
    refreshingRef.current = true;
    try {
      const res = await fetch(`${API_URL}/api/auth/refresh`, { method: 'POST', headers: { Authorization: `Bearer ${current}` } });
      const data: any = await res.json().catch(() => ({}));
      if (res.status === 401) { endSession(data.error || 'Your session has ended. Please sign in again.'); return; }
      if (res.ok && data.token) {
        localStorage.setItem('uis_token', data.token);
        lastRefreshRef.current = Date.now();
        setWarnSeconds(null);
        setToken(data.token);
      }
    } catch { /* network issue: try again on the next check */ }
    finally { refreshingRef.current = false; }
  }, [endSession]);

  useEffect(() => {
    if (!token) return;
    lastRefreshRef.current = Date.now();
    lastActivityRef.current = Date.now();
    setSignOutReason(null);
    try { sessionStorage.removeItem('uis_signout_reason'); } catch { /* ignore */ }
    const mark = () => { lastActivityRef.current = Date.now(); };
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, mark, { passive: true }));
    const onExpired = (ev: Event) => endSession(String((ev as CustomEvent).detail || 'Your session has ended. Please sign in again.'));
    window.addEventListener('uis:session-expired', onExpired as EventListener);
    const tick = setInterval(() => {
      const now = Date.now();
      const exp = tokenExpiryMs(localStorage.getItem('uis_token'));
      if (!exp) return;
      const left = exp - now;
      if (left <= 0) { endSession('You were signed out after a period of inactivity. Please sign in again.'); return; }
      const activeSinceRefresh = lastActivityRef.current > lastRefreshRef.current;
      if (activeSinceRefresh && now - lastRefreshRef.current > 2 * 60 * 1000) { void renewSession(); return; }
      setWarnSeconds(left <= 60 * 1000 && !activeSinceRefresh ? Math.ceil(left / 1000) : null);
    }, 5000);
    return () => {
      clearInterval(tick);
      events.forEach(e => window.removeEventListener(e, mark));
      window.removeEventListener('uis:session-expired', onExpired as EventListener);
    };
  }, [token, endSession, renewSession]);

  useEffect(() => {
    // Check for existing session
    const storedToken = localStorage.getItem('uis_token');
    const storedUser = localStorage.getItem('uis_user');
    
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        
        // Verify token is still valid by calling /me
        fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        })
          .then(res => {
            if (!res.ok && res.status === 401) {
              // Only log out on explicit 401 — not on 500 or network issues
              localStorage.removeItem('uis_token');
              localStorage.removeItem('uis_user');
              setToken(null);
              setUser(null);
            }
            // Any other error — keep local session
          })
          .catch(() => {
            // Network error - keep local session
          });
      } catch (e) {
        localStorage.removeItem('uis_token');
        localStorage.removeItem('uis_user');
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Two-step sign-in not set up yet (required): send the person through guided setup
      if (data.mfaSetupRequired) {
        const setupError: any = new Error('MFA_SETUP_REQUIRED');
        setupError.mfaSetupRequired = true;
        setupError.setupToken = data.setupToken;
        throw setupError;
      }

      // MFA required — throw special error with tempToken
      if (data.mfaRequired) {
        const mfaError: any = new Error('MFA_REQUIRED');
        mfaError.mfaRequired = true;
        mfaError.tempToken = data.tempToken;
        throw mfaError;
      }

      // Store in localStorage
      localStorage.setItem('uis_token', data.token);
      localStorage.setItem('uis_user', JSON.stringify(data.user));
      
      setToken(data.token);
      setUser(data.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const completeMfaLogin = async (tempToken: string, code: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/auth/mfa/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, code }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'MFA validation failed');
      localStorage.setItem('uis_token', data.token);
      localStorage.setItem('uis_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'MFA failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (regData: RegisterData): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Store in localStorage
      localStorage.setItem('uis_token', data.token);
      localStorage.setItem('uis_user', JSON.stringify(data.user));
      
      setToken(data.token);
      setUser(data.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('uis_token');
    localStorage.removeItem('uis_user');
    setToken(null);
    setUser(null);
  };

  const sessionUi = (
    <>
      {user && warnSeconds !== null && (
        <div role="alertdialog" aria-modal="true" aria-labelledby="uis-session-warn-title" aria-describedby="uis-session-warn-text"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white dark:bg-slate-800 p-6 shadow-xl">
            <h2 id="uis-session-warn-title" className="text-lg font-semibold text-slate-900 dark:text-white">Are you still there?</h2>
            <p id="uis-session-warn-text" className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              For patient privacy, you will be signed out in about {warnSeconds} seconds due to inactivity.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 justify-end">
              <button onClick={() => endSession('You have been signed out.')}
                className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
                Sign out
              </button>
              <button autoFocus onClick={() => { lastActivityRef.current = Date.now(); void renewSession(); }}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-teal-600 text-white hover:bg-teal-700">
                Stay signed in
              </button>
            </div>
          </div>
        </div>
      )}
      {!user && signOutReason && (
        <div role="status"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-md rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/30 dark:border-amber-700 px-4 py-3 text-sm text-amber-900 dark:text-amber-200 flex items-start gap-3">
          <span className="flex-1">{signOutReason}</span>
          <button aria-label="Dismiss" className="font-semibold leading-none"
            onClick={() => { setSignOutReason(null); try { sessionStorage.removeItem('uis_signout_reason'); } catch { /* ignore */ } }}>
            ×
          </button>
        </div>
      )}
    </>
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        completeMfaLogin,
        register,
        logout,
        error,
      }}
    >
      {children}
      {sessionUi}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
