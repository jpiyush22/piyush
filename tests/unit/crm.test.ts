import { describe, expect, it } from 'vitest';
import { applyVerified, approve, dataQualityIssues, groupByEmailDomain, initialAssociations, reject, rollbackApplied, seatRollup, sharedContacts, OBJECTS } from '../../src/domain/crm';

const find = (l: ReturnType<typeof initialAssociations>, from: string, to: string) => l.find((a) => a.from === from && a.to === to)!;

describe('CRM model (Section 5)', () => {
  it('each Workspace is a separate record with its own subscription', () => {
    const l = initialAssociations();
    const ws = OBJECTS.filter((o) => o.type === 'workspace');
    expect(ws).toHaveLength(6);
    for (const w of ws) expect(l.filter((a) => a.type === 'workspace_subscription' && a.from === w.id)).toHaveLength(1);
  });

  it('Beauty Lounge seats are 8, 6, 4, 25 (43 total as a workspace-level sum)', () => {
    const seats = OBJECTS.filter((o) => o.type === 'workspace' && o.label.startsWith('Beauty')).map((o) => o.meta.seats);
    expect(seats).toEqual([8, 6, 4, 25]);
    expect((seats as number[]).reduce((a, b) => a + b, 0)).toBe(43);
  });

  it('shared contact is surfaced but never creates a grouping', () => {
    const l = initialAssociations();
    expect(sharedContacts(l)[0].workspaces).toHaveLength(3);
    expect(seatRollup(l)).toEqual([]); // nothing verified yet → no group roll-up
  });

  it('refuses to group by email domain', () => {
    expect(groupByEmailDomain().allowed).toBe(false);
  });

  it('source associations are immutable', () => {
    const l = initialAssociations();
    const src = find(l, 'ws-mitte', 'sub-mitte');
    const r = approve(l, src.id, 'Finance', 'x');
    expect(r.audit.action).toBe('blocked');
    expect(r.list).toBe(l);
  });

  it('approval needs reviewer and evidence', () => {
    const l = initialAssociations();
    const p = find(l, 'ws-mitte', 'co-bl-gmbh');
    expect(approve(l, p.id, '', 'contract').audit.action).toBe('blocked');
    expect(approve(l, p.id, 'Ana (Finance)', '').audit.action).toBe('blocked');
    const ok = approve(l, p.id, 'Ana (Finance)', 'Signed contract #123');
    expect(ok.list.find((a) => a.id === p.id)!.status).toBe('verified');
  });

  it('roll-up counts only verified links; rejected ones are excluded', () => {
    let l = initialAssociations();
    l = approve(l, find(l, 'ws-gmbh', 'co-bl-gmbh').id, 'Jonas', 'Contract').list;
    l = reject(l, find(l, 'ws-spandau', 'co-bl-gmbh').id, 'Finance', 'Separate owner').list;
    expect(seatRollup(l)).toEqual([{ company: 'Beauty Lounge GmbH (legal entity)', workspaces: ['Beauty Lounge GmbH'], seats: 25 }]);
  });

  it('apply then rollback restores state without touching source links', () => {
    let l = initialAssociations();
    l = approve(l, find(l, 'ws-gmbh', 'co-bl-gmbh').id, 'Jonas', 'Contract').list;
    const applied = applyVerified(l, 'RevOps');
    expect(applied.audit).toHaveLength(1);
    const rolled = rollbackApplied(applied.list, 'RevOps');
    expect(rolled.list.find((a) => a.from === 'ws-gmbh' && a.to === 'co-bl-gmbh')!.status).toBe('rolled_back');
    expect(rolled.list.filter((a) => a.status === 'source')).toEqual(initialAssociations().filter((a) => a.status === 'source'));
  });

  it('flags the unverified domain-created Company link as a data-quality issue', () => {
    expect(dataQualityIssues(initialAssociations()).some((i) => i.severity === 'high' && /domain/.test(i.text))).toBe(true);
  });
});
