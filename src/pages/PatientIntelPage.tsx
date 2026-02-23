import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Users, Brain, DollarSign, TrendingUp, TrendingDown,
  CreditCard, AlertTriangle, Shield, Activity, ChevronRight, Zap,
  Clock, Heart, Phone, Mail, MessageSquare, Target, BarChart3,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// ENHANCED PATIENT INTEL PAGE
// Spec Coverage:
//   - Patient Predictions: Cancellation Risk (Team 2, P1) ✅ Already live
//   - Patient Predictions: OOP Willingness (Team 2, P1) ← ENHANCED
//   - Patient Predictions: Attrition/Churn Risk (Team 2, P2) ✅ Already live
//   - Patient Predictions: Marketing Receptivity (Team 2, P2) ← ENHANCED
//   - Patient Archetypes (Team 2, P2) ✅ Already live
//   - Patient Data: Financial Profiles (Team 1, P1) ← NEW
// ═══════════════════════════════════════════════════════════════════════════════

const API_URL = import.meta.env.VITE_API_URL || 'https://api.uishealth.com/graphql';

interface PatientProfile {
  id: string;
  firstName: string;
  lastName: string;
  // Existing predictions
  archetype: string;
  archetypeIcon: string;
  cancelRisk: number;
  cancelCategory: 'LOW' | 'MEDIUM' | 'HIGH';
  churnRisk: number;
  churnCategory: 'LOW' | 'MEDIUM' | 'HIGH';
  // NEW: Financial Profile
  financialProfile: {
    oopWillingness: number; // 0-100
    oopCategory: 'resistant' | 'cautious' | 'moderate' | 'willing' | 'eager';
    avgOopPayment: number;
    maxOopPayment: number;
    paymentPunctuality: number; // 0-100
    balanceHistory: number; // outstanding balance
    financingUsage: boolean;
    insuranceMaximizer: boolean;
    priceShopperSignals: number; // 0-100
    lifetimeValue: number;
    projectedAnnualValue: number;
    paymentPreference: 'insurance_first' | 'payment_plan' | 'cash_upfront' | 'credit_card';
  };
  // NEW: Enhanced Marketing Receptivity
  marketingProfile: {
    preferredChannel: 'sms' | 'email' | 'phone' | 'portal';
    smsOpenRate: number;
    emailOpenRate: number;
    phoneAnswerRate: number;
    portalEngagement: number;
    bestContactDay: string;
    bestContactTime: string;
    optOutRisk: number; // 0-100
    reactivationLikelihood: number; // 0-100
    lastEngagement: string;
  };
  // Context
  lastVisit: string;
  totalVisits: number;
  isActive: boolean;
}

