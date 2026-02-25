import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Shield, Search, CheckCircle2, AlertTriangle, Clock,
  DollarSign, FileText, RefreshCw, ChevronRight, X, Zap,
  Calendar, Users, CreditCard, Activity, TrendingUp, Info,
  Phone, Mail, Send, Filter, MoreHorizontal, ExternalLink,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// INSURANCE VERIFICATION PAGE
// Architecture: Demo data now, clearinghouse API (270/271 EDI) later
// Clearinghouse options: DentalXChange, Vyne Dental, Availity, Tesia
// ═══════════════════════════════════════════════════════════════════════════════

const API_URL = import.meta.env.VITE_API_URL || 'https://api.uishealth.com/graphql';

// ── Types ────────────────────────────────────────────────────────────────────

interface InsurancePlan {
  planId: string;
  carrier: string;
  planName: string;
  groupNumber: string;
  memberId: string;
  subscriberName: string;
  relationship: 'self' | 'spouse' | 'child' | 'other';
  effectiveDate: string;
  terminationDate?: string;
  planType: 'PPO' | 'HMO' | 'DHMO' | 'Indemnity' | 'Discount';
}

interface BenefitSummary {
  annualMax: number;
  annualUsed: number;
  annualRemaining: number;
  deductible: number;
  deductibleMet: number;
  deductibleRemaining: number;
  orthoMax?: number;
  orthoUsed?: number;
  planYear: string; // 'calendar' | 'fiscal'
  planYearStart: string;
  planYearEnd: string;
  waitingPeriods: { category: string; months: number; met: boolean }[];
}

interface CoverageTier {
  category: string;
  coveragePercent: number;
  patientPercent: number;
  notes: string;
  examples: string[];
}

interface CDTCoverage {
  cdtCode: string;
  description: string;
  category: string;
  coveragePercent: number;
  avgFee: number;
  insurancePays: number;
  patientPays: number;
  frequency: string;
  lastPerformed?: string;
  eligible: boolean;
  eligibilityNote: string;
}

interface PatientInsurance {
  patientId: string;
  firstName: string;
  lastName: string;
  plan: InsurancePlan;
  benefits: BenefitSummary;
  tiers: CoverageTier[];
  verificationStatus: 'verified' | 'pending' | 'expired' | 'not_verified';
  lastVerified?: string;
  nextAppointment?: string;
}

// ── Claims Types ─────────────────────────────────────────────────────────────

type ClaimStatus = 'pending' | 'paid' | 'denied' | 'appeal' | 'in_review';

interface Claim {
  claimId: string;
  patientId: string;
  patientName: string;
  procedure: string;
  cdtCode: string;
  amountBilled: number;
  amountPaid: number;
  carrier: string;
  dateSubmitted: string;
  expectedResponseDate: string;
  datePaid?: string;
  daysSinceSubmission: number;
  status: ClaimStatus;
  claimNumber: string;
  notes?: string;
  followUpCount: number;
}

function generateDemoClaims(): Claim[] {
  const today = new Date();
  const daysSince = (d: string) => Math.floor((today.getTime() - new Date(d).getTime()) / 86400000);
  return [
    { claimId: 'c1', patientId: '1', patientName: 'Emily Chen', procedure: 'Crown - PFM #14', cdtCode: 'D2750', amountBilled: 1250, amountPaid: 0, carrier: 'Delta Dental', dateSubmitted: '2026-01-28', expectedResponseDate: '2026-02-28', daysSinceSubmission: daysSince('2026-01-28'), status: 'pending', claimNumber: 'DD-2026-00891', followUpCount: 0 },
    { claimId: 'c2', patientId: '2', patientName: 'Robert Brown', procedure: 'SRP - 4 Quadrants', cdtCode: 'D4341', amountBilled: 1140, amountPaid: 912, carrier: 'MetLife', dateSubmitted: '2026-01-10', expectedResponseDate: '2026-02-10', datePaid: '2026-02-08', daysSinceSubmission: daysSince('2026-01-10'), status: 'paid', claimNumber: 'ML-2026-03421', followUpCount: 0 },
    { claimId: 'c3', patientId: '3', patientName: 'Patricia Davis', procedure: 'Root Canal - Molar #19', cdtCode: 'D3330', amountBilled: 1050, amountPaid: 0, carrier: 'Cigna', dateSubmitted: '2025-12-18', expectedResponseDate: '2026-01-18', daysSinceSubmission: daysSince('2025-12-18'), status: 'denied', claimNumber: 'CIG-2025-88234', notes: 'Denied: Missing pre-authorization. Narrative required.', followUpCount: 2 },
    { claimId: 'c4', patientId: '4', patientName: 'John Smith', procedure: 'Composite #30 MOD', cdtCode: 'D2393', amountBilled: 295, amountPaid: 0, carrier: 'Aetna', dateSubmitted: '2026-02-05', expectedResponseDate: '2026-03-05', daysSinceSubmission: daysSince('2026-02-05'), status: 'in_review', claimNumber: 'AET-2026-11092', followUpCount: 0 },
    { claimId: 'c5', patientId: '5', patientName: 'Maria Garcia', procedure: 'Crown - Ceramic #3', cdtCode: 'D2740', amountBilled: 1350, amountPaid: 0, carrier: 'Guardian', dateSubmitted: '2025-12-30', expectedResponseDate: '2026-01-30', daysSinceSubmission: daysSince('2025-12-30'), status: 'appeal', claimNumber: 'GRD-2025-90445', notes: 'Appeal submitted 2/10. Awaiting secondary review.', followUpCount: 3 },
    { claimId: 'c6', patientId: '6', patientName: 'James Wilson', procedure: 'Extraction #1', cdtCode: 'D7140', amountBilled: 195, amountPaid: 156, carrier: 'UnitedHealthcare', dateSubmitted: '2026-01-22', expectedResponseDate: '2026-02-22', datePaid: '2026-02-20', daysSinceSubmission: daysSince('2026-01-22'), status: 'paid', claimNumber: 'UHC-2026-05567', followUpCount: 0 },
    { claimId: 'c7', patientId: '1', patientName: 'Emily Chen', procedure: 'Prophylaxis Adult', cdtCode: 'D1110', amountBilled: 110, amountPaid: 110, carrier: 'Delta Dental', dateSubmitted: '2026-02-01', expectedResponseDate: '2026-03-01', datePaid: '2026-02-15', daysSinceSubmission: daysSince('2026-02-01'), status: 'paid', claimNumber: 'DD-2026-01023', followUpCount: 0 },
    { claimId: 'c8', patientId: '3', patientName: 'Patricia Davis', procedure: 'Bitewings - 4 Films', cdtCode: 'D0274', amountBilled: 72, amountPaid: 0, carrier: 'Cigna', dateSubmitted: '2026-01-05', expectedResponseDate: '2026-02-05', daysSinceSubmission: daysSince('2026-01-05'), status: 'pending', claimNumber: 'CIG-2026-00102', notes: 'Past expected response date. Follow up required.', followUpCount: 1 },
    { claimId: 'c9', patientId: '2', patientName: 'Robert Brown', procedure: 'Periodic Eval', cdtCode: 'D0120', amountBilled: 55, amountPaid: 0, carrier: 'MetLife', dateSubmitted: '2026-02-18', expectedResponseDate: '2026-03-18', daysSinceSubmission: daysSince('2026-02-18'), status: 'pending', claimNumber: 'ML-2026-04102', followUpCount: 0 },
    { claimId: 'c10', patientId: '5', patientName: 'Maria Garcia', procedure: 'Amalgam #12 MO', cdtCode: 'D2150', amountBilled: 195, amountPaid: 0, carrier: 'Guardian', dateSubmitted: '2025-12-12', expectedResponseDate: '2026-01-12', daysSinceSubmission: daysSince('2025-12-12'), status: 'denied', claimNumber: 'GRD-2025-88901', notes: 'Denied: Downcoded to D2140 single surface. Difference billed to patient.', followUpCount: 1 },
  ];
}


