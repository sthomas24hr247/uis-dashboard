import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';

const PRACTICE_ID = '65f84018-7f64-423a-82ce-805384130a66';
const C = {
  bgDeep: '#060610', card: 'rgba(255,255,255,.03)',
  textPrimary: '#f0f0f5', textSec: 'rgba(240,240,245,.5)', textTer: 'rgba(240,240,245,.25)',
  purple: '#c8a2ff', cyan: '#7dd3fc', amber: '#ffb380', green: '#86efac', pink: '#f472b6',
  borderSubtle: 'rgba(255,255,255,.06)', borderMedium: 'rgba(255,255,255,.1)',
  serif: '"Instrument Serif", Georgia, serif', mono: '"JetBrains Mono", monospace',
};
function money(n: any) { if (n == null) return '—'; return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n); }
function pct(n: any) { if (n == null) return '—'; const v = n <= 1 ? n * 100 : n; return Math.round(v) + '%'; }

export default function CommandCenterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [gap, setGap] = useState<any>(null);
  const [preds, setPreds] = useState<any>(null);
  const [practice, setPractice] = useState<any>(null);
  const [churn, setChurn] = useState<any[]>([]);
  const [stalled, setStalled] = useState<any[]>([]);
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [g, p, pr, c, s] = await Promise.all([
          apiFetch('/api/outcome-gap/summary'), apiFetch('/api/predictions/summary'),
          apiFetch('/api/dashboard/practice-summary'), apiFetch('/api/predictions/patients?limit=50'),
          apiFetch(`/api/outcome-gap/stalled?practice_id=${PRACTICE_ID}&min_days=1`),
        ]);
        const gd = await g.json().catch(() => null); const pd = await p.json().catch(() => null);
        const prd = await pr.json().catch(() => null); const cd = await c.json().catch(() => ({ predictions: [] }));
        const sd = await s.json().catch(() => ({ stalled: [] }));
        if (!alive) return;
        setGap(gd); setPreds(pd); setPractice(prd?.offices?.[0] || null);
        setChurn((cd.predictions || []).filter((x: any) => x.attrition_risk_score != null).sort((a: any, b: any) => (b.attrition_risk_score || 0) - (a.attrition_risk_score || 0)).slice(0, 6));
        setStalled((sd.stalled || []).sort((a: any, b: any) => (b.plan_value || 0) - (a.plan_value || 0)).slice(0, 6));
      } finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [refreshKey]);
  const revAtRisk = gap?.total_leaked_value ?? null;
  const atRisk = preds?.high_attrition_risk ?? null;
  const collRate = gap ? (100 - (gap.overall_gap_pct ?? 0)) : null;
  const active = practice?.activePatients ?? null;
  const qci = practice?.qciScore ?? null;
  const label: any = { fontFamily: C.mono, fontSize: 10, letterSpacing: '.15em', textTransform: 'uppercase', color: C.textTer };
  const bigNum: any = { fontFamily: C.serif, fontSize: 40, fontWeight: 400, letterSpacing: '-.02em', lineHeight: 1 };
  const Dot = ({ c }: any) => <span style={{ width: 7, height: 7, borderRadius: 99, background: c, display: 'inline-block', boxShadow: `0 0 8px ${c}` }} className="animate-pulse" />;
  return (
    <div style={{ background: C.bgDeep, minHeight: '100%', color: C.textPrimary, margin: -24, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 25% 15%, rgba(200,162,255,.08) 0%, transparent 55%), radial-gradient(ellipse at 80% 40%, rgba(125,211,252,.05) 0%, transparent 50%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', padding: '28px 32px', maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, paddingBottom: 20, borderBottom: `1px solid ${C.borderSubtle}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Dot c={C.cyan} /><span style={{ fontFamily: C.mono, fontSize: 12, letterSpacing: '.2em', color: C.cyan }}>UIS EXECUTIVE COMMAND CENTER</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 22, fontFamily: C.mono, fontSize: 10, letterSpacing: '.1em', color: C.textSec }}>
              <span>{now.toLocaleTimeString()}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Dot c={C.green} /> PMS SYNC</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Dot c={C.green} /> AI ENGINE</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Dot c={C.cyan} /> LIVE FEED</span>
              <button onClick={() => setRefreshKey(k => k + 1)} style={{ fontFamily: C.mono, fontSize: 10, letterSpacing: '.1em', color: C.textSec, border: `1px solid ${C.borderMedium}`, borderRadius: 6, padding: '4px 10px' }}>↻ REFRESH</button>
            </div>
          </div>
          <div style={{ padding: '24px 0 8px' }}>
            <h1 style={{ fontFamily: C.serif, fontSize: 44, fontWeight: 400, letterSpacing: '-.02em', lineHeight: 1 }}>Command <em style={{ fontStyle: 'italic', color: C.cyan }}>Center</em></h1>
            <p style={{ fontFamily: C.mono, fontSize: 11, letterSpacing: '.05em', color: C.textSec, marginTop: 10 }}>{(practice?.name || 'PoshPearl Family Dental Studio')} · {practice?.location || 'Yucaipa, CA'} · DENTRIX ASCEND · CONNECTED</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, marginTop: 24 }}>
            <Tile label="REVENUE AT RISK" value={money(revAtRisk)} sub="Recoverable treatment gap" color={C.pink} loading={loading} bigNum={bigNum} labelStyle={label} />
            <Tile label="AT-RISK PATIENTS" value={atRisk?.toString() ?? '—'} sub="High attrition risk" color={C.amber} loading={loading} bigNum={bigNum} labelStyle={label} />
            <Tile label="COLLECTION RATE" value={pct(collRate)} sub="Collected / planned" color={C.green} loading={loading} bigNum={bigNum} labelStyle={label} />
            <Tile label="ACTIVE PATIENTS" value={active?.toLocaleString() ?? '—'} sub={qci ? `QCI ${qci}` : 'Practice-wide'} color={C.cyan} loading={loading} bigNum={bigNum} labelStyle={label} />
          </div>
          <div style={{ fontFamily: C.mono, fontSize: 10, letterSpacing: '.2em', color: C.textTer, margin: '32px 0 14px' }}>TODAY'S SIGNAL SNAPSHOT</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
            <Signal title="RECOVERABLE REVENUE" value={money(gap?.total_leaked_value)} detail={`${gap?.leaked_episodes ?? '—'} treatment episodes leaked`} color={C.pink} onClick={() => navigate('/outcome-gap/classified')} action="REVENUE RECOVERY" loading={loading} labelStyle={label} bigNum={bigNum} />
            <Signal title="PATIENT ATTRITION" value={atRisk ? `${atRisk} at risk` : '—'} detail={preds ? `of ${preds.total_patients?.toLocaleString()} scored patients` : ''} color={C.amber} onClick={() => navigate('/patient-intel')} action="PATIENT INTEL" loading={loading} labelStyle={label} bigNum={bigNum} />
            <Signal title="TREATMENT LEAKAGE" value={gap?.leaked_episodes ? `${gap.leaked_episodes.toLocaleString()} stalled` : '—'} detail={gap ? `${gap.overall_gap_pct}% outcome gap` : ''} color={C.purple} onClick={() => navigate('/outcome-gap')} action="OUTCOME GAP" loading={loading} labelStyle={label} bigNum={bigNum} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 16, marginTop: 28, paddingBottom: 40 }}>
            <Feed title="PATIENTS MOST AT RISK" icon="!" accent={C.pink} loading={loading} empty="No at-risk patients found.">
              {churn.map((p, i) => (<FeedRow key={i} onClick={() => navigate('/patient-intel')} name={`${p.first_name} ${p.last_name}`} sub={`${p.days_since_last_visit ?? '—'} days since last visit`} right={pct(p.attrition_risk_score)} rightColor={C.pink} />))}
            </Feed>
            <Feed title="HIGHEST-VALUE STALLED TREATMENT" icon="$" accent={C.amber} loading={loading} empty="No stalled treatment found.">
              {stalled.map((e, i) => (<FeedRow key={i} onClick={() => navigate('/outcome-gap/classified')} name={`${e.first_name} ${e.last_name}`} sub={`Stalled at ${e.stalled_at_stage} · ${e.days_stalled ?? '—'} days`} right={money(e.plan_value)} rightColor={C.textPrimary} />))}
            </Feed>
          </div>
        </div>
      </div>
    </div>
  );
}
function Tile({ label, value, sub, color, loading, bigNum, labelStyle }: any) {
  return (<div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 16, padding: 22, position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: color, boxShadow: `0 0 16px ${color}`, opacity: .8 }} />
    <div style={labelStyle}>{label}</div><div style={{ ...bigNum, color, marginTop: 12 }}>{loading ? '—' : value}</div>
    <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: 'rgba(240,240,245,.35)', marginTop: 8 }}>{sub}</div></div>);
}
function Signal({ title, value, detail, color, onClick, action, loading, labelStyle, bigNum }: any) {
  return (<div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 16, padding: 22, display: 'flex', flexDirection: 'column' }}>
    <div style={{ ...labelStyle, color }}>{title}</div><div style={{ ...bigNum, fontSize: 30, marginTop: 10, color: '#f0f0f5' }}>{loading ? '—' : value}</div>
    <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: 'rgba(240,240,245,.4)', marginTop: 8, flex: 1 }}>{detail}</div>
    <button onClick={onClick} style={{ marginTop: 14, fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: '.1em', color, textAlign: 'left', background: 'none' }}>{action} →</button></div>);
}
function Feed({ title, icon, accent, loading, empty, children }: any) {
  const has = Array.isArray(children) ? children.length > 0 : !!children;
  return (<div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 16, overflow: 'hidden' }}>
    <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ color: accent }}>{icon}</span><span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: '.12em', color: '#f0f0f5' }}>{title}</span></div>
    <div>{loading ? <div style={{ padding: 24, textAlign: 'center', fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: 'rgba(240,240,245,.4)' }}>LOADING…</div> : !has ? <div style={{ padding: 24, textAlign: 'center', fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: 'rgba(240,240,245,.4)' }}>{empty}</div> : children}</div></div>);
}
function FeedRow({ name, sub, right, rightColor, onClick }: any) {
  return (<button onClick={onClick} style={{ width: '100%', textAlign: 'left', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none' }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.03)')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
    <div><div style={{ fontSize: 13, color: '#f0f0f5', fontWeight: 500 }}>{name}</div><div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: 'rgba(240,240,245,.35)', marginTop: 2 }}>{sub}</div></div>
    <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 13, fontWeight: 600, color: rightColor }}>{right}</div></button>);
}
