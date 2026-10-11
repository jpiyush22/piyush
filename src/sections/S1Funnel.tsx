import { useState } from 'react';
import { Answer, BlockTitle, Callout, Card, DataTable, KV, Pill, Prov, QA, SectionHero, Stat, fmt } from '../components/ui';
import { FUNNEL, METRICS, STAGES, conversion, dropOffs, pct1, reconcileMotions, type Motion, type Stage } from '../domain/funnel';

const M = METRICS;
const label = (m: 'blended' | Motion) => (m === 'blended' ? 'Blended' : m === 'ssf' ? 'SSF' : 'Sales-led');

function FunnelChart({ mode }: { mode: 'blended' | 'split' }) {
  const max = FUNNEL.blended.LeadGen!;
  const motions: ('blended' | Motion)[] = mode === 'blended' ? ['blended'] : ['ssf', 'sales'];
  return (
    <div className="funnel" key={mode}>
      {STAGES.map((st: Stage, row) => {
        const hot = st === 'Adoption';
        return (
          <div key={st} className={`funnel-row ${hot ? 'hot' : ''}`}>
            <div className="stage">{st}</div>
            <div className="bars">
              {motions.map((m) => {
                const v = FUNNEL[m][st];
                if (v == null)
                  return (
                    <div key={m} className="tiny muted" style={{ height: 22, display: 'flex', alignItems: 'center' }}>
                      SSF has no Sales stage
                    </div>
                  );
                const color = hot && mode === 'blended' ? 'var(--risk)' : m === 'sales' ? 'var(--sales)' : 'var(--ssf)';
                return (
                  <div
                    key={m}
                    className="bar"
                    title={`${label(m)} ${st}: ${fmt(v)}`}
                    style={{ width: `${(v / max) * 100}%`, background: color, animationDelay: `${row * 80}ms` }}
                  >
                    {fmt(v)}
                  </div>
                );
              })}
            </div>
            <div className="rate">
              {st === 'LeadGen'
                ? 'Starting cohort'
                : motions.map((m) => {
                    const c = conversion(m, st);
                    if (mode === 'blended' && st === 'Sales') return <div key={m}>Sales-led only</div>;
                    return (
                      <div key={m}>
                        {mode === 'split' ? `${label(m)} ` : ''}
                        {c ? `${pct1(c.rate)}${mode === 'blended' ? ` of ${c.from}` : ''}` : '—'}
                      </div>
                    );
                  })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function S1Funnel() {
  const [mode, setMode] = useState<'blended' | 'split'>('split');
  const [dropMotion, setDropMotion] = useState<'blended' | Motion>('ssf');
  const drops = dropOffs(dropMotion).filter((d) => !(dropMotion === 'blended' && d.stage === 'Sales'));
  const biggest = [...drops].sort((a, b) => b.lost - a.lost)[0];
  return (
    <>
      <SectionHero
        eyebrow="Section 1"
        title="Read the funnel"
        lede="A monthly cohort of new accounts through their first 90 days. Nobody said what the problem is. Finding out whether there is one, and where, was the job."
        tags={
          <>
            <Pill tone="risk">Biggest leak: Onboarding → Adoption</Pill>
            <Pill tone="brand">SSF is {pct1(M.ssfShareOfNonAdopters)} of non-adopters</Pill>
            <Prov kind="case-study" />
            <Prov kind="derived" />
          </>
        }
      />

      <div className="grid c4" style={{ marginBottom: 24 }} id="s1-kpis">
        <Stat label="Not reaching adoption" value={fmt(M.blended.nonAdopters)} note={`of ${fmt(FUNNEL.blended.Onboarding!)} onboarded (${pct1(M.blended.nonAdoptionRate)})`} accent />
        <Stat label="SSF adoption" value={pct1(M.ssf.adoption.rate)} note={`${M.ssf.adoption.numerator} / ${M.ssf.adoption.denominator}`} />
        <Stat label="Sales-led adoption" value={pct1(M.sales.adoption.rate)} note={`${M.sales.adoption.numerator} / ${M.sales.adoption.denominator}`} />
        <Stat label="Gap" value={`${M.adoptionGapPp.toFixed(1)} pp`} note="SSF below Sales-led" />
      </div>

      <Card
        title="Cohort funnel"
        right={
          <div className="seg" role="group" aria-label="Funnel view">
            <button aria-pressed={mode === 'blended'} onClick={() => setMode('blended')}>
              Table 1 · blended
            </button>
            <button aria-pressed={mode === 'split'} onClick={() => setMode('split')}>
              Table 2 · by motion
            </button>
          </div>
        }
      >
        {mode === 'split' && (
          <div className="legend" style={{ marginBottom: 14 }}>
            <span>
              <i style={{ background: 'var(--ssf)' }} />
              SSF (self-signup)
            </span>
            <span>
              <i style={{ background: 'var(--sales)' }} />
              Sales-led (Sales / Partner-closed)
            </span>
          </div>
        )}
        <FunnelChart mode={mode} />
        <p className="tiny muted" style={{ marginTop: 14 }}>
          Each rate is a stage relative to the stage that feeds it. SSF Onboarding is measured from LeadDev because SSF has no Sales stage. All rates are computed from the counts.
        </p>
      </Card>

      <div style={{ height: 16 }} />
      <div className="grid c2">
        <Card
          title="Drop-off by stage"
          right={
            <div className="seg" role="group" aria-label="Drop-off motion">
              {(['blended', 'ssf', 'sales'] as const).map((m) => (
                <button key={m} aria-pressed={dropMotion === m} onClick={() => setDropMotion(m)}>
                  {label(m)}
                </button>
              ))}
            </div>
          }
        >
          <DataTable
            head={['Step', 'In', 'Out', 'Lost', 'Conversion']}
            num={[1, 2, 3, 4]}
            rows={drops.map((d) => [
              d === biggest ? <strong>{`${d.from} → ${d.stage}`}</strong> : `${d.from} → ${d.stage}`,
              fmt(d.denominator),
              fmt(d.numerator),
              d === biggest ? <strong style={{ color: 'var(--risk)' }}>{fmt(d.lost)}</strong> : fmt(d.lost),
              pct1(d.rate),
            ])}
          />
          <p className="tiny muted" style={{ marginTop: 8 }}>
            Largest absolute loss for {label(dropMotion)}: {biggest.from} → {biggest.stage} ({fmt(biggest.lost)} accounts).
          </p>
        </Card>
        <Card title="Supporting checks">
          <DataTable
            head={['Stage', 'SSF + Sales-led', 'Blended', 'Reconciles']}
            num={[1, 2]}
            rows={reconcileMotions().map((r) => [r.stage, fmt(r.sum), fmt(r.blended), <Pill tone={r.ok ? 'ok' : 'risk'}>{r.ok ? '✓ yes' : '✗ no'}</Pill>])}
          />
          <div style={{ marginTop: 12 }}>
            <Callout title="Assumptions.">
              Counts are illustrative team estimates for one monthly cohort over 90 days. Stage counts are treated as accounts that reached each stage. Rates describe the gap; they do
              not prove its cause.
            </Callout>
          </div>
        </Card>
      </div>

      <div style={{ height: 28 }} />
      <BlockTitle>Questions</BlockTitle>

      <QA
        num="Q1"
        question="Read Table 1 on its own first. What's your read on the health of this funnel? Where's the biggest problem, and how confident are you?"
        summary={`The biggest drop is Onboarding → Adoption: only ${FUNNEL.blended.Adoption} of ${FUNNEL.blended.Onboarding} (${pct1(M.blended.adoption.rate)}) progress. I'm confident in the maths and only moderately confident in the diagnosis, because Table 1 mixes both motions.`}
      >
        <Answer>
          <KV
            items={[
              [
                'My read',
                `Table 1 alone doesn't show whether the funnel is healthy; I'd first compare it with targets. The biggest drop is from Onboarding to Adoption: ${FUNNEL.blended.Onboarding} accounts reached onboarding, but only ${FUNNEL.blended.Adoption} reached adoption (${pct1(M.blended.adoption.rate)}). That leaves ${M.blended.nonAdopters} (${pct1(M.blended.nonAdoptionRate)}) that didn't progress.`,
              ],
              [
                'Other concern',
                `Expansion converts just ${FUNNEL.blended.Expansion} of ${FUNNEL.blended.Adoption} adopted accounts (${pct1(M.blended.expansion.rate)}). But over 90 days, I'd check whether those accounts had enough time to expand before calling this the bigger problem.`,
              ],
              ['Confidence', "High in the calculations, moderate in the diagnosis. Table 1 combines SSF and Sales-led accounts, so I can't yet tell what's driving the drop."],
              ['Next check', 'Compare SSF and Sales-led results with stage targets.'],
            ]}
          />
        </Answer>
        <DataTable
          head={['Stage', 'Accounts', 'Rate / basis']}
          num={[1]}
          rows={STAGES.map((st) => {
            const c = conversion('blended', st);
            const v = fmt(FUNNEL.blended[st]!);
            const basis = st === 'LeadGen' ? 'Starting cohort' : st === 'Sales' ? 'SSF skips the Sales stage' : c ? `${pct1(c.rate)} of ${c.from}${st === 'Onboarding' ? ' (both motions)' : ''}` : '—';
            return st === 'Adoption' ? [<strong>{st}</strong>, <strong>{v}</strong>, <strong style={{ color: 'var(--risk)' }}>{basis}</strong>] : [st, v, basis];
          })}
        />
      </QA>

      <QA
        num="Q2"
        question="Now use Table 2. Does your answer change? Show the specific numbers that drive your conclusion. (You'll need to compute conversion rates the tables don't give you.)"
        summary={`Yes. The leak is mostly self-signup: SSF adoption is ${pct1(M.ssf.adoption.rate)} vs ${pct1(M.sales.adoption.rate)} for Sales-led, and SSF is ${M.ssf.nonAdopters} of the ${M.blended.nonAdopters} non-adopters.`}
      >
        <Answer>
          <KV
            items={[
              [
                'What changed',
                `The split points me toward SSF. Only ${M.ssf.adoption.numerator} of ${M.ssf.adoption.denominator} SSF accounts reached adoption (${pct1(M.ssf.adoption.rate)}), versus ${M.sales.adoption.numerator} of ${M.sales.adoption.denominator} Sales-led accounts (${pct1(M.sales.adoption.rate)}), a ${M.adoptionGapPp.toFixed(1)} percentage-point gap.`,
              ],
              [
                'Why it matters',
                `SSF accounts for ${M.ssf.nonAdopters} of ${M.blended.nonAdopters} accounts that didn't reach adoption (${pct1(M.ssfShareOfNonAdopters)}). But SSF also makes up ${pct1(M.ssfShareOfOnboarded)} of all onboarded accounts, so its lower adoption rate is a stronger signal than the larger count alone.`,
              ],
              [
                'Other evidence',
                `Expansion among adopted accounts is ${pct1(M.ssf.expansion.rate)} for SSF (${M.ssf.expansion.numerator}/${M.ssf.expansion.denominator}) versus ${pct1(M.sales.expansion.rate)} for Sales-led (${M.sales.expansion.numerator}/${M.sales.expansion.denominator}). LeadGen → LeadDev is similar for both (about 72%). I'd investigate the SSF onboarding and adoption journey first, then compare customer profiles and support.`,
              ],
              ["What we don't know", 'Customer mix or support may explain the difference. These numbers show a gap, not its cause.'],
            ]}
          />
        </Answer>
        <DataTable
          head={['Conversion', 'SSF', 'Sales-led', 'Read']}
          num={[1, 2]}
          rows={[
            ['LeadGen → LeadDev', pct1(M.ssf.leadDev.rate), pct1(M.sales.leadDev.rate), 'Same top of funnel'],
            ['LeadDev → Sales', '—', pct1(M.sales.sales.rate), 'Sales-led only'],
            ['Sales → Onboarding', '—', pct1(M.sales.onboarding.rate), 'Sales-led only'],
            ['LeadDev → Onboarding (overall)', pct1(M.ssf.onboarding.rate), pct1(M.sales.onboardingFromLeadDev.rate), 'SSF onboards more freely'],
            [
              <strong>Onboarding → Adoption</strong>,
              <strong style={{ color: 'var(--risk)' }}>{pct1(M.ssf.adoption.rate)}</strong>,
              <strong>{pct1(M.sales.adoption.rate)}</strong>,
              <Pill tone="risk">−{M.adoptionGapPp.toFixed(1)} pp</Pill>,
            ],
            ['Adoption → Expansion', pct1(M.ssf.expansion.rate), pct1(M.sales.expansion.rate), <Pill tone="watch">−{M.expansionGapPp.toFixed(1)} pp</Pill>],
          ]}
        />
        <div className="grid c3">
          <Stat label="Non-adopters" value={pct1(M.ssfShareOfNonAdopters)} note={`SSF share (${M.ssf.nonAdopters} of ${M.blended.nonAdopters})`} />
          <Stat label="Onboarded mix" value={pct1(M.ssfShareOfOnboarded)} note={`SSF share (${FUNNEL.ssf.Onboarding} of ${FUNNEL.blended.Onboarding})`} />
          <Stat label="Non-adopters, Sales-led" value={M.sales.nonAdopters} note={`${pct1(M.salesShareOfNonAdopters)} of the leak`} />
        </div>
        <Callout tone="warn" title="Why adoption gets investigated first, and what this doesn't prove.">
          It's the largest measured loss, and most of it sits in a motion no Sales fix can reach. That makes it the most immediate thing to investigate. The figures are descriptive:
          they don't establish why SSF adopts less. The Section 4 goal of moving SSF adoption from {pct1(M.ssf.adoption.rate)} to about {Math.round(M.proposedSsfAdoptionTarget * 100)}%
          is a <strong>proposed experiment target</strong>, not a forecast or an achieved result.
        </Callout>
      </QA>

      <QA
        num="Q3"
        question="One motion has no Sales row. What does that structural difference imply, if anything, for what happens to those accounts later?"
        summary="SSF accounts have no Sales conversation and no CSx owner. That may affect adoption and expansion, but it isn't proven to cause the gap."
      >
        <Answer>
          <KV
            items={[
              ['Different journeys', 'SSF accounts skip Sales, while Sales-led accounts go through a Sales or partner process and receive a CSx owner from onboarding.'],
              ['Possible effect', 'SSF may have less structured human guidance as they move through onboarding and adoption.'],
              [
                'What the numbers show',
                `SSF adoption is lower (${pct1(M.ssf.adoption.rate)} vs ${pct1(M.sales.adoption.rate)}), as is expansion among adopted accounts (${pct1(M.ssf.expansion.rate)} vs ${pct1(M.sales.expansion.rate)}).`,
              ],
              ["What we can't prove", "Less human guidance might contribute, but it isn't proven. Sales-led customers may have different needs or intent, and Sales filters which accounts move forward."],
            ]}
          />
        </Answer>
        <Callout title="Bottom line.">The missing Sales stage may matter, but it's not proven to cause the gap.</Callout>
      </QA>
    </>
  );
}
