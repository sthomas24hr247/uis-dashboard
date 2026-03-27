// Mock data from Children's Choice spreadsheet
export interface DeniedClaim {
  id: string;
  row: number;
  carrier: string;
  type: string;
  clinic: string;
  claimDate: string;
  patientId: string;
  patientName: string;
  guardianName: string;
  dob: string;
  age: string;
  phone: string;
  lastExamDate: string;
  dentist: string;
  active: string;
  karenReview: string;
  scanned: string;
  rcmSent: string;
  denialCode: string;
  issues: string[];
  billedAmt: number;
  status: string;
  priority: string;
  daysOld: number;
  denialReason?: string;
  cdtCode?: string;
  patientAge?: number;
}

export interface ApprovalItem extends DeniedClaim {
  narrative: string;
  submittedAt: string;
  resolution: ArcResolution | undefined;
}

export interface ArcResolution {
  name: string;
  action: string;
  type: string;
}

const PATIENT_SEEDS = [
  { name: "Dorian Campos Mendoza", guardian: "Mendoza, Brisa", dob: "09/23/2017", age: "6y 7m", phone: "(530) 602-6605" },
  { name: "Sofia Ramirez Torres", guardian: "Torres, Maria Elena", dob: "03/14/2018", age: "5y 11m", phone: "(661) 455-2190" },
  { name: "Mateo Aguirre Rios", guardian: "Rios, Guadalupe", dob: "11/05/2016", age: "7y 4m", phone: "(559) 387-4412" },
  { name: "Isabella Cruz Delgado", guardian: "Delgado, Ana", dob: "07/22/2019", age: "4y 8m", phone: "(661) 903-7781" },
  { name: "Diego Herrera Salinas", guardian: "Salinas, Rosa", dob: "01/30/2017", age: "7y 1m", phone: "(559) 221-6654" },
  { name: "Valentina Ochoa Pena", guardian: "Pena, Claudia", dob: "06/09/2018", age: "5y 9m", phone: "(661) 770-3398" },
  { name: "Emilio Fuentes Garcia", guardian: "Garcia, Leticia", dob: "12/17/2016", age: "7y 3m", phone: "(559) 845-1127" },
  { name: "Camila Sandoval Reyes", guardian: "Reyes, Patricia", dob: "08/01/2019", age: "4y 7m", phone: "(661) 512-8834" },
  { name: "Andres Molina Vargas", guardian: "Vargas, Teresa", dob: "04/25/2017", age: "6y 11m", phone: "(559) 609-5573" },
  { name: "Lucia Paredes Ortega", guardian: "Ortega, Maricela", dob: "10/11/2018", age: "5y 5m", phone: "(661) 334-9920" },
  { name: "Santiago Ibarra Luna", guardian: "Luna, Sandra", dob: "02/03/2017", age: "7y 1m", phone: "(559) 448-2216" },
  { name: "Renata Espinoza Castro", guardian: "Castro, Yolanda", dob: "09/19/2016", age: "7y 6m", phone: "(661) 287-6641" },
  { name: "Nicolas Cardenas Mejia", guardian: "Mejia, Carmen", dob: "05/28/2018", age: "5y 10m", phone: "(559) 713-0058" },
  { name: "Ximena Velasco Navarro", guardian: "Navarro, Irma", dob: "01/07/2019", age: "5y 2m", phone: "(661) 655-4487" },
  { name: "Gabriel Trujillo Soto", guardian: "Soto, Adriana", dob: "07/14/2017", age: "6y 8m", phone: "(559) 926-3319" },
  { name: "Mariana Robles Acosta", guardian: "Acosta, Silvia", dob: "11/22/2018", age: "5y 4m", phone: "(661) 108-7756" },
  { name: "Julian Montes Duran", guardian: "Duran, Gloria", dob: "03/06/2017", age: "7y 0m", phone: "(559) 572-1183" },
  { name: "Elena Bautista Lara", guardian: "Lara, Alicia", dob: "08/30/2016", age: "7y 7m", phone: "(661) 449-5528" },
  { name: "Adrian Cervantes Mora", guardian: "Mora, Josefina", dob: "06/12/2018", age: "5y 9m", phone: "(559) 881-3347" },
  { name: "Paula Gallegos Vega", guardian: "Vega, Norma", dob: "12/01/2019", age: "4y 3m", phone: "(661) 226-8814" },
  { name: "Fernando Duarte Leon", guardian: "Leon, Estela", dob: "04/18/2017", age: "6y 11m", phone: "(559) 337-0092" },
  { name: "Sara Pantoja Rios", guardian: "Rios, Delia", dob: "10/25/2018", age: "5y 5m", phone: "(661) 764-4461" },
  { name: "Marco Lozano Estrada", guardian: "Estrada, Francisca", dob: "02/14/2017", age: "7y 1m", phone: "(559) 508-7739" },
];

