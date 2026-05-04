import { useState, useMemo } from "react";
import { ClaimBadge } from "./Badge";
import { StatCard } from "./StatCard";
import { fmtCurrency, type DeniedClaim } from "@/data/claims-data";

interface PreventionEngineProps {
  claims: DeniedClaim[];
}

interface ValidationRule {
  id: string;
  name: string;
  category: "documentation" | "coding" | "compliance" | "billing";
  severity: "critical" | "high" | "medium";
  description: string;
  check: (claim: DeniedClaim) => { pass: boolean; detail: string };
}

interface ClaimValidation {
  claim: DeniedClaim;
  results: { rule: ValidationRule; pass: boolean; detail: string }[];
  score: number;
  passCount: number;
  failCount: number;
}

const VALIDATION_RULES: ValidationRule[] = [
  {
    id: "V001",
    name: "SOAP Note Present",
    category: "documentation",
    severity: "critical",
    description: "Verify SOAP note is attached to claim with all four sections (S, O, A, P) completed",
    check: (c) => {
      const missing = c.issues.some((i) => /soap|narrative/i.test(i) && /missing|not attached|incomplete/i.test(i));
      return { pass: !missing, detail: missing ? "SOAP note missing or incomplete — attach complete note before submission" : "SOAP note verified present" };
    },
  },
  {
    id: "V002",
    name: "Emergency Certification (Title 22)",
    category: "compliance",
    severity: "critical",
    description: "CCR §51056(b) emergency certification statement must be present for ER GA claims",
    check: (c) => {
      const missing = c.issues.some((i) => /emergency.*narrative|emergency.*cert|TAR/i.test(i));
      return { pass: !missing, detail: missing ? "Missing Title 22 emergency certification — TAR waiver statement required" : "Emergency certification present" };
    },
  },
  {
    id: "V003",
    name: "GA Medical Necessity Criteria",
    category: "compliance",
    severity: "critical",
    description: "Narrative must address criteria (i)+(ii) and at least one of (iii)-(vi) per Denti-Cal MOC",
    check: (c) => {
      const fail = c.denialCode === "ARC 071" || c.issues.some((i) => /criteria|medically necessary|medical necessity/i.test(i));
      return { pass: !fail, detail: fail ? "GA criteria (i)+(ii) + one of (iii)-(vi) not addressed in narrative" : "Medical necessity criteria adequately documented" };
    },
  },
  {
    id: "V004",
    name: "Anesthesia Record Complete",
    category: "documentation",
    severity: "high",
    description: "Anesthesia record must include agent, dosage, route, and start/end times",
    check: (c) => {
      const fail = c.denialCode === "ARC 062" || c.issues.some((i) => /anesthetic|anesthesia record/i.test(i));
      return { pass: !fail, detail: fail ? "Anesthesia record missing agent, dosage, or monitoring data" : "Anesthesia record complete" };
    },
  },
  {
    id: "V005",
    name: "Dental Procedures on Claim",
    category: "billing",
    severity: "critical",
    description: "D9222/D9223 must be billed alongside dental treatment codes (D2930, D7140, etc.)",
    check: (c) => {
      const fail = c.denialCode === "ARC 069" || c.issues.some((i) => /no associated dental|D9222.*without/i.test(i));
      return { pass: !fail, detail: fail ? "GA codes billed without associated dental procedures — add treatment codes" : "Dental procedure codes present on claim" };
    },
  },
  {
    id: "V006",
    name: "Radiographs Attached",
    category: "documentation",
    severity: "high",
    description: "Radiographs must be attached as EDI document for claims with restorative/surgical procedures",
    check: (c) => {
      const fail = c.issues.some((i) => /radiograph/i.test(i));
      return { pass: !fail, detail: fail ? "Radiographs not attached — required for EDI submission" : "Radiographs attached" };
    },
  },
  {
    id: "V007",
    name: "Frankl Behavior Scale Recorded",
    category: "documentation",
    severity: "medium",
    description: "Frankl Behavior Rating Scale must be documented for pediatric GA justification",
    check: (c) => {
      const fail = c.issues.some((i) => /frankl/i.test(i));
      return { pass: !fail, detail: fail ? "Frankl Behavior Scale not recorded — required for GA justification" : "Frankl scale documented" };
    },
  },
  {
    id: "V008",
    name: "Step Therapy Documentation",
    category: "compliance",
    severity: "high",
    description: "Prior attempts at lesser sedation/behavior management must be documented with dates",
    check: (c) => {
      const fail = c.issues.some((i) => /step therapy|behavior management date|previous attempt/i.test(i));
      return { pass: !fail, detail: fail ? "Step therapy not documented — provide dates of prior sedation/behavior attempts" : "Step therapy attempts documented" };
    },
  },
  {
    id: "V009",
    name: "ICD-10 Diagnostic Codes",
    category: "coding",
    severity: "medium",
    description: "Appropriate ICD-10 codes must be present (K02.x for caries, K04.x for pulpal, etc.)",
    check: (c) => {
      const fail = c.issues.some((i) => /ICD-10/i.test(i));
      return { pass: !fail, detail: fail ? "ICD-10 diagnostic codes missing — add K02.x, K04.x, or relevant codes" : "ICD-10 codes present" };
    },
  },
  {
    id: "V010",
    name: "Tooth Charting Consistency",
    category: "coding",
    severity: "medium",
    description: "Tooth numbers in treatment plan must match charted findings and radiographic evidence",
    check: (c) => {
      const fail = c.issues.some((i) => /tooth charting|doesn't match/i.test(i));
      return { pass: !fail, detail: fail ? "Tooth charting inconsistent with narrative or radiographs" : "Tooth charting consistent" };
    },
  },
  {
    id: "V011",
    name: "Primary/Secondary EOB",
    category: "billing",
    severity: "high",
    description: "Secondary claims must include EOB from primary carrier",
    check: (c) => {
      const isSecondary = c.type === "SEC";
      const eobMissing = c.issues.some((i) => /EOB/i.test(i));
      if (!isSecondary) return { pass: true, detail: "Primary claim — EOB check not applicable" };
      return { pass: !eobMissing, detail: eobMissing ? "Secondary claim missing EOB from primary carrier" : "EOB from primary carrier attached" };
    },
  },
];

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  documentation: { label: "Documentation", color: "info" },
  coding: { label: "Coding", color: "pending" },
  compliance: { label: "Compliance", color: "critical" },
  billing: { label: "Billing", color: "high" },
};

