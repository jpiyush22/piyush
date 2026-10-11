/**
 * Section 1 funnel. The counts are the case-study figures from the brief
 * (illustrative team estimates). Every rate shown anywhere in the app is
 * derived from these counts here, never typed in by hand.
 */
export type Stage = 'LeadGen' | 'LeadDev' | 'Sales' | 'Onboarding' | 'Adoption' | 'Expansion';
export type Motion = 'ssf' | 'sales';

export const STAGES: Stage[] = ['LeadGen', 'LeadDev', 'Sales', 'Onboarding', 'Adoption', 'Expansion'];

/** `null` means the stage does not exist for that motion (SSF has no Sales stage). */
export const FUNNEL: Record<'blended' | Motion, Record<Stage, number | null>> = {
  blended: { LeadGen: 1620, LeadDev: 1164, Sales: 260, Onboarding: 960, Adoption: 424, Expansion: 89 },
  ssf: { LeadGen: 1200, LeadDev: 864, Sales: null, Onboarding: 744, Adoption: 305, Expansion: 38 },
  sales: { LeadGen: 420, LeadDev: 300, Sales: 260, Onboarding: 216, Adoption: 119, Expansion: 51 },
};

/** The stage that feeds `stage` for a given motion. SSF onboarding is fed by LeadDev. */
export function feederOf(stage: Stage, motion: 'blended' | Motion): Stage | null {
  switch (stage) {
    case 'LeadGen':
      return null;
    case 'LeadDev':
      return 'LeadGen';
    case 'Sales':
      return motion === 'ssf' ? null : 'LeadDev';
    case 'Onboarding':
      // Blended onboarding mixes both motions, so it is measured from LeadDev (as in the answers).
      return motion === 'sales' ? 'Sales' : 'LeadDev';
    case 'Adoption':
      return 'Onboarding';
    case 'Expansion':
      return 'Adoption';
  }
}

export interface Conversion {
  stage: Stage;
  from: Stage;
  numerator: number;
  denominator: number;
  rate: number;
}

export function conversion(motion: 'blended' | Motion, stage: Stage, from?: Stage): Conversion | null {
  const f = FUNNEL[motion];
  const src = from ?? feederOf(stage, motion);
  if (!src) return null;
  const n = f[stage];
  const d = f[src];
  if (n == null || d == null || d === 0) return null;
  return { stage, from: src, numerator: n, denominator: d, rate: n / d };
}

/** Percentage with one decimal, e.g. 0.40994 -> "41.0%". */
export const pct1 = (r: number) => `${(r * 100).toFixed(1)}%`;
/** Percentage points with one decimal. */
export const pp1 = (a: number, b: number) => `${((a - b) * 100).toFixed(1)} pp`;

const must = (c: Conversion | null): Conversion => {
  if (!c) throw new Error('missing conversion');
  return c;
};

/** Every derived number the app quotes, computed once from FUNNEL. */
export function computeMetrics() {
  const b = FUNNEL.blended;
  const s = FUNNEL.ssf;
  const l = FUNNEL.sales;
  const adoptB = must(conversion('blended', 'Adoption'));
  const adoptS = must(conversion('ssf', 'Adoption'));
  const adoptL = must(conversion('sales', 'Adoption'));
  const nonAdoptB = b.Onboarding! - b.Adoption!;
  const nonAdoptS = s.Onboarding! - s.Adoption!;
  const nonAdoptL = l.Onboarding! - l.Adoption!;
  return {
    blended: {
      leadDev: must(conversion('blended', 'LeadDev')),
      onboarding: must(conversion('blended', 'Onboarding')),
      adoption: adoptB,
      expansion: must(conversion('blended', 'Expansion')),
      nonAdopters: nonAdoptB,
      nonAdoptionRate: nonAdoptB / b.Onboarding!,
    },
    ssf: {
      leadDev: must(conversion('ssf', 'LeadDev')),
      onboarding: must(conversion('ssf', 'Onboarding')),
      adoption: adoptS,
      expansion: must(conversion('ssf', 'Expansion')),
      nonAdopters: nonAdoptS,
    },
    sales: {
      leadDev: must(conversion('sales', 'LeadDev')),
      sales: must(conversion('sales', 'Sales')),
      onboarding: must(conversion('sales', 'Onboarding')),
      onboardingFromLeadDev: must(conversion('sales', 'Onboarding', 'LeadDev')),
      adoption: adoptL,
      expansion: must(conversion('sales', 'Expansion')),
      nonAdopters: nonAdoptL,
    },
    adoptionGapPp: (adoptL.rate - adoptS.rate) * 100,
    expansionGapPp: (must(conversion('sales', 'Expansion')).rate - must(conversion('ssf', 'Expansion')).rate) * 100,
    ssfShareOfNonAdopters: nonAdoptS / nonAdoptB,
    salesShareOfNonAdopters: nonAdoptL / nonAdoptB,
    ssfShareOfOnboarded: s.Onboarding! / b.Onboarding!,
    /** Proposed experiment target from Section 4. NOT a forecast or a result. */
    proposedSsfAdoptionTarget: 0.46,
  };
}

export const METRICS = computeMetrics();

/** Checks that each motion sums to the blended total for every stage both motions share. */
export function reconcileMotions(): { stage: Stage; blended: number; sum: number; ok: boolean }[] {
  return STAGES.map((st) => {
    const sum = (FUNNEL.ssf[st] ?? 0) + (FUNNEL.sales[st] ?? 0);
    const blended = FUNNEL.blended[st] ?? 0;
    return { stage: st, blended, sum, ok: sum === blended };
  });
}

/** Drop-off between consecutive stages for one motion. */
export function dropOffs(motion: 'blended' | Motion) {
  return STAGES.map((st) => conversion(motion, st))
    .filter((c): c is Conversion => c !== null)
    .map((c) => ({ ...c, lost: c.denominator - c.numerator, lossRate: 1 - c.rate }));
}