const LAST_EXAM_SEEDS = [
  "04/13/2024", "03/22/2024", "05/01/2024", "02/15/2024", "06/10/2024",
  "01/28/2024", "04/05/2024", "03/11/2024", "05/20/2024", "02/08/2024",
  "06/01/2024", "01/15/2024", "04/22/2024", "03/30/2024", "05/14/2024",
  "02/25/2024", "06/07/2024", "01/19/2024", "04/28/2024", "03/05/2024",
  "05/09/2024", "02/18/2024", "06/15/2024",
];

const RAW_CLAIMS = [
  { row: 113, carrier: "DentiCal", type: "PRM", clinic: "Bakersfield", claimDate: "9/11/2024", patientId: "22578", dentist: "Dr. DeGuzman", active: "Y", karenReview: "", scanned: "", rcmSent: "", denialCode: "ARC 326", issues: ["Missing emergency narrative statement", "No SOAP note attached", "D9222/D9223 missing medical necessity"], billedAmt: 2847 },
  { row: 114, carrier: "DentiCal", type: "PRM", clinic: "Bakersfield", claimDate: "9/11/2024", patientId: "21541", dentist: "Dr. DeGuzman", active: "Y", karenReview: "", scanned: "", rcmSent: "", denialCode: "ARC 071", issues: ["Narrative does not address qualifying criteria (i)+(ii)", "No step therapy documentation"], billedAmt: 3190 },
  { row: 115, carrier: "DentiCal", type: "PRM", clinic: "Bakersfield", claimDate: "9/12/2024", patientId: "53875", dentist: "Dr. DeGuzman", active: "Y", karenReview: "", scanned: "", rcmSent: "", denialCode: "ARC 326", issues: ["Failure to provide radiographs/attachments for EDI document", "Emergency justification vague"], billedAmt: 2450 },
  { row: 116, carrier: "DentiCal", type: "PRM", clinic: "Bakersfield", claimDate: "9/12/2024", patientId: "53315", dentist: "Dr. DeGuzman", active: "Y", karenReview: "", scanned: "", rcmSent: "", denialCode: "ARC 062", issues: ["No anesthetic agent on record", "Anesthesia record not attached"], billedAmt: 1980 },
  { row: 117, carrier: "DentiCal", type: "PRM", clinic: "Bakersfield", claimDate: "9/12/2024", patientId: "32357", dentist: "Dr. DeGuzman", active: "Y", karenReview: "", scanned: "", rcmSent: "", denialCode: "ARC 326", issues: ["Missing SOAP note", "No emergency certification statement"], billedAmt: 4210 },
  { row: 182, carrier: "DentiCal", type: "PRM", clinic: "Fresno", claimDate: "4/7/2024", patientId: "19369", dentist: "Dr. DeGuzman", active: "Y", karenReview: "", scanned: "", rcmSent: "", denialCode: "ARC 071", issues: ["GA not deemed medically necessary - narrative insufficient", "No behavior management dates"], billedAmt: 3560 },
  { row: 257, carrier: "DentiCal", type: "PRM", clinic: "Visalia", claimDate: "9/9/2024", patientId: "10108", dentist: "Dr. DeGuzman", active: "Y", karenReview: "", scanned: "", rcmSent: "", denialCode: "ARC 326", issues: ["Missing documentation/attachments", "No Frankl scale recorded"], billedAmt: 2780 },
  { row: 258, carrier: "DentiCal", type: "PRM", clinic: "Bakersfield", claimDate: "9/11/2024", patientId: "54077", dentist: "Dr. DeGuzman", active: "Y", karenReview: "", scanned: "", rcmSent: "", denialCode: "ARC 069", issues: ["No associated dental services on claim with GA codes", "D9222 billed without treatment procedures"], billedAmt: 1560 },
  { row: 260, carrier: "DentiCal", type: "PRM", clinic: "Bakersfield", claimDate: "9/12/2024", patientId: "18561", dentist: "Dr. DeGuzman", active: "Y", karenReview: "", scanned: "", rcmSent: "", denialCode: "ARC 326", issues: ["Incomplete SOAP note - missing Objective section", "No ASA classification"], billedAmt: 3100 },
  { row: 282, carrier: "DentiCal", type: "PRM", clinic: "Bakersfield", claimDate: "11/7/2024", patientId: "60923", dentist: "Dr. DeGuzman", active: "Y", karenReview: "", scanned: "", rcmSent: "", denialCode: "ARC 071", issues: ["Step therapy not documented", "Criteria (iii)-(vi) not addressed"], billedAmt: 2990 },
  { row: 331, carrier: "DentiCal", type: "PRM", clinic: "Fresno", claimDate: "4/7/2024", patientId: "5799", dentist: "Dr. DeGuzman", active: "Y", karenReview: "", scanned: "", rcmSent: "", denialCode: "ARC 326", issues: ["Missing emergency narrative", "No radiographs attached"], billedAmt: 3840 },
  { row: 340, carrier: "DentiCal", type: "PRM", clinic: "Bakersfield", claimDate: "4/26/2024", patientId: "33954", dentist: "Dr. DeGuzman", active: "Y", karenReview: "", scanned: "", rcmSent: "", denialCode: "ARC 062", issues: ["Anesthesia record missing agent and dosage", "No monitoring data"], billedAmt: 2670 },
  { row: 351, carrier: "DentiCal", type: "PRM", clinic: "Fresno", claimDate: "6/2/2024", patientId: "38150", dentist: "Dr. DeGuzman", active: "Y", karenReview: "", scanned: "", rcmSent: "", denialCode: "ARC 326", issues: ["SOAP note not attached to claim", "Missing tooth charting"], billedAmt: 4100 },
  { row: 377, carrier: "DentiCal", type: "PRM", clinic: "Bakersfield", claimDate: "7/25/2024", patientId: "50384", dentist: "Dr. DeGuzman", active: "Y", karenReview: "", scanned: "", rcmSent: "", denialCode: "ARC 071", issues: ["Narrative too vague - no specific criteria addressed", "Missing ICD-10 codes"], billedAmt: 3350 },
  { row: 560, carrier: "DentiCal", type: "SEC", clinic: "Bakersfield", claimDate: "8/30/2024", patientId: "15926", dentist: "Dr. DeGuzman", active: "Y", karenReview: "", scanned: "", rcmSent: "", denialCode: "ARC 326", issues: ["Secondary claim missing EOB from primary", "No documentation attached"], billedAmt: 1890 },
  { row: 669, carrier: "DentiCal", type: "PRM", clinic: "Visalia", claimDate: "12/2/2024", patientId: "18815", dentist: "Dr. DeGuzman", active: "Y", karenReview: "", scanned: "", rcmSent: "", denialCode: "ARC 326", issues: ["Missing emergency SOAP note", "No GA justification narrative"], billedAmt: 3220 },
  { row: 670, carrier: "DentiCal", type: "SEC", clinic: "Visalia", claimDate: "6/3/2024", patientId: "19513", dentist: "Dr. DeGuzman", active: "Y", karenReview: "", scanned: "", rcmSent: "", denialCode: "ARC 062", issues: ["No anesthetic agent documented", "Record unsigned"], billedAmt: 2150 },
  { row: 675, carrier: "DentiCal", type: "PRM", clinic: "Visalia", claimDate: "11/3/2024", patientId: "14003", dentist: "Dr. DeGuzman", active: "Y", karenReview: "", scanned: "", rcmSent: "", denialCode: "ARC 071", issues: ["Insufficient medical necessity documentation", "No specialist letter"], billedAmt: 3680 },
  { row: 401, carrier: "DentiCal", type: "PRM", clinic: "Fresno", claimDate: "8/15/2024", patientId: "42891", dentist: "Dr. DeGuzman", active: "Y", karenReview: "", scanned: "", rcmSent: "", denialCode: "ARC 048", issues: ["Narrative doesn't match radiographs", "Tooth charting inconsistent with procedure codes", "Radiograph shows different teeth than treatment plan"], billedAmt: 3150 },
  { row: 415, carrier: "DentiCal", type: "PRM", clinic: "Visalia", claimDate: "10/22/2024", patientId: "37502", dentist: "Dr. DeGuzman", active: "Y", karenReview: "", scanned: "", rcmSent: "", denialCode: "ARC 048", issues: ["Tooth charting mismatch between narrative and x-rays", "Procedure codes do not match documented findings"], billedAmt: 2890 },
  { row: 430, carrier: "DentiCal", type: "PRM", clinic: "Bakersfield", claimDate: "7/8/2024", patientId: "61204", dentist: "Dr. DeGuzman", active: "Y", karenReview: "", scanned: "", rcmSent: "", denialCode: "ARC 013G", issues: ["GA facility permit not on file with Denti-Cal", "Provider enrollment issue — permit expired or missing"], billedAmt: 4520 },
  { row: 445, carrier: "DentiCal", type: "PRM", clinic: "Fresno", claimDate: "5/19/2024", patientId: "28736", dentist: "Dr. DeGuzman", active: "Y", karenReview: "", scanned: "", rcmSent: "", denialCode: "ARC 013G", issues: ["GA facility permit missing from enrollment records", "Claims cannot process until permit is on file"], billedAmt: 3780 },
  { row: 450, carrier: "DentiCal", type: "PRM", clinic: "Bakersfield", claimDate: "6/20/2024", patientId: "44210", dentist: "Dr. DeGuzman", active: "Y", karenReview: "", scanned: "", rcmSent: "", denialCode: "ARC 326", issues: ["Missing SOAP documentation", "No emergency cert"], billedAmt: 2950 },
];

