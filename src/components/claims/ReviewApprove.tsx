import { useState } from "react";
import { ClaimBadge } from "./Badge";
import { StatCard } from "./StatCard";
import { DictateButton } from "./DictateButton";
import { fmtCurrency, ARC_RESOLUTION, SOAP_OPTIONS, type DeniedClaim } from "@/data/claims-data";
import { generateSOAPPdf } from "@/lib/generate-soap-pdf";
import { supabase } from "@/integrations/supabase/client";
import type { SoapAddendumRow } from "@/hooks/use-denied-claims";
import { apiFetch, getPracticeId } from "@/lib/api";

interface ReviewApproveProps {
  claims: DeniedClaim[];
  approvedIds: Set<string>;
  pendingIds: Set<string>;
  onApprove: (id: string) => void;
  onBulkApprove: (ids: string[]) => void;
  onGoToSign: () => void;
  role?: "staff" | "approver" | null;
  onDeleteClaim?: (id: string) => void;
  onMarkPaid?: (id: string) => void;
  soapAddendums?: SoapAddendumRow[];
}

// Fallback in-memory SOAP generation for claims without DB addendums
function autoGenerateSOAP(claim: DeniedClaim, index: number) {
  const hasInfection = claim.issues.some((i) => /abscess|cellulitis|infection|swelling/i.test(i));
  const hasXrays = !claim.issues.some((i) => /radiograph/i.test(i));
  const wongBaker = hasInfection ? (index % 2 === 0 ? 10 : 8) : 6;

  const treatmentBy = hasXrays
    ? ["Radiograph(s)", "Visual Exam", "Dental Exam"]
    : ["Visual Exam", "Dental Exam", "Symptoms"];

  const subjective = hasInfection
    ? "Severe tooth pain with facial swelling, unable to eat, fever present, not sleeping."
    : "Teeth that hurt, difficulty chewing and eating. Sleep disrupted by dental pain.";

  const objective = hasInfection
    ? "Patient in acute distress. Multiple teeth requiring treatment. Fluctuant swelling. Extensive caries with pulpal involvement. Unable to cooperate. ASA I."
    : "Patient fearful, unable to cooperate. Extensive ECC affecting multiple teeth. Rampant caries. ASA I.";

  const assessment = `Extensive dental caries requiring multiple procedures. ${hasInfection ? "Acute infection present. " : ""}Unable to cooperate. GA medically necessary.`;

  const plan = "Pulp/SSC, extractions, and restorations as indicated per treatment plan. GA required due to inability to cooperate and extent of treatment.";

  const emergencyCert = hasInfection
    ? SOAP_OPTIONS.emergencyCert[1]
    : SOAP_OPTIONS.emergencyCert[0];

  const gaJustification = SOAP_OPTIONS.gaJustification[0];

  return {
    franklScore: 1,
    wongBaker,
    treatmentBy,
    previousTreatment: ["Behavior Management", "Local Anesthesia"],
    failedReasons: hasInfection
      ? ["Combative Behavior", "Screaming", "Unable to Open Mouth"]
      : ["Combative Behavior", "Screaming"],
    subjective,
    objective,
    assessment,
    plan,
    emergencyCert,
    gaJustification,
    hasXrays,
    confidence: claim.issues.length <= 2 ? "high" : "review" as "high" | "review",
    source: "memory" as const,
  };
}

// Convert a DB soap_addendum row to the same shape as autoGenerateSOAP
function soapFromDb(row: SoapAddendumRow) {
  const treatmentBy = Array.isArray(row.treatment_determined_by) ? row.treatment_determined_by as string[] : ["Visual Exam", "Dental Exam"];
  const previousTreatment = Array.isArray(row.previous_treatment) ? row.previous_treatment as string[] : ["Behavior Management"];
  const failedReasons = Array.isArray(row.failed_reasons) ? row.failed_reasons as string[] : ["Combative Behavior"];

  return {
    franklScore: row.frankl_score ?? 1,
    wongBaker: row.wong_baker_score ?? 6,
    treatmentBy,
    previousTreatment,
    failedReasons,
    subjective: row.subjective ?? "",
    objective: row.objective ?? "",
    assessment: row.assessment ?? "",
    plan: row.plan ?? "",
    emergencyCert: row.emergency_certification ?? SOAP_OPTIONS.emergencyCert[0],
    gaJustification: row.ga_justification ?? SOAP_OPTIONS.gaJustification[0],
    hasXrays: row.has_xrays_pre_dos ?? false,
    confidence: (row.confidence === "high" ? "high" : "review") as "high" | "review",
    source: "database" as const,
  };
}

