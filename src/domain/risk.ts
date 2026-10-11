/**
 * Section 4 risk engine. Deterministic, explainable rules, one result per
 * Workspace per as-of day. In production this logic would live in the
 * warehouse (SQL/dbt, orchestrated by Dagster); this TypeScript port runs the
 * same rules in the browser so they can be demonstrated and tested.
 *
 * Thresholds are the PROPOSED pilot values from the answers, to be calibrated
 * against outcomes. They are not Superchat benchmarks.
 */
import { ACCOUNT_A_EVENTS, deriveMetrics, type ProductEvent } from './events';

export const MODEL_VERSION = 'v0.3-exec';
export const PROXY_MODEL_VERSION = 'v0.1-edit-proxy';

export const RULES = {
  /** Motion-specific onboarding grace before depth usage is judged. */
  graceDays: { SSF: 14, 'Sales-led': 21 } as const,
  /** No confirmed successful depth run for this many days = stalled. */
  stallDays: 14,
  /** Messaging decline vs previous 14 days that counts as "material". */
  messagingDecline: -0.25,
  /** Failed executions in 7 days that count as "repeated". */
  repeatedFailures: 3,
  /** Source data older than this (hours) makes the result UNKNOWN. */
  freshnessWindowHours: 26,
  /** Days between customer-facing contacts for the same reason. */
  cooldownDays: 14,
};

export type RiskState = 'HEALTHY' | 'WATCH' | 'AT RISK' | 'RECOVERED' | 'UNKNOWN' | 'EXCLUDED';
export type Confidence = 'HIGH' | 'LOW';
export type Queue = 'needs_review' | 'data_quality' | 'recovered_history' | 'none' | 'excluded';
export type ProposedAction = 'csx_task' | 'ssf_nudge' | 'data_quality_review' | 'human_review_only' | 'none';

export type ReasonCode =
  | 'NO_VERIFIED_RUN_14D'
  | 'NO_DEPTH_ADOPTION'
  | 'REPEATED_EXECUTION_FAILURES'
  | 'MESSAGING_DECLINE'
  | 'DOWNGRADE_INTENT'
  | 'EXECUTION_TELEMETRY_MISSING'
  | 'SOURCE_STALE'
  | 'EDIT_RECENCY_PROXY_LOW_CONFIDENCE'
  | 'IN_ONBOARDING_GRACE'
  | 'SUSTAINED_VERIFIED_RUNS'
  | 'SUBSCRIPTION_NOT_ACTIVE'
  | 'VERIFIED_USAGE';

export interface WorkspaceSnapshot {
  workspaceId: string;
  name: string;
  motion: 'SSF' | 'Sales-led';
  /** Provenance of the record, shown in the UI. */
  provenance: 'case-study' | 'synthetic';
  /** Days since account_created at scoring time. */
  asOfDay: number;
  sourceFreshnessHours: number;
  executionTelemetry: 'available' | 'missing';
  lastSuccessfulRunDay: number | null;
  successfulRuns14d: number | null;
  failedRuns7d: number | null;
  depthSetupCount: number;
  lastEditDay: number | null;
  messages14d: number | null;
  messagesPrev14d: number | null;
  billing: { status: 'active' | 'cancelled' | 'downgraded'; plan: string; seats: number };
  downgradeIntent?: boolean;
  owner: string | null;
  optedOut: boolean;
  lastContactDay: number | null;
  previousState?: RiskState;
}

export interface Evidence {
  label: string;
  value: string;
  day: number | null;
  source: string;
  supportsRisk: boolean;
}

export interface RiskResult {
  workspaceId: string;
  state: RiskState;
  reasons: ReasonCode[];
  primaryReason: ReasonCode;
  confidence: Confidence;
  queue: Queue;
  reviewEligible: boolean;
  proposedAction: ProposedAction;
  evidence: Evidence[];
  modelVersion: string;
  asOfDay: number;
  sourceFreshnessHours: number;
  messagingDelta: number | null;
  explanation: string;
}

export function messagingDelta(s: WorkspaceSnapshot): number | null {
  if (s.messages14d == null || s.messagesPrev14d == null || s.messagesPrev14d === 0) return null;
  return s.messages14d / s.messagesPrev14d - 1;
}

function result(s: WorkspaceSnapshot, partial: Omit<RiskResult, 'workspaceId' | 'modelVersion' | 'asOfDay' | 'sourceFreshnessHours' | 'messagingDelta' | 'primaryReason'>): RiskResult {
  return {
    workspaceId: s.workspaceId,
    modelVersion: MODEL_VERSION,
    asOfDay: s.asOfDay,
    sourceFreshnessHours: s.sourceFreshnessHours,
    messagingDelta: messagingDelta(s),
    primaryReason: partial.reasons[0],
    ...partial,
  };
}

