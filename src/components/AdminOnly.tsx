// src/components/AdminOnly.tsx
// Shows its children only to admins. The server enforces platform-admin access on every
// /api/admin route; this guard keeps the page itself out of view for everyone else.
import { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AdminOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (user && String(user.role || '').toLowerCase() === 'admin') return <>{children}</>;
  return (
    <div className="max-w-md mx-auto mt-16 p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-center">
      <h1 className="text-lg font-semibold text-slate-900 dark:text-white">You don't have access to this page</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">This area is for platform administrators. If you need access, contact your administrator.</p>
    </div>
  );
}
