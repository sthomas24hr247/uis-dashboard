import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileText, Upload, CheckCircle2, AlertTriangle,
  ChevronDown, ChevronUp, Copy, Download, Search, Plus,
  Sparkles, ClipboardList, X, Info, Eye, Edit3, Send,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// DENTI-CAL CLAIMS NARRATIVE ENGINE
// Generates required Denti-Cal narrative notes by CDT code
// Supports: manual entry, bulk upload, export ready for submission
// ═══════════════════════════════════════════════════════════════════════════════

interface NarrativeTemplate {
  code: string;
  description: string;
  category: string;
  narrativeRequired: boolean;
  template: string;
  requiredDocumentation: string[];
  dentalCalNotes: string;
  maxBenefit?: string;
  ageLimit?: string;
  frequencyLimit?: string;
}

interface ClaimEntry {
  id: string;
  patientName: string;
  dob: string;
  memberId: string;
  dateOfService: string;
  cdtCode: string;
  toothNumber?: string;
  surface?: string;
  narrative: string;
  status: 'draft' | 'ready' | 'submitted';
  generatedAt?: string;
}

// ─── Denti-Cal Narrative Templates by CDT Code ───────────────────────────────
const NARRATIVE_TEMPLATES: NarrativeTemplate[] = [
  {
    code: 'D0330',
    description: 'Panoramic Radiographic Image',
    category: 'Diagnostic',
    narrativeRequired: true,
    template: 'Panoramic radiograph taken on [DATE] for patient [PATIENT_NAME] (DOB: [DOB]). Clinical indication: [INDICATION]. Patient presents with [CHIEF_COMPLAINT]. Panoramic imaging necessary to evaluate [EVALUATION_REASON]. Previous radiographs dated [PREV_DATE] or no previous records available. Findings: [FINDINGS].',
    requiredDocumentation: ['Clinical indication', 'Chief complaint', 'Evaluation reason', 'Previous radiograph date or none'],
    dentalCalNotes: 'Limited to once per 36 months for adults. Requires documentation of clinical necessity. For patients under 18, limited to once per 24 months.',
    frequencyLimit: 'Once per 36 months (adults), once per 24 months (under 18)',
  },
  {
    code: 'D1110',
    description: 'Prophylaxis – Adult',
    category: 'Preventive',
    narrativeRequired: false,
    template: 'Adult prophylaxis performed on [DATE] for patient [PATIENT_NAME]. Removal of plaque, calculus, and stains from tooth surfaces. Patient instructed on oral hygiene techniques.',
    requiredDocumentation: ['Date of service', 'Periodontal status if applicable'],
    dentalCalNotes: 'Limited to twice per calendar year. No narrative required unless patient has periodontal disease — in that case, document medical necessity for prophylaxis vs. periodontal maintenance.',
    frequencyLimit: 'Twice per calendar year',
  },
  {
    code: 'D1120',
    description: 'Prophylaxis – Child',
    category: 'Preventive',
    narrativeRequired: false,
    template: 'Child prophylaxis performed on [DATE] for patient [PATIENT_NAME] (age [AGE]). Removal of plaque, calculus, and stains. Oral hygiene instructions provided to patient and/or parent/guardian.',
    requiredDocumentation: ['Date of service', 'Patient age'],
    dentalCalNotes: 'Limited to twice per calendar year for patients through age 17. Narrative not required unless there are complicating factors.',
    ageLimit: 'Through age 17',
    frequencyLimit: 'Twice per calendar year',
  },
  {
    code: 'D2140',
    description: 'Amalgam Restoration – 1 Surface, Primary or Permanent',
    category: 'Restorative',
    narrativeRequired: true,
    template: 'Amalgam restoration, one surface, placed on [DATE] for patient [PATIENT_NAME]. Tooth #[TOOTH_NUMBER], [SURFACE] surface. Clinical examination revealed [CLINICAL_FINDINGS]. Caries confirmed by [VERIFICATION_METHOD] (clinical exam/radiograph dated [XRAY_DATE]). Tooth is restorable and restoration is necessary to [TREATMENT_RATIONALE]. Local anesthesia administered: [YES/NO]. Tooth vitality: [VITAL/NON-VITAL].',
    requiredDocumentation: ['Tooth number', 'Surface(s)', 'Caries confirmation method', 'Radiograph date', 'Tooth vitality'],
    dentalCalNotes: 'Radiographic confirmation required. Document tooth number and surface. For primary teeth, document that extraction is not appropriate. Denti-Cal may request radiographs for audit — retain for 7 years.',
  },
  {
    code: 'D2330',
    description: 'Resin-Based Composite – 1 Surface, Anterior',
    category: 'Restorative',
    narrativeRequired: true,
    template: 'Resin-based composite restoration, one surface, anterior tooth, placed on [DATE] for patient [PATIENT_NAME]. Tooth #[TOOTH_NUMBER], [SURFACE] surface. Clinical findings: [CLINICAL_FINDINGS]. Caries confirmed by [VERIFICATION_METHOD] on [DATE]. Composite selected over amalgam due to [ESTHETIC_CLINICAL_REASON]. Tooth is vital/non-vital. Restoration necessary to restore function and [ADDITIONAL_RATIONALE].',
    requiredDocumentation: ['Tooth number', 'Surface', 'Reason for composite vs amalgam', 'Caries verification'],
    dentalCalNotes: 'Denti-Cal may require justification for composite over amalgam on posterior teeth. For anterior teeth, composite is generally approved. Document esthetic and/or clinical reason. Retain radiographs.',
  },
  {
    code: 'D2750',
    description: 'Crown – Porcelain Fused to High Noble Metal',
    category: 'Restorative',
    narrativeRequired: true,
    template: 'Porcelain-fused-to-metal crown preparation and placement, tooth #[TOOTH_NUMBER], performed on [DATE] for patient [PATIENT_NAME]. Clinical examination revealed [CLINICAL_FINDINGS] making the tooth unrestorable with a direct restoration. Radiographic evaluation dated [XRAY_DATE] confirms [RADIOGRAPHIC_FINDINGS]. Crown is necessary because [MEDICAL_NECESSITY_REASON]. The tooth is [VITAL/ENDODONTICALLY_TREATED]. Existing restorations: [EXISTING_RESTORATIONS]. All other conservative treatment options have been [CONSIDERED/EXHAUSTED]: [DETAIL]. Expected prognosis: [GOOD/FAIR].',
    requiredDocumentation: ['Tooth number', 'Radiograph date and findings', 'Medical necessity explanation', 'Why direct restoration not possible', 'Existing restorations', 'Vitality status'],
    dentalCalNotes: 'Crowns require prior authorization from Denti-Cal for most cases. Submit with radiographs (bitewing + periapical). Document that the tooth cannot be restored with a filling. Porcelain-fused-to-metal requires medical necessity documentation for posterior teeth. Consider submitting with a periodontal chart if periodontally involved.',
    maxBenefit: 'Prior authorization required',
  },
  {
    code: 'D3310',
    description: 'Endodontic Therapy – Anterior Tooth',
    category: 'Endodontic',
    narrativeRequired: true,
    template: 'Root canal therapy, anterior tooth #[TOOTH_NUMBER], completed on [DATE] for patient [PATIENT_NAME]. Diagnosis: [PULPAL_DIAGNOSIS] with [PERIAPICAL_DIAGNOSIS]. Patient presented with [SYMPTOMS/CHIEF_COMPLAINT]. Clinical examination findings: [CLINICAL_FINDINGS]. Radiographic findings dated [XRAY_DATE]: [RADIOGRAPHIC_FINDINGS]. Tooth is strategically important: [STRATEGIC_IMPORTANCE]. Number of canals treated: [NUMBER]. Working length: [WORKING_LENGTH] mm. Obturation method: [METHOD]. Post-treatment radiograph taken: [YES/NO]. Alternative treatment (extraction) was [DISCUSSED/DECLINED] because [REASON].',
    requiredDocumentation: ['Pulpal and periapical diagnosis', 'Symptoms', 'Radiograph with date', 'Number of canals', 'Working length', 'Obturation method'],
    dentalCalNotes: 'Root canal requires prior authorization for adults in most cases. Submit pre-operative radiograph showing pulpal pathology. Document why extraction is not appropriate. Tooth should have adequate remaining structure for restoration. Post-op radiograph required for claim submission.',
    maxBenefit: 'Prior authorization required for adults',
  },
  {
    code: 'D3330',
    description: 'Endodontic Therapy – Molar Tooth',
    category: 'Endodontic',
    narrativeRequired: true,
    template: 'Root canal therapy, molar tooth #[TOOTH_NUMBER], completed on [DATE] for patient [PATIENT_NAME]. Diagnosis: [PULPAL_DIAGNOSIS] with [PERIAPICAL_DIAGNOSIS]. Chief complaint: [CHIEF_COMPLAINT]. Clinical findings: [CLINICAL_FINDINGS]. Radiographic findings (dated [XRAY_DATE]): [RADIOGRAPHIC_FINDINGS]. Number of canals: [NUMBER] (mesial buccal, mesial lingual, distal). Working length verified by [APEX_LOCATOR/RADIOGRAPH]. Obturation: [METHOD]. Tooth has sufficient structure for coronal restoration: [YES/NO]. Strategic value justification: [REASON]. Extraction discussed: [YES/NO — reason if declined].',
    requiredDocumentation: ['Diagnosis (pulpal and periapical)', 'Radiographs pre and post-op', 'Canal count', 'Tooth restorability assessment', 'Strategic value'],
    dentalCalNotes: 'Molar root canals require prior authorization for adults. Higher documentation burden than anterior RCT. Pre-op radiograph showing pathology is required. Denti-Cal will scrutinize restorability — document that tooth has sufficient structure for a crown or large restoration.',
    maxBenefit: 'Prior authorization required for adults',
  },
  {
    code: 'D4341',
    description: 'Periodontal Scaling & Root Planing – Per Quadrant',
    category: 'Periodontal',
    narrativeRequired: true,
    template: 'Periodontal scaling and root planing, [QUADRANT] quadrant, performed on [DATE] for patient [PATIENT_NAME]. Periodontal examination findings: [EXAM_DATE] periodontal chart reveals probing depths of [PROBING_DEPTHS] mm in affected quadrant, with [BLEEDING_ON_PROBING]% bleeding on probing, [FURCATION_INVOLVEMENT], and [BONE_LOSS_DESCRIPTION] radiographic bone loss. Diagnosis: [PERIODONTAL_DIAGNOSIS]. Previous prophylaxis performed [PREV_PROPHYLAXIS_DATE] with inadequate response. SRP is medically necessary to [TREATMENT_GOAL]. Quadrant treated: [QUADRANT]. Local anesthesia used: [YES/NO]. Adjunctive therapy: [IF_ANY].',
    requiredDocumentation: ['Periodontal chart with probing depths', 'Bleeding on probing percentage', 'Furcation involvement', 'Radiographic bone loss documentation', 'Previous treatment history', 'Periodontal diagnosis'],
    dentalCalNotes: 'Full periodontal chart (6-point probing) required for SRP claims. Denti-Cal requires probing depths of 4mm or greater with bleeding to justify SRP. Document that prophylaxis was inadequate. Limited to once per 24 months per quadrant. Radiographic bone loss documentation strengthens the claim.',
    frequencyLimit: 'Once per 24 months per quadrant',
  },
  {
    code: 'D7110',
    description: 'Extraction – Erupted Tooth or Exposed Root',
    category: 'Oral Surgery',
    narrativeRequired: true,
    template: 'Simple extraction, tooth #[TOOTH_NUMBER], performed on [DATE] for patient [PATIENT_NAME]. Clinical indication: [INDICATION]. Radiographic findings (dated [XRAY_DATE]): [RADIOGRAPHIC_FINDINGS]. Tooth was deemed non-restorable due to [NON_RESTORABLE_REASON]. Patient informed of extraction and alternatives including [ALTERNATIVES_DISCUSSED]. Local anesthesia administered: [TYPE AND AMOUNT]. Procedure: Routine forceps extraction without surgical flap. Complications: None/[IF_ANY]. Post-operative instructions given.',
    requiredDocumentation: ['Tooth number', 'Reason for extraction', 'Non-restorability documentation', 'Radiograph date', 'Alternatives discussed'],
    dentalCalNotes: 'Simple extractions generally do not require prior authorization. Document non-restorability clearly — Denti-Cal may request radiographs. If tooth appears restorable on radiograph, claim may be denied. For multiple extractions on same date, list all teeth.',
  },
  {
    code: 'D7210',
    description: 'Surgical Extraction – Erupted Tooth',
    category: 'Oral Surgery',
    narrativeRequired: true,
    template: 'Surgical extraction, tooth #[TOOTH_NUMBER], performed on [DATE] for patient [PATIENT_NAME]. Surgical extraction necessary due to [SURGICAL_NECESSITY_REASON] (e.g., extensive decay, root morphology, ankylosis, broken-down crown). Clinical findings: [CLINICAL_FINDINGS]. Radiographic findings (dated [XRAY_DATE]): [RADIOGRAPHIC_FINDINGS]. Procedure involved [SURGICAL_DETAILS] (elevation of mucoperiosteal flap / sectioning of tooth / removal of bone). Sutures placed: [YES/NO — TYPE]. Hemostasis achieved. Post-operative instructions and prescriptions: [DETAILS].',
    requiredDocumentation: ['Surgical necessity reason', 'Radiograph showing complexity', 'Surgical technique used', 'Suture type if placed'],
    dentalCalNotes: 'Surgical extraction vs. simple extraction must be clearly differentiated. Document the surgical complexity — if a flap was raised or tooth was sectioned, document it explicitly. Denti-Cal may downcode D7210 to D7110 without adequate documentation. Radiograph required.',
  },
  {
    code: 'D9110',
    description: 'Palliative (Emergency) Treatment of Dental Pain',
    category: 'Other Services',
    narrativeRequired: true,
    template: 'Palliative/emergency treatment of dental pain on [DATE] for patient [PATIENT_NAME]. Chief complaint: [CHIEF_COMPLAINT]. Pain level: [PAIN_LEVEL]/10. Onset: [ONSET]. Clinical findings: [CLINICAL_FINDINGS]. Radiographic evaluation: [XRAY_FINDINGS_OR_NONE]. Treatment provided: [TREATMENT] (e.g., removal of gross decay, sedative dressing, occlusal adjustment, medication). Definitive treatment planned: [PLANNED_TREATMENT] scheduled for [DATE_OR_TBD]. Patient instructed to follow up.',
    requiredDocumentation: ['Chief complaint', 'Pain level and onset', 'Clinical findings', 'Treatment provided', 'Definitive treatment plan'],
    dentalCalNotes: 'Palliative treatment is covered for established and new patients. Limited to situations where definitive care cannot be provided same day. Document that this was emergency/palliative and that definitive treatment is planned. Cannot bill D9110 and a definitive procedure on the same tooth same day.',
  },
  {
    code: 'D9222',
    description: 'Deep Sedation / General Anesthesia – First 30 Minutes',
    category: 'Anesthesia',
    narrativeRequired: true,
    template: 'Deep sedation/general anesthesia, first 30 minutes (D9222), administered on [DATE] for patient [PATIENT_NAME] (DOB: [DOB]). TAR #[TAR_NUMBER] obtained [TAR_DATE]. Provider: [PROVIDER_NAME], Level 4 Anesthesia Permit #[PERMIT_NUMBER].\n\nMedical Necessity: Patient requires GA due to [REASON — extreme dental anxiety / intellectual disability / autism spectrum disorder / age under 6 with extensive caries]. Prior treatment attempts: [FAILED_ATTEMPTS_WITH_DATES].\n\nASA Physical Status: [CLASS]. Medical history: [CONDITIONS]. Behavioral assessment: [NOTES].\n\nTreatment performed under GA: [LIST_ALL_PROCEDURES_WITH_TOOTH_NUMBERS]. Anesthesia start: [START_TIME]. Anesthesia end: [END_TIME]. Total time: [TOTAL] minutes. Induction agent(s): [AGENTS_DOSES]. Maintenance: [AGENTS]. Airway: [INTUBATION/LMA/MASK]. Monitoring: continuous pulse oximetry, BP, HR. No complications. Patient recovered without incident.',
    requiredDocumentation: ['TAR number and approval date', 'Level 4 anesthesia permit number', 'ASA physical status classification', 'Medical/behavioral history supporting necessity', 'Failed prior treatment attempts with dates', 'All procedures performed with tooth numbers', 'Anesthesia start and end times', 'Agents and dosages', 'Airway management', 'Denti-Cal GA Criteria scoring form (22+ points)', 'Pre-operative radiographs'],
    dentalCalNotes: 'TAR (Treatment Authorization Request) must be obtained BEFORE service. Provider must hold Level 4 anesthesia permit. Patient must score 22+ points on Denti-Cal GA Criteria form. Document ASA physical status, behavioral assessment, failed prior treatment attempts, and ALL dental treatment completed under GA. Limited to once per 6 months by any provider. Radiographs required.',
    frequencyLimit: 'Once per 6 months by any provider',
    maxBenefit: 'Prior authorization / TAR required',
  },
  {
    code: 'D9223',
    description: 'Deep Sedation / General Anesthesia – Each Additional 15 Minutes',
    category: 'Anesthesia',
    narrativeRequired: true,
    template: 'Deep sedation/general anesthesia, additional 15-minute increment(s) (D9223 x [UNITS]), administered on [DATE] for patient [PATIENT_NAME] (DOB: [DOB]). Billed in conjunction with D9222 (first 30 minutes). TAR #[TAR_NUMBER].\n\nAdditional anesthesia time required due to [REASON — extent of dental treatment / complexity of procedures / patient required additional time for safe induction and recovery].\n\nAnesthesia time breakdown:\n- D9222: Minutes 0–30 (first 30 minutes)\n- D9223 Unit 1: Minutes 31–45\n[- D9223 Unit 2: Minutes 46–60 if applicable]\n\nTotal anesthesia time: [TOTAL] minutes. All time medically necessary. Start: [TIME]. End: [TIME]. Provider: [PROVIDER], Permit #[PERMIT_NUMBER]. No adverse events.',
    requiredDocumentation: ['Must be billed with D9222 on same claim', 'TAR number (same as D9222)', 'Exact anesthesia start and end times', 'Units of D9223 billed (max 2 per day)', 'Justification for additional time beyond 30 min', 'Time breakdown by 15-minute increment'],
    dentalCalNotes: 'Billed in addition to D9222 for each additional 15-minute increment beyond the first 30 minutes. Maximum 2 units of D9223 per day (combined D9222+D9223 = max 3 units/60 min total). Must be on same claim as D9222. Document exact time — carriers audit closely. Same TAR covers both codes.',
    frequencyLimit: 'Max 2 units/day — combined with D9222 = 60 min max',
    maxBenefit: 'Prior authorization / TAR required (same as D9222)',
  },
  {
    code: 'D9239',
    description: 'IV Moderate (Conscious) Sedation – First 15 Minutes',
    category: 'Anesthesia',
    narrativeRequired: true,
    template: 'Intravenous moderate (conscious) sedation, first 15 minutes (D9239), administered on [DATE] for patient [PATIENT_NAME] (DOB: [DOB]). TAR #[TAR_NUMBER] obtained [TAR_DATE]. Provider: [PROVIDER_NAME], Permit #[PERMIT_NUMBER].\n\nMedical Necessity: IV moderate sedation necessary due to [REASON — documented dental anxiety / inability to cooperate / gag reflex / medical condition]. Alternative behavior management [ATTEMPTED/NOT APPROPRIATE BECAUSE: REASON].\n\nASA Physical Status: [CLASS]. Medical history: [CONDITIONS]. Medications: [MEDICATIONS]. Allergies: [ALLERGIES/NONE].\n\nIV access: [SITE]. Pre-sedation vitals: BP [BP], HR [HR], O2 sat [SAT]%. Agent(s): [AGENTS_DOSES]. Sedation start: [TIME]. Patient achieved moderate sedation — responsive to verbal commands, maintained own airway throughout. Monitoring: continuous pulse oximetry, BP, HR. No complications. Recovery per protocol. Post-sedation vitals stable.\n\nDental treatment completed: [LIST_PROCEDURES].',
    requiredDocumentation: ['TAR number and date', 'Provider permit number', 'Medical necessity documentation', 'ASA physical status', 'IV access site', 'Agents with dosages', 'Sedation start and end times', 'Pre and post vital signs', 'Confirmation patient maintained own airway'],
    dentalCalNotes: 'TAR required prior to service. D9239 is limited to 1 unit per day. Less documentation burden than GA but still requires medical necessity narrative, ASA classification, and complete sedation records. Patient must remain responsive to verbal commands (moderate sedation). Document IV access, monitoring, and that patient maintained own airway.',
    frequencyLimit: 'Limited to 1 unit per day',
    maxBenefit: 'Prior authorization / TAR required',
  },
];

