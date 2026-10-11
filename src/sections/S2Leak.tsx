import { useMemo, useState } from 'react';
import { Answer, BlockTitle, Callout, Card, DataTable, KV, Pill, Prov, QA, SectionHero, Stat } from '../components/ui';
import { ACCOUNTS as PROFILES, ACCOUNT_A_EVENTS, ACCOUNT_A_METRICS as AM, categoryOf, type EventCategory, type EvidenceKind, type ProductEvent } from '../domain/events';
import { RULES, accountASnapshot, scoreWorkspace, type RiskResult } from '../domain/risk';
import { useApp } from '../state/store';

const LANES: { id: EventCategory; label: string; color: string }[] = [
  { id: 'messaging', label: 'Core messaging (sent/wk)', color: 'var(--brand)' },
  { id: 'campaign', label: 'Campaign', color: 'var(--navy)' },
  { id: 'workflow', label: 'Workflows', color: 'var(--brand)' },
  { id: 'template', label: 'Templates', color: 'var(--navy)' },
  { id: 'ai', label: 'AI agent', color: 'var(--brand)' },
  { id: 'users', label: 'Users invited', color: 'var(--muted-line)' },
  { id: 'account', label: 'Account', color: 'var(--risk)' },
];

const evProps = (e: ProductEvent) =>
  Object.entries(e.props)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');

