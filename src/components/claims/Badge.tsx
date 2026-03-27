interface BadgeProps {
  children: React.ReactNode;
  variant?: "critical" | "high" | "medium" | "success" | "pending" | "default" | "info";
}

const variantClasses: Record<string, string> = {
  critical: "bg-destructive/15 text-red-400 ring-1 ring-red-500/30",
  high: "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30",
  medium: "bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30",
  success: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30",
  pending: "bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30",
  default: "bg-secondary text-muted-foreground ring-1 ring-border",
  info: "bg-teal-500/15 text-teal-400 ring-1 ring-teal-500/30",
};

export const ClaimBadge = ({ children, variant = "default" }: BadgeProps) => (
  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase ${variantClasses[variant]}`}>
    {children}
  </span>
);
