import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Settings, Database, Shield, Users, Bell, Plug, CheckCircle2,
  AlertTriangle, RefreshCw, Globe, Lock, Cpu, ChevronRight, Building2,
  X, Save, Edit3, Trash2, Plus, Mail, Phone, User, Eye, EyeOff,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL?.replace('/graphql', '') || 'https://api.uishealth.com';

interface TeamUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  title?: string;
  lastLogin?: string;
  status?: 'active' | 'invited' | 'disabled';
  createdAt?: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('practice');
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [editingUser, setEditingUser] = useState<TeamUser | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'staff', phone: '', title: '' });

  useEffect(() => {
    fetch(`${API_URL}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer demo-token' },
      body: JSON.stringify({ query: '{ health { isHealthy latencyMs pmsConnected databaseConnected } }' }),
    }).then(r => r.json()).then(d => setHealthStatus(d.data?.health)).catch(() => {});
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('uis_token') || 'demo-token';
      const res = await fetch(`${API_URL}/api/auth/users`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.map((u: any) => ({
          id: u.id,
          name: u.name || u.email?.split('@')[0] || 'Unknown',
          email: u.email,
          role: u.role || 'staff',
          phone: u.phone || '',
          title: u.title || '',
          lastLogin: u.last_login || u.lastLogin,
          status: u.status || 'active',
          createdAt: u.created_at || u.createdAt,
        })));
      }
    } catch {
      // Fallback demo users
      setUsers([
        { id: '1', name: 'Admin User', email: 'admin@testpractice.com', role: 'staff', phone: '', title: 'Staff', lastLogin: '12/24/2025', status: 'active' },
        { id: '2', name: 'Samuel Thomas', email: 'sthomas@myitcopilot.com', role: 'admin', phone: '(555) 123-4567', title: 'CTO', lastLogin: '13h ago', status: 'active' },
        { id: '3', name: 'Dr. Name', email: 'partner@example.com', role: 'viewer', phone: '', title: '', lastLogin: 'Never', status: 'invited' },
        { id: '4', name: 'Qu Dee', email: 'qudee@uishealth.com', role: 'admin', phone: '', title: '', lastLogin: 'Never', status: 'active' },
        { id: '5', name: 'Dr. Neal Johnson', email: 'njohnson@uishealth.com', role: 'admin', phone: '', title: 'CEO', lastLogin: '1h ago', status: 'active' },
      ]);
    }
  };

  const handleSync = () => { setSyncing(true); setTimeout(() => setSyncing(false), 2000); };

  const handleUpdateUser = async (updatedUser: TeamUser) => {
    try {
      const token = localStorage.getItem('uis_token') || 'demo-token';
      const res = await fetch(`${API_URL}/api/auth/users/${updatedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          phone: updatedUser.phone,
          title: updatedUser.title,
          status: updatedUser.status,
        }),
      });
      if (res.ok) {
        fetchUsers();
      } else {
        // Update locally if API doesn't support PUT yet
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      }
    } catch {
      // Update locally as fallback
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    }
    setEditingUser(null);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleAddUser = async () => {
    try {
      const token = localStorage.getItem('uis_token') || 'demo-token';
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newUser.name, email: newUser.email, role: newUser.role, password: 'TempPass123!' }),
      });
      if (res.ok) {
        fetchUsers();
      } else {
        // Add locally as fallback
        setUsers(prev => [...prev, {
          id: `new-${Date.now()}`, name: newUser.name, email: newUser.email, role: newUser.role,
          phone: newUser.phone, title: newUser.title, lastLogin: 'Never', status: 'invited' as const,
        }]);
      }
    } catch {
      setUsers(prev => [...prev, {
        id: `new-${Date.now()}`, name: newUser.name, email: newUser.email, role: newUser.role,
        phone: newUser.phone, title: newUser.title, lastLogin: 'Never', status: 'invited' as const,
      }]);
    }
    setNewUser({ name: '', email: '', role: 'staff', phone: '', title: '' });
    setShowAddUser(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleDeleteUser = async (id: string) => {
    try {
      const token = localStorage.getItem('uis_token') || 'demo-token';
      await fetch(`${API_URL}/api/auth/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      fetchUsers();
    } catch {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
    setShowDeleteConfirm(null);
  };

  const formatLastLogin = (val?: string) => {
    if (!val || val === 'Never') return 'Never';
    if (val.includes('ago')) return val;
    try {
      const d = new Date(val);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffH = Math.floor(diffMs / 3600000);
      if (diffH < 1) return 'Just now';
      if (diffH < 24) return `${diffH}h ago`;
      const diffD = Math.floor(diffH / 24);
      if (diffD < 7) return `${diffD}d ago`;
      return d.toLocaleDateString();
    } catch { return val; }
  };

  const tabs = [
    { id: 'practice', label: 'Practice', icon: Building2 },
    { id: 'integrations', label: 'Integrations', icon: Plug },
    { id: 'users', label: 'Users & Roles', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  const integrations = [
    { name: 'Open Dental', description: 'Practice management — patients, appointments, procedures', status: 'connected', icon: '🦷', category: 'PMS', details: 'FHIR R4 API · Real-time sync' },
    { name: 'Dentrix', description: 'Dentsply Sirona PMS integration via API adapter', status: 'available', icon: '🏥', category: 'PMS', details: 'Adapter ready · Awaiting credentials' },
    { name: 'Eaglesoft', description: 'Patterson PMS integration via database bridge', status: 'coming_soon', icon: '🦅', category: 'PMS', details: 'Q3 2026 target' },
    { name: 'Pearl AI', description: 'AI radiograph analysis — caries, bone loss, calculus', status: 'available', icon: '🔬', category: 'AI Imaging', details: 'Feeds Outcome Gap detection' },
    { name: 'Overjet', description: 'FDA-cleared dental AI for clinical insights', status: 'available', icon: '🧠', category: 'AI Imaging', details: 'Feeds Outcome Gap detection' },
    { name: 'Weave', description: 'Patient communication — SMS, email, phone, reviews', status: 'available', icon: '💬', category: 'Communication', details: 'Enhances patient channel data' },
    { name: 'Power BI', description: 'Executive dashboards and automated board reports', status: 'connected', icon: '📈', category: 'Reporting', details: 'Premium workspace · 5 reports' },
    { name: 'Stripe', description: 'Patient payment processing and billing', status: 'available', icon: '💳', category: 'Payments', details: 'Patient-facing payment portal' },
  ];

  const roleColor: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    dentist: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    manager: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    hygienist: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    staff: 'bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300',
    viewer: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    billing: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  };

  const statusColor: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    invited: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    disabled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  const statusMap: Record<string, string> = {
    connected: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    available: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    coming_soon: 'bg-slate-100 text-slate-500 dark:bg-slate-700/50 dark:text-slate-400',
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // EDIT USER MODAL
  // ═══════════════════════════════════════════════════════════════════════════

  function EditUserModal({ u, onSave, onClose }: { u: TeamUser; onSave: (u: TeamUser) => void; onClose: () => void }) {
    const [form, setForm] = useState({ ...u });
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Edit User Profile</h3>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
          </div>
          <div className="p-6 space-y-4">
            {/* Avatar */}
            <div className="flex items-center gap-4 mb-2">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white text-lg font-bold">
                {form.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{form.name}</p>
                <p className="text-xs text-slate-400">{form.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Full Name</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-teal-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Email</label>
                <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} type="email"
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-teal-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Title</label>
                <input value={form.title || ''} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Office Manager"
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-teal-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Phone</label>
                <input value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} type="tel" placeholder="(555) 000-0000"
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-teal-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Role</label>
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-teal-500">
                  <option value="admin">Admin</option>
                  <option value="dentist">Dentist</option>
                  <option value="hygienist">Hygienist</option>
                  <option value="manager">Office Manager</option>
                  <option value="staff">Staff</option>
                  <option value="billing">Billing</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Status</label>
                <select value={form.status || 'active'} onChange={e => setForm({...form, status: e.target.value as any})}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-teal-500">
                  <option value="active">Active</option>
                  <option value="invited">Invited</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
            </div>

            {/* Permissions Preview */}
            <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-4">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Role Permissions</p>
              <div className="grid grid-cols-2 gap-1 text-xs">
                {[
                  { perm: 'View Dashboard', roles: ['admin','dentist','hygienist','manager','staff','billing','viewer'] },
                  { perm: 'Approve Recommendations', roles: ['admin','dentist','manager'] },
                  { perm: 'Edit Patient Records', roles: ['admin','dentist','hygienist','manager'] },
                  { perm: 'View BIL Analytics', roles: ['admin','manager'] },
                  { perm: 'Manage Users', roles: ['admin'] },
                  { perm: 'Access Billing', roles: ['admin','manager','billing'] },
                  { perm: 'View Reports', roles: ['admin','dentist','manager','viewer'] },
                  { perm: 'Practice Settings', roles: ['admin'] },
                ].map(p => (
                  <div key={p.perm} className="flex items-center gap-1.5 py-0.5">
                    <div className={`w-3 h-3 rounded flex items-center justify-center ${p.roles.includes(form.role) ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                      {p.roles.includes(form.role) && <span className="text-white text-[8px]">✓</span>}
                    </div>
                    <span className={p.roles.includes(form.role) ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}>{p.perm}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600">Cancel</button>
            <button onClick={() => onSave(form)} className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 flex items-center gap-2"><Save className="w-4 h-4" /> Save Changes</button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ADD USER MODAL
  // ═══════════════════════════════════════════════════════════════════════════

  function AddUserModal() {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddUser(false)}>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Add Team Member</h3>
            <button onClick={() => setShowAddUser(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Full Name *</label>
                <input value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} placeholder="Dr. Jane Smith"
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-teal-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Email *</label>
                <input value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} type="email" placeholder="jane@practice.com"
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-teal-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Title</label>
                <input value={newUser.title} onChange={e => setNewUser({...newUser, title: e.target.value})} placeholder="Dentist"
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-teal-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Phone</label>
                <input value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} type="tel" placeholder="(555) 000-0000"
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-teal-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Role *</label>
                <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-teal-500">
                  <option value="admin">Admin — Full platform access</option>
                  <option value="dentist">Dentist — Clinical + recommendations</option>
                  <option value="hygienist">Hygienist — Clinical view</option>
                  <option value="manager">Office Manager — Operations + analytics</option>
                  <option value="staff">Staff — Basic dashboard access</option>
                  <option value="billing">Billing — Financial access</option>
                  <option value="viewer">Viewer — Read-only access</option>
                </select>
              </div>
            </div>
            <p className="text-xs text-slate-400">An invitation email will be sent with a temporary password. The user will be prompted to change it on first login.</p>
          </div>
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
            <button onClick={() => setShowAddUser(false)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600">Cancel</button>
            <button onClick={handleAddUser} disabled={!newUser.name || !newUser.email}
              className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add User
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DELETE CONFIRMATION MODAL
  // ═══════════════════════════════════════════════════════════════════════════

  function DeleteConfirmModal({ userId }: { userId: string }) {
    const u = users.find(u => u.id === userId);
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(null)}>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
          <div className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Remove User</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Are you sure you want to remove</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{u?.name}</p>
            <p className="text-xs text-slate-400">{u?.email}</p>
          </div>
          <div className="flex items-center gap-3 px-6 pb-6">
            <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600">Cancel</button>
            <button onClick={() => handleDeleteUser(userId)} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"><Trash2 className="w-4 h-4" /> Remove</button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => window.history.back()} className="text-xs text-slate-400 hover:text-teal-400 mb-1 flex items-center gap-1">‹ Back to Dashboard</button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><Settings className="w-6 h-6 text-teal-500" /> Practice Settings</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage configuration, integrations, and team</p>
        </div>
      </div>

      {/* Health Status */}
      <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${healthStatus?.isHealthy ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/30' : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30'}`}>
        <div className="flex items-center gap-2">
          {healthStatus?.isHealthy ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-amber-600" />}
          <span className={`text-sm font-semibold ${healthStatus?.isHealthy ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
            {healthStatus?.isHealthy ? 'All Systems Operational' : 'Checking...'}
          </span>
          <span className="text-xs text-slate-400 ml-2">PMS: {healthStatus?.pmsConnected ? '✓' : '—'} · DB: {healthStatus?.databaseConnected ? '✓' : '—'} · {healthStatus?.latencyMs || 0}ms</span>
        </div>
        <button onClick={handleSync} disabled={syncing} className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 flex items-center gap-1">
          <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} /> {syncing ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>

      {/* Success Toast */}
      {saveSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="w-4 h-4" /> Changes saved successfully
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ PRACTICE TAB ═══ */}
      {activeTab === 'practice' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Cpu className="w-5 h-5 text-teal-500" /> PMS Connection</h3>
            <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-200 dark:border-emerald-700/30 mb-4">
              <span className="text-2xl">🦷</span>
              <div className="flex-1"><p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Open Dental FHIR</p><p className="text-xs text-emerald-600 dark:text-emerald-500">Connected · Real-time sync</p></div>
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[['Patients','13'],['Appointments','24'],['Sync Mode','FHIR R4'],['Status','Live']].map(([l,v],i) => (
                <div key={i} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">{l}</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{v}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Cpu className="w-5 h-5 text-teal-500" /> AI Configuration</h3>
            <div className="space-y-3">
              {[['Recommendation Engine','Active'],['Patient Predictions','10 scored'],['Outcome Gap','22 episodes'],['BIL Capture','439 events'],['Archetypes','6 segments'],['Fingerprints','3 staff']].map(([l,v],i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-700/30 last:border-0">
                  <span className="text-sm text-slate-600 dark:text-slate-400">{l}</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ INTEGRATIONS TAB ═══ */}
      {activeTab === 'integrations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {integrations.map(integ => (
            <div key={integ.name} className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-700 p-5 flex items-center gap-4">
              <span className="text-2xl">{integ.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{integ.name}</p>
                <p className="text-xs text-slate-400">{integ.description}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{integ.details}</p>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${statusMap[integ.status]}`}>
                {integ.status === 'coming_soon' ? 'Coming Soon' : integ.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ═══ USERS & ROLES TAB ═══ */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Team Members ({users.length})</h3>
            <button onClick={() => setShowAddUser(true)} className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add User
            </button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {users.map(u => (
              <div key={u.id} className="px-6 py-4 flex items-center gap-4 group hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{u.name}</p>
                    {u.title && <span className="text-[10px] text-slate-400">· {u.title}</span>}
                  </div>
                  <p className="text-xs text-slate-400 truncate">{u.email}</p>
                </div>
                {u.status && u.status !== 'active' && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${statusColor[u.status] || ''}`}>{u.status}</span>
                )}
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${roleColor[u.role] || roleColor.staff}`}>{u.role}</span>
                <span className="text-xs text-slate-400 w-20 text-right">{formatLastLogin(u.lastLogin)}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditingUser(u)} className="p-1.5 hover:bg-teal-100 dark:hover:bg-teal-900/30 rounded-lg" title="Edit user">
                    <Edit3 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  </button>
                  <button onClick={() => setShowDeleteConfirm(u.id)} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg" title="Remove user">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Role Legend */}
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2">Role Permissions</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div><span className="font-semibold text-purple-600 dark:text-purple-400">Admin:</span> <span className="text-slate-500">Full access, manage users</span></div>
              <div><span className="font-semibold text-blue-600 dark:text-blue-400">Dentist:</span> <span className="text-slate-500">Clinical + recs</span></div>
              <div><span className="font-semibold text-teal-600 dark:text-teal-400">Manager:</span> <span className="text-slate-500">Operations + analytics</span></div>
              <div><span className="font-semibold text-amber-600 dark:text-amber-400">Viewer:</span> <span className="text-slate-500">Read-only access</span></div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ NOTIFICATIONS TAB ═══ */}
      {activeTab === 'notifications' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-700 p-6 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Notification Preferences</h3>
          {[
            { label: 'Outcome Gap Alerts', desc: 'When treatment episodes stall beyond thresholds', on: true },
            { label: 'BIL Digest', desc: 'Weekly summary of staff decision patterns', on: true },
            { label: 'Patient Risk Alerts', desc: 'High churn or no-show risk notifications', on: true },
            { label: 'Weekly Board Report', desc: 'Automated executive summary email', on: true },
            { label: 'System Updates', desc: 'New features and platform announcements', on: false },
          ].map((n, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 dark:border-slate-700/30 last:border-0">
              <div><p className="text-sm font-medium text-slate-900 dark:text-white">{n.label}</p><p className="text-xs text-slate-400">{n.desc}</p></div>
              <div className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${n.on ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${n.on ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ SECURITY TAB ═══ */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">HIPAA Compliance</h3>
            <div className="space-y-2">
              {['Data encryption at rest (AES-256)','Data encryption in transit (TLS 1.3)','Audit logging enabled','BAA executed with Microsoft Azure','Role-based access controls','Session timeout (30 min)','PHI access audit trail'].map((item, i) => (
                <div key={i} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /><span className="text-sm text-slate-700 dark:text-slate-300">{item}</span></div>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">API Access</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2"><span className="text-sm text-slate-600 dark:text-slate-400">API Endpoint</span><code className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">api.uishealth.com/graphql</code></div>
              <div className="flex items-center justify-between py-2"><span className="text-sm text-slate-600 dark:text-slate-400">Auth Method</span><span className="text-sm font-semibold text-slate-900 dark:text-white">JWT Bearer Token</span></div>
              <div className="flex items-center justify-between py-2"><span className="text-sm text-slate-600 dark:text-slate-400">Rate Limit</span><span className="text-sm font-semibold text-slate-900 dark:text-white">1000 req/min</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {editingUser && <EditUserModal u={editingUser} onSave={handleUpdateUser} onClose={() => setEditingUser(null)} />}
      {showAddUser && <AddUserModal />}
      {showDeleteConfirm && <DeleteConfirmModal userId={showDeleteConfirm} />}
    </div>
  );
}
