import { useState } from "react";
import { MOCK_PATIENTS, MOCK_TREATMENT_PLANS, getPayor, fmtUSD } from "@/data/rcm-data";
import { ClaimBadge } from "@/components/claims/Badge";

export const TreatmentPlanCorrelation = () => {
  const [selectedPatient, setSelectedPatient] = useState(MOCK_TREATMENT_PLANS[0].patientId);
  const plan = MOCK_TREATMENT_PLANS.find((p) => p.patientId === selectedPatient);
  const patient = MOCK_PATIENTS.find((p) => p.id === selectedPatient);
  const payor = patient ? getPayor(patient.payorId) : null;

  const errorCount = plan?.items.filter((i) => i.hasError).length ?? 0;
  const totalFee = plan?.items.reduce((s, i) => s + i.fee, 0) ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={selectedPatient}
          onChange={(e) => setSelectedPatient(e.target.value)}
          className="bg-surface-1 border border-border rounded-lg px-3 py-2 text-sm text-foreground"
        >
          {MOCK_TREATMENT_PLANS.map((tp) => {
            const pt = MOCK_PATIENTS.find((p) => p.id === tp.patientId);
            return <option key={tp.patientId} value={tp.patientId}>{pt?.name || tp.patientId}</option>;
          })}
        </select>
        {payor && <ClaimBadge variant="info">{payor.name}</ClaimBadge>}
        {errorCount > 0 && <ClaimBadge variant="critical">{errorCount} error{errorCount > 1 ? "s" : ""} found</ClaimBadge>}
      </div>

      {plan && (
        <div className="bg-surface-1 border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                <th className="text-left p-3">Tooth</th>
                <th className="text-left p-3">CDT Code</th>
                <th className="text-left p-3">Description</th>
                <th className="text-right p-3">Fee</th>
                <th className="text-left p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {plan.items.map((item, i) => (
                <tr key={i} className={`border-b border-border/50 ${item.hasError ? "bg-destructive/5" : ""}`}>
                  <td className="p-3 font-mono font-bold">{item.tooth}</td>
                  <td className="p-3">
                    <span className={`font-mono ${item.hasError ? "text-red-400 line-through" : "text-foreground"}`}>{item.cdtCode}</span>
                    {item.suggestedCode && (
                      <span className="ml-2 font-mono text-emerald-400">→ {item.suggestedCode}</span>
                    )}
                  </td>
                  <td className="p-3 text-muted-foreground">{item.description}</td>
                  <td className="p-3 text-right font-semibold tabular-nums">{fmtUSD(item.fee)}</td>
                  <td className="p-3">
                    {item.hasError ? (
                      <div>
                        <ClaimBadge variant="critical">Error</ClaimBadge>
                        <p className="text-[10px] text-red-400 mt-1 max-w-[200px]">{item.errorMsg}</p>
                      </div>
                    ) : (
                      <ClaimBadge variant="success">Valid</ClaimBadge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border">
                <td colSpan={3} className="p-3 text-xs font-bold uppercase text-muted-foreground">Total</td>
                <td className="p-3 text-right font-bold tabular-nums">{fmtUSD(totalFee)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};
