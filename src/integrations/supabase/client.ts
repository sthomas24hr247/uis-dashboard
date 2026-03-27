// Supabase stub — not connected in UIS dashboard
export const supabase = {
  from: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
  functions: { invoke: () => Promise.resolve({ data: null, error: null }) },
};
