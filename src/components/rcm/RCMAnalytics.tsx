import { useState, useMemo, useCallback, useRef } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, Area, AreaChart } from "recharts";
import { StatCard } from "@/components/claims/StatCard";
import { ClaimBadge } from "@/components/claims/Badge";
import { PAYOR_RULES, fmtUSD } from "@/data/rcm-data";
import { ANALYTICS_DATA, type AISuggestion } from "@/data/rcm-analytics-data";
import { ScheduledReports } from "./ScheduledReports";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const PAYOR_COLORS: Record<string, string> = {
  "dentical": "#f59e0b",
  "delta-ppo": "#3b82f6",
  "cigna-dppo": "#8b5cf6",
  "metlife": "#10b981",
  "generic": "#6b7280",
};

export const RCMAnalytics = () => {
  const [timeRange, setTimeRange] = useState<"3m" | "6m" | "12m">("6m");
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const speedChartRef = useRef<HTMLDivElement>(null);
  const trendsChartRef = useRef<HTMLDivElement>(null);
  const denialChartRef = useRef<HTMLDivElement>(null);

  const { payorSpeed, monthlyTrends, denialReasons } = ANALYTICS_DATA;

  const filteredTrends = useMemo(() => {
    const months = timeRange === "3m" ? 3 : timeRange === "6m" ? 6 : 12;
    return monthlyTrends.slice(-months);
  }, [monthlyTrends, timeRange]);

  // Fastest / slowest payor
  const sortedBySpeed = useMemo(
    () => [...payorSpeed].sort((a, b) => a.avgDays - b.avgDays),
    [payorSpeed]
  );
  const fastest = sortedBySpeed[0];
  const slowest = sortedBySpeed[sortedBySpeed.length - 1];

  // Denial stats
  const totalDenials = useMemo(
    () => denialReasons.reduce((s, r) => s + r.count, 0),
    [denialReasons]
  );

  // Trend delta (last 2 months avg days change)
  const trendDelta = useMemo(() => {
    if (filteredTrends.length < 2) return 0;
    const last = filteredTrends[filteredTrends.length - 1].avgDays;
    const prev = filteredTrends[filteredTrends.length - 2].avgDays;
    return last - prev;
  }, [filteredTrends]);

  const downloadFile = useCallback((content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const exportCSV = useCallback(() => {
    const date = new Date().toISOString().slice(0, 10);
    let csv = "RCM Analytics Report," + date + "\n\n";

    csv += "PAYOR SPEED RANKINGS\n";
    csv += "Payor,Avg Days,Fastest,Slowest,Claims Paid,Total Collected,3M Trend\n";
    sortedBySpeed.forEach((p) => {
      csv += `"${p.name}",${p.avgDays},${p.fastestDays},${p.slowestDays},${p.claimsPaid},${p.totalCollected},${p.trendDelta}\n`;
    });

    csv += "\nMONTHLY TRENDS\n";
    csv += "Month,Avg Days,Denti-Cal,Delta PPO,Cigna,MetLife,Claims Filed,Claims Paid,Denials\n";
    filteredTrends.forEach((t) => {
      csv += `${t.month},${t.avgDays},${t.dentical},${t.deltaPpo},${t.cigna},${t.metlife},${t.claimsFiled},${t.claimsPaid},${t.denials}\n`;
    });

    csv += "\nDENIAL REASONS\n";
    csv += "Code,Reason,Count,Top Payor,Trending\n";
    denialReasons.forEach((r) => {
      csv += `${r.code},"${r.reason}",${r.count},"${r.topPayor}",${r.trending}\n`;
    });

    if (aiSuggestions.length > 0) {
      csv += "\nAI INSIGHTS\n";
      csv += "Priority,Category,Title,Detail,Estimated Impact\n";
      aiSuggestions.forEach((s) => {
        csv += `${s.priority},"${s.category}","${s.title}","${s.detail.replace(/"/g, '""')}","${s.estimatedImpact}"\n`;
      });
    }

    downloadFile(csv, `RCM-Analytics-${date}.csv`, "text/csv");
    toast.success("CSV report downloaded");
  }, [sortedBySpeed, filteredTrends, denialReasons, aiSuggestions, downloadFile]);

  const captureChart = async (ref: React.RefObject<HTMLDivElement | null>): Promise<string | null> => {
    if (!ref.current) return null;
    try {
      const canvas = await html2canvas(ref.current, {
        backgroundColor: "#18181b",
        scale: 2,
        logging: false,
        useCORS: true,
      });
      return canvas.toDataURL("image/png");
    } catch {
      return null;
    }
  };

  const loadLogoForPDF = (): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } else {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = "/images/choice-logo-pdf.png";
    });
  };

  const exportPDF = useCallback(async () => {
    setIsExporting(true);
    toast.info("Generating PDF with charts…");

    // Capture charts and logo in parallel
    const [speedImg, trendsImg, denialImg, logoData] = await Promise.all([
      captureChart(speedChartRef),
      captureChart(trendsChartRef),
      captureChart(denialChartRef),
      loadLogoForPDF(),
    ]);

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
    const date = new Date().toISOString().slice(0, 10);
    const pw = doc.internal.pageSize.getWidth();
    let y = 20;

    const addLine = (text: string, size = 10, bold = false) => {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFontSize(size);
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.text(text, 15, y);
      y += size * 0.5 + 2;
    };

    const addTableRow = (cols: string[], widths: number[], bold = false) => {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFontSize(8);
      doc.setFont("helvetica", bold ? "bold" : "normal");
      let x = 15;
      cols.forEach((col, i) => {
        doc.text(col, x, y);
        x += widths[i];
      });
      y += 5;
    };

    const addChartImage = (imgData: string | null, label: string, height = 55) => {
      if (!imgData) return;
      if (y + height + 12 > 260) { doc.addPage(); y = 20; }
      addLine(label, 9, true);
      y += 1;
      const imgW = pw - 30;
      doc.addImage(imgData, "PNG", 15, y, imgW, height);
      y += height + 6;
    };

    // Header with logo
    doc.setFillColor(24, 24, 27);
    doc.rect(0, 0, pw, 38, "F");
    
    // Add logo to header
    if (logoData) {
      doc.addImage(logoData, "PNG", 12, 4, 40, 14);
    }
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Insurance RCM Analytics Report", logoData ? 56 : 15, 14);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Children's Choice Dental Care — Choice Healthcare Services", logoData ? 56 : 15, 22);
    doc.setFontSize(8);
    doc.text(`Generated: ${date}  |  Period: ${timeRange === "3m" ? "3 Months" : timeRange === "6m" ? "6 Months" : "12 Months"}`, logoData ? 56 : 15, 29);
    doc.setTextColor(0, 0, 0);
    y = 48;

    // Summary
    addLine("EXECUTIVE SUMMARY", 13, true);
    y += 2;
    addLine(`Fastest payor: ${fastest.name} (${fastest.avgDays}d avg)`);
    addLine(`Slowest payor: ${slowest.name} (${slowest.avgDays}d avg)`);
    addLine(`Total denials tracked: ${totalDenials}`);
    addLine(`Month-over-month trend: ${trendDelta > 0 ? "+" : ""}${trendDelta.toFixed(1)} days ${trendDelta <= 0 ? "(improving)" : "(slowing)"}`);
    y += 5;

    // Payor Speed Chart
    addChartImage(speedImg, "PAYOR SPEED — AVG DAYS TO PAYMENT", 50);

    // Payor Speed Table
    addLine("PAYOR SPEED RANKINGS", 13, true);
    y += 2;
    const speedW = [45, 18, 18, 18, 22, 28, 18];
    addTableRow(["Payor", "Avg", "Fast", "Slow", "Paid", "Collected", "3M Δ"], speedW, true);
    doc.setDrawColor(200, 200, 200);
    doc.line(15, y - 3, pw - 15, y - 3);
    sortedBySpeed.forEach((p) => {
      addTableRow(
        [p.name, `${p.avgDays}d`, `${p.fastestDays}d`, `${p.slowestDays}d`, `${p.claimsPaid}`, fmtUSD(p.totalCollected), `${p.trendDelta > 0 ? "+" : ""}${p.trendDelta}d`],
        speedW
      );
    });
    y += 5;

    // Trends Chart
    addChartImage(trendsImg, "TIME-TO-PAY TRENDS (MONTHLY)", 55);

    // Monthly trends table
    addLine("MONTHLY PAYMENT TRENDS", 13, true);
    y += 2;
    const trendW = [22, 16, 20, 20, 16, 18, 18, 18, 16];
    addTableRow(["Month", "Avg", "Denti-Cal", "Delta PPO", "Cigna", "MetLife", "Filed", "Paid", "Denied"], trendW, true);
    doc.line(15, y - 3, pw - 15, y - 3);
    filteredTrends.forEach((t) => {
      addTableRow(
        [t.month, `${t.avgDays}d`, `${t.dentical}d`, `${t.deltaPpo}d`, `${t.cigna}d`, `${t.metlife}d`, `${t.claimsFiled}`, `${t.claimsPaid}`, `${t.denials}`],
        trendW
      );
    });
    y += 5;

    // Denial chart
    addChartImage(denialImg, "DENIAL REASONS DISTRIBUTION", 55);

    // Denial table
    addLine("TOP DENIAL REASONS", 13, true);
    y += 2;
    const denialW = [18, 65, 14, 40, 22];
    addTableRow(["Code", "Reason", "Count", "Top Payor", "Trend"], denialW, true);
    doc.line(15, y - 3, pw - 15, y - 3);
    denialReasons.forEach((r) => {
      const pct = Math.round((r.count / totalDenials) * 100);
      addTableRow([r.code, r.reason.slice(0, 40), `${r.count} (${pct}%)`, r.topPayor, r.trending === "up" ? "↑ Up" : r.trending === "down" ? "↓ Down" : "—"], denialW);
    });
    y += 5;

    // AI Insights
    if (aiSuggestions.length > 0) {
      addLine("AI INSIGHTS & RECOMMENDATIONS", 13, true);
      y += 2;
      aiSuggestions.forEach((s, i) => {
        addLine(`${i + 1}. [${s.priority.toUpperCase()}] ${s.title}`, 10, true);
        const lines = doc.splitTextToSize(s.detail, pw - 35);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        lines.forEach((line: string) => {
          if (y > 260) { doc.addPage(); y = 20; }
          doc.text(line, 20, y);
          y += 4;
        });
        addLine(`Impact: ${s.estimatedImpact}  |  Category: ${s.category}  |  Data points: ${s.dataPoints}`, 7);
        y += 2;
      });
    }

    // Footer
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i} of ${pages}  |  Confidential — Management Review`, 15, 272);
      doc.text("Generated by Karen AI RCM Analytics", pw - 75, 272);
    }

    doc.save(`RCM-Analytics-${date}.pdf`);
    setIsExporting(false);
    toast.success("PDF report with charts downloaded");
  }, [sortedBySpeed, filteredTrends, denialReasons, aiSuggestions, fastest, slowest, totalDenials, trendDelta, timeRange]);

  return (
    <div className="space-y-5">
      {/* Top-level stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Fastest Payor"
          value={`${fastest.avgDays}d`}
          sub={fastest.name}
          color="emerald"
        />
        <StatCard
          label="Slowest Payor"
          value={`${slowest.avgDays}d`}
          sub={slowest.name}
          color="red"
        />
        <StatCard
          label="Total Denials"
          value={totalDenials}
          sub="tracked this period"
          color="amber"
        />
        <StatCard
          label="Trend (MoM)"
          value={`${trendDelta > 0 ? "+" : ""}${trendDelta.toFixed(1)}d`}
          sub={trendDelta <= 0 ? "improving ↓" : "slowing ↑"}
          color={trendDelta <= 0 ? "teal" : "red"}
        />
      </div>

      {/* Time range + Export buttons */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 bg-secondary rounded-lg p-1 w-fit">
          {(["3m", "6m", "12m"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all active:scale-[0.96] ${
                timeRange === r
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r === "3m" ? "3 Months" : r === "6m" ? "6 Months" : "12 Months"}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-foreground text-xs font-semibold rounded-lg hover:bg-secondary/80 active:scale-[0.97] transition-all border border-border"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
          <button
            onClick={exportPDF}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 active:scale-[0.97] transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {isExporting ? "Generating…" : "Export PDF"}
          </button>
        </div>
      </div>

      {/* ── Payor Speed Rankings ────────────────────────────────────── */}
      <div className="bg-surface-1 border border-border rounded-xl p-4">
        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
          Payor Speed Rankings — Avg Days to Payment
        </h4>
        <div ref={speedChartRef} className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sortedBySpeed} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} unit="d" />
              <YAxis
                dataKey="shortName"
                type="category"
                tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }}
                width={100}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: any) => [`${value} days`, "Avg Days"]}
              />
              <Bar dataKey="avgDays" radius={[0, 4, 4, 0]}>
                {sortedBySpeed.map((entry) => (
                  <Cell key={entry.id} fill={PAYOR_COLORS[entry.id] || "#6b7280"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Speed detail table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground uppercase tracking-wider">
                <th className="text-left py-2 px-2">Payor</th>
                <th className="text-right py-2 px-2">Avg Days</th>
                <th className="text-right py-2 px-2">Fastest</th>
                <th className="text-right py-2 px-2">Slowest</th>
                <th className="text-right py-2 px-2">Claims Paid</th>
                <th className="text-right py-2 px-2">Collected</th>
                <th className="text-right py-2 px-2">3M Δ</th>
              </tr>
            </thead>
            <tbody>
              {sortedBySpeed.map((p) => (
                <tr key={p.id} className="border-b border-border/30">
                  <td className="py-2 px-2 font-semibold text-foreground">{p.name}</td>
                  <td className="py-2 px-2 text-right tabular-nums font-bold">{p.avgDays}d</td>
                  <td className="py-2 px-2 text-right tabular-nums text-emerald-400">{p.fastestDays}d</td>
                  <td className="py-2 px-2 text-right tabular-nums text-red-400">{p.slowestDays}d</td>
                  <td className="py-2 px-2 text-right tabular-nums">{p.claimsPaid}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{fmtUSD(p.totalCollected)}</td>
                  <td className="py-2 px-2 text-right">
                    <span className={`font-bold tabular-nums ${p.trendDelta < 0 ? "text-emerald-400" : p.trendDelta > 0 ? "text-red-400" : "text-muted-foreground"}`}>
                      {p.trendDelta > 0 ? "+" : ""}{p.trendDelta}d
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Time-to-Pay Trends ─────────────────────────────────────── */}
      <div className="bg-surface-1 border border-border rounded-xl p-4">
        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
          Time-to-Pay Trends (Monthly)
        </h4>
        <div ref={trendsChartRef} className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredTrends} margin={{ left: 0, right: 10, top: 5 }}>
              <defs>
                <linearGradient id="avgFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} unit="d" />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Area type="monotone" dataKey="avgDays" stroke="hsl(var(--primary))" fill="url(#avgFill)" name="Avg All Payors" strokeWidth={2} />
              <Line type="monotone" dataKey="dentical" stroke="#f59e0b" name="Denti-Cal" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="deltaPpo" stroke="#3b82f6" name="Delta PPO" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="cigna" stroke="#8b5cf6" name="Cigna" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="metlife" stroke="#10b981" name="MetLife" strokeWidth={1.5} dot={false} />
              <Legend wrapperStyle={{ fontSize: "10px" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Subtle change alerts */}
        <div className="mt-3 space-y-1.5">
          {filteredTrends.length >= 2 && (() => {
            const last = filteredTrends[filteredTrends.length - 1];
            const prev = filteredTrends[filteredTrends.length - 2];
            const alerts: { payor: string; delta: number; color: string }[] = [];
            if (last.dentical - prev.dentical >= 3) alerts.push({ payor: "Denti-Cal", delta: last.dentical - prev.dentical, color: "text-red-400" });
            if (last.dentical - prev.dentical <= -3) alerts.push({ payor: "Denti-Cal", delta: last.dentical - prev.dentical, color: "text-emerald-400" });
            if (last.deltaPpo - prev.deltaPpo >= 2) alerts.push({ payor: "Delta PPO", delta: last.deltaPpo - prev.deltaPpo, color: "text-red-400" });
            if (last.metlife - prev.metlife >= 2) alerts.push({ payor: "MetLife", delta: last.metlife - prev.metlife, color: "text-red-400" });
            if (last.metlife - prev.metlife <= -2) alerts.push({ payor: "MetLife", delta: last.metlife - prev.metlife, color: "text-emerald-400" });
            if (alerts.length === 0) return null;
            return alerts.map((a, i) => (
              <div key={i} className="flex items-center gap-2 text-xs bg-background border border-border rounded-lg px-3 py-2">
                <span className="text-muted-foreground">⚡</span>
                <span className="text-foreground font-semibold">{a.payor}</span>
                <span className={`font-bold tabular-nums ${a.color}`}>
                  {a.delta > 0 ? `+${a.delta}d slower` : `${Math.abs(a.delta)}d faster`}
                </span>
                <span className="text-muted-foreground">vs prior month</span>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* ── Denial Reasons ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div ref={denialChartRef} className="bg-surface-1 border border-border rounded-xl p-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
            Top Denial Reasons
          </h4>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={denialReasons}
                  dataKey="count"
                  nameKey="reason"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  strokeWidth={2}
                  stroke="hsl(var(--background))"
                >
                  {denialReasons.map((_, idx) => (
                    <Cell key={idx} fill={["#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6", "#6b7280", "#10b981"][idx % 6]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "10px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface-1 border border-border rounded-xl p-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
            Denial Breakdown
          </h4>
          <div className="space-y-2">
            {denialReasons.map((r) => {
              const pct = Math.round((r.count / totalDenials) * 100);
              return (
                <div key={r.code} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-foreground">{r.code}</span>
                      <span className="text-muted-foreground truncate max-w-[180px]">{r.reason}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold tabular-nums text-foreground">{r.count}</span>
                      <span className="text-muted-foreground tabular-nums w-8 text-right">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-400/70 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Top payor: <span className="text-foreground font-semibold">{r.topPayor}</span>
                    {r.trending === "up" && <span className="text-red-400 ml-2">↑ Trending up</span>}
                    {r.trending === "down" && <span className="text-emerald-400 ml-2">↓ Trending down</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── AI Insights & Suggestions ──────────────────────────────── */}
      <div className="bg-surface-1 border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              AI Insights & Recommendations
            </h4>
            <ClaimBadge variant="info">Live AI</ClaimBadge>
          </div>
          <button
            onClick={async () => {
              if (showAISuggestions && aiSuggestions.length > 0) {
                setShowAISuggestions(false);
                return;
              }
              setIsLoadingAI(true);
              setShowAISuggestions(true);
              try {
                setAiSuggestions([]);
              } catch (err: any) {
                console.error("AI insights error:", err);
                toast.error(err.message || "Failed to generate AI insights");
                // Fall back to static suggestions
                setAiSuggestions(ANALYTICS_DATA.aiSuggestions);
              } finally {
                setIsLoadingAI(false);
              }
            }}
            disabled={isLoadingAI}
            className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 active:scale-[0.97] transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {isLoadingAI ? "Analyzing…" : showAISuggestions ? "Hide Analysis" : "Generate AI Analysis"}
          </button>
        </div>

        {!showAISuggestions && (
          <div className="text-center py-8 text-xs text-muted-foreground">
            <p className="mb-1">AI analyzes your claim patterns, payment timelines, and denial trends in real time.</p>
            <p>Click "Generate AI Analysis" for data-driven recommendations powered by Lovable AI.</p>
          </div>
        )}

        {showAISuggestions && isLoadingAI && (
          <div className="space-y-3 animate-fade-in">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="border border-border rounded-xl p-4 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-secondary rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-secondary rounded w-2/3" />
                    <div className="h-3 bg-secondary rounded w-full" />
                    <div className="h-3 bg-secondary rounded w-4/5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showAISuggestions && !isLoadingAI && aiSuggestions.length > 0 && (
          <div className="space-y-3 animate-fade-in">
            {aiSuggestions.map((s, i) => (
              <div
                key={i}
                className={`border rounded-xl p-4 transition-all ${
                  s.priority === "high"
                    ? "border-red-500/30 bg-red-500/5"
                    : s.priority === "medium"
                    ? "border-amber-500/30 bg-amber-500/5"
                    : "border-border bg-background"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">
                    <span className="text-lg">{s.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-foreground">{s.title}</span>
                      <ClaimBadge
                        variant={
                          s.priority === "high" ? "critical" : s.priority === "medium" ? "pending" : "info"
                        }
                      >
                        {s.priority}
                      </ClaimBadge>
                      <span className="text-[10px] text-muted-foreground">{s.category}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-2">{s.detail}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-semibold text-foreground bg-secondary px-2 py-0.5 rounded">
                        Impact: {s.estimatedImpact}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Based on {s.dataPoints} data points
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="text-[10px] text-muted-foreground text-center pt-2 border-t border-border">
              Insights generated from {filteredTrends.length} months of payment data across {PAYOR_RULES.length - 1} payors.
              Model confidence increases with more claim data.
            </div>
          </div>
        )}
      </div>
      {/* ── Scheduled Reports ──────────────────────────────────── */}
      <ScheduledReports />
    </div>
  );
};
