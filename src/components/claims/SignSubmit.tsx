import { useState, useCallback, useEffect, useRef } from "react";
import JSZip from "jszip";
import { SignaturePad } from "./SignaturePad";
import { StatCard } from "./StatCard";
import { ClaimBadge } from "./Badge";
import { fmtCurrency, ARC_RESOLUTION, SOAP_OPTIONS, type DeniedClaim } from "@/data/claims-data";
import { buildSOAPPdfBlob } from "@/lib/generate-soap-pdf";

interface SignSubmitProps {
  claims: DeniedClaim[];
  approvedIds: Set<string>;
  // F-07 Phase 3 — narrative content per approved claim, keyed by claim.id.
  // Replaces the previous hardcoded "Auto-generated SOAP addendum" placeholder
  // with the actual narrative the user edited in RecoveryWorkflow.
  narrativesByClaimId?: Record<string, string>;
  onGoToReview: () => void;
  onSubmitAll: (signatureData: string) => void;
}

const CONFIRM_SECONDS = 90;

function buildFormForClaim(claim: DeniedClaim, index: number) {
  const hasInfection = claim.issues.some((i) => /abscess|cellulitis|infection|swelling/i.test(i));
  const hasXrays = !claim.issues.some((i) => /radiograph/i.test(i));
  const wongBaker = hasInfection ? (index % 2 === 0 ? 10 : 8) : 6;

  return {
    treatmentBy: hasXrays
      ? ["Radiograph(s)", "Visual Exam", "Dental Exam"]
      : ["Visual Exam", "Dental Exam", "Symptoms"],
    reasonGA: "Previous Attempts Failed",
    prevTreatment: ["Behavior Management", "Local Anesthesia"],
    frankl: "1",
    attemptsFailed: hasInfection
      ? ["Combative Behavior", "Screaming", "Unable to Open Mouth"]
      : ["Combative Behavior", "Screaming"],
    subjective: hasInfection ? SOAP_OPTIONS.subjective[1] : SOAP_OPTIONS.subjective[0],
    objective: hasInfection ? SOAP_OPTIONS.objective[2] : SOAP_OPTIONS.objective[0],
    assessment: SOAP_OPTIONS.assessment[0],
    plan: SOAP_OPTIONS.plan[0],
    painScale: wongBaker,
    emergencyCert: hasInfection ? SOAP_OPTIONS.emergencyCert[1] : SOAP_OPTIONS.emergencyCert[0],
    gaJustification: SOAP_OPTIONS.gaJustification[0],
  };
}

