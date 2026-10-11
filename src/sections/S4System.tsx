import { useState } from 'react';
import { Answer, BlockTitle, Callout, Card, DataTable, KV, Pill, SectionHero, Stat } from '../components/ui';

type Timing = 'realtime' | 'batch4h' | 'daily' | 'triggered' | 'feedback';

const TIMING: Record<Timing, { label: string; color: string; desc: string }> = {
  realtime: { label: 'Real-time / as received', color: '#16a34a', desc: 'Existing product feed and backend pushes' },
  batch4h: { label: 'Batched · every 4h', color: '#3b5bfd', desc: 'Airbyte incremental, never a full resync' },
  daily: { label: 'Scheduled · daily', color: '#8a55fc', desc: 'Dagster model + Hightouch after QA passes' },
  triggered: { label: 'Event-triggered', color: '#e07a1f', desc: 'HubSpot property change → Make/n8n' },
  feedback: { label: 'Feedback loop', color: '#868ca5', desc: 'Outcomes back to the warehouse' },
};

interface Node {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  sub: string;
  layer: string;
  color: string;
  role: string;
  why: string;
  timing: string;
  guard: string;
}

const NODES: Node[] = [
  {
    id: 'product',
    x: 30,
    y: 30,
    w: 230,
    h: 80,
    title: 'Product events',
    sub: 'campaign + depth features',
    layer: 'Source',
    color: '#16a34a',
    role: 'Workspace, campaign and depth-feature events (plus the proposed workflow/AI execution events).',
    why: 'Already lands in the warehouse. No duplicate Airbyte product sync.',
    timing: 'As received',
    guard: 'Needs event_id, workspace_id, occurred_at, ingested_at to dedupe and trust timing.',
  },
  {
    id: 'hsSrc',
    x: 300,
    y: 30,
    w: 230,
    h: 80,
    title: 'HubSpot CRM',
    sub: 'owners · CSx tasks · emails',
    layer: 'Source',
    color: '#3b5bfd',
    role: 'Workspace owner, CSx tasks, call history and lifecycle email engagement.',
    why: 'This is where CS and lifecycle context is recorded, so the model joins it rather than re-creating it.',
    timing: 'Airbyte incremental, every 4 hours (proposed)',
    guard: 'Missing contact history ≠ no check-in.',
  },
  {
    id: 'cb',
    x: 570,
    y: 30,
    w: 230,
    h: 80,
    title: 'Chargebee',
    sub: 'plan · seats · status · renewal',
    layer: 'Source',
    color: '#3b5bfd',
    role: 'Authoritative subscription state: paid status, plan, seats, downgrade, cancellation, renewal.',
    why: 'Chargebee is the billing source of truth and gates any customer action.',
    timing: 'Airbyte incremental every 4 hours, plus a live recheck right before any action',
    guard: 'Never act on yesterday’s cached eligibility.',
  },
  {
    id: 'stripe',
    x: 840,
    y: 30,
    w: 230,
    h: 80,
    title: 'Stripe',
    sub: 'payment signals only',
    layer: 'Source',
    color: '#3b5bfd',
    role: 'Optional payment evidence (failed payments etc.).',
    why: 'Useful context, but never counted as another subscription.',
    timing: 'Airbyte incremental, every 4 hours',
    guard: 'One active subscription is counted once, from Chargebee.',
  },
  {
    id: 'airbyte',
    x: 570,
    y: 165,
    w: 500,
    h: 72,
    title: 'Airbyte · incremental sync',
    sub: 'HubSpot / billing → raw tables · no full resync',
    layer: 'Ingest',
    color: '#3b5bfd',
    role: 'Moves HubSpot, Chargebee and Stripe data into raw warehouse tables using incremental cursors.',
    why: 'Usage-billed: full resyncs are expensive, so incremental only. Product events don’t go through here.',
    timing: 'Every 4 hours to start (proposed, not a documented SLA)',
    guard: 'Bounded backfills from a validated cursor if something is missing.',
  },
  {
    id: 'wh',
    x: 30,
    y: 300,
    w: 230,
    h: 90,
    title: 'Warehouse · raw',
    sub: 'events + CSx + subscriptions',
    layer: 'Warehouse',
    color: '#8a55fc',
    role: 'Immutable raw layer with QA: stable IDs, lag, duplicate or missing rows. Metabase/Amplitude read from here to inspect trends.',
    why: 'The only place product, billing and CRM data can be modelled together.',
    timing: 'Continuously appended',
    guard: 'If data is late or a join fails, the status is UNKNOWN, not inactivity.',
  },
  {
    id: 'model',
    x: 300,
    y: 300,
    w: 230,
    h: 90,
    title: 'Workspace risk model',
    sub: 'WATCH · AT RISK · UNKNOWN',
    layer: 'Warehouse',
    color: '#8a55fc',
    role: 'One row per Workspace per day: signals, status, reason codes, as-of time, model version, confidence.',
    why: 'Deterministic, explainable rules owned in SQL. The warehouse owns the calculation; nothing downstream re-scores.',
    timing: 'Daily, only after expected sources and checks finish',
    guard: 'Missing execution events = UNKNOWN. Workflow edits never substitute for runs.',
  },
  {
    id: 'dagster',
    x: 570,
    y: 300,
    w: 230,
    h: 90,
    title: 'Dagster',
    sub: 'schedule · sequence · QA gate',
    layer: 'Orchestration',
    color: '#8a55fc',
    role: 'Runs syncs → models → checks, in order. Holds Hightouch until QA passes.',
    why: 'Already orchestrates Superchat’s jobs and flags failures to Slack.',
    timing: 'Daily run; freshness checks each sync',
    guard: 'Stale source past the agreed window → suppress action, surface a data-quality warning.',
  },
  {
    id: 'slack',
    x: 840,
    y: 300,
    w: 230,
    h: 90,
    title: 'Slack',
    sub: 'technical failures · urgent only',
    layer: 'Alerting',
    color: '#e07a1f',
    role: 'Technical failures and rare urgent exceptions.',
    why: 'GTM lives in Slack, but routine flags belong in HubSpot to avoid alert fatigue.',
    timing: 'On failure / exception',
    guard: 'Not a channel for every flagged account.',
  },
  {
    id: 'hightouch',
    x: 30,
    y: 450,
    w: 230,
    h: 80,
    title: 'Hightouch',
    sub: 'reverse ETL · changed rows',
    layer: 'Reverse ETL',
    color: '#8a55fc',
    role: 'Upserts only changed Workspace risk properties: status, reason codes, last relevant event, freshness, scored-at.',
    why: 'Moves the warehouse result into the CRM GTM already works in.',
    timing: 'Daily, after the model passes QA',
    guard: 'Match on a verified workspace identifier, never email domain or Company association.',
  },
  {
    id: 'hsWs',
    x: 300,
    y: 450,
    w: 230,
    h: 80,
    title: 'HubSpot · Workspace',
    sub: 'risk fields · owner · evidence',
    layer: 'CRM',
    color: '#3b5bfd',
    role: 'The action target: Workspace object carries risk fields, owner and latest evidence.',
    why: 'Actions should fire after the CRM record updates, not on every raw product event.',
    timing: 'Updated daily; property-change workflow fires on change',
    guard: 'Suppress repeats; one workflow per valid property change.',
  },
  {
    id: 'make',
    x: 570,
    y: 450,
    w: 230,
    h: 80,
    title: 'Make / n8n',
    sub: 'route · recheck · dedupe',
    layer: 'Automation',
    color: '#e07a1f',
    role: 'Routes by motion and owner; rechecks live Chargebee eligibility, HubSpot status, owner, opt-out and recent outreach.',
    why: 'The automation layer is good at multi-step API calls, bad at owning business logic, so it only routes.',
    timing: 'Triggered by HubSpot property change',
    guard: 'Idempotency key = workspace_id + risk_reason + cooldown window (e.g. 14 days).',
  },
  {
    id: 'llm',
    x: 840,
    y: 450,
    w: 230,
    h: 80,
    title: 'LLM (optional)',
    sub: 'drafts a factual task summary',
    layer: 'Assist',
    color: '#868ca5',
    role: 'Turns approved, structured signals into a short task summary.',
    why: 'Saves CSx reading time, without touching decisions.',
    timing: 'Opt-in, per task',
    guard: 'Never decides risk, invents reasons, reads message content or sends unreviewed outreach.',
  },
  {
    id: 'ssf',
    x: 30,
    y: 600,
    w: 230,
    h: 80,
    title: 'SSF · lifecycle guidance',
    sub: 'one relevant next step',
    layer: 'Last mile',
    color: '#16a34a',
    role: 'One approved onboarding email or in-app step tailored to the missing feature.',
    why: 'SSF has no CSx owner, so the product and lifecycle team are the channel.',
    timing: 'After live eligibility check',
    guard: 'Rate-limited; exclude cancelled/recovered; only on reliable risk evidence.',
  },
  {
    id: 'csx',
    x: 300,
    y: 600,
    w: 230,
    h: 80,
    title: 'Sales-led · CSx task',
    sub: 'reason · trend · suggested play',
    layer: 'Last mile',
    color: '#3b5bfd',
    role: 'HubSpot task for the actual CSx owner with reason, recent trend, evidence timestamp and suggested next step.',
    why: 'CSx decides how and when to contact. The system informs; people own the conversation.',
    timing: 'After live eligibility check',
    guard: 'No duplicate task for a repeated daily score.',
  },
  {
    id: 'fb',
    x: 570,
    y: 600,
    w: 500,
    h: 80,
    title: 'Feedback loop',
    sub: 'tasks + lifecycle outcomes → Airbyte → warehouse',
    layer: 'Measure',
    color: '#868ca5',
    role: 'Actions and resolutions are stored against the Workspace and flow back for evaluation.',
    why: 'Measure alerts, interventions and adoption lift, not just uptime.',
    timing: 'Airbyte incremental every 4h + daily model',
    guard: 'Compare against comparable untreated or holdout accounts.',
  },
];