export const ReviewApprove = ({ claims, approvedIds, pendingIds, onApprove, onBulkApprove, onGoToSign, role, onDeleteClaim, onMarkPaid, soapAddendums = [] }: ReviewApproveProps) => {
  const [mode, setMode] = useState<"batch" | "individual">("batch");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editField, setEditField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, Record<string, string>>>({});
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const OPTION_POOLS: Record<string, string[]> = {
    S: SOAP_OPTIONS.subjective,
    O: SOAP_OPTIONS.objective,
    A: SOAP_OPTIONS.assessment,
    P: SOAP_OPTIONS.plan,
  };

  const handleAiGenerate = async (claim: DeniedClaim, sectionKey: string) => {
    const loadingKey = `${claim.id}_${sectionKey}`;
    setAiLoading((prev) => ({ ...prev, [loadingKey]: true }));
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 400,
          messages: [{ role: "user", content: `Write the ${sectionKey} section for a Denti-Cal GA resubmission SOAP note. Patient: ${claim.patientId}, DOS: ${claim.claimDate}, Clinic: ${claim.clinic}, Denial: ${claim.denialCode}. 2 sentences max. Return only the section text.` }],
        }),
      });
      const aiResp = await res.json();
      const aiText = aiResp.content?.[0]?.text;
      if (aiText) setFieldValue(claim.id, sectionKey, aiText.trim());
    } catch (err: any) {
      console.error("AI generation failed:", err);
    } finally {
      setAiLoading((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  const handleMenuSelect = (claimId: string, sectionKey: string, value: string) => {
    setFieldValue(claimId, sectionKey, value);
    setMenuOpen(null);
  };

  const deniedClaims = claims.filter((c) => c.status === "denied" || c.status === "pending" || pendingIds.has(c.id) || approvedIds.has(c.id));
  const soapData = deniedClaims.map((c, i) => {
    const dbAddendum = soapAddendums.find((s) => s.claim_id === c.id);
    const soap = dbAddendum ? soapFromDb(dbAddendum) : autoGenerateSOAP(c, i);
    return { claim: c, soap };
  });

  const highConfCount = soapData.filter((d) => d.soap.confidence === "high" && !pendingIds.has(d.claim.id) && !approvedIds.has(d.claim.id)).length;
  const reviewCount = soapData.filter((d) => d.soap.confidence === "review" && !pendingIds.has(d.claim.id) && !approvedIds.has(d.claim.id)).length;
  const pendingCount = pendingIds.size;
  const approvedCount = approvedIds.size;
  const pendingAmount = deniedClaims.filter((c) => pendingIds.has(c.id)).reduce((s, c) => s + c.billedAmt, 0);
  const approvedAmount = deniedClaims.filter((c) => approvedIds.has(c.id)).reduce((s, c) => s + c.billedAmt, 0);
  const atRisk = deniedClaims.filter((c) => c.status === "denied").reduce((s, c) => s + c.billedAmt, 0);

  // Revenue recovered = claims marked as "paid"
  const paidClaims = claims.filter((c) => c.status === "paid");
  const paidCount = paidClaims.length;
  const paidAmount = paidClaims.reduce((s, c) => s + c.billedAmt, 0);

  const toggleSelect = (id: string) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  // Signed claims eligible for bulk mark paid
  const signedUnpaidIds = claims.filter((c) => approvedIds.has(c.id) && c.status !== "paid").map((c) => c.id);

  const handleBulkMarkPaid = () => {
    if (!onMarkPaid) return;
    signedUnpaidIds.forEach((id) => onMarkPaid(id));
  };

  const handleBulkApproveHigh = () => {
    const ids = soapData
      .filter((d) => d.soap.confidence === "high" && !pendingIds.has(d.claim.id) && !approvedIds.has(d.claim.id))
      .map((d) => d.claim.id);
    onBulkApprove(ids);
  };

  const getFieldValue = (claimId: string, field: string, defaultVal: string) => {
    return editValues[claimId]?.[field] ?? defaultVal;
  };

  const setFieldValue = (claimId: string, field: string, val: string) => {
    setEditValues((prev) => ({
      ...prev,
      [claimId]: { ...prev[claimId], [field]: val },
    }));
  };


  // ── Save narrative to Azure Blob via API ──────────────────────────────────
  const saveToVault = async (claim: DeniedClaim, htmlContent: string) => {
    try {
     const res = await apiFetch('/api/claims/documents/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          htmlContent,
          patientName:      claim.patientName,
          patientDob:       claim.dob,
          memberId:         (claim as any).memberId || '',
          cdtCode:          (claim as any).cdtCode || (claim.row as any)?.CDTCode || '',
          clinicName:       claim.clinic,
          providerName:     claim.dentist,
          denialCode:       (claim.row as any)?.DenialCode || '',
          narrativeSummary: htmlContent.replace(/<[^>]*>/g, '').substring(0, 500),
          practiceId:       getPracticeId(),
          createdBy:        'Staff',
        }),
      }); 
      if (!res.ok) throw new Error('Save failed');
      alert('✅ Document saved to vault successfully!');
    } catch (err) {
      alert('❌ Failed to save document. Please try again.');
    }
  };

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-7 gap-3 mb-5">
        <StatCard label="Total" value={deniedClaims.length} sub="claims to review" color="sky" />
        <StatCard label="High Confidence" value={highConfCount} sub="auto-generated" color="teal" />
        <StatCard label="Needs Review" value={reviewCount} sub="sparse chart data" color="amber" />
        <StatCard label="Pending Sign-off" value={pendingCount} sub={pendingCount > 0 ? `${fmtCurrency(pendingAmount)} awaiting signature` : "submit to queue"} color="sky" />
        <StatCard label="Signed" value={approvedCount} sub={approvedCount > 0 ? `${fmtCurrency(approvedAmount)} submitted` : "signed & submitted"} color="teal" />
        <StatCard label="Revenue Recovered" value={paidCount > 0 ? fmtCurrency(paidAmount) : "—"} sub={paidCount > 0 ? `${paidCount} claims paid` : "Mark signed claims as paid"} color="emerald" />
        <StatCard label="At Risk" value={fmtCurrency(atRisk)} sub="total denied amount" color="red" />
      </div>

      {/* Mode Toggle + Actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode("batch")}
            className={`px-4 py-2 text-[11px] font-bold rounded-xl transition-all ${mode === "batch" ? "bg-primary text-white" : "bg-stone-50 dark:bg-slate-800 text-stone-400 dark:text-slate-400"}`}
          >
            Batch Review
          </button>
          <button
            onClick={() => setMode("individual")}
            className={`px-4 py-2 text-[11px] font-bold rounded-xl transition-all ${mode === "individual" ? "bg-primary text-white" : "bg-stone-50 dark:bg-slate-800 text-stone-400 dark:text-slate-400"}`}
          >
            Individual Review
          </button>
        </div>
        <div className="flex items-center gap-2">
          {mode === "batch" && highConfCount > 0 && (
            <button
              onClick={handleBulkApproveHigh}
              className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg"
            >
              Bulk Approve All High-Confidence ({highConfCount}) →
            </button>
          )}
          {mode === "individual" && selected.size > 0 && (
            <button
              onClick={() => { onBulkApprove(Array.from(selected)); setSelected(new Set()); }}
              className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg"
            >
              Approve Selected ({selected.size}) →
            </button>
          )}
          {pendingCount > 0 && (
            <button onClick={onGoToSign} className="px-5 py-2 bg-stone-50 dark:bg-slate-800 hover:bg-stone-100 dark:bg-slate-700 border border-stone-200 dark:border-slate-700 text-stone-700 dark:text-slate-300 text-xs font-bold rounded-xl">
              Go to Sign & Submit ({pendingCount}) →
            </button>
          )}
          {onMarkPaid && signedUnpaidIds.length > 0 && (
            <button
              onClick={handleBulkMarkPaid}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all active:scale-[0.97]"
            >
              Mark All Paid ({signedUnpaidIds.length}) — {fmtCurrency(claims.filter((c) => signedUnpaidIds.includes(c.id)).reduce((s, c) => s + c.billedAmt, 0))}
            </button>
          )}
        </div>
      </div>

      {/* Claims List */}
      <div className="space-y-2">
        {soapData.map(({ claim, soap }) => {
          const isPending = pendingIds.has(claim.id);
          const isApproved = approvedIds.has(claim.id);
          const isPaid = claim.status === "paid";
          const hasStatus = isPending || isApproved || isPaid;
          const isExpanded = expanded === claim.id;

          return (
            <div key={claim.id} className={`bg-white dark:bg-slate-900 border rounded-2xl transition-all ${
              isPaid ? "border-emerald-700/30 bg-emerald-950/10" : isApproved ? "border-emerald-700/30 bg-emerald-950/10" : isPending ? "border-sky-700/30 bg-sky-950/10" : soap.confidence === "review" ? "border-l-4 border-l-amber-500/50 border-t border-r border-b border-stone-200 dark:border-slate-700" : "border-stone-200 dark:border-slate-700"
            }`}>
              {/* Collapsed Row */}
              <div className="px-4 py-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : claim.id)}>
                {mode === "individual" && !hasStatus && (
                  <input
                    type="checkbox"
                    checked={selected.has(claim.id)}
                    onChange={() => toggleSelect(claim.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="accent-teal-500"
                  />
                )}
                <span className="font-mono text-teal-500 dark:text-teal-400 text-sm font-bold w-16">{claim.patientId}</span>
                <span className="text-xs text-stone-700 dark:text-slate-300 w-24">{claim.clinic}</span>
                <span className="text-xs text-stone-400 dark:text-slate-400 w-24">{claim.claimDate}</span>
                <ClaimBadge variant="high">{claim.denialCode}</ClaimBadge>
                <span className="text-xs font-mono text-stone-700 dark:text-slate-300 w-16 text-right">{fmtCurrency(claim.billedAmt)}</span>
                <div className="flex-1" />
                <ClaimBadge variant={soap.confidence === "high" ? "success" : "high"}>
                  {soap.confidence}
                </ClaimBadge>
                {soap.source === "database" && (
                  <span className="px-2 py-0.5 bg-teal-50 dark:bg-teal-900/20 text-primary text-[9px] font-bold rounded border border-primary/20">DB</span>
                )}
                {isPaid ? (
                  <span className="px-3 py-1 bg-emerald-500/30 text-emerald-300 text-[10px] font-bold rounded-lg">PAID ✓</span>
                ) : isApproved ? (
                  <div className="flex items-center gap-1.5">
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-lg">SIGNED ✓</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        generateSOAPPdf({
                          claim,
                          form: {
                            subjective: editValues[claim.id]?.S || '',
                            objective: editValues[claim.id]?.O || '',
                            assessment: editValues[claim.id]?.A || '',
                            plan: editValues[claim.id]?.P || '',
                            frankl: '1',
                            treatmentBy: ['Radiograph(s)', 'Visual Exam', 'Dental Exam'],
                            prevTreatment: ['Nitrous Oxide', 'Local Anesthesia', 'Oral Sedation'],
                          },
                          narrative: '',
                        });
                      }}
                      className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-600 text-blue-500 hover:text-white text-[10px] font-bold rounded-lg transition-all border border-blue-500/20"
                    >
                      ⬇ Download</button>
                      <button
                        onClick={() => {
                          const vals = editValues[claim.id] || {};
                          const narrativeText = `S — Subjective\n${vals.S || ''}\n\nO — Objective\n${vals.O || ''}\n\nA — Assessment\n${vals.A || ''}\n\nP — Plan\n${vals.P || ''}`;
                          const htmlContent = `<html><body style="font-family:Arial,sans-serif;padding:24px;max-width:800px">
                            <h2 style="color:#0d9488">Denti-Cal SOAP Narrative</h2>
                            <p><strong>Patient:</strong> ${claim.patientName} | <strong>DOB:</strong> ${claim.dob || '—'} | <strong>Member ID:</strong> ${(claim as any).memberId || '—'}</p>
                            <p><strong>CDT Code:</strong> ${claim.cdtCode} | <strong>Clinic:</strong> ${claim.clinic} | <strong>DOS:</strong> ${claim.claimDate}</p>
                            <p><strong>Denial:</strong> ${claim.denialCode} — ${claim.denialReason}</p>
                            <hr/>
                            <h3>S — Subjective</h3><p>${vals.S || '—'}</p>
                            <h3>O — Objective</h3><p>${vals.O || '—'}</p>
                            <h3>A — Assessment</h3><p>${vals.A || '—'}</p>
                            <h3>P — Plan</h3><p>${vals.P || '—'}</p>
                          </body></html>`;
                          saveToVault(claim, htmlContent);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20 transition-colors"
                      >
                        ☁ Save & Store
                    </button>
                    <button
                        onClick={() => {
                          const vals = editValues[claim.id] || {};
                          const htmlContent = `<html><body style="font-family:Arial,sans-serif;padding:24px;max-width:800px">
                            <h2 style="color:#0d9488">Denti-Cal SOAP Narrative</h2>
                            <p><strong>Patient:</strong> ${claim.patientName} | <strong>DOB:</strong> ${claim.dob || '—'} | <strong>Member ID:</strong> ${(claim as any).memberId || '—'}</p>
                            <p><strong>CDT Code:</strong> ${claim.cdtCode} | <strong>Clinic:</strong> ${claim.clinic} | <strong>DOS:</strong> ${claim.claimDate}</p>
                            <p><strong>Denial:</strong> ${claim.denialCode} — ${claim.denialReason}</p>
                            <hr/>
                            <h3>S — Subjective</h3><p>${vals.S || '—'}</p>
                            <h3>O — Objective</h3><p>${vals.O || '—'}</p>
                            <h3>A — Assessment</h3><p>${vals.A || '—'}</p>
                            <h3>P — Plan</h3><p>${vals.P || '—'}</p>
                          </body></html>`;
                          const win = window.open('', '_blank');
                          if (win) { win.document.write(htmlContent); win.document.close(); win.print(); }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-colors"
                      >
                        🖨 Print / Download
                    </button>
                    {onMarkPaid && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onMarkPaid(claim.id); }}
                        className="px-3 py-1.5 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white text-[10px] font-bold rounded-lg transition-all border border-emerald-600/20"
                      >
                        Mark Paid $
                      </button>
                    )}
                  </div>
                ) : isPending ? (
                  <span className="px-3 py-1 bg-sky-500/20 text-sky-400 text-[10px] font-bold rounded-lg">PENDING SIGN-OFF</span>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); onApprove(claim.id); }}
                    className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white text-[10px] font-bold rounded-lg transition-all"
                  >
                    Approve ✓
                  </button>
                )}
                {role === "approver" && onDeleteClaim && (
                  <button
                    onClick={(e) => { e.stopPropagation(); if (confirm(`Delete claim ${claim.patientId}?`)) onDeleteClaim(claim.id); }}
                    className="px-3 py-1.5 bg-destructive/10 hover:bg-destructive/20 text-destructive text-[10px] font-bold rounded-lg transition-all border border-destructive/20"
                  >
                    🗑
                  </button>
                )}
                <span className={`text-stone-400 dark:text-slate-400 text-xs transition-transform ${isExpanded ? "rotate-180" : ""}`}>▼</span>
              </div>

              {/* Expanded Detail */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-stone-200 dark:border-slate-700">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                    {/* Left: Chart Data */}
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.15em] text-teal-500 dark:text-teal-400 mb-3">Chart Data (Open Dental)</div>

                      <div className="bg-stone-50 dark:bg-slate-800 rounded-xl p-3 mb-3 space-y-1.5 text-xs">
                        <div className="flex justify-between"><span className="text-stone-400 dark:text-slate-400">Patient ID:</span><span className="font-mono text-teal-500 dark:text-teal-400">{claim.patientId}</span></div>
                        <div className="flex justify-between"><span className="text-stone-400 dark:text-slate-400">Provider:</span><span className="text-stone-700 dark:text-slate-300">{claim.dentist}</span></div>
                        <div className="flex justify-between"><span className="text-stone-400 dark:text-slate-400">Clinic:</span><span className="text-stone-700 dark:text-slate-300">{claim.clinic}</span></div>
                        <div className="flex justify-between"><span className="text-stone-400 dark:text-slate-400">DOS:</span><span className="text-stone-700 dark:text-slate-300">{claim.claimDate}</span></div>
                      </div>

                      <div className="text-[10px] font-black uppercase tracking-[0.12em] text-stone-400 dark:text-slate-400 mb-2">Auto-Derived Fields</div>
                      <div className="bg-stone-50 dark:bg-slate-800 rounded-xl p-3 space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-stone-400 dark:text-slate-400">Frankl:</span>
                          <span className="text-amber-400 font-bold">{soap.franklScore} — Definitely Negative</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-stone-400 dark:text-slate-400">Wong-Baker:</span>
                          <span className="font-bold text-stone-700 dark:text-slate-300">
                            {soap.wongBaker}/10 {soap.wongBaker === 10 ? "😭" : soap.wongBaker === 8 ? "😢" : "🙁"}
                            <span className="text-[9px] text-stone-400 dark:text-slate-400 ml-1">(diagnosis-derived)</span>
                          </span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-stone-400 dark:text-slate-400">Treatment By:</span>
                          <span className="text-stone-700 dark:text-slate-300 text-right">{soap.treatmentBy.join(", ")}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-stone-400 dark:text-slate-400">X-rays Pre-DOS:</span>
                          {soap.hasXrays
                            ? <span className="text-emerald-400 font-semibold">Yes ✓</span>
                            : <span className="text-stone-400 dark:text-slate-400">No</span>
                          }
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-stone-400 dark:text-slate-400">Failed Reasons:</span>
                          <span className="text-stone-700 dark:text-slate-300 text-right">{soap.failedReasons.join(", ")}</span>
                        </div>
                      </div>

                      <div className="text-[10px] font-black uppercase tracking-[0.12em] text-stone-400 dark:text-slate-400 mb-2 mt-3">Issues Identified</div>
                      <div className="bg-red-950/20 border border-red-800/30 rounded-xl p-3">
                        {claim.issues.map((iss, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-red-300/80 mb-1">
                            <span className="text-red-500 mt-0.5 text-[10px]">✕</span>{iss}
                          </div>
                        ))}
                        <div className="mt-2 pt-2 border-t border-red-800/20 text-[10px] text-stone-400 dark:text-slate-400">
                          <span className="text-amber-400 font-semibold">Action:</span>{" "}
                          {ARC_RESOLUTION[claim.denialCode]?.action}
                        </div>
                      </div>
                    </div>

                    {/* Right: SOAP Addendum */}
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.15em] text-teal-500 dark:text-teal-400 mb-3">SOAP Addendum</div>

                      {[
                        { key: "S", label: "Subjective", val: soap.subjective },
                        { key: "O", label: "Objective", val: soap.objective },
                        { key: "A", label: "Assessment", val: soap.assessment },
                        { key: "P", label: "Plan", val: soap.plan },
                      ].map((section) => {
                        const fieldKey = `${claim.id}_${section.key}`;
                        const isEditing = editField === fieldKey;
                        const value = getFieldValue(claim.id, section.key, section.val);

                        return (
                          <div key={section.key} className="mb-3">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-[10px] font-black uppercase tracking-[0.12em] text-teal-500 dark:text-teal-400">{section.key}:</span>
                              <span className="text-[10px] text-stone-400 dark:text-slate-400">{section.label}</span>
                              <div className="ml-auto flex items-center gap-1.5 relative">
                                <DictateButton
                                  onTranscript={(text) => {
                                    const existing = getFieldValue(claim.id, section.key, section.val);
                                    setFieldValue(claim.id, section.key, existing + (existing ? " " : "") + text);
                                  }}
                                  onStart={() => setEditField(fieldKey)}
                                />
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleAiGenerate(claim, section.key); }}
                                    disabled={!!aiLoading[`${claim.id}_${section.key}`]}
                                    className="px-2 py-0.5 text-[9px] font-bold text-violet-300 bg-violet-500/15 hover:bg-violet-500/30 border border-violet-500/20 rounded-lg transition-all flex items-center gap-1 disabled:opacity-50"
                                  >
                                    {aiLoading[`${claim.id}_${section.key}`] ? (
                                      <><span className="animate-spin">⟳</span> Generating…</>
                                    ) : (
                                      <>🤖 AI</>
                                    )}
                                  </button>
                                {OPTION_POOLS[section.key] && (
                                  <div className="relative">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const key = `${claim.id}_${section.key}`;
                                        setMenuOpen(menuOpen === key ? null : key);
                                      }}
                                      className="px-2 py-0.5 text-[9px] font-bold text-stone-400 dark:text-slate-400 bg-stone-50 dark:bg-slate-800 hover:bg-stone-100 dark:bg-slate-700 border border-stone-200 dark:border-slate-700 rounded-lg transition-all"
                                    >
                                      Menu ▾
                                    </button>
                                    {menuOpen === `${claim.id}_${section.key}` && (
                                      <div className="absolute right-0 top-6 z-50 w-72 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto">
                                        {OPTION_POOLS[section.key]?.map((opt, oi) => (
                                          <button
                                            key={oi}
                                            onClick={(e) => { e.stopPropagation(); handleMenuSelect(claim.id, section.key, opt); }}
                                            className="w-full text-left px-3 py-2 text-[10px] text-stone-700 dark:text-slate-300 hover:bg-stone-50 dark:bg-slate-800 border-b border-stone-200 dark:border-slate-700 last:border-0 transition-colors"
                                          >
                                            {opt}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            {isEditing ? (
                              <div>
                                <textarea
                                  className="w-full h-20 bg-stone-50 dark:bg-slate-800 border border-primary/30 rounded-lg p-2 text-xs text-stone-700 dark:text-slate-300 font-mono focus:outline-none focus:border-primary/50"
                                  value={value}
                                  onChange={(e) => setFieldValue(claim.id, section.key, e.target.value)}
                                />
                                <button
                                  onClick={() => setEditField(null)}
                                  className="text-[10px] text-teal-500 dark:text-teal-400 font-semibold mt-1"
                                >
                                  Done ✓
                                </button>
                              </div>
                            ) : (
                              <div
                                onClick={() => setEditField(fieldKey)}
                                className="bg-stone-50 dark:bg-slate-800 rounded-lg p-2.5 text-xs text-stone-700 dark:text-slate-300 cursor-pointer hover:border-primary/30 border border-transparent transition-all"
                              >
                                {value}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Emergency Cert */}
                      <div className="bg-red-950/20 border border-red-800/30 rounded-xl p-3 mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest">Emergency Certification — Title 22</span>
                          <div className="ml-auto">
                            <DictateButton
                              onTranscript={(text) => {
                                const existing = getFieldValue(claim.id, "emergencyCert", soap.emergencyCert);
                                setFieldValue(claim.id, "emergencyCert", existing + (existing ? " " : "") + text);
                              }}
                              onStart={() => setEditField(`${claim.id}_emergencyCert`)}
                            />
                          </div>
                        </div>
                        {editField === `${claim.id}_emergencyCert` ? (
                          <div>
                            <textarea
                              className="w-full h-16 bg-red-950/30 border border-red-800/30 rounded-lg p-2 text-[11px] text-red-300/80 font-mono focus:outline-none focus:border-red-500/50"
                              value={getFieldValue(claim.id, "emergencyCert", soap.emergencyCert)}
                              onChange={(e) => setFieldValue(claim.id, "emergencyCert", e.target.value)}
                            />
                            <button onClick={() => setEditField(null)} className="text-[10px] text-teal-500 dark:text-teal-400 font-semibold mt-1">Done ✓</button>
                          </div>
                        ) : (
                          <p
                            onClick={() => setEditField(`${claim.id}_emergencyCert`)}
                            className="text-[11px] text-red-300/80 leading-relaxed cursor-pointer hover:text-red-200 transition-colors"
                          >
                            {getFieldValue(claim.id, "emergencyCert", soap.emergencyCert)}
                          </p>
                        )}
                      </div>

                      {/* GA Justification */}
                      <div className="bg-teal-50 dark:bg-teal-900/20 border border-primary/20 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-bold text-teal-500 dark:text-teal-400 uppercase tracking-widest">GA Medical Necessity</span>
                          <div className="ml-auto">
                            <DictateButton
                              onTranscript={(text) => {
                                const existing = getFieldValue(claim.id, "gaJustification", soap.gaJustification);
                                setFieldValue(claim.id, "gaJustification", existing + (existing ? " " : "") + text);
                              }}
                              onStart={() => setEditField(`${claim.id}_gaJustification`)}
                            />
                          </div>
                        </div>
                        {editField === `${claim.id}_gaJustification` ? (
                          <div>
                            <textarea
                              className="w-full h-16 bg-teal-50 dark:bg-teal-900/20 border border-primary/20 rounded-lg p-2 text-[11px] text-stone-700 dark:text-slate-300 font-mono focus:outline-none focus:border-primary/50"
                              value={getFieldValue(claim.id, "gaJustification", soap.gaJustification)}
                              onChange={(e) => setFieldValue(claim.id, "gaJustification", e.target.value)}
                            />
                            <button onClick={() => setEditField(null)} className="text-[10px] text-teal-500 dark:text-teal-400 font-semibold mt-1">Done ✓</button>
                          </div>
                        ) : (
                          <p
                            onClick={() => setEditField(`${claim.id}_gaJustification`)}
                            className="text-[11px] text-stone-700 dark:text-slate-300 leading-relaxed cursor-pointer hover:text-stone-900 dark:text-white transition-colors"
                          >
                            {getFieldValue(claim.id, "gaJustification", soap.gaJustification)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
