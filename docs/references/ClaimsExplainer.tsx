import { useState } from "react";

const COLORS = {
  bg: "#0B1120",
  card: "#131B2E",
  cardHover: "#1A2540",
  border: "#1E2D4A",
  accent: "#3B82F6",
  accentLight: "#60A5FA",
  green: "#10B981",
  greenBg: "#10B98118",
  orange: "#F59E0B",
  orangeBg: "#F59E0B18",
  red: "#EF4444",
  redBg: "#EF444418",
  purple: "#8B5CF6",
  purpleBg: "#8B5CF618",
  cyan: "#06B6D4",
  cyanBg: "#06B6D418",
  text: "#E2E8F0",
  textMuted: "#94A3B8",
  textDim: "#64748B",
  white: "#FFFFFF",
};

const phases = [
  {
    id: 1,
    label: "ELIGIBILITY & VERIFICATION",
    icon: "🔍",
    status: "covered",
    color: COLORS.green,
    bg: COLORS.greenBg,
    description: "Check patient coverage, benefits, frequency limits, and remaining maximums before treatment",
    currentState: "Partially automated — most practices still call payers or use portal logins manually",
    players: [
      { name: "Stedi", role: "Standard EDI 270/271 eligibility", fit: "partner" },
      { name: "Zuub", role: "Direct payer API + AI parsing, enriched benefits", fit: "partner" },
      { name: "Tuuthfairy", role: "GraphQL API, hybrid EDI+scraping normalization", fit: "partner" },
      { name: "DentalXChange", role: "Enhanced eligibility + Eligibility AI", fit: "backup" },
      { name: "pVerify", role: "Portal scraping for non-EDI payers", fit: "reference" },
      { name: "Pearl Precheck", role: "NLP multi-source aggregation", fit: "competitor" },
      { name: "Weave WIE", role: "RPA-based portal scraping", fit: "competitor" },
    ],
  },
  {
    id: 2,
    label: "PRE-SUBMISSION OPTIMIZATION",
    icon: "🧠",
    status: "gap",
    color: COLORS.orange,
    bg: COLORS.orangeBg,
    description: "AI validates claim data, predicts denial risk, attaches required evidence, and optimizes CDT coding before submission",
    currentState: "Almost nobody does this well — Pearl's Claimcheck (March 2025) is the only real attempt",
    players: [
      { name: "Pearl Claimcheck", role: "AI pre-submission coding validation", fit: "competitor" },
      { name: "Overjet ReviewPASS", role: "X-ray evidence linking to CDT codes", fit: "competitor" },
      { name: "DentaMind MARVA", role: "AI denial prediction + auto-optimization", fit: "dentamind" },
    ],
  },
  {
    id: 3,
    label: "CLAIM SUBMISSION",
    icon: "📤",
    status: "covered",
    color: COLORS.green,
    bg: COLORS.greenBg,
    description: "Submit 837D dental claim + attachments (X-rays, perio charts, narratives) to payer via clearinghouse",
    currentState: "Well-served by clearinghouses — commodity infrastructure",
    players: [
      { name: "Stedi", role: "JSON-native 837D submission + 275 attachments", fit: "partner" },
      { name: "DentalXChange", role: "30-year dental clearinghouse, 41K offices", fit: "backup" },
      { name: "DentalXChange", role: "Attachment routing with payer-level validation ($25/mo/location)", fit: "partner" },
      { name: "Change Healthcare", role: "Largest but trust-damaged post-breach", fit: "avoid" },
      { name: "Availity", role: "Free portal, REST API exists", fit: "reference" },
      { name: "Office Ally", role: "Free claims submission", fit: "reference" },
    ],
  },
  {
    id: 4,
    label: "CLAIM STATUS TRACKING",
    icon: "📊",
    status: "partial",
    color: COLORS.orange,
    bg: COLORS.orangeBg,
    description: "Monitor claim through adjudication — track where it is, flag aging claims, detect stalls",
    currentState: "Basic EDI 276/277 exists but no AI-driven proactive monitoring or escalation",
    players: [
      { name: "Stedi", role: "Real-time 276/277 claim status API", fit: "partner" },
      { name: "DentalXChange", role: "Status tracking via ClaimConnect", fit: "backup" },
      { name: "DentaMind MARVA", role: "AI-driven aging alerts + payer behavior prediction", fit: "dentamind" },
    ],
  },
  {
    id: 5,
    label: "ERA / EOB PROCESSING",
    icon: "💰",
    status: "covered",
    color: COLORS.green,
    bg: COLORS.greenBg,
    description: "Receive and parse 835 ERA — payment, adjustment, denial codes — and post to patient ledger",
    currentState: "Clearinghouses deliver 835s; PMS auto-posting varies widely in accuracy",
    players: [
      { name: "Stedi", role: "835 ERA via webhooks, JSON-parsed", fit: "partner" },
      { name: "DentalXChange", role: "ERA delivery + reconciliation", fit: "backup" },
      { name: "DentaMind MARVA", role: "AI-powered ERA analysis + auto-posting intelligence", fit: "dentamind" },
    ],
  },
  {
    id: 6,
    label: "DENIAL MANAGEMENT & APPEALS",
    icon: "⚠️",
    status: "gap",
    color: COLORS.red,
    bg: COLORS.redBg,
    description: "Identify denial root cause, generate appeal with clinical evidence, resubmit with payer-specific strategy",
    currentState: "THE BIGGEST GAP — almost entirely manual across the industry. Most practices write off denied claims.",
    players: [
      { name: "Waystar AltitudeAI", role: "Medical denial prediction (not dental)", fit: "reference" },
      { name: "Candid Health", role: "Medical RCM automation (no dental)", fit: "reference" },
      { name: "Toothy AI (YC W25)", role: "Early-stage dental AI billing agent", fit: "competitor" },
      { name: "DentaMind MARVA", role: "AI denial root-cause + auto-appeal generation", fit: "dentamind" },
    ],
  },
  {
    id: 7,
    label: "REVENUE RECOVERY & ANALYTICS",
    icon: "📈",
    status: "gap",
    color: COLORS.red,
    bg: COLORS.redBg,
    description: "Identify systematic revenue leakage — underpayments, missed filings, expired claims — and recover lost revenue",
    currentState: "NO existing product does this for dental. Practices don't know what they're losing.",
    players: [
      { name: "Dental Intelligence", role: "Descriptive analytics only, no recovery engine", fit: "reference" },
      { name: "Jarvis Analytics", role: "Dashboard reporting, no claims intelligence", fit: "reference" },
      { name: "DentaMind MARVA", role: "Predictive revenue recovery + EBITDA Delta engine", fit: "dentamind" },
    ],
  },
];

