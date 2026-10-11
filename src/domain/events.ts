/**
 * Section 2 accounts. Account A's raw event extract is reproduced exactly from
 * the brief. Accounts B–E only exist as written narratives in the brief; no raw
 * events were supplied for them, and they are labelled that way everywhere.
 */
export interface ProductEvent {
  day: number;
  name: string;
  props: Record<string, string>;
}

const p = (s: string): Record<string, string> =>
  Object.fromEntries(
    s
      .split(';')
      .map((x) => x.trim())
      .filter(Boolean)
      .map((kv) => kv.split('=') as [string, string]),
  );

/** Account A raw extract, in the brief's order. */
export const ACCOUNT_A_EVENTS: ProductEvent[] = [
  [0, 'account_created', 'plan=pro; seats=42; motion=self_signup; region=DACH'],
  [0, 'message_activity_weekly', 'week=1; messages_sent=88; messages_received=184'],
  [0, 'user_invited', 'count=6'],
  [1, 'user_invited', 'count=9'],
  [3, 'campaign_sent', 'first_campaign=true'],
  [4, 'workflow_created', 'workflow_id=wf_01'],
  [5, 'workflow_created', 'workflow_id=wf_02'],
  [6, 'template_created', 'template_id=tpl_01'],
  [7, 'message_activity_weekly', 'week=2; messages_sent=91; messages_received=191'],
  [7, 'workflow_created', 'workflow_id=wf_03'],
  [8, 'ai_agent_created', 'agent_id=ag_01'],
  [9, 'workflow_edited', 'workflow_id=wf_02'],
  [10, 'ai_agent_triggered', 'agent_id=ag_01; runs=4'],
  [12, 'ai_agent_triggered', 'agent_id=ag_01; runs=2'],
  [14, 'message_activity_weekly', 'week=3; messages_sent=93; messages_received=195'],
  [14, 'workflow_edited', 'workflow_id=wf_01'],
  [19, 'workflow_edited', 'workflow_id=wf_03'],
  [21, 'message_activity_weekly', 'week=4; messages_sent=90; messages_received=189'],
  [28, 'message_activity_weekly', 'week=5; messages_sent=89; messages_received=186'],
  [35, 'message_activity_weekly', 'week=6; messages_sent=92; messages_received=193'],
  [42, 'message_activity_weekly', 'week=7; messages_sent=90; messages_received=189'],
  [49, 'message_activity_weekly', 'week=8; messages_sent=91; messages_received=191'],
  [55, 'user_invited', 'count=2'],
  [56, 'message_activity_weekly', 'week=9; messages_sent=90; messages_received=189'],
  [63, 'message_activity_weekly', 'week=10; messages_sent=88; messages_received=184'],
  [71, 'subscription_cancelled', ''],
].map(([day, name, props]) => ({ day: day as number, name: name as string, props: p(props as string) }));

export type EventCategory = 'account' | 'messaging' | 'users' | 'campaign' | 'workflow' | 'template' | 'ai';

export function categoryOf(name: string): EventCategory {
  if (name.startsWith('message_')) return 'messaging';
  if (name.startsWith('user_')) return 'users';
  if (name.startsWith('campaign_')) return 'campaign';
  if (name.startsWith('workflow_')) return 'workflow';
  if (name.startsWith('template_')) return 'template';
  if (name.startsWith('ai_agent_')) return 'ai';
  return 'account';
}

/** Stable sort by day, preserving extract order within a day. */
export function sortEvents(events: ProductEvent[]): ProductEvent[] {
  return events.map((e, i) => [e, i] as const).sort((a, b) => a[0].day - b[0].day || a[1] - b[1]).map(([e]) => e);
}

/** Event names that would prove a depth feature actually ran. The current schema has none. */
export const EXECUTION_EVENT_NAMES = ['workflow_run_succeeded', 'workflow_run_failed', 'ai_agent_run_succeeded', 'ai_agent_run_failed'];

export interface DerivedAccountMetrics {
  activationDay: number | null;
  workflowsCreated: number;
  workflowCreatedDays: number[];
  workflowEditDays: number[];
  lastWorkflowEditDay: number | null;
  templatesCreated: number;
  aiAgentsCreated: number;
  aiTriggerDays: number[];
  aiRunsObserved: number;
  lastAiTriggerDay: number | null;
  cancelledDay: number | null;
  weeklySent: number[];
  weeklyReceived: number[];
  avgSent: number;
  minSent: number;
  maxSent: number;
  /** Raw executions recorded in the extract. Always 0 for the current schema. */
  executionEvents: number;
  executionTelemetry: 'missing' | 'available';
  daysFromLastEditToCancel: number | null;
  daysFromLastAiToCancel: number | null;
  usersInvitedEvents: number[];
}

