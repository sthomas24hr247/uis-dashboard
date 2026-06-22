// Canadian Claims Knowledge Base — CDCP / ODA Ontario
// Source: CDCP Program Guide 2024, ODA Fee Guide 2026

export const ODA_FEES: Record<string, { desc: string; fee: number; authRequired: boolean; notes: string }> = {
  "11001": { desc: "Comprehensive Oral Examination",          fee: 98.00,  authRequired: false, notes: "Required before predetermination submission" },
  "11101": { desc: "Limited Oral Examination",                fee: 52.00,  authRequired: false, notes: "Emergency presentation" },
  "72114": { desc: "Full Mouth Radiographs",                  fee: 145.00, authRequired: false, notes: "Required for GA predetermination" },
  "93111": { desc: "General Anaesthesia - First 30 min",      fee: 312.00, authRequired: true,  notes: "Predetermination required. CDCP Program Guide Section 4.2" },
  "93121": { desc: "General Anaesthesia - Each Addl 15 min",  fee: 156.00, authRequired: true,  notes: "Billed in addition to 93111; 15-min increments" },
  "93211": { desc: "IV Sedation - First 30 min",              fee: 208.00, authRequired: true,  notes: "Predetermination required for CDCP patients" },
  "93221": { desc: "IV Sedation - Each Addl 15 min",          fee: 104.00, authRequired: true,  notes: "Billed in addition to 93211" },
  "71201": { desc: "Extraction - Erupted Tooth",              fee: 89.00,  authRequired: false, notes: "No predetermination if clearly non-restorable" },
  "27201": { desc: "Amalgam - 1 Surface, Primary",            fee: 112.00, authRequired: false, notes: "Most common restorative under CDCP" },
  "27211": { desc: "Amalgam - 2 Surfaces, Primary",           fee: 142.00, authRequired: false, notes: "" },
  "23401": { desc: "Composite - 1 Surface, Anterior",         fee: 134.00, authRequired: false, notes: "" },
};

export const CDCP_STEP_THERAPY = [
  { step: 1, method: "Tell-Show-Do Behaviour Guidance",           code: "N/A",   authRequired: false, autoAge: "All ages", advanceCriteria: "Attempted minimum 1 visit; document outcome" },
  { step: 2, method: "Nitrous Oxide/Oxygen Inhalation Sedation",  code: "93311", authRequired: false, autoAge: "None",     advanceCriteria: "Failed or medically contraindicated; document reason" },
  { step: 3, method: "Oral Sedation",                             code: "93411", authRequired: true,  autoAge: "None",     advanceCriteria: "Failed or contraindicated; specialist letter recommended" },
  { step: 4, method: "Intravenous Sedation",                      code: "93211", authRequired: true,  autoAge: "None",     advanceCriteria: "Failed or not clinically appropriate for case complexity" },
  { step: 5, method: "General Anaesthesia (93111/93121)",         code: "93111", authRequired: true,  autoAge: "None",     advanceCriteria: "All lower levels failed or not clinically feasible" },
];

export const CDCP_GA_CRITERIA = {
  required: [
    { id: "ca-i",  label: "Age/Developmental Stage",     desc: "Patient unable to cooperate due to young age (typically under 6) or developmental stage" },
    { id: "ca-ii", label: "Behaviour Management Failure", desc: "Conventional behaviour management techniques attempted and documented as unsuccessful" },
  ],
  atLeastOne: [
    { id: "ca-iii", label: "Medical/Physical Condition",   desc: "Physical or medical condition prevents safe treatment under local anaesthesia alone" },
    { id: "ca-iv",  label: "Extent of Treatment Required", desc: "Volume of required treatment necessitates anaesthesia for patient welfare" },
    { id: "ca-v",   label: "Dental Anxiety/Phobia",        desc: "Documented severe dental anxiety or phobia preventing safe and effective treatment" },
    { id: "ca-vi",  label: "Emergency/Acute Infection",    desc: "Acute infection or emergency requiring immediate treatment not achievable awake" },
  ],
};

