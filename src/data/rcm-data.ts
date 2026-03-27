// ── Multi-Payor Rules Engine ──────────────────────────────────────────

export interface PayorRule {
  id: string;
  name: string;
  type: string;
  preAuthRequired: string[];
  preAuthExempt: string[];
  filingLimitDays: number;
  resubmissionWindowDays: number;
  frequencyLimitations: Record<string, string>;
  feeScheduleNote: string;
  specialClauses: string[];
  avgDaysToPay: number;
  electronicPayerId: string;
}

export const PAYOR_RULES: PayorRule[] = [
  {
    id: "dentical",
    name: "Denti-Cal (Medi-Cal Dental)",
    type: "Medicaid",
    preAuthRequired: ["D7140", "D7210", "D7220", "D7230", "D7240", "D7241", "D2740", "D2750", "D2751", "D2752", "D3310", "D3320", "D3330", "D9220", "D9221", "D9223"],
    preAuthExempt: ["D0120", "D0150", "D0210", "D0220", "D0230", "D1110", "D1120", "D1206", "D1208"],
    filingLimitDays: 365,
    resubmissionWindowDays: 30,
    frequencyLimitations: {
      "D0120": "Once per 6 months",
      "D0210": "Once per 3 years",
      "D1110": "Once per 6 months (age 15+)",
      "D1120": "Once per 6 months (under 15)",
      "D1206": "Once per 6 months (under 19)",
    },
    feeScheduleNote: "State-set fee schedule. Reimbursement typically 40-60% of UCR.",
    specialClauses: [
      "GA/sedation requires separate TAR approval",
      "Orthodontic coverage limited to severe handicapping malocclusion",
      "SRP requires 4mm+ pocketing documented",
    ],
    avgDaysToPay: 45,
    electronicPayerId: "CA-DENTAL-01",
  },
  {
    id: "delta-ppo",
    name: "Delta Dental PPO",
    type: "PPO",
    preAuthRequired: ["D2740", "D2750", "D2751", "D2752", "D2790", "D2799", "D5110", "D5120", "D5130", "D5140", "D7210", "D7220"],
    preAuthExempt: ["D0120", "D0150", "D0210", "D0220", "D1110", "D1120", "D1206", "D1208", "D1351", "D2140", "D2150", "D2160", "D2161"],
    filingLimitDays: 90,
    resubmissionWindowDays: 60,
    frequencyLimitations: {
      "D0120": "2 per calendar year",
      "D0210": "Once per 3 years",
      "D0274": "4 BWX per calendar year",
      "D1110": "2 per calendar year",
      "D2750": "Once per 5 years per tooth",
    },
    feeScheduleNote: "PPO contracted rates. Premier providers may balance bill up to MAC.",
    specialClauses: [
      "Alternate benefit clause: composite on posterior may downgrade to amalgam",
      "Implant coverage varies by employer group",
      "Missing tooth clause: 12-month lookback",
    ],
    avgDaysToPay: 21,
    electronicPayerId: "DELTA-060971",
  },
  {
    id: "cigna-dppo",
    name: "Cigna DPPO",
    type: "PPO",
    preAuthRequired: ["D2740", "D2750", "D5110", "D5120", "D7210", "D7220", "D7230", "D7240"],
    preAuthExempt: ["D0120", "D0150", "D1110", "D1120", "D2140", "D2150"],
    filingLimitDays: 365,
    resubmissionWindowDays: 90,
    frequencyLimitations: {
      "D0120": "2 per benefit year",
      "D0210": "Once per 3 years",
      "D1110": "2 per benefit year",
      "D2750": "Once per 5 years per tooth",
      "D2950": "Once per 5 years per tooth",
    },
    feeScheduleNote: "Cigna negotiated rates. Out-of-network paid at 80th percentile R&C.",
    specialClauses: [
      "Alternate benefit clause applies to crowns and bridges",
      "Waiting period: 6 months for major, 12 months for ortho (new groups)",
      "Annual max typically $1,500–$2,500",
    ],
    avgDaysToPay: 18,
    electronicPayerId: "CIGNA-062308",
  },
  {
    id: "metlife",
    name: "MetLife PDP Plus",
    type: "PPO",
    preAuthRequired: ["D2740", "D2750", "D5110", "D5120", "D5130", "D5140", "D7210"],
    preAuthExempt: ["D0120", "D0150", "D0210", "D1110", "D1120", "D2140", "D2150", "D2160"],
    filingLimitDays: 365,
    resubmissionWindowDays: 90,
    frequencyLimitations: {
      "D0120": "2 per calendar year",
      "D0210": "Once per 5 years",
      "D1110": "2 per calendar year",
      "D2750": "Once per 5 years per tooth",
    },
    feeScheduleNote: "PDP Plus negotiated fee schedule. In-network savings avg 30%.",
    specialClauses: [
      "Missing tooth clause: tooth must have been present when coverage began",
      "Annual max $1,000–$2,500 depending on employer plan",
      "Orthodontic lifetime max typically $1,500 (dependents under 19)",
    ],
    avgDaysToPay: 14,
    electronicPayerId: "METLIFE-065978",
  },
  {
    id: "generic",
    name: "Other / Out-of-Network",
    type: "Indemnity",
    preAuthRequired: ["D2740", "D2750", "D5110", "D5120"],
    preAuthExempt: ["D0120", "D0150", "D1110", "D1120"],
    filingLimitDays: 365,
    resubmissionWindowDays: 90,
    frequencyLimitations: {
      "D0120": "2 per year",
      "D1110": "2 per year",
    },
    feeScheduleNote: "Reimbursed at UCR or plan schedule of allowances.",
    specialClauses: ["Verify specific plan details with carrier"],
    avgDaysToPay: 30,
    electronicPayerId: "GENERIC",
  },
];

