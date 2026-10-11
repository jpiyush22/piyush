import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionService, DryRunAdapter, actionKey, preActionChecks, type ReviewDecision } from '../../src/domain/actions';
import { scoreWorkspace, type WorkspaceSnapshot } from '../../src/domain/risk';
import { SYNTHETIC_WORKSPACES } from '../../src/domain/workspaces';

const ws = (id: string) => SYNTHETIC_WORKSPACES.find((w) => w.workspaceId === id)!;
const confirmed = (w: WorkspaceSnapshot): ReviewDecision => {
  const r = scoreWorkspace(w);
  return { id: 'r1', workspaceId: w.workspaceId, decision: 'CONFIRMED', reviewer: 't', at: '', computedState: r.state, computedReasons: r.reasons, modelVersion: r.modelVersion, previousDecision: 'NONE' };
};
const checksFor = (w: WorkspaceSnapshot, o: Partial<Parameters<typeof preActionChecks>[0]> = {}) =>
  preActionChecks({
    snapshot: w,
    risk: scoreWorkspace(w),
    latestDecision: confirmed(w),
    actionType: w.motion === 'SSF' ? 'ssf_nudge' : 'csx_task',
    templateId: 'tpl-first-workflow-run',
    liveBillingStatus: 'active',
    semanticHold: false,
    today: 60,
    ...o,
  });
const failed = (c: ReturnType<typeof preActionChecks>) => c.filter((x) => !x.ok).map((x) => x.id);

let fetchSpy: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchSpy = vi.fn();
  vi.stubGlobal('fetch', fetchSpy);
});
afterEach(() => {
  expect(fetchSpy).not.toHaveBeenCalled(); // dry-run: never touches the network
  vi.unstubAllGlobals();
});

describe('pre-action checks', () => {
  it('eligible Sales-led task passes every check', () => {
    expect(failed(checksFor(ws('WS-0881')))).toEqual([]);
  });
  it('eligible SSF nudge passes with an approved template', () => {
    expect(failed(checksFor(ws('WS-1042')))).toEqual([]);
  });
  it('blocks a cancelled subscription found on the live check', () => {
    expect(failed(checksFor(ws('WS-1188'), { liveBillingStatus: 'cancelled' }))).toContain('subscription_active');
  });
  it('blocks an opted-out customer', () => {
    expect(failed(checksFor(ws('WS-1135')))).toContain('consent');
  });
  it('blocks a missing owner', () => {
    expect(failed(checksFor({ ...ws('WS-0881'), owner: null }))).toContain('owner_assigned');
  });
  it('enforces the cooldown', () => {
    expect(failed(checksFor(ws('WS-1162')))).toContain('cooldown');
  });
  it('blocks stale evidence', () => {
    const f = failed(checksFor({ ...ws('WS-0881'), sourceFreshnessHours: 40 }));
    expect(f).toContain('risk_fresh');
    expect(f).toContain('risk_revalidated'); // re-score is UNKNOWN when stale
  });
  it('requires a reviewer confirmation', () => {
    expect(failed(checksFor(ws('WS-0881'), { latestDecision: undefined }))).toContain('reviewer_confirmed');
  });
  it('rejects unapproved SSF content', () => {
    expect(failed(checksFor(ws('WS-1042'), { templateId: 'free-text' }))).toContain('template_approved');
  });
  it('rejects an action type that does not match the motion', () => {
    expect(failed(checksFor(ws('WS-1042'), { actionType: 'csx_task' }))).toContain('motion_matches');
  });
});

const svcWith = () => new ActionService(new DryRunAdapter({ billing: { 'WS-0881': 'active' } }));
const req = (svc: ActionService, w = ws('WS-0881')) => ({
  workspaceId: w.workspaceId,
  actionType: 'csx_task' as const,
  reasonCode: scoreWorkspace(w).primaryReason,
  day: 60,
  requestedBy: 'tester',
  checks: checksFor(w),
});

describe('action ledger', () => {
  it('action key = workspace + reason + type + cooldown window', () => {
    expect(actionKey('WS-1', 'NO_VERIFIED_RUN_14D', 'csx_task', 60)).toBe('WS-1:NO_VERIFIED_RUN_14D:csx_task:cw4');
    expect(actionKey('WS-1', 'NO_VERIFIED_RUN_14D', 'csx_task', 70)).toBe('WS-1:NO_VERIFIED_RUN_14D:csx_task:cw5');
  });

  it('dispatches once; a second request is a duplicate', async () => {
    const svc = svcWith();
    const a = await svc.request(req(svc));
    const b = await svc.request(req(svc));
    expect(a.outcome).toBe('dispatched');
    expect(a.entry.externalRef).toMatch(/^sim-task-/);
    expect(b.outcome).toBe('duplicate');
    expect(svc.adapter.outbox).toHaveLength(1);
  });

  it('concurrent requests: exactly one claim wins', async () => {
    const svc = svcWith();
    const results = await Promise.all(Array.from({ length: 5 }, () => svc.request(req(svc))));
    expect(results.filter((r) => r.outcome === 'dispatched')).toHaveLength(1);
    expect(results.filter((r) => r.outcome === 'duplicate')).toHaveLength(4);
    expect(svc.adapter.outbox).toHaveLength(1);
  });

  it('failed checks are recorded as suppressed and never dispatched', async () => {
    const svc = svcWith();
    const w = ws('WS-1135');
    const r = await svc.request({ ...req(svc, w), actionType: 'ssf_nudge', checks: checksFor(w) });
    expect(r.outcome).toBe('suppressed');
    expect(r.entry.status).toBe('suppressed');
    expect(r.entry.failedChecks.join()).toMatch(/opted out/i);
    expect(svc.adapter.outbox).toHaveLength(0);
  });

  it('uncertain delivery (timeout) is not blindly retried; reconcile finds it', async () => {
    const svc = svcWith();
    svc.adapter.nextOutcome = 'timeout';
    const a = await svc.request(req(svc));
    expect(a.outcome).toBe('uncertain');
    expect(a.entry.status).toBe('pending');
    const retry = await svc.request(req(svc));
    expect(retry.outcome).toBe('duplicate'); // retry blocked while uncertain
    const rec = await svc.reconcile(a.entry.key);
    expect(rec!.status).toBe('reconciled');
    expect(rec!.externalRef).toBeTruthy();
    expect(svc.adapter.outbox).toHaveLength(1); // delivered exactly once
  });

  it('a definitive rejection may be retried', async () => {
    const svc = svcWith();
    svc.adapter.nextOutcome = 'reject';
    const a = await svc.request(req(svc));
    expect(a.outcome).toBe('failed');
    const b = await svc.request(req(svc));
    expect(b.outcome).toBe('dispatched');
  });

  it('historical replay: outbound disabled sends nothing', async () => {
    const svc = svcWith();
    svc.outboundEnabled = false;
    const r = await svc.request(req(svc));
    expect(r.outcome).toBe('outbound_disabled');
    expect(svc.adapter.outbox).toHaveLength(0);
  });

  it('serialises and restores without losing the claim', async () => {
    const svc = svcWith();
    await svc.request(req(svc));
    const restored = ActionService.restore(JSON.parse(JSON.stringify(svc.serialize())), { 'WS-0881': 'active' });
    expect((await restored.request(req(restored))).outcome).toBe('duplicate');
  });
});