interface Edge {
  from: string;
  to: string;
  t: Timing;
  pts: [number, number][];
  label?: string;
  lx?: number;
  ly?: number;
  dashed?: boolean;
}

const EDGES: Edge[] = [
  { from: 'product', to: 'wh', t: 'realtime', pts: [[145, 110], [145, 300]], label: 'existing feed', lx: 152, ly: 200 },
  { from: 'hsSrc', to: 'airbyte', t: 'batch4h', pts: [[415, 110], [415, 140], [620, 140], [620, 165]], label: 'CRM', lx: 470, ly: 134 },
  { from: 'cb', to: 'airbyte', t: 'batch4h', pts: [[685, 110], [685, 165]], label: 'billing', lx: 692, ly: 142 },
  { from: 'stripe', to: 'airbyte', t: 'batch4h', pts: [[955, 110], [955, 165]], label: 'payments', lx: 962, ly: 130 },
  { from: 'airbyte', to: 'wh', t: 'batch4h', pts: [[640, 237], [640, 268], [215, 268], [215, 300]], label: 'incremental tables', lx: 380, ly: 262 },
  { from: 'wh', to: 'model', t: 'daily', pts: [[260, 345], [300, 345]] },
  { from: 'dagster', to: 'model', t: 'daily', pts: [[570, 345], [530, 345]], dashed: true },
  { from: 'dagster', to: 'slack', t: 'triggered', pts: [[800, 345], [840, 345]], dashed: true },
  { from: 'model', to: 'hightouch', t: 'daily', pts: [[415, 390], [415, 420], [145, 420], [145, 450]], label: 'after QA', lx: 250, ly: 414 },
  { from: 'hightouch', to: 'hsWs', t: 'daily', pts: [[260, 490], [300, 490]] },
  { from: 'hsWs', to: 'make', t: 'triggered', pts: [[530, 490], [570, 490]] },
  { from: 'make', to: 'llm', t: 'triggered', pts: [[800, 490], [840, 490]], dashed: true },
  { from: 'make', to: 'ssf', t: 'triggered', pts: [[620, 530], [620, 562], [145, 562], [145, 600]], label: 'SSF', lx: 200, ly: 556 },
  { from: 'make', to: 'csx', t: 'triggered', pts: [[700, 530], [700, 580], [415, 580], [415, 600]], label: 'Sales-led', lx: 470, ly: 575 },
  { from: 'csx', to: 'fb', t: 'feedback', pts: [[530, 640], [570, 640]], dashed: true },
  { from: 'fb', to: 'airbyte', t: 'feedback', pts: [[1070, 640], [1095, 640], [1095, 201], [1070, 201]], dashed: true, label: 'outcomes', lx: 1040, ly: 420 },
];

