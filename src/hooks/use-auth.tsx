// Stub auth hook
export function useAuth() {
  return {
    user: { email: 'claims-demo@uishealth.com', user_metadata: { full_name: 'Demo User' } },
    role: 'approver' as 'approver' | 'staff' | null,
    signOut: () => { window.location.href = '/demo/claims'; },
    loading: false,
  };
}
