import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { StatCard } from "@/components/claims/StatCard";
import { EligibilityVerification } from "./EligibilityVerification";
import { TreatmentPlanCorrelation } from "./TreatmentPlanCorrelation";
import { PreAuthorization } from "./PreAuthorization";
import { PatientCostEstimation } from "./PatientCostEstimation";
import { ClaimsFiling } from "./ClaimsFiling";
import { PaymentTracking } from "./PaymentTracking";
import { PayorRulesEngine } from "./PayorRulesEngine";
import { PayorConfigManagement } from "./PayorConfigManagement";
import { RCMAnalytics } from "./RCMAnalytics";
import { MOCK_FILED_CLAIMS, MOCK_PREAUTHS, fmtUSD } from "@/data/rcm-data";

const stages = [
  { id: "analytics", num: "📈", label: "Analytics & AI Insights", icon: "", desc: "Payor speed rankings, payment trends, denial tracking, AI recommendations" },
  { id: "eligibility", num: "1", label: "Eligibility & Verification", icon: "🔍", desc: "Verify patient insurance coverage ahead of appointment" },
  { id: "treatment", num: "2", label: "Treatment Plan Correlation", icon: "📋", desc: "Correlate treatment plan with CDT codes, flag errors" },
  { id: "preauth", num: "3", label: "Pre-authorization", icon: "📝", desc: "Auto-submit pre-auth when required by payor rules" },
  { id: "cost", num: "4", label: "Patient Cost Estimation", icon: "💰", desc: "Calculate insurance vs. patient portion, present payment options" },
  { id: "filing", num: "5", label: "Claims Filing", icon: "📤", desc: "File claims electronically with tracking" },
  { id: "tracking", num: "6", label: "Payment Tracking", icon: "📊", desc: "Track submission-to-payment timelines, ERA auto-matching" },
  { id: "denial", num: "7", label: "Denial Management & Resubmission", icon: "🔄", desc: "Denied claims recovery — see Claims Recovery tabs" },
  { id: "rules", num: "⚙", label: "Payor Rules Engine", icon: "", desc: "Multi-payor rules reference and configuration" },
  { id: "config", num: "🔧", label: "Payor Configuration", icon: "", desc: "Admin — define and edit rules per insurance carrier" },
];

export const InsuranceRCM = () => {
  const totalCollected = MOCK_FILED_CLAIMS.filter((c) => c.status === "paid").reduce((s, c) => s + (c.paidAmount || 0), 0);
  const pendingPreAuths = MOCK_PREAUTHS.filter((p) => p.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Claims Filed" value={MOCK_FILED_CLAIMS.length} sub="this period" color="teal" />
        <StatCard label="Revenue Collected" value={fmtUSD(totalCollected)} color="emerald" />
        <StatCard label="Pre-Auths Pending" value={pendingPreAuths} color="amber" />
        <StatCard label="Avg Days to Pay" value="30d" sub="across all payors" color="sky" />
      </div>

      {/* Pipeline Accordion */}
      <Accordion type="single" collapsible className="space-y-2">
        {stages.map((stage) => (
          <AccordionItem key={stage.id} value={stage.id} className="border border-border rounded-xl overflow-hidden bg-surface-1/50">
            <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-surface-1/80">
              <div className="flex items-center gap-3 text-left">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                  {stage.icon || stage.num}
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">
                    <span className="text-muted-foreground mr-1.5">{stage.num}.</span>
                    {stage.label}
                  </div>
                  <div className="text-[11px] text-muted-foreground">{stage.desc}</div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5">
              {stage.id === "analytics" && <RCMAnalytics />}
              {stage.id === "eligibility" && <EligibilityVerification />}
              {stage.id === "treatment" && <TreatmentPlanCorrelation />}
              {stage.id === "preauth" && <PreAuthorization />}
              {stage.id === "cost" && <PatientCostEstimation />}
              {stage.id === "filing" && <ClaimsFiling />}
              {stage.id === "tracking" && <PaymentTracking />}
              {stage.id === "denial" && (
                <div className="text-sm text-muted-foreground p-4 bg-surface-1 border border-border rounded-xl">
                  <p className="font-semibold text-foreground mb-1">→ See Claims Recovery tabs (Upload → Review → Sign)</p>
                  <p>Denied claims are processed through the existing SOAP addendum generation and approval pipeline. The Claims Recovery module handles denial analysis, SOAP note generation, approval workflows, and Denti-Cal resubmission.</p>
                </div>
              )}
              {stage.id === "rules" && <PayorRulesEngine />}
              {stage.id === "config" && <PayorConfigManagement />}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};
