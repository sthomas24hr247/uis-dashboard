import { useState, useMemo } from "react";

// ============================================================================
// DentaMind Claims Recovery — Neural Cartography
// Interactive architecture map showing data flows through the claims lifecycle
// ============================================================================

const NODES = [
  // ===== TOP: Practice entry points =====
  { id: 'solo',     x: 220, y: 80,  r: 28, cluster: 'entry', label: 'Solo practice', sublabel: '1–3 providers' },
  { id: 'group',    x: 400, y: 60,  r: 32, cluster: 'entry', label: 'Group practice', sublabel: '4–15 providers' },
  { id: 'dso',      x: 600, y: 55,  r: 36, cluster: 'entry', label: 'DSO', sublabel: '50–500+ locations' },
  { id: 'market',   x: 800, y: 75,  r: 30, cluster: 'entry', label: 'Azure Marketplace', sublabel: 'Standalone module' },
  { id: 'uis',      x: 960, y: 95,  r: 26, cluster: 'entry', label: 'UIS Platform', sublabel: 'Embedded mode' },

  // ===== L05: Presentation =====
  { id: 'l5', x: 580, y: 195, r: 46, cluster: 'layer', label: 'L05', sublabel: 'Claims Recovery UI', layer: 5 },

  // ===== L04: MARVA Intelligence (THE MOAT) =====
  { id: 'l4', x: 580, y: 340, r: 58, cluster: 'moat', label: 'L04', sublabel: 'MARVA Intelligence', layer: 4 },
  { id: 'l4-pre',    x: 410, y: 380, r: 20, cluster: 'moat-sub', label: 'Pre-submit', parent: 'l4' },
  { id: 'l4-deny',   x: 470, y: 425, r: 20, cluster: 'moat-sub', label: 'Denial AI', parent: 'l4' },
  { id: 'l4-appeal', x: 690, y: 425, r: 20, cluster: 'moat-sub', label: 'Auto-appeal', parent: 'l4' },
  { id: 'l4-recov',  x: 750, y: 380, r: 20, cluster: 'moat-sub', label: 'Recovery', parent: 'l4' },

  // ===== L03: Attachment Intelligence (SECOND MOAT) =====
  { id: 'l3', x: 580, y: 510, r: 50, cluster: 'attach', label: 'L03', sublabel: 'Attachment Intelligence', layer: 3 },
  { id: 'l3-rules',  x: 420, y: 555, r: 18, cluster: 'attach-sub', label: 'Payer rules' },
  { id: 'l3-resolve',x: 510, y: 580, r: 18, cluster: 'attach-sub', label: 'Doc resolver' },
  { id: 'l3-narr',   x: 650, y: 580, r: 18, cluster: 'attach-sub', label: 'Narrative AI' },
  { id: 'l3-valid',  x: 740, y: 555, r: 18, cluster: 'attach-sub', label: 'Validator' },

  // ===== L02: Data Normalization =====
  { id: 'l2', x: 580, y: 670, r: 44, cluster: 'norm', label: 'L02', sublabel: 'Multi-Source Resolver', layer: 2 },

  // ===== L01: Clearinghouse Partners (three paths) =====
  { id: 'stedi',     x: 260, y: 790, r: 44, cluster: 'stedi',  label: 'Stedi', sublabel: 'Primary clearinghouse' },
  { id: 'dxc',       x: 580, y: 800, r: 40, cluster: 'dxc',    label: 'DentalXChange', sublabel: 'Attachments + fallback' },
  { id: 'enrich',    x: 900, y: 790, r: 40, cluster: 'enrich', label: 'Zuub / Tuuthfairy', sublabel: 'Eligibility enrichment' },

  // ===== PAYER NODES — Stedi cluster (left) =====
  { id: 'p-delta',   x: 100, y: 900, r: 24, cluster: 'stedi', label: 'Delta Dental', vol: '80M lives' },
  { id: 'p-cigna',   x: 180, y: 960, r: 22, cluster: 'stedi', label: 'Cigna', vol: '17M' },
  { id: 'p-aetna',   x: 270, y: 980, r: 22, cluster: 'stedi', label: 'Aetna', vol: '14M' },
  { id: 'p-uhc',     x: 360, y: 960, r: 22, cluster: 'stedi', label: 'UHC Dental', vol: '10M' },
  { id: 'p-guard',   x: 150, y: 1020, r: 20, cluster: 'stedi', label: 'Guardian', vol: '8M' },

  // ===== PAYER NODES — DentalXChange cluster (center) =====
  { id: 'p-metlife', x: 480, y: 910, r: 24, cluster: 'dxc', label: 'MetLife', vol: '21M' },
  { id: 'p-humana',  x: 560, y: 940, r: 20, cluster: 'dxc', label: 'Humana', vol: '13M' },
  { id: 'p-bcbs',    x: 650, y: 940, r: 20, cluster: 'dxc', label: 'BCBS', sublabel: '33 plans' },
  { id: 'p-princ',   x: 700, y: 900, r: 18, cluster: 'dxc', label: 'Principal' },

  // ===== PAYER NODES — Enrichment cluster (right) =====
  { id: 'p-dq',      x: 830, y: 900, r: 22, cluster: 'enrich', label: 'DentaQuest', vol: '33M' },
  { id: 'p-mcna',    x: 920, y: 940, r: 20, cluster: 'enrich', label: 'MCNA', vol: '8M' },
  { id: 'p-medcd',   x: 1010, y: 920, r: 20, cluster: 'enrich', label: 'Medicaid', sublabel: '50 states' },
  { id: 'p-amerit',  x: 970, y: 870, r: 16, cluster: 'enrich', label: 'Ameritas' },

  // ===== EDI TRANSACTIONS (bottom row) =====
  { id: 'edi-837',   x: 200, y: 1080, r: 22, cluster: 'edi', label: '837D', sublabel: 'Dental claim' },
  { id: 'edi-270',   x: 340, y: 1090, r: 20, cluster: 'edi', label: '270/271', sublabel: 'Eligibility' },
  { id: 'edi-276',   x: 480, y: 1095, r: 20, cluster: 'edi', label: '276/277', sublabel: 'Claim status' },
  { id: 'edi-835',   x: 620, y: 1095, r: 22, cluster: 'edi', label: '835', sublabel: 'ERA / EOB' },
  { id: 'edi-275',   x: 760, y: 1090, r: 20, cluster: 'edi', label: '275', sublabel: 'Attachments' },
  { id: 'edi-portal',x: 920, y: 1080, r: 22, cluster: 'edi', label: 'Portal scrape', sublabel: 'Non-EDI data' },

  // ===== FEEDBACK LOOP =====
  { id: 'feedback',  x: 960, y: 510, r: 24, cluster: 'feedback', label: 'Feedback loop', sublabel: 'ERA → learns' },
];

