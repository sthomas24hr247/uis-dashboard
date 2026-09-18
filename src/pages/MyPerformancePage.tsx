import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, TrendingUp, Users, Activity, DollarSign } from 'lucide-react';

const API = import.meta.env.VITE_API_URL?.replace('/graphql', '') || 'https://api.uishealth.com';

interface MyPerf {
  linked: boolean;
  message?: string;
  provider?: { name: string; type: string | null };
  production_ytd?: number;
  procedures_ytd?: number;
  patients_seen?: number;
  period?: string;
}

function fmt(n?: number) {
  if (n === undefined || n === null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export default function MyPerformancePage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [data, setData] = useState<MyPerf | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/predictions/my-performance`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  const hasProduction = data?.production_ytd !== undefined;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <button onClick={() => navigate('/home')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Activity className="w-6 h-6 text-teal-500" /> Your Performance
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {data?.provider?.name ? `${data.provider.name}${data.provider.type ? ' \u00b7 ' + data.provider.type.charAt(0) + data.provider.type.slice(1).toLowerCase() : ''}` : 'Your own numbers'}
          {data?.period ? ` \u00b7 ${data.period}` : ''}
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading your performance…</div>
      ) : !data?.linked ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-100 dark:border-slate-700 text-center">
          <p className="text-slate-500 dark:text-slate-400">
            {data?.message || 'This account is not yet linked to a provider record. Once linked, your own production and patient numbers appear here.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {hasProduction && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-2 mb-2"><DollarSign className="w-4 h-4 text-teal-500" /><span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Production</span></div>
                <div className="text-3xl font-bold text-teal-600 dark:text-teal-400">{fmt(data.production_ytd)}</div>
                <div className="text-xs text-slate-400 mt-1">{data.period}</div>
              </div>
            )}
            {hasProduction && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-blue-500" /><span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Procedures</span></div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{fmt(data.procedures_ytd)}</div>
                <div className="text-xs text-slate-400 mt-1">Procedure charges</div>
              </div>
            )}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-violet-500" /><span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Patients Seen</span></div>
              <div className="text-3xl font-bold text-violet-600 dark:text-violet-400">{data.patients_seen ?? '—'}</div>
              <div className="text-xs text-slate-400 mt-1">Unique patients</div>
            </div>
          </div>
          <p className="text-xs text-slate-400">These are your own numbers, scoped to your provider record{!hasProduction ? '. Production figures are shown to roles with financial visibility.' : '.'}</p>
        </>
      )}
    </div>
  );
}
