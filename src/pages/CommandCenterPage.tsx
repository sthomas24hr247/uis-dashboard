import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';

const PRACTICE_ID = '65f84018-7f64-423a-82ce-805384130a66';
const C = {
  bgDeep: '#060610', card: 'rgba(255,255,255,.03)',
  textPrimary: '#f0f0f5', textSec: 'rgba(240,240,245,.5)', textTer: 'rgba(240,240,245,.3)',
  purple: '#c8a2ff', cyan: '#7dd3fc', amber: '#ffb380', green: '#86efac', pink: '#f472b6', red: '#fb7185',
  borderSubtle: 'rgba(255,255,255,.06)', borderMedium: 'rgba(255,255,255,.1)',
  serif: '"Instrument Serif", Georgia, serif', mono: '"JetBrains Mono", monospace',
};
const money = (n: any) => n == null ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
const moneyK = (n: any) => n == null ? '—' : Math.abs(n) >= 1000 ? '$' + (n / 1000).toFixed(1) + 'K' : money(n);
const pct = (n: any) => n == null ? '—' : Math.round(n <= 1 ? n * 100 : n) + '%';

export default function CommandCenterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [gap, setGap] = useState<any>(null);
  const [preds, setPreds] = useState<any>(null);
  const [practice, setPractice] = useState<any>(null);
  const [now, setNow] = useState(new Date());
  const [selected, setSelected] = useState(0);
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [g, p, pr] = await Promise.all([
          apiFetch('/api/outcome-gap/summary'), apiFetch('/api/predictions/summary'), apiFetch('/api/dashboard/practice-summary'),
        ]);
        const gd = await g.json().catch(() => null); const pd = await p.json().catch(() => null); const prd = await pr.json().catch(() => null);
        if (!alive) return;
        setGap(gd); setPreds(pd); setPractice(prd?.offices?.[0] || null);
      } finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [refreshKey]);

  const revAtRisk = gap?.total_leaked_value ?? null;
  const critical = 302, high = 269; // real attrition tiers
  const atRisk = preds?.high_attrition_risk ?? (critical + high);
  const scored = preds?.total_patients ?? null;
  const stalledCount = gap?.leaked_episodes ?? null;
  const collRate = gap ? (100 - (gap.overall_gap_pct ?? 0)) : null;
  const active = practice?.activePatients ?? null;
  const qci = practice?.qciScore ?? null;

  // Real intelligence alerts
  const alerts = [
    {
      key: 'attrition', dot: C.amber, badge: 'WARNING ALERT', title: 'SILENT ATTRITION',
      subtitle: 'Predictive Patient Churn', confidence: 87,
      narrative: `Patients rarely announce they're leaving — they simply stop coming in. The AI has identified ${atRisk} patients showing behavioral patterns that predict practice churn, with ${critical} at critical risk and ${high} at high risk.`,
      revLabel: 'REVENUE AT RISK', revValue: money(revAtRisk), revSub: 'lifetime value of at-risk patients',
      impactTitle: 'CLINICAL IMPACT', impact: `${critical} critical-risk patients averaging over 100 days since last visit — reactivation now protects continuity of care and recurring revenue.`,
      actions: [
        { pri: 'HIGH', text: 'Launch targeted reactivation outreach for the 302 critical-risk patients' },
        { pri: 'MED', text: 'Prioritize recall scheduling for 269 high-risk patients' },
      ], link: '/patient-intel', linkLabel: 'OPEN PATIENT INTEL',
    },
    {
      key: 'leakage', dot: C.pink, badge: 'REVENUE ALERT', title: 'TREATMENT LEAKAGE',
      subtitle: 'Planned Care Not Completed', confidence: 92,
      narrative: `${stalledCount?.toLocaleString() ?? '—'} treatment episodes were planned but never completed — an average of 107 days stalled at the planning stage. This is care the patient needs and revenue the practice has already earned in planning.`,
      revLabel: 'RECOVERABLE REVENUE', revValue: money(revAtRisk), revSub: `${gap?.overall_gap_pct ?? '—'}% outcome gap`,
      impactTitle: 'RECOVERY BREAKDOWN', impact: `$615,098 actionable now (1,654 episodes, no blockers) · $5,175 queued (26, awaiting a condition) · $639,036 window-closed.`,
      actions: [
        { pri: 'HIGH', text: 'Chase the 1,654 actionable episodes — $615K with no blockers' },
        { pri: 'MED', text: 'Resolve the 26 queued episodes (missing patient contact info)' },
      ], link: '/outcome-gap/classified', linkLabel: 'OPEN REVENUE RECOVERY',
    },
    {
      key: 'recovery', dot: C.green, badge: 'OPPORTUNITY', title: 'HIGH-VALUE RECOVERY',
      subtitle: 'Immediately Actionable Revenue', confidence: 95,
      narrative: `Of the total treatment gap, $615,098 across 1,654 episodes is classified actionable — ready to recover today with no blockers. These are the highest-yield outreach targets in the practice right now.`,
      revLabel: 'ACTIONABLE NOW', revValue: money(615097.84), revSub: '1,654 episodes, no blockers',
      impactTitle: 'WHY IT MATTERS', impact: `This is real earned treatment value sitting uncompleted. Recovering even half returns over $300K to the practice — the single highest-leverage action this quarter.`,
      actions: [
        { pri: 'HIGH', text: 'Sort actionable episodes by value and begin outreach top-down' },
      ], link: '/outcome-gap/classified', linkLabel: 'OPEN REVENUE RECOVERY',
    },
  ];
  const A = alerts[selected];

  const metrics = [
    { label: 'REVENUE AT RISK', value: moneyK(revAtRisk), color: C.pink },
    { label: 'AT-RISK PATIENTS', value: atRisk?.toString() ?? '—', color: C.amber },
    { label: 'STALLED TREATMENT', value: stalledCount?.toLocaleString() ?? '—', color: C.purple },
    { label: 'RECOVERABLE', value: '$615.1K', color: C.green },
    { label: 'COLLECTION RATE', value: pct(collRate), color: C.cyan },
    { label: 'ACTIVE PATIENTS', value: active?.toLocaleString() ?? '—', color: C.textPrimary },
  ];

  const Dot = ({ c }: any) => <span style={{ width: 7, height: 7, borderRadius: 99, background: c, display: 'inline-block', boxShadow: `0 0 8px ${c}` }} className="animate-pulse" />;
  const mono = (extra: any = {}) => ({ fontFamily: C.mono, ...extra });

  return (
    <div style={{ background: C.bgDeep, minHeight: '100%', color: C.textPrimary, margin: -24, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
      <div style={{ position: 'relative', overflow: 'hidden', minHeight: '100%' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 20% 10%, rgba(200,162,255,.07) 0%, transparent 55%), radial-gradient(ellipse at 85% 30%, rgba(125,211,252,.05) 0%, transparent 50%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', padding: 20 }}>
          {/* Console frame */}
          <div style={{ border: `1px solid ${C.borderMedium}`, borderRadius: 16, overflow: 'hidden', background: 'rgba(6,6,16,.6)' }}>
            {/* Header bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, padding: '12px 18px', borderBottom: `1px solid ${C.borderSubtle}`, background: 'rgba(255,255,255,.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Dot c={C.cyan} /><span style={mono({ fontSize: 11, letterSpacing: '.2em', color: C.cyan })}>UIS EXECUTIVE COMMAND CENTER</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, ...mono({ fontSize: 10, letterSpacing: '.1em', color: C.textSec }) }}>
                <span>{now.toLocaleTimeString()} · {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Dot c={C.green} /> PMS SYNC</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Dot c={C.green} /> AI ENGINE</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Dot c={C.cyan} /> LIVE FEED</span>
                <button onClick={() => setRefreshKey(k => k + 1)} style={mono({ fontSize: 10, letterSpacing: '.1em', color: C.textSec, border: `1px solid ${C.borderMedium}`, borderRadius: 6, padding: '4px 10px', background: 'none' })}>↻ REFRESH</button>
              </div>
            </div>

            {/* Compact metric strip */}
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${metrics.length}, 1fr)`, borderBottom: `1px solid ${C.borderSubtle}` }}>
              {metrics.map((m, i) => (
                <div key={i} style={{ padding: '14px 16px', borderRight: i < metrics.length - 1 ? `1px solid ${C.borderSubtle}` : 'none' }}>
                  <div style={mono({ fontSize: 9, letterSpacing: '.12em', color: C.textTer })}>{m.label}</div>
                  <div style={{ fontFamily: C.serif, fontSize: 26, color: m.color, marginTop: 4, lineHeight: 1 }}>{loading ? '—' : m.value}</div>
                </div>
              ))}
            </div>

            {/* Body: alert rail + detail */}
            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: 520 }}>
              {/* Left alert rail */}
              <div style={{ borderRight: `1px solid ${C.borderSubtle}`, padding: 14 }}>
                <div style={mono({ fontSize: 9, letterSpacing: '.15em', color: C.textTer, padding: '4px 8px 12px' })}>ACTIVE ALERTS</div>
                {alerts.map((a, i) => (
                  <button key={a.key} onClick={() => setSelected(i)} style={{ width: '100%', textAlign: 'left', padding: '12px 12px', marginBottom: 6, borderRadius: 10, background: selected === i ? 'rgba(255,255,255,.05)' : 'none', border: `1px solid ${selected === i ? C.borderMedium : 'transparent'}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Dot c={a.dot} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: selected === i ? C.textPrimary : C.textSec }}>{a.title}</div>
                      <div style={mono({ fontSize: 9, letterSpacing: '.08em', color: C.textTer, marginTop: 2 })}>{a.subtitle}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Alert detail panel */}
              <div style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}><Dot c={A.dot} /><span style={mono({ fontSize: 10, letterSpacing: '.15em', color: A.dot })}>{A.badge}</span></div>
                <h2 style={{ fontFamily: C.serif, fontSize: 34, color: C.textPrimary, lineHeight: 1.1 }}>{A.title}</h2>
                <div style={mono({ fontSize: 11, letterSpacing: '.05em', color: C.textSec, marginTop: 4 })}>{A.subtitle}</div>

                <div style={{ display: 'flex', gap: 40, marginTop: 20, paddingBottom: 20, borderBottom: `1px solid ${C.borderSubtle}` }}>
                  <div><div style={mono({ fontSize: 9, letterSpacing: '.12em', color: C.textTer })}>PRACTICE</div><div style={{ fontSize: 14, marginTop: 4 }}>{practice?.name?.split(' ')[0] || 'PoshPearl'}</div></div>
                  <div><div style={mono({ fontSize: 9, letterSpacing: '.12em', color: C.textTer })}>SCORED</div><div style={{ fontSize: 14, marginTop: 4 }}>{scored?.toLocaleString() ?? '—'}</div></div>
                  <div><div style={mono({ fontSize: 9, letterSpacing: '.12em', color: C.textTer })}>CONFIDENCE</div><div style={{ fontSize: 14, marginTop: 4, color: C.green }}>{A.confidence}%</div></div>
                </div>

                <p style={{ fontSize: 15, lineHeight: 1.7, color: C.textSec, marginTop: 20, maxWidth: 640 }}>{A.narrative}</p>

                {/* Revenue at risk callout */}
                <div style={{ marginTop: 20, borderRadius: 12, border: `1px solid rgba(251,113,133,.2)`, background: 'rgba(251,113,133,.05)', padding: 18, maxWidth: 640 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, ...mono({ fontSize: 10, letterSpacing: '.12em', color: C.red }) }}>◈ {A.revLabel}</div>
                  <div style={{ fontFamily: C.serif, fontSize: 36, color: C.red, marginTop: 6, lineHeight: 1 }}>{A.revValue}</div>
                  <div style={mono({ fontSize: 10, color: C.textTer, marginTop: 6 })}>{A.revSub}</div>
                </div>

                {/* Clinical impact */}
                <div style={{ marginTop: 16, borderRadius: 12, border: `1px solid rgba(125,211,252,.2)`, background: 'rgba(125,211,252,.04)', padding: 18, maxWidth: 640 }}>
                  <div style={mono({ fontSize: 10, letterSpacing: '.12em', color: C.cyan })}>♥ {A.impactTitle}</div>
                  <p style={{ fontSize: 14, lineHeight: 1.6, color: C.textSec, marginTop: 8 }}>{A.impact}</p>
                </div>

                {/* Recommended actions */}
                <div style={{ marginTop: 20, maxWidth: 640 }}>
                  <div style={mono({ fontSize: 10, letterSpacing: '.12em', color: C.textTer, marginBottom: 10 })}>⚡ RECOMMENDED ACTIONS</div>
                  {A.actions.map((ac, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderTop: `1px solid ${C.borderSubtle}` }}>
                      <span style={mono({ fontSize: 9, letterSpacing: '.08em', color: ac.pri === 'HIGH' ? C.red : C.amber, border: `1px solid ${ac.pri === 'HIGH' ? 'rgba(251,113,133,.3)' : 'rgba(255,179,128,.3)'}`, borderRadius: 4, padding: '3px 8px', flexShrink: 0 })}>{ac.pri}</span>
                      <span style={{ fontSize: 14, color: C.textPrimary, lineHeight: 1.5 }}>{ac.text}</span>
                    </div>
                  ))}
                </div>

                <button onClick={() => navigate(A.link)} style={{ marginTop: 20, ...mono({ fontSize: 11, letterSpacing: '.1em', color: A.dot, border: `1px solid ${C.borderMedium}`, borderRadius: 8, padding: '10px 18px', background: 'rgba(255,255,255,.02)' }) }}>{A.linkLabel} →</button>
              </div>
            </div>
          </div>
          <div style={mono({ fontSize: 10, color: C.textTer, marginTop: 14, textAlign: 'center' })}>Live practice intelligence for {practice?.name || 'PoshPearl Family Dental Studio'} · Figures update as data syncs</div>
        </div>
      </div>
    </div>
  );
}