function baseEvidence(s: WorkspaceSnapshot): Evidence[] {
  const d = messagingDelta(s);
  const ev: Evidence[] = [];
  if (s.executionTelemetry === 'available') {
    ev.push({
      label: 'Last verified successful run',
      value: s.lastSuccessfulRunDay == null ? 'none recorded' : `day ${s.lastSuccessfulRunDay} (${s.asOfDay - s.lastSuccessfulRunDay}d ago)`,
      day: s.lastSuccessfulRunDay,
      source: 'workflow/ai run events',
      supportsRisk: s.lastSuccessfulRunDay == null || s.asOfDay - s.lastSuccessfulRunDay >= RULES.stallDays,
    });
    ev.push({
      label: 'Failed runs (7d)',
      value: String(s.failedRuns7d ?? 0),
      day: s.asOfDay,
      source: 'workflow/ai run events',
      supportsRisk: (s.failedRuns7d ?? 0) >= RULES.repeatedFailures,
    });
  } else {
    ev.push({ label: 'Execution telemetry', value: 'not instrumented: UNKNOWN', day: null, source: 'event schema', supportsRisk: false });
  }
  ev.push({ label: 'Depth features set up', value: String(s.depthSetupCount), day: null, source: 'created events (creation ≠ use)', supportsRisk: s.depthSetupCount === 0 });
  if (d != null) ev.push({ label: 'Messaging 14d vs prior 14d', value: `${d >= 0 ? '+' : ''}${Math.round(d * 100)}%`, day: s.asOfDay, source: 'message_activity_weekly', supportsRisk: d <= RULES.messagingDecline });
  if (s.lastEditDay != null)
    ev.push({ label: 'Last workflow edit', value: `day ${s.lastEditDay} (configuration, not usage)`, day: s.lastEditDay, source: 'workflow_edited', supportsRisk: false });
  ev.push({ label: 'Subscription', value: `${s.billing.status} · ${s.billing.plan} · ${s.billing.seats} seats`, day: s.asOfDay, source: 'Chargebee', supportsRisk: s.billing.status !== 'active' });
  return ev;
}

const PROPOSED_FOR = (s: WorkspaceSnapshot): ProposedAction => (s.motion === 'SSF' ? 'ssf_nudge' : 'csx_task');

