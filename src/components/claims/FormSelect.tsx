interface SelectOption {
  val?: string;
  label?: string;
  desc?: string;
}

interface FormSelectProps {
  label: string;
  options: (string | SelectOption)[];
  value: string | string[] | undefined;
  onChange: (val: any) => void;
  multi?: boolean;
}

export const FormSelect = ({ label, options, value, onChange, multi = false }: FormSelectProps) => (
  <div className="mb-3">
    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-[0.12em] mb-1">{label}</label>
    {multi ? (
      <div className="space-y-1">
        {options.map((opt, i) => {
          const v = typeof opt === "string" ? opt : opt.label || opt.val || "";
          return (
            <label key={i} className="flex items-start gap-2 text-xs text-secondary-foreground cursor-pointer hover:text-foreground">
              <input
                type="checkbox"
                checked={((value as string[]) || []).includes(v)}
                onChange={(e) => {
                  const arr = (value as string[]) || [];
                  onChange(e.target.checked ? [...arr, v] : arr.filter((x) => x !== v));
                }}
                className="mt-0.5 accent-teal"
              />
              <span>{typeof opt === "string" ? opt : opt.label}</span>
            </label>
          );
        })}
      </div>
    ) : (
      <select
        className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-secondary-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
        value={(value as string) || ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">— Select —</option>
        {options.map((opt, i) => {
          const val = typeof opt === "string" ? opt : opt.label || opt.val || "";
          const display = typeof opt === "string" ? opt : `${opt.label}${opt.desc ? ` — ${opt.desc}` : ""}`;
          return (
            <option key={i} value={val}>
              {display.length > 120 ? display.slice(0, 120) + "…" : display}
            </option>
          );
        })}
      </select>
    )}
  </div>
);