export const SignSubmit = ({ claims, approvedIds, narrativesByClaimId = {}, onGoToReview, onSubmitAll }: SignSubmitProps) => {
  const [signature, setSignature] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [confirmMode, setConfirmMode] = useState(false);
  const [countdown, setCountdown] = useState(CONFIRM_SECONDS);
  const [confirmPaused, setConfirmPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const approvedClaims = claims.filter((c) => approvedIds.has(c.id));
  const totalAmount = approvedClaims.reduce((s, c) => s + c.billedAmt, 0);

  // Countdown timer for confirm mode
  useEffect(() => {
    if (!confirmMode || confirmPaused || countdown <= 0) return;
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [confirmMode, confirmPaused, countdown]);

  // Auto-submit when countdown reaches 0
  useEffect(() => {
    if (confirmMode && countdown === 0 && signature) {
      onSubmitAll(signature);
      setSubmitted(true);
      setConfirmMode(false);
    }
  }, [confirmMode, countdown, signature, onSubmitAll]);

  const startConfirmMode = () => {
    if (!signature) return;
    setConfirmMode(true);
    setCountdown(CONFIRM_SECONDS);
    setConfirmPaused(false);
  };

  const cancelConfirmMode = () => {
    setConfirmMode(false);
    setCountdown(CONFIRM_SECONDS);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleImmediateSubmit = () => {
    if (!signature) return;
    onSubmitAll(signature);
    setSubmitted(true);
    setConfirmMode(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleDownloadZip = useCallback(async () => {
    if (!signature || approvedClaims.length === 0) return;
    setDownloading(true);
    try {
      const zip = new JSZip();
      const dateStr = new Date().toISOString().slice(0, 10);
      const pdfPromises = approvedClaims.map(async (claim, idx) => {
        const form = buildFormForClaim(claim, idx);
        // F-07 Phase 3 — use the user-edited narrative for this claim; fall back to a sane default only if no narrative was attached.
        const narrative = narrativesByClaimId[claim.id] || "Auto-generated SOAP addendum";
        const blob = await buildSOAPPdfBlob({ claim, form, narrative, signatureDataUrl: signature });
        zip.file(`SOAP_Note_${claim.patientId}_${dateStr}.pdf`, blob);
      });
      await Promise.all(pdfPromises);
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `SOAP_Addendums_${dateStr}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("ZIP generation failed:", err);
    } finally {
      setDownloading(false);
    }
  }, [signature, approvedClaims]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const progress = ((CONFIRM_SECONDS - countdown) / CONFIRM_SECONDS) * 100;

  // F-07 — Check `submitted` BEFORE the empty-state check. Parent's handleSubmit
  // clears pendingIds (which is what approvedClaims is derived from), so after
  // submission approvedClaims.length === 0. If the empty-state check ran first,
  // the success screen with the Download button would never render — user would
  // see "No approved claims yet" instead of the Submitted! screen with download.
  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-black text-stone-900 dark:text-white mb-2">Submitted!</h2>
        <p className="text-sm text-stone-400 dark:text-slate-400 mb-3">
          {approvedClaims.length} addendums signed & queued for Denti-Cal resubmission — {fmtCurrency(totalAmount)} to recover!
        </p>
        <button onClick={handleDownloadZip} disabled={downloading} className="mt-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-400 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-teal-900/40">
          {downloading ? "Generating…" : `Download All ${approvedClaims.length} PDFs (.zip)`}
        </button>
      </div>
    );
  }

  if (approvedClaims.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="text-5xl mb-4">📋</div>
        <h3 className="text-base font-bold text-stone-700 dark:text-slate-300 mb-2">No approved claims yet</h3>
        <p className="text-xs text-stone-400 dark:text-slate-400 mb-4">Approve claims in the Review tab first.</p>
        <button onClick={onGoToReview} className="px-6 py-2.5 bg-teal-600 hover:bg-teal-400 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-teal-900/40">
          Go to Review →
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6 max-w-xl">
        <StatCard label="Ready to Submit" value={approvedClaims.length} sub="approved addendums" color="teal" />
        <StatCard label="Revenue to Recover" value={fmtCurrency(totalAmount)} sub="total approved amount" color="teal" />
      </div>

      {/* Confirm Mode Banner */}
      {confirmMode && (
        <div className="bg-amber-950/30 border-2 border-amber-500/40 rounded-2xl p-5 mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-lg">⏱️</div>
              <div>
                <h3 className="text-sm font-black text-amber-400">Confirm Mode Active</h3>
                <p className="text-[10px] text-stone-400 dark:text-slate-400">
                  {approvedClaims.length} addendums will auto-submit when timer expires. Review or cancel below.
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-mono font-black ${countdown <= 10 ? "text-destructive animate-pulse" : "text-amber-400"}`}>
                {formatTime(countdown)}
              </div>
              <div className="text-[9px] text-stone-400 dark:text-slate-400">remaining</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-stone-100 dark:bg-slate-700 rounded-full overflow-hidden mb-4">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${countdown <= 10 ? "bg-destructive" : "bg-gradient-to-r from-amber-500 to-primary"}`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleImmediateSubmit}
              className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
            >
              Submit Now →
            </button>
            <button
              onClick={() => setConfirmPaused(!confirmPaused)}
              className="px-5 py-2.5 bg-stone-50 dark:bg-slate-800 hover:bg-stone-100 dark:bg-slate-700 border border-stone-200 dark:border-slate-700 text-stone-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all"
            >
              {confirmPaused ? "▶ Resume" : "⏸ Pause"}
            </button>
            <button
              onClick={cancelConfirmMode}
              className="px-5 py-2.5 bg-destructive/10 hover:bg-destructive/20 border border-destructive/30 text-destructive text-xs font-bold rounded-xl transition-all"
            >
              ✕ Cancel
            </button>
          </div>
        </div>
      )}

      {/* Signature */}
      <div className="mb-6">
        <SignaturePad onSignatureChange={setSignature} />
      </div>

      {/* Approved Claims List */}
      <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 rounded-2xl overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-stone-200 dark:border-slate-700">
          <h3 className="text-sm font-bold text-stone-900 dark:text-white">Approved Claims</h3>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {approvedClaims.map((c) => (
            <div key={c.id} className="px-5 py-2.5 border-b border-stone-200 dark:border-slate-700 last:border-0 flex items-center gap-3 text-xs">
              <span className="font-mono text-teal-500 dark:text-teal-400 font-semibold w-16">{c.patientId}</span>
              <span className="text-stone-700 dark:text-slate-300 w-24">{c.clinic}</span>
              <ClaimBadge variant="high">{c.denialCode}</ClaimBadge>
              <span className="font-mono text-stone-700 dark:text-slate-300 ml-auto">{fmtCurrency(c.billedAmt)}</span>
              <span className="text-emerald-400">✓</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {!confirmMode && (
          <>
            <button
              onClick={handleImmediateSubmit}
              disabled={!signature}
              className={`flex-1 py-3.5 text-sm font-bold rounded-xl transition-all ${
                signature
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-900/30 cursor-pointer"
                  : "bg-stone-100 dark:bg-slate-700 text-stone-400 dark:text-slate-400 cursor-not-allowed"
              }`}
            >
              {signature ? `Submit ${approvedClaims.length} Signed Addendums →` : "Draw signature to enable"}
            </button>

            <button
              onClick={startConfirmMode}
              disabled={!signature}
              className={`px-6 py-3.5 text-sm font-bold rounded-xl transition-all border ${
                signature
                  ? "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-400 cursor-pointer"
                  : "bg-stone-100 dark:bg-slate-700 border-stone-200 dark:border-slate-700 text-stone-400 dark:text-slate-400 cursor-not-allowed"
              }`}
            >
              ⏱️ Confirm Mode (90s)
            </button>

            
          </>
        )}
      </div>
    </div>
  );
};