// ── CDT Code Catalog (subset) ────────────────────────────────────────

export interface CDTCode {
  code: string;
  category: string;
  description: string;
  avgFee: number;
  ageRestriction?: string;
  bundlingConflicts?: string[];
}

export const CDT_CODES: CDTCode[] = [
  { code: "D0120", category: "Diagnostic", description: "Periodic oral evaluation", avgFee: 52, bundlingConflicts: ["D0150"] },
  { code: "D0150", category: "Diagnostic", description: "Comprehensive oral evaluation", avgFee: 82, bundlingConflicts: ["D0120"] },
  { code: "D0210", category: "Diagnostic", description: "Intraoral complete series", avgFee: 142 },
  { code: "D0220", category: "Diagnostic", description: "Intraoral periapical first image", avgFee: 32 },
  { code: "D0230", category: "Diagnostic", description: "Intraoral periapical each additional", avgFee: 27 },
  { code: "D0274", category: "Diagnostic", description: "Bitewings — four images", avgFee: 64 },
  { code: "D1110", category: "Preventive", description: "Prophylaxis — adult", avgFee: 102, ageRestriction: "15+" },
  { code: "D1120", category: "Preventive", description: "Prophylaxis — child", avgFee: 72, ageRestriction: "Under 15" },
  { code: "D1206", category: "Preventive", description: "Topical fluoride varnish", avgFee: 38, ageRestriction: "Under 19" },
  { code: "D1208", category: "Preventive", description: "Topical fluoride (excl. varnish)", avgFee: 34 },
  { code: "D1351", category: "Preventive", description: "Sealant — per tooth", avgFee: 48, ageRestriction: "Under 16" },
  { code: "D2140", category: "Restorative", description: "Amalgam — one surface, primary", avgFee: 145 },
  { code: "D2150", category: "Restorative", description: "Amalgam — two surfaces, primary", avgFee: 178 },
  { code: "D2160", category: "Restorative", description: "Amalgam — three surfaces, primary", avgFee: 215 },
  { code: "D2161", category: "Restorative", description: "Amalgam — four+ surfaces, primary", avgFee: 260 },
  { code: "D2330", category: "Restorative", description: "Resin composite — one surface, anterior", avgFee: 172 },
  { code: "D2331", category: "Restorative", description: "Resin composite — two surfaces, anterior", avgFee: 218 },
  { code: "D2740", category: "Prosthodontics", description: "Crown — porcelain/ceramic", avgFee: 1150 },
  { code: "D2750", category: "Prosthodontics", description: "Crown — porcelain fused to high noble", avgFee: 1200 },
  { code: "D2751", category: "Prosthodontics", description: "Crown — porcelain fused to base metal", avgFee: 1050 },
  { code: "D2790", category: "Prosthodontics", description: "Crown — full cast high noble", avgFee: 1180 },
  { code: "D2950", category: "Restorative", description: "Core buildup, including any pins", avgFee: 285 },
  { code: "D3310", category: "Endodontics", description: "Root canal — anterior", avgFee: 820 },
  { code: "D3320", category: "Endodontics", description: "Root canal — premolar", avgFee: 945 },
  { code: "D3330", category: "Endodontics", description: "Root canal — molar", avgFee: 1120 },
  { code: "D5110", category: "Prosthodontics", description: "Complete denture — maxillary", avgFee: 1850 },
  { code: "D5120", category: "Prosthodontics", description: "Complete denture — mandibular", avgFee: 1850 },
  { code: "D7140", category: "Oral Surgery", description: "Extraction, erupted tooth", avgFee: 185 },
  { code: "D7210", category: "Oral Surgery", description: "Extraction, surgical", avgFee: 325 },
  { code: "D7220", category: "Oral Surgery", description: "Impacted tooth — soft tissue", avgFee: 385 },
  { code: "D7230", category: "Oral Surgery", description: "Impacted tooth — partial bony", avgFee: 465 },
  { code: "D7240", category: "Oral Surgery", description: "Impacted tooth — complete bony", avgFee: 545 },
  { code: "D9220", category: "Anesthesia", description: "Deep sedation/general anesthesia — first 15 min", avgFee: 280 },
  { code: "D9221", category: "Anesthesia", description: "Deep sedation/GA — each additional 15 min", avgFee: 195 },
  { code: "D9223", category: "Anesthesia", description: "Deep sedation/GA — each additional 30 min", avgFee: 350 },
];