// ── Demo Data ────────────────────────────────────────────────────────────────

function generatePatientInsurance(): PatientInsurance[] {
  return [
    {
      patientId: '1', firstName: 'Emily', lastName: 'Chen',
      plan: { planId: 'p1', carrier: 'Delta Dental', planName: 'PPO Premier', groupNumber: 'GRP-44521', memberId: 'DD-889012', subscriberName: 'Emily Chen', relationship: 'self', effectiveDate: '2025-01-01', planType: 'PPO' },
      benefits: { annualMax: 2000, annualUsed: 450, annualRemaining: 1550, deductible: 50, deductibleMet: 50, deductibleRemaining: 0, planYear: 'calendar', planYearStart: '2026-01-01', planYearEnd: '2026-12-31', waitingPeriods: [{ category: 'Major', months: 12, met: true }, { category: 'Ortho', months: 24, met: false }] },
      tiers: [
        { category: 'Preventive (Class I)', coveragePercent: 100, patientPercent: 0, notes: 'No deductible required', examples: ['D0120 Periodic Exam', 'D0274 Bitewings', 'D1110 Prophylaxis', 'D1206 Fluoride'] },
        { category: 'Basic (Class II)', coveragePercent: 80, patientPercent: 20, notes: 'Deductible applies', examples: ['D2140-D2161 Amalgam', 'D2330-D2394 Composite', 'D3220 Pulpotomy', 'D4341 Perio Scaling'] },
        { category: 'Major (Class III)', coveragePercent: 50, patientPercent: 50, notes: 'Deductible applies, 12-month waiting period', examples: ['D2740-D2752 Crown', 'D3310-D3330 Root Canal', 'D5110-D5120 Denture', 'D6240 Pontic'] },
        { category: 'Orthodontic', coveragePercent: 0, patientPercent: 100, notes: 'Not covered under this plan', examples: ['D8080 Braces', 'D8090 Retainers'] },
      ],
      verificationStatus: 'verified', lastVerified: '2026-02-20', nextAppointment: '2026-03-05',
    },
    {
      patientId: '2', firstName: 'Robert', lastName: 'Brown',
      plan: { planId: 'p2', carrier: 'MetLife', planName: 'PDP Plus', groupNumber: 'ML-78934', memberId: 'MLT-556234', subscriberName: 'Robert Brown', relationship: 'self', effectiveDate: '2025-07-01', planType: 'PPO' },
      benefits: { annualMax: 1500, annualUsed: 1320, annualRemaining: 180, deductible: 75, deductibleMet: 75, deductibleRemaining: 0, planYear: 'calendar', planYearStart: '2026-01-01', planYearEnd: '2026-12-31', waitingPeriods: [{ category: 'Major', months: 6, met: true }] },
      tiers: [
        { category: 'Preventive (Class I)', coveragePercent: 100, patientPercent: 0, notes: 'Covered at 100%', examples: ['D0120', 'D0274', 'D1110'] },
        { category: 'Basic (Class II)', coveragePercent: 80, patientPercent: 20, notes: 'After deductible', examples: ['D2140-D2394', 'D4341'] },
        { category: 'Major (Class III)', coveragePercent: 50, patientPercent: 50, notes: 'After deductible', examples: ['D2740-D2752', 'D3310-D3330'] },
      ],
      verificationStatus: 'verified', lastVerified: '2026-02-18', nextAppointment: '2026-02-28',
    },
    {
      patientId: '3', firstName: 'Patricia', lastName: 'Davis',
      plan: { planId: 'p3', carrier: 'Cigna', planName: 'DPPO Advantage', groupNumber: 'CIG-22018', memberId: 'CGN-334891', subscriberName: 'Mark Davis', relationship: 'spouse', effectiveDate: '2024-09-01', planType: 'PPO' },
      benefits: { annualMax: 2500, annualUsed: 800, annualRemaining: 1700, deductible: 50, deductibleMet: 50, deductibleRemaining: 0, orthoMax: 1500, orthoUsed: 0, planYear: 'calendar', planYearStart: '2026-01-01', planYearEnd: '2026-12-31', waitingPeriods: [] },
      tiers: [
        { category: 'Preventive (Class I)', coveragePercent: 100, patientPercent: 0, notes: 'No deductible, no waiting', examples: ['D0120', 'D0274', 'D1110', 'D1206'] },
        { category: 'Basic (Class II)', coveragePercent: 80, patientPercent: 20, notes: 'After deductible', examples: ['D2140-D2394', 'D3220', 'D4341', 'D7140'] },
        { category: 'Major (Class III)', coveragePercent: 60, patientPercent: 40, notes: 'After deductible', examples: ['D2740-D2752', 'D3310-D3330', 'D5110-D5120'] },
        { category: 'Orthodontic', coveragePercent: 50, patientPercent: 50, notes: '$1,500 lifetime max, dependent children to age 19', examples: ['D8080', 'D8090'] },
      ],
      verificationStatus: 'expired', lastVerified: '2025-11-10', nextAppointment: '2026-03-12',
    },
    {
      patientId: '4', firstName: 'John', lastName: 'Smith',
      plan: { planId: 'p4', carrier: 'Aetna', planName: 'DMO', groupNumber: 'AET-90112', memberId: 'AET-778345', subscriberName: 'John Smith', relationship: 'self', effectiveDate: '2025-03-01', planType: 'HMO' },
      benefits: { annualMax: 0, annualUsed: 0, annualRemaining: 0, deductible: 0, deductibleMet: 0, deductibleRemaining: 0, planYear: 'calendar', planYearStart: '2026-01-01', planYearEnd: '2026-12-31', waitingPeriods: [{ category: 'Major', months: 12, met: false }] },
      tiers: [
        { category: 'Preventive', coveragePercent: 100, patientPercent: 0, notes: 'Copay: $0', examples: ['D0120', 'D1110'] },
        { category: 'Basic', coveragePercent: 0, patientPercent: 0, notes: 'Copay: $25-$75 per procedure', examples: ['D2140-D2394'] },
        { category: 'Major', coveragePercent: 0, patientPercent: 0, notes: 'Copay: $150-$400 per procedure. 12-mo waiting period NOT MET.', examples: ['D2740-D2752', 'D3310-D3330'] },
      ],
      verificationStatus: 'verified', lastVerified: '2026-02-22', nextAppointment: '2026-02-25',
    },
    {
      patientId: '5', firstName: 'Maria', lastName: 'Garcia',
      plan: { planId: 'p5', carrier: 'Guardian', planName: 'DentalGuard Preferred', groupNumber: 'GDN-55672', memberId: 'GRD-992134', subscriberName: 'Maria Garcia', relationship: 'self', effectiveDate: '2024-01-01', planType: 'PPO' },
      benefits: { annualMax: 2000, annualUsed: 200, annualRemaining: 1800, deductible: 50, deductibleMet: 0, deductibleRemaining: 50, planYear: 'calendar', planYearStart: '2026-01-01', planYearEnd: '2026-12-31', waitingPeriods: [] },
      tiers: [
        { category: 'Preventive (Class I)', coveragePercent: 100, patientPercent: 0, notes: 'Deductible waived', examples: ['D0120', 'D0274', 'D1110'] },
        { category: 'Basic (Class II)', coveragePercent: 80, patientPercent: 20, notes: 'After deductible', examples: ['D2140-D2394', 'D4341'] },
        { category: 'Major (Class III)', coveragePercent: 50, patientPercent: 50, notes: 'After deductible', examples: ['D2740', 'D3310-D3330'] },
      ],
      verificationStatus: 'pending', nextAppointment: '2026-03-08',
    },
    {
      patientId: '6', firstName: 'James', lastName: 'Wilson',
      plan: { planId: 'p6', carrier: 'UnitedHealthcare', planName: 'Options PPO 30', groupNumber: 'UHC-81234', memberId: 'UHC-445098', subscriberName: 'James Wilson', relationship: 'self', effectiveDate: '2025-06-01', planType: 'PPO' },
      benefits: { annualMax: 1500, annualUsed: 890, annualRemaining: 610, deductible: 100, deductibleMet: 100, deductibleRemaining: 0, planYear: 'calendar', planYearStart: '2026-01-01', planYearEnd: '2026-12-31', waitingPeriods: [{ category: 'Major', months: 6, met: true }] },
      tiers: [
        { category: 'Preventive (Class I)', coveragePercent: 100, patientPercent: 0, notes: 'Covered in full', examples: ['D0120', 'D0274', 'D1110'] },
        { category: 'Basic (Class II)', coveragePercent: 70, patientPercent: 30, notes: 'After deductible', examples: ['D2140-D2394'] },
        { category: 'Major (Class III)', coveragePercent: 50, patientPercent: 50, notes: 'After deductible', examples: ['D2740', 'D3310'] },
      ],
      verificationStatus: 'verified', lastVerified: '2026-02-15', nextAppointment: '2026-03-20',
    },
  ];
}

