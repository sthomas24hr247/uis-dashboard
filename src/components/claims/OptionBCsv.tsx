import { useState } from "react";
import { ClaimBadge } from "./Badge";
import { SOAPForm } from "./SOAPForm";
import { fmtCurrency, type DeniedClaim } from "@/data/claims-data";

interface OptionBCsvProps {
  claims: DeniedClaim[];
  onSubmitApproval: (claim: DeniedClaim, narrative: string) => void;
}

export const OptionBCsv = ({ claims, onSubmitApproval }: OptionBCsvProps) => {
  const [csvLoaded, setCsvLoaded] = useState(false);
  const [csvClaim, setCsvClaim] = useState<DeniedClaim | null>(null);

  const deniedClaims = claims.filter((c) => c.status === "denied");

  if (csvClaim) {
    return (
      <div>
        <button onClick={() => setCsvClaim(null)} className="text-xs text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">← Back to claims list</button>
        <SOAPForm claim={csvClaim} onSubmitApproval={onSubmitApproval} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-black text-foreground">Option B: CSV Upload → SOAP Note Builder</h2>
        <p className="text-xs text-muted-foreground mt-1">Upload your denied claims spreadsheet → Select a claim → Build SOAP note with dropdowns → Generate narrative → Route for approval</p>
      </div>

      {/* Upload Area */}
      <div className="bg-card border border-border rounded-2xl p-8 mb-4 text-center">
        <div className="text-4xl mb-3">📁</div>
        <p className="text-sm text-secondary-foreground mb-1 font-semibold">Upload Denied Claims CSV</p>
        <p className="text-[11px] text-muted-foreground mb-4">Same format as your current tracking spreadsheet</p>
        <div className="flex items-center justify-center gap-3">
          <label className="px-5 py-2.5 bg-primary hover:bg-teal-light text-primary-foreground text-xs font-bold rounded-xl cursor-pointer transition-all shadow-lg shadow-teal-900/40">
            Choose CSV File
            <input type="file" accept=".csv,.xlsx" className="hidden" onChange={() => setCsvLoaded(true)} />
          </label>
          <button onClick={() => setCsvLoaded(true)} className="px-5 py-2.5 bg-secondary hover:bg-surface-3 text-secondary-foreground text-xs font-bold rounded-xl transition-all">
            Load Demo Data
          </button>
        </div>
      </div>

      {csvLoaded && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">{deniedClaims.length} Denied Claims Ready</h3>
            <span className="text-[10px] text-muted-foreground">Click a row to build the SOAP addendum</span>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-surface-2">
                <tr className="text-muted-foreground uppercase tracking-wider text-[10px]">
                  <th className="px-3 py-2 text-left">Row</th>
                  <th className="px-3 py-2 text-left">Patient ID</th>
                  <th className="px-3 py-2 text-left">Clinic</th>
                  <th className="px-3 py-2 text-left">DOS</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                  <th className="px-3 py-2 text-left">Denial</th>
                  <th className="px-3 py-2 text-left">Issues</th>
                  <th className="px-3 py-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {deniedClaims.map((c) => (
                  <tr key={c.id} className="border-t border-border hover:bg-primary/5 cursor-pointer transition-colors" onClick={() => setCsvClaim(c)}>
                    <td className="px-3 py-2 font-mono text-muted-foreground">{c.row}</td>
                    <td className="px-3 py-2 font-mono text-teal-light font-semibold">{c.patientId}</td>
                    <td className="px-3 py-2 text-secondary-foreground">{c.clinic}</td>
                    <td className="px-3 py-2 text-muted-foreground">{c.claimDate}</td>
                    <td className="px-3 py-2 text-right font-mono">{fmtCurrency(c.billedAmt)}</td>
                    <td className="px-3 py-2"><ClaimBadge variant="high">{c.denialCode}</ClaimBadge></td>
                    <td className="px-3 py-2 text-muted-foreground">{c.issues.length} issues</td>
                    <td className="px-3 py-2 text-center"><span className="text-teal-light font-bold text-[10px]">Build SOAP →</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
