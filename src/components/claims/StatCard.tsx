interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: "teal" | "red" | "amber" | "sky" | "emerald";
}

const colorMap: Record<string, string> = {
  teal: "from-teal-500/10 border-teal-500/20",
  red: "from-red-500/10 border-red-500/20",
  amber: "from-amber-500/10 border-amber-500/20",
  sky: "from-sky-500/10 border-sky-500/20",
  emerald: "from-emerald-500/10 border-emerald-500/20",
};

export const StatCard = ({ label, value, sub, color = "teal" }: StatCardProps) => (
  <div className={`bg-gradient-to-br ${colorMap[color]} to-transparent border rounded-2xl p-5`}>
    <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1.5">{label}</div>
    <div className="text-3xl font-extrabold text-foreground tracking-tight">{value}</div>
    {sub && <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>}
  </div>
);
