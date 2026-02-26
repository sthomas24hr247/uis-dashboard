import { useMemo } from 'react';

export interface AuthUser {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  role: string;
  practiceId: string;
  practiceName: string;
  roles: string[];
}

export function useAuth() {
  const user = useMemo<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem('uis_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const isAdmin = user?.role === 'admin' || user?.roles?.includes('admin');
  const isManager = user?.role === 'manager' || user?.roles?.includes('manager');
  const isDentist = user?.role === 'dentist' || user?.roles?.includes('dentist');

  // Executive = admin role (full access to everything)
  // Manager = manager role (daily operations only)
  // Everyone else = default view (same as manager for now)
  const isExecutive = isAdmin;

  return {
    user,
    isAdmin,
    isManager,
    isDentist,
    isExecutive,
    role: user?.role || 'viewer',
  };
}

// Pages visible to managers (daily operations focus)
export const MANAGER_PAGES = new Set([
  '/home',           // redirects to /manager-dashboard for managers
  '/manager-dashboard',
  '/schedule',
  '/today',
  '/patients',
  '/providers',
  '/ai-predictions',
  '/insurance-verification',
]);

// Pages only visible to executives/admins
export const EXECUTIVE_ONLY_PAGES = new Set([
  '/analytics',
  '/recommendations',
  '/patient-intel',
  '/bil',
  '/outcome-gap',
  '/roi',
  '/marketing',
  '/decision-fingerprint',
  '/provider-analytics',
  '/settings',
]);

export function getNavItemsForRole(allItems: { to: string; icon: any; label: string }[], role: string) {
  if (role === 'admin') {
    // Executives see everything
    return allItems;
  }

  if (role === 'manager') {
    // Managers see only daily operations pages
    return allItems.filter(item => MANAGER_PAGES.has(item.to));
  }

  // Default: show all (dentists, hygienists, etc. — can refine later)
  return allItems;
}