function Timeline({ lanes, selected, onSelect, evalDay }: { lanes: Set<EventCategory>; selected: number | null; onSelect: (i: number) => void; evalDay: number }) {
  const W = 980;
  const left = 170;
  const right = 20;
  const shown = LANES.filter((l) => lanes.has(l.id));
  const laneH = 46;
  const top = 30;
  const H = top + Math.max(shown.length, 1) * laneH + 34;
  const x = (d: number) => left + (d / 75) * (W - left - right);
  const laneY = (l: EventCategory) => top + shown.findIndex((L) => L.id === l) * laneH + laneH / 2;
  const has = (l: EventCategory) => lanes.has(l);

  return (
    <div className="svg-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Account A event timeline from day 0 to day 71">
        {[0, 7, 14, 21, 28, 35, 42, 49, 56, 63, 70].map((d) => (
          <g key={d}>
            <line x1={x(d)} x2={x(d)} y1={top - 6} y2={H - 26} stroke="var(--line)" />
            <text x={x(d)} y={H - 10} fontSize="11" textAnchor="middle" fill="var(--ink-3)">
              d{d}
            </text>
          </g>
        ))}
        {shown.map((L) => (
          <g key={L.id}>
            <text x={10} y={laneY(L.id) + 4} fontSize="12.5" fill="var(--ink-2)" fontWeight={600}>
              {L.label}
            </text>
            <line x1={left} x2={W - right} y1={laneY(L.id)} y2={laneY(L.id)} stroke="var(--line)" strokeDasharray="2 4" />
          </g>
        ))}
        {has('workflow') && has('ai') && (
          <rect className="anim-rise" x={x(4)} y={laneY('workflow') - 16} width={x(19) - x(4)} height={Math.abs(laneY('ai') - laneY('workflow')) + 32} rx={10} fill="var(--brand-light)" opacity={0.3} />
        )}
        {/* Low-confidence day-33 candidate: 14 days after the last recorded edit */}
        <g>
          <line x1={x(33)} x2={x(33)} y1={top - 12} y2={H - 26} stroke="var(--watch)" strokeWidth={2} strokeDasharray="5 4" className="flow-anim flow-slow" />
          <rect x={x(33) + 6} y={top - 26} width={250} height={20} rx={6} fill="var(--watch-soft)" />
          <text x={x(33) + 12} y={top - 12} fontSize="11.5" fill="var(--watch)" fontWeight={700}>
            d33 candidate · low confidence · human review only
          </text>
        </g>
        {/* Engine evaluation day */}
        <line x1={x(evalDay)} x2={x(evalDay)} y1={top - 6} y2={H - 26} stroke="var(--brand)" strokeWidth={2} />
        <circle cx={x(evalDay)} cy={H - 26} r={5} fill="var(--brand)" />
        <circle cx={x(evalDay)} cy={H - 26} r={6} fill="none" stroke="var(--brand)" className="pulse" />
        {ACCOUNT_A_EVENTS.map((e, i) => {
          const cat = categoryOf(e.name);
          if (!lanes.has(cat)) return null;
          const L = LANES.find((l) => l.id === cat)!;
          const cx = x(e.day);
          const cy = laneY(cat);
          const sel = selected === i;
          const delay = { animationDelay: `${i * 35}ms` };
          if (cat === 'messaging') {
            const sent = Number(e.props.messages_sent);
            const h = ((sent - 80) / 15) * 30;
            return (
              <rect
                key={i}
                className="anim-rise"
                x={cx - 9}
                y={cy + 14 - h}
                width={18}
                height={h}
                rx={3}
                fill={L.color}
                opacity={sel ? 1 : 0.75}
                stroke={sel ? 'var(--navy)' : 'none'}
                strokeWidth={2}
                onClick={() => onSelect(i)}
                onKeyDown={(k) => k.key === 'Enter' && onSelect(i)}
                tabIndex={0}
                role="button"
                aria-label={`Day ${e.day} ${e.name}`}
                style={{ cursor: 'pointer', ...delay }}
              />
            );
          }
          const hollow = e.name.endsWith('edited') || e.name.endsWith('triggered');
          return (
            <g
              key={i}
              className="anim-rise"
              onClick={() => onSelect(i)}
              onKeyDown={(k) => k.key === 'Enter' && onSelect(i)}
              tabIndex={0}
              role="button"
              aria-label={`Day ${e.day} ${e.name}`}
              style={{ cursor: 'pointer', ...delay }}
            >
              {e.name === 'subscription_cancelled' ? (
                <path d={`M${cx - 8} ${cy - 8} L${cx + 8} ${cy + 8} M${cx + 8} ${cy - 8} L${cx - 8} ${cy + 8}`} stroke={L.color} strokeWidth={3.5} strokeLinecap="round" />
              ) : (
                <circle cx={cx} cy={cy} r={sel ? 9 : 7} fill={hollow ? 'var(--surface)' : L.color} stroke={sel ? 'var(--navy)' : L.color} strokeWidth={sel ? 3 : 2.5} />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

const KIND_META: Record<EvidenceKind, { title: string; tone: 'brand' | 'outline' | 'watch' | 'ok' }> = {
  observed: { title: 'Observed evidence', tone: 'brand' },
  inferred: { title: 'Inferred possibility', tone: 'outline' },
  missing: { title: 'Missing information', tone: 'watch' },
  proposed: { title: 'Proposed next step', tone: 'ok' },
};

const STATE_TONE: Record<string, 'risk' | 'watch' | 'ok' | 'unknown' | 'outline'> = {
  'AT RISK': 'risk',
  WATCH: 'watch',
  HEALTHY: 'ok',
  RECOVERED: 'ok',
  UNKNOWN: 'unknown',
  EXCLUDED: 'outline',
};

export function RiskResultCard({ r }: { r: RiskResult }) {
  return (
    <div className="card anim-rise" style={{ background: 'var(--surface-2)' }} data-testid="risk-result">
      <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
        <div className="row-wrap">
          <Pill tone={STATE_TONE[r.state]}>{r.state}</Pill>
          <Pill tone={r.confidence === 'HIGH' ? 'ok' : 'unknown'}>Confidence {r.confidence}</Pill>
          <Pill tone="outline">Queue: {r.queue.replace('_', ' ')}</Pill>
        </div>
        <span className="tiny muted">
          {r.workspaceId} · model {r.modelVersion} · as-of day {r.asOfDay} · source {r.sourceFreshnessHours}h old
        </span>
      </div>
      <p className="small" style={{ margin: '12px 0' }}>
        {r.explanation}
      </p>
      <div className="row-wrap" style={{ marginBottom: 12 }}>
        <span className="small">
          <strong>Reason codes:</strong>
        </span>
        {r.reasons.map((x) => (
          <code key={x}>{x}</code>
        ))}
      </div>
      <DataTable
        head={['Evidence', 'Value', 'Day', 'Source', 'Supports risk?']}
        rows={r.evidence.map((e) => [e.label, e.value, e.day ?? '—', e.source, e.supportsRisk ? 'yes' : 'no'])}
      />
      <p className="small" style={{ marginTop: 10 }}>
        <strong>Proposed next step:</strong>{' '}
        {
          {
            csx_task: 'Human review in Signal Desk, then a guarded CSx task.',
            ssf_nudge: 'Human review in Signal Desk, then a guarded SSF nudge with approved content.',
            data_quality_review: 'Data-quality review. No customer action.',
            human_review_only: 'Human review only. No customer outreach from an edit-recency proxy.',
            none: 'None.',
          }[r.proposedAction]
        }{' '}
        <span className="muted">Review-eligible for customer action: {r.reviewEligible ? 'yes' : 'no'}.</span>
      </p>
    </div>
  );
}

function AccountExplorer() {
  const { openDq, state } = useApp();
  const [acct, setAcct] = useState<'A' | 'B' | 'C' | 'D' | 'E'>('A');
  const [lanes, setLanes] = useState<Set<EventCategory>>(new Set(LANES.map((l) => l.id)));
  const [selected, setSelected] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [evalDay, setEvalDay] = useState(33);
  const [run, setRun] = useState<RiskResult | null>(null);
  const profile = PROFILES.find((p) => p.id === acct)!;
  const dqOpen = state.dq.some((d) => d.workspaceId === 'ACCOUNT-A' && d.status === 'open');

  const rows = useMemo(
    () =>
      ACCOUNT_A_EVENTS.map((e, i) => ({ e, i })).filter(
        ({ e }) => lanes.has(categoryOf(e.name)) && (`${e.name} ${evProps(e)} d${e.day}`.toLowerCase().includes(query.trim().toLowerCase())),
      ),
    [lanes, query],
  );

  const toggle = (l: EventCategory) =>
    setLanes((s) => {
      const n = new Set(s);
      if (n.has(l)) n.delete(l);
      else n.add(l);
      return n;
    });

  const sel = selected != null ? ACCOUNT_A_EVENTS[selected] : null;

  return (
    <Card
      title="Account explorer"
      right={
        <div className="seg" role="group" aria-label="Select account">
          {PROFILES.map((p) => (
            <button key={p.id} aria-pressed={acct === p.id} onClick={() => setAcct(p.id)}>
              Account {p.id}
            </button>
          ))}
        </div>
      }
    >
      <div className="row-wrap" style={{ marginBottom: 12 }}>
        <Pill tone="outline">
          {profile.motion} · {profile.seats} seats
        </Pill>
        <Pill tone={profile.tone}>{profile.outcome}</Pill>
        <Prov kind="case-study" />
        <span className="tiny muted">{profile.rawEvents ? 'Raw event extract supplied (26 events)' : 'Narrative only: no raw events were supplied for this account'}</span>
      </div>
      <blockquote className="quote">“{profile.narrative}”</blockquote>
      <div className="grid c4" style={{ marginTop: 14 }} data-testid="evidence-split">
        {(['observed', 'inferred', 'missing', 'proposed'] as EvidenceKind[]).map((k) => (
          <div key={k} className="card" style={{ padding: 14, background: 'var(--surface-2)' }}>
            <Pill tone={KIND_META[k].tone}>{KIND_META[k].title}</Pill>
            <ul className="small" style={{ margin: '8px 0 0', paddingLeft: 18 }}>
              {profile.evidence
                .filter((e) => e.kind === k)
                .map((e) => (
                  <li key={e.text}>{e.text}</li>
                ))}
            </ul>
          </div>
        ))}
      </div>

      {acct === 'A' ? (
        <>
          <div className="row-wrap" style={{ margin: '18px 0 8px' }}>
            <span className="small muted">Show lanes:</span>
            {LANES.map((l) => (
              <label key={l.id} className="chip">
                <input type="checkbox" checked={lanes.has(l.id)} onChange={() => toggle(l.id)} />
                {l.label}
              </label>
            ))}
          </div>
          {lanes.size === 0 ? (
            <div className="empty">No lanes selected. Tick at least one lane to see events.</div>
          ) : (
            <Timeline lanes={lanes} selected={selected} onSelect={setSelected} evalDay={evalDay} />
          )}
          <div className="tl-tooltip" aria-live="polite">
            {sel ? (
              <>
                <strong>Day {sel.day}</strong> · <code>{sel.name}</code> <span className="muted">{evProps(sel) || '(no properties)'}</span> ·{' '}
                <span className="tiny muted">raw extract row {selected! + 1} of 26</span>
              </>
            ) : (
              <span className="muted">Click a marker (or a table row) to inspect the raw event. Filled = created/sent, hollow = edited/triggered, bars = weekly messages sent.</span>
            )}
          </div>

          <div className="grid c2" style={{ marginTop: 16 }}>
            <div>
              <label className="nav-search" style={{ background: 'var(--surface-3)', borderColor: 'var(--line)', color: 'var(--ink-3)', marginBottom: 8 }}>
                <input placeholder="Filter events (e.g. workflow, d19, runs=)" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Filter events" style={{ color: 'var(--ink)' }} />
              </label>
              <div className="table-wrap" style={{ maxHeight: 320, overflow: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th className="num">Day</th>
                      <th>Event</th>
                      <th>Properties</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={3} className="muted">
                          No events match this filter.
                        </td>
                      </tr>
                    )}
                    {rows.map(({ e, i }) => (
                      <tr key={i} onClick={() => setSelected(i)} style={{ cursor: 'pointer', background: selected === i ? 'var(--brand-softer)' : undefined }}>
                        <td className="num">{e.day}</td>
                        <td>
                          <code>{e.name}</code>
                        </td>
                        <td className="tiny">{evProps(e)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="tiny muted" style={{ marginTop: 6 }}>
                {rows.length} of 26 events shown. Execution events in the extract: <strong>{AM.executionEvents}</strong>, so execution telemetry is{' '}
                <strong>{AM.executionTelemetry.toUpperCase()}</strong>.
              </p>
            </div>
            <div className="card" style={{ background: 'var(--surface-2)' }} id="s2-engine">
              <h3>Run the risk engine on Account A</h3>
              <label className="field">
                Evaluate as of day <strong style={{ color: 'var(--ink)' }}>{evalDay}</strong>
                <input className="range" type="range" min={0} max={75} value={evalDay} onChange={(e) => setEvalDay(+e.target.value)} aria-label="Evaluation day" />
              </label>
              <div className="row-wrap" style={{ marginTop: 10 }}>
                <button className="btn primary" onClick={() => setRun(scoreWorkspace(accountASnapshot(evalDay)))} data-testid="run-engine-a">
                  Run risk engine
                </button>
                <span className="tiny muted">Grace {RULES.graceDays.SSF}d · stall {RULES.stallDays}d · freshness {RULES.freshnessWindowHours}h</span>
                <Prov kind="proposed" />
              </div>
              {run && run.asOfDay !== evalDay && <p className="tiny" style={{ color: 'var(--watch)', marginTop: 8 }}>Result below is for day {run.asOfDay}. Run again for day {evalDay}.</p>}
              {run && (
                <div style={{ marginTop: 12 }}>
                  <RiskResultCard r={run} />
                  {run.state === 'UNKNOWN' && (
                    <div className="row-wrap" style={{ marginTop: 10 }}>
                      <button
                        className="btn"
                        disabled={dqOpen}
                        onClick={() =>
                          openDq({
                            workspaceId: 'ACCOUNT-A',
                            source: 'section-2',
                            reason: `Execution telemetry missing${run.reasons.includes('EDIT_RECENCY_PROXY_LOW_CONFIDENCE') ? '; day-33 edit-recency candidate needs human review' : ''}`,
                          })
                        }
                      >
                        {dqOpen ? '✓ In Signal Desk · Data quality' : 'Send to Signal Desk · Data quality'}
                      </button>
                      <span className="tiny muted">Opens a data-quality case only. It never creates customer outreach.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <Callout tone="warn" title={`No raw events for Account ${acct}.`}>
          The brief describes Account {acct} only in prose, so the engine can't be run on it, and the app doesn't invent events. The illustrative read from my answer is shown in Q2
          below.
        </Callout>
      )}
    </Card>
  );
}

const ANSWER_READS = [
  {
    id: 'A',
    motion: 'SSF',
    seats: 42,
    pattern: 'Messaging steady (~90/wk); last workflow edit day 19, AI trigger day 12; cancelled day 71.',
    status: ['At risk before cancellation', 'risk'],
    reason: 'Advanced-feature events faded.',
    guard: 'Workflow may still run; only observed events available',
  },
  {
    id: 'B',
    motion: 'SSF',
    seats: 9,
    pattern: 'Activated day 8; no template/workflow; light messaging; downgraded day 63.',
    status: ['Watch before downgrade', 'watch'],
    reason: 'No depth-feature adoption observed.',
    guard: "Don't use email opens alone",
  },
  {
    id: 'C',
    motion: 'SSF',
    seats: 28,
    pattern: 'Built templates, 5 workflows and active AI agents; expanded day 55.',
    status: ['Healthy signal', 'ok'],
    reason: 'Strong adoption despite no human contact.',
    guard: "Don't flag solely for no CSx",
  },
  {
    id: 'D',
    motion: 'Sales-led',
    seats: 35,
    pattern: 'CSx contact; templates week 1, workflow day 30, active AI day 41; expanded day 82.',
    status: ['Healthy signal', 'ok'],
    reason: 'Progressing into depth features.',
    guard: "Don't over-penalise slower but successful adoption",
  },
  {
    id: 'E',
    motion: 'Sales-led',
    seats: 18,
    pattern: 'CSx call flagged workflows; template only, no workflow usage; renewal flat, at risk.',
    status: ['At risk / priority review', 'risk'],
    reason: 'Known adoption gap despite human contact.',
    guard: 'CSx notes are context, not proof of cause',
  },
] as const;

export default function S2Leak() {
  return (
    <>
      <SectionHero
        eyebrow="Section 2"
        title="Dig into the leak"
        lede="Five representative accounts (three SSF, two Sales-led) and one raw event extract. Recompute the human read from the events, then design detection for thousands of accounts."
        tags={
          <>
            <Pill tone="risk">Depth features fade, messaging stays flat</Pill>
            <Pill tone="unknown">Edits ≠ executions</Pill>
            <Pill tone="brand">Daily, explainable, per workspace</Pill>
          </>
        }
      />

      <div id="s2-explorer">
        <AccountExplorer />
      </div>

      <div className="grid c4" style={{ margin: '16px 0 28px' }}>
        <Stat label="Activation lag" value={`${AM.activationDay} days`} note="campaign_sent first_campaign=true" />
        <Stat label="Last workflow edit" value={`Day ${AM.lastWorkflowEditDay}`} note={`${AM.daysFromLastEditToCancel} days before cancellation`} />
        <Stat label="Last AI trigger" value={`Day ${AM.lastAiTriggerDay}`} note={`${AM.aiRunsObserved} runs total · ${AM.daysFromLastAiToCancel} days before`} />
        <Stat label="Sent / week" value={AM.avgSent.toFixed(1)} note={`Range ${AM.minSent}–${AM.maxSent} across ${AM.weeklySent.length} weeks`} />
      </div>

      <BlockTitle>Questions</BlockTitle>

      <QA
        num="Q1"
        question="The Account A timeline above was written by a person. Using only the raw event data, what would you compute to arrive at the same read, and what in the written timeline can you not actually derive from these events?"
        summary="Messaging stayed steady while recorded advanced-feature actions faded before cancellation. The events can't prove the workflows stopped running, or that nobody checked in."
      >
        <DataTable
          head={['Metric', 'Value', 'How I worked it out']}
          rows={[
            ['Account created (day)', '0', <code>account_created</code>],
            ['First campaign (day)', '3', <code>campaign_sent, first_campaign=true</code>],
            ['Activation lag (days)', '3', 'First campaign minus account_created'],
            ['Workflows created', '3', 'workflow_created on days 4, 5, 7'],
            ['Last workflow edit (day)', '19', 'workflow_edited on days 9, 14, 19'],
            ['AI agent runs (observed)', '6', '4 runs day 10 + 2 runs day 12'],
            ['Last AI trigger (day)', '12', 'Last ai_agent_triggered event in extract'],
            ['Subscription cancelled (day)', '71', <code>subscription_cancelled</code>],
            ['Days since last workflow edit', '52', '52 days from last edit to cancellation; not proof workflows stopped running.'],
            ['Days since last AI trigger', '59', '59 days from last recorded AI trigger; check whether tracking is complete.'],
            ['Sent messages / week (avg)', '90.2', 'Average across 10 weekly records.'],
            ['Weekly sent (min–max)', '88–93', 'Lowest and highest weekly sent message counts.'],
          ]}
        />
        <div className="grid c2">
          <Answer label="What I'd calculate">
            <p>
              First campaign on day 3 (three days after signup); three workflows created by day 7; a template created on day 6; and an AI agent created on day 8. The last
              recorded workflow edit was on day 19. The agent triggered six times, most recently on day 12.
            </p>
            <p>
              Messaging stayed steady at 88–93 sent messages per week. The account cancelled on day 71, which is 52 days after the last workflow edit and 59 days after the last
              recorded AI trigger. This suggests advanced-feature activity may have fallen while basic messaging continued.
            </p>
          </Answer>
          <Answer label="What I can't prove">
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Creation and edit events don't tell me whether workflows kept running or delivered value.</li>
              <li>Product events don't show whether anyone checked in with the customer, or why they cancelled.</li>
              <li>No AI triggers appear after day 12. I'd verify the event log is complete before saying the agent stopped.</li>
              <li>
                I'd say "three workflows by day 7", not "in week 1", because day 7 is labelled <code>week=2</code> in the data.
              </li>
              <li>The week 1 summary is dated day 0. Check how weekly periods are recorded.</li>
            </ul>
          </Answer>
        </div>
      </QA>

      <QA
        num="Q2"
        question="These five accounts are representative of thousands. Design how you'd detect the accounts worth worrying about at that scale: what would you compute, where in the stack would each piece live, and how fresh would it need to be?"
        summary="A daily, workspace-level early-warning view with a clear reason on every flag, not a black-box score. Compare SSF and Sales-led separately, by account age and plan."
      >
        <Card title="Signals to compute">
          <DataTable
            head={['Signal', "How I'd calculate it", 'Source', 'Where it lives', 'Refresh']}
            rows={[
              ['Activation', 'Days from account_created to first campaign_sent. No campaign = not activated.', 'Product events', 'Warehouse workspace model', 'Daily'],
              [
                'Depth features',
                'Distinct templates/workflows/agents created; AI runs; days since last relevant recorded event. Does not prove workflow execution.',
                'Product events',
                'Warehouse workspace model',
                'Daily',
              ],
              ['Core messaging', "Last 2 weeks' sent and received vs previous 2 weeks; stable messaging alone isn't healthy.", 'message_activity_weekly', 'Warehouse workspace model', 'Daily'],
              ['Engagement & CSx', 'Lifecycle email interactions; CSx calls and follow-ups; owner and open concerns.', 'HubSpot / lifecycle history', 'Warehouse joins on workspace ID', 'Daily'],
              ['Commercial', 'Paid plan, seats, upgrades, downgrades, cancellation and upcoming renewal.', 'Chargebee / Stripe', 'Warehouse; current billing state', 'Hours / daily'],
              ['Data confidence', "Age of last valid event; source sync status; missing data is 'Unknown', not inactivity.", 'Event freshness + Dagster runs', 'Warehouse QA + orchestration', 'Each sync'],
            ]}
          />
        </Card>
        <Card title="Process: system handoff">
          <div className="steps">
            {[
              ['Collect', 'Airbyte → Warehouse · every few hours / daily', 'Incrementally ingest events, customer context and subscription data. Avoid expensive full resyncs.'],
              ['Model', 'Warehouse + Dagster · daily', 'Compute workspace signals; segment by motion, plan and lifecycle age; save status, reasons and as-of timestamp.'],
              ['Sync', 'Hightouch → HubSpot · daily after model completes', 'Write status, reasons and last-updated time back to the Workspace record, so it is actionable in the CRM GTM already uses.'],
              [
                'Respond',
                'HubSpot + Make/n8n · after each sync',
                'Sales-led: CSx follow-up task. SSF: relevant lifecycle guidance or an owned review queue. Slack only for urgent, high-priority cases.',
              ],
            ].map(([t, where, d], i) => (
              <div className="step" key={t}>
                <div className="n">{i + 1}</div>
                <div>
                  <div className="t">
                    {t} <span className="muted small">· {where}</span>
                  </div>
                  <div className="d">{d}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Callout title="Risk logic.">
          Start with easy-to-explain rules. Test ~14 days without depth-feature adoption or new recorded depth activity as <em>one</em> watch signal, not proof that features
          stopped working. One meaningful warning = <strong>Watch</strong>; several together = <strong>At risk</strong>. Calibrate thresholds against real outcomes before relying on
          them. Missing or delayed data is <strong>Unknown</strong> until checked.
        </Callout>
        <Card title="Checking the logic against the five accounts">
          <div className="grid c3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
            {ANSWER_READS.map((a) => (
              <div key={a.id} className="card" style={{ padding: 16, background: 'var(--surface-2)' }}>
                <div className="row-wrap" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                  <strong style={{ fontSize: 18 }}>Account {a.id}</strong>
                  <Pill tone="outline">
                    {a.motion} · {a.seats}
                  </Pill>
                </div>
                <Pill tone={a.status[1]}>{a.status[0]}</Pill>
                <p className="small" style={{ marginTop: 10 }}>
                  {a.pattern}
                </p>
                <p className="small">
                  <strong>Why:</strong> {a.reason}
                </p>
                <p className="tiny muted">
                  <strong>Guardrail:</strong> {a.guard}
                </p>
              </div>
            ))}
          </div>
          <p className="tiny muted" style={{ marginTop: 12 }}>
            Illustrative, not scored. Only Account A has underlying raw events; B–E statuses come from the supplied narratives. A production rule needs validated tracking, time
            windows and outcomes.
          </p>
        </Card>
        <DataTable
          head={['Worked check (Account A raw events)', 'Later', 'Earlier', 'Result', 'Meaning']}
          num={[1, 2, 3]}
          rows={[
            ['Last workflow edit → cancellation', '71', '19', '52', '52-day gap in editing, not proof workflows stopped'],
            ['Last AI trigger → cancellation', '71', '12', '59', '59-day gap in observed AI triggers'],
            ['Weekly messages range', '93', '88', '5', 'Only 5 messages from min to max across 10 weeks'],
            ['Illustrative inactivity watch day', '19', '+14', '33', 'Day 33 would be a candidate check, not proof of inactivity'],
          ]}
        />
      </QA>

      <QA
        num="Q3"
        question="What's missing from this event schema: what would you instrument first, and what would you deliberately not bother capturing even though you could?"
        summary="First: whether workflows and AI agents actually run and succeed. Skip clicks, page views, message bodies and AI transcripts."
      >
        <Card title="Instrument first, in priority order">
          <DataTable
            head={['Priority', 'Event or signal', 'Essential fields', 'What it answers', 'RevOps use']}
            rows={[
              [
                <Pill tone="risk">P0</Pill>,
                'Workflow execution: success / failure',
                <code>workspace_id, workflow_id, run_id, occurred_at, status, error_category</code>,
                'Did the workflow actually run and succeed?',
                'Last successful run, failures; prevent false inactivity flags',
              ],
              [
                <Pill tone="risk">P0</Pill>,
                'AI agent result: success / failure',
                <code>workspace_id, agent_id, run_id, occurred_at, status, error_category</code>,
                'Did the agent produce a successful outcome, not just trigger?',
                'Successful runs and recent failures (no transcripts)',
              ],
              [
                <Pill tone="risk">P0</Pill>,
                'Reliable event envelope',
                <code>event_id, workspace_id, occurred_at, ingested_at, feature_id, event_version</code>,
                'Can we join, deduplicate and trust event timing?',
                'Protect daily risk signals from missing/delayed events',
              ],
              [<Pill tone="watch">P1</Pill>, 'Template used', <code>workspace_id, template_id, occurred_at, use_context</code>, 'Was a template used after creation?', 'Adoption beyond one-time setup'],
              [
                <Pill tone="watch">P1</Pill>,
                'Workflow / agent enabled, paused, deleted',
                <code>workspace_id, feature_id, state, occurred_at</code>,
                'Did someone intentionally disable a feature?',
                'Separate stopped from unchanged-but-running',
              ],
              [
                <Pill tone="watch">P1</Pill>,
                'Seat activation and usage',
                <code>workspace_id, user_id (pseudonymous), status, active_day</code>,
                'How many licensed users actually participate?',
                'Active seats; matters for a 42-seat workspace',
              ],
              [
                <Pill tone="watch">P1</Pill>,
                'Weekly message window',
                <code>period_start, period_end, sent_count, received_count</code>,
                'What dates does week=1 refer to?',
                'Reliable messaging trend comparisons',
              ],
              [
                <Pill tone="brand">Join</Pill>,
                "CSx touchpoints, lifecycle emails, plan and seats",
                'HubSpot / lifecycle + Chargebee / Stripe by workspace',
                'What support or commercial change happened?',
                "Join, don't duplicate as product events",
              ],
            ]}
          />
        </Card>
        <div className="grid c3">
          {[
            ['Every hover, click and page view', 'High noise and cost; little proof of value.'],
            ['Raw customer message bodies', 'Sensitive personal data. Use message counts and trends instead.'],
            ['Full AI conversation transcripts', 'Privacy and storage burden. Track run status and outcomes instead.'],
          ].map(([t, d]) => (
            <div key={t} className="card" style={{ padding: 16 }}>
              <Pill tone="outline">Deliberately skip</Pill>
              <h3 style={{ marginTop: 10, fontSize: 15 }}>{t}</h3>
              <p className="small muted">{d}</p>
            </div>
          ))}
        </div>
        <Answer label="What this changes for Account A">
          <KV
            items={[
              ['Observed', 'Last workflow edit day 19; last AI trigger day 12; messaging ~90 sent/week.'],
              ['Unknown today', 'Whether workflows were still running successfully; whether AI outcomes were useful; whether invited users adopted the product.'],
              ['Better test', 'Compare recent successful workflow / AI runs and active seats with previous periods before flagging a customer as inactive.'],
              ['Caution', 'New fields need consistent definitions, deduplication and validation. The current user_invited events don’t say whether counts are new invites or running totals.'],
              ['The goal', 'Distinguish customers whose automations are quietly working from customers who created features but never really adopted them.'],
            ]}
          />
        </Answer>
      </QA>
    </>
  );
}