export const CDCP_DENIAL_CODES: Record<string, { name: string; rootCause: string; action: string; resolutionType: string; estimatedDays: number }> = {
  "CDCP-101": { name: "Predetermination Not Obtained",      rootCause: "GA billed without prior predetermination approval from CDCP or private carrier",             action: "Submit predetermination with full documentation. For emergency cases, attach emergency certification and treat within 24hr rule.",        resolutionType: "PREDETERMINATION",       estimatedDays: 21 },
  "CDCP-102": { name: "Medical Necessity Not Established",  rootCause: "Clinical narrative did not sufficiently establish medical necessity per CDCP Section 4.2.3", action: "Revise narrative to explicitly address criteria (i)+(ii) + at least one of (iii)-(vi). Include behaviour management history with dates.", resolutionType: "APPEAL_WITH_NARRATIVE",  estimatedDays: 30 },
  "CDCP-103": { name: "Step Therapy Not Documented",        rootCause: "No documentation of lower-level sedation attempts prior to GA request",                      action: "Provide clinical records showing nitrous, oral sedation attempts with dates and outcomes. Attach specialist letter if skipping steps.",  resolutionType: "DOCUMENTATION_APPEND",  estimatedDays: 14 },
  "CDCP-104": { name: "ODA Code Invalid/Not Covered",       rootCause: "Procedure code not on CDCP covered services list or incorrect ODA code used",                action: "Verify code against current ODA fee guide and CDCP covered services schedule. Recode if necessary.",                                    resolutionType: "CLAIM_CORRECTION",       estimatedDays: 7  },
  "CDCP-105": { name: "Missing Clinical Documentation",     rootCause: "Anaesthesia record, dental chart, or required attachments not included with submission",     action: "Attach complete anaesthesia record, radiographs, dental chart, and CDCP predetermination form. All documents must accompany claim.",     resolutionType: "DOCUMENTATION_APPEND",  estimatedDays: 10 },
  "CDCP-106": { name: "Income Threshold Not Met",           rootCause: "Patient household income exceeds CDCP eligibility threshold",                                action: "Verify patient CDCP eligibility. Bill patient or alternate insurer if ineligible.",                                                     resolutionType: "ELIGIBILITY_VERIFICATION", estimatedDays: 5 },
  "SL-201":   { name: "Benefit Maximum Exceeded",           rootCause: "Annual benefit maximum for dental services has been reached for this policy year",            action: "Verify remaining benefit balance. Coordinate benefits with secondary carrier. Bill patient for remainder.",                               resolutionType: "BENEFIT_CHECK",          estimatedDays: 5  },
  "SL-202":   { name: "Frequency Limitation",               rootCause: "Procedure performed sooner than allowed by policy frequency limits",                          action: "Check last date of service for same procedure. Provide clinical notes documenting medical necessity for early repeat if applicable.",    resolutionType: "APPEAL_WITH_NARRATIVE",  estimatedDays: 21 },
};

