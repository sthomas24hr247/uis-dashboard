import { useState } from 'react';
import { Calculator, DollarSign, TrendingUp, ArrowRight, CheckCircle2, Sparkles, Building2, Users, Target, X, ChevronDown, ChevronUp, Zap, BarChart3, Shield, Headphones, Brain, Globe } from 'lucide-react';

// ─── Pricing Tier Definitions ─────────────────────────────────────────────────
const plans = {
  starter: {
    name: 'Starter',
    price: 299,
    period: '/mo per location',
    onboarding: 500,
    tagline: 'Solo & small practices',
    providers: 'Up to 3 providers',
    color: 'from-slate-500 to-slate-600',
    borderColor: 'border-slate-500/30',
    badgeColor: 'bg-slate-500/10 text-slate-400',
    features: {
      'Practice Dashboard': [
        { name: 'Unified Schedule View', included: true },
        { name: "Today's Appointments", included: true },
        { name: 'Patient Management', included: true },
        { name: 'Provider Profiles', included: true },
      ],
      'Analytics & Reporting': [
        { name: 'Core Analytics Dashboard', included: true },
        { name: 'Revenue Trends', included: true },
        { name: 'No-Show Tracking', included: true },
        { name: 'Outcome Gap Analysis', included: false },
        { name: 'Power BI Executive Reports', included: false },
        { name: 'Weekly Board Email Digest', included: false },
      ],
      'AI & Intelligence': [
        { name: 'Ask Dentamind AI (Basic)', included: true },
        { name: 'Behavioral Prediction Scoring', included: false },
        { name: 'Staff Decision Analytics (BIL)', included: false },
        { name: 'Patient Risk Stratification', included: false },
        { name: 'Decision Fingerprint Engine', included: false },
      ],
      'Integrations & Support': [
        { name: '1 PMS Connection', included: true },
        { name: 'Insurance Verification', included: false },
        { name: 'Automated Follow-Up Triggers', included: false },
        { name: 'Email Support', included: true },
        { name: 'Dedicated Account Manager', included: false },
        { name: 'Custom Onboarding', included: false },
      ],
    },
  },
  professional: {
    name: 'Professional',
    price: 599,
    period: '/mo per location',
    onboarding: 1000,
    tagline: 'Growing practices & small groups',
    providers: 'Up to 8 providers',
    color: 'from-uis-500 to-uis-600',
    borderColor: 'border-uis-500/30',
    badgeColor: 'bg-uis-500/10 text-uis-400',
    popular: true,
    features: {
      'Practice Dashboard': [
        { name: 'Unified Schedule View', included: true },
        { name: "Today's Appointments", included: true },
        { name: 'Patient Management', included: true },
        { name: 'Provider Profiles', included: true },
      ],
      'Analytics & Reporting': [
        { name: 'Core Analytics Dashboard', included: true },
        { name: 'Revenue Trends', included: true },
        { name: 'No-Show Tracking', included: true },
        { name: 'Outcome Gap Analysis', included: true },
        { name: 'Power BI Executive Reports', included: true },
        { name: 'Weekly Board Email Digest', included: false },
      ],
      'AI & Intelligence': [
        { name: 'Ask Dentamind AI (Full)', included: true },
        { name: 'Behavioral Prediction Scoring', included: true },
        { name: 'Staff Decision Analytics (BIL)', included: true },
        { name: 'Patient Risk Stratification', included: true },
        { name: 'Decision Fingerprint Engine', included: false },
      ],
      'Integrations & Support': [
        { name: 'Up to 2 PMS Connections', included: true },
        { name: 'Insurance Verification', included: true },
        { name: 'Automated Follow-Up Triggers', included: true },
        { name: 'Priority Email & Chat Support', included: true },
        { name: 'Dedicated Account Manager', included: false },
        { name: 'Custom Onboarding', included: false },
      ],
    },
  },
  enterprise: {
    name: 'Enterprise',
    price: 999,
    period: '/mo per location',
    onboarding: 1500,
    tagline: 'Multi-location & DSOs',
    providers: 'Unlimited providers',
    color: 'from-amber-500 to-orange-500',
    borderColor: 'border-amber-500/30',
    badgeColor: 'bg-amber-500/10 text-amber-400',
    features: {
      'Practice Dashboard': [
        { name: 'Unified Schedule View', included: true },
        { name: "Today's Appointments", included: true },
        { name: 'Patient Management', included: true },
        { name: 'Provider Profiles', included: true },
      ],
      'Analytics & Reporting': [
        { name: 'Core Analytics Dashboard', included: true },
        { name: 'Revenue Trends', included: true },
        { name: 'No-Show Tracking', included: true },
        { name: 'Outcome Gap Analysis', included: true },
        { name: 'Power BI Executive Reports', included: true },
        { name: 'Weekly Board Email Digest', included: true },
      ],
      'AI & Intelligence': [
        { name: 'Ask Dentamind AI (Full + Custom)', included: true },
        { name: 'Behavioral Prediction Scoring', included: true },
        { name: 'Staff Decision Analytics (BIL)', included: true },
        { name: 'Patient Risk Stratification', included: true },
        { name: 'Decision Fingerprint Engine', included: true },
      ],
      'Integrations & Support': [
        { name: 'Unlimited PMS Connections', included: true },
        { name: 'Insurance Verification', included: true },
        { name: 'Automated Follow-Up Triggers', included: true },
        { name: 'Priority Phone, Email & Chat', included: true },
        { name: 'Dedicated Account Manager', included: true },
        { name: 'Custom Onboarding & Training', included: true },
      ],
    },
  },
} as const;

