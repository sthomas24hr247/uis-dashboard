import { useState } from "react";
import { MOCK_PATIENTS, MOCK_TREATMENT_PLANS, getPayor, fmtUSD, PAYMENT_OPTIONS } from "@/data/rcm-data";
import { ClaimBadge } from "@/components/claims/Badge";
import { StatCard } from "@/components/claims/StatCard";

export const PatientCostEstimation = () => {
  const [selectedPatient, setSelectedPatient] = useState(MOCK_TREATMENT_PLANS[0].patientId);
  const plan = MOCK_TREATMENT_PLANS.find((p) => p.patientId === selectedPatient);
  const patient = MOCK_PATIENTS.find((p) => p.id === selectedPatient);
  const payor = patient ? getPayor(patient.payorId) : null;

  const totalFee = plan?.items.reduce((s, i) => s + i.fee, 0) ?? 0;

  // Simulate coverage calculation
  const coveragePercent = payor?.type === "Medicaid" ? 0.65 : 0.8;
  const insurancePays = Math.round(totalFee * coveragePercent);
  const remaining = patient && patient.annualMax !== 99999
    ? Math.max(0, patient.annualMax - patient.annualMaxUsed)
    : insurancePays;
  const actualInsurancePays = Math.min(insurancePays, remaining);
  const patientPortion = totalFee - actualInsurancePays;

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
        {payor && <ClaimBadge variant="info">{payor.type}</ClaimBadge>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Treatment" value={fmtUSD(totalFee)} color="sky" />
        <StatCard label="Insurance Pays" value={fmtUSD(actualInsurancePays)} sub={`${Math.round(coveragePercent * 100)}% coverage`} color="teal" />
        <StatCard label="Patient Portion" value={fmtUSD(patientPortion)} color="amber" />
        <StatCard label="Benefits Remaining" value={patient?.annualMax === 99999 ? "Unlimited" : fmtUSD(Math.max(0, remaining - actualInsurancePays))} color="emerald" />
      </div>

      <div className="bg-surface-1 border border-border rounded-xl p-5">
        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Payment Options for Patient Portion ({fmtUSD(patientPortion)})</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PAYMENT_OPTIONS.map((opt) => (
            <div key={opt.id} className="border border-border rounded-xl p-4 hover:border-primary/40 transition-colors cursor-pointer active:scale-[0.98]">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-foreground">{opt.name}</span>
                {opt.type === "financing" && <ClaimBadge variant="pending">Financing</ClaimBadge>}
              </div>
              <p className="text-xs text-muted-foreground mb-2">{opt.description}</p>
              {opt.terms && (
                <div className="flex gap-3 text-[10px]">
                  <span className="text-muted-foreground">Terms: <span className="text-foreground font-semibold">{opt.terms}</span></span>
                  <span className="text-muted-foreground">APR: <span className="text-foreground font-semibold">{opt.apr}</span></span>
                </div>
              )}
              {opt.type === "full" && (
                <div className="text-lg font-bold text-foreground mt-1 tabular-nums">{fmtUSD(patientPortion)}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