function generateCDTLookup(): CDTCoverage[] {
  return [
    { cdtCode: 'D0120', description: 'Periodic Oral Evaluation', category: 'Preventive', coveragePercent: 100, avgFee: 55, insurancePays: 55, patientPays: 0, frequency: '2x per year', eligible: true, eligibilityNote: 'Last performed 8/2025. Next eligible now.' },
    { cdtCode: 'D0274', description: 'Bitewings - Four Films', category: 'Preventive', coveragePercent: 100, avgFee: 72, insurancePays: 72, patientPays: 0, frequency: '1x per year', eligible: true, eligibilityNote: 'Last performed 2/2025. Next eligible now.' },
    { cdtCode: 'D1110', description: 'Prophylaxis - Adult', category: 'Preventive', coveragePercent: 100, avgFee: 110, insurancePays: 110, patientPays: 0, frequency: '2x per year', eligible: true, eligibilityNote: 'Last performed 8/2025. Eligible for cleaning.' },
    { cdtCode: 'D1206', description: 'Topical Fluoride Varnish', category: 'Preventive', coveragePercent: 100, avgFee: 38, insurancePays: 38, patientPays: 0, frequency: '2x per year (under 19)', eligible: false, eligibilityNote: 'Patient age >19. Not covered for adults on this plan.' },
    { cdtCode: 'D2150', description: 'Amalgam - Two Surfaces', category: 'Basic', coveragePercent: 80, avgFee: 195, insurancePays: 156, patientPays: 39, frequency: 'No limit', eligible: true, eligibilityNote: 'Covered after deductible.' },
    { cdtCode: 'D2392', description: 'Resin Composite - Two Surfaces, Posterior', category: 'Basic', coveragePercent: 80, avgFee: 245, insurancePays: 196, patientPays: 49, frequency: 'No limit', eligible: true, eligibilityNote: 'Downgraded to amalgam fee on some plans. Check EOB.' },
    { cdtCode: 'D2750', description: 'Crown - Porcelain Fused to Metal', category: 'Major', coveragePercent: 50, avgFee: 1250, insurancePays: 625, patientPays: 625, frequency: '1x per 5 years per tooth', lastPerformed: '2022-03-15', eligible: true, eligibilityNote: 'Last crown on tooth #14 was 3/2022. Eligible for replacement.' },
    { cdtCode: 'D2740', description: 'Crown - Porcelain/Ceramic', category: 'Major', coveragePercent: 50, avgFee: 1350, insurancePays: 675, patientPays: 675, frequency: '1x per 5 years per tooth', eligible: true, eligibilityNote: 'Covered. Some plans downgrade to PFM fee.' },
    { cdtCode: 'D3330', description: 'Root Canal - Molar', category: 'Major', coveragePercent: 50, avgFee: 1050, insurancePays: 525, patientPays: 525, frequency: '1x per tooth lifetime', eligible: true, eligibilityNote: 'No prior root canal on file for this tooth.' },
    { cdtCode: 'D4341', description: 'Periodontal Scaling & Root Planing - Per Quadrant', category: 'Basic', coveragePercent: 80, avgFee: 285, insurancePays: 228, patientPays: 57, frequency: '1x per quadrant per 2 years', eligible: true, eligibilityNote: 'No prior SRP on file. All 4 quadrants eligible.' },
    { cdtCode: 'D7140', description: 'Extraction - Erupted Tooth', category: 'Basic', coveragePercent: 80, avgFee: 195, insurancePays: 156, patientPays: 39, frequency: 'No limit', eligible: true, eligibilityNote: 'Covered after deductible.' },
    { cdtCode: 'D8080', description: 'Comprehensive Orthodontic Treatment', category: 'Orthodontic', coveragePercent: 0, avgFee: 5500, insurancePays: 0, patientPays: 5500, frequency: '1x lifetime', eligible: false, eligibilityNote: 'Orthodontic coverage not included in this plan.' },
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function VerificationBadge({ status }: { status: string }) {
  const s: Record<string, { bg: string; text: string; label: string }> = {
    verified: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', label: 'VERIFIED' },
    pending: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', label: 'PENDING' },
    expired: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'EXPIRED' },
    not_verified: { bg: 'bg-slate-100 dark:bg-slate-700/50', text: 'text-slate-500 dark:text-slate-400', label: 'NOT VERIFIED' },
  };
  const st = s[status] || s.not_verified;
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>{st.label}</span>;
}

function BenefitMeter({ used, max, label }: { used: number; max: number; label: string }) {
  const pct = max > 0 ? Math.min((used / max) * 100, 100) : 0;
  const remaining = max - used;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-500">{label}</span>
        <span className="font-bold text-slate-900 dark:text-white">${remaining.toLocaleString()} remaining</span>
      </div>
      <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${pct > 85 ? 'bg-red-500' : pct > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
        <span>${used.toLocaleString()} used</span>
        <span>${max.toLocaleString()} max</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PATIENT DETAIL VIEW
// ═══════════════════════════════════════════════════════════════════════════════

function PatientInsuranceDetail({ patient, onBack }: { patient: PatientInsurance; onBack: () => void }) {
  const [cdtSearch, setCdtSearch] = useState('');
  const [cdtResults, setCdtResults] = useState<CDTCoverage[]>([]);
  const [showAllCDT, setShowAllCDT] = useState(false);
  const allCDT = generateCDTLookup();

  const handleCDTSearch = (query: string) => {
    setCdtSearch(query);
    if (query.length >= 1) {
      setCdtResults(allCDT.filter(c => c.cdtCode.toLowerCase().includes(query.toLowerCase()) || c.description.toLowerCase().includes(query.toLowerCase())));
    } else {
      setCdtResults([]);
    }
  };

  const b = patient.benefits;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-teal-600 dark:text-teal-400 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to Insurance Verification
      </button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white text-lg font-bold">
            {patient.firstName[0]}{patient.lastName[0]}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{patient.firstName} {patient.lastName}</h2>
            <p className="text-sm text-slate-500">{patient.plan.carrier} · {patient.plan.planName} · Member: {patient.plan.memberId}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <VerificationBadge status={patient.verificationStatus} />
          <button className="px-3 py-2 text-xs font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Re-verify
          </button>
        </div>
      </div>

      {/* Plan Info + Benefits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plan Details */}
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-teal-400" /> Plan Details</h3>
          <div className="space-y-2 text-xs">
            {[
              ['Carrier', patient.plan.carrier],
              ['Plan', patient.plan.planName],
              ['Type', patient.plan.planType],
              ['Group #', patient.plan.groupNumber],
              ['Member ID', patient.plan.memberId],
              ['Subscriber', patient.plan.subscriberName],
              ['Relationship', patient.plan.relationship],
              ['Effective', patient.plan.effectiveDate],
              ['Plan Year', `${b.planYearStart} – ${b.planYearEnd}`],
            ].map(([label, val], i) => (
              <div key={i} className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-700/30 last:border-0">
                <span className="text-slate-400">{label}</span>
                <span className="font-semibold text-slate-900 dark:text-white capitalize">{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits Remaining */}
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4 text-teal-400" /> Benefits Remaining</h3>
          <div className="space-y-4">
            {b.annualMax > 0 && <BenefitMeter used={b.annualUsed} max={b.annualMax} label="Annual Maximum" />}
            {b.annualMax === 0 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-700 dark:text-blue-400">
                <p className="font-semibold">HMO/DHMO Plan</p>
                <p>No annual maximum — copays per procedure</p>
              </div>
            )}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">Deductible</span>
                <span className={`font-bold ${b.deductibleRemaining === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {b.deductibleRemaining === 0 ? '✓ Met' : `$${b.deductibleRemaining} remaining`}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${b.deductible > 0 ? (b.deductibleMet / b.deductible) * 100 : 100}%` }} />
              </div>
            </div>
            {b.orthoMax !== undefined && (
              <BenefitMeter used={b.orthoUsed || 0} max={b.orthoMax} label="Ortho Lifetime Max" />
            )}
          </div>
        </div>

        {/* Waiting Periods + Alerts */}
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-teal-400" /> Status & Alerts</h3>
          <div className="space-y-3">
            {patient.nextAppointment && (
              <div className="flex items-center gap-2 p-2 bg-teal-50 dark:bg-teal-900/20 rounded-lg text-xs">
                <Calendar className="w-4 h-4 text-teal-500" />
                <span className="text-teal-700 dark:text-teal-400">Next appt: <b>{patient.nextAppointment}</b></span>
              </div>
            )}
            {patient.lastVerified && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Last verified: {patient.lastVerified}
              </div>
            )}
            {b.annualRemaining < 300 && b.annualMax > 0 && (
              <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-xs">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-red-700 dark:text-red-400">Only <b>${b.annualRemaining}</b> remaining — prioritize treatment before year-end</span>
              </div>
            )}
            {b.waitingPeriods.length > 0 && (
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Waiting Periods</p>
                {b.waitingPeriods.map((wp, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs py-1">
                    {wp.met ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <AlertTriangle className="w-3 h-3 text-amber-500" />}
                    <span className={wp.met ? 'text-slate-500' : 'text-amber-600 dark:text-amber-400 font-semibold'}>{wp.category}: {wp.months} months {wp.met ? '(met)' : '(NOT MET)'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Coverage Tiers */}
      <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Shield className="w-4 h-4 text-teal-400" /> Coverage Tiers</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {patient.tiers.map((tier, i) => (
            <div key={i} className={`rounded-xl p-4 border ${tier.coveragePercent >= 80 ? 'border-emerald-200 dark:border-emerald-800/30 bg-emerald-50/50 dark:bg-emerald-900/10' : tier.coveragePercent >= 50 ? 'border-blue-200 dark:border-blue-800/30 bg-blue-50/50 dark:bg-blue-900/10' : tier.coveragePercent > 0 ? 'border-amber-200 dark:border-amber-800/30 bg-amber-50/50 dark:bg-amber-900/10' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30'}`}>
              <p className="text-xs font-semibold text-slate-900 dark:text-white mb-1">{tier.category}</p>
              <p className={`text-2xl font-bold mb-1 ${tier.coveragePercent >= 80 ? 'text-emerald-500' : tier.coveragePercent >= 50 ? 'text-blue-500' : tier.coveragePercent > 0 ? 'text-amber-500' : 'text-slate-400'}`}>{tier.coveragePercent}%</p>
              <p className="text-[10px] text-slate-500 mb-2">{tier.notes}</p>
              <div className="text-[10px] text-slate-400">{tier.examples.join(', ')}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CDT Code Lookup */}
      <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Search className="w-4 h-4 text-teal-400" /> CDT Code Coverage Lookup</h3>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <input value={cdtSearch} onChange={e => handleCDTSearch(e.target.value)}
            placeholder="Search by CDT code or description (e.g., D2750 or crown)..."
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-teal-500" />
        </div>

        {(cdtSearch ? cdtResults : showAllCDT ? allCDT : allCDT.slice(0, 5)).length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-2 text-slate-400 font-semibold">CDT Code</th>
                  <th className="text-left py-2 text-slate-400 font-semibold">Description</th>
                  <th className="text-left py-2 text-slate-400 font-semibold">Category</th>
                  <th className="text-right py-2 text-slate-400 font-semibold">Fee</th>
                  <th className="text-right py-2 text-slate-400 font-semibold">Ins Pays</th>
                  <th className="text-right py-2 text-slate-400 font-semibold">Patient Pays</th>
                  <th className="text-left py-2 text-slate-400 font-semibold">Frequency</th>
                  <th className="text-center py-2 text-slate-400 font-semibold">Eligible</th>
                </tr>
              </thead>
              <tbody>
                {(cdtSearch ? cdtResults : showAllCDT ? allCDT : allCDT.slice(0, 5)).map(c => (
                  <tr key={c.cdtCode} className="border-b border-slate-50 dark:border-slate-700/30 hover:bg-slate-50 dark:hover:bg-slate-700/20">
                    <td className="py-2.5 font-mono font-bold text-teal-600 dark:text-teal-400">{c.cdtCode}</td>
                    <td className="py-2.5 text-slate-900 dark:text-white">{c.description}</td>
                    <td className="py-2.5"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.category === 'Preventive' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : c.category === 'Basic' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : c.category === 'Major' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>{c.category}</span></td>
                    <td className="py-2.5 text-right text-slate-900 dark:text-white">${c.avgFee}</td>
                    <td className="py-2.5 text-right font-semibold text-emerald-600 dark:text-emerald-400">${c.insurancePays}</td>
                    <td className="py-2.5 text-right font-semibold text-red-500">${c.patientPays}</td>
                    <td className="py-2.5 text-slate-500">{c.frequency}</td>
                    <td className="py-2.5 text-center">{c.eligible ? <CheckCircle2 className="w-4 h-4 text-emerald-500 inline" /> : <AlertTriangle className="w-4 h-4 text-red-400 inline" />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!cdtSearch && !showAllCDT && allCDT.length > 5 && (
          <button onClick={() => setShowAllCDT(true)} className="mt-3 text-xs text-teal-500 hover:text-teal-400 font-medium">Show all {allCDT.length} codes →</button>
        )}
      </div>

      {/* Dentamind Insight */}
      <div className="bg-gradient-to-r from-teal-500/10 to-blue-500/10 border border-teal-500/20 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-teal-400" /> Dentamind Insurance Intelligence</h3>
        <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
          {b.annualRemaining < 500 && b.annualMax > 0 && <div className="flex items-start gap-2"><span>⚠️</span><span>Only ${b.annualRemaining} of ${b.annualMax} annual max remaining. Present remaining treatment ASAP to use benefits before {b.planYearEnd}.</span></div>}
          {b.annualRemaining > 1500 && <div className="flex items-start gap-2"><span>💡</span><span>${b.annualRemaining} of benefits unused. Great opportunity to present elective procedures — patient has ample coverage remaining.</span></div>}
          {b.deductibleRemaining > 0 && <div className="flex items-start gap-2"><span>📋</span><span>Deductible not yet met (${b.deductibleRemaining} remaining). First basic/major procedure this year will include the deductible in patient cost.</span></div>}
          {b.waitingPeriods.some(w => !w.met) && <div className="flex items-start gap-2"><span>🚫</span><span>Active waiting period on {b.waitingPeriods.filter(w => !w.met).map(w => w.category).join(', ')} — these services won't be covered until the waiting period expires.</span></div>}
          <div className="flex items-start gap-2"><span>🎯</span><span>When presenting treatment, show patient the exact out-of-pocket cost: "${patient.firstName}, your insurance covers {patient.tiers.find(t => t.category.includes('Major'))?.coveragePercent || 50}% of this crown — your cost would be approximately ${Math.round(1250 * (1 - (patient.tiers.find(t => t.category.includes('Major'))?.coveragePercent || 50) / 100))}."</span></div>
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// CLAIMS TRACKING VIEW
// ═══════════════════════════════════════════════════════════════════════════════

function ClaimStatusBadge({ status }: { status: ClaimStatus }) {
  const styles: Record<ClaimStatus, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', label: 'PENDING' },
    paid: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', label: 'PAID' },
    denied: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'DENIED' },
    appeal: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', label: 'APPEAL' },
    in_review: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'IN REVIEW' },
  };
  const s = styles[status] || styles.pending;
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>{s.label}</span>;
}

function UrgencyIndicator({ days, status }: { days: number; status: ClaimStatus }) {
  if (status === 'paid') return null;
  if (days >= 60) return <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />60+ days</span>;
  if (days >= 45) return <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-500"><span className="w-2 h-2 rounded-full bg-orange-500" />45-60 days</span>;
  if (days >= 30) return <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500"><span className="w-2 h-2 rounded-full bg-amber-500" />30-45 days</span>;
  return <span className="text-[10px] text-slate-400">{days}d</span>;
}

function ClaimsTrackingView() {
  const [claims] = useState<Claim[]>(generateDemoClaims());
  const [claimFilter, setClaimFilter] = useState<'all' | ClaimStatus>('all');
  const [expandedClaim, setExpandedClaim] = useState<string | null>(null);

  const filtered = claims.filter(c => claimFilter === 'all' || c.status === claimFilter);
  const totalBilled = claims.reduce((s, c) => s + c.amountBilled, 0);
  const totalCollected = claims.reduce((s, c) => s + c.amountPaid, 0);
  const totalPending = claims.filter(c => c.status === 'pending' || c.status === 'in_review').reduce((s, c) => s + c.amountBilled, 0);
  const totalDenied = claims.filter(c => c.status === 'denied' || c.status === 'appeal').reduce((s, c) => s + c.amountBilled, 0);
  const needsFollowUp = claims.filter(c => c.status !== 'paid' && c.daysSinceSubmission >= 30).length;

  return (
    <div className="space-y-6">
      {/* Claims KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'TOTAL BILLED', value: `$${(totalBilled / 1000).toFixed(1)}K`, sub: `${claims.length} claims submitted`, icon: FileText, color: 'text-blue-400' },
          { label: 'COLLECTED', value: `$${(totalCollected / 1000).toFixed(1)}K`, sub: `${claims.filter(c => c.status === 'paid').length} claims paid`, icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'PENDING', value: `$${(totalPending / 1000).toFixed(1)}K`, sub: `${claims.filter(c => c.status === 'pending' || c.status === 'in_review').length} awaiting response`, icon: Clock, color: 'text-amber-400' },
          { label: 'DENIED/APPEAL', value: `$${(totalDenied / 1000).toFixed(1)}K`, sub: `${claims.filter(c => c.status === 'denied' || c.status === 'appeal').length} need action`, icon: AlertTriangle, color: 'text-red-400' },
          { label: 'FOLLOW-UP', value: String(needsFollowUp), sub: 'claims past 30 days', icon: Phone, color: needsFollowUp > 0 ? 'text-red-400' : 'text-slate-400' },
        ].map((stat, i) => (
          <div key={i} className={`bg-white dark:bg-slate-800/60 border rounded-xl p-4 ${i === 4 && needsFollowUp > 0 ? 'border-red-500/30 dark:border-red-500/20' : 'border-slate-200 dark:border-slate-700/50'}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">{stat.label}</p>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Follow-Up Alert Banner */}
      {needsFollowUp > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-red-500/20 rounded-lg"><AlertTriangle className="w-5 h-5 text-red-400" /></div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-400">{needsFollowUp} claim{needsFollowUp > 1 ? 's' : ''} require follow-up</p>
            <p className="text-xs text-slate-400 mt-0.5">Claims past 30 days without resolution should be followed up with the carrier</p>
          </div>
          <button className="px-3 py-1.5 bg-red-500/20 text-red-400 text-xs font-semibold rounded-lg hover:bg-red-500/30 transition-colors">View Overdue</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-400">Status:</span>
        {(['all', 'pending', 'in_review', 'paid', 'denied', 'appeal'] as const).map(s => {
          const count = s === 'all' ? claims.length : claims.filter(c => c.status === s).length;
          return (
            <button key={s} onClick={() => setClaimFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-all ${claimFilter === s ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-white hover:bg-slate-600'}`}>
              {s === 'all' ? 'All' : s === 'in_review' ? 'In Review' : s} <span className="ml-1 opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Claims Table */}
      <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/30 text-slate-400 text-[10px] uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-semibold">Patient</th>
                <th className="text-left px-4 py-3 font-semibold">Procedure</th>
                <th className="text-left px-4 py-3 font-semibold">Carrier</th>
                <th className="text-right px-4 py-3 font-semibold">Billed</th>
                <th className="text-right px-4 py-3 font-semibold">Paid</th>
                <th className="text-left px-4 py-3 font-semibold">Submitted</th>
                <th className="text-center px-4 py-3 font-semibold">Age</th>
                <th className="text-center px-4 py-3 font-semibold">Status</th>
                <th className="text-center px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30">
              {filtered.map(c => (
                <tr key={c.claimId}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors ${c.status === 'denied' ? 'bg-red-50/50 dark:bg-red-900/5' : ''}`}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900 dark:text-white">{c.patientName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{c.claimNumber}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-900 dark:text-white">{c.procedure}</p>
                    <p className="text-[10px] text-teal-500 font-mono">{c.cdtCode}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{c.carrier}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white">${c.amountBilled.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {c.amountPaid > 0 ? (
                      <span className="text-emerald-500">${c.amountPaid.toLocaleString()}</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{new Date(c.dateSubmitted).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                  <td className="px-4 py-3 text-center"><UrgencyIndicator days={c.daysSinceSubmission} status={c.status} /></td>
                  <td className="px-4 py-3 text-center"><ClaimStatusBadge status={c.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      {c.status === 'pending' && c.daysSinceSubmission >= 30 && (
                        <button className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors" title="Follow Up">
                          <Phone className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {c.status === 'denied' && (
                        <button className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 transition-colors" title="Submit Appeal">
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {(c.status === 'pending' || c.status === 'in_review') && (
                        <button className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors" title="Mark Paid">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {c.status !== 'paid' && (
                        <button className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors" title="Contact Insurance">
                          <Mail className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button onClick={() => setExpandedClaim(expandedClaim === c.claimId ? null : c.claimId)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-white hover:bg-slate-500 transition-colors" title="Details">
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {/* Expanded detail row */}
                    {expandedClaim === c.claimId && (
                      <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg text-left space-y-1.5">
                        <p className="text-[10px] text-slate-400">Claim #: <span className="text-slate-600 dark:text-slate-300 font-mono">{c.claimNumber}</span></p>
                        <p className="text-[10px] text-slate-400">Submitted: <span className="text-slate-600 dark:text-slate-300">{c.dateSubmitted}</span></p>
                        <p className="text-[10px] text-slate-400">Expected: <span className="text-slate-600 dark:text-slate-300">{c.expectedResponseDate}</span></p>
                        {c.datePaid && <p className="text-[10px] text-slate-400">Paid: <span className="text-emerald-500 font-semibold">{c.datePaid}</span></p>}
                        <p className="text-[10px] text-slate-400">Follow-ups: <span className="text-slate-600 dark:text-slate-300">{c.followUpCount}</span></p>
                        {c.notes && <p className="text-[10px] text-amber-400 font-medium mt-1">{c.notes}</p>}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dentamind Claims Intelligence */}
      <div className="bg-gradient-to-r from-teal-500/10 to-blue-500/10 border border-teal-500/20 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-teal-400" /> Dentamind Claims Intelligence</h3>
        <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
          {claims.filter(c => c.status === 'denied').length > 0 && (
            <div className="flex items-start gap-2"><span>🚨</span><span>{claims.filter(c => c.status === 'denied').length} denied claim{claims.filter(c => c.status === 'denied').length > 1 ? 's' : ''} totaling ${claims.filter(c => c.status === 'denied').reduce((s, c) => s + c.amountBilled, 0).toLocaleString()}. Appeal within 60 days of denial for best recovery rate.</span></div>
          )}
          {needsFollowUp > 0 && (
            <div className="flex items-start gap-2"><span>📞</span><span>{needsFollowUp} claim{needsFollowUp > 1 ? 's' : ''} past 30 days — automated follow-up calls recover 68% of stalled claims within 7 days of contact.</span></div>
          )}
          {totalCollected > 0 && (
            <div className="flex items-start gap-2"><span>💰</span><span>Collection rate: {Math.round((totalCollected / totalBilled) * 100)}% — ${(totalBilled - totalCollected).toLocaleString()} outstanding. Industry benchmark is 95% within 60 days.</span></div>
          )}
          <div className="flex items-start gap-2"><span>🎯</span><span>Pro tip: Claims submitted with narrative and clinical notes see 23% fewer denials. Attach X-rays for all major procedures.</span></div>
        </div>
      </div>

      <div className="text-center pb-4">
        <p className="text-xs text-slate-400">Dentamind AI — Claims Tracking · Follow-Up Automation · Denial Management · Clearinghouse Ready</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function InsuranceVerificationPage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<PatientInsurance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<PatientInsurance | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'verified' | 'pending' | 'expired'>('all');
  const [pageView, setPageView] = useState<'verification' | 'claims'>('verification');

  useEffect(() => {
    setPatients(generatePatientInsurance());
    setLoading(false);
  }, []);

  const filtered = patients.filter(p => filterStatus === 'all' || p.verificationStatus === filterStatus);
  const verified = patients.filter(p => p.verificationStatus === 'verified').length;
  const pending = patients.filter(p => p.verificationStatus === 'pending').length;
  const expired = patients.filter(p => p.verificationStatus === 'expired').length;
  const avgRemaining = patients.length ? Math.round(patients.filter(p => p.benefits.annualMax > 0).reduce((s, p) => s + p.benefits.annualRemaining, 0) / patients.filter(p => p.benefits.annualMax > 0).length) : 0;
  const totalUnused = patients.reduce((s, p) => s + p.benefits.annualRemaining, 0);

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" /></div>;

  if (selectedPatient) return <div className="p-6 lg:p-8 max-w-7xl mx-auto"><PatientInsuranceDetail patient={selectedPatient} onBack={() => setSelectedPatient(null)} /></div>;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <button onClick={() => navigate('/home')} className="text-xs text-slate-400 hover:text-teal-400 flex items-center gap-1 mb-2">
          <ArrowLeft className="w-3 h-3" /> Back to Dashboard
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-xl"><Shield className="w-6 h-6 text-blue-400" /></div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Insurance Intelligence</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Coverage verification, benefit tracking, claims management, and CDT eligibility</p>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl w-fit">
        <button onClick={() => setPageView('verification')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${pageView === 'verification' ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
          <Shield className="w-4 h-4" /> Verification
        </button>
        <button onClick={() => setPageView('claims')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${pageView === 'claims' ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
          <FileText className="w-4 h-4" /> Claims Tracking
          {(() => { const overdue = generateDemoClaims().filter(c => c.status !== 'paid' && c.daysSinceSubmission >= 30).length; return overdue > 0 ? <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">{overdue}</span> : null; })()}
        </button>
      </div>

      {pageView === 'claims' ? <ClaimsTrackingView /> : <>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'VERIFIED', value: `${verified}/${patients.length}`, sub: 'patients verified', icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'PENDING', value: String(pending), sub: 'need verification', icon: Clock, color: 'text-amber-400' },
          { label: 'EXPIRED', value: String(expired), sub: 'need re-verification', icon: AlertTriangle, color: 'text-red-400' },
          { label: 'AVG REMAINING', value: `$${avgRemaining.toLocaleString()}`, sub: 'per patient annual max', icon: DollarSign, color: 'text-teal-400' },
          { label: 'TOTAL UNUSED', value: `$${(totalUnused / 1000).toFixed(1)}K`, sub: 'benefits available across patients', icon: TrendingUp, color: 'text-blue-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">{stat.label}</p>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400">Status:</span>
        {(['all', 'verified', 'pending', 'expired'] as const).map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-all ${filterStatus === s ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      {/* Patient List */}
      <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl overflow-hidden">
        <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
          {filtered.map(p => {
            const b = p.benefits;
            const pctUsed = b.annualMax > 0 ? Math.round((b.annualUsed / b.annualMax) * 100) : 0;
            return (
              <button key={p.patientId} onClick={() => setSelectedPatient(p)}
                className="w-full px-6 py-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors text-left">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {p.firstName[0]}{p.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{p.firstName} {p.lastName}</p>
                  <p className="text-[10px] text-slate-400">{p.plan.carrier} · {p.plan.planName} · {p.plan.planType}</p>
                </div>
                <div className="hidden md:block w-32">
                  {b.annualMax > 0 ? (
                    <div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full">
                        <div className={`h-full rounded-full ${pctUsed > 85 ? 'bg-red-500' : pctUsed > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pctUsed}%` }} />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">${b.annualRemaining.toLocaleString()} of ${b.annualMax.toLocaleString()}</p>
                    </div>
                  ) : (
                    <p className="text-[10px] text-blue-400 font-semibold">{p.plan.planType} — Copay Plan</p>
                  )}
                </div>
                <div className="text-right w-16">
                  <p className={`text-xs font-bold ${b.deductibleRemaining === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {b.deductibleRemaining === 0 ? '✓ Met' : `$${b.deductibleRemaining}`}
                  </p>
                  <p className="text-[9px] text-slate-400">deductible</p>
                </div>
                <VerificationBadge status={p.verificationStatus} />
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="text-center pb-4">
        <p className="text-xs text-slate-400">Dentamind AI — Insurance Verification · Benefit Tracking · CDT Coverage Lookup · Clearinghouse Ready</p>
      </div>
      </>}
    </div>
  );
}