// ── Mock Patients for Demo ───────────────────────────────────────────

export interface MockPatient {
  id: string;
  name: string;
  dob: string;
  memberId: string;
  payorId: string;
  groupNumber: string;
  annualMaxUsed: number;
  annualMax: number;
  lastVisit: string;
  coverageStatus: "active" | "inactive" | "pending";
}

export const MOCK_PATIENTS: MockPatient[] = [
  { id: "PT-1001", name: "Sofia Ramirez", dob: "2017-03-14", memberId: "MC-887421", payorId: "dentical", groupNumber: "N/A", annualMaxUsed: 0, annualMax: 99999, lastVisit: "2025-11-20", coverageStatus: "active" },
  { id: "PT-1002", name: "Ethan Nguyen", dob: "2015-06-22", memberId: "DD-554812", payorId: "delta-ppo", groupNumber: "GRP-44210", annualMaxUsed: 820, annualMax: 2000, lastVisit: "2026-01-08", coverageStatus: "active" },
  { id: "PT-1003", name: "Aaliyah Washington", dob: "2019-09-01", memberId: "CIG-221847", payorId: "cigna-dppo", groupNumber: "GRP-88120", annualMaxUsed: 152, annualMax: 1500, lastVisit: "2026-02-14", coverageStatus: "active" },
  { id: "PT-1004", name: "Liam Chen-Martinez", dob: "2012-12-05", memberId: "ML-993217", payorId: "metlife", groupNumber: "GRP-55021", annualMaxUsed: 1340, annualMax: 2500, lastVisit: "2025-10-30", coverageStatus: "active" },
  { id: "PT-1005", name: "Zara Okafor", dob: "2020-01-18", memberId: "MC-662190", payorId: "dentical", groupNumber: "N/A", annualMaxUsed: 0, annualMax: 99999, lastVisit: "2026-03-01", coverageStatus: "pending" },
];

