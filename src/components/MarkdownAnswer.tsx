// src/components/MarkdownAnswer.tsx
// Renders an Ask DentaMind answer: headings, lists, tables with risk badges, and an
// automatic bar chart above any table that has a dollar column. Raw HTML is never rendered.
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

const EMOJI = /[\p{Extended_Pictographic}\u{FE0F}\u{200D}\u{20E3}]/gu;

type Tier = { label: string; badge: string; color: string };
const TIERS: Record<string, Tier> = {
  critical: { label: 'Critical', badge: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-100', color: '#E24B4A' },
  high: { label: 'High', badge: 'bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-100', color: '#BA7517' },
  medium: { label: 'Medium', badge: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100', color: '#888780' },
  moderate: { label: 'Moderate', badge: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100', color: '#888780' },
  low: { label: 'Low', badge: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-100', color: '#3B6D11' },
};
const tierOf = (s: string): Tier | null => TIERS[s.trim().toLowerCase()] || null;
const TIER_ORDER = ['critical', 'high', 'medium', 'moderate', 'low'];
const findTier = (s: string): Tier | null => {
  const m = s.toLowerCase().match(/\b(critical|high|medium|moderate|low)\b/);
  return m ? TIERS[m[1]] : null;
};

function textOf(node: any): string {
  if (!node) return '';
  if (node.type === 'text') return node.value || '';
  return (node.children || []).map(textOf).join('');
}

function money(s: string): number | null {
  if (!s.includes('$')) return null;
  if (/\d\s*[\u2013\u2014-]\s*\$?\d/.test(s)) return null;
  const m = s.replace(/[,\s~*]/g, '').match(/\$(-?\d+(?:\.\d+)?)([kKmM])?/);
  if (!m) return null;
  const n = parseFloat(m[1]) * (m[2] ? (m[2].toLowerCase() === 'm' ? 1e6 : 1e3) : 1);
  return isFinite(n) ? n : null;
}

function rowsOf(table: any): string[][] {
  const out: string[][] = [];
  const walk = (n: any) => {
    if (!n || !n.children) return;
    if (n.tagName === 'tr') {
      out.push(n.children.filter((c: any) => c.tagName === 'th' || c.tagName === 'td').map((c: any) => textOf(c).trim()));
      return;
    }
    n.children.forEach(walk);
  };
  walk(table);
  return out;
}

const fmt = (n: number) =>
  n >= 1000 ? '$' + (Math.round(n / 100) / 10).toLocaleString() + 'K' : '$' + Math.round(n).toLocaleString();

function TableChart({ node }: { node: any }) {
  const rows = rowsOf(node);
  if (rows.length < 3) return null;
  const [head, ...body] = rows;
  const moneyCol = head.findIndex((_, i) => i > 0 && body.filter(r => money(r[i] || '') !== null).length >= 2);
  if (moneyCol < 0) return null;
  const hasTiers = (i: number) => body.filter(r => findTier(r[i] || '') !== null).length >= Math.ceil(body.length / 2);
  const pick = (re: RegExp) => head.findIndex((h, i) => i !== moneyCol && re.test(h) && hasTiers(i));
  let riskCol = pick(/cancel|no-?show|risk/i);
  if (riskCol < 0) riskCol = pick(/tier|severity|priority|level/i);
  if (riskCol < 0) riskCol = head.findIndex((_, i) => i > 0 && i !== moneyCol && hasTiers(i));
  const data = body
    .map(r => {
      const v = money(r[moneyCol] || '');
      const t = riskCol >= 0 ? findTier(r[riskCol] || '') : null;
      return v === null ? null : { name: r[0], value: v, tier: t, label: fmt(v) + (t ? ' · ' + t.label : '') };
    })
    .filter(Boolean)
    .slice(0, 12) as { name: string; value: number; tier: Tier | null; label: string }[];
  if (data.length < 3 || data.length < body.length) return null;
  const tiers = Array.from(new Set(data.map(d => d.tier).filter(Boolean))) as Tier[];
  tiers.sort((a, b) => TIER_ORDER.indexOf(a.label.toLowerCase()) - TIER_ORDER.indexOf(b.label.toLowerCase()));
  return (
    <figure className="my-3 text-slate-600 dark:text-slate-300" role="img" aria-label={`Bar chart of ${head[moneyCol]} by ${head[0]}`}>
      <figcaption className="text-xs font-medium mb-1">{head[moneyCol]} by {head[0].toLowerCase()}{riskCol >= 0 ? `, colored by ${head[riskCol].toLowerCase()}` : ''}</figcaption>
      <ResponsiveContainer width="100%" height={data.length * 30 + 16}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 110, bottom: 4, left: 0 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: 'currentColor' }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v: any) => fmt(Number(v))} cursor={{ fill: 'rgba(148,163,184,0.15)' }} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive={false}>
            {data.map((d, i) => <Cell key={i} fill={d.tier ? d.tier.color : '#14b8a6'} />)}
            <LabelList dataKey="label" position="right" style={{ fontSize: 11, fill: 'currentColor' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {tiers.length > 0 && (
        <div className="flex flex-wrap gap-3 text-xs mt-1">
          {tiers.map(t => (
            <span key={t.label} className="inline-flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: t.color }} />
              {t.label}
            </span>
          ))}
        </div>
      )}
    </figure>
  );
}

function TableCards({ rows }: { rows: string[][] }) {
  const [head, ...body] = rows;
  const has = (i: number) => body.filter(r => findTier(r[i] || '') !== null).length >= Math.ceil(body.length / 2);
  const pick = (re: RegExp) => head.findIndex((h, i) => i > 0 && re.test(h) && has(i));
  let tierCol = pick(/cancel|no-?show|risk/i);
  if (tierCol < 0) tierCol = pick(/tier|severity|priority|level/i);
  if (tierCol < 0) tierCol = head.findIndex((_, i) => i > 0 && has(i));
  return (
    <div className="my-2 space-y-2" role="list">
      {body.map((r, idx) => {
        const t = tierCol >= 0 ? findTier(r[tierCol] || '') : null;
        return (
          <div key={idx} role="listitem" className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/40 px-3 py-2">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{r[0]}</span>
              {t && <span className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium ${t.badge}`}>{t.label}</span>}
            </div>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              {head.slice(1).map((h, j) => {
                const v = (r[j + 1] || '').trim();
                if (!v || v === '\u2014' || v === '-') return null;
                if (j + 1 === tierCol && tierOf(v)) return null;
                const cellTier = tierOf(v);
                return (
                  <div key={j} className="min-w-0">
                    <dt className="text-slate-500 dark:text-slate-400">{h}</dt>
                    <dd className="text-slate-800 dark:text-slate-100 break-words">
                      {cellTier ? <span className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-medium ${cellTier.badge}`}>{cellTier.label}</span> : v}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
        );
      })}
    </div>
  );
}

const heading = 'font-semibold text-slate-900 dark:text-white';
const components: Components = {
  h1: ({ children }) => <h3 className={`text-base ${heading} mt-3 mb-2`}>{children}</h3>,
  h2: ({ children }) => <h4 className={`text-sm ${heading} mt-4 mb-1.5`}>{children}</h4>,
  h3: ({ children }) => <h5 className={`text-sm ${heading} mt-3 mb-1`}>{children}</h5>,
  h4: ({ children }) => <h6 className={`text-sm ${heading} mt-3 mb-1`}>{children}</h6>,
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
  li: ({ children }) => <li className="pl-0.5">{children}</li>,
  strong: ({ children }) => <strong className={heading}>{children}</strong>,
  hr: () => <hr className="my-3 border-slate-200 dark:border-slate-700" />,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-teal-700 dark:text-teal-400 underline">{children}</a>
  ),
  blockquote: ({ children }) => <blockquote className="border-l-2 border-slate-300 dark:border-slate-600 pl-3 my-2">{children}</blockquote>,
  code: ({ children }) => <code className="px-1 rounded bg-slate-200 dark:bg-slate-700 text-[12px]">{children}</code>,
  table: ({ node, children }) => {
    const rows = rowsOf(node);
    const wide = rows.length > 1 && (rows[0].length > 4 || (rows[0].length === 4 && rows.slice(1).some(r => r.some(c => money(c) !== null))));
    return (
      <>
        <TableChart node={node} />
        {wide ? (
          <TableCards rows={rows} />
        ) : (
          <div className="my-2 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
            <table className="w-full text-xs border-collapse">{children}</table>
          </div>
        )}
      </>
    );
  },
  thead: ({ children }) => <thead className="bg-slate-200/70 dark:bg-slate-700/60">{children}</thead>,
  th: ({ children }) => <th className="text-left font-semibold px-2.5 py-1.5 whitespace-nowrap">{children}</th>,
  td: ({ node, children }) => {
    const t = tierOf(textOf(node));
    return (
      <td className="px-2.5 py-1.5 border-t border-slate-200 dark:border-slate-700 align-top">
        {t ? <span className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-medium ${t.badge}`}>{t.label}</span> : children}
      </td>
    );
  },
};

export default function MarkdownAnswer({ content }: { content: string }) {
  if (!content) return null;
  return (
    <div className="min-w-0 break-words">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content.replace(EMOJI, '')}
      </ReactMarkdown>
    </div>
  );
}