const daysSince = (dateStr: string): number => {
  const [m, d, y] = dateStr.split("/");
  const dos = new Date(+y, +m - 1, +d);
  return Math.floor((Date.now() - dos.getTime()) / 86400000);
};

export const getInitialClaims = (): DeniedClaim[] =>
  RAW_CLAIMS.map((c, i) => {
    const seed = PATIENT_SEEDS[i % PATIENT_SEEDS.length];
    return {
      ...c,
      id: `CC-${c.row}`,
      patientName: seed.name,
      guardianName: seed.guardian,
      dob: seed.dob,
      age: seed.age,
      phone: seed.phone,
      lastExamDate: LAST_EXAM_SEEDS[i % LAST_EXAM_SEEDS.length],
      status: "denied",
      priority: c.billedAmt > 3500 ? "critical" : c.billedAmt > 2500 ? "high" : "medium",
      daysOld: daysSince(c.claimDate),
    };
  });

export const ARC_RESOLUTION: Record<string, ArcResolution> = {
  "ARC 326": { name: "Missing Documentation/Attachments", action: "Resubmit with complete SOAP note, radiographs, and emergency certification attached", type: "DOCUMENTATION_APPEND" },
  "ARC 071": { name: "GA Not Deemed Medically Necessary", action: "Resubmit TAR with enhanced narrative addressing criteria (i)+(ii) + at least one of (iii)-(vi)", type: "TAR_RESUBMISSION" },
  "ARC 062": { name: "No Anesthetic Agent on Record", action: "Attach anesthesia record with agent, dosage, route, start/end times", type: "DOCUMENTATION_APPEND" },
  "ARC 069": { name: "No Associated Dental Services", action: "Resubmit with dental procedure codes (D2930, D7140, etc.) on same claim as D9222", type: "CLAIM_CORRECTION" },
  "ARC 048": { name: "Narrative Doesn't Match Radiographs", action: "Reconcile tooth charting with procedure codes and resubmit with corrected narrative", type: "CLAIM_CORRECTION" },
  "ARC 013G": { name: "GA Facility Permit Not on File", action: "Submit copy of valid GA permit to enrollment unit, then resubmit", type: "ENROLLMENT_CORRECTION" },
};

