// Stub — local state used in ClaimsRecoveryDemo instead of Supabase
import { type DeniedClaim } from '@/data/claims-data';

export type SoapAddendumRow = Record<string, any>;
export type DeniedClaimRow = Record<string, any>;

export const useDeniedClaims = () => ({ data: [] as DeniedClaimRow[] });
export const useSoapAddendums = () => ({ data: [] as SoapAddendumRow[] });
export const useInsertDeniedClaims = () => ({ mutateAsync: async (_: any) => {} });
export const useInsertSoapAddendums = () => ({ mutateAsync: async (_: any) => {} });

export function mapDeniedClaimRow(row: DeniedClaimRow): DeniedClaim {
  return {
    id: row.id || String(Math.random()),
    row: row.row || 0,
    carrier: row.carrier || '',
    type: row.type || 'STANDARD',
    clinic: row.clinic || '',
    claimDate: row.claim_date || row.claimDate || '',
    patientId: row.patient_id || row.patientId || '',
    patientName: row.patient_name || row.patientName || '',
    guardianName: row.guardian_name || row.guardianName || '',
    dob: row.dob || '',
    age: row.age || '',
    phone: row.phone || '',
    lastExamDate: row.last_exam_date || row.lastExamDate || '',
    dentist: row.dentist || '',
    active: row.active || '',
    karenReview: row.karen_review || row.karenReview || '',
    scanned: row.scanned || '',
    rcmSent: row.rcm_sent || row.rcmSent || '',
    denialCode: row.denial_code || row.denialCode || '',
    issues: row.issues || [],
    billedAmt: row.billed_amount || row.billedAmt || 0,
    status: row.status || 'denied',
    priority: row.priority || 'high',
    daysOld: row.days_old || row.daysOld || 0,
  };
}
