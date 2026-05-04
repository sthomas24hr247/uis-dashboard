// =============================================================================
// OutcomeGapClassifiedPage.tsx — v2 (matches real API shape)
// Wires to:
//   GET /api/outcome-gap/classified         — returns {summary, queued_breakdown, total_episodes, ...}
//   GET /api/outcome-gap/missing-contact    — KPI tile detail
// Drop at: src/pages/OutcomeGapClassifiedPage.tsx
// =============================================================================
import { useEffect, useMemo, useState } from "react";
import { useJurisdiction } from "../context/JurisdictionContext";

const API_URL = import.meta.env.VITE_API_URL?.replace('/graphql', '') || 'https://api.uishealth.com';



// ─── Types matching the actual API contract ──────────────────────────────────
type Bucket = "actionable" | "queued" | "structural" | "unrecoverable";

// Classifier vocabulary (source of truth) — NOT the seed's invented names
type QueuedReason =
  | "missing_contact_info"
  | "awaiting_event_trigger"
  | "recent_outreach_cooldown"
  | "low_probability";

interface Episode {
  id: string;
  practice_id: string;
  patient_id: string;
  first_name?: string | null;
  last_name?: string | null;
  plan_value: number | null;
  current_stage?: string | null;
  classification_bucket: Bucket;
  queued_reason?: QueuedReason | null;
  cooldown_expires?: string | null;
  last_classified_at?: string | null;
  stalled_at_stage?: string | null;
  stalled_since?: string | null;
  detected_at?: string | null;
  has_contact_channel?: number | null;
}

interface ClassifiedResponse {
  summary: Record<Bucket, { count: number; total_value: number; episodes: Episode[] }>;
  queued_breakdown: Record<QueuedReason, Episode[]>;
  total_episodes: number;
  unclassified: number;
  generated_at: string;
}

interface MissingContactResponse {
  total_value?: number;
  episode_count?: number;
  patient_count?: number;
  patients?: Array<{
    id: string;
    first_name: string | null;
    last_name: string | null;
    practice_id: string;
    episode_count: number;
    total_value: number;
  }>;
}

// ─── Bucket metadata ──────────────────────────────────────────────────────────
const BUCKET_META: Record<
  Bucket,
  {
    label: string;
    subtitle: string;
    accent: string;
    accentSoft: string;
    textAccent: string;
    order: number;
  }
> = {
  actionable: {
    label: "Actionable",
    subtitle: "Ready to recover — no blockers",
    accent: "#10b981",
    accentSoft: "rgba(16, 185, 129, 0.08)",
    textAccent: "#34d399",
    order: 1,
  },
  queued: {
    label: "Queued",
    subtitle: "Blocked — waiting on a condition",
    accent: "#f59e0b",
    accentSoft: "rgba(245, 158, 11, 0.08)",
    textAccent: "#fbbf24",
    order: 2,
  },
  structural: {
    label: "Structural",
    subtitle: "Pattern detected — systemic, not per-patient",
    accent: "#8b5cf6",
    accentSoft: "rgba(139, 92, 246, 0.08)",
    textAccent: "#a78bfa",
    order: 3,
  },
  unrecoverable: {
    label: "Unrecoverable",
    subtitle: "Window closed — learn, don't chase",
    accent: "#6b7280",
    accentSoft: "rgba(107, 114, 128, 0.08)",
    textAccent: "#9ca3af",
    order: 4,
  },
};

