import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, TrendingDown, DollarSign, X, ChevronRight } from 'lucide-react';

const API = import.meta.env.VITE_API_URL?.replace('/graphql', '') ?? '';

interface MonthRow {
  period_month: string;
  month_label: string;
  gross_production: number;
  adjustments: number;
  net_production: number;
  collections: number;
  collection_rate_pct: number;
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export default function FinancialPage() {
  const { token } = useAuth();
  const [months, setMonths] = useState<MonthRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MonthRow | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/dashboard/financials/monthly`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { setMonths(d.months ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  const maxNet = Math.max(...months.map(m => m.gross_production), 1);

  // Trailing 12-month totals
  const totals = months.reduce(
    (acc, m) => ({
      gross: acc.gross + m.gross_production,
      adj: acc.adj + m.adjustments,
      net: acc.net + m.net_production,
      col: acc.col + m.collections,
    }),
    { gross: 0, adj: 0, net: 0, col: 0 }
  );
  const t12rate = totals.net > 0 ? (totals.col / totals.net) * 100 : 0;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Financial Performance</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Trailing 12 months — click any month for detail
        </p>
      </div>

      {/* T12 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Gross Production', value: fmt(totals.gross), color: 'text-blue-600 dark:text-blue-400', icon: DollarSign },
          { label: 'Adjustments', value: fmt(totals.adj), color: 'text-amber-600 dark:text-amber-400', icon: TrendingDown },
          { label: 'Net Production', value: fmt(totals.net), color: 'text-teal-600 dark:text-teal-400', icon: TrendingUp },
          { label: 'Collections', value: fmt(totals.col), color: 'text-emerald-600 dark:text-emerald-400', icon: DollarSign },
        ].map((card) => (
          <div key={card.label} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <card.icon className={`w-4 h-4 ${card.color}`} />
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{card.label}</span>
            </div>
            <div className={`text-2xl font-bold ${card.color}`}>{loading ? '—' : card.value}</div>
            <div className="text-xs text-slate-400 mt-1">Trailing 12 months</div>
          </div>
        ))}
      </div>

      {/* Collection Rate Banner */}
      {!loading && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
              Trailing 12-Month Collection Rate
            </div>
            <div className={`text-3xl font-bold ${t12rate >= 80 ? 'text-emerald-600 dark:text-emerald-400' : t12rate >= 65 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
              {t12rate.toFixed(1)}%
            </div>
            <div className="text-xs text-slate-400 mt-1">Collections ÷ Net Production</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Industry benchmark</div>
            <div className="text-lg font-semibold text-slate-600 dark:text-slate-300">98%</div>
            <div className={`text-xs mt-1 font-medium ${t12rate >= 80 ? 'text-emerald-500' : 'text-amber-500'}`}>
              {t12rate >= 98 ? 'At benchmark' : `${(98 - t12rate).toFixed(1)}pp below benchmark`}
            </div>
          </div>
        </div>
      )}

