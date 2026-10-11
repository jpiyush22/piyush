import { useState } from 'react';
import { Answer, BlockTitle, Callout, Card, DataTable, KV, Pill, QA, SectionHero, Stat } from '../components/ui';

interface Ev {
  day: number;
  name: string;
  props: string;
  lane: Lane;
}
type Lane = 'account' | 'messaging' | 'users' | 'campaign' | 'workflow' | 'template' | 'ai';

export const ACCOUNT_A: Ev[] = [
  { day: 0, name: 'account_created', props: 'plan=pro; seats=42; motion=self_signup; region=DACH', lane: 'account' },
  { day: 0, name: 'message_activity_weekly', props: 'week=1; messages_sent=88; messages_received=184', lane: 'messaging' },
  { day: 0, name: 'user_invited', props: 'count=6', lane: 'users' },
  { day: 1, name: 'user_invited', props: 'count=9', lane: 'users' },
  { day: 3, name: 'campaign_sent', props: 'first_campaign=true', lane: 'campaign' },
  { day: 4, name: 'workflow_created', props: 'workflow_id=wf_01', lane: 'workflow' },
  { day: 5, name: 'workflow_created', props: 'workflow_id=wf_02', lane: 'workflow' },
  { day: 6, name: 'template_created', props: 'template_id=tpl_01', lane: 'template' },
  { day: 7, name: 'message_activity_weekly', props: 'week=2; messages_sent=91; messages_received=191', lane: 'messaging' },
  { day: 7, name: 'workflow_created', props: 'workflow_id=wf_03', lane: 'workflow' },
  { day: 8, name: 'ai_agent_created', props: 'agent_id=ag_01', lane: 'ai' },
  { day: 9, name: 'workflow_edited', props: 'workflow_id=wf_02', lane: 'workflow' },
  { day: 10, name: 'ai_agent_triggered', props: 'agent_id=ag_01; runs=4', lane: 'ai' },
  { day: 12, name: 'ai_agent_triggered', props: 'agent_id=ag_01; runs=2', lane: 'ai' },
  { day: 14, name: 'message_activity_weekly', props: 'week=3; messages_sent=93; messages_received=195', lane: 'messaging' },
  { day: 14, name: 'workflow_edited', props: 'workflow_id=wf_01', lane: 'workflow' },
  { day: 19, name: 'workflow_edited', props: 'workflow_id=wf_03', lane: 'workflow' },
  { day: 21, name: 'message_activity_weekly', props: 'week=4; messages_sent=90; messages_received=189', lane: 'messaging' },
  { day: 28, name: 'message_activity_weekly', props: 'week=5; messages_sent=89; messages_received=186', lane: 'messaging' },
  { day: 35, name: 'message_activity_weekly', props: 'week=6; messages_sent=92; messages_received=193', lane: 'messaging' },
  { day: 42, name: 'message_activity_weekly', props: 'week=7; messages_sent=90; messages_received=189', lane: 'messaging' },
  { day: 49, name: 'message_activity_weekly', props: 'week=8; messages_sent=91; messages_received=191', lane: 'messaging' },
  { day: 55, name: 'user_invited', props: 'count=2', lane: 'users' },
  { day: 56, name: 'message_activity_weekly', props: 'week=9; messages_sent=90; messages_received=189', lane: 'messaging' },
  { day: 63, name: 'message_activity_weekly', props: 'week=10; messages_sent=88; messages_received=184', lane: 'messaging' },
  { day: 71, name: 'subscription_cancelled', props: '', lane: 'account' },
];

const LANES: { id: Lane; label: string; color: string }[] = [
  { id: 'messaging', label: 'Core messaging (sent/wk)', color: 'var(--brand)' },
  { id: 'campaign', label: 'Campaign', color: 'var(--navy)' },
  { id: 'workflow', label: 'Workflows', color: 'var(--brand)' },
  { id: 'template', label: 'Templates', color: 'var(--navy)' },
  { id: 'ai', label: 'AI agent', color: 'var(--brand)' },
  { id: 'users', label: 'Users invited', color: 'var(--muted-line)' },
  { id: 'account', label: 'Account', color: 'var(--risk)' },
];

