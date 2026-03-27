import { useState } from "react";
import { MOCK_PATIENTS, MOCK_TREATMENT_PLANS, getPayor, fmtUSD } from "@/data/rcm-data";
import { ClaimBadge } from "@/components/claims/Badge";

export const ClaimsFiling = () => {
  const [filedIds, setFiledIds] = useState<Set<string>>(new Set());

  const handleFile = (patientId: string) => {
    setFiledIds((prev) => new Set(prev).add(patientId));
  };

  return (
    <div className="space-y-4">
      <div className="bg-surface-1 border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
              <th className="text-left p-3">Patient</th>
              <th className="text-left p-3">Payor</th>
              <th className="text-left p-3">Procedures</th>
              <th className="text-right p-3">Total Billed</th>
              <th className="text-left p-3">Expected Payment</th>
              <th className="text-left p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_TREATMENT_PLANS.map((tp) => {
              const pt = MOCK_PATIENTS.find((p) => p.id === tp.patientId);
              if (!pt) return null;
              const payor = getPayor(pt.payorId);
              const total = tp.items.reduce((s, i) => s + i.fee, 0);
              const isFiled = filedIds.has(tp.patientId);
              const trackingId = `CLM-2026-${Math.random().toString().slice(2, 7)}`;

              return (
                <tr key={tp.patientId} className="border-b border-border/50">
                  <td className="p-3 font-semibold">{pt.name}</td>
                  <td className="p-3 text-xs text-muted-foreground">{payor.name}</td>
                  <td className="p-3">
                    <span className="font-mono text-xs">{tp.items.length} codes</span>
                  </td>
                  <td className="p-3 text-right font-semibold tabular-nums">{fmtUSD(total)}</td>
                  <td className="p-3 text-xs text-muted-foreground">~{payor.avgDaysToPay} days</td>
                  <td className="p-3">
                    {isFiled ? (
                      <div>
                        <ClaimBadge variant="success">Filed ✓</ClaimBadge>
                        <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">{trackingId}</div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleFile(tp.patientId)}
                        className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 active:scale-[0.97] transition-all"
                      >
                        File Electronically
                      </button>
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