      {/* Monthly Bar Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
        <h2 className="text-base font-semibold text-slate-800 dark:text-white mb-6">Monthly Breakdown</h2>
        {loading ? (
          <div className="h-48 flex items-center justify-center text-slate-400">Loading...</div>
        ) : months.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-slate-400">No financial data available</div>
        ) : (
          <div className="space-y-3">
            {months.map((m) => {
              const grossPct = Math.max((m.gross_production / maxNet) * 100, 2);
              const netPct = Math.max((m.net_production / maxNet) * 100, 1);
              const colPct = Math.max((m.collections / maxNet) * 100, 1);
              const isSelected = selected?.period_month === m.period_month;
              return (
                <button
                  key={m.period_month}
                  onClick={() => setSelected(isSelected ? null : m)}
                  className={`w-full text-left rounded-xl p-3 transition-all border ${
                    isSelected
                      ? 'border-teal-400 bg-teal-50 dark:bg-teal-900/20'
                      : 'border-transparent hover:border-slate-200 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-20 text-xs font-medium text-slate-600 dark:text-slate-300 shrink-0">
                      {m.month_label}
                    </div>
                    <div className="flex-1 space-y-1">
                      {/* Gross bar */}
                      <div className="flex items-center gap-2">
                        <div className="w-12 text-[10px] text-slate-400 text-right">Gross</div>
                        <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                          <div className="h-2 rounded-full bg-blue-300 dark:bg-blue-600" style={{ width: `${grossPct}%` }} />
                        </div>
                        <div className="w-20 text-[11px] text-slate-500 dark:text-slate-400">{fmt(m.gross_production)}</div>
                      </div>
                      {/* Net bar */}
                      <div className="flex items-center gap-2">
                        <div className="w-12 text-[10px] text-slate-400 text-right">Net</div>
                        <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                          <div className="h-2 rounded-full bg-teal-400 dark:bg-teal-500" style={{ width: `${netPct}%` }} />
                        </div>
                        <div className="w-20 text-[11px] text-slate-500 dark:text-slate-400">{fmt(m.net_production)}</div>
                      </div>
                      {/* Collections bar */}
                      <div className="flex items-center gap-2">
                        <div className="w-12 text-[10px] text-slate-400 text-right">Collected</div>
                        <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                          <div className="h-2 rounded-full bg-emerald-400 dark:bg-emerald-500" style={{ width: `${colPct}%` }} />
                        </div>
                        <div className="w-20 text-[11px] text-slate-500 dark:text-slate-400">{fmt(m.collections)}</div>
                      </div>
                    </div>
                    <div className={`w-14 text-right text-sm font-semibold shrink-0 ${
                      m.collection_rate_pct >= 90 ? 'text-emerald-600 dark:text-emerald-400'
                      : m.collection_rate_pct >= 70 ? 'text-amber-600 dark:text-amber-400'
                      : 'text-red-600 dark:text-red-400'
                    }`}>
                      {m.collection_rate_pct.toFixed(0)}%
                    </div>
                    <ChevronRight className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                  </div>

                  {/* Drill-down panel inline */}
                  {isSelected && (
                    <div className="mt-4 pt-4 border-t border-teal-200 dark:border-teal-700 grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: 'Gross Production', value: fmt(m.gross_production), color: 'text-blue-600 dark:text-blue-400' },
                        { label: 'Adjustments', value: fmt(m.adjustments), color: 'text-amber-600 dark:text-amber-400' },
                        { label: 'Net Production', value: fmt(m.net_production), color: 'text-teal-600 dark:text-teal-400' },
                        { label: 'Collections', value: fmt(m.collections), color: 'text-emerald-600 dark:text-emerald-400' },
                      ].map(card => (
                        <div key={card.label} className="rounded-xl p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                          <div className="text-[10px] uppercase tracking-wide text-slate-400 mb-1">{card.label}</div>
                          <div className={`text-lg font-bold ${card.color}`}>{card.value}</div>
                        </div>
                      ))}
                      <div className="col-span-2 md:col-span-4 rounded-xl p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                        <span className="text-xs text-slate-500">Collection Rate this month</span>
                        <span className={`text-xl font-bold ${
                          m.collection_rate_pct >= 90 ? 'text-emerald-600 dark:text-emerald-400'
                          : m.collection_rate_pct >= 70 ? 'text-amber-600 dark:text-amber-400'
                          : 'text-red-600 dark:text-red-400'
                        }`}>{m.collection_rate_pct.toFixed(1)}%</span>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-6 mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
          {[
            { color: 'bg-blue-300 dark:bg-blue-600', label: 'Gross Production' },
            { color: 'bg-teal-400 dark:bg-teal-500', label: 'Net Production' },
            { color: 'bg-emerald-400 dark:bg-emerald-500', label: 'Collections' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-full ${l.color}`} />
              <span className="text-xs text-slate-500 dark:text-slate-400">{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
