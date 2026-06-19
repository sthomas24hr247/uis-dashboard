import { useEffect, useState } from 'react';
import { Search, RefreshCw, User, Stethoscope, TrendingUp } from 'lucide-react';
import { apiGet, getPracticeId } from '../lib/api';

interface QciProvider {
  provider_id: string;
  name: string;
  provider_type: string | null;
  total_production: number | null;
  total_patients: number;
  composite_score: number | null;
  grade: string;
}

export default function ProvidersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [providers, setProviders] = useState<QciProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const pid = getPracticeId();
      const data = await apiGet<{ providers: QciProvider[] }>(
        '/api/qci/providers?practice_id=' + pid
      );
      const list = (data.providers || [])
        .sort((a, b) => (b.composite_score ?? -1) - (a.composite_score ?? -1));
      setProviders(list);
    } catch (e: any) {
      setError(e?.message || 'Failed to load providers');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = providers.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.provider_type || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Providers</h1>
          <p className="text-slate-500">
            {providers.length} providers
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search providers..."
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading && (
        <div className="text-slate-500 py-12 text-center">Loading providers...</div>
      )}
      {error && !loading && (
        <div className="text-red-600 py-12 text-center">{error}</div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <div className="text-slate-500 py-12 text-center">
          No providers found.
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div
              key={p.provider_id}
              className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">
                      {p.name || 'Unnamed Provider'}
                    </p>
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <Stethoscope className="w-3.5 h-3.5" />
                      {p.provider_type || 'Provider'}
                    </p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  {p.grade === 'Calibrating' ? 'Calibrating' : p.grade}
                </span>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Quality Score (trailing 24 mo)
                </p>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  {p.composite_score == null ? <span className="text-amber-600">Calibrating</span> : p.composite_score.toFixed(1)}<span className="text-sm font-normal text-slate-400"> · {p.total_patients} patients</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
