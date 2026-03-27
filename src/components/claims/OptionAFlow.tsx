import { useState, useRef, useEffect } from "react";
import { ClaimBadge } from "./Badge";
import { SOAPForm } from "./SOAPForm";
import { fmtCurrency, type DeniedClaim } from "@/data/claims-data";

interface OptionAFlowProps {
  claims: DeniedClaim[];
  onSubmitApproval: (claim: DeniedClaim, narrative: string) => void;
  preselectedClaim?: DeniedClaim | null;
  onClearPreselected?: () => void;
}

export const OptionAFlow = ({ claims, onSubmitApproval, preselectedClaim, onClearPreselected }: OptionAFlowProps) => {
  const [selected, setSelected] = useState<DeniedClaim | null>(null);
  const [apiStep, setApiStep] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasAutoStarted = useRef(false);

  const startApiFlow = (claim: DeniedClaim) => {
    setSelected(claim);
    setApiStep(0);
    [1, 2, 3, 4, 5].forEach((s, i) => {
      timerRef.current = setTimeout(() => setApiStep(s), (i + 1) * 1000);
    });
  };

  // Auto-start flow when preselected claim is passed from Dashboard
  useEffect(() => {
    if (preselectedClaim && !hasAutoStarted.current) {
      hasAutoStarted.current = true;
      startApiFlow(preselectedClaim);
      onClearPreselected?.();
    }
  }, [preselectedClaim, onClearPreselected]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const deniedClaims = claims.filter((c) => c.status === "denied");

  if (!selected) {
    return (
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-black text-foreground">Option A: API Integration Flow</h2>
          <p className="text-xs text-muted-foreground mt-1">Open Dental API → AI Chart Scanner → SOAP Addendum Generator → Approval Router → Denti-Cal Resubmission</p>
        </div>
        <div className="space-y-2">
          {deniedClaims.map((c) => (
            <div key={c.id} onClick={() => startApiFlow(c)} className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:bg-surface-2 cursor-pointer transition-all flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <span className="font-mono text-teal-light text-sm font-bold">{c.patientId}</span>
                <div>
                  <div className="text-sm text-secondary-foreground">{c.clinic} • {c.claimDate}</div>
                  <div className="text-[10px] text-muted-foreground">{c.issues.length} issues • {c.denialCode}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ClaimBadge variant={c.priority as any}>{c.priority}</ClaimBadge>
                <span className="font-mono text-sm text-secondary-foreground">{fmtCurrency(c.billedAmt)}</span>
                <span className="text-[10px] text-teal-light font-bold opacity-0 group-hover:opacity-100 transition-opacity">Run AI Scan →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => { setSelected(null); setApiStep(0); }} className="text-xs text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">← Back to claim list</button>

      {/* API Flow Steps */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-1 mb-4">
          {["Pull Chart", "Scan Notes", "Identify Issues", "Build SOAP", "Route Approval"].map((step, i) => (
            <div key={i} className="flex items-center gap-1.5 flex-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-700 ${apiStep > i ? "bg-primary text-primary-foreground" : apiStep === i ? "bg-primary/20 text-teal-light ring-2 ring-primary/50 animate-pulse" : "bg-surface-3 text-muted-foreground"}`}>
                {apiStep > i ? "✓" : i + 1}
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-wider hidden lg:inline ${apiStep >= i ? "text-teal-light" : "text-muted-foreground"}`}>{step}</span>
              {i < 4 && <div className={`flex-1 h-px transition-all duration-500 ${apiStep > i ? "bg-primary" : "bg-surface-3"}`} />}
            </div>
          ))}
        </div>

        {apiStep >= 1 && (
          <div className="bg-surface-2 rounded-lg p-3 mb-2 border border-border text-xs">
            <span className="text-[9px] font-bold text-teal-light uppercase tracking-widest">⚡ Open Dental API Call</span>
            <span className="text-[9px] text-muted-foreground ml-2 font-mono">GET /chartmodules/{selected.patientId}/ProgNotes</span>
          </div>
        )}
      </div>

      {apiStep >= 4 && <SOAPForm claim={selected} showApiEndpoints onSubmitApproval={onSubmitApproval} />}
    </div>
  );
};
