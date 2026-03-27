import { useState, useEffect, useCallback, useMemo } from "react";
import { MOCK_FILED_CLAIMS, MOCK_PATIENTS, getPayor, fmtUSD, PAYOR_RULES, type FiledClaim } from "@/data/rcm-data";
import { ClaimBadge } from "@/components/claims/Badge";
import { StatCard } from "@/components/claims/StatCard";

// ── Mock ERA/EOB Feed ────────────────────────────────────────────────
interface ERARecord {
  id: string;
  payerId: string;
  payerName: string;
  checkNumber: string;
  checkDate: string;
  claimTrackingId: string;
  patientId: string;
  paidAmount: number;
  billedAmount: number;
  adjustmentCodes: string[];
  status: "pending" | "matched" | "unmatched";
  receivedAt: string;
}

const INCOMING_ERA_QUEUE: Omit<ERARecord, "status" | "receivedAt">[] = [
  { id: "ERA-301", payerId: "delta-ppo", payerName: "Delta Dental PPO", checkNumber: "CHK-884210", checkDate: "2026-03-18", claimTrackingId: "CLM-2026-00287", patientId: "PT-1002", paidAmount: 1048, billedAmount: 1236, adjustmentCodes: ["CO-45", "PR-1"] },
  { id: "ERA-302", payerId: "dentical", payerName: "Denti-Cal", checkNumber: "EFT-990112", checkDate: "2026-03-19", claimTrackingId: "CLM-2026-00341", patientId: "PT-1005", paidAmount: 97, billedAmount: 162, adjustmentCodes: ["CO-45"] },
  { id: "ERA-303", payerId: "metlife", payerName: "MetLife PDP Plus", checkNumber: "CHK-551087", checkDate: "2026-03-20", claimTrackingId: "CLM-2026-00198", patientId: "PT-1004", paidAmount: 0, billedAmount: 1485, adjustmentCodes: ["CO-16", "OA-18"] },
];

const statusVariant = (s: string) => {
  switch (s) {
    case "paid": return "success" as const;
    case "denied": return "critical" as const;
    case "accepted": return "pending" as const;
    case "submitted": return "info" as const;
    default: return "default" as const;
  }
};

