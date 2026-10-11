import { describe, expect, it } from 'vitest';
import { RULES, accountASnapshot, scoreEditProxy, scoreWorkspace, type WorkspaceSnapshot } from '../../src/domain/risk';
import { SYNTHETIC_WORKSPACES } from '../../src/domain/workspaces';

const base: WorkspaceSnapshot = {
  workspaceId: 'T-1',
  name: 't',
  motion: 'SSF',
  provenance: 'synthetic',
  asOfDay: 60,
  sourceFreshnessHours: 6,
  executionTelemetry: 'available',
  lastSuccessfulRunDay: 59,
  successfulRuns14d: 20,
  failedRuns7d: 0,
  depthSetupCount: 4,
  lastEditDay: 50,
  messages14d: 500,
  messagesPrev14d: 500,
  billing: { status: 'active', plan: 'Pro', seats: 10 },
  owner: 'Lifecycle',
  optedOut: false,
  lastContactDay: null,
};
const s = (o: Partial<WorkspaceSnapshot>) => scoreWorkspace({ ...base, ...o });

describe('risk engine (Section 4)', () => {
  it('healthy: verified recent runs', () => {
    const r = s({});
    expect(r.state).toBe('HEALTHY');
    expect(r.reasons).toEqual(['VERIFIED_USAGE']);
    expect(r.modelVersion).toBe('v0.3-exec');
  });

  it('WATCH: no verified run for 14 days, no independent signal', () => {
    const r = s({ lastSuccessfulRunDay: 60 - RULES.stallDays });
    expect(r.state).toBe('WATCH');
    expect(r.reasons).toContain('NO_VERIFIED_RUN_14D');
    expect(r.queue).toBe('needs_review');
    expect(r.proposedAction).toBe('ssf_nudge');
  });

  it('13 days without a run is not yet stalled (boundary)', () => {
    expect(s({ lastSuccessfulRunDay: 60 - 13 }).state).toBe('HEALTHY');
  });

  it('AT RISK needs the stall PLUS an independent signal', () => {
    expect(s({ lastSuccessfulRunDay: 40, messages14d: 300, messagesPrev14d: 500 }).state).toBe('AT RISK');
    expect(s({ lastSuccessfulRunDay: 40, failedRuns7d: 3 }).state).toBe('AT RISK');
    expect(s({ lastSuccessfulRunDay: 40, downgradeIntent: true }).state).toBe('AT RISK');
  });

  it('repeated failures alone are WATCH', () => {
    const r = s({ failedRuns7d: 5, motion: 'Sales-led' });
    expect(r.state).toBe('WATCH');
    expect(r.reasons).toEqual(['REPEATED_EXECUTION_FAILURES']);
    expect(r.proposedAction).toBe('csx_task');
  });

  it('no depth adoption is a WATCH reason', () => {
    expect(s({ depthSetupCount: 0, lastSuccessfulRunDay: null }).reasons).toContain('NO_DEPTH_ADOPTION');
  });

  it('RECOVERED requires confirmed runs after a prior flag', () => {
    const r = s({ previousState: 'WATCH' });
    expect(r.state).toBe('RECOVERED');
    expect(r.queue).toBe('recovered_history');
  });

  it('workflow edits can never produce RECOVERED or HEALTHY on their own', () => {
    // fresh edit yesterday, but no verified run for 30 days
    const r = s({ lastEditDay: 59, lastSuccessfulRunDay: 30, previousState: 'WATCH' });
    expect(r.state).toBe('WATCH');
  });

  it('UNKNOWN when execution telemetry is missing; never inactivity, never outreach', () => {
    const r = s({ executionTelemetry: 'missing', lastSuccessfulRunDay: null, successfulRuns14d: null, failedRuns7d: null });
    expect(r.state).toBe('UNKNOWN');
    expect(r.confidence).toBe('LOW');
    expect(r.queue).toBe('data_quality');
    expect(r.reviewEligible).toBe(false);
    expect(['data_quality_review', 'human_review_only']).toContain(r.proposedAction);
  });

  it('UNKNOWN when the source is stale, even with risky-looking evidence', () => {
    const r = s({ sourceFreshnessHours: RULES.freshnessWindowHours + 1, lastSuccessfulRunDay: 10, failedRuns7d: 9 });
    expect(r.state).toBe('UNKNOWN');
    expect(r.reasons).toEqual(['SOURCE_STALE']);
  });

  it('conflicting evidence: fresh edits + no runs + messaging up stays WATCH, not healthy', () => {
    const r = s({ lastEditDay: 60, lastSuccessfulRunDay: 20, messages14d: 900, messagesPrev14d: 500 });
    expect(r.state).toBe('WATCH');
    expect(r.reasons).not.toContain('MESSAGING_DECLINE');
  });

  it('cancelled subscriptions are excluded from scope', () => {
    const r = s({ billing: { status: 'cancelled', plan: 'Pro', seats: 10 } });
    expect(r.state).toBe('EXCLUDED');
    expect(r.proposedAction).toBe('none');
  });

  it('onboarding grace: no flag before the motion-specific grace ends', () => {
    expect(s({ asOfDay: 10, lastSuccessfulRunDay: null, depthSetupCount: 0 }).state).toBe('HEALTHY');
    expect(s({ asOfDay: 18, motion: 'Sales-led', lastSuccessfulRunDay: null, depthSetupCount: 0 }).state).toBe('HEALTHY');
  });

  it('every result carries reasons, evidence timestamps, freshness, confidence and version', () => {
    const r = s({ lastSuccessfulRunDay: 40 });
    expect(r.reasons.length).toBeGreaterThan(0);
    expect(r.evidence.find((e) => e.label === 'Last verified successful run')?.day).toBe(40);
    expect(r.sourceFreshnessHours).toBe(6);
    expect(r.explanation.length).toBeGreaterThan(10);
  });
});