/** Deterministic, execution-based risk scoring (the intended Section 4 model). */
export function scoreWorkspace(s: WorkspaceSnapshot): RiskResult {
  const evidence = baseEvidence(s);
  const d = messagingDelta(s);

  if (s.billing.status !== 'active') {
    return result(s, {
      state: 'EXCLUDED',
      reasons: ['SUBSCRIPTION_NOT_ACTIVE'],
      confidence: 'HIGH',
      queue: 'excluded',
      reviewEligible: false,
      proposedAction: 'none',
      evidence,
      explanation: `Pilot scope is paid, active workspaces only. Subscription is ${s.billing.status}, so no customer action is proposed.`,
    });
  }

  if (s.sourceFreshnessHours > RULES.freshnessWindowHours) {
    return result(s, {
      state: 'UNKNOWN',
      reasons: ['SOURCE_STALE'],
      confidence: 'LOW',
      queue: 'data_quality',
      reviewEligible: false,
      proposedAction: 'data_quality_review',
      evidence,
      explanation: `Source data is ${s.sourceFreshnessHours}h old, beyond the ${RULES.freshnessWindowHours}h freshness window. Action is suppressed and a data-quality warning raised instead.`,
    });
  }

  if (s.executionTelemetry === 'missing') {
    const reasons: ReasonCode[] = ['EXECUTION_TELEMETRY_MISSING'];
    let action: ProposedAction = 'data_quality_review';
    let explanation = 'No workflow/AI execution events exist, so depth usage is UNKNOWN. Missing runs are not treated as non-use.';
    if (s.lastEditDay != null && s.asOfDay - s.lastEditDay >= RULES.stallDays && s.asOfDay > RULES.graceDays[s.motion]) {
      reasons.push('EDIT_RECENCY_PROXY_LOW_CONFIDENCE');
      action = 'human_review_only';
      explanation += ` A low-confidence "reduced observed interaction" candidate exists (${s.asOfDay - s.lastEditDay} days since the last recorded edit). It is human-review only and never triggers outreach.`;
    }
    return result(s, { state: 'UNKNOWN', reasons, confidence: 'LOW', queue: 'data_quality', reviewEligible: false, proposedAction: action, evidence, explanation });
  }

  const failures = (s.failedRuns7d ?? 0) >= RULES.repeatedFailures;
  const decline = d != null && d <= RULES.messagingDecline;

  if (s.asOfDay <= RULES.graceDays[s.motion] && !failures) {
    return result(s, {
      state: 'HEALTHY',
      reasons: ['IN_ONBOARDING_GRACE'],
      confidence: 'HIGH',
      queue: 'none',
      reviewEligible: false,
      proposedAction: 'none',
      evidence,
      explanation: `Within the ${RULES.graceDays[s.motion]}-day ${s.motion} onboarding grace period.`,
    });
  }

  const noDepth = s.depthSetupCount === 0;
  const stalled = !noDepth && (s.lastSuccessfulRunDay == null || s.asOfDay - s.lastSuccessfulRunDay >= RULES.stallDays);

  const reasons: ReasonCode[] = [];
  if (stalled) reasons.push('NO_VERIFIED_RUN_14D');
  if (noDepth) reasons.push('NO_DEPTH_ADOPTION');
  if (failures) reasons.push('REPEATED_EXECUTION_FAILURES');
  if (decline) reasons.push('MESSAGING_DECLINE');
  if (s.downgradeIntent) reasons.push('DOWNGRADE_INTENT');

  const primary = stalled || noDepth;
  const independent = failures || decline || !!s.downgradeIntent;

  if (primary && independent) {
    return result(s, {
      state: 'AT RISK',
      reasons,
      confidence: 'HIGH',
      queue: 'needs_review',
      reviewEligible: true,
      proposedAction: PROPOSED_FOR(s),
      evidence,
      explanation: 'Stalled or absent depth usage, confirmed by an independent signal.',
    });
  }
  if (primary || failures) {
    return result(s, {
      state: 'WATCH',
      reasons,
      confidence: 'HIGH',
      queue: 'needs_review',
      reviewEligible: true,
      proposedAction: PROPOSED_FOR(s),
      evidence,
      explanation: primary ? 'One reliable warning on depth usage, without an independent confirming signal yet.' : 'Verified repeated execution failures.',
    });
  }
  if (s.previousState === 'WATCH' || s.previousState === 'AT RISK') {
    return result(s, {
      state: 'RECOVERED',
      reasons: ['SUSTAINED_VERIFIED_RUNS'],
      confidence: 'HIGH',
      queue: 'recovered_history',
      reviewEligible: false,
      proposedAction: 'none',
      evidence,
      explanation: 'Confirmed successful depth runs resumed after a prior flag. Workflow edits alone can never produce RECOVERED.',
    });
  }
  return result(s, {
    state: 'HEALTHY',
    reasons: ['VERIFIED_USAGE'],
    confidence: 'HIGH',
    queue: 'none',
    reviewEligible: false,
    proposedAction: 'none',
    evidence,
    explanation: 'Confirmed successful depth usage within the window.',
  });
}

/**
 * The stopgap "days since last workflow edit" proxy. Kept ONLY to show, in
 * Section 6, why an edit-based signal is vulnerable to system-generated edits.
 * It never drives customer actions in this app.
 */
export function scoreEditProxy(s: Pick<WorkspaceSnapshot, 'asOfDay' | 'lastEditDay'>, previous?: 'WATCH' | 'OK'): 'WATCH' | 'OK' | 'RECOVERED' {
  const stale = s.lastEditDay == null || s.asOfDay - s.lastEditDay >= RULES.stallDays;
  if (stale) return 'WATCH';
  return previous === 'WATCH' ? 'RECOVERED' : 'OK';
}

/** Builds an engine snapshot for Account A from the raw extract, as of a given day. */
export function accountASnapshot(asOfDay: number, events: ProductEvent[] = ACCOUNT_A_EVENTS): WorkspaceSnapshot {
  const m = deriveMetrics(events, asOfDay);
  const weekly = events.filter((e) => e.name === 'message_activity_weekly' && e.day <= asOfDay);
  const last2 = weekly.slice(-2).reduce((s, e) => s + Number(e.props.messages_sent), 0);
  const prev2 = weekly.slice(-4, -2).reduce((s, e) => s + Number(e.props.messages_sent), 0);
  return {
    workspaceId: 'ACCOUNT-A',
    name: 'Account A (case study)',
    motion: 'SSF',
    provenance: 'case-study',
    asOfDay,
    sourceFreshnessHours: 6,
    executionTelemetry: m.executionTelemetry,
    lastSuccessfulRunDay: null,
    successfulRuns14d: null,
    failedRuns7d: null,
    depthSetupCount: m.workflowsCreated + m.templatesCreated + m.aiAgentsCreated,
    lastEditDay: m.lastWorkflowEditDay,
    messages14d: weekly.length >= 4 ? last2 : null,
    messagesPrev14d: weekly.length >= 4 ? prev2 : null,
    billing: { status: m.cancelledDay != null && asOfDay >= m.cancelledDay ? 'cancelled' : 'active', plan: 'Pro', seats: 42 },
    owner: 'Lifecycle',
    optedOut: false,
    lastContactDay: null,
  };
}