function Timeline() {
  const [hover, setHover] = useState<Ev | null>(null);
  const [showWatch, setShowWatch] = useState(true);
  const W = 980;
  const left = 170;
  const right = 20;
  const laneH = 46;
  const top = 26;
  const H = top + LANES.length * laneH + 30;
  const x = (d: number) => left + (d / 75) * (W - left - right);
  const laneY = (l: Lane) => top + LANES.findIndex((L) => L.id === l) * laneH + laneH / 2;

  return (
    <Card
      title="Account A: raw events, plotted"
      right={
        <label className="row-wrap small" style={{ cursor: 'pointer' }}>
          <input type="checkbox" checked={showWatch} onChange={(e) => setShowWatch(e.target.checked)} />
          Show candidate 14-day review point
        </label>
      }
    >
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
          {LANES.map((L) => (
            <g key={L.id}>
              <text x={10} y={laneY(L.id) + 4} fontSize="12.5" fill="var(--ink-2)" fontWeight={600}>
                {L.label}
              </text>
              <line x1={left} x2={W - right} y1={laneY(L.id)} y2={laneY(L.id)} stroke="var(--line)" strokeDasharray="2 4" />
            </g>
          ))}
          {/* Depth-feature activity window, then silence */}
          <rect x={x(4)} y={laneY('workflow') - 16} width={x(19) - x(4)} height={laneY('ai') - laneY('workflow') + 32} rx={10} fill="var(--brand-light)" opacity={0.3} />
          {showWatch && (
            <g>
              <line x1={x(33)} x2={x(33)} y1={top - 10} y2={H - 26} stroke="var(--watch)" strokeWidth={2} strokeDasharray="5 4" />
              <rect x={x(33) + 6} y={top - 18} width={168} height={20} rx={6} fill="var(--watch-soft)" />
              <text x={x(33) + 12} y={top - 4} fontSize="11.5" fill="var(--watch)" fontWeight={700}>
                d33 · 14d with no recorded edit
              </text>
              <line x1={x(33)} x2={x(71)} y1={H - 34} y2={H - 34} stroke="var(--watch)" strokeWidth={1.5} />
              <text x={(x(33) + x(71)) / 2} y={H - 38} fontSize="11" textAnchor="middle" fill="var(--watch)" fontWeight={600}>
                38 days before cancellation (hypothetical lead time)
              </text>
            </g>
          )}
          {ACCOUNT_A.map((e, i) => {
            const L = LANES.find((l) => l.id === e.lane)!;
            const cx = x(e.day);
            const cy = laneY(e.lane);
            if (e.lane === 'messaging') {
              const sent = Number(/messages_sent=(\d+)/.exec(e.props)?.[1] ?? 0);
              const h = ((sent - 80) / 15) * 30;
              return (
                <rect
                  key={i}
                  x={cx - 9}
                  y={cy + 14 - h}
                  width={18}
                  height={h}
                  rx={3}
                  fill={L.color}
                  opacity={hover === e ? 1 : 0.75}
                  onMouseEnter={() => setHover(e)}
                  onFocus={() => setHover(e)}
                  tabIndex={0}
                  style={{ cursor: 'pointer' }}
                />
              );
            }
            const isEdit = e.name.endsWith('edited') || e.name.endsWith('triggered');
            const isEnd = e.name === 'subscription_cancelled';
            return (
              <g key={i} onMouseEnter={() => setHover(e)} onFocus={() => setHover(e)} tabIndex={0} style={{ cursor: 'pointer' }}>
                {isEnd ? (
                  <path d={`M${cx - 8} ${cy - 8} L${cx + 8} ${cy + 8} M${cx + 8} ${cy - 8} L${cx - 8} ${cy + 8}`} stroke={L.color} strokeWidth={3.5} strokeLinecap="round" />
                ) : (
                  <circle cx={cx} cy={cy} r={hover === e ? 9 : 7} fill={isEdit ? 'var(--surface)' : L.color} stroke={L.color} strokeWidth={2.5} />
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="tl-tooltip" aria-live="polite">
        {hover ? (
          <>
            <strong>Day {hover.day}</strong> · <code>{hover.name}</code> {hover.props && <span className="muted">{hover.props}</span>}
          </>
        ) : (
          <span className="muted">Hover or tab through a marker to see the raw event. Filled = created/sent, hollow = edited/triggered, bars = weekly messages sent.</span>
        )}
      </div>
    </Card>
  );
}

const ACCOUNTS = [
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

      <Timeline />

      <div className="grid c4" style={{ margin: '16px 0 28px' }}>
        <Stat label="Activation lag" value="3 days" note="campaign_sent first_campaign=true" />
        <Stat label="Last workflow edit" value="Day 19" note="52 days before cancellation" />
        <Stat label="Last AI trigger" value="Day 12" note="6 runs total · 59 days before" />
        <Stat label="Sent / week" value="90.2" note="Range 88–93 across 10 weeks" />
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
            {ACCOUNTS.map((a) => (
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