// ── Mock Treatment Plans ─────────────────────────────────────────────

export interface TreatmentPlanItem {
  tooth: string;
  cdtCode: string;
  description: string;
  fee: number;
  hasError?: boolean;
  errorMsg?: string;
  suggestedCode?: string;
}

export interface MockTreatmentPlan {
  patientId: string;
  items: TreatmentPlanItem[];
}

export const MOCK_TREATMENT_PLANS: MockTreatmentPlan[] = [
  {
    patientId: "PT-1001",
    items: [
      { tooth: "A", cdtCode: "D2140", description: "Amalgam — one surface", fee: 145 },
      { tooth: "B", cdtCode: "D2330", description: "Resin composite — one surface", fee: 172 },
      { tooth: "T", cdtCode: "D7140", description: "Extraction, erupted", fee: 185 },
      { tooth: "--", cdtCode: "D1110", description: "Prophylaxis — adult", fee: 102, hasError: true, errorMsg: "Patient age 8 — should use D1120 (child prophy)", suggestedCode: "D1120" },
      { tooth: "--", cdtCode: "D0120", description: "Periodic oral evaluation", fee: 52 },
    ],
  },
  {
    patientId: "PT-1002",
    items: [
      { tooth: "#3", cdtCode: "D2750", description: "Crown — PFM high noble", fee: 1200 },
      { tooth: "#3", cdtCode: "D2950", description: "Core buildup", fee: 285 },
      { tooth: "#3", cdtCode: "D3330", description: "Root canal — molar", fee: 1120 },
      { tooth: "--", cdtCode: "D0120", description: "Periodic oral evaluation", fee: 52 },
      { tooth: "--", cdtCode: "D0274", description: "Bitewings — four images", fee: 64 },
    ],
  },
  {
    patientId: "PT-1003",
    items: [
      { tooth: "A", cdtCode: "D1351", description: "Sealant — per tooth", fee: 48 },
      { tooth: "J", cdtCode: "D1351", description: "Sealant — per tooth", fee: 48 },
      { tooth: "--", cdtCode: "D1120", description: "Prophylaxis — child", fee: 72 },
      { tooth: "--", cdtCode: "D1206", description: "Topical fluoride varnish", fee: 38 },
      { tooth: "--", cdtCode: "D0150", description: "Comprehensive oral evaluation", fee: 82, hasError: true, errorMsg: "Bundling conflict: D0150 cannot be billed same day as D0120", suggestedCode: "D0120" },
      { tooth: "--", cdtCode: "D0120", description: "Periodic oral evaluation", fee: 52 },
    ],
  },
];

// ── Mock Pre-Auth Items ──────────────────────────────────────────────

export interface PreAuthItem {
  id: string;
  patientId: string;
  payorId: string;
  cdtCode: string;
  tooth: string;
  status: "pending" | "approved" | "denied" | "not_required";
  submittedDate: string;
  responseDate?: string;
  authNumber?: string;
}

export const MOCK_PREAUTHS: PreAuthItem[] = [
  { id: "PA-001", patientId: "PT-1001", payorId: "dentical", cdtCode: "D7140", tooth: "T", status: "approved", submittedDate: "2026-02-15", responseDate: "2026-02-28", authNumber: "TAR-882210" },
  { id: "PA-002", patientId: "PT-1002", payorId: "delta-ppo", cdtCode: "D2750", tooth: "#3", status: "pending", submittedDate: "2026-03-10" },
  { id: "PA-003", patientId: "PT-1002", payorId: "delta-ppo", cdtCode: "D3330", tooth: "#3", status: "approved", submittedDate: "2026-03-01", responseDate: "2026-03-08", authNumber: "DD-4412087" },
  { id: "PA-004", patientId: "PT-1004", payorId: "metlife", cdtCode: "D2750", tooth: "#19", status: "denied", submittedDate: "2026-02-20", responseDate: "2026-03-05" },
];