const EDGES = [
  // Entry → L05
  { from: 'solo',   to: 'l5', weight: 2, flow: 'all' },
  { from: 'group',  to: 'l5', weight: 3, flow: 'all' },
  { from: 'dso',    to: 'l5', weight: 4, flow: 'all' },
  { from: 'market', to: 'l5', weight: 2, flow: 'all' },
  { from: 'uis',    to: 'l5', weight: 2, flow: 'all' },

  // L05 → L04
  { from: 'l5', to: 'l4', weight: 5, flow: 'all' },

  // L04 sub-agents
  { from: 'l4', to: 'l4-pre',    weight: 2, flow: 'all' },
  { from: 'l4', to: 'l4-deny',   weight: 2, flow: 'denial' },
  { from: 'l4', to: 'l4-appeal', weight: 2, flow: 'denial' },
  { from: 'l4', to: 'l4-recov',  weight: 2, flow: 'denial' },

  // L04 → L03
  { from: 'l4', to: 'l3', weight: 5, flow: 'all', moat: true },

  // L03 sub-agents
  { from: 'l3', to: 'l3-rules',   weight: 2, flow: 'claims' },
  { from: 'l3', to: 'l3-resolve', weight: 2, flow: 'claims' },
  { from: 'l3', to: 'l3-narr',    weight: 2, flow: 'claims' },
  { from: 'l3', to: 'l3-valid',   weight: 2, flow: 'claims' },

  // L03 → L02
  { from: 'l3', to: 'l2', weight: 4, flow: 'all' },

  // L02 → Clearinghouses (three paths)
  { from: 'l2', to: 'stedi',  weight: 5, flow: 'claims' },
  { from: 'l2', to: 'dxc',    weight: 3, flow: 'claims' },
  { from: 'l2', to: 'enrich', weight: 3, flow: 'elig' },

  // Stedi → payers
  { from: 'stedi', to: 'p-delta', weight: 4, flow: 'claims' },
  { from: 'stedi', to: 'p-cigna', weight: 3, flow: 'claims' },
  { from: 'stedi', to: 'p-aetna', weight: 3, flow: 'claims' },
  { from: 'stedi', to: 'p-uhc',   weight: 3, flow: 'claims' },
  { from: 'stedi', to: 'p-guard', weight: 2, flow: 'claims' },

  // DentalXChange → payers
  { from: 'dxc', to: 'p-metlife', weight: 3, flow: 'claims' },
  { from: 'dxc', to: 'p-humana',  weight: 2, flow: 'claims' },
  { from: 'dxc', to: 'p-bcbs',    weight: 2, flow: 'claims' },
  { from: 'dxc', to: 'p-princ',   weight: 2, flow: 'claims' },

  // Enrichment → payers
  { from: 'enrich', to: 'p-dq',     weight: 3, flow: 'elig' },
  { from: 'enrich', to: 'p-mcna',   weight: 2, flow: 'elig' },
  { from: 'enrich', to: 'p-medcd',  weight: 2, flow: 'elig' },
  { from: 'enrich', to: 'p-amerit', weight: 1, flow: 'elig' },

  // Stedi → EDI transactions
  { from: 'stedi', to: 'edi-837', weight: 4, flow: 'claims' },
  { from: 'stedi', to: 'edi-270', weight: 3, flow: 'elig' },
  { from: 'stedi', to: 'edi-276', weight: 2, flow: 'claims' },
  { from: 'stedi', to: 'edi-835', weight: 4, flow: 'denial' },
  { from: 'dxc',   to: 'edi-275', weight: 3, flow: 'claims' },
  { from: 'enrich', to: 'edi-portal', weight: 3, flow: 'elig' },

  // Feedback loop
  { from: 'edi-835', to: 'feedback', weight: 3, flow: 'denial' },
  { from: 'feedback', to: 'l3',      weight: 3, flow: 'denial', moat: true },
  { from: 'feedback', to: 'l4',      weight: 2, flow: 'denial', moat: true },
];

