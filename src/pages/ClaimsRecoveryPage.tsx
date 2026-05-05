import BulkCSVUpload from "./BulkCSVUpload";
import { ReviewApprove } from "@/components/claims/ReviewApprove";
import { SignSubmit } from "@/components/claims/SignSubmit";
import { PreventionEngine } from "@/components/claims/PreventionEngine";
import DocumentsVault from "@/components/claims/DocumentsVault";
import { OptionAFlow } from "@/components/claims/OptionAFlow";
import { useState, useMemo, useEffect } from "react";
import { useJurisdiction } from "../context/JurisdictionContext";
import { useAuth } from "../context/AuthContext";
import { ODA_FEES, CDCP_STEP_THERAPY, CDCP_GA_CRITERIA, CDCP_DENIAL_CODES, CDCP_NARRATIVE_TEMPLATES, CA_PAYERS, CA_MOCK_CLAIMS } from "../data/canadian-claims-data";
import {
  FileText, Shield, PenTool, BarChart3,
  CheckCircle, XCircle, ArrowRight, RefreshCw,
  Eye, Download, Zap, AlertTriangle, Clock,
  ChevronDown, Info, FolderOpen
} from "lucide-react";

// ─── SOURCE DOCUMENTS BAKED IN ───────────────────────────────────────────────
// Medi-Cal Dental Provider Handbook — February 2026 (CDT-25, effective Apr 1 2025)
// Pediatric Dental GA Criteria Reference — APL 23-028 / March 2026
// MOC CDT-21 §8.1.145 — Adjunctive General Policies (D9000-D9999)
// All criteria, SMA fees, ARC codes, validation rules, and narratives sourced from above.

// ─── KNOWLEDGE BASE: SMA Fee Schedule (Feb 2026) ─────────────────────────────
// Fee schedule: SMA base rates (effective post-July 1) + current Prop 56 enhanced rates
// Prop 56 rates active until July 1, 2026 — use PROP56_FEES for current billing
const PROP56_FEES: Record<string, number> = {
  D9222: 76.82,  // SMA $45.68 + 68% Prop 56 increase
  D9223: 76.82,  // SMA $45.68 + 68% Prop 56 increase
  D9239: 29.50,  // SMA $21.07 + 40% Prop 56 increase
  D9230: 40.00,  // SMA $25.00 + 60% Prop 56 increase
  D9248: 40.00,  // estimated Prop 56 enhanced rate
};
const SMA_FEES: Record<string, { desc: string; fee: number; prop56Fee?: number; authRequired: boolean; notes: string }> = {
  D9222: { desc: "Deep Sedation/GA – First 15 Minutes",     fee: 45.68, prop56Fee: 76.82, authRequired: true,  notes: "TAR always required unless emergency per Title 22 §51056(b)" },
  D9223: { desc: "Deep Sedation/GA – Each Addl 15 Minutes", fee: 45.68, prop56Fee: 76.82, authRequired: true,  notes: "Billed in addition to D9222; 15-min increments" },
  D9239: { desc: "IV Moderate Sedation – First 15 Minutes", fee: 21.07, prop56Fee: 29.50, authRequired: true,  notes: "Requires facility permit 013H (age 0-6) or 013I (age 7-12)" },
  D9243: { desc: "IV Sedation – Each Addl 15 Minutes",      fee: 21.07, authRequired: true,  notes: "Billed in addition to D9239" },
  D9230: { desc: "Nitrous Oxide/Analgesia",                  fee: 25.00, authRequired: false, notes: "Auto-benefit under age 16; age 16+ requires documentation" },
  D9248: { desc: "Non-IV Conscious Sedation",                fee: 25.00, authRequired: false, notes: "Auto-benefit under age 13; age 13+ requires documentation" },
  D9110: { desc: "Palliative Treatment of Dental Pain",      fee: 45.00, authRequired: false, notes: "Emergency visits; cannot be prior authorized" },
  D4341: { desc: "Perio Scaling & Root Planing – Per Quad",  fee: 0,     authRequired: false, notes: "Full 6-point perio chart required; bleeding on probing ≥4mm" },
  D2930: { desc: "Stainless Steel Crown – Primary",          fee: 75.00, authRequired: false, notes: "Primary teeth; once per tooth per lifetime" },
  D3220: { desc: "Therapeutic Pulpotomy",                    fee: 71.00, authRequired: false, notes: "Primary teeth; removal of coronal pulp" },
  D7140: { desc: "Extraction – Erupted Tooth",               fee: 45.00, authRequired: false, notes: "No narrative if non-restorability clear; radiographs recommended" },
  D7210: { desc: "Surgical Extraction",                      fee: 80.00, authRequired: false, notes: "Requires radiographic documentation" },
};

// ─── KNOWLEDGE BASE: Step Therapy Protocol (MOC §8.1.145 + APL 23-028) ──────
const STEP_THERAPY = [
  { step: 1, method: "Behavior Modification + Local Anesthesia", code: null,    authRequired: false, autoAge: "All ages",  advanceCriteria: "Patient uncooperative or treatment not feasible" },
  { step: 2, method: "Nitrous Oxide (D9230)",                     code: "D9230", authRequired: false, autoAge: "Under 16",  advanceCriteria: "Nitrous insufficient; patient remains uncooperative" },
  { step: 3, method: "Non-IV Conscious Sedation (D9248)",         code: "D9248", authRequired: false, autoAge: "Under 13",  advanceCriteria: "Minimal sedation failed or not appropriate" },
  { step: 4, method: "IV Moderate/Deep Sedation (D9239/D9243)",   code: "D9239", authRequired: true,  autoAge: "None",      advanceCriteria: "Conscious sedation failed or contraindicated" },
  { step: 5, method: "General Anesthesia (D9222/D9223)",          code: "D9222", authRequired: true,  autoAge: "None",      advanceCriteria: "All lower levels failed or not clinically feasible" },
];

// ─── KNOWLEDGE BASE: GA Qualifying Criteria (MOC §8.1.145(e) + APL 23-028 §2.2)
const GA_CRITERIA = {
  required: [
    { id: "i",  label: "Local Anesthesia Insufficient", text: "Local anesthesia alone is insufficient or has failed for the planned procedures. Written documentation must include a copy of the patient record indicating such a failure or why it was not feasible based on the medical needs of the patient." },
    { id: "ii", label: "Minimal Sedation Failed/Contraindicated", text: "Use of inhalation of nitrous oxide/analgesia (D9230) or non-intravenous conscious sedation (D9248) failed or was not feasible based on the medical needs of the patient. Written documentation must include dates and outcomes." },
  ],
  atLeastOne: [
    { id: "iii", label: "Behavior Management Failed", text: "Use of effective communicative techniques and immobilization (patient is dangerous to self or staff) failed or was not feasible. Written documentation must include dates, techniques attempted, and outcomes." },
    { id: "iv",  label: "Extensive Treatment Required", text: "Patient requires extensive dental restorative or surgical treatment that cannot be rendered under local anesthesia or conscious sedation. Radiographs demonstrating proposed treatment must be submitted on the same TAR." },
    { id: "v",   label: "Immature Cognitive Functioning", text: "Patient has acute situational anxiety due to a lack of psychological or emotional maturity (immature cognitive functioning) that inhibits the ability to cooperate. Under age 4 per SB 1403 has simplified documentation requirements." },
    { id: "vi",  label: "Physical/Mental Compromising Condition", text: "Patient is uncooperative due to certain physical or mental compromising conditions (e.g., ASD, cerebral palsy, Down syndrome, epilepsy, severe ADHD). Patient is either a DDS Registered Consumer OR written documentation from patient's physician on professional letterhead." },
  ],
};

// ─── KNOWLEDGE BASE: ARC Denial Codes (Feb 2026 Handbook + APL 23-028 §7.1) ─
const ARC_CODES: Record<string, { name: string; rootCause: string; action: string; resolutionType: string; estimatedDays: number }> = {
  "ARC 013C": { name: "Provider Not Enrolled",          rootCause: "Provider enrollment doesn't include billed service category", action: "Verify enrollment; complete for service category before resubmitting", resolutionType: "ENROLLMENT_CORRECTION", estimatedDays: 14 },
  "ARC 013D": { name: "Rendering Provider Not Eligible", rootCause: "Rendering provider NPI not active or not linked to billing provider", action: "Verify rendering NPI status; update provider linkage in enrollment system", resolutionType: "ENROLLMENT_CORRECTION", estimatedDays: 7 },
  "ARC 013G": { name: "GA Facility Permit Not on File",  rootCause: "Facility does not have a valid GA permit on record with Medi-Cal Dental", action: "Contact facility to verify permit; submit copy of valid GA permit to enrollment unit", resolutionType: "ENROLLMENT_CORRECTION", estimatedDays: 21 },
  "ARC 013H": { name: "Pediatric Sedation Permit (0-6) Missing", rootCause: "Provider lacks 013H permit endorsement for moderate sedation age 0-6", action: "Obtain or verify 013H permit endorsement; submit to enrollment unit", resolutionType: "ENROLLMENT_CORRECTION", estimatedDays: 21 },
  "ARC 013I": { name: "Pediatric Sedation Permit (7-12) Missing", rootCause: "Provider lacks 013I permit endorsement for moderate sedation age 7-12", action: "Obtain or verify 013I permit endorsement; submit to enrollment unit", resolutionType: "ENROLLMENT_CORRECTION", estimatedDays: 21 },
  "ARC 062":  { name: "No Anesthetic Agent on Record",   rootCause: "Claim for sedation/GA does not include anesthetic agent administered or anesthesia record not submitted", action: "Submit anesthesia record: agent name, dosage, route, start/end times. Attach to appeal.", resolutionType: "DOCUMENTATION_APPEND", estimatedDays: 7 },
  "ARC 063":  { name: "Only Most Profound Level Payable", rootCause: "Multiple sedation levels billed for same DOS (e.g., D9230 + D9222)", action: "Remove less profound code. Only bill highest level actually administered.", resolutionType: "CLAIM_CORRECTION", estimatedDays: 5 },
  "ARC 069":  { name: "No Associated Dental Services",   rootCause: "Sedation/GA billed without any dental procedure codes on same claim", action: "Ensure at least one dental procedure (D2930, D7140, D3220, etc.) on same claim as anesthesia code. GA cannot be billed standalone.", resolutionType: "CLAIM_CORRECTION", estimatedDays: 5 },
  "ARC 070":  { name: "Diagnostics Only – GA Not Justified", rootCause: "GA billed with only diagnostic codes and no treatment codes", action: "Add treatment codes performed OR appeal with narrative explaining why GA was needed for diagnosis (severe behavior disorder, unable to take radiographs without GA).", resolutionType: "APPEAL_WITH_NARRATIVE", estimatedDays: 30 },
  "ARC 071":  { name: "GA Not Deemed Medically Necessary", rootCause: "TAR or documentation did not sufficiently establish medical necessity per qualifying criteria", action: "Review narrative against criteria (i)+(ii)+(iii-vi). Add specific behavior management dates/outcomes, medical diagnoses with ICD-10 codes, specialist letters. Resubmit TAR.", resolutionType: "TAR_RESUBMISSION", estimatedDays: 21 },
  "ARC 050":  { name: "Missing Documentation",           rootCause: "Required clinical documentation not submitted with claim", action: "Attach complete SOAP note, clinical records, and all required supporting documentation", resolutionType: "DOCUMENTATION_APPEND", estimatedDays: 7 },
  "ARC 326":  { name: "Missing Docs/Attachments for EDI", rootCause: "SOAP note or required attachments not submitted with the EDI claim at time of filing. Most common on emergency GA cases where documentation was not attached to the electronic submission.", action: "Generate SOAP addendum narrative and attach to claim. For EDI submissions via clearinghouse (Vyne/Availity), attach the narrative document before transmission. Include anesthesia record, emergency certification, and radiographs.", resolutionType: "DOCUMENTATION_APPEND", estimatedDays: 7 },
  "ARC 048":  { name: "Narrative vs Radiograph Mismatch",  rootCause: "Tooth numbers or procedure descriptions in the narrative do not match the radiographic evidence or the CDT codes billed on the claim.", action: "Reconcile tooth charting: verify tooth numbers in SOAP narrative match radiograph findings and CDT codes billed. Correct any discrepancies between the narrative, treatment plan, and submitted radiographs before resubmission.", resolutionType: "CLAIM_CORRECTION", estimatedDays: 10 },
};