export const PreventionEngine = ({ claims }: PreventionEngineProps) => {
  const [selectedClaim, setSelectedClaim] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [scanComplete, setScanComplete] = useState(false);
  const [scanning, setScanning] = useState(false);
  // F-06 — Track which rules a user has marked resolved per claim, keyed by claim.id.
  // Resolved rules are treated as passing in the validations useMemo below.
  // State is ephemeral (refresh resets) — backend persistence comes in F-06 session 2.
  const [resolvedRules, setResolvedRules] = useState<Record<string, Set<string>>>({});

  const markResolved = (claimId: string, ruleId: string) => {
    setResolvedRules((prev) => {
      const claimSet = prev[claimId] ? new Set(prev[claimId]) : new Set<string>();
      claimSet.add(ruleId);
      return { ...prev, [claimId]: claimSet };
    });
  };

  const validations = useMemo<ClaimValidation[]>(() => {
    return claims.filter((c) => c.status === "denied").map((claim) => {
      const claimResolved = resolvedRules[claim.id];
      const results = VALIDATION_RULES.map((rule) => {
        const { pass, detail } = rule.check(claim);
        // F-06: Override pass=true for any rule the user has marked resolved on this claim.
        if (claimResolved && claimResolved.has(rule.id)) {
          return { rule, pass: true, detail: `${detail} (Marked resolved)` };
        }
        return { rule, pass, detail };
      });
      const passCount = results.filter((r) => r.pass).length;
      return {
        claim,
        results,
        score: Math.round((passCount / results.length) * 100),
        passCount,
        failCount: results.length - passCount,
      };
    });
  }, [claims, resolvedRules]);

  const handleRunScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setScanComplete(true);
    }, 2000);
  };

  const totalFails = validations.reduce((s, v) => s + v.failCount, 0);
  const criticalFails = validations.reduce((s, v) => s + v.results.filter((r) => !r.pass && r.rule.severity === "critical").length, 0);
  const atRiskAmount = validations.filter((v) => v.failCount > 0).reduce((s, v) => s + v.claim.billedAmt, 0);
  const cleanClaims = validations.filter((v) => v.failCount === 0).length;

  const selectedValidation = validations.find((v) => v.claim.id === selectedClaim);

  const filteredResults = selectedValidation
    ? selectedValidation.results.filter((r) => filterSeverity === "all" || r.rule.severity === filterSeverity)
    : [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-black text-foreground flex items-center gap-2">
            <span className="text-xl">🛡️</span> Prevention Engine
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Pre-flight validation checks V001–V011 • Catch denial triggers before submission
          </p>
        </div>
        <button
          onClick={handleRunScan}
          disabled={scanning}
          className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all shadow-lg ${
            scanning
              ? "bg-primary/50 text-primary-foreground cursor-wait"
              : "bg-primary hover:bg-teal-light text-primary-foreground shadow-teal-900/40"
          }`}
        >
          {scanning ? (
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Scanning {claims.filter((c) => c.status === "denied").length} claims…
            </span>
          ) : scanComplete ? (
            "Re-run Full Scan ↻"
          ) : (
            "Run Pre-Flight Scan →"
          )}
        </button>
      </div>

      {!scanComplete && !scanning && (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <div className="text-5xl mb-4">🛡️</div>
          <h3 className="text-base font-bold text-secondary-foreground mb-2">Pre-Flight Claim Validation</h3>
          <p className="text-xs text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Run the Prevention Engine to scan all denied claims against 11 validation checks (V001–V011)
            covering documentation, coding, compliance, and billing requirements. Catch denial triggers
            before resubmission.
          </p>
          <div className="mt-6 grid grid-cols-4 gap-3 max-w-2xl mx-auto">
            {Object.entries(CATEGORY_META).map(([key, meta]) => (
              <div key={key} className="bg-surface-2 border border-border rounded-xl p-3 text-center">
                <ClaimBadge variant={meta.color as any}>{meta.label}</ClaimBadge>
                <div className="text-[10px] text-muted-foreground mt-2">
                  {VALIDATION_RULES.filter((r) => r.category === key).length} checks
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {scanComplete && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
            <StatCard label="Total Failures" value={totalFails} sub={`across ${validations.length} claims`} color="red" />
            <StatCard label="Critical Failures" value={criticalFails} sub="block resubmission" color="red" />
            <StatCard label="Revenue at Risk" value={fmtCurrency(atRiskAmount)} sub="claims with failures" color="amber" />
            <StatCard label="Clean Claims" value={cleanClaims} sub="ready to resubmit" color="teal" />
            <StatCard label="Gate Status" value={criticalFails > 0 ? "BLOCKED" : "OPEN"} sub={criticalFails > 0 ? "resolve critical issues" : "all gates passed"} color={criticalFails > 0 ? "red" : "teal"} />
          </div>

          {/* Case Closure Gate */}
          {criticalFails > 0 && (
            <div className="bg-destructive/5 border-2 border-destructive/30 rounded-2xl p-4 mb-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center text-sm">🚫</div>
                <div>
                  <h3 className="text-sm font-black text-destructive">Case Closure Gate — BLOCKED</h3>
                  <p className="text-[10px] text-muted-foreground">
                    {criticalFails} critical validation failure{criticalFails > 1 ? "s" : ""} must be resolved before claims can proceed to resubmission
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {validations
                  .filter((v) => v.results.some((r) => !r.pass && r.rule.severity === "critical"))
                  .map((v) => {
                    const criticalRules = v.results.filter((r) => !r.pass && r.rule.severity === "critical");
                    return (
                      <div key={v.claim.id} className="bg-card border border-destructive/20 rounded-xl p-3 flex items-start gap-2.5">
                        <span className="font-mono text-xs font-bold text-teal-light">{v.claim.patientId}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] text-muted-foreground">{v.claim.clinic} • {fmtCurrency(v.claim.billedAmt)}</div>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {criticalRules.map((r) => (
                              <span key={r.rule.id} className="text-[8px] font-mono font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                                {r.rule.id}: {r.rule.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {criticalFails === 0 && cleanClaims > 0 && (
            <div className="bg-emerald-950/20 border-2 border-emerald-500/30 rounded-2xl p-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-sm">✅</div>
                <div>
                  <h3 className="text-sm font-black text-emerald-400">Case Closure Gate — OPEN</h3>
                  <p className="text-[10px] text-muted-foreground">
                    All critical checks passed. {cleanClaims} claim{cleanClaims > 1 ? "s" : ""} fully validated and ready for Denti-Cal resubmission.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Validation Rules Legend */}
          <div className="bg-card border border-border rounded-2xl p-4 mb-5">
            <div className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground mb-3">
              Validation Checks — V001 through V011
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {VALIDATION_RULES.map((rule) => {
                const globalFails = validations.filter((v) => v.results.find((r) => r.rule.id === rule.id && !r.pass)).length;
                return (
                  <div key={rule.id} className="bg-surface-2/60 border border-border rounded-lg p-2.5 flex items-start gap-2.5">
                    <div className="flex flex-col items-center gap-1 min-w-[36px]">
                      <span className="text-[10px] font-mono font-bold text-teal-light">{rule.id}</span>
                      <ClaimBadge variant={rule.severity}>{rule.severity}</ClaimBadge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold text-secondary-foreground">{rule.name}</div>
                      <div className="text-[9px] text-muted-foreground leading-relaxed mt-0.5">{rule.description}</div>
                      {globalFails > 0 && (
                        <div className="text-[9px] text-destructive font-semibold mt-1">
                          ✕ {globalFails} claim{globalFails > 1 ? "s" : ""} failing
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Claims List */}
            <div className="lg:col-span-1">
              <div className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground mb-3">
                Claim Scan Results
              </div>
              <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
                {validations.map((v) => (
                  <button
                    key={v.claim.id}
                    onClick={() => { setSelectedClaim(v.claim.id); setFilterSeverity("all"); }}
                    className={`w-full text-left bg-card border rounded-xl p-3 transition-all ${
                      selectedClaim === v.claim.id
                        ? "border-primary/50 bg-primary/5 ring-1 ring-primary/30"
                        : "border-border hover:border-primary/20 hover:bg-surface-2"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-sm font-bold text-teal-light">{v.claim.patientId}</span>
                      <ScoreBadge score={v.score} />
                    </div>
                    <div className="text-[10px] text-muted-foreground">{v.claim.clinic} • {v.claim.claimDate}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            v.score === 100 ? "bg-emerald-500" : v.score >= 70 ? "bg-amber-500" : "bg-destructive"
                          }`}
                          style={{ width: `${v.score}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-bold text-muted-foreground">{v.passCount}/{VALIDATION_RULES.length}</span>
                    </div>
                    {v.failCount > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {v.results.filter((r) => !r.pass).map((r) => (
                          <span key={r.rule.id} className="text-[8px] font-mono font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                            {r.rule.id}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Detail Panel */}
            <div className="lg:col-span-2">
              {selectedValidation ? (
                <div>
                  {/* Claim Header */}
                  <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-black uppercase tracking-[0.15em] text-teal-light">
                        Pre-Flight Report — Patient {selectedValidation.claim.patientId}
                      </h3>
                      <ScoreBadge score={selectedValidation.score} large />
                    </div>
                    <div className="grid grid-cols-4 gap-3 text-xs">
                      <div><span className="text-muted-foreground text-[10px]">Claim ID:</span><br /><span className="font-mono text-teal-light">{selectedValidation.claim.id}</span></div>
                      <div><span className="text-muted-foreground text-[10px]">DOS:</span><br /><span className="text-secondary-foreground">{selectedValidation.claim.claimDate}</span></div>
                      <div><span className="text-muted-foreground text-[10px]">Denial Code:</span><br /><ClaimBadge variant="critical">{selectedValidation.claim.denialCode}</ClaimBadge></div>
                      <div><span className="text-muted-foreground text-[10px]">Billed:</span><br /><span className="font-mono text-secondary-foreground">{fmtCurrency(selectedValidation.claim.billedAmt)}</span></div>
                    </div>
                  </div>

                  {/* Severity Filter */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Filter:</span>
                    {["all", "critical", "high", "medium"].map((s) => (
                      <button
                        key={s}
                        onClick={() => setFilterSeverity(s)}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
                          filterSeverity === s
                            ? "bg-primary text-primary-foreground"
                            : "bg-surface-2 text-muted-foreground hover:bg-surface-3"
                        }`}
                      >
                        {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>

                  {/* Results */}
                  <div className="space-y-2">
                    {filteredResults.map((r) => (
                      <div
                        key={r.rule.id}
                        className={`border rounded-xl p-3.5 transition-all ${
                          r.pass
                            ? "bg-emerald-950/20 border-emerald-800/30"
                            : "bg-destructive/5 border-destructive/20"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5 ${
                            r.pass ? "bg-emerald-500/20 text-emerald-400" : "bg-destructive/20 text-destructive"
                          }`}>
                            {r.pass ? "✓" : "✕"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-mono font-bold text-teal-light">{r.rule.id}</span>
                              <span className="text-[11px] font-bold text-secondary-foreground">{r.rule.name}</span>
                              <ClaimBadge variant={r.rule.severity}>{r.rule.severity}</ClaimBadge>
                              <ClaimBadge variant={CATEGORY_META[r.rule.category].color as any}>
                                {CATEGORY_META[r.rule.category].label}
                              </ClaimBadge>
                            </div>
                            <p className={`text-[10px] leading-relaxed ${r.pass ? "text-emerald-400/80" : "text-destructive/80"}`}>
                              {r.detail}
                            </p>
                            {!r.pass && selectedValidation && (
                              <button
                                onClick={() => markResolved(selectedValidation.claim.id, r.rule.id)}
                                className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-all"
                              >
                                ✓ Mark Resolved
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary */}
                  {selectedValidation.failCount > 0 && (
                    <div className="mt-4 bg-amber-950/20 border border-amber-800/30 rounded-xl p-3">
                      <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1">⚠ Action Required</div>
                      <p className="text-[10px] text-amber-300/80 leading-relaxed">
                        This claim has {selectedValidation.failCount} failing validation{selectedValidation.failCount > 1 ? "s" : ""}.
                        Resolve all issues before resubmission to avoid re-denial. Use the SOAP Builder (Option A or B) to generate
                        corrected documentation.
                      </p>
                    </div>
                  )}
                  {selectedValidation.failCount === 0 && (
                    <div className="mt-4 bg-emerald-950/20 border border-emerald-800/30 rounded-xl p-3">
                      <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">✓ Ready for Resubmission</div>
                      <p className="text-[10px] text-emerald-300/80 leading-relaxed">
                        All 11 pre-flight checks passed. This claim is ready to be routed for approval and Denti-Cal resubmission.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-card border border-border rounded-2xl p-12 text-center h-full flex flex-col items-center justify-center">
                  <div className="text-3xl mb-3">←</div>
                  <p className="text-xs text-muted-foreground">Select a claim to view its pre-flight validation report</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

function ScoreBadge({ score, large = false }: { score: number; large?: boolean }) {
  const color = score === 100 ? "text-emerald-400 bg-emerald-500/15" : score >= 70 ? "text-amber-400 bg-amber-500/15" : "text-destructive bg-destructive/15";
  return (
    <span className={`${color} font-mono font-black rounded-lg ${large ? "text-sm px-3 py-1" : "text-[10px] px-2 py-0.5"}`}>
      {score}%
    </span>
  );
}