// ─── Helper functions ─────────────────────────────────────────────────────────
function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

function formatDate(date: string) {
  if (!date) return '';
  const d = new Date(date + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
}

function fillTemplate(template: string, fields: Record<string, string>) {
  let filled = template;
  Object.entries(fields).forEach(([key, value]) => {
    filled = filled.replace(new RegExp(`\\[${key}\\]`, 'g'), value || `[${key}]`);
  });
  return filled;
}

// ─── Components ───────────────────────────────────────────────────────────────

function CodeBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    'Diagnostic': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'Preventive': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'Restorative': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    'Endodontic': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    'Periodontal': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    'Oral Surgery': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'Anesthesia': 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    'Other Services': 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${colors[category] || colors['Other Services']}`}>
      {category}
    </span>
  );
}

function StatusBadge({ status }: { status: ClaimEntry['status'] }) {
  const styles = {
    draft: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
    ready: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  };
  const labels = { draft: 'Draft', ready: 'Ready to Submit', submitted: 'Submitted' };
  return (
    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DentiCalClaimsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'generator' | 'claims' | 'library'>('generator');
  const [claims, setClaims] = useState<ClaimEntry[]>([]);
  const [searchCode, setSearchCode] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<NarrativeTemplate | null>(null);
  const [showTemplateDetail, setShowTemplateDetail] = useState(false);
  const [expandedClaim, setExpandedClaim] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    patientName: '',
    dob: '',
    memberId: '',
    dateOfService: new Date().toISOString().split('T')[0],
    cdtCode: '',
    toothNumber: '',
    surface: '',
  });
  const [generatedNarrative, setGeneratedNarrative] = useState('');
  const [editingNarrative, setEditingNarrative] = useState(false);

  const filteredTemplates = NARRATIVE_TEMPLATES.filter(t =>
    t.code.toLowerCase().includes(searchCode.toLowerCase()) ||
    t.description.toLowerCase().includes(searchCode.toLowerCase()) ||
    t.category.toLowerCase().includes(searchCode.toLowerCase())
  );

  const selectedCode = NARRATIVE_TEMPLATES.find(t => t.code === form.cdtCode);

  function generateNarrative() {
    if (!selectedCode) return;
    const fields: Record<string, string> = {
      PATIENT_NAME: form.patientName || '[Patient Name]',
      DOB: form.dob ? formatDate(form.dob) : '[Date of Birth]',
      DATE: form.dateOfService ? formatDate(form.dateOfService) : '[Date of Service]',
      TOOTH_NUMBER: form.toothNumber || '[Tooth #]',
      SURFACE: form.surface || '[Surface]',
      QUADRANT: '[Quadrant]',
      AGE: '[Age]',
      INDICATION: '[Clinical Indication]',
      CHIEF_COMPLAINT: '[Chief Complaint]',
      EVALUATION_REASON: '[Evaluation Reason]',
      PREV_DATE: '[Prior Radiograph Date]',
      FINDINGS: '[Findings]',
      CLINICAL_FINDINGS: '[Clinical Findings]',
      XRAY_DATE: '[Radiograph Date]',
      RADIOGRAPHIC_FINDINGS: '[Radiographic Findings]',
      VERIFICATION_METHOD: 'clinical examination and radiograph',
      ESTHETIC_CLINICAL_REASON: '[Esthetic/Clinical Reason]',
      MEDICAL_NECESSITY_REASON: '[Medical Necessity Reason]',
      EXISTING_RESTORATIONS: '[Existing Restorations]',
      PULPAL_DIAGNOSIS: '[Pulpal Diagnosis]',
      PERIAPICAL_DIAGNOSIS: '[Periapical Diagnosis]',
      SYMPTOMS: '[Symptoms]',
      STRATEGIC_IMPORTANCE: '[Strategic Importance]',
      NUMBER: '[Number]',
      WORKING_LENGTH: '[Working Length]',
      METHOD: 'warm vertical condensation',
      PROBING_DEPTHS: '[Probing Depths]',
      BLEEDING_ON_PROBING: '[%]',
      FURCATION_INVOLVEMENT: '[Furcation Class]',
      BONE_LOSS_DESCRIPTION: '[Bone Loss Description]',
      PERIODONTAL_DIAGNOSIS: 'generalized moderate chronic periodontitis',
      PREV_PROPHYLAXIS_DATE: '[Prior Prophylaxis Date]',
      TREATMENT_GOAL: 'arrest disease progression and reduce periodontal pocket depths',
      NON_RESTORABLE_REASON: '[Non-Restorable Reason]',
      ALTERNATIVES_DISCUSSED: 'implant or fixed partial denture',
      SURGICAL_NECESSITY_REASON: '[Surgical Necessity Reason]',
      SURGICAL_DETAILS: '[Surgical Details]',
      PAIN_LEVEL: '[1-10]',
      ONSET: '[Onset Description]',
      TREATMENT: '[Treatment Provided]',
      PLANNED_TREATMENT: '[Definitive Treatment]',
      TYPE_AND_AMOUNT: '2% lidocaine with 1:100,000 epinephrine',
      EXAM_DATE: '[Exam Date]',
      CONSIDERED_EXHAUSTED: 'considered and deemed insufficient',
      DETAIL: '[Conservation Treatment Detail]',
    };
    setGeneratedNarrative(fillTemplate(selectedCode.template, fields));
    setEditingNarrative(true);
  }

  function saveClaim() {
    if (!form.patientName || !form.cdtCode || !generatedNarrative) return;
    const newClaim: ClaimEntry = {
      id: generateId(),
      patientName: form.patientName,
      dob: form.dob,
      memberId: form.memberId,
      dateOfService: form.dateOfService,
      cdtCode: form.cdtCode,
      toothNumber: form.toothNumber,
      surface: form.surface,
      narrative: generatedNarrative,
      status: 'ready',
      generatedAt: new Date().toISOString(),
    };
    setClaims(prev => [newClaim, ...prev]);
    setActiveTab('claims');
    setForm({ patientName: '', dob: '', memberId: '', dateOfService: new Date().toISOString().split('T')[0], cdtCode: '', toothNumber: '', surface: '' });
    setGeneratedNarrative('');
    setEditingNarrative(false);
  }

  function copyNarrative(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function markSubmitted(id: string) {
    setClaims(prev => prev.map(c => c.id === id ? { ...c, status: 'submitted' } : c));
  }

  const tabs = [
    { id: 'generator', label: 'Narrative Generator', icon: Sparkles },
    { id: 'claims', label: `Claims Queue${claims.length > 0 ? ` (${claims.filter(c => c.status === 'ready').length})` : ''}`, icon: ClipboardList },
    { id: 'library', label: 'Code Library', icon: FileText },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-500" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  Denti-Cal Claims Narrative Engine
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Generate required narrative notes for Denti-Cal claim submission
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                  {NARRATIVE_TEMPLATES.length} CDT Codes · Denti-Cal Compliant
                </span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}>
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* ─── NARRATIVE GENERATOR TAB ─── */}
        {activeTab === 'generator' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Left: Form */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-5">Patient & Claim Information</h2>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Patient Name *</label>
                      <input value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))}
                        placeholder="Full name" className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white placeholder-slate-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Date of Birth</label>
                      <input type="date" value={form.dob} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))}
                        className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Denti-Cal Member ID</label>
                      <input value={form.memberId} onChange={e => setForm(f => ({ ...f, memberId: e.target.value }))}
                        placeholder="Member ID" className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white placeholder-slate-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Date of Service *</label>
                      <input type="date" value={form.dateOfService} onChange={e => setForm(f => ({ ...f, dateOfService: e.target.value }))}
                        className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white" />
                    </div>
                  </div>

                  {/* CDT Code Selector */}
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">CDT Code *</label>
                    <select value={form.cdtCode} onChange={e => setForm(f => ({ ...f, cdtCode: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white">
                      <option value="">Select a CDT code...</option>
                      {NARRATIVE_TEMPLATES.map(t => (
                        <option key={t.code} value={t.code}>{t.code} — {t.description}</option>
                      ))}
                    </select>
                  </div>

                  {selectedCode && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Tooth Number</label>
                        <input value={form.toothNumber} onChange={e => setForm(f => ({ ...f, toothNumber: e.target.value }))}
                          placeholder="e.g. 14, 30" className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white placeholder-slate-400" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Surface(s)</label>
                        <input value={form.surface} onChange={e => setForm(f => ({ ...f, surface: e.target.value }))}
                          placeholder="e.g. MOD, B, DO" className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white placeholder-slate-400" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Denti-Cal Notes for selected code */}
                {selectedCode && (
                  <div className="mt-5 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">Denti-Cal Requirements — {selectedCode.code}</p>
                        <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">{selectedCode.dentalCalNotes}</p>
                        {selectedCode.frequencyLimit && (
                          <p className="text-xs text-amber-600 dark:text-amber-500 mt-1 font-medium">Frequency: {selectedCode.frequencyLimit}</p>
                        )}
                        {selectedCode.maxBenefit && (
                          <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5 font-medium">⚠ {selectedCode.maxBenefit}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <button onClick={generateNarrative} disabled={!form.cdtCode || !form.patientName}
                  className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors">
                  <Sparkles className="w-4 h-4" />
                  Generate Narrative
                </button>
              </div>
            </div>

            {/* Right: Generated narrative */}
            <div className="space-y-6">
              {generatedNarrative ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900 dark:text-white">Generated Narrative</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Edit the highlighted fields — replace all [BRACKETED] items with actual clinical data
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => copyNarrative(generatedNarrative, 'preview')}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        {copiedId === 'preview' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedId === 'preview' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={generatedNarrative}
                    onChange={e => setGeneratedNarrative(e.target.value)}
                    rows={12}
                    className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-slate-200 leading-relaxed resize-none font-mono"
                  />

                  {/* Required documentation checklist */}
                  {selectedCode && (
                    <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">Required Documentation Checklist</p>
                      <div className="space-y-1.5">
                        {selectedCode.requiredDocumentation.map((doc, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded border-2 border-slate-300 dark:border-slate-500 flex-shrink-0" />
                            <span className="text-xs text-slate-600 dark:text-slate-400">{doc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 mt-5">
                    <button onClick={() => { setGeneratedNarrative(''); setEditingNarrative(false); }}
                      className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                      Clear
                    </button>
                    <button onClick={saveClaim}
                      className="flex-2 flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition-colors">
                      <Plus className="w-4 h-4" />
                      Save to Claims Queue
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 p-12 text-center">
                  <div className="w-14 h-14 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-7 h-7 text-slate-400" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-2">Ready to Generate</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                    Fill in the patient information and select a CDT code to generate a Denti-Cal compliant narrative note.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── CLAIMS QUEUE TAB ─── */}
        {activeTab === 'claims' && (
          <div className="space-y-4">
            {claims.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 p-16 text-center">
                <div className="w-14 h-14 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ClipboardList className="w-7 h-7 text-slate-400" />
                </div>
                <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-2">No Claims Yet</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Generate narratives and save them to build your claims queue.</p>
                <button onClick={() => setActiveTab('generator')}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl transition-colors">
                  Generate First Narrative
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {claims.filter(c => c.status === 'ready').length} ready · {claims.filter(c => c.status === 'submitted').length} submitted
                  </p>
                </div>
                {claims.map(claim => {
                  const template = NARRATIVE_TEMPLATES.find(t => t.code === claim.cdtCode);
                  const isExpanded = expandedClaim === claim.id;
                  return (
                    <div key={claim.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <div className="px-6 py-4 flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-semibold text-slate-900 dark:text-white">{claim.patientName}</span>
                            <span className="text-sm font-mono font-bold text-teal-600 dark:text-teal-400">{claim.cdtCode}</span>
                            {template && <CodeBadge category={template.category} />}
                            <StatusBadge status={claim.status} />
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                            {claim.dob && <span>DOB: {formatDate(claim.dob)}</span>}
                            {claim.memberId && <span>ID: {claim.memberId}</span>}
                            <span>DOS: {formatDate(claim.dateOfService)}</span>
                            {claim.toothNumber && <span>Tooth #{claim.toothNumber}</span>}
                            {claim.surface && <span>{claim.surface}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => copyNarrative(claim.narrative, claim.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                            {copiedId === claim.id ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            {copiedId === claim.id ? 'Copied' : 'Copy'}
                          </button>
                          {claim.status === 'ready' && (
                            <button onClick={() => markSubmitted(claim.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors">
                              <Send className="w-3.5 h-3.5" />
                              Mark Submitted
                            </button>
                          )}
                          <button onClick={() => setExpandedClaim(isExpanded ? null : claim.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                          </button>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="px-6 pb-5 border-t border-slate-100 dark:border-slate-700 pt-4">
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Narrative</p>
                          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
                            {claim.narrative}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* ─── CODE LIBRARY TAB ─── */}
        {activeTab === 'library' && (
          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={searchCode} onChange={e => setSearchCode(e.target.value)}
                placeholder="Search by code, description, or category..."
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white placeholder-slate-400 text-sm" />
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredTemplates.map(template => (
                <div key={template.code}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-lg font-bold text-teal-600 dark:text-teal-400 font-mono">{template.code}</span>
                          <CodeBadge category={template.category} />
                          {!template.narrativeRequired && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                              Narrative Optional
                            </span>
                          )}
                          {template.maxBenefit === 'Prior authorization required' && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              Prior Auth Required
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">{template.description}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{template.dentalCalNotes}</p>
                        <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-500 dark:text-slate-400">
                          {template.frequencyLimit && <span>📅 {template.frequencyLimit}</span>}
                          {template.ageLimit && <span>👤 {template.ageLimit}</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => { setForm(f => ({ ...f, cdtCode: template.code })); setActiveTab('generator'); }}
                        className="flex-shrink-0 px-4 py-2 text-xs font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors">
                        Use Code
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