const COLORS = {
  entry:      { fill: '#1E293B', stroke: '#64748B', text: '#F1F5F9' },
  layer:      { fill: '#0F172A', stroke: '#94A3B8', text: '#F8FAFC' },
  moat:       { fill: '#164E63', stroke: '#06B6D4', text: '#ECFEFF' },
  'moat-sub': { fill: '#155E75', stroke: '#22D3EE', text: '#ECFEFF' },
  attach:     { fill: '#78350F', stroke: '#F59E0B', text: '#FFFBEB' },
  'attach-sub':{ fill: '#92400E', stroke: '#FBBF24', text: '#FFFBEB' },
  norm:       { fill: '#312E81', stroke: '#818CF8', text: '#EEF2FF' },
  stedi:      { fill: '#064E3B', stroke: '#34D399', text: '#ECFDF5' },
  dxc:        { fill: '#78350F', stroke: '#FB923C', text: '#FFF7ED' },
  enrich:     { fill: '#4C1D95', stroke: '#A78BFA', text: '#EDE9FE' },
  edi:        { fill: '#1F2937', stroke: '#6B7280', text: '#F3F4F6' },
  feedback:   { fill: '#9F1239', stroke: '#FB7185', text: '#FFF1F2' },
  state:      { fill: '#4338CA', stroke: '#A5B4FC', text: '#EEF2FF' },
};

