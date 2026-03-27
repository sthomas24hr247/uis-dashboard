import { useState } from "react";
import { ClaimBadge } from "./Badge";
import { fmtCurrency, type ApprovalItem } from "@/data/claims-data";

interface ApprovalQueueProps {
  approvalQueue: ApprovalItem[];
  onApprove: (id: string) => void;
  onBulkApprove: (ids: string[]) => void;
}

export const ApprovalQueue = ({ approvalQueue, onApprove, onBulkApprove }: ApprovalQueueProps) => {
  const [bulkSel, setBulkSel] = useState<Set<string>>(new Set());

  const toggleBulk = (id: string, checked: boolean) => {
    const s = new Set(bulkSel);
    checked ? s.add(id) : s.delete(id);
    setBulkSel(s);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-black text-foreground">Approval Queue</h2>
          <p className="text-xs text-muted-foreground mt-1">Dr. Jacobson or designee reviews addendum narratives before Denti-Cal resubmission</p>
        </div>
        {bulkSel.size > 0 && (
          <button onClick={() => { onBulkApprove(Array.from(bulkSel)); setBulkSel(new Set()); }} className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-primary-foreground text-xs font-bold rounded-xl shadow-lg">
            Bulk Approve ({bulkSel.size}) →
          </button>
        )}
      </div>

      {approvalQueue.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-sm text-muted-foreground">No claims pending approval yet</p>
          <p className="text-xs text-muted-foreground mt-1">Use Option A or Option B to generate addendum narratives and submit for approval</p>
        </div>
      ) : (
        <div className="space-y-3">
          {approvalQueue.map((a) => (
            <div key={a.id} className={`bg-card border rounded-2xl p-4 transition-all ${a.status === "approved" ? "border-emerald-700/30 bg-emerald-950/10" : "border-border"}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {a.status === "pending" && (
                    <input type="checkbox" checked={bulkSel.has(a.id)} onChange={(e) => toggleBulk(a.id, e.target.checked)} className="accent-teal" />
                  )}
                  <span className="font-mono text-teal-light font-bold">{a.patientId}</span>
                  <span className="text-xs text-muted-foreground">{a.clinic} • {a.claimDate}</span>
                  <ClaimBadge variant="high">{a.denialCode}</ClaimBadge>
                  <span className="text-xs font-mono text-secondary-foreground">{fmtCurrency(a.billedAmt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ClaimBadge variant={a.status === "approved" ? "success" : "pending"}>{a.status}</ClaimBadge>
                  {a.status === "pending" && (
                    <button onClick={() => onApprove(a.id)} className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-primary-foreground text-[10px] font-bold rounded-lg transition-all">
                      Approve ✓
                    </button>
                  )}
                </div>
              </div>
              <div className="bg-surface-2 rounded-lg p-3 max-h-40 overflow-y-auto">
                <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap leading-relaxed">{a.narrative}</pre>
              </div>
              <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
                <span>Submitted: {a.submittedAt}</span>
                <span>Resolution: {a.resolution?.type?.replace(/_/g, " ")}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