/** Everything the written timeline claims that can be recomputed from raw events, up to `asOfDay`. */
export function deriveMetrics(events: ProductEvent[], asOfDay = Infinity): DerivedAccountMetrics {
  const ev = sortEvents(events).filter((e) => e.day <= asOfDay);
  const days = (n: string) => ev.filter((e) => e.name === n).map((e) => e.day);
  const first = ev.find((e) => e.name === 'campaign_sent' && e.props.first_campaign === 'true');
  const wfEdits = days('workflow_edited');
  const aiTrig = ev.filter((e) => e.name === 'ai_agent_triggered');
  const weekly = ev.filter((e) => e.name === 'message_activity_weekly');
  const sent = weekly.map((e) => Number(e.props.messages_sent));
  const recv = weekly.map((e) => Number(e.props.messages_received));
  const cancelled = days('subscription_cancelled')[0] ?? null;
  const execs = ev.filter((e) => EXECUTION_EVENT_NAMES.includes(e.name)).length;
  const lastEdit = wfEdits.length ? Math.max(...wfEdits) : null;
  const lastAi = aiTrig.length ? Math.max(...aiTrig.map((e) => e.day)) : null;
  return {
    activationDay: first ? first.day : null,
    workflowsCreated: days('workflow_created').length,
    workflowCreatedDays: days('workflow_created'),
    workflowEditDays: wfEdits,
    lastWorkflowEditDay: lastEdit,
    templatesCreated: days('template_created').length,
    aiAgentsCreated: days('ai_agent_created').length,
    aiTriggerDays: aiTrig.map((e) => e.day),
    aiRunsObserved: aiTrig.reduce((s, e) => s + Number(e.props.runs ?? 0), 0),
    lastAiTriggerDay: lastAi,
    cancelledDay: cancelled,
    weeklySent: sent,
    weeklyReceived: recv,
    avgSent: sent.length ? sent.reduce((a, b) => a + b, 0) / sent.length : 0,
    minSent: sent.length ? Math.min(...sent) : 0,
    maxSent: sent.length ? Math.max(...sent) : 0,
    executionEvents: execs,
    executionTelemetry: execs > 0 ? 'available' : 'missing',
    daysFromLastEditToCancel: cancelled != null && lastEdit != null ? cancelled - lastEdit : null,
    daysFromLastAiToCancel: cancelled != null && lastAi != null ? cancelled - lastAi : null,
    usersInvitedEvents: ev.filter((e) => e.name === 'user_invited').map((e) => Number(e.props.count)),
  };
}

export const ACCOUNT_A_METRICS = deriveMetrics(ACCOUNT_A_EVENTS);

export type EvidenceKind = 'observed' | 'inferred' | 'missing' | 'proposed';

export interface AccountProfile {
  id: 'A' | 'B' | 'C' | 'D' | 'E';
  motion: 'SSF' | 'Sales-led';
  seats: number;
  /** The brief's narrative, verbatim. */
  narrative: string;
  rawEvents: boolean;
  outcome: string;
  evidence: { kind: EvidenceKind; text: string }[];
  /** Illustrative read from the answers (not a scored engine result for B–E). */
  illustrativeStatus: string;
  tone: 'risk' | 'watch' | 'ok';
}