const partnershipCosts = [
  { partner: "Stedi", role: "Primary clearinghouse (claims, ERA, status, eligibility)", cost: "$500", unit: "/month base", note: "+ per-transaction fees (negotiable at volume)" },
  { partner: "Zuub / Tuuthfairy", role: "Dental eligibility enrichment API (portal scraping + normalization)", cost: "$40-200", unit: "/month", note: "Zuub ~$40-125/mo. Tuuthfairy pricing TBD — evaluate both" },
  { partner: "DentalXChange", role: "Attachments + fallback clearinghouse", cost: "$25", unit: "/location/month", note: "Attachments $25/mo/location. Claims $0.25 each. No monthly minimum." },
  { partner: "Azure infrastructure", role: "AI compute, database, hosting", cost: "$800-2,000", unit: "/month est.", note: "Scales with practice count" },
];

function StatusBadge({ status }: { status: string }) {
  const config = {
    covered: { label: "INFRASTRUCTURE EXISTS", color: COLORS.green, bg: COLORS.greenBg },
    partial: { label: "PARTIALLY COVERED", color: COLORS.orange, bg: COLORS.orangeBg },
    gap: { label: "MAJOR MARKET GAP", color: COLORS.red, bg: COLORS.redBg },
  };
  const c = (config as Record<string, any>)[status];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: c.color, background: c.bg, border: `1px solid ${c.color}30`, padding: "3px 10px", borderRadius: 4 }}>
      {c.label}
    </span>
  );
}

function FitBadge({ fit }: { fit: string }) {
  const config = {
    partner: { label: "PARTNER", color: COLORS.accent, bg: "#3B82F618" },
    dentamind: { label: "DENTAMIND", color: COLORS.cyan, bg: COLORS.cyanBg },
    competitor: { label: "COMPETITOR", color: COLORS.purple, bg: COLORS.purpleBg },
    backup: { label: "BACKUP", color: COLORS.orange, bg: COLORS.orangeBg },
    reference: { label: "REFERENCE", color: COLORS.textDim, bg: "#64748B18" },
    avoid: { label: "AVOID", color: COLORS.red, bg: COLORS.redBg },
  };
  const c = (config as Record<string, any>)[fit];
  return (
    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.8, color: c.color, background: c.bg, padding: "2px 6px", borderRadius: 3 }}>
      {c.label}
    </span>
  );
}