function Architecture() {
  const [sel, setSel] = useState<string>('model');
  const [only, setOnly] = useState<Timing | null>(null);
  const node = NODES.find((n) => n.id === sel)!;
  const related = new Set(EDGES.filter((e) => e.from === sel || e.to === sel).flatMap((e) => [e.from, e.to]));

  return (
    <Card
      title="Architecture: how data moves, and when"
      right={
        <a className="btn sm" href="artefacts/s4-architecture.png" target="_blank" rel="noreferrer">
          Original PNG
        </a>
      }
    >
      <div className="row-wrap" style={{ marginBottom: 12 }}>
        <span className="small muted">Filter by timing:</span>
        {(Object.keys(TIMING) as Timing[]).map((t) => (
          <button
            key={t}
            className="btn sm"
            aria-pressed={only === t}
            onClick={() => setOnly(only === t ? null : t)}
            style={only === t ? { borderColor: TIMING[t].color, color: TIMING[t].color, background: 'var(--surface-2)' } : undefined}
          >
            <i style={{ width: 10, height: 10, borderRadius: 3, background: TIMING[t].color, display: 'inline-block' }} />
            {TIMING[t].label}
          </button>
        ))}
      </div>
      <div className="svg-wrap">
        <svg viewBox="0 0 1110 700" role="img" aria-label="Early-warning system architecture with data flows and timing">
          <defs>
            {(Object.keys(TIMING) as Timing[]).map((t) => (
              <marker key={t} id={`ar-${t}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0 0 L10 5 L0 10 z" fill={TIMING[t].color} />
              </marker>
            ))}
          </defs>
          {[
            ['01 · SOURCES', 22],
            ['02 · INGEST', 158],
            ['03 · MODEL + ORCHESTRATE', 292],
            ['04 · CRM + AUTOMATION', 442],
            ['05 · LAST MILE + LOOP', 592],
          ].map(([t, y]) => (
            <text key={t as string} x={1070} y={(y as number) - 6} textAnchor="end" fontSize="10.5" fontWeight={700} letterSpacing="0.1em" fill="var(--ink-3)">
              {t}
            </text>
          ))}
          {EDGES.map((e, i) => {
            const dim = only ? e.t !== only : false;
            const hl = e.from === sel || e.to === sel;
            const d = e.pts.map((p, j) => `${j ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ');
            return (
              <g key={i} opacity={dim ? 0.12 : 1}>
                <path
                  d={d}
                  className={`flow-line ${e.dashed ? '' : 'animated'}`}
                  stroke={TIMING[e.t].color}
                  strokeWidth={hl ? 3 : 2}
                  strokeDasharray={e.dashed ? '5 5' : undefined}
                  markerEnd={`url(#ar-${e.t})`}
                />
                {e.label && (
                  <text x={e.lx} y={e.ly} fontSize="11" fontWeight={650} fill={TIMING[e.t].color}>
                    {e.label}
                  </text>
                )}
              </g>
            );
          })}
          {NODES.map((n) => {
            const active = n.id === sel;
            const faded = only && !EDGES.some((e) => e.t === only && (e.from === n.id || e.to === n.id));
            return (
              <g
                key={n.id}
                className={`arch-node ${active ? 'active' : ''}`}
                onClick={() => setSel(n.id)}
                onKeyDown={(ev) => (ev.key === 'Enter' || ev.key === ' ') && setSel(n.id)}
                tabIndex={0}
                role="button"
                aria-label={`${n.title}: show details`}
                opacity={faded ? 0.35 : 1}
              >
                <rect className="box" x={n.x} y={n.y} width={n.w} height={n.h} rx={14} fill={active ? 'var(--brand-softer)' : 'var(--surface)'} stroke={active || related.has(n.id) ? n.color : 'var(--line-strong)'} strokeWidth={active ? 2.5 : 1.5} />
                <rect x={n.x} y={n.y + 12} width={4} height={n.h - 24} rx={2} fill={n.color} />
                <text x={n.x + 16} y={n.y + 22} fontSize="10" fontWeight={700} letterSpacing="0.08em" fill="var(--ink-3)">
                  {n.layer.toUpperCase()}
                </text>
                <text x={n.x + 16} y={n.y + 42} fontSize="15" fontWeight={700} fill="var(--ink)">
                  {n.title}
                </text>
                <text x={n.x + 16} y={n.y + 61} fontSize="12" fill="var(--ink-2)">
                  {n.sub}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="grid c2" style={{ marginTop: 14 }}>
        <div className="card" style={{ background: 'var(--surface-2)' }}>
          <div className="row-wrap" style={{ marginBottom: 8 }}>
            <Pill tone="brand">{node.layer}</Pill>
            <strong style={{ fontSize: 16 }}>{node.title}</strong>
          </div>
          <KV
            items={[
              ['What it does', node.role],
              ['Why it lives here', node.why],
              ['Freshness', node.timing],
              ['Guardrail', node.guard],
            ]}
          />
        </div>
        <div className="card" style={{ background: 'var(--surface-2)' }}>
          <h3>Timing legend</h3>
          <div className="stack" style={{ gap: 8 }}>
            {(Object.keys(TIMING) as Timing[]).map((t) => (
              <div key={t} className="small" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <svg width="36" height="8" aria-hidden="true">
                  <line x1="0" y1="4" x2="36" y2="4" stroke={TIMING[t].color} strokeWidth="3" strokeDasharray={t === 'feedback' ? '4 4' : undefined} />
                </svg>
                <strong>{TIMING[t].label}</strong>
                <span className="muted">{TIMING[t].desc}</span>
              </div>
            ))}
          </div>
          <p className="tiny muted" style={{ marginTop: 12 }}>
            Click any box for details. Timing is a design proposal, not a claim about Superchat's current SLAs. Product events already land in the warehouse.
          </p>
        </div>
      </div>
    </Card>
  );
}

function Prompts({ items }: { items: string[] }) {
  return (
    <div className="thread" style={{ marginBottom: 14 }}>
      <div className="msg in">
        <div className="who">SC</div>
        <div className="bubble">
          <div className="meta">Superchat · brief</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {items.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function S4System() {
  return (
    <>
      <SectionHero
        eyebrow="Section 4"
        title="Design the system"
        lede="An adoption early-warning system that acts on what Section 2 found. It is scored per Workspace in the warehouse, synced daily into HubSpot, and routed by motion, with a human in the loop wherever customer contact is involved."
        tags={
          <>
            <Pill tone="brand">Goal: SSF adoption 41% → ~46%</Pill>
            <Pill tone="unknown">Missing data = UNKNOWN</Pill>
            <Pill>Daily is fresh enough</Pill>
            <Pill tone="ok">Shippable alone in 2 weeks</Pill>
          </>
        }
      />

      <Architecture />

      <div style={{ height: 28 }} />
      <BlockTitle>The signal</BlockTitle>
      <Prompts
        items={[
          'What exactly do you compute to know an account is slipping, and what would you deliberately not trust, even though it is easy to measure and looks reassuring?',
          'What are you trying to move, and to what? Tie it back to the numbers from Section 1.',
        ]}
      />
      <div className="grid c4" style={{ marginBottom: 16 }}>
        <Stat label="SSF adoption baseline" value="41.0%" note="305 / 744 (observed)" />
        <Stat label="Pilot target" value="~46%" note="+5 pp, experiment, not forecast" accent />
        <Stat label="Sales-led baseline" value="55.1%" note="Different journey, not a causal comparator" />
        <Stat label="Account A lead time" value="38 days" note="Hypothetical: d33 review vs d71 cancel" />
      </div>
      <Answer label="The outcome I'd focus on">
        <p>
          The clearest measured problem is onboarding → adoption: only 424 of 960 accounts (44.2%) progress, and SSF is at 305 of 744 (41.0%) versus 55.1% for Sales-led. I'd focus
          the first pilot on SSF adoption, with a test target of lifting its 90-day adoption rate from 41% to about 46% (+5 percentage points). That's a proposed experiment target,
          not a forecast. I'd also watch paid downgrades and cancellations, but two weeks is too short to prove a 90-day improvement.
        </p>
      </Answer>
      <div style={{ height: 14 }} />
      <Card title="What I compute: one row per Workspace per as-of date">
        <DataTable
          head={['Field', 'Definition', 'Source', 'Confidence rule']}
          rows={[
            [<code>activation_lag_days</code>, 'First campaign_sent day − account_created day; null if no campaign', 'Product events', "First campaign is Superchat's Activated definition"],
            [<code>depth_setup_counts</code>, 'Distinct templates, workflows and agents created', 'Product events', 'Creation is not proof of useful adoption'],
            [<code>depth_success_14d</code>, 'Successful workflow + AI runs in the last 14 days', 'New execution events', 'Missing execution events → UNKNOWN, not zero. Never substitute workflow edits.'],
            [<code>depth_last_success_at</code>, 'Most recent confirmed successful workflow/AI execution', 'New execution events', 'Null from unavailable telemetry is UNKNOWN, not an inactivity alert'],
            [<code>core_msg_14d_delta</code>, 'Sent/received last 14 days vs previous 14, in account + motion context', 'Weekly snapshots', "Steady volume alone doesn't prove health; check bucket dates"],
            [<code>seat_activation</code>, 'Distinct active licensed users / seats', 'Product seats/users', 'Never sum invites without an event definition'],
            [<code>commercial_state</code>, 'Paid status, plan/seats, renewal/downgrade/cancellation', 'Chargebee; Stripe as payment evidence', 'Chargebee is authoritative; never count Stripe as another subscription'],
            [<code>touchpoints</code>, 'CSx owner/last call, completed tasks, lifecycle engagement', 'HubSpot + lifecycle', 'Missing contact history ≠ no check-in'],
            [<code>quality_flag</code>, 'Freshness, stable workspace_id, deduped event_id, model version', 'Raw + Dagster QA', 'UNKNOWN if data late or join invalid'],
          ]}
        />
      </Card>
      <div style={{ height: 14 }} />
      <div className="grid c2">
        <Callout tone="danger" title="What I deliberately don't trust.">
          Stable core messaging (Account A sent ~90/week right up to cancellation) and the absence of workflow edits. Neither proves health or inactivity. Creation and edit events
          are not executions.
        </Callout>
        <Callout tone="warn" title="Until execution events exist,">
          missing runs mean UNKNOWN, not non-use. A fading create/edit/trigger proxy can only produce a low-confidence "reduced observed interaction" WATCH candidate for human review,
          with no automated customer action.
        </Callout>
      </div>
      <div style={{ height: 14 }} />
      <Card title="Deterministic risk rules: a pilot, not proven thresholds">
        <div className="grid c2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {[
            ['WATCH', 'watch', 'With verified telemetry: no confirmed successful depth usage for a tested 14-day window after a motion-specific onboarding grace period.', 'Human review if proxy-only; outreach only when confirmed usage/risk evidence exists.'],
            ['AT RISK', 'risk', 'Reliable WATCH evidence plus an independent signal: repeated execution failures, material messaging decline, or verified downgrade intent.', 'High-priority CSx task / approved SSF outreach, deduplicated.'],
            ['UNKNOWN', 'unknown', 'Execution events unavailable, source stale, join failed or actor unknown.', 'Data-quality review. Never auto-message on an UNKNOWN proxy.'],
            ['RECOVERED', 'ok', 'Confirmed successful depth activity sustained; no urgent open commercial signal.', 'Clear/snooze risk and close the related task; cooldown stops repeat alerts.'],
          ].map(([t, tone, rule, action]) => (
            <div key={t} className="card" style={{ background: 'var(--surface-2)', padding: 16 }}>
              <Pill tone={tone as 'risk'}>{t}</Pill>
              <p className="small" style={{ marginTop: 10 }}>
                <strong>Rule:</strong> {rule}
              </p>
              <p className="small muted">
                <strong>Action:</strong> {action}
              </p>
            </div>
          ))}
        </div>
        <p className="tiny muted" style={{ marginTop: 12 }}>
          Scope for the pilot: paid active workspaces only; compare SSF vs Sales-led and account age; exclude cancelled, opted-out and just-contacted accounts.
        </p>
      </Card>

      <div style={{ height: 28 }} />
      <BlockTitle>Where it lives</BlockTitle>
      <Prompts
        items={[
          'Which part runs where? What is computed in the warehouse, what lands in the CRM, and what does the automation layer do? Why does each piece live where you put it?',
          'How fresh does the signal need to be, and how do you justify that? What is the cost of getting that wrong in either direction?',
        ]}
      />
      <DataTable
        head={['From', 'Connection', 'Destination', 'Timing', 'Contract / guardrail']}
        rows={[
          ['Product backend', 'Existing product event feed', 'Warehouse raw', <Pill tone="ok">As received</Pill>, 'No duplicate Airbyte product sync'],
          ['HubSpot + lifecycle', 'Airbyte incremental', 'Warehouse raw', <Pill tone="brand">Every 4h</Pill>, 'No full resync; verified IDs'],
          ['Chargebee + Stripe', 'Airbyte incremental', 'Warehouse raw', <Pill tone="brand">Every 4h</Pill>, 'Chargebee decides subscription state; Stripe is payment evidence'],
          ['Dagster', 'Orchestrate ingestion, QA, models', 'Risk model', <Pill tone="unknown">Daily after QA</Pill>, 'Technical failure → Slack'],
          ['Warehouse model', 'Hightouch, changed rows only', 'HubSpot Workspace', <Pill tone="unknown">Daily after model</Pill>, 'Status, reason, last depth success, as-of'],
          ['Workspace risk property change', 'HubSpot workflow / webhook → Make or n8n', 'SSF / Sales-led action', <Pill tone="watch">On change</Pill>, 'Recheck live eligibility + owner; idempotency key with 14-day cooldown'],
          ['HubSpot actions + email response', 'Airbyte incremental', 'Warehouse feedback', <Pill tone="brand">4h + daily</Pill>, 'Avoid re-alerts, measure outcomes'],
        ]}
      />
      <div style={{ height: 14 }} />
      <div className="grid c3">
        <Answer label="Warehouse owns the logic">
          <p className="small">Calculations, reasons and timestamps live in one place, versioned and testable. Metabase or Amplitude can inspect trends from it.</p>
        </Answer>
        <Answer label="CRM owns the work">
          <p className="small">HubSpot receives only status, reason codes, last relevant event, freshness and scored-at time, matched on a verified workspace ID.</p>
        </Answer>
        <Answer label="Automation only routes">
          <p className="small">Make/n8n fires after the CRM record updates, not on every raw event. It rechecks eligibility and dedupes, and never re-scores.</p>
        </Answer>
      </div>
      <div style={{ height: 14 }} />
      <Callout title="Why daily?">
        Adoption changes over weeks, so a daily refresh catches it and avoids hourly task noise and reverse-ETL cost. The downside is up to roughly one day's alert delay. If source data is older than the agreed freshness window,
        suppress action and surface a data-quality warning instead.
      </Callout>

      <div style={{ height: 28 }} />
      <BlockTitle>The last mile</BlockTitle>
      <Prompts
        items={[
          'Once the system flags an account, what actually happens next, and who, if anyone, is involved?',
          'What would you use an LLM for in this system, and what would you keep it away from?',
          'If someone needs to act, what has to be in front of them, and what does not? Where would that live?',
        ]}
      />
      <div className="grid c2">
        <Answer label="SSF: no owner, so the product speaks">
          <p className="small">
            For an account with reliable risk evidence, send one approved onboarding email or in-app step tailored to the missing feature. Rate-limited; cancelled and recovered
            accounts are excluded.
          </p>
        </Answer>
        <Answer label="Sales-led: the CSx decides">
          <p className="small">
            Create or update a HubSpot task for the actual CSx owner with the reason, recent trend, evidence timestamp and suggested next step. CSx decides how and when to contact.
          </p>
        </Answer>
      </div>
      <div style={{ height: 14 }} />
      <Card title="Immediately before any action">
        <div className="row-wrap">
          {['Chargebee subscription eligibility', 'HubSpot risk status', 'Current owner', 'Opt-out', 'Recent outreach', 'Idempotency key: workspace_id + risk_reason + cooldown_window'].map((c) => (
            <Pill key={c} tone="brand">
              ✓ {c}
            </Pill>
          ))}
        </div>
        <p className="small muted" style={{ marginTop: 10 }}>
          A newly cancelled or recovered account must be suppressed. Retries or recurring scores can't send duplicate messages or tasks. Slack is reserved for urgent exceptions and
          failed jobs. The action and its resolution are stored against the Workspace.
        </p>
      </Card>
      <div style={{ height: 14 }} />
      <div className="grid c2">
        <Callout tone="ok" title="LLM: yes, for">
          turning approved, structured signals into a short task summary for the CSx.
        </Callout>
        <Callout tone="danger" title="LLM: never for">
          deciding risk status, inventing reasons, accessing message content or sending unreviewed outreach. The deterministic rules stay in the warehouse; people own sensitive
          decisions.
        </Callout>
      </div>

      <div style={{ height: 28 }} />
      <BlockTitle>Knowing it's real</BlockTitle>
      <Prompts
        items={[
          'What does this miss, what breaks, and how would you know it is actually working, not just running?',
          'If you had two weeks and no one else to help, what is the first slice you would ship?',
        ]}
      />
      <DataTable
        head={['Layer', 'What I check', 'Owner', 'Rule']}
        rows={[
          ['Operational', 'Source freshness, duplicate event IDs, missing workspace IDs, failed joins, incorrect statuses, Hightouch sync errors, repeat tasks, false alerts', 'Warehouse + Dagster + CRM', 'No action when data UNKNOWN, risk superseded or subscription cancelled'],
          ['Business', 'Share of at-risk accounts contacted, completed CSx tasks, subsequent successful feature use; eventually SSF 90-day adoption and downgrades', 'Cohort reporting', 'Compare to comparable untreated or holdout accounts'],
          ['Guardrails', 'False-positive rate, outreach opt-outs, extra CSx workload, Airbyte costs', 'Ops review', 'Not just system uptime'],
        ]}
      />
      <div style={{ height: 14 }} />
      <Callout tone="warn" title="What this misses.">
        Until execution events are instrumented, it can't tell a quietly working automation from an abandoned one. It also can't see why a customer leaves, and dashboards alone
        aren't proof an intervention worked.
      </Callout>
      <div style={{ height: 14 }} />
      <Card title="Two-week ship plan: one engineer">
        <DataTable
          head={['Week', 'Build', 'Deliverable', 'Go / no-go', 'Defer']}
          rows={[
            [<Pill tone="brand">Week 1</Pill>, 'Confirm definitions with CSx/Product; validate Workspace ↔ Subscription joins; audit Account A-style event completeness; model 50 paid SSF workspaces', 'Small warehouse evidence table + event-quality gaps', 'Can rows, stages and billing reconcile?', 'Custom ML score, separate app'],
            [<Pill tone="brand">Week 1</Pill>, 'Review-only candidate signals from current events; request workflow/AI execution events as the top instrumentation priority', 'Low-confidence evidence table and reason codes; no outreach from proxy', "No 'no workflow edit' = 'stopped running'", 'Complex behavioural tracking'],
            [<Pill tone="unknown">Week 2</Pill>, 'One daily Dagster model; dry-run rules; Hightouch sync into a HubSpot test view', 'Status / reason / as-of + monitoring', 'Correct workspace, no duplicate tasks', 'Real-time recomputation'],
            [<Pill tone="unknown">Week 2</Pill>, 'Pilot a few human-approved actions only with independent reliable evidence + live eligibility check; log action, key and false positives', 'Gated pilot + audit log', 'Approved owner, current billing, valid risk, no duplicate', 'Automated AI outreach at scale'],
          ]}
        />
      </Card>

      <div style={{ height: 28 }} />
      <details className="more">
        <summary>Original submitted diagram (PNG)</summary>
        <div className="img-frame">
          <img src="artefacts/s4-architecture.png" alt="Original architecture diagram: Superchat customer adoption early-warning system" loading="lazy" />
        </div>
      </details>
    </>
  );
}