export const PaymentTracking = () => {
  const [claims, setClaims] = useState<FiledClaim[]>([...MOCK_FILED_CLAIMS]);
  const [eraFeed, setEraFeed] = useState<ERARecord[]>([]);
  const [isIngesting, setIsIngesting] = useState(false);
  const [eraQueueIdx, setEraQueueIdx] = useState(0);
  const [flashRow, setFlashRow] = useState<string | null>(null);

  // Derived stats
  const paidClaims = useMemo(() => claims.filter((c) => c.status === "paid"), [claims]);
  const totalCollected = useMemo(() => paidClaims.reduce((s, c) => s + (c.paidAmount || 0), 0), [paidClaims]);
  const totalBilled = useMemo(() => claims.reduce((s, c) => s + c.totalBilled, 0), [claims]);
  const avgDays = useMemo(() => {
    const withDays = paidClaims.filter((c) => c.daysToPayment);
    return withDays.length > 0 ? Math.round(withDays.reduce((s, c) => s + (c.daysToPayment || 0), 0) / withDays.length) : 0;
  }, [paidClaims]);

  const aging = useMemo(() => {
    const buckets = { "0-15": 0, "16-30": 0, "31-60": 0, "60+": 0 };
    claims.forEach((c) => {
      if (c.status === "paid") return;
      const days = Math.floor((Date.now() - new Date(c.filedDate).getTime()) / 86400000);
      if (days <= 15) buckets["0-15"]++;
      else if (days <= 30) buckets["16-30"]++;
      else if (days <= 60) buckets["31-60"]++;
      else buckets["60+"]++;
    });
    return buckets;
  }, [claims]);

  const eraMatchedCount = useMemo(() => claims.filter((c) => c.eraMatchDate).length, [claims]);

  // Auto-match ERA to claims
  const matchERA = useCallback((era: ERARecord) => {
    setClaims((prev) =>
      prev.map((claim) => {
        if (claim.trackingId !== era.claimTrackingId) return claim;
        if (era.paidAmount === 0) {
          // Denial — don't mark paid
          return { ...claim, status: "denied" as const };
        }
        const today = new Date().toISOString().slice(0, 10);
        const daysToPayment = Math.floor((Date.now() - new Date(claim.filedDate).getTime()) / 86400000);
        return {
          ...claim,
          status: "paid" as const,
          paidAmount: era.paidAmount,
          paidDate: today,
          eraMatchDate: today,
          daysToPayment,
        };
      })
    );
    setEraFeed((prev) =>
      prev.map((e) =>
        e.id === era.id
          ? { ...e, status: era.paidAmount > 0 ? "matched" as const : "unmatched" as const }
          : e
      )
    );
    setFlashRow(era.claimTrackingId);
    setTimeout(() => setFlashRow(null), 2000);
  }, []);

  // Simulate real-time ERA ingestion
  useEffect(() => {
    if (!isIngesting || eraQueueIdx >= INCOMING_ERA_QUEUE.length) {
      if (eraQueueIdx >= INCOMING_ERA_QUEUE.length) setIsIngesting(false);
      return;
    }

    const timer = setTimeout(() => {
      const incoming = INCOMING_ERA_QUEUE[eraQueueIdx];
      const eraRecord: ERARecord = {
        ...incoming,
        status: "pending",
        receivedAt: new Date().toLocaleTimeString(),
      };
      setEraFeed((prev) => [eraRecord, ...prev]);
      setEraQueueIdx((i) => i + 1);

      // Auto-match after a brief delay
      setTimeout(() => matchERA(eraRecord), 1200);
    }, 2500);

    return () => clearTimeout(timer);
  }, [isIngesting, eraQueueIdx, matchERA]);

  const handleStartIngestion = () => {
    if (eraQueueIdx >= INCOMING_ERA_QUEUE.length) {
      // Reset for re-demo
      setEraQueueIdx(0);
      setEraFeed([]);
      setClaims([...MOCK_FILED_CLAIMS]);
    }
    setIsIngesting(true);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Collected" value={fmtUSD(totalCollected)} sub={`of ${fmtUSD(totalBilled)} billed`} color="emerald" />
        <StatCard label="Avg Days to Pay" value={`${avgDays}d`} color="sky" />
        <StatCard label="Claims Filed" value={claims.length} sub={`${paidClaims.length} paid`} color="teal" />
        <StatCard label="ERA Auto-Matched" value={eraMatchedCount} sub="electronic remittance" color="amber" />
      </div>

      {/* ERA/EOB Live Ingestion Panel */}
      <div className="bg-surface-1 border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">ERA/EOB Live Ingestion</h4>
            {isIngesting && (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Live</span>
              </span>
            )}
          </div>
          <button
            onClick={handleStartIngestion}
            disabled={isIngesting}
            className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 active:scale-[0.97] transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {isIngesting ? "Receiving…" : eraQueueIdx >= INCOMING_ERA_QUEUE.length ? "Reset & Re-Run" : "Start ERA Ingestion"}
          </button>
        </div>

        {eraFeed.length > 0 && (
          <div className="space-y-2 max-h-[260px] overflow-y-auto">
            {eraFeed.map((era) => (
              <div
                key={era.id}
                className={`border rounded-lg p-3 transition-all duration-500 animate-fade-in ${
                  era.status === "matched"
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : era.status === "unmatched"
                    ? "border-red-500/30 bg-red-500/5"
                    : "border-border bg-background"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-foreground">{era.id}</span>
                      <ClaimBadge variant={era.status === "matched" ? "success" : era.status === "unmatched" ? "critical" : "pending"}>
                        {era.status === "matched" ? "Auto-Matched ✓" : era.status === "unmatched" ? "Denied — $0" : "Matching…"}
                      </ClaimBadge>
                      <span className="text-[10px] text-muted-foreground">{era.receivedAt}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-xs">
                      <span className="text-muted-foreground">{era.payerName}</span>
                      <span className="text-muted-foreground">Check: <span className="font-mono text-foreground">{era.checkNumber}</span></span>
                      <span className="text-muted-foreground">Claim: <span className="font-mono text-foreground">{era.claimTrackingId}</span></span>
                    </div>
                    {era.adjustmentCodes.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {era.adjustmentCodes.map((code) => (
                          <span key={code} className="font-mono text-[9px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded">{code}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-muted-foreground">Billed: {fmtUSD(era.billedAmount)}</div>
                    <div className={`text-sm font-bold tabular-nums ${era.paidAmount > 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {era.paidAmount > 0 ? `+${fmtUSD(era.paidAmount)}` : "$0.00"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {eraFeed.length === 0 && (
          <div className="text-center py-6 text-xs text-muted-foreground">
            <p className="mb-1">No ERA/EOB records received yet</p>
            <p>Click "Start ERA Ingestion" to simulate incoming electronic remittance advice from insurance carriers</p>
          </div>
        )}
      </div>

      {/* Aging Buckets */}
      <div className="bg-surface-1 border border-border rounded-xl p-4">
        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Aging Buckets (Unpaid)</h4>
        <div className="flex gap-3">
          {Object.entries(aging).map(([bucket, count]) => (
            <div key={bucket} className="flex-1 text-center border border-border rounded-lg p-3">
              <div className="text-lg font-bold text-foreground tabular-nums">{count}</div>
              <div className="text-[10px] text-muted-foreground font-semibold">{bucket} days</div>
            </div>
          ))}
        </div>
      </div>

      {/* Avg Days by Payor */}
      <div className="bg-surface-1 border border-border rounded-xl p-4">
        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Avg Days-to-Pay by Payor</h4>
        <div className="space-y-2">
          {PAYOR_RULES.filter(p => p.id !== "generic").map((payor) => (
            <div key={payor.id} className="flex items-center gap-3">
              <span className="text-xs font-semibold text-foreground w-40 truncate">{payor.name}</span>
              <div className="flex-1 bg-secondary rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-primary/60 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (payor.avgDaysToPay / 60) * 100)}%` }}
                />
              </div>
              <span className="text-xs font-bold tabular-nums text-foreground w-10 text-right">{payor.avgDaysToPay}d</span>
            </div>
          ))}
        </div>
      </div>

      {/* Claims Table */}
      <div className="bg-surface-1 border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
              <th className="text-left p-3">Tracking ID</th>
              <th className="text-left p-3">Patient</th>
              <th className="text-left p-3">Payor</th>
              <th className="text-right p-3">Billed</th>
              <th className="text-right p-3">Paid</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">ERA Match</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((claim) => {
              const pt = MOCK_PATIENTS.find((p) => p.id === claim.patientId);
              const payor = getPayor(claim.payorId);
              const isFlashing = flashRow === claim.trackingId;
              return (
                <tr
                  key={claim.id}
                  className={`border-b border-border/50 transition-colors duration-700 ${isFlashing ? "bg-emerald-500/10" : ""}`}
                >
                  <td className="p-3 font-mono text-xs">{claim.trackingId}</td>
                  <td className="p-3 font-semibold">{pt?.name || claim.patientId}</td>
                  <td className="p-3 text-xs text-muted-foreground">{payor.name}</td>
                  <td className="p-3 text-right tabular-nums">{fmtUSD(claim.totalBilled)}</td>
                  <td className="p-3 text-right tabular-nums font-semibold">{claim.paidAmount ? fmtUSD(claim.paidAmount) : "—"}</td>
                  <td className="p-3"><ClaimBadge variant={statusVariant(claim.status)}>{claim.status}</ClaimBadge></td>
                  <td className="p-3 text-xs">
                    {claim.eraMatchDate ? (
                      <span className="text-emerald-400 font-semibold">✓ {claim.eraMatchDate}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
