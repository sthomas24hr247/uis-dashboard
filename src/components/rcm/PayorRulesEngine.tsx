import { useState } from "react";
import { PAYOR_RULES, getPayor } from "@/data/rcm-data";
import { ClaimBadge } from "@/components/claims/Badge";

export const PayorRulesEngine = () => {
  const [selectedPayor, setSelectedPayor] = useState(PAYOR_RULES[0].id);
  const payor = getPayor(selectedPayor);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={selectedPayor}
          onChange={(e) => setSelectedPayor(e.target.value)}
          className="bg-surface-1 border border-border rounded-lg px-3 py-2 text-sm text-foreground"
        >
          {PAYOR_RULES.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <ClaimBadge variant="info">{payor.type}</ClaimBadge>
        <ClaimBadge variant="default">Payer ID: {payor.electronicPayerId}</ClaimBadge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface-1 border border-border rounded-xl p-5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Filing Rules</h4>
          <div className="space-y-1.5 text-sm">
            <Row label="Filing Limit" value={`${payor.filingLimitDays} days`} />
            <Row label="Resubmission Window" value={`${payor.resubmissionWindowDays} days`} />
            <Row label="Avg Days to Pay" value={`${payor.avgDaysToPay} days`} />
          </div>
        </div>

        <div className="bg-surface-1 border border-border rounded-xl p-5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Fee Schedule</h4>
          <p className="text-sm text-muted-foreground">{payor.feeScheduleNote}</p>
        </div>

        <div className="bg-surface-1 border border-border rounded-xl p-5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Pre-Auth Required</h4>
          <div className="flex flex-wrap gap-1.5">
            {payor.preAuthRequired.map((code) => (
              <span key={code} className="font-mono text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded">{code}</span>
            ))}
          </div>
        </div>

        <div className="bg-surface-1 border border-border rounded-xl p-5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Pre-Auth Exempt</h4>
          <div className="flex flex-wrap gap-1.5">
            {payor.preAuthExempt.map((code) => (
              <span key={code} className="font-mono text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded">{code}</span>
            ))}
          </div>
        </div>

        <div className="bg-surface-1 border border-border rounded-xl p-5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Frequency Limitations</h4>
          <div className="space-y-1 text-xs">
            {Object.entries(payor.frequencyLimitations).map(([code, limit]) => (
              <div key={code} className="flex gap-2">
                <span className="font-mono font-bold text-foreground">{code}</span>
                <span className="text-muted-foreground">{limit}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-1 border border-border rounded-xl p-5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Special Clauses</h4>
          <ul className="space-y-1.5">
            {payor.specialClauses.map((clause, i) => (
              <li key={i} className="text-xs text-muted-foreground flex gap-2">
                <span className="text-amber-400">⚠</span>
                {clause}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-semibold text-foreground">{value}</span>
  </div>
);