// Classifier-native reason labels
const QUEUED_REASON_LABEL: Record<QueuedReason, string> = {
  missing_contact_info: "Missing contact info",
  awaiting_event_trigger: "Awaiting event trigger",
  recent_outreach_cooldown: "Outreach cooldown",
  low_probability: "Low recovery probability",
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function OutcomeGapClassifiedPage() {
  const { jurisdiction } = useJurisdiction();
  const currencySymbol = jurisdiction?.currency_symbol || "$";
  const currencyCode = jurisdiction?.currency || "USD";

  const [data, setData] = useState<ClassifiedResponse | null>(null);
  const [missingContact, setMissingContact] = useState<MissingContactResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeBucket, setActiveBucket] = useState<Bucket>("actionable");
  const [runningClassifier, setRunningClassifier] = useState(false);

  const fmtCurrency = (v: number | null | undefined) => {
    const n = v ?? 0;
    return `${currencySymbol}${n.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const fmtCurrencyCompact = (v: number | null | undefined) => {
    const n = v ?? 0;
    if (n >= 1_000_000) return `${currencySymbol}${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${currencySymbol}${(n / 1_000).toFixed(1)}K`;
    return fmtCurrency(n);
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("uis_token") || "";
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      const [classifiedRes, mcRes] = await Promise.all([
        fetch(`${API_URL}/api/outcome-gap/classified`, { headers }),
        fetch(`${API_URL}/api/outcome-gap/missing-contact`, { headers }),
      ]);

      if (!classifiedRes.ok) throw new Error(`classified: ${classifiedRes.status}`);
      const classified = await classifiedRes.json();
      setData(classified);

      if (mcRes.ok) {
        const mc = await mcRes.json();
        setMissingContact(mc);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load outcome gap data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runClassifier = async () => {
    setRunningClassifier(true);
    try {
      const token = localStorage.getItem("uis_token") || "";
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      await fetch(`${API_URL}/api/outcome-gap/classify-all`, {
        method: "POST",
        headers,
        body: JSON.stringify({}),
      });
      await load();
    } catch {
      // fall through to reload error if it fails
    } finally {
      setRunningClassifier(false);
    }
  };

  // Compute bucket card data from API response
  const bucketSummary = useMemo(() => {
    if (!data) return [];
    return (Object.keys(BUCKET_META) as Bucket[])
      .map((b) => ({
        bucket: b,
        meta: BUCKET_META[b],
        count: data.summary?.[b]?.count ?? 0,
        value: data.summary?.[b]?.total_value ?? 0,
      }))
      .sort((a, b) => a.meta.order - b.meta.order);
  }, [data]);

  // Grand totals — API provides total_episodes but not a grand total value.
  // Sum it client-side.
  const grandTotal = useMemo(() => {
    if (!data) return { count: 0, value: 0 };
    const sums = (Object.keys(BUCKET_META) as Bucket[]).reduce(
      (acc, b) => {
        acc.count += data.summary?.[b]?.count ?? 0;
        acc.value += data.summary?.[b]?.total_value ?? 0;
        return acc;
      },
      { count: 0, value: 0 }
    );
    return sums;
  }, [data]);

  // Queued breakdown: API returns { reason: Episode[] }. We compute count + total.
  const queuedBreakdown = useMemo(() => {
    if (!data?.queued_breakdown) return null;
    const out: Record<QueuedReason, { count: number; total_value: number }> = {
      missing_contact_info: { count: 0, total_value: 0 },
      awaiting_event_trigger: { count: 0, total_value: 0 },
      recent_outreach_cooldown: { count: 0, total_value: 0 },
      low_probability: { count: 0, total_value: 0 },
    };
    (Object.keys(out) as QueuedReason[]).forEach((reason) => {
      const eps = data.queued_breakdown[reason] || [];
      out[reason].count = eps.length;
      out[reason].total_value = eps.reduce((sum, e) => sum + (e.plan_value ?? 0), 0);
    });
    return out;
  }, [data]);

  const activeEpisodes: Episode[] = data?.summary?.[activeBucket]?.episodes ?? [];

  return (
    <div className="ogc-root">
      <style>{styles}</style>

      {/* Header */}
      <header className="ogc-header">
        <div className="ogc-header-left">
          <div className="ogc-eyebrow">OUTCOME GAP · CLASSIFIED</div>
          <h1 className="ogc-title">Revenue Recovery, by Bucket</h1>
          <p className="ogc-subtitle">
            Every stalled episode, classified into one of four action categories.
            {" "}
            <span className="ogc-subtitle-strong">
              Actionable is what you chase today. Structural is what you redesign. Unrecoverable is what you learn from.
            </span>
          </p>
        </div>
        <div className="ogc-header-right">
          <div className="ogc-kpi-big">
            <div className="ogc-kpi-big-label">Total Gap</div>
            <div className="ogc-kpi-big-value">{fmtCurrencyCompact(grandTotal.value)}</div>
            <div className="ogc-kpi-big-meta">
              {grandTotal.count.toLocaleString()} episodes · {currencyCode}
            </div>
          </div>
          <button
            className="ogc-btn-run"
            onClick={runClassifier}
            disabled={runningClassifier || loading}
          >
            {runningClassifier ? "Running…" : "Re-run Classifier"}
          </button>
        </div>
      </header>

      {error && (
        <div className="ogc-error">
          Could not load classification data: {error}. Check that the API is on
          v47+ and that <code>/api/outcome-gap/classified</code> is reachable.
        </div>
      )}

      {/* Bucket summary grid */}
      <section className="ogc-bucket-grid">
        {bucketSummary.map(({ bucket, meta, count, value }) => {
          const isActive = bucket === activeBucket;
          const pct = grandTotal.value > 0 ? (value / grandTotal.value) * 100 : 0;
          return (
            <button
              key={bucket}
              className={`ogc-bucket-card ${isActive ? "is-active" : ""}`}
              onClick={() => setActiveBucket(bucket)}
              style={
                {
                  "--accent": meta.accent,
                  "--accent-soft": meta.accentSoft,
                  "--accent-text": meta.textAccent,
                } as React.CSSProperties
              }
            >
              <div className="ogc-bucket-top">
                <span className="ogc-bucket-dot" />
                <span className="ogc-bucket-label">{meta.label}</span>
                <span className="ogc-bucket-count">{count}</span>
              </div>
              <div className="ogc-bucket-value">{fmtCurrencyCompact(value)}</div>
              <div className="ogc-bucket-sub">{meta.subtitle}</div>
              <div className="ogc-bucket-bar">
                <div className="ogc-bucket-bar-fill" style={{ width: `${pct}%` }} />
              </div>
              <div className="ogc-bucket-pct">{pct.toFixed(0)}% of total gap</div>
            </button>
          );
        })}
      </section>

      {/* Queued breakdown (only when queued bucket is active) */}
      {activeBucket === "queued" && queuedBreakdown && (
        <section className="ogc-queued-breakdown">
          <div className="ogc-section-title">Queued Breakdown — why these are blocked</div>
          <div className="ogc-queued-grid">
            {(Object.keys(QUEUED_REASON_LABEL) as QueuedReason[]).map((reason) => {
              const row = queuedBreakdown[reason];
              const isMC = reason === "missing_contact_info";
              const isEmpty = !row || row.count === 0;
              return (
                <div
                  key={reason}
                  className={`ogc-queued-tile ${isMC ? "is-mc" : ""} ${isEmpty ? "is-empty" : ""}`}
                >
                  <div className="ogc-queued-reason">{QUEUED_REASON_LABEL[reason]}</div>
                  <div className="ogc-queued-value">{fmtCurrencyCompact(row?.total_value ?? 0)}</div>
                  <div className="ogc-queued-count">
                    {row?.count ?? 0} {(row?.count ?? 0) === 1 ? "episode" : "episodes"}
                  </div>
                  {isMC && missingContact?.patient_count != null && (
                    <div className="ogc-mc-extra">
                      {missingContact.patient_count} unique patients · reconnect to unlock
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Active bucket detail table */}
      <section className="ogc-detail">
        <div className="ogc-detail-header">
          <div className="ogc-section-title">
            {BUCKET_META[activeBucket].label} Episodes
          </div>
          <div className="ogc-detail-meta">
            Showing {activeEpisodes.length} of {data?.summary?.[activeBucket]?.count ?? 0}
          </div>
        </div>

        {loading ? (
          <div className="ogc-loading">Loading episodes…</div>
        ) : activeEpisodes.length === 0 ? (
          <div className="ogc-empty">
            No episodes in this bucket.
          </div>
        ) : (
          <div className="ogc-table-wrap">
            <table className="ogc-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Stage</th>
                  <th className="ogc-num">Plan Value</th>
                  <th>Stalled At</th>
                  <th>Stalled Since</th>
                  {activeBucket === "queued" && <th>Reason</th>}
                  {activeBucket === "queued" && <th>Cooldown</th>}
                </tr>
              </thead>
              <tbody>
                {activeEpisodes.map((ep) => {
                  const patientName =
                    ep.first_name && ep.last_name
                      ? `${ep.first_name} ${ep.last_name}`
                      : `Patient ${ep.patient_id.slice(0, 8)}`;
                  const stalledSince = ep.stalled_since
                    ? new Date(ep.stalled_since).toLocaleDateString()
                    : "—";
                  return (
                    <tr key={ep.id}>
                      <td className="ogc-patient">
                        <span>{patientName}</span>
                        {ep.has_contact_channel === 0 && (
                          <span className="ogc-pill ogc-pill-warn">no contact</span>
                        )}
                      </td>
                      <td className="ogc-mono-small">{ep.current_stage ?? "—"}</td>
                      <td className="ogc-num ogc-mono">{fmtCurrency(ep.plan_value)}</td>
                      <td>{ep.stalled_at_stage ?? "—"}</td>
                      <td className="ogc-mono-small">{stalledSince}</td>
                      {activeBucket === "queued" && (
                        <td>
                          {ep.queued_reason ? (
                            <span className="ogc-pill ogc-pill-queued">
                              {QUEUED_REASON_LABEL[ep.queued_reason]}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                      )}
                      {activeBucket === "queued" && (
                        <td className="ogc-mono-small">
                          {ep.cooldown_expires
                            ? new Date(ep.cooldown_expires).toLocaleDateString()
                            : "—"}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = `
.ogc-root {
  min-height: 100%;
  padding: 32px 40px 64px;
  color: #f0f0f5;
  font-family: 'Space Grotesk', system-ui, -apple-system, sans-serif;
  background: radial-gradient(ellipse at top, #0c0c1a 0%, #060610 60%);
}

.ogc-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 40px;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.ogc-header-left { max-width: 720px; }
.ogc-eyebrow {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.18em;
  color: #7b7b8f;
  margin-bottom: 12px;
}
.ogc-title {
  font-size: 34px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: #f0f0f5;
  margin: 0 0 12px;
}
.ogc-subtitle {
  font-size: 14px;
  line-height: 1.65;
  color: #a0a0b5;
  margin: 0;
}
.ogc-subtitle-strong { color: #c8c8d8; }

.ogc-header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}
.ogc-kpi-big { text-align: right; }
.ogc-kpi-big-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.16em;
  color: #7b7b8f;
  margin-bottom: 4px;
}
.ogc-kpi-big-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 30px;
  font-weight: 600;
  color: #f0f0f5;
  line-height: 1;
}
.ogc-kpi-big-meta {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: #7b7b8f;
  margin-top: 6px;
}
.ogc-btn-run {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1);
  color: #f0f0f5;
  padding: 10px 18px;
  border-radius: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: all 160ms ease;
}
.ogc-btn-run:hover:not(:disabled) {
  background: rgba(255,255,255,0.08);
  border-color: rgba(255,255,255,0.2);
}
.ogc-btn-run:disabled { opacity: 0.5; cursor: not-allowed; }

.ogc-error {
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 24px;
  font-size: 13px;
  font-family: 'JetBrains Mono', monospace;
}
.ogc-error code {
  background: rgba(0,0,0,0.3);
  padding: 1px 6px;
  border-radius: 3px;
}

.ogc-bucket-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}
@media (max-width: 1100px) {
  .ogc-bucket-grid { grid-template-columns: repeat(2, 1fr); }
}

