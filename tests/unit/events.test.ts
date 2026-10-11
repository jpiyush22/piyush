import { describe, expect, it } from 'vitest';
import { ACCOUNTS, ACCOUNT_A_EVENTS, ACCOUNT_A_METRICS, deriveMetrics, sortEvents } from '../../src/domain/events';

describe('Account A raw events (Section 2)', () => {
  it('has the 26 events of the extract, already in day order', () => {
    expect(ACCOUNT_A_EVENTS).toHaveLength(26);
    const days = sortEvents(ACCOUNT_A_EVENTS).map((e) => e.day);
    expect(days).toEqual([...days].sort((a, b) => a - b));
  });

  it('sorting is stable and order-independent', () => {
    const shuffled = [...ACCOUNT_A_EVENTS].reverse();
    expect(deriveMetrics(shuffled)).toEqual(ACCOUNT_A_METRICS);
  });

  it('recomputes the written timeline from events', () => {
    const m = ACCOUNT_A_METRICS;
    expect(m.activationDay).toBe(3);
    expect(m.workflowsCreated).toBe(3);
    expect(m.workflowCreatedDays).toEqual([4, 5, 7]);
    expect(m.lastWorkflowEditDay).toBe(19);
    expect(m.aiTriggerDays).toEqual([10, 12]);
    expect(m.aiRunsObserved).toBe(6);
    expect(m.cancelledDay).toBe(71);
    expect(m.daysFromLastEditToCancel).toBe(52);
    expect(m.daysFromLastAiToCancel).toBe(59);
    expect(m.avgSent).toBeCloseTo(90.2, 1);
    expect([m.minSent, m.maxSent]).toEqual([88, 93]);
  });

  it('has no execution evidence: telemetry is missing, not "zero usage"', () => {
    expect(ACCOUNT_A_METRICS.executionEvents).toBe(0);
    expect(ACCOUNT_A_METRICS.executionTelemetry).toBe('missing');
  });

  it('respects the as-of day (no future leakage)', () => {
    const at10 = deriveMetrics(ACCOUNT_A_EVENTS, 10);
    expect(at10.lastWorkflowEditDay).toBe(9);
    expect(at10.cancelledDay).toBeNull();
    expect(at10.aiRunsObserved).toBe(4);
  });

  it('preserves A–E facts and marks only A as having raw events', () => {
    expect(ACCOUNTS.map((a) => [a.id, a.motion, a.seats])).toEqual([
      ['A', 'SSF', 42],
      ['B', 'SSF', 9],
      ['C', 'SSF', 28],
      ['D', 'Sales-led', 35],
      ['E', 'Sales-led', 18],
    ]);
    expect(ACCOUNTS.filter((a) => a.rawEvents).map((a) => a.id)).toEqual(['A']);
    for (const a of ACCOUNTS) expect(a.evidence.some((e) => e.kind === 'missing')).toBe(true);
  });
});
