import { StatCard } from "./StatCard";
import { ClaimBadge } from "./Badge";
import { ARC_RESOLUTION, fmtCurrency, type DeniedClaim } from "@/data/claims-data";

interface DashboardProps {
  claims: DeniedClaim[];
  pendingCount: number;
  approvedCount: number;
  approvedAmount: number;
  onFixClaim: (claim: DeniedClaim) => void;
}

export const Dashboard = ({ claims, pendingCount, approvedCount, approvedAmount, onFixClaim }: DashboardProps) => {
  const denied = claims.filter((c) => c.status === "denied").length;
  const atRisk = claims.filter((c) => c.status === "denied").reduce((s, c) => s + c.billedAmt, 0);

  const arcCounts: Record<string, number> = {};
  const clinicCounts: Record<string, number> = {};
  claims.filter((c) => c.status === "denied").forEach((c) => {
    arcCounts[c.denialCode] = (arcCounts[c.denialCode] || 0) + 1;
    clinicCounts[c.clinic] = (clinicCounts[c.clinic] || 0) + 1;
  });

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Denials" value={denied} sub="Claims awaiting resolution" color="red" />
        <StatCard label="Revenue at Risk" value={fmtCurrency(atRisk)} sub="Denied claim total" color="amber" />
        <StatCard label="Pending Resubmission Approval" value={pendingCount} sub="Awaiting Dr. Jacobson" color="sky" />
        <StatCard label="Recovered" value={approvedCount > 0 ? fmtCurrency(approvedAmount) : "—"} sub={approvedCount > 0 ? `${approvedCount} claims approved` : "Demo — approve to track"} color="teal" />
      </div>

      {/* Breakdown Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-2xl p-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground mb-3">Denial Codes</h3>
          {Object.entries(arcCounts).sort((a, b) => b[1] - a[1]).map(([code, count]) => (
            <div key={code} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
              <div className="flex items-center gap-2">
                <ClaimBadge variant="high">{code}</ClaimBadge>
                <span className="text-[10px] text-muted-foreground">{ARC_RESOLUTION[code]?.name || code}</span>
              </div>
              <span className="text-xs font-mono font-bold text-foreground">{count}</span>
            </div>
          ))}
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground mb-3">By Clinic</h3>
          {Object.entries(clinicCounts).sort((a, b) => b[1] - a[1]).map(([clinic, count]) => (
            <div key={clinic} className="mb-3">
              <div className="flex justify-between text-xs mb-1"><span className="text-secondary-foreground">{clinic}</span><span className="font-mono text-muted-foreground">{count} claims</span></div>
              <div className="h-2 bg-surface-3 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-teal to-emerald-500 rounded-full transition-all" style={{ width: `${(count / denied) * 100}%` }} /></div>
            </div>
          ))}
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground mb-3">Resolution Types Needed</h3>
          {[
            { type: "DOCUMENTATION_APPEND", label: "Add Missing Documentation", icon: "📎" },
            { type: "TAR_RESUBMISSION", label: "Resubmit TAR w/ Narrative", icon: "📝" },
            { type: "CLAIM_CORRECTION", label: "Correct & Resubmit Claim", icon: "🔧" },
            { type: "ENROLLMENT_CORRECTION", label: "Fix Provider Enrollment", icon: "🏥" },
          ].map((r) => {
            const c = claims.filter((cl) => cl.status === "denied" && ARC_RESOLUTION[cl.denialCode]?.type === r.type).length;
            return c > 0 ? (
              <div key={r.type} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <span className="text-xs text-secondary-foreground">{r.icon} {r.label}</span>
                <span className="text-xs font-mono font-bold text-foreground">{c}</span>
              </div>
            ) : null;
          })}
        </div>
      </div>

      {/* Claims Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="text-sm font-bold text-foreground">All Claims</h3>
          <p className="text-[10px] text-muted-foreground">Dr. DeGuzman Cases — {claims.length} total</p>
        </div>
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-surface-2">
              <tr className="text-muted-foreground uppercase tracking-wider text-[10px]">
                <th className="px-3 py-2 text-left">Row</th>
                <th className="px-3 py-2 text-left">Patient ID</th>
                <th className="px-3 py-2 text-left">Clinic</th>
                <th className="px-3 py-2 text-left">DOS</th>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2 text-left">Denial</th>
                <th className="px-3 py-2 text-center">Days</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Karen</th>
                <th className="px-3 py-2 text-left">Scanned</th>
                <th className="px-3 py-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((c) => (
                <tr key={c.id} className="border-t border-border hover:bg-surface-2/50 transition-colors">
                  <td className="px-3 py-2 font-mono text-muted-foreground">{c.row}</td>
                  <td className="px-3 py-2 font-mono text-teal-light font-semibold">{c.patientId}</td>
                  <td className="px-3 py-2 text-secondary-foreground">{c.clinic}</td>
                  <td className="px-3 py-2 text-muted-foreground">{c.claimDate}</td>
                  <td className="px-3 py-2"><ClaimBadge>{c.type}</ClaimBadge></td>
                  <td className="px-3 py-2 text-right font-mono text-secondary-foreground">{fmtCurrency(c.billedAmt)}</td>
                  <td className="px-3 py-2"><ClaimBadge variant="high">{c.denialCode}</ClaimBadge></td>
                  <td className="px-3 py-2 text-center font-mono text-muted-foreground">{c.daysOld}</td>
                  <td className="px-3 py-2"><ClaimBadge variant={c.status === "denied" ? "critical" : c.status === "pending" ? "pending" : "success"}>{c.status}</ClaimBadge></td>
                  <td className="px-3 py-2 text-muted-foreground">{c.karenReview || "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{c.scanned || "—"}</td>
                  <td className="px-3 py-2 text-center">
                    {c.status === "denied" && (
                      <button onClick={() => onFixClaim(c)} className="px-3 py-1 bg-primary/20 text-teal-light hover:bg-primary/40 text-[10px] font-bold rounded-lg transition-all">
                        Fix →
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