type TierKey = keyof typeof plans;

const categoryIcons: Record<string, any> = {
  'Practice Dashboard': Building2,
  'Analytics & Reporting': BarChart3,
  'AI & Intelligence': Brain,
  'Integrations & Support': Globe,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ROICalculatorPage() {
  const [monthlyRev, setMonthlyRev] = useState(150000);
  const [providers, setProviders] = useState(3);
  const [acceptanceRate, setAcceptanceRate] = useState(45);
  const [completionRate, setCompletionRate] = useState(65);
  const [collectionRate, setCollectionRate] = useState(85);
  const [noShowRate, setNoShowRate] = useState(12);
  const [tier, setTier] = useState<TierKey>('professional');
  const [expandedTier, setExpandedTier] = useState<TierKey | null>(null);

  const plan = plans[tier];
  const monthlyCost = plan.price;

  // ─── Revenue Recovery Calculations ────────────────────────────────────────
  const diagnosedNotAccepted = monthlyRev * ((100 - acceptanceRate) / 100) * 0.15;
  const acceptedNotCompleted = monthlyRev * (acceptanceRate / 100) * ((100 - completionRate) / 100) * 0.25;
  const completedNotCollected = monthlyRev * (acceptanceRate / 100) * (completionRate / 100) * ((100 - collectionRate) / 100) * 0.40;
  const noShowRecovery = monthlyRev * (noShowRate / 100) * 0.30;
  const totalMonthlyRecovery = diagnosedNotAccepted + acceptedNotCompleted + completedNotCollected + noShowRecovery;
  const totalAnnualRecovery = totalMonthlyRecovery * 12;
  const roi = totalMonthlyRecovery > 0 ? Math.round((totalMonthlyRecovery - monthlyCost) / monthlyCost * 100) : 0;
  const roiMultiple = monthlyCost > 0 ? (totalMonthlyRecovery / monthlyCost).toFixed(1) : '0';
  const paybackDays = totalMonthlyRecovery > 0 ? Math.ceil(monthlyCost / (totalMonthlyRecovery / 30)) : 0;
  const annualNetGain = totalAnnualRecovery - (monthlyCost * 12);

  // ─── Revenue Leakage ─────────────────────────────────────────────────────
  const leakAcceptance = monthlyRev * ((100 - acceptanceRate) / 100);
  const leakCompletion = monthlyRev * (acceptanceRate / 100) * ((100 - completionRate) / 100);
  const leakCollection = monthlyRev * (acceptanceRate / 100) * (completionRate / 100) * ((100 - collectionRate) / 100);
  const leakNoShow = monthlyRev * (noShowRate / 100);
  const totalLeakage = leakAcceptance + leakCompletion + leakCollection + leakNoShow;

  // ─── Funnel ───────────────────────────────────────────────────────────────
  const funnelStages = [
    { label: 'Diagnosed', value: monthlyRev, pct: 100 },
    { label: 'Accepted', value: monthlyRev * (acceptanceRate / 100), pct: acceptanceRate },
    { label: 'Completed', value: monthlyRev * (acceptanceRate / 100) * (completionRate / 100), pct: Math.round(acceptanceRate * completionRate / 100) },
    { label: 'Collected', value: monthlyRev * (acceptanceRate / 100) * (completionRate / 100) * (collectionRate / 100), pct: Math.round(acceptanceRate * completionRate * collectionRate / 10000) },
  ];

  // ─── Formatters ───────────────────────────────────────────────────────────
  const fmt = (n: number) => {
    if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
    if (n >= 10000) return '$' + Math.round(n).toLocaleString();
    if (n >= 1000) return '$' + (n / 1000).toFixed(1) + 'k';
    return '$' + Math.round(n).toLocaleString();
  };
  const fmtFull = (n: number) => '$' + Math.round(n).toLocaleString();

  // ─── Slider Component ─────────────────────────────────────────────────────
  const Slider = ({ label, value, onChange, min, max, step = 1, format }: {
    label: string; value: number; onChange: (v: number) => void;
    min: number; max: number; step?: number; format: (v: number) => string;
  }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-300">{label}</span>
        <span className="text-sm font-bold text-white">{format(value)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-uis-500"
      />
      <div className="flex justify-between text-xs text-slate-500">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );

  // ─── Toggle Tier Expansion ────────────────────────────────────────────────
  const toggleExpand = (key: TierKey) => {
    setExpandedTier(expandedTier === key ? null : key);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="p-2 bg-uis-600/20 rounded-xl">
            <Calculator className="w-6 h-6 text-uis-400" />
          </div>
          ROI Calculator
        </h1>
        <p className="text-slate-400 mt-1">See how much revenue UIS Health can recover for your practice</p>
      </div>

      {/* Main Grid: Inputs + Results */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ─── LEFT: Practice Inputs ─────────────────────────────────── */}
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-uis-400" />
            Practice Profile
          </h2>

          <Slider label="Monthly Production" value={monthlyRev} onChange={setMonthlyRev}
            min={50000} max={500000} step={5000} format={fmt} />
          <Slider label="Providers" value={providers} onChange={setProviders}
            min={1} max={15} format={v => String(v)} />
          <Slider label="Acceptance Rate" value={acceptanceRate} onChange={setAcceptanceRate}
            min={20} max={80} format={v => v + '%'} />
          <Slider label="Completion Rate" value={completionRate} onChange={setCompletionRate}
            min={40} max={95} format={v => v + '%'} />
          <Slider label="Collection Rate" value={collectionRate} onChange={setCollectionRate}
            min={60} max={99} format={v => v + '%'} />
          <Slider label="No-Show Rate" value={noShowRate} onChange={setNoShowRate}
            min={2} max={30} format={v => v + '%'} />
        </div>

        {/* ─── CENTER: Outcome Gap Funnel + Leakage ──────────────────── */}
        <div className="space-y-6">
          {/* Funnel */}
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-uis-400" />
              Outcome Gap Funnel
            </h2>
            <div className="space-y-3">
              {funnelStages.map((stage, i) => (
                <div key={stage.label} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">{stage.label}</span>
                    <div className="flex gap-3">
                      <span className="text-slate-500">{stage.pct}%</span>
                      <span className="text-white font-medium">{fmtFull(stage.value)}</span>
                    </div>
                  </div>
                  <div className="h-8 bg-slate-700/50 rounded-lg overflow-hidden">
                    <div
                      className={`h-full rounded-lg transition-all duration-500 ${
                        i === 0 ? 'bg-blue-500' : i === 1 ? 'bg-indigo-500' : i === 2 ? 'bg-purple-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${stage.pct}%` }}
                    />
                  </div>
                  {i < funnelStages.length - 1 && (
                    <div className="text-right">
                      <span className="text-xs text-red-400">
                        -{fmtFull(stage.value - funnelStages[i + 1].value)} leaked
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-700/50 flex justify-between items-center">
              <span className="text-sm text-uis-400 font-medium">Total Monthly Leakage</span>
              <span className="text-xl font-bold text-red-400">{fmtFull(totalLeakage)}</span>
            </div>
          </div>

          {/* Recovery Breakdown */}
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-uis-400" />
              UIS Recovery Breakdown
            </h2>
            <div className="space-y-3">
              {[
                { label: 'Acceptance Gap Recovery', desc: '15% of unaccepted treatment recovered via AI nudges', value: diagnosedNotAccepted },
                { label: 'Completion Gap Recovery', desc: '25% of stalled treatments pushed through scheduling', value: acceptedNotCompleted },
                { label: 'Collection Gap Recovery', desc: '40% of unbilled/uncollected recovered via automation', value: completedNotCollected },
                { label: 'No-Show Recovery', desc: '30% of no-shows prevented via predictive outreach', value: noShowRecovery },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-start p-3 bg-slate-700/30 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                  <span className="text-sm font-bold text-emerald-400 whitespace-nowrap ml-4">+{fmtFull(item.value)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-700/50 flex justify-between items-center">
              <span className="text-sm text-uis-400 font-medium">Total Monthly Recovery</span>
              <span className="text-xl font-bold text-emerald-400">+{fmtFull(totalMonthlyRecovery)}</span>
            </div>
          </div>
        </div>

        {/* ─── RIGHT: ROI Results + Projection ───────────────────────── */}
        <div className="space-y-6">
          {/* ROI Card */}
          <div className="bg-gradient-to-br from-uis-600/20 to-emerald-600/10 rounded-2xl border border-uis-500/20 p-6">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm text-slate-400">Annual Net Gain</span>
              <span className="text-lg font-bold text-emerald-400">+{fmtFull(annualNetGain)}/yr</span>
            </div>
            <div className="flex items-center justify-center py-4">
              <div className="text-center">
                <p className="text-5xl font-black text-emerald-400">{roi}%</p>
                <p className="text-sm text-emerald-300 mt-1">Return on Investment</p>
                <p className="text-xs text-slate-400 mt-1">UIS pays for itself in {paybackDays} days</p>
              </div>
            </div>
          </div>

          {/* 12-Month Projection */}
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6">
            <h3 className="text-sm font-semibold text-white mb-3">12-Month Projection</h3>
            {[
              { month: 'Month 1', value: totalMonthlyRecovery },
              { month: 'Month 3', value: totalMonthlyRecovery * 3 },
              { month: 'Month 6', value: totalMonthlyRecovery * 6 },
              { month: 'Month 12', value: totalMonthlyRecovery * 12 },
            ].map(item => (
              <div key={item.month} className="flex justify-between py-2 border-b border-slate-700/30 last:border-0">
                <span className="text-sm text-slate-400">{item.month}</span>
                <span className="text-sm font-semibold text-emerald-400">+{fmtFull(item.value)} recovered</span>
              </div>
            ))}
          </div>

          {/* What Powers These Results */}
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6">
            <h3 className="text-sm font-semibold text-white mb-3">What Powers These Results</h3>
            <div className="space-y-2">
              {[
                'Outcome Gap Intelligence Engine',
                'Behavioral Prediction Scoring',
                'AI-Powered Recommendations',
                'Staff Decision Analytics (BIL)',
                'No-Show Risk Prevention',
                'Automated Follow-Up Triggers',
                'Executive Board Reports',
                'Multi-PMS Integration',
              ].map(item => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-uis-400 shrink-0" />
                  <span className="text-sm text-slate-300">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── PRICING SECTION: Expandable Plan Cards ─────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-uis-400" />
          UIS Health Plans
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.entries(plans) as [TierKey, typeof plans[TierKey]][]).map(([key, p]) => {
            const isSelected = tier === key;
            const isExpanded = expandedTier === key;
            const isPopular = 'popular' in p && p.popular;

            return (
              <div key={key} className="flex flex-col">
                {/* Card */}
                <div
                  className={`relative rounded-2xl border transition-all duration-300 ${
                    isSelected
                      ? `${p.borderColor} bg-slate-800/80 ring-1 ring-uis-500/30`
                      : 'border-slate-700/50 bg-slate-800/40 hover:border-slate-600/50'
                  }`}
                >
                  {/* Popular Badge */}
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 bg-uis-500 text-white text-xs font-semibold rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}

                  {/* Card Content */}
                  <div className="p-5">
                    {/* Plan Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className={`text-lg font-bold bg-gradient-to-r ${p.color} bg-clip-text text-transparent`}>
                          {p.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">{p.tagline}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${p.badgeColor}`}>
                        {p.providers}
                      </span>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-3xl font-black text-white">${p.price}</span>
                      <span className="text-sm text-slate-400">{p.period}</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">+ ${p.onboarding.toLocaleString()} one-time onboarding</p>

                    {/* Select + Expand Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setTier(key)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          isSelected
                            ? 'bg-uis-600 text-white'
                            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {isSelected ? '✓ Selected' : 'Calculate ROI'}
                      </button>
                      <button
                        onClick={() => toggleExpand(key)}
                        className="px-3 py-2.5 rounded-xl bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white transition-all"
                        title={isExpanded ? 'Hide details' : 'View all features'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Quick Feature Summary (always visible) */}
                    <div className="mt-4 pt-4 border-t border-slate-700/30 space-y-2">
                      {key === 'starter' && (
                        <>
                          <QuickFeature text="1 PMS connection" />
                          <QuickFeature text="Core analytics & reporting" />
                          <QuickFeature text="Basic Dentamind AI" />
                          <QuickFeature text="Email support" />
                        </>
                      )}
                      {key === 'professional' && (
                        <>
                          <QuickFeature text="Up to 2 PMS connections" />
                          <QuickFeature text="Outcome Gap + Power BI" />
                          <QuickFeature text="Full Dentamind AI + BIL" />
                          <QuickFeature text="Insurance verification" />
                          <QuickFeature text="Automated follow-ups" />
                        </>
                      )}
                      {key === 'enterprise' && (
                        <>
                          <QuickFeature text="Unlimited PMS connections" />
                          <QuickFeature text="Everything in Professional" />
                          <QuickFeature text="Decision Fingerprint Engine" />
                          <QuickFeature text="Weekly Board Email Digest" />
                          <QuickFeature text="Dedicated account manager" />
                          <QuickFeature text="Custom onboarding & training" />
                        </>
                      )}
                    </div>
                  </div>

                  {/* ─── Expanded Feature Details ─────────────────────────── */}
                  {isExpanded && (
                    <div className="border-t border-slate-700/50 p-5 space-y-5 animate-in">
                      {Object.entries(p.features).map(([category, features]) => {
                        const Icon = categoryIcons[category] || CheckCircle2;
                        return (
                          <div key={category}>
                            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                              <Icon className="w-3.5 h-3.5" />
                              {category}
                            </h4>
                            <div className="space-y-1.5">
                              {features.map(feat => (
                                <div key={feat.name} className="flex items-center gap-2">
                                  {feat.included ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                  ) : (
                                    <X className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                                  )}
                                  <span className={`text-sm ${feat.included ? 'text-slate-300' : 'text-slate-600'}`}>
                                    {feat.name}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}

                      {/* ROI at this tier */}
                      <div className="pt-3 border-t border-slate-700/30">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-400">Monthly cost</span>
                          <span className="text-sm font-semibold text-white">${p.price}/mo</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-sm text-slate-400">Est. monthly recovery</span>
                          <span className="text-sm font-semibold text-emerald-400">+{fmtFull(totalMonthlyRecovery)}</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-sm text-slate-400">ROI</span>
                          <span className="text-sm font-bold text-emerald-400">
                            {Math.round((totalMonthlyRecovery - p.price) / p.price * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── CTA Footer ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-gradient-to-r from-uis-600/10 to-emerald-600/10 border border-uis-500/20 rounded-2xl p-6">
        <div>
          <p className="text-lg font-bold text-white">Ready to close your Outcome Gap?</p>
          <p className="text-sm text-slate-400">Start recovering {fmtFull(totalMonthlyRecovery)}/month in 48 hours</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-uis-600 rounded-xl text-white font-semibold hover:bg-uis-700 transition-colors mt-4 sm:mt-0">
          Get Started <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// ─── Helper Components ────────────────────────────────────────────────────────

function QuickFeature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle2 className="w-3.5 h-3.5 text-uis-400 shrink-0" />
      <span className="text-xs text-slate-300">{text}</span>
    </div>
  );
}