export const CDCP_NARRATIVE_TEMPLATES = {
  preauth_behaviour: `PREDETERMINATION REQUEST - GENERAL ANAESTHESIA
Submitting Provider: [PROVIDER_NAME], [CREDENTIALS]
Patient: [AGE]-year-old [SEX], Date of Birth: [DOB]
CDCP Eligibility: Confirmed - [ELIGIBILITY_NUMBER]
Referring Dentist: [DENTIST_NAME], [CLINIC]
Proposed DOS: [DATE] | Facility: [FACILITY]
ODA Codes Requested: 93111 x[UNITS], 93121 x[UNITS]

CLINICAL JUSTIFICATION - CDCP Program Guide Section 4.2.3

Criterion (i) - Age/Developmental Stage:
Patient is [AGE] years of age and demonstrates developmental behaviour consistent with inability to cooperate with routine dental treatment in a standard clinical setting. Cognitive and emotional maturity is insufficient for safe awake dental care.

Criterion (ii) - Behaviour Management Failure:
The following behaviour management techniques have been attempted and documented without success:
- Tell-Show-Do: Attempted [DATE] - patient exhibited [BEHAVIOUR_DESCRIPTION]
- Nitrous oxide/oxygen inhalation: Attempted [DATE] - [OUTCOME]
- Oral sedation: [ATTEMPTED/CONTRAINDICATED] - [OUTCOME/REASON]

Criterion [iii/iv/v/vi] - [SELECT APPLICABLE]:
[DESCRIBE_ADDITIONAL_CRITERION]

TREATMENT REQUIRED:
The following procedures are clinically necessary and cannot safely be deferred:
[PROCEDURES_LIST]
Estimated GA time: [DURATION] minutes.

The patient's dental condition, age, and demonstrated inability to cooperate with conventional behaviour management techniques make general anaesthesia the only clinically appropriate method of delivering necessary dental care.

Respectfully submitted,
[PROVIDER_NAME], [CREDENTIALS]
[DATE]`,

  preauth_medical: `PREDETERMINATION REQUEST - GENERAL ANAESTHESIA (MEDICAL CONDITION)
Submitting Provider: [PROVIDER_NAME], [CREDENTIALS]
Patient: [AGE]-year-old [SEX]
CDCP Eligibility: Confirmed - [ELIGIBILITY_NUMBER]
Proposed DOS: [DATE] | Facility: [FACILITY]
ODA Codes Requested: 93111 x[UNITS], 93121 x[UNITS]

CLINICAL JUSTIFICATION - CDCP Program Guide Section 4.2.3(iii)

Medical History:
Patient presents with [DIAGNOSIS/ICD-10 CODE], which precludes safe dental treatment under local anaesthesia alone due to [SPECIFIC_REASON]. Attending physician letter attached confirming diagnosis and recommendation for GA.

Behaviour Management:
Standard behaviour management techniques are not applicable due to the patient's medical condition. [ELABORATE_AS_NEEDED]

Required Treatment:
[PROCEDURES_LIST]
All procedures are clinically urgent and cannot be safely deferred without risk of further deterioration.

Treatment rendered under general anaesthesia administered by [ANAESTHESIOLOGIST, CREDENTIALS]. ODA 93111 x[UNITS] + 93121 x[UNITS]. Patient discharged in stable condition.

[PROVIDER_NAME], [CREDENTIALS] | [DATE]`,

  emergency_acute: `EMERGENCY GENERAL ANAESTHESIA - POST-TREATMENT CLAIM
Provider: [PROVIDER_NAME], [CREDENTIALS]
Patient: [AGE]-year-old [SEX] | DOS: [DATE] | Facility: [FACILITY]
CDCP Eligibility: [ELIGIBILITY_NUMBER]
ODA Codes: 93111 x[UNITS], 93121 x[UNITS]

EMERGENCY CERTIFICATION (CDCP Program Guide Section 4.2.5 - Emergency Exception)

Patient presented with acute [INFECTION/ABSCESS/TRAUMA] requiring immediate surgical intervention. Predetermination was not obtainable prior to treatment due to the acute nature of the presentation. Emergency treatment was performed within [TIMEFRAME] of presentation.

Clinical Findings:
[DESCRIBE_ACUTE_PRESENTATION - swelling, fever, inability to open mouth, etc.]

Reason General Anaesthesia Was Required:
Patient was unable to cooperate with local anaesthesia alone due to [PAIN/ANXIETY/AGE/MEDICAL_CONDITION]. GA was the only safe method of delivering emergency care.

Treatment Performed:
[PROCEDURES_LIST]
Total anaesthesia time: [DURATION] minutes.

Post-operative status: Patient discharged in stable condition with [FOLLOW_UP_INSTRUCTIONS].

[PROVIDER_NAME], [CREDENTIALS] | [DATE]`,
};

export const CA_PAYERS = [
  "CDCP (Canadian Dental Care Plan)",
  "Sun Life Financial",
  "Canada Life",
  "Manulife",
  "Blue Cross Ontario",
  "Desjardins",
  "Pacific Blue Cross",
  "Blue Cross Alberta",
];


