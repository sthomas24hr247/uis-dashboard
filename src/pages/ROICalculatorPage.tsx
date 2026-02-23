import { useState } from 'react';
import { Calculator, DollarSign, TrendingUp, ArrowRight, CheckCircle2, Sparkles, Building2, Users, Target } from 'lucide-react';

export default function ROICalculatorPage() {
  const [monthlyRev, setMonthlyRev] = useState(150000);
  const [providers, setProviders] = useState(3);
  const [acceptanceRate, setAcceptanceRate] = useState(45);
  const [completionRate, setCompletionRate] = useState(65);
  const [collectionRate, setCollectionRate] = useState(85);
  const [noShowRate, setNoShowRate] = useState(12);
  const [tier, setTier] = useState<'starter'|'professional'|'enterprise'>('professional');

  const pricing = { starter: 299, professional: 599, enterprise: 999 };
  const monthlyCost = pricing[tier];

  // Revenue recovery calculations
  const annualRev = monthlyRev * 12;
  const diagnosedNotAccepted = monthlyRev * ((100 - acceptanceRate) / 100) * 0.15; // 15% recoverable
  const acceptedNotCompleted = monthlyRev * (acceptanceRate / 100) * ((100 - completionRate) / 100) * 0.25;
  const completedNotCollected = monthlyRev * (acceptanceRate / 100) * (completionRate / 100) * ((100 - collectionRate) / 100) * 0.40;
  const noShowRecovery = monthlyRev * (noShowRate / 100) * 0.30;
  const totalMonthlyRecovery = diagnosedNotAccepted + acceptedNotCompleted + completedNotCollected + noShowRecovery;
  const totalAnnualRecovery = totalMonthlyRecovery * 12;
  const roi = totalMonthlyRecovery > 0 ? Math.round((totalMonthlyRecovery - monthlyCost) / monthlyCost * 100) : 0;
  const roiMultiple = monthlyCost > 0 ? (totalMonthlyRecovery / monthlyCost).toFixed(1) : '0';
  const paybackDays = totalMonthlyRecovery > 0 ? Math.ceil(monthlyCost / (totalMonthlyRecovery / 30)) : 0;

  const funnelStages = [
    { label: 'Diagnosed', value: monthlyRev, color: 'bg-blue-500', width: 100 },
    { label: 'Accepted', value: monthlyRev * (acceptanceRate / 100), color: 'bg-indigo-500', width: acceptanceRate },
    { label: 'Completed', value: monthlyRev * (acceptanceRate / 100) * (completionRate / 100), color: 'bg-purple-500', width: acceptanceRate * completionRate / 100 },
    { label: 'Collected', value: monthlyRev * (acceptanceRate / 100) * (completionRate / 100) * (collectionRate / 100), color: 'bg-emerald-500', width: acceptanceRate * completionRate * collectionRate / 10000 },
  ];

  const fmt = (n: number) => n >= 1000 ? '$' + (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'K' : '$' + Math.round(n);
  const fmtFull = (n: number) => '$' + Math.round(n).toLocaleString();

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <Calculator className="w-7 h-7 text-uis-600" />ROI Calculator
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">See how much revenue UIS Health can recover for your practice</p>
      </div>

      {/* Hero ROI Banner */}
      <div className="bg-gradient-to-r from-uis-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-sm text-white/70">Monthly Recovery</p>
            <p className="text-3xl font-bold">{fmtFull(totalMonthlyRecovery)}</p>
            <p className="text-xs text-white/60">projected revenue recovered</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-white/70">Annual Impact</p>
            <p className="text-3xl font-bold">{fmtFull(totalAnnualRecovery)}</p>
            <p className="text-xs text-white/60">recovered per year</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-white/70">ROI Multiple</p>
            <p className="text-3xl font-bold">{roiMultiple}x</p>
            <p className="text-xs text-white/60">return on investment</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-white/70">Payback Period</p>
            <p className="text-3xl font-bold">{paybackDays} days</p>
            <p className="text-xs text-white/60">to recover subscription cost</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-uis-600" />Your Practice
            </h3>
            <div className="space-y-5">
              <div>
                <label className="flex justify-between text-sm text-slate-600 dark:text-slate-300 mb-2">
                  <span>Monthly Production</span><span className="font-bold text-slate-900 dark:text-white">{fmtFull(monthlyRev)}</span>
                </label>
                <input type="range" min={25000} max={500000} step={5000} value={monthlyRev} onChange={e => setMonthlyRev(+e.target.value)}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-uis-600" />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1"><span>$25K</span><span>$500K</span></div>
              </div>
              <div>
                <label className="flex justify-between text-sm text-slate-600 dark:text-slate-300 mb-2">
                  <span>Providers</span><span className="font-bold text-slate-900 dark:text-white">{providers}</span>
                </label>
                <input type="range" min={1} max={20} step={1} value={providers} onChange={e => setProviders(+e.target.value)}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-uis-600" />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1"><span>1</span><span>20</span></div>
              </div>
              <div>
                <label className="flex justify-between text-sm text-slate-600 dark:text-slate-300 mb-2">
                  <span>Acceptance Rate</span><span className="font-bold text-slate-900 dark:text-white">{acceptanceRate}%</span>
                </label>
                <input type="range" min={20} max={80} step={1} value={acceptanceRate} onChange={e => setAcceptanceRate(+e.target.value)}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-uis-600" />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1"><span>20%</span><span>80%</span></div>
              </div>
              <div>
                <label className="flex justify-between text-sm text-slate-600 dark:text-slate-300 mb-2">
                  <span>Completion Rate</span><span className="font-bold text-slate-900 dark:text-white">{completionRate}%</span>
                </label>
                <input type="range" min={40} max={95} step={1} value={completionRate} onChange={e => setCompletionRate(+e.target.value)}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-uis-600" />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1"><span>40%</span><span>95%</span></div>
              </div>
              <div>
                <label className="flex justify-between text-sm text-slate-600 dark:text-slate-300 mb-2">
                  <span>Collection Rate</span><span className="font-bold text-slate-900 dark:text-white">{collectionRate}%</span>
                </label>
                <input type="range" min={60} max={99} step={1} value={collectionRate} onChange={e => setCollectionRate(+e.target.value)}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-uis-600" />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1"><span>60%</span><span>99%</span></div>
              </div>
              <div>
                <label className="flex justify-between text-sm text-slate-600 dark:text-slate-300 mb-2">
                  <span>No-Show Rate</span><span className="font-bold text-slate-900 dark:text-white">{noShowRate}%</span>
                </label>
                <input type="range" min={2} max={30} step={1} value={noShowRate} onChange={e => setNoShowRate(+e.target.value)}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-uis-600" />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1"><span>2%</span><span>30%</span></div>
              </div>
            </div>
          </div>

          {/* Plan Selector */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-700 p-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">UIS Health Plan</h3>
            <div className="space-y-2">
              {([['starter','Starter','$299/mo'],['professional','Professional','$599/mo'],['enterprise','Enterprise','$999/mo']] as const).map(([id, name, price]) => (
                <button key={id} onClick={() => setTier(id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${tier === id ? 'border-uis-500 bg-uis-50 dark:bg-uis-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}>
                  <span className={`text-sm font-medium ${tier === id ? 'text-uis-700 dark:text-uis-400' : 'text-slate-600 dark:text-slate-300'}`}>{name}</span>
                  <span className={`text-sm font-bold ${tier === id ? 'text-uis-700 dark:text-uis-400' : 'text-slate-400'}`}>{price}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Middle: Funnel + Recovery Breakdown */}
        <div className="space-y-6">
          {/* Outcome Gap Funnel */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-uis-600" />Your Outcome Gap
            </h3>
            <div className="space-y-3">
              {funnelStages.map((stage, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600 dark:text-slate-300">{stage.label}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{fmtFull(stage.value)}</span>
                  </div>
                  <div className="h-8 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                    <div className={`h-full ${stage.color} rounded-lg transition-all duration-500 flex items-center justify-end pr-2`}
                      style={{ width: `${Math.max(stage.width, 5)}%` }}>
                      <span className="text-[10px] font-bold text-white">{Math.round(stage.width)}%</span>
                    </div>
                  </div>
                  {i < funnelStages.length - 1 && (
                    <div className="flex justify-end">
                      <span className="text-[10px] text-red-500 font-medium">
                        -{fmtFull(funnelStages[i].value - funnelStages[i + 1].value)} leaked
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
              <div className="flex justify-between items-center">
                <span className="text-sm text-red-600 font-medium">Total Monthly Leakage</span>
                <span className="text-lg font-bold text-red-600">{fmtFull(monthlyRev - funnelStages[3].value)}</span>
              </div>
            </div>
          </div>

          {/* Recovery Breakdown */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />UIS Recovery Breakdown
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Acceptance Gap Recovery', value: diagnosedNotAccepted, desc: '15% of unaccepted treatment recovered via AI nudges' },
                { label: 'Completion Gap Recovery', value: acceptedNotCompleted, desc: '25% of stalled treatments pushed through scheduling' },
                { label: 'Collection Gap Recovery', value: completedNotCollected, desc: '40% of unbilled/uncollected recovered via automation' },
                { label: 'No-Show Recovery', value: noShowRecovery, desc: '30% of no-shows prevented via predictive outreach' },
              ].map((item, i) => (
                <div key={i} className="p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-200 dark:border-emerald-700/30">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{item.label}</span>
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">+{fmtFull(item.value)}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-emerald-200 dark:border-emerald-700/30">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Total Monthly Recovery</span>
                <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400">+{fmtFull(totalMonthlyRecovery)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Investment Analysis */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-uis-600" />Investment Analysis
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700/50">
                <span className="text-sm text-slate-500">UIS Health ({tier})</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">-{fmtFull(monthlyCost)}/mo</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700/50">
                <span className="text-sm text-slate-500">Recovered Revenue</span>
                <span className="text-sm font-bold text-emerald-600">+{fmtFull(totalMonthlyRecovery)}/mo</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700/50">
                <span className="text-sm text-slate-500">Net Monthly Gain</span>
                <span className="text-sm font-bold text-emerald-600">+{fmtFull(totalMonthlyRecovery - monthlyCost)}/mo</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700/50">
                <span className="text-sm text-slate-500">Annual Net Gain</span>
                <span className="text-lg font-bold text-emerald-600">+{fmtFull((totalMonthlyRecovery - monthlyCost) * 12)}/yr</span>
              </div>
              <div className="bg-gradient-to-r from-uis-50 to-indigo-50 dark:from-uis-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-uis-200 dark:border-uis-700/30">
                <div className="text-center">
                  <p className="text-4xl font-black text-uis-700 dark:text-uis-400">{roi}%</p>
                  <p className="text-sm font-medium text-uis-600 dark:text-uis-400">Return on Investment</p>
                  <p className="text-xs text-slate-500 mt-1">UIS pays for itself in {paybackDays} days</p>
                </div>
              </div>
            </div>
          </div>

          {/* 12-Month Projection */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-700 p-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">12-Month Projection</h3>
            <div className="space-y-2">
              {[1,3,6,12].map(m => (
                <div key={m} className="flex justify-between items-center py-1.5">
                  <span className="text-xs text-slate-500">Month {m}</span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-emerald-600">+{fmtFull(totalMonthlyRecovery * m)}</span>
                    <span className="text-[10px] text-slate-400 ml-1">recovered</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* What You Get */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-700 p-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">What Powers These Results</h3>
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
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span className="text-xs text-slate-600 dark:text-slate-300">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white flex items-center justify-between">
        <div>
          <p className="text-lg font-bold">Ready to close your Outcome Gap?</p>
          <p className="text-sm text-slate-400">Start recovering {fmtFull(totalMonthlyRecovery)}/month in 48 hours</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-uis-600 rounded-xl text-white font-semibold hover:bg-uis-700 transition-colors">
          Get Started <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