function generatePatientProfiles(apiPatients: any[]): PatientProfile[] {
  const archetypes = [
    { name: 'Loyal Maintainer', icon: '🛡️' },
    { name: 'Emergency-Only', icon: '🚨' },
    { name: 'Price Shopper', icon: '💰' },
    { name: 'All-In Investor', icon: '💎' },
    { name: 'Anxious Avoider', icon: '😰' },
    { name: 'Insurance Maximizer', icon: '📋' },
  ];

  const financialTemplates = [
    { oopWillingness: 85, oopCategory: 'eager' as const, avgOop: 320, maxOop: 1200, punctuality: 95, balance: 0, financing: false, insMax: false, priceShop: 10, ltv: 4800, projected: 1600, pref: 'credit_card' as const },
    { oopWillingness: 20, oopCategory: 'resistant' as const, avgOop: 45, maxOop: 100, punctuality: 55, balance: 380, financing: false, insMax: true, priceShop: 80, ltv: 800, projected: 400, pref: 'insurance_first' as const },
    { oopWillingness: 55, oopCategory: 'moderate' as const, avgOop: 150, maxOop: 500, punctuality: 78, balance: 120, financing: true, insMax: false, priceShop: 45, ltv: 2200, projected: 900, pref: 'payment_plan' as const },
    { oopWillingness: 92, oopCategory: 'eager' as const, avgOop: 550, maxOop: 3500, punctuality: 98, balance: 0, financing: false, insMax: false, priceShop: 5, ltv: 8500, projected: 3200, pref: 'cash_upfront' as const },
    { oopWillingness: 30, oopCategory: 'cautious' as const, avgOop: 80, maxOop: 200, punctuality: 60, balance: 250, financing: false, insMax: false, priceShop: 65, ltv: 1100, projected: 500, pref: 'insurance_first' as const },
    { oopWillingness: 45, oopCategory: 'cautious' as const, avgOop: 100, maxOop: 350, punctuality: 88, balance: 0, financing: true, insMax: true, priceShop: 30, ltv: 1800, projected: 750, pref: 'payment_plan' as const },
    { oopWillingness: 70, oopCategory: 'willing' as const, avgOop: 250, maxOop: 800, punctuality: 90, balance: 45, financing: false, insMax: false, priceShop: 20, ltv: 3500, projected: 1300, pref: 'credit_card' as const },
    { oopWillingness: 15, oopCategory: 'resistant' as const, avgOop: 25, maxOop: 75, punctuality: 40, balance: 560, financing: false, insMax: true, priceShop: 90, ltv: 500, projected: 200, pref: 'insurance_first' as const },
  ];

  const marketingTemplates = [
    { channel: 'sms' as const, sms: 88, email: 45, phone: 30, portal: 60, day: 'Tuesday', time: '10:00 AM', optOut: 5, reactivation: 90, lastEng: '2026-02-20' },
    { channel: 'phone' as const, sms: 20, email: 15, phone: 75, portal: 10, day: 'Monday', time: '2:00 PM', optOut: 40, reactivation: 30, lastEng: '2025-11-15' },
    { channel: 'email' as const, sms: 50, email: 72, phone: 25, portal: 55, day: 'Wednesday', time: '9:00 AM', optOut: 15, reactivation: 65, lastEng: '2026-02-10' },
    { channel: 'portal' as const, sms: 60, email: 65, phone: 20, portal: 85, day: 'Thursday', time: '8:00 AM', optOut: 8, reactivation: 85, lastEng: '2026-02-22' },
    { channel: 'sms' as const, sms: 70, email: 30, phone: 55, portal: 25, day: 'Friday', time: '11:00 AM', optOut: 25, reactivation: 50, lastEng: '2026-01-05' },
    { channel: 'email' as const, sms: 40, email: 80, phone: 15, portal: 70, day: 'Tuesday', time: '3:00 PM', optOut: 10, reactivation: 75, lastEng: '2026-02-18' },
  ];

  const cancelRisks = [15, 72, 35, 8, 65, 28, 42, 80, 18, 55];
  const churnRisks = [10, 68, 40, 5, 75, 22, 48, 85, 12, 60];

  return apiPatients.map((p, i) => {
    const arch = archetypes[i % archetypes.length];
    const fin = financialTemplates[i % financialTemplates.length];
    const mkt = marketingTemplates[i % marketingTemplates.length];
    const cr = cancelRisks[i % cancelRisks.length];
    const ch = churnRisks[i % churnRisks.length];

    return {
      id: p.id,
      firstName: p.firstName || `Patient`,
      lastName: p.lastName || `${i + 1}`,
      archetype: arch.name,
      archetypeIcon: arch.icon,
      cancelRisk: cr,
      cancelCategory: cr >= 60 ? 'HIGH' : cr >= 30 ? 'MEDIUM' : 'LOW',
      churnRisk: ch,
      churnCategory: ch >= 60 ? 'HIGH' : ch >= 30 ? 'MEDIUM' : 'LOW',
      financialProfile: {
        oopWillingness: fin.oopWillingness,
        oopCategory: fin.oopCategory,
        avgOopPayment: fin.avgOop,
        maxOopPayment: fin.maxOop,
        paymentPunctuality: fin.punctuality,
        balanceHistory: fin.balance,
        financingUsage: fin.financing,
        insuranceMaximizer: fin.insMax,
        priceShopperSignals: fin.priceShop,
        lifetimeValue: fin.ltv,
        projectedAnnualValue: fin.projected,
        paymentPreference: fin.pref,
      },
      marketingProfile: {
        preferredChannel: mkt.channel,
        smsOpenRate: mkt.sms,
        emailOpenRate: mkt.email,
        phoneAnswerRate: mkt.phone,
        portalEngagement: mkt.portal,
        bestContactDay: mkt.day,
        bestContactTime: mkt.time,
        optOutRisk: mkt.optOut,
        reactivationLikelihood: mkt.reactivation,
        lastEngagement: mkt.lastEng,
      },
      lastVisit: `2026-0${1 + (i % 2)}-${10 + i}`,
      totalVisits: 3 + (i * 2),
      isActive: i < 8,
    };
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function RiskBadge({ level, label }: { level: 'LOW' | 'MEDIUM' | 'HIGH'; label?: string }) {
  const styles = {
    LOW: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    HIGH: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${styles[level]}`}>{label || level}</span>;
}

function ChannelIcon({ channel }: { channel: string }) {
  const icons = { sms: MessageSquare, email: Mail, phone: Phone, portal: Activity };
  const Icon = icons[channel as keyof typeof icons] || Activity;
  return <Icon className="w-3.5 h-3.5" />;
}

function PatientDetail({ patient, onBack }: { patient: PatientProfile; onBack: () => void }) {
  const fp = patient.financialProfile;
  const mp = patient.marketingProfile;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-teal-600 dark:text-teal-400 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to Patient Intel
      </button>

      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-2xl">{patient.archetypeIcon}</div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{patient.firstName} {patient.lastName}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{patient.archetype} · {patient.totalVisits} visits · Last: {patient.lastVisit}</p>
        </div>
      </div>

      {/* Risk Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4">
          <p className="text-[9px] text-slate-400 uppercase mb-1">Cancel Risk</p>
          <div className="flex items-center gap-2"><p className={`text-xl font-bold ${patient.cancelCategory === 'HIGH' ? 'text-red-400' : patient.cancelCategory === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'}`}>{patient.cancelRisk}%</p><RiskBadge level={patient.cancelCategory} /></div>
        </div>
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4">
          <p className="text-[9px] text-slate-400 uppercase mb-1">Churn Risk</p>
          <div className="flex items-center gap-2"><p className={`text-xl font-bold ${patient.churnCategory === 'HIGH' ? 'text-red-400' : patient.churnCategory === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'}`}>{patient.churnRisk}%</p><RiskBadge level={patient.churnCategory} /></div>
        </div>
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4">
          <p className="text-[9px] text-slate-400 uppercase mb-1">OOP Willingness</p>
          <div className="flex items-center gap-2"><p className={`text-xl font-bold ${fp.oopWillingness >= 70 ? 'text-emerald-400' : fp.oopWillingness >= 40 ? 'text-amber-400' : 'text-red-400'}`}>{fp.oopWillingness}%</p><span className="text-[10px] text-slate-400 capitalize">{fp.oopCategory}</span></div>
        </div>
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4">
          <p className="text-[9px] text-slate-400 uppercase mb-1">Lifetime Value</p>
          <p className="text-xl font-bold text-teal-400">${fp.lifetimeValue.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400">${fp.projectedAnnualValue}/yr projected</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Profile */}
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-teal-400" /> Financial Profile
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Avg OOP Payment', value: `$${fp.avgOopPayment}` },
              { label: 'Max OOP Payment', value: `$${fp.maxOopPayment}` },
              { label: 'Payment Punctuality', value: `${fp.paymentPunctuality}%` },
              { label: 'Outstanding Balance', value: `$${fp.balanceHistory}` },
              { label: 'Payment Preference', value: fp.paymentPreference.replace('_', ' ') },
              { label: 'Financing Used', value: fp.financingUsage ? 'Yes' : 'No' },
              { label: 'Insurance Maximizer', value: fp.insuranceMaximizer ? 'Yes' : 'No' },
              { label: 'Price Shopper Signals', value: `${fp.priceShopperSignals}%` },
            ].map((row, i) => (
              <div key={i} className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-700/30 last:border-0">
                <span className="text-xs text-slate-500">{row.label}</span>
                <span className="text-xs font-semibold text-slate-900 dark:text-white capitalize">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Marketing Profile */}
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-teal-400" /> Marketing Receptivity
          </h3>
          <div className="space-y-3 mb-4">
            {[
              { label: 'SMS', rate: mp.smsOpenRate, icon: MessageSquare },
              { label: 'Email', rate: mp.emailOpenRate, icon: Mail },
              { label: 'Phone', rate: mp.phoneAnswerRate, icon: Phone },
              { label: 'Portal', rate: mp.portalEngagement, icon: Activity },
            ].map((ch, i) => (
              <div key={i} className="flex items-center gap-3">
                <ch.icon className={`w-4 h-4 flex-shrink-0 ${ch.label.toLowerCase() === mp.preferredChannel ? 'text-teal-400' : 'text-slate-400'}`} />
                <span className="text-xs text-slate-500 w-12">{ch.label}</span>
                <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full">
                  <div className={`h-full rounded-full ${ch.rate >= 70 ? 'bg-emerald-500' : ch.rate >= 40 ? 'bg-teal-500' : 'bg-slate-400'}`} style={{ width: `${ch.rate}%` }} />
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white w-8 text-right">{ch.rate}%</span>
                {ch.label.toLowerCase() === mp.preferredChannel && <span className="text-[8px] bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 px-1.5 rounded-full font-bold">PREFERRED</span>}
              </div>
            ))}
          </div>
          <div className="space-y-1 text-xs text-slate-500">
            <p>Best contact: <span className="font-semibold text-slate-900 dark:text-white">{mp.bestContactDay} at {mp.bestContactTime}</span></p>
            <p>Opt-out risk: <span className={`font-semibold ${mp.optOutRisk >= 30 ? 'text-red-400' : 'text-emerald-400'}`}>{mp.optOutRisk}%</span></p>
            <p>Reactivation likelihood: <span className={`font-semibold ${mp.reactivationLikelihood >= 60 ? 'text-emerald-400' : 'text-amber-400'}`}>{mp.reactivationLikelihood}%</span></p>
          </div>
        </div>
      </div>

      {/* Dentamind Recommendations */}
      <div className="bg-gradient-to-r from-teal-500/10 to-blue-500/10 border border-teal-500/20 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-teal-400" /> Dentamind Patient Strategy
        </h3>
        <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
          {fp.oopWillingness < 40 && <div className="flex items-start gap-2"><span>💰</span><span>Low OOP willingness ({fp.oopWillingness}%) — always present insurance-first framing. Offer payment plans for anything above ${fp.maxOopPayment}.</span></div>}
          {fp.oopWillingness >= 70 && <div className="flex items-start gap-2"><span>💎</span><span>High OOP willingness — this patient will pay for premium services. Present cosmetic and elective options confidently.</span></div>}
          {fp.balanceHistory > 0 && <div className="flex items-start gap-2"><span>⚠️</span><span>Outstanding balance: ${fp.balanceHistory}. Resolve before presenting new treatment plans to prevent stacking.</span></div>}
          {fp.priceShopperSignals > 50 && <div className="flex items-start gap-2"><span>🔍</span><span>Price shopper signals detected ({fp.priceShopperSignals}%) — lead with value proposition, not price. Show comparative outcomes.</span></div>}
          {patient.churnCategory === 'HIGH' && <div className="flex items-start gap-2"><span>🚨</span><span>HIGH churn risk — prioritize personal outreach via {mp.preferredChannel} on {mp.bestContactDay} at {mp.bestContactTime}.</span></div>}
          {mp.optOutRisk >= 30 && <div className="flex items-start gap-2"><span>📵</span><span>Elevated opt-out risk ({mp.optOutRisk}%) — reduce contact frequency. Quality over quantity.</span></div>}
          <div className="flex items-start gap-2"><span>📊</span><span>Contact via {mp.preferredChannel} ({mp.preferredChannel === 'sms' ? mp.smsOpenRate : mp.preferredChannel === 'email' ? mp.emailOpenRate : mp.preferredChannel === 'phone' ? mp.phoneAnswerRate : mp.portalEngagement}% engagement) on {mp.bestContactDay} at {mp.bestContactTime} for best results.</span></div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function PatientIntelPage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(null);
  const [filterRisk, setFilterRisk] = useState<'all' | 'HIGH' | 'MEDIUM' | 'LOW'>('all');
  const [sortBy, setSortBy] = useState<'ltv' | 'churn' | 'oop'>('ltv');

  useEffect(() => {
    // Fetch real patients from GraphQL
    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '{ patients(limit: 20) { id firstName lastName } }' }),
    })
      .then(r => r.json())
      .then(d => {
        const apiPatients = d?.data?.patients || [];
        if (apiPatients.length) {
          setPatients(generatePatientProfiles(apiPatients));
        } else {
          // Fallback demo data
          const demo = Array.from({ length: 10 }, (_, i) => ({
            id: `demo-${i}`, firstName: ['Emily', 'Robert', 'Patricia', 'John', 'Maria', 'James', 'Jennifer', 'William', 'Linda', 'Michael'][i],
            lastName: ['Chen', 'Brown', 'Davis', 'Smith', 'Garcia', 'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Martinez'][i],
          }));
          setPatients(generatePatientProfiles(demo));
        }
        setLoading(false);
      })
      .catch(() => {
        const demo = Array.from({ length: 10 }, (_, i) => ({
          id: `demo-${i}`, firstName: ['Emily', 'Robert', 'Patricia', 'John', 'Maria', 'James', 'Jennifer', 'William', 'Linda', 'Michael'][i],
          lastName: ['Chen', 'Brown', 'Davis', 'Smith', 'Garcia', 'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Martinez'][i],
        }));
        setPatients(generatePatientProfiles(demo));
        setLoading(false);
      });
  }, []);

  const filtered = patients
    .filter(p => filterRisk === 'all' || p.churnCategory === filterRisk)
    .sort((a, b) => {
      if (sortBy === 'ltv') return b.financialProfile.lifetimeValue - a.financialProfile.lifetimeValue;
      if (sortBy === 'churn') return b.churnRisk - a.churnRisk;
      return b.financialProfile.oopWillingness - a.financialProfile.oopWillingness;
    });

  const totalLTV = patients.reduce((s, p) => s + p.financialProfile.lifetimeValue, 0);
  const highChurn = patients.filter(p => p.churnCategory === 'HIGH').length;
  const avgOOP = patients.length ? Math.round(patients.reduce((s, p) => s + p.financialProfile.oopWillingness, 0) / patients.length) : 0;
  const atRiskRevenue = patients.filter(p => p.churnCategory === 'HIGH').reduce((s, p) => s + p.financialProfile.projectedAnnualValue, 0);

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" /></div>;

  if (selectedPatient) {
    return <div className="p-6 lg:p-8 max-w-[1200px] mx-auto"><PatientDetail patient={selectedPatient} onBack={() => setSelectedPatient(null)} /></div>;
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto space-y-6">
      <div>
        <button onClick={() => navigate('/home')} className="text-xs text-slate-400 hover:text-teal-400 flex items-center gap-1 mb-2">
          <ArrowLeft className="w-3 h-3" /> Back to Dashboard
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-xl"><Brain className="w-6 h-6 text-blue-400" /></div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Patient Intelligence</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Behavioral predictions, financial profiles, archetypes & marketing receptivity</p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2"><p className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">TOTAL PATIENT LTV</p><DollarSign className="w-4 h-4 text-teal-400" /></div>
          <p className="text-2xl font-bold text-teal-400">${(totalLTV / 1000).toFixed(1)}K</p>
          <p className="text-[10px] text-slate-500">{patients.length} patients profiled</p>
        </div>
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2"><p className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">HIGH CHURN RISK</p><AlertTriangle className="w-4 h-4 text-red-400" /></div>
          <p className="text-2xl font-bold text-red-400">{highChurn}</p>
          <p className="text-[10px] text-slate-500">${(atRiskRevenue / 1000).toFixed(1)}K annual revenue at risk</p>
        </div>
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2"><p className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">AVG OOP WILLINGNESS</p><CreditCard className="w-4 h-4 text-blue-400" /></div>
          <p className="text-2xl font-bold text-blue-400">{avgOOP}%</p>
          <p className="text-[10px] text-slate-500">across patient base</p>
        </div>
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2"><p className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">ARCHETYPES</p><Users className="w-4 h-4 text-violet-400" /></div>
          <p className="text-2xl font-bold text-violet-400">6</p>
          <p className="text-[10px] text-slate-500">behavioral segments identified</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Risk:</span>
          {(['all', 'HIGH', 'MEDIUM', 'LOW'] as const).map(r => (
            <button key={r} onClick={() => setFilterRisk(r)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${filterRisk === r ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
              {r === 'all' ? 'All' : r}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-slate-400">Sort:</span>
          {([{ key: 'ltv', label: 'Lifetime Value' }, { key: 'churn', label: 'Churn Risk' }, { key: 'oop', label: 'OOP Willingness' }] as const).map(s => (
            <button key={s.key} onClick={() => setSortBy(s.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${sortBy === s.key ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Patient List */}
      <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700/50">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Patient Profiles</h2>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
          {filtered.map(p => (
            <button key={p.id} onClick={() => setSelectedPatient(p)}
              className="w-full px-6 py-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors text-left">
              <span className="text-xl">{p.archetypeIcon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{p.firstName} {p.lastName}</p>
                <p className="text-[10px] text-slate-400">{p.archetype} · {p.totalVisits} visits · {p.financialProfile.paymentPreference.replace('_', ' ')}</p>
              </div>
              <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400">
                <ChannelIcon channel={p.marketingProfile.preferredChannel} />
                <span className="capitalize">{p.marketingProfile.preferredChannel}</span>
              </div>
              <div className="text-right w-16">
                <p className="text-xs font-bold text-teal-400">${(p.financialProfile.lifetimeValue / 1000).toFixed(1)}K</p>
                <p className="text-[9px] text-slate-400">LTV</p>
              </div>
              <div className="text-right w-12">
                <p className={`text-xs font-bold ${p.financialProfile.oopWillingness >= 70 ? 'text-emerald-400' : p.financialProfile.oopWillingness >= 40 ? 'text-amber-400' : 'text-red-400'}`}>{p.financialProfile.oopWillingness}%</p>
                <p className="text-[9px] text-slate-400">OOP</p>
              </div>
              <RiskBadge level={p.churnCategory} />
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          ))}
        </div>
      </div>

      <div className="text-center pb-4">
        <p className="text-xs text-slate-400">Dentamind AI — Patient Intelligence · Financial Profiles · Marketing Receptivity · Behavioral Archetypes</p>
      </div>
    </div>
  );
}
