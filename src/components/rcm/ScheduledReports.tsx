import { useState, useCallback } from "react";
import { ClaimBadge } from "@/components/claims/Badge";
import { toast } from "sonner";

interface ScheduledReport {
  id: string;
  name: string;
  schedule: "weekly" | "biweekly" | "monthly";
  dayOfWeek: string;
  time: string;
  recipients: string[];
  includeCharts: boolean;
  includeAI: boolean;
  enabled: boolean;
  lastRun?: string;
  nextRun: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const calcNextRun = (day: string, time: string): string => {
  const dayIdx = DAYS.indexOf(day);
  const now = new Date();
  const current = now.getDay(); // 0=Sun
  const target = dayIdx + 1; // Mon=1
  let diff = target - current;
  if (diff <= 0) diff += 7;
  const next = new Date(now);
  next.setDate(now.getDate() + diff);
  const [h, m] = time.split(":");
  next.setHours(parseInt(h), parseInt(m), 0, 0);
  return next.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) + ` at ${time}`;
};

export const ScheduledReports = () => {
  const [reports, setReports] = useState<ScheduledReport[]>([
    {
      id: "rpt-1",
      name: "Weekly RCM Summary",
      schedule: "weekly",
      dayOfWeek: "Monday",
      time: "08:00",
      recipients: ["admin@dentalpractice.com", "manager@dentalpractice.com"],
      includeCharts: true,
      includeAI: true,
      enabled: true,
      lastRun: "Mar 17, 2026",
      nextRun: calcNextRun("Monday", "08:00"),
    },
  ]);

  const [isAdding, setIsAdding] = useState(false);
  const [newRecipient, setNewRecipient] = useState("");

  // New report form state
  const [form, setForm] = useState({
    name: "",
    schedule: "weekly" as "weekly" | "biweekly" | "monthly",
    dayOfWeek: "Monday",
    time: "08:00",
    recipients: [] as string[],
    includeCharts: true,
    includeAI: true,
  });

  const addRecipient = useCallback(() => {
    const email = newRecipient.trim().toLowerCase();
    if (!email || !/^[^s@]+@[^s@]+.[^s@]+$/.test(email)) {
      toast.error("Enter a valid email address");
      return;
    }
    if (form.recipients.includes(email)) {
      toast.error("Already added");
      return;
    }
    setForm((prev) => ({ ...prev, recipients: [...prev.recipients, email] }));
    setNewRecipient("");
  }, [newRecipient, form.recipients]);

  const removeRecipient = (email: string) => {
    setForm((prev) => ({ ...prev, recipients: prev.recipients.filter((r) => r !== email) }));
  };

  const handleCreate = () => {
    if (!form.name.trim()) {
      toast.error("Enter a report name");
      return;
    }
    if (form.recipients.length === 0) {
      toast.error("Add at least one recipient");
      return;
    }
    const newReport: ScheduledReport = {
      id: `rpt-${Date.now()}`,
      ...form,
      enabled: true,
      nextRun: calcNextRun(form.dayOfWeek, form.time),
    };
    setReports((prev) => [...prev, newReport]);
    setIsAdding(false);
    setForm({ name: "", schedule: "weekly", dayOfWeek: "Monday", time: "08:00", recipients: [], includeCharts: true, includeAI: true });
    toast.success("Scheduled report created");
  };

  const toggleReport = (id: string) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const deleteReport = (id: string) => {
    setReports((prev) => prev.filter((r) => r.id !== id));
    toast.success("Report schedule removed");
  };

  const generateNow = (report: ScheduledReport) => {
    toast.success(`Generating "${report.name}" for ${report.recipients.length} recipient(s)…`);
    // Simulate generation
    setTimeout(() => {
      setReports((prev) =>
        prev.map((r) =>
          r.id === report.id
            ? { ...r, lastRun: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) }
            : r
        )
      );
      toast.success("Report generated and ready for download");
    }, 2000);
  };

  return (
    <div className="bg-surface-1 border border-border rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Scheduled Reports
          </h4>
          <ClaimBadge variant="info">{reports.filter((r) => r.enabled).length} active</ClaimBadge>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 active:scale-[0.97] transition-all"
          >
            + New Schedule
          </button>
        )}
      </div>

      {/* Existing schedules */}
      {reports.length === 0 && !isAdding && (
        <div className="text-center py-6 text-xs text-muted-foreground">
          No scheduled reports configured. Click "+ New Schedule" to set one up.
        </div>
      )}

      {reports.map((report) => (
        <div
          key={report.id}
          className={`border rounded-xl p-4 transition-all ${
            report.enabled ? "border-border bg-background" : "border-border/50 bg-background/50 opacity-60"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm font-bold text-foreground">{report.name}</span>
                <ClaimBadge variant={report.enabled ? "success" : "default"}>
                  {report.enabled ? "Active" : "Paused"}
                </ClaimBadge>
                <span className="text-[10px] font-semibold text-muted-foreground bg-secondary px-1.5 py-0.5 rounded capitalize">
                  {report.schedule}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-xs mb-2">
                <div>
                  <span className="text-muted-foreground">Day: </span>
                  <span className="text-foreground font-semibold">{report.dayOfWeek}s</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Time: </span>
                  <span className="text-foreground font-semibold">{report.time}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Next: </span>
                  <span className="text-foreground font-semibold">{report.nextRun}</span>
                </div>
                {report.lastRun && (
                  <div>
                    <span className="text-muted-foreground">Last: </span>
                    <span className="text-foreground font-semibold">{report.lastRun}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap mb-2">
                <span className="text-[10px] text-muted-foreground">To:</span>
                {report.recipients.map((email) => (
                  <span key={email} className="text-[10px] font-mono bg-secondary text-foreground px-1.5 py-0.5 rounded">
                    {email}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                {report.includeCharts && <span className="flex items-center gap-1">📊 Charts</span>}
                {report.includeAI && <span className="flex items-center gap-1">🤖 AI Insights</span>}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => generateNow(report)}
                className="px-2 py-1 bg-secondary text-foreground text-[10px] font-semibold rounded-md hover:bg-secondary/80 active:scale-[0.97] transition-all border border-border"
              >
                Run Now
              </button>
              <button
                onClick={() => toggleReport(report.id)}
                className={`px-2 py-1 text-[10px] font-semibold rounded-md active:scale-[0.97] transition-all border ${
                  report.enabled
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                }`}
              >
                {report.enabled ? "Pause" : "Resume"}
              </button>
              <button
                onClick={() => deleteReport(report.id)}
                className="px-2 py-1 bg-red-500/10 text-red-400 text-[10px] font-semibold rounded-md border border-red-500/30 hover:bg-red-500/20 active:scale-[0.97] transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* New schedule form */}
      {isAdding && (
        <div className="border border-primary/30 bg-primary/5 rounded-xl p-4 space-y-4 animate-fade-in">
          <h5 className="text-xs font-bold text-foreground">Create Scheduled Report</h5>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Report Name
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Weekly RCM Summary"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Frequency
              </label>
              <select
                value={form.schedule}
                onChange={(e) => setForm((p) => ({ ...p, schedule: e.target.value as any }))}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Biweekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Day of Week
              </label>
              <select
                value={form.dayOfWeek}
                onChange={(e) => setForm((p) => ({ ...p, dayOfWeek: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Time
              </label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Recipients */}
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Recipients
            </label>
            <div className="flex gap-2">
              <input
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addRecipient())}
                placeholder="email@example.com"
                className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={addRecipient}
                className="px-3 py-2 bg-secondary text-foreground text-xs font-semibold rounded-lg hover:bg-secondary/80 active:scale-[0.97] transition-all border border-border"
              >
                Add
              </button>
            </div>
            {form.recipients.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.recipients.map((email) => (
                  <span key={email} className="inline-flex items-center gap-1 text-[10px] font-mono bg-secondary text-foreground px-2 py-1 rounded-md">
                    {email}
                    <button
                      onClick={() => removeRecipient(email)}
                      className="text-muted-foreground hover:text-red-400 transition-colors ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Content options */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={form.includeCharts}
                onChange={(e) => setForm((p) => ({ ...p, includeCharts: e.target.checked }))}
                className="rounded border-border"
              />
              <span className="text-foreground">Include charts</span>
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={form.includeAI}
                onChange={(e) => setForm((p) => ({ ...p, includeAI: e.target.checked }))}
                className="rounded border-border"
              />
              <span className="text-foreground">Include AI insights</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 active:scale-[0.97] transition-all"
            >
              Create Schedule
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 bg-secondary text-foreground text-xs font-semibold rounded-lg hover:bg-secondary/80 active:scale-[0.97] transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="text-[10px] text-muted-foreground text-center pt-2 border-t border-border">
        Reports are generated as PDF with selected content and stored for download. Connect a custom email domain to enable direct email delivery.
      </div>
    </div>
  );
};
