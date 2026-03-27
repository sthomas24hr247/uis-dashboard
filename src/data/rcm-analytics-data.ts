// ── RCM Analytics Mock Data ───────────────────────────────────────────

export interface PayorSpeedRecord {
  id: string;
  name: string;
  shortName: string;
  avgDays: number;
  fastestDays: number;
  slowestDays: number;
  claimsPaid: number;
  totalCollected: number;
  trendDelta: number; // change in avg days over last 3 months (negative = improving)
}

export interface MonthlyTrend {
  month: string;
  avgDays: number;
  dentical: number;
  deltaPpo: number;
  cigna: number;
  metlife: number;
  claimsFiled: number;
  claimsPaid: number;
  denials: number;
}

export interface DenialReason {
  code: string;
  reason: string;
  count: number;
  topPayor: string;
  trending: "up" | "down" | "stable";
}

export interface AISuggestion {
  icon: string;
  title: string;
  detail: string;
  priority: "high" | "medium" | "low";
  category: string;
  estimatedImpact: string;
  dataPoints: number;
}

export const ANALYTICS_DATA = {
  payorSpeed: [
    { id: "metlife", name: "MetLife PDP Plus", shortName: "MetLife", avgDays: 14, fastestDays: 8, slowestDays: 28, claimsPaid: 47, totalCollected: 38420, trendDelta: -2 },
    { id: "cigna-dppo", name: "Cigna DPPO", shortName: "Cigna", avgDays: 18, fastestDays: 11, slowestDays: 34, claimsPaid: 31, totalCollected: 27890, trendDelta: 1 },
    { id: "delta-ppo", name: "Delta Dental PPO", shortName: "Delta PPO", avgDays: 21, fastestDays: 12, slowestDays: 42, claimsPaid: 62, totalCollected: 54310, trendDelta: -1 },
    { id: "dentical", name: "Denti-Cal", shortName: "Denti-Cal", avgDays: 45, fastestDays: 28, slowestDays: 78, claimsPaid: 89, totalCollected: 31250, trendDelta: 3 },
    { id: "generic", name: "Other / OON", shortName: "Other", avgDays: 30, fastestDays: 14, slowestDays: 55, claimsPaid: 12, totalCollected: 8740, trendDelta: 0 },
  ] as PayorSpeedRecord[],

  monthlyTrends: [
    { month: "Apr '25", avgDays: 28, dentical: 42, deltaPpo: 22, cigna: 19, metlife: 16, claimsFiled: 38, claimsPaid: 32, denials: 5 },
    { month: "May '25", avgDays: 27, dentical: 41, deltaPpo: 21, cigna: 18, metlife: 15, claimsFiled: 41, claimsPaid: 35, denials: 4 },
    { month: "Jun '25", avgDays: 29, dentical: 44, deltaPpo: 23, cigna: 19, metlife: 14, claimsFiled: 35, claimsPaid: 30, denials: 6 },
    { month: "Jul '25", avgDays: 26, dentical: 40, deltaPpo: 20, cigna: 17, metlife: 13, claimsFiled: 44, claimsPaid: 39, denials: 3 },
    { month: "Aug '25", avgDays: 25, dentical: 39, deltaPpo: 20, cigna: 17, metlife: 13, claimsFiled: 46, claimsPaid: 41, denials: 4 },
    { month: "Sep '25", avgDays: 27, dentical: 43, deltaPpo: 21, cigna: 18, metlife: 14, claimsFiled: 42, claimsPaid: 36, denials: 7 },
    { month: "Oct '25", avgDays: 26, dentical: 41, deltaPpo: 20, cigna: 17, metlife: 14, claimsFiled: 48, claimsPaid: 42, denials: 5 },
    { month: "Nov '25", avgDays: 24, dentical: 38, deltaPpo: 19, cigna: 16, metlife: 12, claimsFiled: 50, claimsPaid: 45, denials: 4 },
    { month: "Dec '25", avgDays: 28, dentical: 44, deltaPpo: 22, cigna: 19, metlife: 15, claimsFiled: 37, claimsPaid: 30, denials: 8 },
    { month: "Jan '26", avgDays: 27, dentical: 43, deltaPpo: 21, cigna: 18, metlife: 14, claimsFiled: 52, claimsPaid: 44, denials: 6 },
    { month: "Feb '26", avgDays: 25, dentical: 42, deltaPpo: 20, cigna: 17, metlife: 13, claimsFiled: 49, claimsPaid: 43, denials: 5 },
    { month: "Mar '26", avgDays: 26, dentical: 45, deltaPpo: 21, cigna: 18, metlife: 14, claimsFiled: 44, claimsPaid: 38, denials: 7 },
  ] as MonthlyTrend[],

  denialReasons: [
    { code: "CO-16", reason: "Claim lacks information or has submission errors", count: 23, topPayor: "Denti-Cal", trending: "up" },
    { code: "CO-45", reason: "Charges exceed fee schedule / contracted rate", count: 19, topPayor: "Delta Dental PPO", trending: "stable" },
    { code: "CO-29", reason: "Filing time limit expired", count: 11, topPayor: "Delta Dental PPO", trending: "down" },
    { code: "CO-4", reason: "Procedure code inconsistent with modifier or patient age", count: 9, topPayor: "Denti-Cal", trending: "up" },
    { code: "OA-18", reason: "Duplicate claim/service", count: 7, topPayor: "Cigna DPPO", trending: "stable" },
    { code: "PR-1", reason: "Deductible amount", count: 14, topPayor: "MetLife PDP Plus", trending: "stable" },
  ] as DenialReason[],

  aiSuggestions: [
    {
      icon: "🚨",
      title: "Denti-Cal payment times increasing",
      detail: "Denti-Cal avg days-to-pay rose from 42d to 45d over the last 3 months, a 7% increase. This correlates with a 15% rise in CO-16 denials (missing info). Recommend pre-submission validation checks for Denti-Cal claims to ensure all required attachments (x-rays, narratives) are included before filing.",
      priority: "high",
      category: "Payment Velocity",
      estimatedImpact: "Save 3–5 days avg payment time",
      dataPoints: 89,
    },
    {
      icon: "📋",
      title: "Age-related CDT code errors causing preventable denials",
      detail: "9 denials (CO-4) in the last 6 months were due to age-inappropriate CDT codes — mostly D1110 billed for patients under 15. The Treatment Plan Correlation module catches these, but 4 claims bypassed correlation. Recommend making CDT validation mandatory before filing.",
      priority: "high",
      category: "Denial Prevention",
      estimatedImpact: "Prevent ~$2,400/quarter in denied revenue",
      dataPoints: 241,
    },
    {
      icon: "⏱️",
      title: "Delta PPO filing deadline approaching for 3 claims",
      detail: "Delta Dental PPO has a 90-day filing limit. 3 accepted claims (CLM-2026-00287, and 2 others) are at 68+ days. Prioritize follow-up or resubmission within the next 3 weeks to avoid CO-29 denials.",
      priority: "medium",
      category: "Filing Compliance",
      estimatedImpact: "Protect $3,180 in pending revenue",
      dataPoints: 62,
    },
    {
      icon: "💡",
      title: "MetLife consistently pays fastest — optimize batch scheduling",
      detail: "MetLife pays in 14 days avg (8d fastest), 2x faster than the next payor. Consider batching MetLife claims weekly instead of bi-weekly to accelerate cash flow. Their electronic processing is most efficient when claims are submitted Mon–Wed.",
      priority: "low",
      category: "Revenue Optimization",
      estimatedImpact: "Accelerate ~$4,200/month cash flow",
      dataPoints: 47,
    },
    {
      icon: "🔄",
      title: "Duplicate claim submissions to Cigna detected",
      detail: "7 OA-18 (duplicate) denials from Cigna DPPO in 6 months suggest a workflow issue. Pattern analysis shows duplicates occur when claims are manually resubmitted within 48 hours of initial filing. Recommend adding a 72-hour cooldown warning before allowing resubmission to the same payor.",
      priority: "medium",
      category: "Process Improvement",
      estimatedImpact: "Reduce duplicate denials by ~80%",
      dataPoints: 31,
    },
  ] as AISuggestion[],
};