.ogc-bucket-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px;
  padding: 20px 22px;
  text-align: left;
  cursor: pointer;
  transition: all 200ms ease;
  position: relative;
  overflow: hidden;
  font-family: inherit;
  color: inherit;
}
.ogc-bucket-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--accent-soft);
  opacity: 0;
  transition: opacity 200ms ease;
  pointer-events: none;
}
.ogc-bucket-card:hover::before { opacity: 1; }
.ogc-bucket-card:hover {
  border-color: rgba(255,255,255,0.18);
  transform: translateY(-2px);
}
.ogc-bucket-card.is-active {
  border-color: var(--accent);
  background: var(--accent-soft);
  box-shadow: 0 0 0 1px var(--accent), 0 12px 32px -12px var(--accent);
}
.ogc-bucket-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  position: relative;
  z-index: 1;
}
.ogc-bucket-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 12px var(--accent);
}
.ogc-bucket-label {
  font-size: 13px;
  font-weight: 500;
  color: #f0f0f5;
  letter-spacing: 0.02em;
}
.ogc-bucket-count {
  margin-left: auto;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--accent-text);
  background: rgba(0,0,0,0.25);
  padding: 2px 8px;
  border-radius: 4px;
}
.ogc-bucket-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 26px;
  font-weight: 600;
  color: #f0f0f5;
  line-height: 1;
  margin-bottom: 6px;
  position: relative;
  z-index: 1;
}
.ogc-bucket-sub {
  font-size: 11px;
  color: #8a8aa0;
  margin-bottom: 14px;
  position: relative;
  z-index: 1;
  line-height: 1.4;
}
.ogc-bucket-bar {
  height: 2px;
  background: rgba(255,255,255,0.06);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 6px;
  position: relative;
  z-index: 1;
}
.ogc-bucket-bar-fill {
  height: 100%;
  background: var(--accent);
  transition: width 400ms ease;
}
.ogc-bucket-pct {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: #7b7b8f;
  letter-spacing: 0.04em;
  position: relative;
  z-index: 1;
}

