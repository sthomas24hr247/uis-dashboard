import { useState } from "react";
import { MOCK_PATIENTS, getPayor, fmtUSD } from "@/data/rcm-data";
import { ClaimBadge } from "@/components/claims/Badge";

export const EligibilityVerification = () => {
  const [selectedPatient, setSelectedPatient] = useState(MOCK_PATIENTS[0].id);
  const [verified, setVerified] = useState<Set<string>>(new Set());

  const patient = MOCK_PATIENTS.find((p) => p.id === selectedPatient)!;
  const payor = getPayor(patient.payorId);

  const handleVerify = () => {
    setVerified((prev) => new Set(prev).add(patient.id));
  };

  const isVerified = verified.has(patient.id);
  const remainingBenefits = patient.annualMax === 99999 ? "Unlimited (Medicaid)" : fmtUSD(patient.annualMax - patient.annualMaxUsed);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={selectedPatient}
          onChange={(e) => setSelectedPatient(e.target.value)}
          className="bg-surface-1 border border-border rounded-lg px-3 py-2 text-sm text-foreground"
        >
          {MOCK_PATIENTS.map((p) => (
            <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
          ))}
        </select>
        <button
          onClick={handleVerify}
          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 active:scale-[0.97] transition-all"
        >
          {isVerified ? "Re-Verify" : "Verify Eligibility"}
        </button>
      </div>

      {isVerified && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
          <div className="bg-surface-1 border border-border rounded-xl p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Patient Information</h4>
            <div className="space-y-1.5 text-sm">
              <Row label="Name" value={patient.name} />
              <Row label="DOB" value={patient.dob} />
              <Row label="Member ID" value={patient.memberId} />
              <Row label="Last Visit" value={patient.lastVisit} />
            </div>
          </div>

          <div className="bg-surface-1 border border-border rounded-xl p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Coverage Details</h4>
            <div className="space-y-1.5 text-sm">
              <Row label="Carrier" value={payor.name} />
              <Row label="Plan Type" value={payor.type} />
              <Row label="Group #" value={patient.groupNumber} />
              <Row label="Status">
                <ClaimBadge variant={patient.coverageStatus === "active" ? "success" : patient.coverageStatus === "pending" ? "pending" : "critical"}>
                  {patient.coverageStatus}
                </ClaimBadge>
              </Row>
              <Row label="Remaining Benefits" value={remainingBenefits} />
              <Row label="Filing Limit" value={`${payor.filingLimitDays} days`} />
            </div>
          </div>

          <div className="md:col-span-2 bg-surface-1 border border-border rounded-xl p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Frequency Limitations</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {Object.entries(payor.frequencyLimitations).map(([code, limit]) => (
                <div key={code} className="flex items-center gap-2 text-xs">
                  <span className="font-mono font-bold text-foreground">{code}</span>
                  <span className="text-muted-foreground">—</span>
                  <span className="text-muted-foreground">{limit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Row = ({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) => (
  <div className="flex justify-between items-center">
    <span className="text-muted-foreground">{label}</span>
    {children || <span className="font-semibold text-foreground">{value}</span>}
  </div>
);
