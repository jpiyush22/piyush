import { describe, expect, it } from 'vitest';
import { FUNNEL, METRICS, conversion, dropOffs, pct1, reconcileMotions } from '../../src/domain/funnel';

describe('funnel (Section 1)', () => {
  it('keeps the case-study counts exactly', () => {
    expect(FUNNEL.blended).toEqual({ LeadGen: 1620, LeadDev: 1164, Sales: 260, Onboarding: 960, Adoption: 424, Expansion: 89 });
    expect(FUNNEL.ssf).toEqual({ LeadGen: 1200, LeadDev: 864, Sales: null, Onboarding: 744, Adoption: 305, Expansion: 38 });
    expect(FUNNEL.sales).toEqual({ LeadGen: 420, LeadDev: 300, Sales: 260, Onboarding: 216, Adoption: 119, Expansion: 51 });
  });

  it('SSF + Sales-led reconcile to the blended totals at every stage', () => {
    for (const r of reconcileMotions()) expect(r.ok, r.stage).toBe(true);
  });

  it('SSF has no Sales stage and no Sales conversion', () => {
    expect(FUNNEL.ssf.Sales).toBeNull();
    expect(conversion('ssf', 'Sales')).toBeNull();
    // SSF onboarding is measured from LeadDev
    expect(conversion('ssf', 'Onboarding')!.from).toBe('LeadDev');
  });

  it('matches every rate quoted in the answers', () => {
    expect(pct1(METRICS.blended.leadDev.rate)).toBe('71.9%');
    expect(pct1(METRICS.blended.onboarding.rate)).toBe('82.5%');
    expect(pct1(METRICS.blended.adoption.rate)).toBe('44.2%');
    expect(pct1(METRICS.blended.expansion.rate)).toBe('21.0%');
    expect(pct1(METRICS.blended.nonAdoptionRate)).toBe('55.8%');
    expect(METRICS.blended.nonAdopters).toBe(536);
    expect(pct1(METRICS.ssf.leadDev.rate)).toBe('72.0%');
    expect(pct1(METRICS.sales.leadDev.rate)).toBe('71.4%');
    expect(pct1(METRICS.sales.sales.rate)).toBe('86.7%');
    expect(pct1(METRICS.sales.onboarding.rate)).toBe('83.1%');
    expect(pct1(METRICS.ssf.onboarding.rate)).toBe('86.1%');
    expect(pct1(METRICS.sales.onboardingFromLeadDev.rate)).toBe('72.0%');
    expect(pct1(METRICS.ssf.adoption.rate)).toBe('41.0%');
    expect(pct1(METRICS.sales.adoption.rate)).toBe('55.1%');
    expect(METRICS.adoptionGapPp.toFixed(1)).toBe('14.1');
    expect(pct1(METRICS.ssf.expansion.rate)).toBe('12.5%');
    expect(pct1(METRICS.sales.expansion.rate)).toBe('42.9%');
    expect(pct1(METRICS.ssfShareOfNonAdopters)).toBe('81.9%');
    expect(pct1(METRICS.ssfShareOfOnboarded)).toBe('77.5%');
    expect(METRICS.ssf.nonAdopters).toBe(439);
    expect(METRICS.sales.nonAdopters).toBe(97);
  });

  it('identifies onboarding → adoption as the largest absolute drop-off (blended)', () => {
    const d = dropOffs('blended').filter((x) => x.stage !== 'Sales');
    const biggest = [...d].sort((a, b) => b.lost - a.lost)[0];
    expect(biggest.stage).toBe('Adoption');
    expect(biggest.lost).toBe(536);
  });

  it('labels the 46% figure as a proposed target, distinct from the observed baseline', () => {
    expect(METRICS.proposedSsfAdoptionTarget).toBe(0.46);
    expect(METRICS.ssf.adoption.rate).toBeLessThan(METRICS.proposedSsfAdoptionTarget);
  });
});