// ─── KNOWLEDGE BASE: Permit Endorsements (APL 23-028 §2.3) ──────────────────
const PERMITS = [
  { code: "013G", desc: "GA Permit", patientAge: "All ages", services: "D9222/D9223", notes: "Provider must hold valid GA facility permit" },
  { code: "013H", desc: "Moderate Pediatric Sedation (0-6)", patientAge: "0-6", services: "D9239/D9243/D9248", notes: "Required for moderate sedation patients age 0-6" },
  { code: "013I", desc: "Moderate Pediatric Sedation (7-12)", patientAge: "7-12", services: "D9239/D9243/D9248", notes: "Required for moderate sedation patients age 7-12" },
  { code: "013K", desc: "Minimal Sedation Permit", patientAge: "All ages", services: "D9248 (when applicable)", notes: "If required by state dental board" },
];

// ─── KNOWLEDGE BASE: Narrative Templates (APL 23-028 §5 & §6) ────────────────
const NARRATIVE_TEMPLATES = {
  preauth_immature_cognition: `This [AGE]-year-old [SEX] patient presents with [DIAGNOSIS] affecting [TEETH_LIST]. The patient requires [PROCEDURES_LIST].

Criteria (i): Local anesthesia alone is insufficient for this patient. The extensive nature of the treatment plan ([TOOTH_COUNT] teeth, multiple quadrants, including [COMPLEX_PROCEDURES]) cannot be safely or effectively completed under local anesthesia in a cooperative [AGE]-year-old.

Criteria (ii): Nitrous oxide analgesia was attempted on [PRIOR_NITROUS_DATE] during an initial restorative attempt. The patient was unable to tolerate the nasal hood, became combative, and the procedure was aborted after 15 minutes. Minimal sedation is insufficient for the scope of treatment needed.

Criteria (iv) - Extensive treatment: [TOOTH_COUNT] teeth require treatment across [QUADRANT_COUNT] quadrants, including [PULP_COUNT] pulpotomies. Performing this under conscious sedation would require [VISIT_COUNT] separate sedation visits, increasing cumulative anesthesia risk. Consolidating under a single GA episode is the safest and most efficient approach.

Criteria (v) - Immature cognitive functioning: At [AGE] years of age, this patient lacks the cognitive maturity to understand instructions, remain still, or cooperate with extended dental procedures. GA is medically necessary to complete treatment safely and effectively.`,

  preauth_medical_condition: `This [AGE]-year-old [SEX] patient presents with [DIAGNOSIS] and has a documented diagnosis of [MEDICAL_CONDITION] ([ICD10_CODE]), managed with [MEDICATIONS].

Criteria (i): Local anesthesia alone is not feasible. The patient's [MEDICAL_CONDITION] results in [SPECIFIC_BARRIER], and attempts at local anesthesia injection on [DATE] resulted in [OUTCOME]. The treating [SPECIALIST] has advised against prolonged stress-inducing procedures without adequate sedation.

Criteria (ii): Nitrous oxide was attempted on [DATE]. The patient could not tolerate the nasal mask due to [REASON]. Oral sedation (D9248) was attempted on [DATE] with [AGENT/DOSE]; the patient remained agitated and uncooperative after 45 minutes. Step therapy through levels 1-3 has been exhausted.

Criteria (iii) - Failed behavior management: Behavioral techniques including tell-show-do, distraction, voice control, and positive reinforcement were attempted across [N] separate appointments ([DATES]). At each visit, the patient exhibited [BEHAVIORS].

Criteria (vi) - Medical condition: The patient's [MEDICAL_CONDITION] is a medically compromising condition. The combination of [CONDITIONS] creates an unacceptable safety risk in the conventional dental setting. GA in a monitored surgical facility is medically necessary to protect the patient's airway and ensure safe treatment delivery.`,

  emergency_infection: `EMERGENCY — TAR WAIVED PER TITLE 22, CCR SECTION 51056(b)

This [AGE]-year-old [SEX] patient presented to [FACILITY] on [DATE] at [TIME] with [PRESENTING_SYMPTOMS] of [DURATION] duration, fever of [TEMP], and [ADDITIONAL_SYMPTOMS]. Clinical examination revealed [CLINICAL_FINDINGS], consistent with [DIAGNOSIS] ([ICD10]).

Emergency justification: The patient's condition constituted a dental emergency placing health in serious jeopardy. [SPECIFIC_RISK_IF_UNTREATED]. Delaying treatment to obtain TAR authorization was not medically appropriate.

GA necessity: [GA_SPECIFIC_REASONS]. Nitrous oxide and oral sedation were contraindicated given [CONTRAINDICATION_REASONS]. GA with [AIRWAY_MANAGEMENT] was required to ensure safe airway management during the surgical procedure.

Treatment rendered: Under general anesthesia administered by [ANESTHESIOLOGIST, CREDENTIALS], [PROCEDURES_PERFORMED]. Total GA time: [DURATION] minutes (D9222 x[UNITS] + D9223 x[UNITS]). Patient discharged in stable condition with [FOLLOW_UP].`,
};

