import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  userId: string;
  email: string;
  practiceId: string;
  practiceName: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// For demo purposes - in production this would call your auth API
const generateDemoToken = (email: string): string => {
  // This is a demo JWT structure - in production, tokens come from your auth server
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    sub: 'demo-user',
    email: email,
    practiceId: 'demo-practice',
    practiceName: 'Demo Dental Practice',
    roles: ['admin'],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  }));
  // Note: This is NOT a valid signature - for demo purposes only
  const signature = btoa('demo-signature');
  return `${header}.${payload}.${signature}`;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing session
    const storedToken = localStorage.getItem('uis_token');
    const storedUser = localStorage.getItem('uis_user');
    
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
      } catch (e) {
        // Invalid stored data, clear it
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
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // For demo - accept any email/password
      // In production, this would call your authentication API
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      // Generate demo token and user
      const demoToken = generateDemoToken(email);
      const demoUser: User = {
        userId: 'demo-user',
        email: email,
        practiceId: 'demo-practice',
        practiceName: 'Demo Dental Practice',
        roles: ['admin'],
      };
      
      // Store in localStorage
      localStorage.setItem('uis_token', demoToken);
      localStorage.setItem('uis_user', JSON.stringify(demoUser));
      
      setToken(demoToken);
      setUser(demoUser);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
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

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
        error,
      }}
    >
      {children}
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