export const SOAP_OPTIONS = {
  treatmentDeterminedBy: ["Radiograph(s)", "Visual Exam", "Dental Exam", "Symptoms"],
  reasonForGA: ["Mental/Physical Disability", "Previous Attempts Failed", "Immature Cognitive Functioning (Age)", "Extensive Multi-Quadrant Treatment", "Acute Emergency Condition"],
  previousTreatment: ["Nitrous Oxide", "Local Anesthesia", "Oral Sedation", "IV Sedation", "Behavior Management"],
  franklScale: [
    { val: "1", label: "1 - Definitely Negative", desc: "Refusal, forceful crying, fearfulness" },
    { val: "2", label: "2 - Negative", desc: "Reluctant, uncooperative, some negativity" },
    { val: "3", label: "3 - Positive", desc: "Cautious acceptance, willingness to comply" },
    { val: "4", label: "4 - Definitely Positive", desc: "Good rapport, interested, cooperative" },
  ],
  previousAttemptsFailed: ["Combative Behavior", "Screaming", "Unable to Open Mouth", "Gagging/Vomiting", "Seizure Risk", "Self-Injurious Behavior"],
  subjective: [
    "Teeth that hurt, hard to chew, eat and sleep",
    "Severe tooth pain with facial swelling, unable to eat for 2+ days",
    "Multiple broken/decayed teeth causing pain and difficulty eating",
    "Parent reports child cries during meals, fever present, unable to sleep",
    "Referred from ER for dental emergency - facial swelling and fever",
    "Child in severe pain, refusing to eat or drink, irritable",
  ],
  objective: [
    "Scared, apprehensive, shy, healthy except for poor oral health with rampant caries",
    "Fearful, combative upon exam, multiple carious teeth with visible decay, halitosis",
    "Uncooperative, crying, multiple teeth with gross caries extending to pulp, fluctuant swelling noted",
    "Febrile (temp 101.8°F), facial asymmetry from swelling, trismus present, limited opening",
    "Anxious, withdrawn, extensive ECC involving 8+ teeth, some with visible abscess formation",
    "Healthy appearing but extremely anxious, rampant caries all quadrants, poor oral hygiene",
  ],
  assessment: [
    "Multiple carious teeth requiring restoration/extraction and space maintenance. Patient is fearful and extremely apprehensive. Cannot cooperate for chair-side treatment.",
    "Extensive ECC with pulpal involvement. Patient's age and behavioral status preclude safe treatment under local anesthesia. GA medically necessary.",
    "Acute dental infection with cellulitis. Emergency GA required - infection spreading, risk of airway compromise if treatment delayed.",
    "Traumatic dental injury with displacement. Immediate surgical intervention under GA required for repositioning and stabilization.",
    "Severe dental disease requiring comprehensive oral rehabilitation. Multiple failed attempts at in-office treatment. GA is the only viable treatment option.",
  ],
  plan: [
    "Pulp/SSC, extractions, and restorations as indicated per treatment plan. GA required due to fear & extensive care needed.",
    "Emergency extraction and I&D under GA. Antibiotics started. Follow-up in 24 hours.",
    "Comprehensive oral rehabilitation under GA: SSCs, pulpotomies, composites, extractions per tx plan. Fixed space maintainers as needed.",
    "Surgical repositioning and splinting under GA. Post-op antibiotics and follow-up in 1 week.",
  ],
  emergencyCert: [
    "EMERGENCY - TAR WAIVED PER TITLE 22, CCR SECTION 51056(b). Patient presents with acute condition requiring immediate treatment. Delay poses risk of infection spread, increased pain, and potential systemic complications.",
    "EMERGENCY - TAR WAIVED PER TITLE 22, CCR SECTION 51056(b). Acute dental infection with facial swelling. Immediate GA intervention required to prevent hospitalization.",
    "EMERGENCY - TAR WAIVED PER TITLE 22, CCR SECTION 51056(b). Traumatic dental injury requiring immediate surgical intervention under GA for airway protection and surgical access.",
  ],
  gaJustification: [
    "GA medically necessary per Denti-Cal MOC: (i) Local anesthesia insufficient for extent of treatment; (ii) Nitrous/sedation failed or contraindicated; (v) Immature cognitive functioning - patient age precludes cooperation.",
    "GA justified per APL 23-028: (i) Local anesthesia alone insufficient; (ii) Minimal sedation failed; (iii) Behavior management exhausted across multiple visits; (iv) Extensive multi-quadrant treatment consolidation reduces cumulative risk.",
    "GA required per DHCS criteria: (i) Local anesthesia ineffective due to acute infection; (ii) Sedation contraindicated due to compromised airway; Emergency conditions supersede standard step therapy requirements.",
  ],
};

export const fmtCurrency = (n: number): string => `$${n.toLocaleString()}`;
