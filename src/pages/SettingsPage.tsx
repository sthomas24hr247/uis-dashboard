import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Settings, Database, Shield, Users, Bell, Plug, CheckCircle2,
  AlertTriangle, RefreshCw, Globe, Lock, Cpu,
  Building2, Trash2, Plus, X,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL?.replace('/graphql', '') || 'https://api.uishealth.com';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('practice');
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [liveUsers, setLiveUsers] = useState<any[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', firstName: '', lastName: '', password: '', role: 'viewer', displayName: '' });
  const [addingUser, setAddingUser] = useState(false);

  const token = localStorage.getItem('uis_token');

  const fetchUsers = () => {
    if (!token) return;
    fetch(API_URL + '/api/auth/users', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.json()).then(d => setLiveUsers(d.users || [])).catch(() => {});
  };

  useEffect(() => {
    fetch(API_URL + '/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer demo-token' },
      body: JSON.stringify({ query: '{ health { isHealthy latencyMs pmsConnected databaseConnected } }' }),
    }).then(r => r.json()).then(d => setHealthStatus(d.data?.health)).catch(() => {});
    fetchUsers();
  }, []);

  const handleSync = () => { setSyncing(true); setTimeout(() => setSyncing(false), 2000); };

  const handleAddUser = async () => {
    setAddingUser(true);
    try {
      const res = await fetch(API_URL + '/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newUser, displayName: newUser.displayName || (newUser.firstName + ' ' + newUser.lastName) }),
      });
      if (res.ok) { setShowAddUser(false); setNewUser({ email: '', firstName: '', lastName: '', password: '', role: 'viewer', displayName: '' }); fetchUsers(); }
    } catch (e) { console.error(e); }
    setAddingUser(false);
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm('Remove ' + name + ' from this practice?')) return;
    await fetch(API_URL + '/api/auth/users/' + id, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } });
    fetchUsers();
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
    hygienist: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    viewer: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  };

  const formatLogin = (d: string | null) => {
    if (!d) return 'Never';
    const diff = Date.now() - new Date(d).getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
    return new Date(d).toLocaleDateString();
  };

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <Settings className="w-7 h-7 text-uis-600" />Practice Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage configuration, integrations, and team</p>
      </div>

      <div className={`rounded-xl border p-4 flex items-center justify-between ${healthStatus?.isHealthy ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-700/30' : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-700/30'}`}>
        <div className="flex items-center gap-3">
          {healthStatus?.isHealthy ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-amber-600" />}
          <div>
            <p className={`text-sm font-semibold ${healthStatus?.isHealthy ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
              {healthStatus?.isHealthy ? 'All Systems Operational' : 'Checking systems...'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">PMS: {healthStatus?.pmsConnected ? '✓' : '○'} · DB: {healthStatus?.databaseConnected ? '✓' : '○'} · {healthStatus?.latencyMs || '—'}ms</p>
          </div>
        </div>
        <button onClick={handleSync} disabled={syncing} className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />{syncing ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>

      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl p-1 overflow-x-auto">
        {tabs.map(tab => { const I = tab.icon; return (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}>
            <I className="w-4 h-4" />{tab.label}
          </button>
        ); })}
      </div>

      {activeTab === 'practice' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Building2 className="w-5 h-5 text-uis-600" />Practice Information</h3>
            <div className="space-y-3">
              {[['Practice Name','Demo Dental Practice'],['NPI','1234567890'],['Address','125 Satin Heights, San Jose, CA 95698'],['Phone','(536) 624-5871'],['Email','admin@demodentalpractice.com'],['Timezone','America/Los_Angeles (PST)']].map(([l,v],i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                  <span className="text-sm text-slate-500 dark:text-slate-400">{l}</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Database className="w-5 h-5 text-uis-600" />PMS Connection</h3>
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
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Cpu className="w-5 h-5 text-uis-600" />AI Configuration</h3>
              <div className="space-y-3">
                {[['Recommendation Engine','Active'],['Patient Predictions','10 scored'],['Outcome Gap','22 episodes'],['BIL Capture','3 events'],['Archetypes','6 types']].map(([l,v],i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-sm text-slate-600 dark:text-slate-300">{l}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'integrations' && (
        <div className="space-y-6">
          {['PMS','AI Imaging','Communication','Reporting','Payments'].map(cat => {
            const items = integrations.filter(i => i.category === cat);
            if (!items.length) return null;
            return (<div key={cat}>
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">{cat}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((int, i) => (
                  <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{int.icon}</span>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">{int.name}</p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase ${int.status === 'connected' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : int.status === 'available' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                          {int.status.replace('_',' ')}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{int.description}</p>
                    <p className="text-[10px] text-slate-400">{int.details}</p>
                    {int.status === 'available' && <button className="mt-3 w-full text-xs font-medium text-uis-600 dark:text-uis-400 bg-uis-50 dark:bg-uis-900/20 rounded-lg py-2 hover:bg-uis-100 transition-colors">Connect →</button>}
                  </div>
                ))}
              </div>
            </div>);
          })}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Team Members ({liveUsers.length})</h3>
            <button onClick={() => setShowAddUser(!showAddUser)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-uis-600 rounded-lg hover:bg-uis-700 transition-colors">
              {showAddUser ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showAddUser ? 'Cancel' : 'Add User'}
            </button>
          </div>
          {showAddUser && (
            <div className="mb-6 p-4 bg-uis-50 dark:bg-uis-900/20 rounded-xl border border-uis-200 dark:border-uis-700/30">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input value={newUser.firstName} onChange={e => setNewUser({...newUser, firstName: e.target.value})} placeholder="First Name" className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
                <input value={newUser.lastName} onChange={e => setNewUser({...newUser, lastName: e.target.value})} placeholder="Last Name" className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
                <input value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} placeholder="Email" type="email" className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
                <input value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} placeholder="Password" type="password" className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
                <input value={newUser.displayName} onChange={e => setNewUser({...newUser, displayName: e.target.value})} placeholder="Display Name (optional)" className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
                <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                  <option value="admin">Administrator</option>
                  <option value="dentist">Dentist</option>
                  <option value="manager">Office Manager</option>
                  <option value="hygienist">Hygienist</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <button onClick={handleAddUser} disabled={addingUser || !newUser.email || !newUser.password || !newUser.firstName}
                className="px-4 py-2 text-sm font-medium text-white bg-uis-600 rounded-lg hover:bg-uis-700 disabled:opacity-50 transition-colors">
                {addingUser ? 'Creating...' : 'Create User'}
              </button>
            </div>
          )}
          <div className="space-y-3">
            {liveUsers.map((u: any) => (
              <div key={u.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-uis-500 to-uis-700 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                    {u.displayName ? u.displayName.split(' ').map((n: string) => n[0]).join('') : '?'}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white text-sm">{u.displayName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${roleColor[u.role] || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}>{u.role}</span>
                  <span className="text-xs text-slate-400">{formatLogin(u.lastLogin)}</span>
                  <button onClick={() => handleDeleteUser(u.id, u.displayName)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {liveUsers.length === 0 && <p className="text-sm text-slate-400 text-center py-4">Loading users...</p>}
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Notification Preferences</h3>
          <div className="space-y-4">
            {[
              { label: 'New AI Recommendations', desc: 'Notified when Dentamind generates recommendations', on: true },
              { label: 'Outcome Gap Alerts', desc: 'Alert when treatment episodes stall or leak', on: true },
              { label: 'No-Show Risk Warnings', desc: 'Warning for upcoming high cancel-risk patients', on: true },
              { label: 'Weekly Board Report', desc: 'Automated executive dashboard emailed Mondays', on: true },
              { label: 'BIL Insights', desc: 'Weekly staff decision pattern summary', on: false },
              { label: 'Integration Alerts', desc: 'Notify when PMS sync fails or latency spikes', on: true },
            ].map((p, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                <div><p className="text-sm font-medium text-slate-900 dark:text-white">{p.label}</p><p className="text-xs text-slate-500 dark:text-slate-400">{p.desc}</p></div>
                <div className={`w-11 h-6 rounded-full cursor-pointer transition-colors ${p.on ? 'bg-uis-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform mt-0.5 ${p.on ? 'ml-[22px]' : 'ml-[2px]'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Lock className="w-5 h-5 text-uis-600" />HIPAA Compliance</h3>
            <div className="space-y-3">
              {[['Data Encryption','AES-256 at rest, TLS 1.3 in transit'],['Access Control','Role-based (RBAC)'],['Audit Logging','All access events logged'],['BAA Status','Signed with Azure'],['Data Retention','7 years (configurable)'],['Backups','Daily automated + geo-redundant']].map(([l,v],i) => (
                <div key={i} className="flex items-start gap-3 py-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div><p className="text-sm font-medium text-slate-900 dark:text-white">{l}</p><p className="text-xs text-slate-500 dark:text-slate-400">{v}</p></div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Globe className="w-5 h-5 text-uis-600" />Infrastructure</h3>
            <div className="space-y-3">
              {[['Cloud','Microsoft Azure'],['Region','West US'],['API','api.uishealth.com'],['Dashboard','app.uishealth.com'],['Database','Azure SQL Database'],['Runtime','Azure Container Apps'],['Frontend','Azure Static Web Apps'],['Reporting','Power BI Premium']].map(([l,v],i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                  <span className="text-sm text-slate-500 dark:text-slate-400">{l}</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