export const ACCOUNTS: AccountProfile[] = [
  {
    id: 'A',
    motion: 'SSF',
    seats: 42,
    narrative:
      'Activated day 3. Built 3 workflow automations in week 1 and set up an AI agent. Last workflow edit day 19; AI agent never triggered after day 12. Core messaging steady (~90/wk) throughout. No check-in on record. Cancelled day 71.',
    rawEvents: true,
    outcome: 'Cancelled day 71',
    illustrativeStatus: 'At risk before cancellation',
    tone: 'risk',
    evidence: [
      { kind: 'observed', text: 'First campaign day 3; workflows created days 4, 5, 7; template day 6; AI agent created day 8.' },
      { kind: 'observed', text: 'workflow_edited on days 9, 14, 19; ai_agent_triggered on days 10 (4 runs) and 12 (2 runs).' },
      { kind: 'observed', text: 'Weekly messages sent 88–93 across 10 snapshots; subscription_cancelled day 71.' },
      { kind: 'inferred', text: 'Advanced-feature interaction may have faded while core messaging continued.' },
      { kind: 'missing', text: 'No workflow or AI execution success/failure events: we cannot tell whether automations kept running.' },
      { kind: 'missing', text: 'No CSx or check-in data in product events; no cancellation reason.' },
      { kind: 'missing', text: 'Whether user_invited counts are new invites or running totals.' },
      { kind: 'proposed', text: 'Instrument workflow/AI run success and failure (P0). Until then, a day-33 edit-recency flag is a low-confidence, human-review-only candidate.' },
    ],
  },
  {
    id: 'B',
    motion: 'SSF',
    seats: 9,
    narrative: 'Activated day 8 (first campaign). Never built a template or workflow. Low-but-steady messaging. Opened 2 of 6 lifecycle emails. Downgraded to Free day 63.',
    rawEvents: false,
    outcome: 'Downgraded to Free day 63',
    illustrativeStatus: 'Watch before downgrade',
    tone: 'watch',
    evidence: [
      { kind: 'observed', text: 'Narrative: activated day 8; no template or workflow; opened 2 of 6 lifecycle emails; downgraded day 63.' },
      { kind: 'inferred', text: 'Never reached depth features, so the product delivered only basic messaging value.' },
      { kind: 'missing', text: 'No raw events supplied for B. Email opens alone are not a reliable engagement signal.' },
      { kind: 'proposed', text: 'Feature-specific onboarding step once eligibility is confirmed.' },
    ],
  },
  {
    id: 'C',
    motion: 'SSF',
    seats: 28,
    narrative:
      'Activated day 1. Self-taught — built templates day 2, five workflows by day 20, AI agents actively running by day 30. Zero human contact. Messaging heavy and growing. Upgraded plan and added 12 seats day 55.',
    rawEvents: false,
    outcome: 'Upgraded, +12 seats day 55',
    illustrativeStatus: 'Healthy signal',
    tone: 'ok',
    evidence: [
      { kind: 'observed', text: 'Narrative: templates day 2, five workflows by day 20, AI agents actively running by day 30; expanded day 55.' },
      { kind: 'inferred', text: 'Strong self-serve adoption: human contact is not required for success.' },
      { kind: 'missing', text: 'No raw events supplied for C.' },
      { kind: 'proposed', text: "Don't flag an account just because it has had no CSx contact." },
    ],
  },
  {
    id: 'D',
    motion: 'Sales-led',
    seats: 35,
    narrative:
      'Activated day 2. CSx onboarding call day 6, follow-up day 24. Built templates week 1, workflow day 30, AI agent day 41 (actively used). Messaging steady and rising. Expanded +15 seats day 82.',
    rawEvents: false,
    outcome: 'Expanded +15 seats day 82',
    illustrativeStatus: 'Healthy signal',
    tone: 'ok',
    evidence: [
      { kind: 'observed', text: 'Narrative: CSx calls day 6 and 24; templates week 1; workflow day 30; AI agent day 41 actively used.' },
      { kind: 'inferred', text: 'Slower but successful progression into depth features.' },
      { kind: 'missing', text: 'No raw events supplied for D.' },
      { kind: 'proposed', text: "Don't over-penalise slower adoption that is still progressing." },
    ],
  },
  {
    id: 'E',
    motion: 'Sales-led',
    seats: 18,
    narrative:
      'Activated day 4. CSx onboarding call day 7. Built 1 template early, then nothing further. Workflow usage never started, despite the call flagging it. Messaging steady. Flat renewal, now at risk; CSx notes "low engagement."',
    rawEvents: false,
    outcome: 'Flat renewal, at risk',
    illustrativeStatus: 'At risk / priority review',
    tone: 'risk',
    evidence: [
      { kind: 'observed', text: 'Narrative: one template early, no workflow usage despite the CSx call flagging it; renewal flat.' },
      { kind: 'inferred', text: 'A known adoption gap persists even with human contact.' },
      { kind: 'missing', text: 'No raw events supplied for E. CSx notes are context, not proof of cause.' },
      { kind: 'proposed', text: 'Priority CSx review with the workflow-adoption playbook.' },
    ],
  },
];
