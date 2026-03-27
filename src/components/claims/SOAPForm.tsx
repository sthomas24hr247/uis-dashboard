import { useState } from "react";
import { ClaimBadge } from "./Badge";
import { FormSelect } from "./FormSelect";
import { ARC_RESOLUTION, SOAP_OPTIONS, type DeniedClaim } from "@/data/claims-data";
import { generateSOAPPdf } from "@/lib/generate-soap-pdf";

interface SOAPFormProps {
  claim: DeniedClaim;
  showApiEndpoints?: boolean;
  onSubmitApproval: (claim: DeniedClaim, narrative: string) => void;
}

export const SOAPForm = ({ claim, showApiEndpoints = false, onSubmitApproval }: SOAPFormProps) => {
  const [form, setForm] = useState<Record<string, any>>({});
  const [narrative, setNarrative] = useState("");
  const [editing, setEditing] = useState(false);
  const [wongBaker, setWongBaker] = useState<number | null>(null);

  const uf = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const buildNarrative = () => {
    const parts: string[] = [];
    if (form.emergencyCert) parts.push(form.emergencyCert + "\n");
    parts.push(`PATIENT: ID ${claim.patientId} | DOS: ${claim.claimDate} | Clinic: ${claim.clinic}`);
    parts.push(`PROVIDER: ${claim.dentist} | Facility: Children's Choice Dental - ${claim.clinic}\n`);
    if (form.treatmentBy?.length) parts.push(`TREATMENT PLAN DETERMINED BY: ${form.treatmentBy.join(", ")}`);
    if (form.reasonGA) parts.push(`REASON FOR GA: ${form.reasonGA}`);
    if (form.prevTreatment?.length) parts.push(`PREVIOUS TREATMENT ATTEMPTED: ${form.prevTreatment.join(", ")}`);
    if (form.frankl) parts.push(`FRANKL BEHAVIOR SCALE: ${form.frankl}`);
    if (form.attemptsFailed?.length) parts.push(`PREVIOUS ATTEMPTS FAILED: ${form.attemptsFailed.join(", ")}`);
    parts.push("");
    if (form.subjective) parts.push(`S: ${form.subjective}`);
    if (form.objective) parts.push(`O: ${form.objective}`);
    if (form.assessment) parts.push(`A: ${form.assessment}`);
    if (form.plan) parts.push(`P: ${form.plan}`);
    if (form.gaJustification) parts.push(`\nGA MEDICAL NECESSITY: ${form.gaJustification}`);
    if (form.painScale !== undefined && form.painScale !== null) parts.push(`\nWONG-BAKER FACES PAIN RATING: ${form.painScale}/10`);
    const n = parts.join("\n");
    setNarrative(n);
  };

  const resolution = ARC_RESOLUTION[claim.denialCode];

  return (
    <div className="space-y-4">
      {/* Patient Header */}
      <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-black uppercase tracking-[0.15em] text-teal-light">Medical Necessity SOAP Note — ER General Anesthesia</h3>
          <span className="text-[9px] text-muted-foreground">Children's Choice v3_2026</span>
        </div>
        <div className="grid grid-cols-4 gap-3 text-xs">
          <div><span className="text-muted-foreground text-[10px]">Patient ID:</span><br /><span className="font-mono text-teal-light text-sm">{claim.patientId}</span></div>
          <div><span className="text-muted-foreground text-[10px]">Date of Service:</span><br /><span className="text-secondary-foreground">{claim.claimDate}</span></div>
          <div><span className="text-muted-foreground text-[10px]">Clinic:</span><br /><span className="text-secondary-foreground">{claim.clinic}</span></div>
          <div><span className="text-muted-foreground text-[10px]">Provider:</span><br /><span className="text-secondary-foreground">{claim.dentist}</span></div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <ClaimBadge variant={resolution?.type === "TAR_RESUBMISSION" ? "critical" : "high"}>{claim.denialCode}</ClaimBadge>
          <span className="text-[10px] text-muted-foreground">{resolution?.name || claim.denialCode}</span>
        </div>
      </div>

      {/* Issues Detected */}
      <div className="bg-red-950/20 border border-red-800/30 rounded-xl p-3">
        <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-2">Issues Identified</div>
        {claim.issues.map((iss, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-red-300/80 mb-1">
            <span className="text-red-500 mt-0.5 text-[10px]">✕</span>{iss}
          </div>
        ))}
        <div className="mt-2 pt-2 border-t border-red-800/20 text-[10px] text-muted-foreground">
          <span className="text-amber-400 font-semibold">Corrective Action:</span> {resolution?.action}
        </div>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-0">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground mb-3 pb-1 border-b border-border">Clinical Assessment</div>
          <FormSelect label="Treatment Plan Determined By" options={SOAP_OPTIONS.treatmentDeterminedBy} value={form.treatmentBy} onChange={(v) => uf("treatmentBy", v)} multi />
          <FormSelect label="Reason for General Anesthesia" options={SOAP_OPTIONS.reasonForGA} value={form.reasonGA} onChange={(v) => uf("reasonGA", v)} />
          <FormSelect label="Previous Treatment Attempted" options={SOAP_OPTIONS.previousTreatment} value={form.prevTreatment} onChange={(v) => uf("prevTreatment", v)} multi />
          <FormSelect label="Frankl Behavior Scale" options={SOAP_OPTIONS.franklScale} value={form.frankl} onChange={(v) => uf("frankl", v)} />
          <FormSelect label="Previous Attempts Failed" options={SOAP_OPTIONS.previousAttemptsFailed} value={form.attemptsFailed} onChange={(v) => uf("attemptsFailed", v)} multi />

          {/* Wong-Baker Pain Scale */}
          <div className="mb-3">
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-[0.12em] mb-2">Wong-Baker FACES Pain Rating</label>
            <div className="flex gap-1">
              {[0, 2, 4, 6, 8, 10].map((n) => (
                <button
                  key={n}
                  onClick={() => { setWongBaker(n); uf("painScale", n); }}
                  className={`flex-1 py-2 rounded-lg text-center transition-all ${wongBaker === n ? "bg-primary text-primary-foreground ring-2 ring-teal-light" : "bg-surface-2 text-muted-foreground hover:bg-surface-3"}`}
                >
                  <div className="text-lg">{["😊", "🙂", "😐", "🙁", "😢", "😭"][n / 2]}</div>
                  <div className="text-[9px] font-bold">{n}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground mb-3 pb-1 border-b border-border">SOAP Narrative</div>
          <FormSelect label="S: Subjective" options={SOAP_OPTIONS.subjective} value={form.subjective} onChange={(v) => uf("subjective", v)} />
          <FormSelect label="O: Objective" options={SOAP_OPTIONS.objective} value={form.objective} onChange={(v) => uf("objective", v)} />
          <FormSelect label="A: Assessment" options={SOAP_OPTIONS.assessment} value={form.assessment} onChange={(v) => uf("assessment", v)} />
          <FormSelect label="P: Plan" options={SOAP_OPTIONS.plan} value={form.plan} onChange={(v) => uf("plan", v)} />
          <FormSelect label="Emergency Certification (Title 22)" options={SOAP_OPTIONS.emergencyCert} value={form.emergencyCert} onChange={(v) => uf("emergencyCert", v)} />
          <FormSelect label="GA Medical Necessity Justification" options={SOAP_OPTIONS.gaJustification} value={form.gaJustification} onChange={(v) => uf("gaJustification", v)} />
        </div>
      </div>

      {/* Generate & Submit */}
      <div className="flex items-center gap-3 pt-2 flex-wrap">
        <button onClick={buildNarrative} className="px-5 py-2.5 bg-primary hover:bg-teal-light text-primary-foreground text-xs font-bold rounded-xl transition-all shadow-lg shadow-teal-900/40">
          Generate Addendum Narrative →
        </button>
        {narrative && (
          <>
            <button onClick={() => onSubmitApproval(claim, narrative)} className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-primary-foreground text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/30">
              Submit to Dr. Jacobson →
            </button>
            <button
              onClick={() => generateSOAPPdf({ claim, form, narrative })}
              className="px-5 py-2.5 bg-surface-2 hover:bg-surface-3 border border-border text-secondary-foreground text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
            >
              <span>📄</span> Download SOAP PDF
            </button>
          </>
        )}
      </div>

      {/* Generated Narrative */}
      {narrative && (
        <div className="bg-surface-1 border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Generated Addendum Narrative</span>
            <button onClick={() => setEditing(!editing)} className="text-[10px] text-teal-light hover:text-foreground font-semibold">{editing ? "Lock ✓" : "Edit ✎"}</button>
          </div>
          {editing ? (
            <textarea className="w-full h-72 bg-surface-2 border border-border rounded-lg p-3 text-xs text-secondary-foreground font-mono leading-relaxed focus:outline-none focus:border-primary/50" value={narrative} onChange={(e) => setNarrative(e.target.value)} />
          ) : (
            <pre className="text-xs text-secondary-foreground font-mono whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">{narrative}</pre>
          )}
        </div>
      )}

      {/* API Endpoints Reference */}
      {showApiEndpoints && (
        <div className="bg-surface-1/40 border border-border rounded-xl p-4">
          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Open Dental API Endpoints</h4>
          <div className="grid grid-cols-2 gap-2">
            {[
              { m: "GET", ep: `/chartmodules/${claim.patientId}/ProgNotes`, d: "Pull chart & notes" },
              { m: "GET", ep: `/claimprocs?PatNum=${claim.patientId}`, d: "Claim procedure details" },
              { m: "GET", ep: `/patientnotes/${claim.patientId}`, d: "Medical history & service notes" },
              { m: "POST", ep: "/procnotes (doAppendNote=true)", d: "Write addendum to procedure" },
              { m: "POST", ep: "/documents (rawBase64)", d: "Upload signed SOAP PDF" },
              { m: "PUT", ep: `/claims/{ClaimNum}`, d: "Update & resubmit claim" },
            ].map((e, i) => (
              <div key={i} className="bg-surface-2/40 rounded-lg p-2 flex items-start gap-2">
                <ClaimBadge variant={e.m === "GET" ? "success" : e.m === "POST" ? "info" : "pending"}>{e.m}</ClaimBadge>
                <div><div className="text-[11px] font-mono text-teal-light">{e.ep}</div><div className="text-[9px] text-muted-foreground">{e.d}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