// ── Mock Filed Claims ────────────────────────────────────────────────

export interface FiledClaim {
  id: string;
  patientId: string;
  payorId: string;
  cdtCodes: string[];
  totalBilled: number;
  filedDate: string;
  status: "submitted" | "accepted" | "paid" | "denied" | "pending_info";
  trackingId: string;
  paidAmount?: number;
  paidDate?: string;
  eraMatchDate?: string;
  daysToPayment?: number;
}

export const MOCK_FILED_CLAIMS: FiledClaim[] = [
  { id: "FC-001", patientId: "PT-1001", payorId: "dentical", cdtCodes: ["D2140", "D2330", "D0120"], totalBilled: 369, filedDate: "2026-01-15", status: "paid", trackingId: "CLM-2026-00142", paidAmount: 221, paidDate: "2026-03-02", eraMatchDate: "2026-03-02", daysToPayment: 46 },
  { id: "FC-002", patientId: "PT-1002", payorId: "delta-ppo", cdtCodes: ["D3330", "D0120", "D0274"], totalBilled: 1236, filedDate: "2026-02-20", status: "accepted", trackingId: "CLM-2026-00287" },
  { id: "FC-003", patientId: "PT-1003", payorId: "cigna-dppo", cdtCodes: ["D1351", "D1351", "D1120", "D1206"], totalBilled: 206, filedDate: "2026-03-01", status: "paid", trackingId: "CLM-2026-00310", paidAmount: 185, paidDate: "2026-03-15", eraMatchDate: "2026-03-15", daysToPayment: 14 },
  { id: "FC-004", patientId: "PT-1004", payorId: "metlife", cdtCodes: ["D2750", "D2950"], totalBilled: 1485, filedDate: "2026-02-10", status: "denied", trackingId: "CLM-2026-00198" },
  { id: "FC-005", patientId: "PT-1005", payorId: "dentical", cdtCodes: ["D1120", "D1206", "D0120"], totalBilled: 162, filedDate: "2026-03-05", status: "submitted", trackingId: "CLM-2026-00341" },
];

// ── Payment Options ──────────────────────────────────────────────────

export interface PaymentOption {
  id: string;
  name: string;
  type: "full" | "financing";
  description: string;
  terms?: string;
  apr?: string;
}

export const PAYMENT_OPTIONS: PaymentOption[] = [
  { id: "full", name: "Pay in Full", type: "full", description: "Single payment at time of service" },
  { id: "cherry", name: "Cherry", type: "financing", description: "Patient financing — 0% APR options available", terms: "3–24 months", apr: "0–24.99%" },
  { id: "alphaeon", name: "Alphaeon Credit", type: "financing", description: "Healthcare credit card with promotional financing", terms: "6–24 months", apr: "0–26.99%" },
  { id: "sunbit", name: "Sunbit", type: "financing", description: "Buy now, pay later — approves 90% of patients", terms: "3–72 months", apr: "0–35.99%" },
  { id: "carecredit", name: "CareCredit", type: "financing", description: "Industry-standard healthcare financing", terms: "6–60 months", apr: "0–26.99%" },
];

// ── Helpers ───────────────────────────────────────────────────────────

export const getPayor = (id: string): PayorRule =>
  PAYOR_RULES.find((p) => p.id === id) || PAYOR_RULES[PAYOR_RULES.length - 1];

export const getCDT = (code: string): CDTCode | undefined =>
  CDT_CODES.find((c) => c.code === code);

export const fmtUSD = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
