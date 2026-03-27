// Stub — local state used in ClaimsRecoveryDemo instead of Supabase
import { type DeniedClaim } from '@/data/claims-data';

export const useClaims = () => ({ data: [] as DeniedClaim[], isLoading: false });
export const useApprovalItems = (_claims: any) => ({ data: [] });
export const useSubmitApproval = () => ({ mutate: (_: any, opts?: any) => opts?.onSuccess?.() });
export const useApproveClaim = () => ({ mutate: (_: any) => {} });
export const useDeleteClaim = () => ({ mutate: (_: any) => {} });
export const useMarkClaimPaid = () => ({ mutate: (_: any) => {} });
