// Stub toast hook
export function useToast() {
  return {
    toast: (opts: any) => console.log('Toast:', opts),
    toasts: [] as any[],
    dismiss: (_id?: string) => {},
  };
}
export const toast = (opts: any) => console.log('Toast:', opts);