.ogc-queued-breakdown { margin-bottom: 32px; }
.ogc-section-title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.16em;
  color: #7b7b8f;
  margin-bottom: 14px;
}
.ogc-queued-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
@media (max-width: 1100px) {
  .ogc-queued-grid { grid-template-columns: repeat(2, 1fr); }
}
.ogc-queued-tile {
  background: rgba(245, 158, 11, 0.04);
  border: 1px solid rgba(245, 158, 11, 0.15);
  border-radius: 6px;
  padding: 16px;
  transition: opacity 200ms ease;
}
.ogc-queued-tile.is-empty { opacity: 0.42; }
.ogc-queued-tile.is-mc {
  background: rgba(239, 68, 68, 0.06);
  border-color: rgba(239, 68, 68, 0.25);
}
.ogc-queued-reason {
  font-size: 12px;
  color: #c8c8d8;
  margin-bottom: 8px;
  line-height: 1.3;
}
.ogc-queued-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 20px;
  font-weight: 600;
  color: #f0f0f5;
  line-height: 1;
  margin-bottom: 4px;
}
.ogc-queued-count {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: #fbbf24;
}
.ogc-queued-tile.is-mc .ogc-queued-count { color: #fca5a5; }
.ogc-mc-extra {
  font-size: 11px;
  color: #a0a0b5;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255,255,255,0.06);
}

.ogc-detail {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 8px;
  padding: 20px 24px 24px;
}
.ogc-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 16px;
}
.ogc-detail-meta {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: #7b7b8f;
}
.ogc-loading, .ogc-empty {
  padding: 40px;
  text-align: center;
  color: #7b7b8f;
  font-size: 13px;
}
.ogc-table-wrap { overflow-x: auto; }
.ogc-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.ogc-table th {
  text-align: left;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.14em;
  color: #7b7b8f;
  font-weight: 500;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  text-transform: uppercase;
}
.ogc-table td {
  padding: 12px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  color: #d0d0dc;
}
.ogc-table tbody tr:hover { background: rgba(255,255,255,0.02); }
.ogc-table .ogc-num { text-align: right; }
.ogc-mono { font-family: 'JetBrains Mono', monospace; font-size: 12px; }
.ogc-mono-small { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #9a9ab0; }
.ogc-patient {
  color: #f0f0f5;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}
.ogc-pill {
  display: inline-block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  padding: 2px 7px;
  border-radius: 3px;
  letter-spacing: 0.04em;
  white-space: nowrap;
}
.ogc-pill-warn {
  background: rgba(239, 68, 68, 0.12);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.3);
}
.ogc-pill-queued {
  background: rgba(245, 158, 11, 0.12);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
}
`;