describe('Account A through the engine', () => {
  it('day 32: UNKNOWN with no edit-proxy candidate yet', () => {
    const r = scoreWorkspace(accountASnapshot(32));
    expect(r.state).toBe('UNKNOWN');
    expect(r.reasons).toEqual(['EXECUTION_TELEMETRY_MISSING']);
  });
  it('day 33: low-confidence, human-review-only edit-recency candidate; no outreach', () => {
    const r = scoreWorkspace(accountASnapshot(33));
    expect(r.state).toBe('UNKNOWN');
    expect(r.reasons).toContain('EDIT_RECENCY_PROXY_LOW_CONFIDENCE');
    expect(r.confidence).toBe('LOW');
    expect(r.proposedAction).toBe('human_review_only');
    expect(r.reviewEligible).toBe(false);
  });
  it('day 71: cancelled, excluded', () => {
    expect(scoreWorkspace(accountASnapshot(71)).state).toBe('EXCLUDED');
  });
});

describe('edit proxy (vulnerable stopgap, Section 6 only)', () => {
  it('a fresh edit flips WATCH to RECOVERED regardless of who made it', () => {
    expect(scoreEditProxy({ asOfDay: 40, lastEditDay: 19 })).toBe('WATCH');
    expect(scoreEditProxy({ asOfDay: 41, lastEditDay: 40 }, 'WATCH')).toBe('RECOVERED');
  });
});

describe('synthetic Signal Desk workspaces', () => {
  it('states come from the engine and cover every queue', () => {
    const st = Object.fromEntries(SYNTHETIC_WORKSPACES.map((w) => [w.workspaceId, scoreWorkspace(w).state]));
    expect(st).toEqual({
      'WS-1042': 'AT RISK',
      'WS-0881': 'WATCH',
      'WS-1135': 'AT RISK',
      'WS-1162': 'WATCH',
      'WS-1188': 'WATCH',
      'WS-1201': 'UNKNOWN',
      'WS-1210': 'UNKNOWN',
      'WS-0974': 'RECOVERED',
      'WS-0912': 'RECOVERED',
      'WS-1250': 'HEALTHY',
    });
  });
});