const NODE_INFO = {
  solo:     { title: 'Solo / Small Practice', body: '1–3 providers. Buys Claims Recovery as standalone module from Azure Marketplace. Highest per-seat revenue, lowest volume.' },
  group:    { title: 'Group Practice', body: '4–15 providers. Typically buys through UIS platform or direct. Sweet spot for initial sales — large enough to feel pain, small enough to onboard fast.' },
  dso:      { title: 'DSO (Dental Service Organization)', body: '50–500+ locations. Enterprise deal structure. One contract = hundreds of provider seats. Dentalcorp, Aspen, Heartland, Pacific Dental. Primary target for Demo Day.' },
  market:   { title: 'Azure Marketplace', body: 'Standalone Claims Recovery module. Listed alongside Practice Revenue Pulse and Lead Scout. Self-service onboarding with Stedi provider enrollment.' },
  uis:      { title: 'UIS Health Platform', body: 'Embedded mode. Claims intelligence surfaces alongside clinical analytics, BFS provider scoring, and Outcome Gap treatment tracking.' },
  l5:       { title: 'L05 — Claims Recovery UI', body: 'The interface layer. Pipeline view of all claims by status (draft → submitted → adjudicating → paid/denied → appealed → recovered). Real-time dashboards, alerts, and EBITDA Delta reporting.' },
  l4:       { title: 'L04 — MARVA Intelligence Engine', body: 'THE PRIMARY MOAT. AI-driven claims intelligence: pre-submission optimization (predicts denial before filing), denial pattern recognition (ML model trained on ERA data), auto-appeal generation, and revenue recovery scanning. Uses SHAP for explainability.' },
  'l4-pre':   { title: 'Pre-Submission Optimizer', body: 'Before any claim leaves DentaMind: validates CDT codes, checks frequency limits, predicts denial probability, verifies attachments are present and current. Blocks bad claims before they waste time.' },
  'l4-deny':  { title: 'Denial Pattern Engine', body: 'ML model trained on historical ERA data. Operates at practice-level (your specific patterns) and network-level (anonymized across all DentaMind practices). SHAP explainability shows exactly WHY a claim will be denied.' },
  'l4-appeal':{ title: 'Auto-Appeal Generator', body: 'When denial hits via ERA webhook: parses CARC/RARC codes → classifies denial type → retrieves payer-specific appeal template → generates clinical narrative with evidence → queues for human review → resubmits.' },
  'l4-recov': { title: 'Revenue Recovery Scanner', body: 'The money-finder. Identifies underpayments (allowed vs. paid discrepancies), missed filing windows, expired claims still recoverable, and systematic payer behavior anomalies across the practice portfolio.' },
  l3:       { title: 'L03 — Attachment Intelligence', body: 'THE SECOND MOAT. Clearinghouses move files — MARVA knows WHICH files to send and WHAT to say. Payer rules engine, clinical document resolver, AI narrative generator, and pre-submission validator. Each ERA response teaches the system.' },
  'l3-rules':  { title: 'Payer Rules Engine', body: 'Database mapping payer + CDT code + tooth position → required attachments, narrative style, image recency limits. Seeded from DentalXChange validation API, enriched continuously from denial patterns.' },
  'l3-resolve':{ title: 'Clinical Document Resolver', body: 'Given payer requirements, locates the correct X-rays, perio charts, and treatment notes from PMS/imaging systems. Validates recency. MVP: manual upload. Phase 2: auto-pull via PMS integration.' },
  'l3-narr':   { title: 'AI Narrative Generator', body: 'LLM generates payer-specific clinical narratives. Different payers respond to different framing: measurements (Delta), functional (MetLife), clinical (Cigna). Templates improve from ERA feedback.' },
  'l3-valid':  { title: 'Pre-Submit Validator', body: 'Final checkpoint. All required attachments present? Images meet quality/format? Narrative addresses payer criteria? CDT codes match docs? Blocks submission if package is incomplete.' },
  l2:       { title: 'L02 — Multi-Source Resolver', body: 'Query Stedi first (fast EDI 270/271) → evaluate completeness → if gaps in frequency limits, downgrades, waiting periods → query Zuub/Tuuthfairy for portal-scraped enrichment → merge into single normalized benefit record.' },
  stedi:    { title: 'Stedi — Primary Clearinghouse', body: '$500/mo. JSON-native APIs (no raw EDI parsing). 3,400+ payers. 837D claims, 270/271 eligibility, 276/277 status, 835 ERA via webhooks, 275 attachments, insurance discovery. MCP server for AI agent integration.' },
  dxc:      { title: 'DentalXChange — Attachments + Fallback', body: '$25/mo per location for attachments. $0.25/claim for clearinghouse. Payer-level attachment validation logic down to plan and specialist level. XConnect REST API. 41,000+ dental offices. Default for Open Dental, Archy, tab32.' },
  enrich:   { title: 'Zuub / Tuuthfairy — Eligibility Enrichment', body: '$40–200/mo. Portal scraping + direct payer API automation captures the 80%+ of benefit data that EDI misses: frequency limits, downgrades, missing tooth clauses, waiting periods. Zuub: REST API. Tuuthfairy: GraphQL API.' },
  'p-delta':  { title: 'Delta Dental', body: '~80M lives. 39 independent state plans under DDPA umbrella. Each with own tech stack. State-specific form variations. Largest dental payer in US.' },
  'p-cigna':  { title: 'Cigna Dental', body: '~17M lives. CAQH + portal + e-onboarding tool. Generally clean EDI integration.' },
  'p-aetna':  { title: 'Aetna Dental (CVS)', body: '~14M lives. CAQH + Availity. DMO panels may close in saturated areas.' },
  'p-uhc':    { title: 'UHC Dental', body: '~10M+ lives. Optum ecosystem. Ties to broader UHC medical credentialing.' },
  'p-guard':  { title: 'Guardian', body: '~8M lives. Proprietary portal primary. 143K network dentists.' },
  'p-metlife':{ title: 'MetLife', body: '~21M lives. SKYGEN Dental Hub. Accepts CAQH but workflow runs through portal.' },
  'p-humana': { title: 'Humana Dental', body: '~13M lives. CAQH partial + own portal. Specialist enrollment takes longer.' },
  'p-bcbs':   { title: 'BCBS (by state)', body: '33 independent plans. Highly fragmented. Some partner with United Concordia for dental admin.' },
  'p-princ':  { title: 'Principal', body: 'Mid-market dental payer. Direct carrier partnerships with some dental platforms.' },
  'p-dq':     { title: 'DentaQuest (Sun Life)', body: '~33M lives. Largest Medicaid dental administrator. CDCP admin in Canada. Must enroll with state Medicaid first.' },
  'p-mcna':   { title: 'MCNA Dental', body: '~8M lives. State universal forms (TX, LA, FL, UT, ID, IA).' },
  'p-medcd':  { title: 'Medicaid (50 states)', body: 'Every state has its own system. FHIR Patient Access API mandated by Jan 2027 for Medicaid dental plans. Early opportunity.' },
  'p-amerit': { title: 'Ameritas', body: 'Mid-market dental payer. Lower volume but included for coverage breadth.' },
  'edi-837':  { title: '837D — Dental Claim', body: 'The actual claim submission. CDT codes, tooth numbers, surfaces, charges, provider NPI, subscriber info. Stedi translates JSON → X12 837D automatically.' },
  'edi-270':  { title: '270/271 — Eligibility', body: 'Request and response. Verify patient coverage, deductible remaining, annual max remaining. Fast but limited — only ~20% of benefit detail available via EDI.' },
  'edi-276':  { title: '276/277 — Claim Status', body: 'Where is my claim? MARVA polls and monitors aging claims. Triggers escalation when claims exceed payer-specific SLA thresholds.' },
  'edi-835':  { title: '835 — ERA / EOB', body: 'THE CRITICAL DATA FEED. Payment, adjustment, and denial codes (CARC/RARC). Delivered via Stedi webhooks in parsed JSON. Every ERA response teaches MARVA.' },
  'edi-275':  { title: '275 — Attachments', body: 'X-rays, perio charts, narratives, clinical photos. DentalXChange handles routing with payer-level validation. Stedi supports 275 for payers that accept electronic attachments.' },
  'edi-portal': { title: 'Portal Scraping (Non-EDI)', body: 'Zuub/Tuuthfairy use RPA and direct payer API automation to capture benefit data that EDI cannot reach. Frequency limits, downgrades, waiting periods, missing tooth clauses.' },
  feedback:   { title: 'Feedback Loop — Data Flywheel', body: 'Every 835 ERA response teaches MARVA. Cigna approves D2740 at 94% with PA + "structural compromise" narrative, but only 61% with X-ray alone. This intelligence compounds daily. No clearinghouse can replicate it.' },
};

