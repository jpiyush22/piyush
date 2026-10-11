import { describe, expect, it } from 'vitest';
import { DEFAULT_PARAMS, detectionDay, execUnaffected, impactAnalysis, simulate } from '../../src/domain/drift';

const withM = simulate(DEFAULT_PARAMS);
const without = simulate({ ...DEFAULT_PARAMS, migrations: false });

describe('semantic drift simulator (Section 6)', () => {
  it('is deterministic for a seed', () => {
    expect(simulate(DEFAULT_PARAMS).days.map((d) => d.editRate)).toEqual(withM.days.map((d) => d.editRate));
  });

  it('execution-based states are identical with and without migrations', () => {
    expect(execUnaffected(withM, without)).toBe(true);
  });

  it('edit rate rises during the 21-day rollout and not before', () => {
    const pre = withM.days.filter((d) => d.day < 0);
    const during = withM.days.filter((d) => d.day >= 0 && d.day < 21);
    const avg = (xs: typeof pre) => xs.reduce((s, d) => s + d.editRate, 0) / xs.length;
    expect(avg(during)).toBeGreaterThan(avg(pre) * 1.4);
    expect(pre.every((d) => !d.driftAlert && !d.spikeAlert)).toBe(true);
  });

  it('gradual drift is caught by the multi-day check within the first week', () => {
    expect(withM.firstDriftDay).not.toBeNull();
    expect(withM.firstDriftDay!).toBeGreaterThanOrEqual(0);
    expect(withM.firstDriftDay!).toBeLessThan(7);
    expect(detectionDay(withM, true)).toBeLessThan(detectionDay(withM, false));
    expect(detectionDay(withM, false)).toBe(21);
  });

  it('rolling same-weekday baseline gets contaminated; frozen baseline does not', () => {
    const d28 = withM.days.find((d) => d.day === 28)!;
    expect(d28.rollingBaseline!).toBeGreaterThan(d28.frozenBaseline * 1.2);
    expect(new Set(withM.days.map((d) => d.frozenBaseline)).size).toBe(1);
  });

  it('migrations multiply unsupported proxy recoveries; system-caused ones are zero without migrations', () => {
    const sum = (r: typeof withM, k: 'unsupportedRecoveries' | 'systemCausedRecoveries') => r.days.filter((d) => d.day >= 0).reduce((s, d) => s + d[k], 0);
    // The proxy is noisy even without an incident (rare edits by stalled workspaces)...
    expect(sum(without, 'unsupportedRecoveries')).toBeGreaterThan(0);
    // ...but the migration makes it much worse,
    expect(sum(withM, 'unsupportedRecoveries')).toBeGreaterThan(2 * sum(without, 'unsupportedRecoveries'));
    // and recoveries caused purely by system edits only exist with migrations.
    expect(sum(withM, 'systemCausedRecoveries')).toBeGreaterThan(0);
    expect(sum(without, 'systemCausedRecoveries')).toBe(0);
  });

  it('impact analysis lists affected workspaces only, not every migrated one', () => {
    const rows = impactAnalysis(withM, 21);
    const migrated = withM.workspaces.filter((w) => w.migrationDay != null).length;
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBeLessThan(migrated);
    expect(rows.every((r) => withM.workspaces.find((w) => w.id === r.workspaceId)!.migrationDay != null)).toBe(true);
    expect(rows.some((r) => r.category === 'missed_help')).toBe(true);
  });

  it('no impact rows exist when there is no migration', () => {
    expect(impactAnalysis(without, 21)).toEqual([]);
  });
});
