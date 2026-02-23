import { useState, useEffect } from 'react';
import {
  Users, AlertTriangle, TrendingUp, ShieldAlert, Heart, Mail, Phone,
  MessageSquare, RefreshCw, Loader2, Target, DollarSign, ChevronRight,
  Sparkles, Brain,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL?.replace('/graphql', '') || 'https://api.uishealth.com';
const PRACTICE_ID = '00000000-0000-0000-0000-000000000001';

interface Prediction {
  id: string;
  patient_id: string;
  first_name: string;
  last_name: string;
  cancel_risk_score: number;
  cancel_risk_tier: string;
  acceptance_score: number;
  acceptance_tier: string;
  oop_willingness_score: number;
  oop_willingness_tier: string;
  oop_threshold_estimate: number;
  attrition_risk_score: number;
  attrition_risk_tier: string;
  days_since_last_visit: number;
  marketing_receptivity: number;
  preferred_channel: string;
}

interface Archetype {
  id: string;
  archetype_key: string;
  name: string;
  description: string;
  population_percentage: number;
  avg_lifetime_value: number;
  assigned_patients: number;
  behavioral_markers: string;
}

interface PredSummary {
  total_patients: number;
  high_cancel_risk: number;
  high_attrition_risk: number;
  low_acceptance: number;
  high_oop_willing: number;
  avg_cancel_risk: number;
  avg_acceptance_score: number;
  prefer_email: number;
  prefer_sms: number;
  prefer_phone: number;
}

const tierColors: Record<string, string> = {
  critical: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  high: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  moderate: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  low: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  likely: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  possible: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  unlikely: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
};

const archetypeEmojis: Record<string, string> = {
  loyal_maintainer: '🛡️',
  emergency_only: '🚨',
  price_shopper: '💰',
  all_in_investor: '💎',
  anxious_avoider: '😰',
  insurance_maximizer: '📋',
};

export default function PatientIntelPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [archetypes, setArchetypes] = useState<Archetype[]>([]);
  const [summary, setSummary] = useState<PredSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'predictions' | 'archetypes'>('predictions');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [predRes, archRes, sumRes] = await Promise.all([
        fetch(`${API_URL}/api/predictions/patients?practice_id=${PRACTICE_ID}`).then(r => r.json()),
        fetch(`${API_URL}/api/predictions/archetypes`).then(r => r.json()),
        fetch(`${API_URL}/api/predictions/summary?practice_id=${PRACTICE_ID}`).then(r => r.json()),
      ]);
      setPredictions(predRes.predictions || []);
      setArchetypes(archRes.archetypes || []);
      setSummary(sumRes);
    } catch (err) {
      console.error('[PatientIntel] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-500 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">Loading patient intelligence...</p>
        </div>
      </div>
    );
  }

  const channelIcon = (ch: string) => {
    if (ch === 'email') return <Mail className="w-3.5 h-3.5" />;
    if (ch === 'sms') return <MessageSquare className="w-3.5 h-3.5" />;
    if (ch === 'phone') return <Phone className="w-3.5 h-3.5" />;
    return <Mail className="w-3.5 h-3.5" />;
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Patient Intelligence</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5">AI-powered patient predictions and behavioral archetypes</p>
          </div>
        </div>
        <button onClick={fetchData} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
          <RefreshCw className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        </button>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
            <p className="text-[10px] font-semibold tracking-widest text-slate-400 mb-1">PATIENTS SCORED</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{summary.total_patients}</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
            <p className="text-[10px] font-semibold tracking-widest text-slate-400 mb-1">HIGH CANCEL RISK</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{summary.high_cancel_risk}</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
            <p className="text-[10px] font-semibold tracking-widest text-slate-400 mb-1">LOW ACCEPTANCE</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{summary.low_acceptance}</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
            <p className="text-[10px] font-semibold tracking-widest text-slate-400 mb-1">HIGH OOP WILLING</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{summary.high_oop_willing}</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
            <p className="text-[10px] font-semibold tracking-widest text-slate-400 mb-1">PREFER EMAIL</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.prefer_email}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2">
        <button onClick={() => setTab('predictions')}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
            tab === 'predictions' ? 'bg-teal-500 text-white' : 'bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400'
          }`}>Patient Predictions ({predictions.length})</button>
        <button onClick={() => setTab('archetypes')}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
            tab === 'archetypes' ? 'bg-teal-500 text-white' : 'bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400'
          }`}>Behavioral Archetypes ({archetypes.length})</button>
      </div>

      {/* Predictions Tab */}
      {tab === 'predictions' && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700">
                <th className="text-left text-[10px] font-bold tracking-widest text-slate-400 pb-3 pr-4">PATIENT</th>
                <th className="text-center text-[10px] font-bold tracking-widest text-slate-400 pb-3 px-2">CANCEL RISK</th>
                <th className="text-center text-[10px] font-bold tracking-widest text-slate-400 pb-3 px-2">ACCEPTANCE</th>
                <th className="text-center text-[10px] font-bold tracking-widest text-slate-400 pb-3 px-2">OOP WILLING</th>
                <th className="text-center text-[10px] font-bold tracking-widest text-slate-400 pb-3 px-2">ATTRITION</th>
                <th className="text-right text-[10px] font-bold tracking-widest text-slate-400 pb-3 px-2">OOP MAX</th>
                <th className="text-center text-[10px] font-bold tracking-widest text-slate-400 pb-3 px-2">DAYS SINCE</th>
                <th className="text-center text-[10px] font-bold tracking-widest text-slate-400 pb-3">CHANNEL</th>
              </tr>
            </thead>
            <tbody>
              {predictions.map((p) => (
                <tr key={p.id} className="border-b border-slate-50 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="py-3.5 pr-4">
                    <p className="font-semibold text-sm text-slate-900 dark:text-white">
                      {p.first_name && p.last_name ? `${p.first_name} ${p.last_name}` : `Patient ${p.patient_id?.slice(0, 8)}`}
                    </p>
                  </td>
                  <td className="py-3.5 px-2 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${tierColors[p.cancel_risk_tier] || ''}`}>
                      {p.cancel_risk_tier?.toUpperCase()} ({(p.cancel_risk_score * 100).toFixed(0)}%)
                    </span>
                  </td>
                  <td className="py-3.5 px-2 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${tierColors[p.acceptance_tier] || ''}`}>
                      {p.acceptance_tier?.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3.5 px-2 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${tierColors[p.oop_willingness_tier] || ''}`}>
                      {p.oop_willingness_tier?.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3.5 px-2 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${tierColors[p.attrition_risk_tier] || ''}`}>
                      {p.attrition_risk_tier?.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3.5 px-2 text-right">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      ${p.oop_threshold_estimate?.toLocaleString() || '—'}
                    </span>
                  </td>
                  <td className="py-3.5 px-2 text-center">
                    <span className={`text-sm font-medium ${(p.days_since_last_visit || 0) > 90 ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}`}>
                      {p.days_since_last_visit || '—'}d
                    </span>
                  </td>
                  <td className="py-3.5 text-center">
                    <div className="flex items-center justify-center gap-1 text-slate-400">
                      {channelIcon(p.preferred_channel)}
                      <span className="text-[10px] capitalize">{p.preferred_channel}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Archetypes Tab */}
      {tab === 'archetypes' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {archetypes.map((a) => {
            const markers = (() => { try { return JSON.parse(a.behavioral_markers || '{}'); } catch { return {}; } })();
            return (
              <div key={a.id} className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{archetypeEmojis[a.archetype_key] || '👤'}</span>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{a.name}</h3>
                    <p className="text-[10px] text-slate-400">{a.population_percentage}% of patients</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{a.description}</p>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[10px] text-slate-400">Avg Lifetime Value</p>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">${a.avg_lifetime_value?.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">Assigned</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{a.assigned_patients}</p>
                  </div>
                </div>
                {/* Behavioral markers */}
                <div className="flex flex-wrap gap-1">
                  {Object.entries(markers).map(([key, val]) => (
                    <span key={key} className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400">
                      {key.replace(/_/g, ' ')}: {String(val)}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="text-center pb-4">
        <p className="text-xs text-slate-400 dark:text-slate-500">Dentamind AI — Patient Prediction Models · Live Data</p>
      </div>
    </div>
  );
}
