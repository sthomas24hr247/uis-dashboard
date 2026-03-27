// src/components/claims/UserManagement.tsx
// Admin user management — list, invite, edit role, deactivate users

import { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Shield, RefreshCw, Mail, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

const API = 'https://api.uishealth.com';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  role: string;
  status: string;
  lastLogin: string | null;
  createdAt: string;
}

const ROLES = ['admin', 'staff', 'manager', 'viewer'];

const ROLE_COLORS: Record<string, string> = {
  admin:   'bg-violet-500/10 text-violet-400 border-violet-500/20',
  staff:   'bg-teal-500/10 text-teal-400 border-teal-500/20',
  manager: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  viewer:  'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

function getToken(): string {
  try {
    const stored = localStorage.getItem('uis_token');
    return stored || '';
  } catch { return ''; }
}

function getPracticeId(): string {
  try {
    return JSON.parse(localStorage.getItem('uis_user') || '{}').practiceId || '00000000-0000-0000-0000-000000000001';
  } catch { return '00000000-0000-0000-0000-000000000001'; }
}

export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [passwordMap, setPasswordMap] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'staff',
  });

  const token = getToken();
  const practiceId = getPracticeId();

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/users?practiceId=${practiceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      setErrorMsg('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleInvite = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      setErrorMsg('All fields are required.');
      return;
    }
    setSaving(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          practiceId,
          practiceName: 'UIS Health',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      const createdEmail = form.email;
      const createdPassword = form.password;
      setPasswordMap(prev => ({ ...prev, [createdEmail]: createdPassword }));
      setSuccessMsg(`✅ ${form.firstName} ${form.lastName} created successfully.`);
      setShowInvite(false);
      setForm({ firstName: '', lastName: '', email: '', password: '', role: 'staff' });
      await loadUsers();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId: string, name: string) => {
    if (!confirm(`Remove ${name} from the platform? This cannot be undone.`)) return;
    setDeletingId(userId);
    try {
      await fetch(`${API}/api/auth/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(prev => prev.filter(u => u.id !== userId));
      setSuccessMsg(`✅ ${name} removed.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch {
      setErrorMsg('Failed to remove user.');
    } finally {
      setDeletingId(null);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
    const pwd = Array.from({length: 12}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    setForm(p => ({ ...p, password: pwd }));
    setShowPassword(true);
  };

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center">
            <Users className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">User Management</h2>
            <p className="text-xs text-slate-500">{users.length} user{users.length !== 1 ? 's' : ''} in your organization</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadUsers} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => { setShowInvite(true); setErrorMsg(''); }}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-xl transition-all">
            <Plus className="w-4 h-4" /> Add User
          </button>
        </div>
      </div>

      {/* Success / Error messages */}
      {successMsg && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <p className="text-sm text-emerald-400">{successMsg}</p>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{errorMsg}</p>
        </div>
      )}

      {/* Add User Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Add New User</h3>
              <button onClick={() => setShowInvite(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">First Name *</label>
                  <input value={form.firstName} onChange={e => setForm(p => ({...p, firstName: e.target.value}))}
                    placeholder="First name"
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Last Name *</label>
                  <input value={form.lastName} onChange={e => setForm(p => ({...p, lastName: e.target.value}))}
                    placeholder="Last name"
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Email Address *</label>
                <input type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))}
                  placeholder="user@practice.com"
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-500">Password *</label>
                  <button onClick={generatePassword} className="text-xs text-teal-500 hover:text-teal-400 font-medium">Generate</button>
                </div>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={form.password}
                    onChange={e => setForm(p => ({...p, password: e.target.value}))}
                    placeholder="Min 8 characters"
                    className="w-full px-3 py-2.5 pr-10 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Role</label>
                <select value={form.role} onChange={e => setForm(p => ({...p, role: e.target.value}))}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500">
                  <option value="admin">Admin — Full access, user management</option>
                  <option value="manager">Manager — Reports and approvals</option>
                  <option value="staff">Staff — Claims and verification</option>
                  <option value="viewer">Viewer — Read only</option>
                </select>
              </div>
              {errorMsg && <p className="text-xs text-red-400">{errorMsg}</p>}
            </div>
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3">
              <button onClick={() => setShowInvite(false)}
                className="px-4 py-2 text-sm text-slate-500 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                Cancel
              </button>
              <button onClick={handleInvite} disabled={saving}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-all">
                {saving ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users table */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading users...
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/80">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Last Login</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white text-sm">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-xs text-slate-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border capitalize ${ROLE_COLORS[user.role] || ROLE_COLORS.viewer}`}>
                      {user.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${user.status === 'active' ? 'text-emerald-500' : 'text-slate-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {user.status || 'active'}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-slate-400">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          const pwd = passwordMap[user.email] || 'Contact admin for password';
                          const msg = `Welcome to UIS Health Claims Recovery!\n\nLogin URL: https://claims.uishealth.com/claims-login\nEmail: ${user.email}\nPassword: ${pwd}\n\nPlease change your password after first login.\n\n— UIS Health Team`;
                          navigator.clipboard.writeText(msg);
                          setSuccessMsg(`✅ Credentials for ${user.firstName} copied to clipboard!`);
                          setTimeout(() => setSuccessMsg(''), 3000);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-teal-500 hover:bg-teal-500/10 transition-colors"
                        title="Copy login credentials">
                        <Mail className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id, `${user.firstName} ${user.lastName}`)}
                        disabled={deletingId === user.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                        title="Remove user">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Role legend */}
      <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Role Permissions</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { role: 'Admin', desc: 'Full access including user management, all modules, and settings' },
            { role: 'Manager', desc: 'Reports, approvals, and read access to all modules' },
            { role: 'Staff', desc: 'Claims recovery, insurance verification, and bulk CSV upload' },
            { role: 'Viewer', desc: 'Read-only access to dashboards and reports' },
          ].map(({ role, desc }) => (
            <div key={role} className="space-y-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border capitalize ${ROLE_COLORS[role.toLowerCase()] || ROLE_COLORS.viewer}`}>
                {role === 'Admin' && <Shield className="w-3 h-3 mr-1" />}
                {role}
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