function PhaseCard({ phase, isOpen, onClick }: { phase: any; isOpen: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: isOpen ? COLORS.cardHover : COLORS.card,
        border: `1px solid ${isOpen ? phase.color + "40" : COLORS.border}`,
        borderRadius: 10,
        padding: "16px 20px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        marginBottom: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
          <div style={{ fontSize: 22, width: 36, textAlign: "center" }}>{phase.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.white, letterSpacing: 0.5 }}>
                {phase.id}. {phase.label}
              </span>
              <StatusBadge status={phase.status} />
            </div>
            <p style={{ fontSize: 12, color: COLORS.textMuted, margin: "4px 0 0", lineHeight: 1.4 }}>
              {phase.description}
            </p>
          </div>
        </div>
        <span style={{ fontSize: 18, color: COLORS.textDim, transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▾</span>
      </div>

      {isOpen && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${COLORS.border}` }}>
          <div style={{ background: phase.bg, border: `1px solid ${phase.color}20`, borderRadius: 6, padding: 12, marginBottom: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: phase.color, margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Current State</p>
            <p style={{ fontSize: 12, color: COLORS.text, margin: "4px 0 0", lineHeight: 1.5 }}>{phase.currentState}</p>
          </div>
          <p style={{ fontSize: 11, fontWeight: 600, color: COLORS.textDim, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 0.5 }}>Players in this phase</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {phase.players.map((p: any, i: number) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: p.fit === "dentamind" ? COLORS.cyanBg : "#0F172A", borderRadius: 6, border: p.fit === "dentamind" ? `1px solid ${COLORS.cyan}30` : "1px solid transparent" }}>
                <FitBadge fit={p.fit} />
                <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.white, minWidth: 100 }}>{p.name}</span>
                <span style={{ fontSize: 11, color: COLORS.textMuted }}>{p.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClaimsExplainer() {
  const [openPhase, setOpenPhase] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("lifecycle");

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', 'Segoe UI', system-ui, sans-serif", background: COLORS.bg, minHeight: "100vh", color: COLORS.text, padding: "24px 16px" }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ maxWidth: 800, margin: "0 auto 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.cyan, letterSpacing: 1.5, textTransform: "uppercase" }}>DentaMind Claims Recovery</span>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: COLORS.white, margin: "0 0 8px", lineHeight: 1.2 }}>
          The Dental Claims Lifecycle
        </h1>
        <p style={{ fontSize: 14, color: COLORS.textMuted, margin: 0, lineHeight: 1.6 }}>
          7 phases from eligibility to revenue recovery. The industry covers phases 1, 3, and 5 with commodity infrastructure.
          <strong style={{ color: COLORS.red }}> Phases 2, 6, and 7 are wide open</strong> — that's where DentaMind wins.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ maxWidth: 800, margin: "0 auto 20px", display: "flex", gap: 4, background: COLORS.card, borderRadius: 8, padding: 4, border: `1px solid ${COLORS.border}` }}>
        {[
          { id: "lifecycle", label: "Claims Lifecycle" },
          { id: "intelligence", label: "Intelligence Engine" },
          { id: "architecture", label: "Architecture" },
          { id: "costs", label: "Cost Model" },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              flex: 1,
              padding: "10px 12px",
              background: activeTab === t.id ? COLORS.accent : "transparent",
              color: activeTab === t.id ? COLORS.white : COLORS.textMuted,
              border: "none",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        {/* TAB 1: Lifecycle */}
        {activeTab === "lifecycle" && (
          <>
            {/* Visual Pipeline */}
            <div style={{ display: "flex", gap: 3, marginBottom: 20, padding: "0 4px" }}>
              {phases.map(p => (
                <div
                  key={p.id}
                  onClick={() => setOpenPhase(openPhase === p.id ? null : p.id)}
                  style={{
                    flex: 1,
                    height: 6,
                    borderRadius: 3,
                    background: p.status === "covered" ? COLORS.green : p.status === "partial" ? COLORS.orange : COLORS.red,
                    opacity: openPhase === p.id ? 1 : 0.5,
                    cursor: "pointer",
                    transition: "opacity 0.2s",
                  }}
                />
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, padding: "0 4px" }}>
              <div style={{ display: "flex", gap: 16 }}>
                {[
                  { color: COLORS.green, label: "Infrastructure exists" },
                  { color: COLORS.orange, label: "Partially covered" },
                  { color: COLORS.red, label: "Market gap — DentaMind opportunity" },
                ].map((l, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />
                    <span style={{ fontSize: 10, color: COLORS.textMuted }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {phases.map(p => (
              <PhaseCard
                key={p.id}
                phase={p}
                isOpen={openPhase === p.id}
                onClick={() => setOpenPhase(openPhase === p.id ? null : p.id)}
              />
            ))}

            <div style={{ background: COLORS.cyanBg, border: `1px solid ${COLORS.cyan}30`, borderRadius: 10, padding: 20, marginTop: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: COLORS.cyan, margin: "0 0 8px" }}>The DentaMind Thesis</p>
              <p style={{ fontSize: 12, color: COLORS.text, margin: 0, lineHeight: 1.7 }}>
                Every competitor either provides <strong>infrastructure</strong> (clearinghouses moving EDI transactions) or <strong>point solutions</strong> (Pearl for imaging, Overjet for payer-side AI). Nobody owns the full intelligent lifecycle from eligibility through revenue recovery. DentaMind's Claims Recovery module sits on top of commodity clearinghouse infrastructure and adds the AI intelligence layer that turns claims data into money back in the practice's pocket.
              </p>
            </div>
          </>
        )}

        {/* TAB 2: Intelligence Engine */}
        {activeTab === "intelligence" && (
          <>
            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 20, marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: COLORS.white, margin: "0 0 4px" }}>Attachment Intelligence Engine</p>
              <p style={{ fontSize: 12, color: COLORS.textMuted, margin: "0 0 16px", lineHeight: 1.6 }}>
                Clearinghouses move files. MARVA knows <strong style={{ color: COLORS.cyan }}>which files to send, when to send them, and what to say</strong>. This is DentaMind's core differentiator.
              </p>

              {/* Flow visualization */}
              {[
                {
                  step: "1",
                  title: "Payer Rules Engine",
                  subtitle: "WHAT does the payer require?",
                  color: COLORS.accent,
                  description: "Before a claim leaves DentaMind, MARVA queries a rules database: does this payer require an X-ray for this CDT code on this tooth? What type — periapical, bitewing, pano? Is a narrative required? Rules vary by payer, procedure, tooth position, and sometimes plan type.",
                  dataSource: "Seeded from DentalXChange validation API (payer-level attachment logic down to plan + specialist level), then enriched from denial patterns as claims flow through.",
                  schema: "payer_attachment_rules → payer_id + cdt_code + tooth_position → required_attachment_types[], narrative_required (bool), narrative_style (measurements|functional|clinical)",
                },
                {
                  step: "2",
                  title: "Clinical Document Resolver",
                  subtitle: "WHERE is the evidence?",
                  color: COLORS.green,
                  description: "Given the payer's requirements, MARVA locates the correct clinical documentation. X-rays from imaging software (Dexis, Schick, Apteryx), perio charts from the PMS charting module, and treatment notes from the clinical record.",
                  dataSource: "PMS integration layer (Sikka/NexHealth/direct adapters). MVP: practice uploads manually. Phase 2+: auto-pull from imaging database by patient + tooth + date range.",
                  schema: "attachment_resolver → patient_id + tooth + attachment_type → finds most recent qualifying image/chart, validates recency (within payer's acceptable window, typically 6-12 months)",
                },
                {
                  step: "3",
                  title: "AI Narrative Generator",
                  subtitle: "WHAT should we say?",
                  color: COLORS.purple,
                  description: "When a payer requires a clinical narrative, MARVA generates it from treatment notes — pulling bone loss measurements, caries depth, fracture documentation — and formatting it in the language that specific payer responds to. Different payers respond to different framing.",
                  dataSource: "LLM-powered with payer-specific prompt templates. Training data comes from ERA feedback: when a narrative + attachment combo results in payment, that template gets reinforced for that payer.",
                  schema: "narrative_templates → payer_id + denial_category → narrative_style, key_phrases[], clinical_data_points_required[], historical_approval_rate",
                },
                {
                  step: "4",
                  title: "Pre-Submission Validator",
                  subtitle: "IS the package complete?",
                  color: COLORS.orange,
                  description: "Final checkpoint before claim submission. Validates: all required attachments present, images meet quality/format requirements, narrative addresses payer-specific criteria, CDT codes match clinical documentation. Blocks submission if package is incomplete.",
                  dataSource: "Cross-references steps 1-3 outputs. Flags gaps: 'This claim will be denied — Delta requires a PA for crown on #14 and none is on file from the last 12 months.'",
                  schema: "pre_submit_checklist → claim_id → attachment_status (complete|missing|stale), missing_items[], risk_score (0-100), recommended_actions[]",
                },
                {
                  step: "5",
                  title: "Denial Recovery Loop",
                  subtitle: "What went WRONG and how do we fix it?",
                  color: COLORS.red,
                  description: "When a claim is denied for insufficient documentation (CARC 16, 252), MARVA identifies what was missing, pulls the correct additional documentation, generates an enhanced narrative with payer-specific defense language, and queues a corrected resubmission.",
                  dataSource: "ERA 835 webhook data (CARC/RARC codes). Each denial teaches the system. Over time, MARVA learns that Cigna approves D2740 94% of the time with PA X-ray + 'structural compromise' narrative, but only 61% with X-ray alone.",
                  schema: "denial_feedback_loop → denial_id + carc_code → root_cause, missing_evidence[], enhanced_narrative, resubmit_with_attachments[], predicted_overturn_rate",
                },
              ].map((s, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ background: s.color + "10", border: `1px solid ${s.color}30`, borderRadius: 10, padding: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 14, background: s.color + "25", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: s.color }}>
                        {s.step}
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: COLORS.white, margin: 0 }}>{s.title}</p>
                        <p style={{ fontSize: 11, color: s.color, margin: 0, fontWeight: 600 }}>{s.subtitle}</p>
                      </div>
                    </div>
                    <p style={{ fontSize: 12, color: COLORS.text, margin: "0 0 10px", lineHeight: 1.6 }}>{s.description}</p>
                    <div style={{ background: "#0B1120", borderRadius: 6, padding: 10, marginBottom: 8 }}>
                      <p style={{ fontSize: 10, fontWeight: 600, color: COLORS.textDim, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 0.5 }}>Data Source</p>
                      <p style={{ fontSize: 11, color: COLORS.textMuted, margin: 0, lineHeight: 1.5 }}>{s.dataSource}</p>
                    </div>
                    <div style={{ background: "#0B1120", borderRadius: 6, padding: 10 }}>
                      <p style={{ fontSize: 10, fontWeight: 600, color: COLORS.textDim, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 0.5 }}>Schema / Logic</p>
                      <p style={{ fontSize: 11, color: COLORS.cyan, margin: 0, lineHeight: 1.5, fontFamily: "'IBM Plex Mono', monospace" }}>{s.schema}</p>
                    </div>
                  </div>
                  {i < 4 && (
                    <div style={{ textAlign: "center", padding: "2px 0", color: COLORS.textDim, fontSize: 16 }}>↓</div>
                  )}
                </div>
              ))}
            </div>

            {/* Example scenarios */}
            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 20, marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: COLORS.white, margin: "0 0 14px" }}>Real-World Scenarios</p>
              {[
                {
                  title: "Crown Claim — D2740 on Tooth #14",
                  color: COLORS.accent,
                  steps: [
                    "MARVA checks: Delta Dental CA requires periapical X-ray + clinical narrative for posterior crowns",
                    "Resolver finds: PA X-ray taken 3 weeks ago during treatment planning — valid (within 12-month window)",
                    "Narrative generated: 'Extensive mesial-occlusal-distal decay with compromised structural integrity. Remaining tooth structure insufficient for direct restoration. Porcelain crown selected for functional and occlusal load requirements.'",
                    "Package validated: X-ray ✓, narrative ✓, CDT code matches clinical notes ✓ → SUBMIT via Stedi + DentalXChange attachment",
                  ],
                },
                {
                  title: "SRP Denied — D4341, CARC 16 (Insufficient Info)",
                  color: COLORS.red,
                  steps: [
                    "ERA webhook delivers denial: Cigna rejected scaling/root planing for 'missing clinical documentation'",
                    "MARVA root-cause: No perio chart was attached. Cigna requires pocket depth measurements for D4341",
                    "Resolver pulls: Full perio chart showing 5mm+ pockets in treatment quadrant + FMX showing horizontal bone loss",
                    "Enhanced narrative: Ties pocket measurements to AAP classification, references bone loss on radiographs, adds medical necessity justification",
                    "Resubmission queued with all 3 attachments → human reviews → approved → SUBMIT appeal via Stedi",
                  ],
                },
                {
                  title: "Downgrade Defense — D2740 → D2750",
                  color: COLORS.orange,
                  steps: [
                    "ERA shows MetLife downgraded porcelain crown to metal crown, paying $380 instead of $950",
                    "MARVA generates downgrade defense: Pre-op X-ray showing extent of decay + narrative explaining porcelain is clinically necessary for occlusal function and structural integrity of remaining tooth",
                    "Defense package includes: pre-op PA, post-op PA, clinical narrative with measurements, ADA position statement on material selection",
                    "Appeal submitted — historical success rate for this payer + defense package type: 72%",
                  ],
                },
              ].map((scenario, i) => (
                <div key={i} style={{ background: scenario.color + "08", border: `1px solid ${scenario.color}20`, borderRadius: 8, padding: 14, marginBottom: i < 2 ? 10 : 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: scenario.color, margin: "0 0 10px" }}>{scenario.title}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {scenario.steps.map((step, j) => (
                      <div key={j} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: scenario.color, minWidth: 14, paddingTop: 2 }}>{j + 1}.</span>
                        <p style={{ fontSize: 11, color: COLORS.text, margin: 0, lineHeight: 1.5 }}>{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Feedback loop */}
            <div style={{ background: COLORS.cyanBg, border: `1px solid ${COLORS.cyan}30`, borderRadius: 10, padding: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: COLORS.cyan, margin: "0 0 8px" }}>The Data Flywheel</p>
              <p style={{ fontSize: 12, color: COLORS.text, margin: 0, lineHeight: 1.7 }}>
                Every ERA response teaches MARVA whether the attachment package worked. Over time the system learns that <strong>Cigna approves D2740 claims 94% of the time</strong> with a PA X-ray + narrative mentioning "structural compromise," but only <strong>61% with just the X-ray</strong>. This payer-specific intelligence compounds with every claim processed — creating a moat no clearinghouse can replicate because they see raw transactions, not clinical context.
              </p>
            </div>
          </>
        )}

        {/* TAB 3: Architecture */}
        {activeTab === "architecture" && (
          <>
            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 20, marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: COLORS.white, margin: "0 0 12px" }}>Recommended Partner Stack</p>
              <p style={{ fontSize: 12, color: COLORS.textMuted, margin: "0 0 16px", lineHeight: 1.6 }}>
                Think of it like building a house: Stedi is the plumbing (moves claims/data), DentalXChange provides the specialty fixtures (attachments + fallback routing), Zuub/Tuuthfairy adds the smart sensors (enriched eligibility data from portal scraping), and DentaMind is the smart home system that makes everything intelligent.
              </p>

              {/* Architecture layers */}
              {[
                {
                  layer: "PRESENTATION LAYER",
                  color: COLORS.cyan,
                  items: [
                    { name: "DentaMind Claims Recovery UI", desc: "Standalone Microsoft Marketplace product" },
                    { name: "UIS Health Embedded Module", desc: "Claims intelligence surfaced inside UIS platform" },
                  ],
                },
                {
                  layer: "INTELLIGENCE LAYER — MARVA",
                  color: COLORS.purple,
                  items: [
                    { name: "Pre-Submission Optimizer", desc: "AI validates, predicts denial risk, attaches evidence" },
                    { name: "Denial Pattern Engine", desc: "Learns payer-specific denial patterns from ERA data" },
                    { name: "Auto-Appeal Generator", desc: "Clinical evidence + payer-specific narrative generation" },
                    { name: "Revenue Recovery Scanner", desc: "Identifies underpayments, missed filings, expired claims" },
                    { name: "EBITDA Delta Calculator", desc: "Quantifies recovery impact on practice profitability" },
                  ],
                },
                {
                  layer: "DATA NORMALIZATION LAYER",
                  color: COLORS.accent,
                  items: [
                    { name: "Dental Benefit Normalizer", desc: "CDT-level coverage, frequency limits, downgrades, waiting periods" },
                    { name: "ERA Parser + Auto-Poster", desc: "835 → structured denial codes → patient ledger intelligence" },
                    { name: "Payer Behavior Model", desc: "Historical adjudication patterns by payer × CDT code" },
                  ],
                },
                {
                  layer: "CLEARINGHOUSE LAYER — PARTNERS",
                  color: COLORS.green,
                  items: [
                    { name: "Stedi (Primary)", desc: "837D claims, 270/271 eligibility, 276/277 status, 835 ERA, 275 attachments" },
                    { name: "DentalXChange", desc: "Attachment routing with payer validation + fallback clearinghouse" },
                    { name: "Zuub / Tuuthfairy", desc: "Enriched eligibility via portal scraping + direct payer API automation" },
                  ],
                },
                {
                  layer: "PAYER NETWORK",
                  color: COLORS.textDim,
                  items: [
                    { name: "3,400+ US Dental Payers", desc: "Via Stedi + DentalXChange combined coverage" },
                    { name: "Attachment Routing", desc: "Via DentalXChange payer-level validation + Stedi 275 electronic attachments" },

                  ],
                },
              ].map((layer, i) => (
                <div key={i} style={{ marginBottom: i < 4 ? 8 : 0 }}>
                  <div style={{
                    background: layer.color + "10",
                    border: `1px solid ${layer.color}30`,
                    borderRadius: 8,
                    padding: 14,
                  }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: layer.color, margin: "0 0 10px", letterSpacing: 1, textTransform: "uppercase" }}>
                      {layer.layer}
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {layer.items.map((item, j) => (
                        <div key={j} style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.white, minWidth: 140 }}>{item.name}</span>
                          <span style={{ fontSize: 11, color: COLORS.textMuted }}>{item.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {i < 4 && (
                    <div style={{ textAlign: "center", padding: "2px 0", color: COLORS.textDim, fontSize: 14 }}>↕</div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: COLORS.white, margin: "0 0 8px" }}>Why This Stack Wins</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { reason: "No $2,500/month Vyne tax", detail: "Zuub/Tuuthfairy deliver richer eligibility data at $40-200/month. 90%+ cost reduction.", color: COLORS.green },
                  { reason: "No raw EDI parsing", detail: "Stedi translates EDI to JSON natively. DentalXChange handles attachment routing. Zero X12 expertise needed.", color: COLORS.green },
                  { reason: "No single-vendor dependency", detail: "Three partners with clear swim lanes. If one fails, the others keep claims flowing.", color: COLORS.green },
                  { reason: "Better eligibility data", detail: "Portal scraping (Zuub/Tuuthfairy) captures 80%+ of benefit data that EDI-only approaches miss.", color: COLORS.green },
                  { reason: "Breakeven at ~5 practices", detail: "At ~$1,000-1,500/month infrastructure, you need far fewer practices to reach profitability.", color: COLORS.green },
                ].map((r, i) => (
                  <div key={i} style={{ padding: "8px 12px", background: r.color + "10", border: `1px solid ${r.color}20`, borderRadius: 6 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: r.color, margin: 0 }}>✓ {r.reason}</p>
                    <p style={{ fontSize: 11, color: COLORS.textMuted, margin: "2px 0 0" }}>{r.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* TAB 3: Cost Model */}
        {activeTab === "costs" && (
          <>
            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 20, marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: COLORS.white, margin: "0 0 4px" }}>Estimated Monthly Infrastructure Cost</p>
              <p style={{ fontSize: 11, color: COLORS.textMuted, margin: "0 0 16px" }}>For MVP deployment (5-10 beta practices)</p>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {partnershipCosts.map((c, i) => (
                  <div key={i} style={{ background: COLORS.bg, borderRadius: 8, padding: 14, border: `1px solid ${COLORS.border}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.white }}>{c.partner}</span>
                      <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.accent, fontFamily: "'IBM Plex Mono', monospace" }}>
                        {c.cost}<span style={{ fontSize: 11, fontWeight: 400, color: COLORS.textMuted }}>{c.unit}</span>
                      </span>
                    </div>
                    <p style={{ fontSize: 11, color: COLORS.textMuted, margin: "0 0 2px" }}>{c.role}</p>
                    <p style={{ fontSize: 10, color: COLORS.textDim, margin: 0, fontStyle: "italic" }}>{c.note}</p>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 16, padding: 14, background: COLORS.accentLight + "10", border: `1px solid ${COLORS.accent}30`, borderRadius: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.white }}>Estimated Total (MVP)</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: COLORS.accent, fontFamily: "'IBM Plex Mono', monospace" }}>
                    $1,100–$1,700<span style={{ fontSize: 11, fontWeight: 400, color: COLORS.textMuted }}>/month</span>
                  </span>
                </div>
                <p style={{ fontSize: 11, color: COLORS.textMuted, margin: "6px 0 0" }}>
                  Before per-transaction fees. At scale (100+ practices), Stedi costs become volume-discounted. ~60% less than previous Vyne-based architecture.
                </p>
              </div>
            </div>

            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 20, marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: COLORS.white, margin: "0 0 12px" }}>Revenue Potential vs. Cost</p>
              <p style={{ fontSize: 12, color: COLORS.textMuted, margin: "0 0 16px", lineHeight: 1.6 }}>
                If DentaMind charges $299/month per practice for Claims Recovery, you need just <strong style={{ color: COLORS.green }}>4-6 practices</strong> to cover all infrastructure costs. At 25 practices, gross margin exceeds 80%.
              </p>

              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { practices: "5", revenue: "$1,495", margin: "~10%", color: COLORS.orange },
                  { practices: "10", revenue: "$2,990", margin: "~55%", color: COLORS.green },
                  { practices: "25", revenue: "$7,475", margin: "~81%", color: COLORS.green },
                  { practices: "50", revenue: "$14,950", margin: "~90%", color: COLORS.green },
                ].map((s, i) => (
                  <div key={i} style={{ flex: 1, padding: 12, background: COLORS.bg, borderRadius: 8, textAlign: "center", border: `1px solid ${COLORS.border}` }}>
                    <p style={{ fontSize: 18, fontWeight: 700, color: COLORS.white, margin: 0, fontFamily: "'IBM Plex Mono', monospace" }}>{s.practices}</p>
                    <p style={{ fontSize: 9, color: COLORS.textDim, margin: "2px 0 6px", textTransform: "uppercase", letterSpacing: 0.5 }}>Practices</p>
                    <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.accent, margin: 0 }}>{s.revenue}/mo</p>
                    <p style={{ fontSize: 11, fontWeight: 600, color: s.color, margin: "2px 0 0" }}>Margin: {s.margin}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: COLORS.white, margin: "0 0 12px" }}>Next Steps: Partner Meetings Needed</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { who: "Stedi", priority: "HIGH", action: "Schedule intro call → discuss dental payer coverage, 275 attachment support, enterprise pricing, MCP server integration, HIPAA BAA", url: "stedi.com/contact" },
                  { who: "Zuub", priority: "HIGH", action: "Evaluate REST API for eligibility enrichment → sandbox access, pricing tiers, payer portal coverage depth, webhook support", url: "zuub.com" },
                  { who: "Tuuthfairy", priority: "HIGH", action: "Evaluate GraphQL API for benefit normalization → developer docs, DIA backing, hybrid EDI+scraping coverage", url: "beta-docs.tuuthfairy.com" },
                  { who: "DentalXChange", priority: "MEDIUM", action: "Evaluate XConnect API for attachment routing + fallback clearinghouse. $25/mo/location attachments.", url: "developer.dentalxchange.com" },
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, padding: "10px 12px", background: COLORS.bg, borderRadius: 6, border: `1px solid ${COLORS.border}` }}>
                    <span style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
                      color: s.priority === "HIGH" ? COLORS.red : s.priority === "MEDIUM" ? COLORS.orange : s.priority === "LOW" ? COLORS.green : COLORS.textDim,
                      minWidth: 80, paddingTop: 2,
                    }}>
                      {s.priority}
                    </span>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.white, margin: 0 }}>{s.who}</p>
                      <p style={{ fontSize: 11, color: COLORS.textMuted, margin: "2px 0 0" }}>{s.action}</p>
                      <p style={{ fontSize: 10, color: COLORS.textDim, margin: "2px 0 0", fontFamily: "'IBM Plex Mono', monospace" }}>{s.url}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