export default function ClaimsCartography() {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>('l4');
  const [flowFilter, setFlowFilter] = useState('all');

  const nodeById = useMemo(() => Object.fromEntries(NODES.map(n => [n.id, n])), []);
  const info = (NODE_INFO as Record<string, {title: string; body: string}>)[selectedId] || NODE_INFO['l4'];

  const connectedSet = useMemo(() => {
    if (!hoverId) return null;
    const s = new Set([hoverId]);
    EDGES.forEach(e => {
      if (e.from === hoverId) s.add(e.to);
      if (e.to === hoverId) s.add(e.from);
    });
    return s;
  }, [hoverId]);

  const isFlowMatch = (edge: any) => flowFilter === 'all' || edge.flow === 'all' || edge.flow === flowFilter;

  const isNodeInFlow = (node: any) => {
    if (flowFilter === 'all') return true;
    return EDGES.some(e => (e.from === node.id || e.to === node.id) && isFlowMatch(e));
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100" style={{ fontFamily: "'IBM Plex Sans', -apple-system, system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&display=swap');
        .mono { font-family: 'IBM Plex Mono', monospace; }
        .display { font-family: 'Fraunces', serif; font-optical-sizing: auto; }

        @keyframes pulse-ring {
          0%   { r: 58; opacity: 0.6; }
          100% { r: 90; opacity: 0; }
        }
        .moat-pulse { animation: pulse-ring 2.4s ease-out infinite; }

        @keyframes pulse-ring-sm {
          0%   { r: 50; opacity: 0.4; }
          100% { r: 75; opacity: 0; }
        }
        .attach-pulse { animation: pulse-ring-sm 3s ease-out infinite; animation-delay: 1.2s; }

        @keyframes flow-dash {
          to { stroke-dashoffset: -20; }
        }
        .flow-edge { stroke-dasharray: 6 4; animation: flow-dash 1.5s linear infinite; }

        .edge-base { transition: opacity 0.3s, stroke-width 0.3s; }
        .node-base { transition: opacity 0.3s, transform 0.2s; cursor: pointer; }
        .node-base:hover { transform: scale(1.08); }
      `}</style>

      <header className="px-6 md:px-12 py-8 border-b border-slate-800">
        <div className="flex items-start justify-between flex-wrap gap-6">
          <div>
            <div className="mono text-xs uppercase tracking-[0.25em] text-cyan-500 mb-2">
              DentaMind · Claims Recovery · Neural Cartography
            </div>
            <h1 className="display text-4xl md:text-5xl font-medium tracking-tight text-slate-50 mb-2">
              The claims lifecycle, as a map.
            </h1>
            <p className="text-slate-400 max-w-2xl text-sm md:text-base leading-relaxed">
              Tap any node to read what it does. Hover to see connections. Filter by flow to trace how claims, eligibility, or denials move through the stack.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap text-xs mono">
            {[
              { id: 'all', label: 'All flows', bg: 'bg-slate-100 text-slate-950 border-slate-100' },
              { id: 'claims', label: 'Claims path', bg: 'bg-emerald-500 text-emerald-950 border-emerald-500' },
              { id: 'elig', label: 'Eligibility', bg: 'bg-violet-500 text-violet-950 border-violet-500' },
              { id: 'denial', label: 'Denial / Recovery', bg: 'bg-rose-500 text-rose-950 border-rose-500' },
            ].map(f => (
              <button key={f.id} onClick={() => setFlowFilter(f.id)}
                className={`px-3 py-2 border uppercase tracking-wider transition-colors ${flowFilter === f.id ? f.bg : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row">
        <div className="flex-1 relative" style={{ background: 'radial-gradient(ellipse at center, #0f172a 0%, #020617 100%)' }}>
          <svg viewBox="0 0 1160 1160" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
            <defs>
              <pattern id="dotgrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="0.7" fill="#1e293b" />
              </pattern>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="moat-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="8" result="b" />
                <feFlood floodColor="#06b6d4" floodOpacity="0.5" />
                <feComposite in2="b" operator="in" />
                <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="attach-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="b" />
                <feFlood floodColor="#f59e0b" floodOpacity="0.4" />
                <feComposite in2="b" operator="in" />
                <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <radialGradient id="stedi-region" cx="50%" cy="50%">
                <stop offset="0%" stopColor="#064e3b" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#064e3b" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="dxc-region" cx="50%" cy="50%">
                <stop offset="0%" stopColor="#78350f" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#78350f" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="enrich-region" cx="50%" cy="50%">
                <stop offset="0%" stopColor="#4c1d95" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#4c1d95" stopOpacity="0" />
              </radialGradient>
            </defs>

            <rect width="1160" height="1160" fill="url(#dotgrid)" />

            {/* Region halos */}
            <ellipse cx="240" cy="930" rx="220" ry="170" fill="url(#stedi-region)" />
            <ellipse cx="580" cy="920" rx="200" ry="140" fill="url(#dxc-region)" />
            <ellipse cx="920" cy="910" rx="200" ry="160" fill="url(#enrich-region)" />

            {/* Cluster labels */}
            <text x="240" y="840" textAnchor="middle" className="mono" fontSize="9" fill="#34d399" letterSpacing="3" opacity="0.6">STEDI · PRIMARY · $500/MO</text>
            <text x="580" y="850" textAnchor="middle" className="mono" fontSize="9" fill="#fb923c" letterSpacing="3" opacity="0.6">DENTALXCHANGE · ATTACHMENTS · $25/LOC</text>
            <text x="920" y="840" textAnchor="middle" className="mono" fontSize="9" fill="#a78bfa" letterSpacing="3" opacity="0.6">ZUUB / TUUTHFAIRY · $40–200/MO</text>
            <text x="580" y="145" textAnchor="middle" className="mono" fontSize="9" fill="#94a3b8" letterSpacing="3" opacity="0.5">PRACTICES · CUSTOMERS</text>
            <text x="580" y="1140" textAnchor="middle" className="mono" fontSize="9" fill="#6b7280" letterSpacing="3" opacity="0.5">EDI X12 TRANSACTIONS · JSON VIA STEDI</text>

            {/* Edges */}
            {EDGES.map((edge, i) => {
              const from = nodeById[edge.from];
              const to = nodeById[edge.to];
              if (!from || !to) return null;

              const flowMatch = isFlowMatch(edge);
              const hoverDim = connectedSet && !(connectedSet.has(edge.from) && connectedSet.has(edge.to));
              const mx = (from.x + to.x) / 2;
              const my = (from.y + to.y) / 2;
              const dx = to.x - from.x;
              const dy = to.y - from.y;
              const len = Math.sqrt(dx*dx + dy*dy) || 1;
              const perpX = -dy / len * 18;
              const perpY = dx / len * 18;
              const path = `M ${from.x} ${from.y} Q ${mx + perpX} ${my + perpY} ${to.x} ${to.y}`;
              const opacity = !flowMatch ? 0.06 : hoverDim ? 0.12 : 0.5;

              let stroke = '#475569';
              if (edge.flow === 'claims') stroke = '#34d399';
              else if (edge.flow === 'elig') stroke = '#a78bfa';
              else if (edge.flow === 'denial') stroke = '#fb7185';
              if (edge.moat) stroke = '#22d3ee';

              return (
                <path key={`e-${i}`} className={`edge-base ${flowFilter !== 'all' && flowMatch ? 'flow-edge' : ''}`}
                  d={path} fill="none" stroke={stroke} strokeWidth={edge.weight * 0.8}
                  strokeLinecap="round" opacity={opacity} />
              );
            })}

            {/* Moat pulse rings */}
            <circle cx="580" cy="340" r="58" fill="none" stroke="#22d3ee" strokeWidth="1.5" opacity="0.3" />
            <circle cx="580" cy="340" r="58" fill="none" stroke="#22d3ee" strokeWidth="2" className="moat-pulse" />
            <circle cx="580" cy="510" r="50" fill="none" stroke="#fbbf24" strokeWidth="1" opacity="0.2" />
            <circle cx="580" cy="510" r="50" fill="none" stroke="#fbbf24" strokeWidth="1.5" className="attach-pulse" />

            {/* Nodes */}
            {NODES.map(node => {
              const color = (COLORS as Record<string, {fill: string; stroke: string; text: string}>)[node.cluster] || COLORS.layer;
              const inFlow = isNodeInFlow(node);
              const isHovered = hoverId === node.id;
              const isSelected = selectedId === node.id;
              const isConnected = connectedSet?.has(node.id);

              let opacity = 1;
              if (!inFlow) opacity = 0.15;
              else if (connectedSet && !isConnected) opacity = 0.25;

              const isMoat = node.cluster === 'moat';
              const isAttach = node.cluster === 'attach';
              const filter = isMoat ? 'url(#moat-glow)' : isAttach ? 'url(#attach-glow)' : (isHovered || isSelected) ? 'url(#glow)' : undefined;

              return (
                <g key={node.id} className="node-base"
                  style={{ opacity, transformOrigin: `${node.x}px ${node.y}px` }}
                  onMouseEnter={() => setHoverId(node.id)}
                  onMouseLeave={() => setHoverId(null)}
                  onClick={() => setSelectedId(node.id)}>

                  {isSelected && (
                    <circle cx={node.x} cy={node.y} r={node.r + 6} fill="none" stroke="#f8fafc" strokeWidth="1.5" opacity="0.7" strokeDasharray="3 2" />
                  )}

                  <circle cx={node.x} cy={node.y} r={node.r} fill={color.fill}
                    stroke={color.stroke} strokeWidth={isMoat || isAttach ? 2.5 : 1.5} filter={filter} />

                  {node.r >= 26 ? (
                    <>
                      <text x={node.x} y={node.y - 2} textAnchor="middle" fill={color.text}
                        fontSize={node.r >= 44 ? 15 : 11} fontWeight="600" style={{ pointerEvents: 'none' }}>
                        {node.label}
                      </text>
                      {node.sublabel && (
                        <text x={node.x} y={node.y + (node.r >= 44 ? 13 : 10)} textAnchor="middle"
                          fill={color.text} fontSize="7.5" opacity="0.8" style={{ pointerEvents: 'none' }}>
                          {node.sublabel}
                        </text>
                      )}
                    </>
                  ) : (
                    <>
                      <text x={node.x} y={node.y + node.r + 13} textAnchor="middle" fill="#cbd5e1"
                        fontSize="9" fontWeight="500" style={{ pointerEvents: 'none' }}>{node.label}</text>
                      {node.sublabel && (
                        <text x={node.x} y={node.y + node.r + 23} textAnchor="middle" fill="#64748b"
                          fontSize="7" style={{ pointerEvents: 'none' }}>{node.sublabel}</text>
                      )}
                    </>
                  )}

                  {node.vol && (
                    <text x={node.x} y={node.y - node.r - 4} textAnchor="middle" fill="#94a3b8"
                      fontSize="8" fontFamily="IBM Plex Mono" style={{ pointerEvents: 'none' }}>{node.vol}</text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Detail Panel */}
        <aside className="lg:w-96 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 p-6 md:p-8 flex flex-col gap-6">
          <div>
            <div className="mono text-[10px] uppercase tracking-[0.25em] text-cyan-500 mb-2">Selected node</div>
            <h2 className="display text-2xl font-medium text-slate-50 mb-3 leading-tight">{info.title}</h2>
            <p className="text-slate-300 text-sm leading-relaxed">{info.body}</p>
          </div>

          <div className="border-t border-slate-800 pt-6">
            <div className="mono text-[10px] uppercase tracking-[0.25em] text-slate-500 mb-3">Legend</div>
            <div className="space-y-2 text-xs">
              <LegendRow color="#22d3ee" label="MARVA Intelligence" note="L04 · THE PRIMARY MOAT" />
              <LegendRow color="#fbbf24" label="Attachment Intelligence" note="L03 · THE SECOND MOAT" />
              <LegendRow color="#34d399" label="Stedi (claims path)" note="$500/mo · 3,400+ payers" />
              <LegendRow color="#fb923c" label="DentalXChange" note="$25/loc · attachments + fallback" />
              <LegendRow color="#a78bfa" label="Zuub / Tuuthfairy" note="$40–200/mo · eligibility enrichment" />
              <LegendRow color="#fb7185" label="Denial / feedback loop" note="ERA → MARVA learns" />
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6">
            <div className="mono text-[10px] uppercase tracking-[0.25em] text-slate-500 mb-3">System at a glance</div>
            <div className="grid grid-cols-2 gap-3">
              <StatBox value="3,400+" label="Payers" note="Via Stedi + DXC" />
              <StatBox value="$1.1–1.7K" label="Infra / month" note="MVP cost" />
              <StatBox value="5 layers" label="Architecture" note="L01–L05" />
              <StatBox value="4–6" label="Breakeven" note="Practices @ $299/mo" />
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 mono text-[10px] text-slate-500 leading-relaxed">
            UIS Health · Claims Recovery architecture v1 · April 2026 · For Neal, Sam, Qu, and partner conversations.
          </div>
        </aside>
      </div>

      <footer className="border-t border-slate-800 bg-slate-950 px-6 md:px-12 py-6">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div className="mono text-[10px] uppercase tracking-[0.2em] text-slate-600">
            DentaMind Claims Recovery — a UIS Health product
          </div>
          <div className="text-[10px] text-slate-600 max-w-md text-right">
            The cyan pulse on L04 marks MARVA's intelligence engine. The amber pulse on L03 marks attachment intelligence. Together they form a data flywheel no clearinghouse can replicate.
          </div>
        </div>
      </footer>
    </div>
  );
}

function LegendRow({ color, label, note }: { color: string; label: string; note: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-3 h-3 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 8px ${color}66` }}></span>
      <div>
        <div className="text-slate-200 font-medium">{label}</div>
        <div className="text-slate-500 text-[10px]">{note}</div>
      </div>
    </div>
  );
}

function StatBox({ value, label, note }: { value: string; label: string; note: string }) {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-sm p-3">
      <div className="display text-xl font-semibold text-slate-100">{value}</div>
      <div className="mono text-[9px] uppercase tracking-wider text-slate-500 mt-1">{label}</div>
      <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{note}</div>
    </div>
  );
}