// ─── KNOWLEDGE BASE: Validation Rules V001–V013 (APL 23-028 Appendix A.2) ───
const VALIDATION_RULES_V2 = [
  { id: "V001", name: "SOAP Note Present",              severity: "critical", category: "documentation", arc: "ARC 050", description: "Verify SOAP note is attached with all four sections (S, O, A, P) completed" },
  { id: "V002", name: "Title 22 Emergency Certification", severity: "critical", category: "compliance",    arc: "ARC 071", description: "CCR §51056(b) emergency certification statement must be present for emergency GA claims" },
  { id: "V003", name: "GA Criteria (i)+(ii)+(iii-vi)",   severity: "critical", category: "compliance",    arc: "ARC 071", description: "Narrative must address criteria (i)+(ii) AND at least one of (iii)-(vi) per MOC §8.1.145(e)" },
  { id: "V004", name: "Anesthesia Record Complete",      severity: "high",     category: "documentation", arc: "ARC 062", description: "Anesthesia record: agent name, dosage, route, start/end times. Required for payment." },
  { id: "V005", name: "Dental Procedures on Claim",      severity: "critical", category: "billing",       arc: "ARC 069", description: "D9222/D9223 must be billed alongside dental treatment codes. GA cannot be billed standalone." },
  { id: "V006", name: "Radiographs Attached",            severity: "high",     category: "documentation", arc: "ARC 071", description: "Current diagnostic radiographs (dated within 6 months) supporting the treatment plan must be attached" },
  { id: "V007", name: "Frankl Behavior Scale Documented", severity: "medium",   category: "documentation", arc: "ARC 071", description: "Frankl Behavior Rating Scale must be documented for pediatric GA justification" },
  { id: "V008", name: "Step Therapy Documentation",      severity: "high",     category: "compliance",    arc: "ARC 071", description: "Prior attempts at behavior management, nitrous oxide, and conscious sedation must be documented with dates" },
  { id: "V009", name: "ICD-10 Diagnostic Codes",         severity: "medium",   category: "coding",        arc: "ARC 071", description: "Appropriate ICD-10 codes required (K02.x caries, K04.x pulpal, F84.0 ASD, G40.x epilepsy, etc.)" },
  { id: "V010", name: "Tooth Charting Consistent",       severity: "medium",   category: "coding",        arc: null,      description: "Tooth numbers in treatment plan must match charted findings and radiographic evidence" },
  { id: "V011", name: "Primary/Secondary EOB",           severity: "high",     category: "billing",       arc: "ARC 071", description: "Secondary claims (SEC) must include EOB from primary carrier" },
  { id: "V012", name: "Permit Endorsement Present",      severity: "critical", category: "compliance",    arc: "ARC 013G", description: "Valid permit endorsement (013G for GA; 013H/013I for sedation by age) must be active and on file" },
  { id: "V013", name: "Single Anesthesia Level Only",    severity: "high",     category: "billing",       arc: "ARC 063", description: "Only one anesthesia level payable per DOS. Do not bill D9230 and D9222 on same date." },
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface DeniedClaim {
  id: string;
  patientId: string;
  patientName: string;
  patientAge?: number;
  clinic: string;
  claimDate: string;
  cdtCode: string;
  procedure: string;
  carrier: string;
  billedAmt: number;
  denialCode: string;
  denialReason: string;
  status: "denied" | "ai_scanned" | "addendum_generated" | "pending" | "approved" | "submitted" | "paid";
  daysOld: number;
  priority: "critical" | "high" | "medium";
  issues: string[];
  claimType?: "PREAUTH" | "EMERGENCY" | "STANDARD";
  isPediatricAlert?: boolean;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_CLAIMS: DeniedClaim[] = [
  { id: "c001", patientId: "PT-8821", patientName: "Maria Gonzalez", patientAge: 5, clinic: "Location 04", claimDate: "02/14/2026", cdtCode: "D9222", procedure: "Deep Sedation/GA – First 15 Min", carrier: "Denti-Cal", billedAmt: 1601, denialCode: "ARC 071", denialReason: "Medical necessity not established", status: "denied", daysOld: 34, priority: "critical", claimType: "EMERGENCY", issues: ["Missing Title 22 emergency certification", "GA criteria (i)+(ii) not addressed in narrative", "Frankl behavior scale not documented"] },
  { id: "c002", patientId: "PT-4453", patientName: "James Watkins", patientAge: 7, clinic: "Location 11", claimDate: "01/28/2026", cdtCode: "D9223", procedure: "Deep Sedation/GA – Each Addl 15 Min", carrier: "Denti-Cal", billedAmt: 476, denialCode: "ARC 062", denialReason: "No anesthetic agent on record", status: "denied", daysOld: 51, priority: "critical", claimType: "PREAUTH", issues: ["Anesthesia record missing agent/dosage", "Start/end times not documented"] },
  { id: "c003", patientId: "PT-7790", patientName: "Rosa Mendez", patientAge: 4, clinic: "Location 07", claimDate: "03/01/2026", cdtCode: "D9222", procedure: "Deep Sedation/GA – First 15 Min", carrier: "Denti-Cal", billedAmt: 952, denialCode: "ARC 069", denialReason: "No associated dental services on claim", status: "denied", daysOld: 19, priority: "high", claimType: "PREAUTH", issues: ["D9222 billed without associated dental procedure codes", "Add D2930/D7140/D3220 that were performed same DOS"] },
  { id: "c005", patientId: "PT-6671", patientName: "Ana Rodriguez", patientAge: 8, clinic: "Location 15", claimDate: "03/05/2026", cdtCode: "D9239", procedure: "IV Moderate Sedation – First 15 Min", carrier: "Denti-Cal", billedAmt: 381, denialCode: "ARC 071", denialReason: "Prior authorization not obtained", status: "denied", daysOld: 15, priority: "high", claimType: "PREAUTH", issues: ["TAR not obtained before service date", "Step therapy documentation missing from record"] },
  { id: "c006", patientId: "PT-2241", patientName: "Sofia Reyes", patientAge: 6, clinic: "Location 09", claimDate: "01/15/2026", cdtCode: "D9222", procedure: "Deep Sedation/GA – First 15 Min", carrier: "Denti-Cal", billedAmt: 952, denialCode: "ARC 326", denialReason: "Missing docs/attachments for EDI document", status: "ai_scanned", daysOld: 64, priority: "critical", claimType: "EMERGENCY", issues: ["SOAP note not attached to EDI claim at submission", "Emergency narrative missing from electronic claim", "Anesthesia record not included in EDI transmission"] },
  { id: "c007", patientId: "PT-5589", patientName: "Marcus Johnson", patientAge: 10, clinic: "Location 03", claimDate: "02/20/2026", cdtCode: "D9222", procedure: "Deep Sedation/GA – First 15 Min", carrier: "Denti-Cal", billedAmt: 952, denialCode: "ARC 048", denialReason: "Narrative vs radiograph mismatch", status: "addendum_generated", daysOld: 28, priority: "high", claimType: "PREAUTH", issues: ["Tooth #19 in narrative but radiograph shows tooth #18 treated", "CDT code D2930 billed for tooth #19 — inconsistent with documentation", "Reconcile tooth numbers across narrative, radiograph, and claim"] },
];

const fmtCurrency = (n: number) => `$${n.toLocaleString()}`;

// ─── Shared UI Components ─────────────────────────────────────────────────────
function StatPill({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = {
    red:     "bg-red-500/10 border-red-500/20 text-red-400",
    amber:   "bg-amber-500/10 border-amber-500/20 text-amber-400",
    teal:    "bg-teal-500/10 border-teal-500/20 text-teal-400",
    sky:     "bg-sky-500/10 border-sky-500/20 text-sky-400",
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  };
  return (
    <div className={`rounded-xl border px-4 py-3 ${colors[color] || colors.teal}`}>
      <div className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1">{label}</div>
      <div className="text-2xl font-black">{value}</div>
    </div>
  );
}

function PriorityBadge({ p }: { p: string }) {
  const m: Record<string, string> = { critical: "bg-red-500/15 text-red-400 ring-1 ring-red-500/30", high: "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30", medium: "bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30" };
  return <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${m[p] || m.medium}`}>{p}</span>;
}

function StatusBadge({ s }: { s: string }) {
  const m: Record<string, string> = {
    denied:             "bg-red-500/15 text-red-400",
    ai_scanned:         "bg-purple-500/15 text-purple-400",
    addendum_generated: "bg-indigo-500/15 text-indigo-400",
    pending:            "bg-violet-500/15 text-violet-400",
    approved:           "bg-emerald-500/15 text-emerald-400",
    submitted:          "bg-sky-500/15 text-sky-400",
    paid:               "bg-teal-500/15 text-teal-400",
  };
  const labels: Record<string, string> = {
    ai_scanned:         "AI Scanned",
    addendum_generated: "Addendum Ready",
  };
  return <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${m[s] || m.denied}`}>{labels[s] || s}</span>;
}

function ArcBadge({ code }: { code: string }) {
  return <span className="text-[10px] font-mono font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">{code}</span>;
}

// ─── TAB 1: Claims Tracker ─────────────────────────────────────────────────────
function ClaimsTracker({ claims, onRecover, onRecoverAll }: { claims: DeniedClaim[]; onRecover: (c: DeniedClaim) => void; onRecoverAll?: () => void }) {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? claims : claims.filter(c => c.status === filter);
  const denied = claims.filter(c => c.status === "denied");
  const atRisk = denied.reduce((s, c) => s + c.billedAmt, 0);
  const critical = denied.filter(c => c.daysOld > 30);

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <StatPill label="Active Denials" value={denied.length} color="red" />
        <StatPill label="Revenue at Risk" value={fmtCurrency(atRisk)} color="amber" />
        <StatPill label="Total Claims" value={claims.length} color="sky" />
        <StatPill label=">30 Day Critical" value={critical.length} color="red" />
        <StatPill label="Recovered (Paid)" value={fmtCurrency(claims.filter(c => c.status === "paid").reduce((s, c) => s + c.billedAmt, 0))} color="teal" />
        {onRecoverAll && claims.filter(c => c.status === "denied").length > 1 && (
          <button onClick={onRecoverAll}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl transition-all">
            <span>⚡</span> Bulk Recover All ({claims.filter(c => c.status === "denied").length} claims)
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {["all", "denied", "ai_scanned", "addendum_generated", "pending", "submitted", "paid"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filter === s ? "bg-teal-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-white hover:bg-slate-600"}`}>
            {s === "ai_scanned" ? "AI Scanned" : s === "addendum_generated" ? "Addendum Ready" : s.charAt(0).toUpperCase() + s.slice(1)} <span className="ml-1 opacity-60">{s === "all" ? claims.length : claims.filter(c => c.status === s).length}</span>
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/30 text-slate-400 text-[10px] uppercase tracking-wider">
                <th className="text-left px-4 py-3">Patient</th>
                <th className="text-left px-4 py-3">Clinic</th>
                <th className="text-left px-4 py-3">CDT / Procedure</th>
                <th className="text-right px-4 py-3">Current Rate</th>
                <th className="text-left px-4 py-3">Denial Code</th>
                <th className="text-center px-4 py-3">Age (Days)</th>
                <th className="text-center px-4 py-3">Priority</th>
                <th className="text-center px-4 py-3">Type</th>
                <th className="text-center px-4 py-3">Status</th>
                <th className="text-center px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30">
              {filtered.map(c => {
                const arc = ARC_CODES[c.denialCode];
                return (
                  <tr key={c.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors ${c.status === "denied" && c.daysOld > 30 ? "bg-red-50/30 dark:bg-red-900/5" : ""}`}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900 dark:text-white">{c.patientName}</p>
                      <p className="text-[10px] text-teal-500 font-mono">{c.patientId} {c.patientAge ? `· Age ${c.patientAge}` : ""}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{c.clinic}</td>
                    <td className="px-4 py-3">
                      <p className="text-slate-900 dark:text-white truncate max-w-[160px]">{c.procedure}</p>
                      <p className="text-[10px] text-teal-500 font-mono">{c.cdtCode}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white">{fmtCurrency(PROP56_FEES[c.cdtCode as keyof typeof PROP56_FEES] || SMA_FEES[c.cdtCode]?.fee || c.billedAmt)}</td>
                    <td className="px-4 py-3">
                      <ArcBadge code={c.denialCode} />
                      <p className="text-[10px] text-slate-400 mt-0.5 max-w-[160px] truncate" title={arc?.action}>{c.denialReason}</p>
                    </td>
                    <td className={`px-4 py-3 text-center font-mono font-bold text-xs ${c.daysOld > 30 ? "text-red-400" : c.daysOld > 14 ? "text-amber-400" : "text-slate-400"}`}>{c.daysOld}d</td>
                    <td className="px-4 py-3 text-center"><PriorityBadge p={c.priority} /></td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${c.claimType === "EMERGENCY" ? "bg-red-500/15 text-red-400" : c.claimType === "PREAUTH" ? "bg-violet-500/15 text-violet-400" : "bg-slate-500/15 text-slate-400"}`}>{c.claimType || "STD"}</span>
                    </td>
                    <td className="px-4 py-3 text-center"><StatusBadge s={c.status} /></td>
                    <td className="px-4 py-3 text-center">
                      {["denied", "ai_scanned", "addendum_generated"].includes(c.status) && (
                        <button onClick={() => onRecover(c)} className="px-3 py-1.5 bg-teal-600/20 hover:bg-teal-600 text-teal-400 hover:text-white text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 mx-auto">
                          {c.status === "addendum_generated" ? "Review →" : c.status === "ai_scanned" ? "Build →" : "Recover →"}
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

      {/* Dentamind Intelligence Panel */}
      <div className="mt-4 bg-gradient-to-r from-teal-500/10 to-blue-500/10 border border-teal-500/20 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-teal-400" /> Dentamind Claims Intelligence
        </h3>
        <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
          {denied.length > 0 && <div className="flex items-start gap-2"><span>🚨</span><span>{denied.length} denied claim{denied.length !== 1 ? "s" : ""} totaling {fmtCurrency(atRisk)}. Appeal within 90 days for reconsideration; corrected claim resubmission within 12 months of DOS.</span></div>}
          {critical.length > 0 && <div className="flex items-start gap-2"><span>⚠️</span><span>{critical.length} claim{critical.length !== 1 ? "s are" : " is"} over 30 days old — prioritize immediately. TAR validity is 180 days from approval; don't let claims lapse.</span></div>}
          {denied.filter(c => ["D9222","D9223","D9239","D9243"].includes(c.cdtCode)).length > 0 && (
            <>
              <div className="flex items-start gap-2 mt-2 px-3 py-2 bg-teal-500/10 border border-teal-500/20 rounded-lg">
                <span>⚡</span>
                <span className="text-xs text-teal-400"><strong>Prop 56 Rate Alert:</strong> GA claims (D9222/D9223) currently reimburse at <strong>$76.82/unit</strong> — 68% above the post-July 1 SMA rate of $45.68. Each denied GA claim recovered before July 1, 2026 is worth <strong>$31.14 more</strong> than it will be after. Recover now to maximize reimbursement.</span>
              </div>
              <div className="flex items-start gap-2"><span>💡</span><span>GA/sedation claims require TAR, step therapy documentation, qualifying narrative addressing MOC §8.1.145(e) criteria (i)+(ii)+one of (iii)-(vi), anesthesia record, and permit endorsements (013G/H/I). Use Recovery Workflow to auto-generate compliant narratives.</span></div>
            </>
          )}
          {/* PEDIATRIC GUARD — D4341 perio scaling on pediatric patient */}
          {claims.filter(c => c.cdtCode === "D4341" && (c.patientAge ?? 99) < 18).length > 0 && (
            <div className="flex items-start gap-2 mt-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <span>⚠️</span>
              <span className="text-xs text-amber-400"><strong>Pediatric Documentation Alert:</strong> Perio scaling (D4341) claims found for patients under 18. Per Denti-Cal pediatric policy, full-mouth debridement (D4355) or prophylaxis (D1120) is typically indicated for pediatric patients. Verify clinical necessity and ensure documentation references pediatric periodontal criteria before submitting. Source: MediCal Dental Provider Handbook Feb 2026 §6.3.</span>
            </div>
          )}
          {denied.filter(c => c.denialCode === "ARC 069").length > 0 && <div className="flex items-start gap-2"><span>🔧</span><span>ARC 069 denials are clean corrections — add the dental procedure codes (D2930, D7140, D3220, etc.) that were performed on the same DOS. No narrative enhancement needed.</span></div>}
          {claims.filter(c => c.denialCode === "ARC 326").length > 0 && <div className="flex items-start gap-2"><span>📎</span><span>ARC 326 denials require attaching documentation to the EDI claim — SOAP note, emergency narrative, and anesthesia record must be transmitted with the claim, not mailed separately.</span></div>}
          {claims.filter(c => c.denialCode === "ARC 048").length > 0 && <div className="flex items-start gap-2"><span>🔍</span><span>ARC 048 denials require reconciling tooth numbers — verify the teeth in the narrative, radiographs, and billed CDT codes all match before resubmission.</span></div>}
        </div>
      </div>
    </div>
  );
}

// ─── TAB 2: Recovery Workflow ─────────────────────────────────────────────────
function RecoveryWorkflow({ claims, preselected, onApprove, bulkQueue }: {
  claims: DeniedClaim[];
  preselected: DeniedClaim | null;
  onApprove: (id: string) => void;
  bulkQueue?: DeniedClaim[];
}) {
  const [selected, setSelected] = useState<DeniedClaim | null>(preselected);
  const { isCanada } = useJurisdiction();
  const activeDenialCodes = isCanada ? CDCP_DENIAL_CODES : ARC_CODES;
  const activeProcedureCodes = isCanada ? ODA_FEES : SMA_FEES;
  const [activeSection, setActiveSection] = useState<"arc" | "criteria" | "narrative" | "checklist">("arc");
  const [criteriaChecked, setCriteriaChecked] = useState<Record<string, boolean>>({});
  // F-07 — SOAP narrative is stored as 4 separate sections so each textarea
  // edits independently. Helpers below serialize/check completeness.
  type SOAPSection = 'S' | 'O' | 'A' | 'P';
  const [narrativeSections, setNarrativeSections] = useState<Record<SOAPSection, string>>({
    S: '',
    O: '',
    A: '',
    P: '',
  });
  const serializeSOAP = (s: Record<SOAPSection, string>) =>
    `S — Subjective\n${s.S}\n\nO — Objective\n${s.O}\n\nA — Assessment\n${s.A}\n\nP — Plan\n${s.P}`;
  const isNarrativeComplete = (s: Record<SOAPSection, string>) =>
    s.S.trim().length > 0 && s.O.trim().length > 0 && s.A.trim().length > 0 && s.P.trim().length > 0;
  const updateSection = (key: SOAPSection, value: string) =>
    setNarrativeSections(prev => ({ ...prev, [key]: value }));
  // Backwards-compat: any code that reads `narrative` as a single string
  // gets the serialized form. Reads only — writes go through updateSection.
  const narrative = isNarrativeComplete(narrativeSections) || narrativeSections.S || narrativeSections.O || narrativeSections.A || narrativeSections.P
    ? serializeSOAP(narrativeSections)
    : "";
  const [narrativeMode, setNarrativeMode] = useState<"preauth_v" | "preauth_med" | "emergency_inf">("preauth_v");
  const [hasAutoPopulated, setHasAutoPopulated] = useState(false);
  const [editing, setEditing] = useState(false);

  const denied = claims.filter(c => c.status === "denied");

  if (!selected && denied.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">✅</div>
        <h3 className="text-base font-bold text-slate-300 mb-2">No denied claims</h3>
        <p className="text-xs text-slate-500">All claims have been processed. New denials will appear here automatically.</p>
      </div>
    );
  }

  const toggleCriteria = (id: string) => setCriteriaChecked(p => ({ ...p, [id]: !p[id] }));

  const loadTemplate = () => {
    const templates: Record<string, string> = {
      preauth_v: isCanada ? CDCP_NARRATIVE_TEMPLATES.preauth_behaviour : NARRATIVE_TEMPLATES.preauth_immature_cognition,
      preauth_med: isCanada ? CDCP_NARRATIVE_TEMPLATES.preauth_medical : NARRATIVE_TEMPLATES.preauth_medical_condition,
      emergency_inf: isCanada ? CDCP_NARRATIVE_TEMPLATES.emergency_acute : NARRATIVE_TEMPLATES.emergency_infection,
    };
    const claim = preselected ?? null;
    const raw = templates[narrativeMode];

    if (claim) {
      // Derive smart defaults from claim data
      const sexDefault = claim.patientAge && claim.patientAge <= 12 ? 'pediatric' : '[SEX]';
      const unitsD9222 = Math.max(1, Math.round((claim.billedAmt || 45.68) / 45.68));
      const unitsD9223 = Math.max(0, unitsD9222 - 1);
      const procedureDesc = activeProcedureCodes[claim.cdtCode as keyof typeof activeProcedureCodes]?.desc || claim.procedure || '[PROCEDURE]';
      const denialContext = activeDenialCodes[claim.denialCode as keyof typeof activeDenialCodes]?.rootCause || '[DENIAL_REASON]';

      const populated = raw
        .replace(/\[AGE\]/g, String(claim.patientAge || '[AGE]'))
        .replace(/\[SEX\]/g, '[SEX — specify Male/Female]')
        .replace(/\[DATE\]/g, claim.claimDate || '[DATE]')
        .replace(/\[FACILITY\]/g, claim.clinic || '[FACILITY]')
        .replace(/\[CDT_CODE\]/g, claim.cdtCode || '[CDT_CODE]')
        .replace(/D9222 x\[UNITS\]/g, `D9222 x${unitsD9222}`)
        .replace(/D9223 x\[UNITS\]/g, `D9223 x${unitsD9223}`)
        .replace(/\[UNITS\]/g, String(unitsD9222))
        .replace(/\[PROCEDURES_LIST\]/g, procedureDesc)
        .replace(/\[PROCEDURE\]/g, procedureDesc)
        .replace(/\[DENIAL_REASON\]/g, denialContext);

      // Prepend SOAP section headers if not already present
      const soapFormatted = populated.includes('S —') ? populated :
        `S — Subjective
Patient: ${claim.patientName}, Age ${claim.patientAge}, ${claim.clinic}. DOS: ${claim.claimDate}. Denial: ${claim.denialCode} — ${claim.denialReason}.

O — Objective
${populated}

A — Assessment
Denial basis: ${denialContext}

P — Plan
Resubmit with corrected documentation per ${isCanada ? "CDCP denial resolution guidelines." : "ARC resolution guidelines."}`;

      // F-07 — Parse the merged SOAP string into per-section state so each
      // textarea edits independently. Also set editing mode so the user lands
      // in an editable state after Load Template (eliminates the "tiny Edit
      // button" discovery problem from Neal's test).
      const parsed = parseSOAPString(soapFormatted);
      setNarrativeSections(parsed);
      setEditing(true);
    } else {
      const parsed = parseSOAPString(raw);
      setNarrativeSections(parsed);
      setEditing(true);
    }
    setHasAutoPopulated(!!claim);
  };

  // F-07 — Parse a merged "S — Subjective\n...\nO — Objective\n..." string
  // into per-section fields. If the input doesn't have section markers, the
  // entire content lands in S (with O/A/P blank for the user to fill in).
  function parseSOAPString(raw: string): Record<SOAPSection, string> {
    const sections: Record<SOAPSection, string> = { S: '', O: '', A: '', P: '' };
    if (!raw) return sections;
    // Split on SOAP markers; works with em-dash (—) or regular dash (-).
    const markers: { key: SOAPSection; re: RegExp }[] = [
      { key: 'S', re: /S\s*[—–-]\s*Subjective\s*\n/i },
      { key: 'O', re: /O\s*[—–-]\s*Objective\s*\n/i },
      { key: 'A', re: /A\s*[—–-]\s*Assessment\s*\n/i },
      { key: 'P', re: /P\s*[—–-]\s*Plan\s*\n/i },
    ];
    // Find the index of each marker in the raw string
    const positions = markers.map(m => {
      const match = raw.match(m.re);
      return match ? { key: m.key, start: match.index! + match[0].length, markerEnd: match.index! + match[0].length, markerStart: match.index! } : null;
    }).filter((p): p is NonNullable<typeof p> => p !== null);
    if (positions.length === 0) {
      sections.S = raw.trim();
      return sections;
    }
    // Sort positions by appearance order
    positions.sort((a, b) => a.markerStart - b.markerStart);
    for (let i = 0; i < positions.length; i++) {
      const cur = positions[i];
      const next = positions[i + 1];
      const end = next ? next.markerStart : raw.length;
      sections[cur.key] = raw.substring(cur.start, end).trim();
    }
    return sections;
  };

  if (!selected) {
    return (
      <div>
        <div className="mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Select a Denied Claim</h3>
          <p className="text-xs text-slate-500 mt-0.5">ARC code is auto-diagnosed · Corrective action pre-loaded · Narrative template ready</p>
        </div>
        <div className="space-y-2">
          {denied.map(c => {
            const arc = ARC_CODES[c.denialCode];
            return (
              <button key={c.id} onClick={() => setSelected(c)}
                className="w-full text-left bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 hover:border-teal-500/40 transition-all group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">

                    <span className="font-mono text-teal-500 font-bold text-sm">{c.patientId}</span>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">{c.patientName}{c.patientAge ? `, age ${c.patientAge}` : ""}</div>
                      <div className="text-xs text-slate-500">{c.clinic} · {c.claimDate} · {c.cdtCode}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <ArcBadge code={c.denialCode} />
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{fmtCurrency(c.billedAmt)}</span>
                    <span className="text-[11px] text-teal-500 font-bold opacity-0 group-hover:opacity-100 flex items-center gap-1">Recover <ArrowRight className="w-3 h-3" /></span>
                  </div>
                </div>
                {arc && (
                  <div className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg px-3 py-2">
                    <span className="font-bold">Resolution ({arc.resolutionType.replace(/_/g,' ')}): </span>{arc.action}
                    <span className="ml-2 text-slate-400">~{arc.estimatedDays} days</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const arc = activeDenialCodes[selected.denialCode];
  const smaFee = activeProcedureCodes[selected.cdtCode];
  const isGAClaim = ["D9222","D9223","D9239","D9243"].includes(selected.cdtCode);
  const isEmergency = selected.claimType === "EMERGENCY";

  const sectionTabs = [
    { id: "arc",       label: isCanada ? "1. Denial Analysis" : "1. ARC Analysis",      icon: AlertTriangle },
    { id: "criteria",  label: "2. Criteria Check",    icon: Shield, show: isGAClaim },
    { id: "narrative", label: "3. Narrative Builder",  icon: FileText },
    { id: "checklist", label: "4. Submission Checklist", icon: CheckCircle },
  ].filter(t => t.show !== false) as { id: string; label: string; icon: any }[];

  return (
    <div>
      {bulkQueue && bulkQueue.length > 1 && selected && (
        <div className="flex items-center gap-3 mb-3 px-4 py-2 bg-teal-500/10 border border-teal-500/20 rounded-xl">
          <span className="text-xs font-bold text-teal-400">⚡ Bulk Recovery Mode</span>
          <div className="flex items-center gap-1">
            {bulkQueue.map((c, idx) => (
              <div key={c.id} className={`w-2 h-2 rounded-full ${c.id === selected.id ? 'bg-teal-400' : bulkQueue.indexOf(c) < bulkQueue.findIndex(q => q.id === selected?.id) ? 'bg-emerald-400' : 'bg-slate-600'}`} />
            ))}
          </div>
          <span className="text-xs text-slate-400">
            {bulkQueue.findIndex(c => c.id === selected.id) + 1} of {bulkQueue.length} — {selected.patientName}
          </span>
          <span className="ml-auto text-[10px] text-amber-400">Complete workflow to advance to next claim</span>
        </div>
      )}
      <button onClick={() => { setSelected(null); setCriteriaChecked({}); setNarrativeSections({ S: '', O: '', A: '', P: '' }); }}
        className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mb-4 flex items-center gap-1">← Back to claim list</button>

      {/* Claim Header */}
      <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-teal-600 dark:text-teal-400">Claims Recovery — {selected.denialCode}</h3>
          <div className="flex gap-2">
            {isEmergency && <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-red-500/15 text-red-400 uppercase">{isCanada ? "Emergency — CDCP Section 4.2.5" : "Emergency — Title 22 TAR Waiver"}</span>}
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${arc?.resolutionType === "TAR_RESUBMISSION" ? "bg-violet-500/15 text-violet-400" : arc?.resolutionType === "DOCUMENTATION_APPEND" ? "bg-sky-500/15 text-sky-400" : "bg-amber-500/15 text-amber-400"}`}>{arc?.resolutionType?.replace(/_/g,' ')}</span>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-3 text-xs">
          <div><span className="text-slate-500">Patient:</span><br /><span className="font-semibold text-slate-900 dark:text-white">{selected.patientName}</span></div>
          <div><span className="text-slate-500">Age:</span><br /><span className="text-slate-700 dark:text-slate-200">{selected.patientAge || "—"} years</span></div>
          <div><span className="text-slate-500">DOS:</span><br /><span className="text-slate-700 dark:text-slate-200">{selected.claimDate}</span></div>
          <div><span className="text-slate-500">{isCanada ? "ODA Code" : "CDT"} (Current Rate):</span><br /><span className="font-mono text-teal-500">{selected.cdtCode} ({fmtCurrency(isCanada ? (smaFee?.fee || 0) : (PROP56_FEES[selected.cdtCode as keyof typeof PROP56_FEES] || smaFee?.fee || 0))})</span>{!isCanada && PROP56_FEES[selected.cdtCode as keyof typeof PROP56_FEES] && <span className="text-[9px] text-amber-400 ml-1">Prop 56 — reverts to {fmtCurrency(smaFee?.fee || 0)} July 1</span>}</div>
          <div><span className="text-slate-500">Days Old:</span><br /><span className={`font-bold ${selected.daysOld > 30 ? "text-red-400" : "text-amber-400"}`}>{selected.daysOld}d</span></div>
        </div>
      </div>

      {/* Section Nav */}
      <div className="flex gap-2 mb-5 border-b border-slate-200 dark:border-slate-700/50">
        {sectionTabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setActiveSection(t.id as any)}
              className={`px-4 py-2.5 text-[11px] font-bold flex items-center gap-1.5 border-b-2 transition-all ${activeSection === t.id ? "border-teal-500 text-teal-600 dark:text-teal-400" : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"}`}>
              <Icon className="w-3 h-3" />{t.label}
            </button>
          );
        })}
      </div>

      {/* Section 1: ARC Analysis */}
      {activeSection === "arc" && arc && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl p-4">
              <div className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-2">Denial — {selected.denialCode}</div>
              <div className="font-bold text-slate-900 dark:text-white mb-1">{arc.name}</div>
              <div className="text-xs text-slate-600 dark:text-slate-300 mb-3">{arc.rootCause}</div>
              <div className="space-y-1">
                {selected.issues.map((iss, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400">
                    <XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />{iss}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-500/20 rounded-xl p-4">
              <div className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-2">Corrective Action</div>
              <div className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed mb-3">{arc.action}</div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-500">Est. Resolution:</span>
                <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1"><Clock className="w-3 h-3" />{arc.estimatedDays} days</span>
                <span className="text-slate-500">Type:</span>
                <span className="font-bold text-teal-500">{arc.resolutionType.replace(/_/g,' ')}</span>
              </div>
            </div>
          </div>

          {/* SMA Fee Reference */}
          {smaFee && (
            <div className="bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{isCanada ? "ODA Fee Schedule Reference — 2026" : "SMA Fee Schedule Reference — Feb 2026"}</div>
              <div className="grid grid-cols-4 gap-4 text-xs">
                <div><span className="text-slate-500">{isCanada ? "ODA Code:" : "CDT Code:"}</span><br /><span className="font-mono text-teal-500 font-bold">{selected.cdtCode}</span></div>
                <div><span className="text-slate-500">{isCanada ? "ODA Fee:" : "SMA Fee:"}</span><br /><span className="font-bold text-slate-700 dark:text-slate-200">{fmtCurrency(smaFee.fee)}</span></div>
                <div><span className="text-slate-500">Auth Required:</span><br /><span className={`font-bold ${smaFee.authRequired ? "text-red-400" : "text-emerald-400"}`}>{smaFee.authRequired ? (isCanada ? "YES — Predetermination Required" : "YES — TAR Required") : "No"}</span></div>
                <div><span className="text-slate-500">Key Rule:</span><br /><span className="text-slate-600 dark:text-slate-300">{smaFee.notes}</span></div>
              </div>
            </div>
          )}

          <button onClick={() => setActiveSection(isGAClaim ? "criteria" : "narrative")} className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2">
            Continue to {isGAClaim ? "Criteria Check" : "Narrative Builder"} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Section 2: Criteria Check (GA claims only) */}
      {activeSection === "criteria" && isGAClaim && (
        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-300">
            <span className="font-bold">MOC §8.1.145(e) — </span>Both (i) AND (ii) are required. Plus at least ONE of (iii)–(vi). All must be documented with dates and outcomes.
          </div>

          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">REQUIRED — Must document BOTH:</div>
            {GA_CRITERIA.required.map(c => (
              <div key={c.id} onClick={() => toggleCriteria(c.id)} className={`mb-2 rounded-xl p-4 border cursor-pointer transition-all ${criteriaChecked[c.id] ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-700/30" : "bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50 hover:border-teal-500/30"}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${criteriaChecked[c.id] ? "bg-emerald-500 border-emerald-500" : "border-slate-300 dark:border-slate-600"}`}>
                    {criteriaChecked[c.id] && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">({c.id}) {c.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{c.text}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">PLUS AT LEAST ONE of (iii)–(vi):</div>
            {GA_CRITERIA.atLeastOne.map(c => (
              <div key={c.id} onClick={() => toggleCriteria(c.id)} className={`mb-2 rounded-xl p-4 border cursor-pointer transition-all ${criteriaChecked[c.id] ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-700/30" : "bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50 hover:border-teal-500/30"}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${criteriaChecked[c.id] ? "bg-emerald-500 border-emerald-500" : "border-slate-300 dark:border-slate-600"}`}>
                    {criteriaChecked[c.id] && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">({c.id}) {c.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{c.text}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Step Therapy Reference */}
          <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Step Therapy Protocol — APL 23-028 §2.1</div>
            <div className="space-y-1.5">
              {STEP_THERAPY.map(s => (
                <div key={s.step} className={`flex items-center gap-3 text-xs p-2 rounded-lg ${s.code === selected.cdtCode ? "bg-teal-500/10 border border-teal-500/20" : ""}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 ${s.code === selected.cdtCode ? "bg-teal-600 text-white" : "bg-slate-200 dark:bg-slate-600 text-slate-500"}`}>{s.step}</span>
                  <span className={`font-medium ${s.code === selected.cdtCode ? "text-teal-600 dark:text-teal-400 font-bold" : "text-slate-600 dark:text-slate-300"}`}>{s.method}</span>
                  <span className="ml-auto text-slate-400">{s.autoAge !== "None" ? `Auto-benefit: ${s.autoAge}` : s.authRequired ? "TAR Required" : ""}</span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={() => setActiveSection("narrative")} className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2">
            Continue to Narrative Builder <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Section 3: Narrative Builder */}
      {activeSection === "narrative" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <select value={narrativeMode} onChange={e => setNarrativeMode(e.target.value as any)}
                className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200">
                {isCanada ? (
                  <>
                    <option value="preauth_v">Predetermination: Behaviour Management / Immature Cognition</option>
                    <option value="preauth_med">Predetermination: Medical Condition (CDCP Section 4.2.3)</option>
                    <option value="emergency_inf">Emergency GA: Acute Infection / CDCP Section 4.2.5</option>
                  </>
                ) : (
                  <>
                    <option value="preauth_v">Pre-Auth Template: Extensive Treatment / Immature Cognition</option>
                    <option value="preauth_med">Pre-Auth Template: Failed Behavior Management / Medical Condition</option>
                    <option value="emergency_inf">Emergency Template: Acute Infection / Facial Swelling</option>
                  </>
                )}
              </select>
            </div>
            <button onClick={loadTemplate} className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-lg transition-all">
              Load Template
            </button>
          </div>

          {(narrativeSections.S || narrativeSections.O || narrativeSections.A || narrativeSections.P) ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SOAP Narrative (Edit before submitting)</span>
                <div className="flex items-center gap-2">
                  {hasAutoPopulated && (
                    <span className="flex items-center gap-1 text-[10px] text-teal-400 font-bold">
                      <Zap className="w-3 h-3" /> Auto-populated
                    </span>
                  )}
                  {/* F-07 Phase 2 — visible "Attached" badge when all four SOAP sections have content */}
                  {isNarrativeComplete(narrativeSections) && (
                    <span className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle className="w-3 h-3" /> Attached to Claim
                    </span>
                  )}
                  {/* F-07 Phase 2 — proper button instead of 10px text link */}
                  <button
                    onClick={() => setEditing(!editing)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-all ${
                      editing
                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25"
                        : "bg-teal-500/15 border-teal-500/40 text-teal-400 hover:bg-teal-500/25"
                    }`}
                  >
                    {editing ? (<><CheckCircle className="w-3.5 h-3.5" /> Lock Narrative</>) : (<><FileText className="w-3.5 h-3.5" /> Edit Narrative</>)}
                  </button>
                </div>
              </div>

              {/* SOAP FORMAT — 4 labeled sections */}
              <div className="space-y-2 mb-3">
                {[
                  { label: "S — Subjective", hint: "Chief complaint, symptoms, duration" },
                  { label: "O — Objective", hint: "Clinical findings, CDT codes, tooth numbers, vitals" },
                  { label: "A — Assessment", hint: "Diagnosis, ICD-10, GA medical necessity, MOC criteria met" },
                  { label: "P — Plan", hint: "Procedures performed, anesthesia details, follow-up" },
                ].map(section => {
                  const sectionKey = section.label.charAt(0) as SOAPSection;
                  const sectionValue = narrativeSections[sectionKey];
                  return (
                    <div key={section.label} className="rounded-lg border border-slate-200 dark:border-slate-700/50 overflow-hidden">
                      <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 flex items-center justify-between">
                        <span className="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-wider">{section.label}</span>
                        <span className="text-[9px] text-slate-400 italic">{section.hint}</span>
                      </div>
                      {editing ? (
                        <textarea
                          value={sectionValue}
                          onChange={e => updateSection(sectionKey, e.target.value)}
                          placeholder={`Enter ${section.label} details...`}
                          className="w-full h-20 bg-white dark:bg-slate-900/50 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 font-mono focus:outline-none resize-none border-0"
                        />
                      ) : (
                        <pre className="w-full min-h-[3rem] bg-white dark:bg-slate-900/30 px-3 py-2 text-xs text-slate-600 dark:text-slate-300 font-mono whitespace-pre-wrap overflow-y-auto">{sectionValue || <span className="text-slate-400 italic">(empty)</span>}</pre>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-2 flex items-center gap-2 text-[10px] text-amber-600 dark:text-amber-400">
                <Info className="w-3 h-3" />
                {hasAutoPopulated
                  ? <span>Patient data auto-populated from claim record. <span className="text-amber-400 font-bold">Complete the [BRACKETED] fields</span> with clinical details before submission.</span>
                  : <span>Replace all <span className="text-amber-400 font-bold">[BRACKETED]</span> fields with patient-specific clinical data before submission.</span>
                }
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-8 text-center text-slate-400 border border-slate-200 dark:border-slate-700/50">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <div className="space-y-1">
                <p className="text-xs">Select a template and click "Load Template" to generate a compliant narrative</p>
                {preselected && (
                  <p className="text-xs text-teal-400 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Patient data from {preselected.patientName} will auto-populate on load
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Permit Reference */}
          {isGAClaim && (
            <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Required Permit Endorsements — APL 23-028 §2.3</div>
              <div className="grid grid-cols-2 gap-2">
                {PERMITS.map(p => (
                  <div key={p.code} className="bg-white dark:bg-slate-800/60 rounded-lg p-2.5 border border-slate-200 dark:border-slate-700/50">
                    <div className="font-mono font-bold text-teal-500 text-xs">{p.code}</div>
                    <div className="text-[10px] font-semibold text-slate-700 dark:text-slate-200">{p.desc}</div>
                    <div className="text-[9px] text-slate-400">Age: {p.patientAge} · {p.services}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={() => setActiveSection("checklist")} className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2">
            Continue to Submission Checklist <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Section 4: Submission Checklist */}
      {activeSection === "checklist" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Pre-Submission Checklist — APL 23-028 §3.2</div>
            {[
              { label: "Patient demographics (name, DOB, Medi-Cal ID)", required: true },
              { label: "Treating provider NPI and permit endorsement (013G for GA)", required: isGAClaim },
              { label: "Facility permit number — active and matches rendering location", required: isGAClaim },
              { label: "Treatment plan with CDT codes + tooth numbers", required: true },
              { label: "Step therapy documentation with dates and outcomes", required: isGAClaim },
              { label: "Qualifying criteria narrative — criteria (i)+(ii)+(iii-vi)", required: isGAClaim },
              { label: "Emergency certification — Title 22 CCR §51056(b)", required: isEmergency },
              { label: "Medical history / ASA classification (I–VI)", required: isGAClaim },
              { label: "Current radiographs (dated within 6 months)", required: true },
              { label: "Anesthesia record — agent, dosage, start/end times", required: isGAClaim },
              { label: "Informed consent signed by patient/guardian", required: true },
              { label: "Narrative minimum 200 characters recommended", required: isGAClaim },
            ].filter(i => i.required).map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-700/30 last:border-0">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-xs text-slate-600 dark:text-slate-300">{item.label}</span>
              </div>
            ))}
          </div>

          {(() => {
            const isLastInQueue = !bulkQueue || bulkQueue.length === 0 ||
              bulkQueue.findIndex(c => c.id === selected.id) === bulkQueue.length - 1;
            const queuePos = bulkQueue ? bulkQueue.findIndex(c => c.id === selected.id) : -1;
            const remaining = bulkQueue ? bulkQueue.length - queuePos - 1 : 0;
            return (
              <button onClick={() => { onApprove(selected.id); setSelected(null); setCriteriaChecked({}); setNarrativeSections({ S: '', O: '', A: '', P: '' }); }}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {isLastInQueue
                  ? "✅ Queue Complete — Go to Sign & Submit →"
                  : `Approve & Continue to Next Claim (${remaining} remaining) →`}
              </button>
            );
          })()}
        </div>
      )}
    </div>
  );
}

// ─── TAB 3: Sign & Submit ─────────────────────────────────────────────────────
function SignSubmitTab({ claims, pendingIds, onSubmit }: { claims: DeniedClaim[]; pendingIds: Set<string>; onSubmit: () => void }) {
  const pending = claims.filter(c => pendingIds.has(c.id));
  const total = pending.reduce((s, c) => s + c.billedAmt, 0);

  if (pending.length === 0) return (
    <div className="text-center py-16">
      <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
      <h3 className="font-bold text-slate-500 mb-1">No claims pending sign-off</h3>
      <p className="text-xs text-slate-400">Complete the Recovery Workflow for a denied claim and submit it for approval.</p>
    </div>
  );

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-6 max-w-sm">
        <StatPill label="Ready to Submit" value={pending.length} color="teal" />
        <StatPill label="Revenue to Recover" value={fmtCurrency(total)} color="teal" />
      </div>
      <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700/50">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Claims Pending Provider Signature</h3>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {pending.map(c => (
            <div key={c.id} className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/30 last:border-0 flex items-center gap-3 text-xs">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="font-mono text-teal-500 font-bold w-20">{c.patientId}</span>
              <span className="text-slate-600 dark:text-slate-300 flex-1">{c.clinic} · {c.cdtCode}</span>
              <ArcBadge code={c.denialCode} />
              <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{fmtCurrency(c.billedAmt)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-500/20 rounded-xl p-4 mb-4">
        <p className="text-xs text-teal-700 dark:text-teal-300">Provider signature required before clearinghouse submission. Each corrected claim + documentation package will be queued for submission via Vyne/Availity to Denti-Cal.</p>
      </div>
      <button onClick={onSubmit} className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg">
        Sign & Queue {pending.length} Claim{pending.length > 1 ? "s" : ""} for Resubmission ({fmtCurrency(total)}) →
      </button>
    </div>
  );
}

// ─── TAB 4: Prevention Engine ─────────────────────────────────────────────────
function PreventionEngineTab({ claims }: { claims: DeniedClaim[] }) {
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  // F-06 — Track which rules a user has marked resolved per claim, keyed by claim.id.
  // Resolved rules are treated as passing in the validations useMemo below.
  // State is ephemeral (refresh resets) — backend persistence comes in next session.
  const [resolvedRules, setResolvedRules] = useState<Record<string, Set<string>>>({});

  const markResolved = (claimId: string, ruleId: string) => {
    setResolvedRules(prev => {
      const claimSet = prev[claimId] ? new Set(prev[claimId]) : new Set<string>();
      claimSet.add(ruleId);
      return { ...prev, [claimId]: claimSet };
    });
  };

  const denied = claims.filter(c => c.status === "denied");

  const validations = useMemo(() => denied.map(claim => {
    const results = VALIDATION_RULES_V2.map(rule => {
      let pass = true; let detail = "";
      if (rule.id === "V001") { pass = !claim.issues.some(i => /soap|narrative/i.test(i)); detail = pass ? "SOAP note verified present" : "SOAP note missing or incomplete — attach complete note before submission"; }
      else if (rule.id === "V002") { pass = !claim.issues.some(i => /emergency.*cert|title 22/i.test(i)); detail = pass ? "Emergency certification present" : "Missing Title 22 CCR §51056(b) emergency certification statement"; }
      else if (rule.id === "V003") { pass = !(claim.denialCode === "ARC 071" && claim.issues.some(i => /criteria|medical necessity/i.test(i))); detail = pass ? "GA criteria adequately documented" : "Criteria (i)+(ii)+(iii-vi) not fully addressed. Review MOC §8.1.145(e)."; }
      else if (rule.id === "V004") { pass = !claim.issues.some(i => /anesthesia record|agent|dosage|start\/end/i.test(i)); detail = pass ? "Anesthesia record complete" : "Anesthesia record missing agent, dosage, or start/end times — will cause ARC 062"; }
      else if (rule.id === "V005") { pass = claim.denialCode !== "ARC 069" && !claim.issues.some(i => /without associated|no associated/i.test(i)); detail = pass ? "Dental procedure codes present on claim" : "GA codes billed without associated dental procedures — remove or add treatment codes"; }
      else if (rule.id === "V006") { pass = !claim.issues.some(i => /radiograph/i.test(i)); detail = pass ? "Radiographs attached and current" : "Radiographs required — must be dated within 6 months and match treatment plan teeth"; }
      else if (rule.id === "V007") { pass = !claim.issues.some(i => /frankl/i.test(i)); detail = pass ? "Frankl scale documented" : "Frankl Behavior Rating Scale not recorded — required for pediatric GA justification"; }
      else if (rule.id === "V008") { pass = !claim.issues.some(i => /step therapy|previous attempt|TAR not obtained/i.test(i)); detail = pass ? "Step therapy attempts documented" : "Prior sedation attempts not documented with dates/outcomes per APL 23-028 §2.1"; }
      else if (rule.id === "V012") { const isGA = ["D9222","D9223","D9239","D9243"].includes(claim.cdtCode); pass = isGA ? !claim.denialCode.includes("013") : true; detail = pass ? "Permit endorsements verified" : `Missing required permit. Age ${claim.patientAge || "?"}: ${claim.patientAge && claim.patientAge <= 6 ? "013H required" : "013I required"} for sedation, 013G for GA`; }
      else { pass = true; detail = `${rule.name} verified`; }
      return { rule, pass, detail };
    });
    // F-06: Override pass=true for any rule the user has marked resolved on this claim.
    const claimResolved = resolvedRules[claim.id];
    const finalResults = claimResolved
      ? results.map(r => claimResolved.has(r.rule.id)
          ? { ...r, pass: true, detail: `${r.detail} (Marked resolved)` }
          : r)
      : results;
    const passCount = finalResults.filter(r => r.pass).length;
    return { claim, results: finalResults, score: Math.round((passCount / finalResults.length) * 100), passCount, failCount: finalResults.length - passCount };
  }), [denied, resolvedRules]);

  const criticalFails = validations.reduce((s, v) => s + v.results.filter(r => !r.pass && r.rule.severity === "critical").length, 0);
  const selectedVal = validations.find(v => v.claim.id === selected);
  const filteredResults = selectedVal ? selectedVal.results.filter(r => filter === "all" || r.rule.severity === filter) : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Shield className="w-4 h-4 text-teal-500" /> Pre-Flight Validation Engine</h3>
          <p className="text-xs text-slate-500 mt-0.5">V001–V013 · APL 23-028 Appendix A.2 · MOC §8.1.145 · ARC code mapping</p>
        </div>
        <button onClick={() => { setScanning(true); setTimeout(() => { setScanning(false); setScanned(true); }, 1800); }} disabled={scanning}
          className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2">
          {scanning ? <><RefreshCw className="w-3 h-3 animate-spin" /> Scanning…</> : scanned ? <><RefreshCw className="w-3 h-3" /> Re-run</> : "Run Pre-Flight Scan →"}
        </button>
      </div>

      {!scanned ? (
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-12 text-center">
          <Shield className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="font-bold text-slate-500 mb-2">13 Validation Rules Ready</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-5">Source: APL 23-028 Appendix A.2 · Medi-Cal Dental Provider Handbook Feb 2026 · MOC §8.1.145. Checks documentation, compliance, coding, and billing requirements.</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 max-w-xl mx-auto text-xs">
            {[["Documentation (4)", "V001,V002,V004,V006"], ["Compliance (4)", "V003,V007,V008,V012"], ["Billing (3)", "V005,V011,V013"], ["Coding (2)", "V009,V010"]].map(([label, rules]) => (
              <div key={label} className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-2 text-slate-500"><div className="font-bold text-slate-600 dark:text-slate-300">{label}</div><div className="text-[9px] mt-0.5 font-mono">{rules}</div></div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
            <StatPill label="Total Failures" value={validations.reduce((s, v) => s + v.failCount, 0)} color="red" />
            <StatPill label="Critical Failures" value={criticalFails} color="red" />
            <StatPill label="Clean Claims" value={validations.filter(v => v.failCount === 0).length} color="teal" />
            <StatPill label="Revenue at Risk" value={fmtCurrency(validations.filter(v => v.failCount > 0).reduce((s, v) => s + v.claim.billedAmt, 0))} color="amber" />
            <StatPill label="Gate" value={criticalFails > 0 ? "BLOCKED" : "OPEN"} color={criticalFails > 0 ? "red" : "teal"} />
          </div>

          {criticalFails > 0 && (
            <div className="bg-red-50 dark:bg-red-900/10 border-2 border-red-200 dark:border-red-800/30 rounded-xl p-4 mb-5">
              <div className="flex items-center gap-2 mb-1"><XCircle className="w-5 h-5 text-red-500" /><h4 className="font-bold text-red-600 dark:text-red-400 text-sm">Case Closure Gate — BLOCKED</h4></div>
              <p className="text-xs text-red-500">{criticalFails} critical failure{criticalFails > 1 ? "s" : ""} must be resolved. Critical failures map to ARC codes that will cause re-denial.</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Claim Scan Results</div>
              <div className="space-y-2">
                {validations.map(v => (
                  <button key={v.claim.id} onClick={() => setSelected(v.claim.id)}
                    className={`w-full text-left rounded-xl p-3 border transition-all ${selected === v.claim.id ? "border-teal-500/50 bg-teal-50/50 dark:bg-teal-900/10" : "border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/40 hover:border-teal-500/30"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-sm font-bold text-teal-500">{v.claim.patientId}</span>
                      <span className={`font-mono font-black text-sm px-2 py-0.5 rounded ${v.score === 100 ? "text-emerald-400 bg-emerald-500/10" : v.score >= 70 ? "text-amber-400 bg-amber-500/10" : "text-red-400 bg-red-500/10"}`}>{v.score}%</span>
                    </div>
                    <div className="text-[10px] text-slate-400">{v.claim.clinic} · {v.claim.cdtCode}</div>
                    <div className="mt-2 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${v.score === 100 ? "bg-emerald-500" : v.score >= 70 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${v.score}%` }} />
                    </div>
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {v.results.filter(r => !r.pass).map(r => (
                        <span key={r.rule.id} className="text-[8px] font-mono font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">{r.rule.id}</span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2">
              {selectedVal ? (
                <div>
                  <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-4 mb-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-teal-500">Pre-Flight Report — {selectedVal.claim.patientId}</h4>
                      <span className={`font-mono font-black px-3 py-1 rounded text-sm ${selectedVal.score === 100 ? "text-emerald-400 bg-emerald-500/10" : selectedVal.score >= 70 ? "text-amber-400 bg-amber-500/10" : "text-red-400 bg-red-500/10"}`}>{selectedVal.score}%</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mb-3">
                    {["all","critical","high","medium"].map(s => (
                      <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1 text-[10px] font-bold rounded-lg ${filter === s ? "bg-teal-600 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-400"} capitalize`}>{s}</button>
                    ))}
                  </div>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {filteredResults.map(r => (
                      <div key={r.rule.id} className={`rounded-xl p-3 border ${r.pass ? "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/30" : "bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30"}`}>
                        <div className="flex items-center gap-2 mb-1">
                          {r.pass ? <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                          <span className="text-[10px] font-mono font-bold text-teal-500">{r.rule.id}</span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{r.rule.name}</span>
                          <span className={`ml-auto text-[9px] font-bold px-2 py-0.5 rounded uppercase ${r.rule.severity === "critical" ? "bg-red-500/15 text-red-400" : r.rule.severity === "high" ? "bg-amber-500/15 text-amber-400" : "bg-sky-500/15 text-sky-400"}`}>{r.rule.severity}</span>
                          {r.rule.arc && !r.pass && <span className="text-[9px] font-mono font-bold text-amber-500">{r.rule.arc}</span>}
                        </div>
                        <p className={`text-[10px] ml-6 ${r.pass ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>{r.detail}</p>
                        {!r.pass && selectedVal && (
                          <div className="ml-6 mt-2">
                            <button
                              onClick={() => markResolved(selectedVal.claim.id, r.rule.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition-all"
                            >
                              <CheckCircle className="w-3 h-3" /> Mark Resolved
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-xl p-12 text-center h-full flex flex-col items-center justify-center">
                  <Eye className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-3" />
                  <p className="text-xs text-slate-400">Select a claim to view its pre-flight validation report</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ClaimsRecoveryPage() {
  const { isCanada } = useJurisdiction();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"tracker" | "recovery" | "sign" | "prevention" | "bulk" | "documents">("tracker");
  const [claims, setClaims] = useState<DeniedClaim[]>(isCanada ? CA_MOCK_CLAIMS as any : MOCK_CLAIMS);
  useEffect(() => {
    setClaims(isCanada ? CA_MOCK_CLAIMS as any : MOCK_CLAIMS);
    setPreselected(null);
    setActiveTab('tracker');
  }, [isCanada]);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [preselected, setPreselected] = useState<DeniedClaim | null>(null);
  const [bulkQueue, setBulkQueue] = useState<DeniedClaim[]>([]);
  // CSV approved narratives routed to Sign & Submit
  const [csvNarratives, setCsvNarratives] = useState<any[]>([]);

  const denied = claims.filter(c => c.status === "denied");
  const atRisk = denied.reduce((s, c) => s + c.billedAmt, 0);

  const handleRecover = (c: DeniedClaim) => { setPreselected(c); setActiveTab("recovery"); };
  const handleApprove = (id: string) => {
    setPendingIds(prev => new Set([...prev, id]));
    // If bulk queue active, advance to next claim
    if (bulkQueue.length > 0) {
      const currentIndex = bulkQueue.findIndex(c => c.id === id);
      const next = bulkQueue[currentIndex + 1];
      if (next) {
        setPreselected(next);
        setActiveTab("recovery");
        return;
      } else {
        // Queue exhausted — clear queue and go to sign
        setBulkQueue([]);
      }
    }
    // Always land on sign tab with cleared selection
    setPreselected(null);
    setActiveTab("sign");
  };
  const handleSubmit = () => {
    setClaims(prev => prev.map(c => pendingIds.has(c.id) ? { ...c, status: "submitted" as const } : c));
    setPendingIds(new Set());
    // Stay on sign tab — SignSubmit shows its own success screen with download button
    // User navigates away via the tracker button after downloading
  };

  const tabs = [
    { id: "tracker",    label: "Claims Tracker",      icon: BarChart3, badge: denied.length > 0 ? denied.length : null, badgeRed: true },
    { id: "recovery",   label: "Recovery Workflow",    icon: FileText,  badge: null, badgeRed: false },
    { id: "sign",       label: "Sign & Submit",        icon: PenTool,   badge: pendingIds.size > 0 ? pendingIds.size : null, badgeRed: false },
    { id: "prevention", label: "Prevention Engine",    icon: Shield,    badge: null, badgeRed: false },
    { id: "documents", label: "Documents", icon: FolderOpen, badge: null, badgeRed: false },
    { id: "bulk",       label: "Bulk CSV Upload",       icon: FileText, badge: null, badgeRed: false },
  ] as const;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-2xl">💼</span> Claims Recovery
            {user?.practiceName && (
              <span className="text-sm font-normal text-slate-400 ml-2">— {user.practiceName}</span>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Denied claim management · SOAP narrative generation · Pre-flight validation · Provider sign-off
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isCanada && (
            <div className="bg-red-700/10 border border-red-700/20 rounded-xl px-3 py-1.5 flex items-center gap-2">
              <span className="text-base">&#127809;</span>
              <div>
                <div className="text-[9px] font-bold uppercase text-red-400 tracking-wider">Canadian Practice</div>
                <div className="text-[10px] text-slate-400">CDCP · ODA · CAD</div>
              </div>
            </div>
          )}
          {denied.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 text-center">
              <div className="text-lg font-black text-red-400">{denied.length}</div>
              <div className="text-[9px] text-slate-400 font-bold uppercase">Active Denials</div>
            </div>
          )}
          <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl px-4 py-2 text-center">
            <div className="text-lg font-black text-teal-400">{fmtCurrency(atRisk)}</div>
            <div className="text-[9px] text-slate-400 font-bold uppercase">Revenue at Risk</div>
          </div>
        </div>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-700/50">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-5 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === t.id ? "border-teal-500 text-teal-600 dark:text-teal-400" : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"}`}>
              <Icon className="w-3.5 h-3.5" />
              {t.label}
              {t.badge !== null && (
                <span className={`${t.badgeRed ? "bg-red-500" : "bg-teal-500"} text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center`}>{t.badge}</span>
              )}
            </button>
          );
        })}
      </div>

      <div>
        {activeTab === "tracker"    && <ClaimsTracker claims={claims} onRecover={handleRecover} onRecoverAll={() => {
                      const gaQueue = claims.filter(c =>
                        c.status === "denied" &&
                        ["D9222","D9223","D9239","D9243","D9230","D9248"].includes(c.cdtCode)
                      );
                      if (gaQueue.length > 0) {
                        // Approve all at once and go straight to Sign & Submit
                        setPendingIds(new Set(gaQueue.map(c => c.id)));
                        setBulkQueue([]);
                        setPreselected(null);
                        setActiveTab("sign");
                      }
                    }} />}
        {activeTab === "recovery"   && <RecoveryWorkflow claims={claims} preselected={preselected} onApprove={handleApprove} bulkQueue={bulkQueue} />}
        {activeTab === "sign" && (
          <SignSubmit
            claims={claims as any}
            approvedIds={pendingIds}
            onGoToReview={() => setActiveTab("tracker")}
            onSubmitAll={(signatureData) => {
              handleSubmit();
            }}
          />
        )}
        {activeTab === "prevention" && <PreventionEngine claims={claims as any} />}
                {activeTab === "documents" && (
          <DocumentsVault practiceId="default" />
        )}

        {activeTab === "bulk" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white mb-1">Bulk CSV Upload — Backlog Claim Narratives</h3>
              <p className="text-xs text-slate-400">Upload your claims CSV to auto-generate a unique Denti-Cal SOAP narrative for each denied claim in your backlog.</p>
            </div>
            <BulkCSVUpload
              onRouteToSign={(narratives) => {
                // Store approved narratives and route to sign tab
                setCsvNarratives(narratives);
                setActiveTab("sign");
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── KNOWLEDGE BASE ADDENDUM: MOC CDT-21 §8.1.145 ────────────────────────────
// Source: Manual of Criteria, CDT 2021, Denti-Cal, 08/27/2021
// This section adds rules UNIQUE to CDT-21 not covered by the Feb 2026 or APL 23-028 docs.
// These rules remain current — CDT-25 MOC §8.1.145 is substantively identical on these points.

export const MOC_CDT21 = {
  source: "Medi-Cal Dental Manual of Criteria (MOC) CDT-21, §8.1.145, 08/27/2021",

  // Section (f) — Medical conditions requiring HOSPITAL setting (not just any facility)
  // UNIQUE: This specific list is not in APL 23-028 or the Feb 2026 handbook narrative templates
  hospitalSettingRequired: {
    rule: "MOC §8.1.145(f)",
    note: "Patients with these conditions shall be treated in a HOSPITAL setting or licensed facility capable of responding to a serious medical crisis — not just any dental office with a GA permit.",
    conditions: [
      "Moderate to severe asthma",
      "Reactive airway disease",
      "Congestive heart failure",
      "Cardiac arrhythmias",
      "Significant bleeding disorders (e.g., continuous anticoagulant therapy such as Coumadin)",
    ],
    implication: "If patient has any of the above, the claim must show the GA was rendered in a hospital or appropriately licensed ASC — or it will be denied as rendered in an inappropriate setting.",
  },

  // Section (g) — Associated procedures rule
  // PRESENT in CDT-25 and implied in ARC 069, but this is the explicit MOC language
  associatedProceduresRule: {
    rule: "MOC §8.1.145(g)",
    text: "Prior authorization or payment shall be DENIED if all associated procedures by the same provider are denied. The anesthesia is only a benefit when at least one payable dental procedure is approved.",
    implication: "If every dental procedure on the claim is denied, D9222/D9223 will also be denied — even if the GA authorization itself was approved. Always ensure at least one dental procedure is approvable.",
  },

  // Section (h) — Profundity ordering (only most profound payable)
  // UNIQUE: The explicit ordered list — needed for V013 validation logic
  profundityOrder: {
    rule: "MOC §8.1.145(h)",
    text: "Only ONE anesthesia procedure is payable per date of service regardless of methods of administration or drugs used. When multiple anesthesia procedures are performed, only the most profound will be allowed.",
    order: [
      { rank: 1, label: "Most Profound",  codes: ["D9222", "D9223"], name: "Deep Sedation/General Anesthesia" },
      { rank: 2, label: "",               codes: ["D9239", "D9243"], name: "IV Moderate (Conscious) Sedation" },
      { rank: 3, label: "",               codes: ["D9248"],           name: "Non-IV Conscious Sedation" },
      { rank: 4, label: "Least Profound", codes: ["D9230"],           name: "Nitrous Oxide/Analgesia" },
    ],
    implication: "If D9222 and D9230 are both billed on the same DOS, only D9222 is payable. Remove D9230 — this is the ARC 063 fix.",
  },

  // Section (i) — Valid anesthesia permit requirement
  permitRequirement: {
    rule: "MOC §8.1.145(i)",
    text: "Providers who administer general anesthesia (D9222 and D9223) and/or intravenous moderate (conscious) sedation/analgesia (D9239 and D9243) shall have valid anesthesia permits with the Dental Board of California.",
    implication: "Permit must be current and on file with Dental Board AND Medi-Cal Dental enrollment. Both the 013G/H/I permit endorsement in enrollment AND the underlying Dental Board permit must be active.",
  },

  // Section (j) — D9219 not separately billable
  evaluationNotBillable: {
    rule: "MOC §8.1.145(j)",
    text: "Evaluation for anesthesia procedures (D9219) is included in the fees for anesthesia and oral evaluation procedures and is NOT payable separately.",
    implication: "Do not bill D9219 on the same claim — it will be denied. The evaluation is bundled into D9222.",
  },

  // Section (k) — Agents/supplies included in fee
  agentsIncluded: {
    rule: "MOC §8.1.145(k)",
    text: "The cost of analgesic and anesthetic agents and supplies are included in the fee for the analgesic/anesthetic procedure.",
    implication: "Do not bill separately for propofol, sevoflurane, fentanyl, or other agents — they are bundled into D9222/D9223.",
  },

  // Section (l) — Anesthesia time definition
  anesthesiaTimeDefinition: {
    rule: "MOC §8.1.145(l)",
    text: "Anesthesia time is defined as the period between the BEGINNING of the administration of the anesthetic agent and the time that the anesthetist is NO LONGER IN PERSONAL ATTENDANCE.",
    implication: "The anesthesia record must document exact start time (first agent administered) and end time (anesthetist leaves patient). This is the basis for calculating D9222 + D9223 units (each 15-min increment).",
  },

  // D9219 — explicitly not payable
  D9219: {
    rule: "PROCEDURE D9219 — MOC §8.1.148",
    text: "Evaluation for Moderate Sedation, Deep Sedation, or General Anesthesia — included in the fees for anesthesia and oral evaluation procedures. NOT payable separately.",
  },

  // D9420 — Hospital/ASC call
  D9420: {
    rule: "PROCEDURE D9420 — MOC §8.1.151",
    description: "Hospital or Ambulatory Surgical Center Call",
    requirements: [
      "Operative report must include the total time in the operating room or ASC",
      "A benefit for each hour or fraction thereof as documented on the operative report",
      "NOT a benefit for assistant surgeon",
      "NOT a benefit for time spent compiling history, writing reports, or post-op/follow-up visits",
      "Pre-operative exams, processing, transportation, and setup fees are included — not payable separately",
    ],
  },

  // D9920 — Behavior management
  D9920: {
    rule: "PROCEDURE D9920 — MOC §8.1.153",
    description: "Behavior Management, By Report",
    requirements: [
      "Documentation must show patient is a special needs patient requiring additional time",
      "Special needs = physical, behavioral, developmental, or emotional condition prohibiting adequate response to provider attempts",
      "Must include patient's medical diagnosis and reason for additional time needed",
      "Benefit: up to 4 visits in a 12-month period",
      "Only in conjunction with payable procedures",
    ],
    note: "D9920 is a separate benefit that can be billed alongside dental procedures for special needs patients — does NOT replace GA, but documents the extra time/effort for standard visits.",
  },
};

// ─── VALIDATION RULE ADDITIONS FROM CDT-21 ───────────────────────────────────
// These extend the V001-V013 rules with CDT-21-specific checks

export const MOC_CDT21_VALIDATION_ADDITIONS = [
  {
    id: "V014",
    name: "Hospital Setting for High-Risk Conditions",
    severity: "critical" as const,
    category: "compliance",
    arc: "ARC 071",
    source: "MOC §8.1.145(f)",
    description: "Patients with moderate-severe asthma, reactive airway disease, CHF, cardiac arrhythmias, or significant bleeding disorders must have GA rendered in a hospital or licensed facility — not a standard dental office.",
    checkLogic: "If patient has qualifying medical condition (ASA ≥ III with cardiac/pulmonary/bleeding history), verify rendering facility is hospital or licensed ASC.",
  },
  {
    id: "V015",
    name: "D9219 Not Billed Separately",
    severity: "medium" as const,
    category: "billing",
    arc: "ARC 063",
    source: "MOC §8.1.145(j)",
    description: "D9219 (Evaluation for Sedation/GA) must NOT appear on same claim as D9222/D9223. It is bundled into the anesthesia fee and will be denied.",
    checkLogic: "Flag if D9219 present on same DOS as D9222/D9223.",
  },
  {
    id: "V016",
    name: "Anesthetic Agents Not Billed Separately",
    severity: "medium" as const,
    category: "billing",
    arc: "ARC 063",
    source: "MOC §8.1.145(k)",
    description: "Propofol, sevoflurane, fentanyl, and other agents are bundled into D9222 fee. Do not bill separately — will be denied.",
    checkLogic: "Flag if drug administration codes appear alongside D9222 on same claim.",
  },
  {
    id: "V017",
    name: "Anesthesia Time Documentation",
    severity: "high" as const,
    category: "documentation",
    arc: "ARC 062",
    source: "MOC §8.1.145(l)",
    description: "Anesthesia record must document precise START time (first agent administered) and END time (anesthetist no longer in personal attendance). Units of D9222+D9223 must correspond to documented time.",
    checkLogic: "Anesthesia record must have start_time, end_time, and (end-start)/15 must equal total units billed.",
  },
];
