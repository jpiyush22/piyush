import { useState } from 'react';
import { Answer, BlockTitle, Callout, Card, DataTable, KV, Pill, QA, SectionHero, Stat, fmt, pct } from '../components/ui';

export const FUNNEL = {
  blended: { LeadGen: 1620, LeadDev: 1164, Sales: 260, Onboarding: 960, Adoption: 424, Expansion: 89 },
  ssf: { LeadGen: 1200, LeadDev: 864, Sales: 0, Onboarding: 744, Adoption: 305, Expansion: 38 },
  sales: { LeadGen: 420, LeadDev: 300, Sales: 260, Onboarding: 216, Adoption: 119, Expansion: 51 },
};

type Stage = keyof typeof FUNNEL.blended;
const STAGES: Stage[] = ['LeadGen', 'LeadDev', 'Sales', 'Onboarding', 'Adoption', 'Expansion'];

/** Conversion of a stage from the stage that feeds it (SSF skips Sales). */
function rate(f: Record<Stage, number>, s: Stage, skipSales: boolean): [number, Stage] | null {
  const prev: Record<Stage, Stage | null> = {
    LeadGen: null,
    LeadDev: 'LeadGen',
    Sales: 'LeadDev',
    Onboarding: skipSales ? 'LeadDev' : 'Sales',
    Adoption: 'Onboarding',
    Expansion: 'Adoption',
  };
  const p = prev[s];
  if (!p || !f[p] || !f[s]) return null;
  return [f[s] / f[p], p];
}

function FunnelChart({ mode }: { mode: 'blended' | 'split' }) {
  const max = 1620;
  return (
    <div className="funnel">
      {STAGES.map((s) => {
        const hot = s === 'Adoption';
        if (mode === 'blended') {
          const v = FUNNEL.blended[s];
          // In the blended view, Sales is a side-branch: onboarding is shown from LeadDev.
          const r = s === 'Sales' ? null : rate(FUNNEL.blended, s, true);
          return (
            <div key={s} className={`funnel-row ${hot ? 'hot' : ''}`}>
              <div className="stage">{s}</div>
              <div className="bars">
                <div className="bar" style={{ width: `${(v / max) * 100}%`, background: hot ? 'var(--risk)' : 'var(--brand)' }}>
                  {fmt(v)}
                </div>
              </div>
              <div className="rate">{r ? `${(r[0] * 100).toFixed(1)}% of ${r[1]}` : s === 'Sales' ? 'Sales-led only' : 'Starting cohort'}</div>
            </div>
          );
        }
        const a = FUNNEL.ssf[s];
        const b = FUNNEL.sales[s];
        const ra = rate(FUNNEL.ssf, s, true);
        const rb = rate(FUNNEL.sales, s, false);
        return (
          <div key={s} className={`funnel-row ${hot ? 'hot' : ''}`}>
            <div className="stage">{s}</div>
            <div className="bars">
              {a ? (
                <div className="bar" style={{ width: `${(a / max) * 100}%`, background: 'var(--ssf)' }}>
                  {fmt(a)}
                </div>
              ) : (
                <div className="tiny muted" style={{ height: 22, display: 'flex', alignItems: 'center' }}>
                  SSF has no Sales stage
                </div>
              )}
              <div className="bar" style={{ width: `${(b / max) * 100}%`, background: 'var(--sales)' }}>
                {fmt(b)}
              </div>
            </div>
            <div className="rate">
              {s === 'LeadGen' ? (
                'Starting cohort'
              ) : (
                <>
                  <div>SSF {ra ? `${(ra[0] * 100).toFixed(1)}%` : '—'}</div>
                  <div>Sales-led {rb ? `${(rb[0] * 100).toFixed(1)}%` : '—'}</div>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function S1Funnel() {
  const [mode, setMode] = useState<'blended' | 'split'>('split');
  return (
    <>
      <SectionHero
        eyebrow="Section 1"
        title="Read the funnel"
        lede="A monthly cohort of new accounts through their first 90 days. Nobody said what the problem is. Finding out whether there is one, and where, was the job."
        tags={
          <>
            <Pill tone="risk">Biggest leak: Onboarding → Adoption</Pill>
            <Pill tone="brand">SSF is 81.9% of non-adopters</Pill>
            <Pill>Team estimates, not finance figures</Pill>
          </>
        }
      />

      <div className="grid c4" style={{ marginBottom: 24 }}>
        <Stat label="Not reaching adoption" value="536" note="of 960 onboarded (55.8%)" accent />
        <Stat label="SSF adoption" value="41.0%" note="305 / 744" />
        <Stat label="Sales-led adoption" value="55.1%" note="119 / 216" />
        <Stat label="Gap" value="14.1 pp" note="SSF below Sales-led" />
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
            <span>
              <i style={{ background: 'var(--risk)' }} />
              Largest leak
            </span>
          </div>
        )}
        <FunnelChart mode={mode} />
        <p className="tiny muted" style={{ marginTop: 14 }}>
          Rates are each stage relative to the stage that feeds it. SSF Onboarding is measured from LeadDev because SSF has no Sales stage.
        </p>
      </Card>

      <div style={{ height: 28 }} />
      <BlockTitle>Questions</BlockTitle>

      <QA
        num="Q1"
        question="Read Table 1 on its own first. What's your read on the health of this funnel? Where's the biggest problem, and how confident are you?"
        summary="The biggest drop is Onboarding → Adoption: only 424 of 960 (44.2%) progress. I'm confident in the maths and only moderately confident in the diagnosis, because Table 1 mixes both motions."
      >
        <Answer>
          <KV
            items={[
              [
                'My read',
                "Table 1 alone doesn't show whether the funnel is healthy; I'd first compare it with targets. The biggest drop is from Onboarding to Adoption: 960 accounts reached onboarding, but only 424 reached adoption (44.2%). That leaves 536 (55.8%) that didn't progress.",
              ],
              [
                'Other concern',
                "Expansion converts just 89 of 424 adopted accounts (21.0%). But over 90 days, I'd check whether those accounts had enough time to expand before calling this the bigger problem.",
              ],
              ['Confidence', "High in the calculations, moderate in the diagnosis. Table 1 combines SSF and Sales-led accounts, so I can't yet tell what's driving the drop."],
              ['Next check', 'Compare SSF and Sales-led results with stage targets.'],
            ]}
          />
        </Answer>
        <DataTable
          head={['Stage', 'Accounts', 'Rate / basis']}
          num={[1]}
          rows={[
            ['LeadGen', '1,620', 'Starting cohort'],
            ['LeadDev', '1,164', '71.9% of LeadGen'],
            ['Sales', '260', 'SSF skips the Sales stage'],
            ['Onboarding', '960', '82.5% of LeadDev (both motions)'],
            [<strong>Adoption</strong>, <strong>424</strong>, <strong style={{ color: 'var(--risk)' }}>44.2% of Onboarding</strong>],
            ['Expansion', '89', '21.0% of Adoption'],
          ]}
        />
      </QA>

      <QA
        num="Q2"
        question="Now use Table 2. Does your answer change? Show the specific numbers that drive your conclusion. (You'll need to compute conversion rates the tables don't give you.)"
        summary="Yes. The leak is mostly self-signup: SSF adoption is 41.0% vs 55.1% for Sales-led, and SSF is 439 of the 536 non-adopters."
      >
        <Answer>
          <KV
            items={[
              ['What changed', 'The split points me toward SSF. Only 305 of 744 SSF accounts reached adoption (41.0%), versus 119 of 216 Sales-led accounts (55.1%), a 14.1 percentage-point gap.'],
              [
                'Why it matters',
                "SSF accounts for 439 of 536 accounts that didn't reach adoption (81.9%). But SSF also makes up 77.5% of all onboarded accounts, so its lower adoption rate is a stronger signal than the larger count alone.",
              ],
              [
                'Other evidence',
                "Expansion among adopted accounts is 12.5% for SSF (38/305) versus 42.9% for Sales-led (51/119). LeadGen → LeadDev is similar for both (about 72%). I'd investigate the SSF onboarding and adoption journey first, then compare customer profiles and support.",
              ],
              ["What we don't know", "Customer mix or support may explain the difference. These numbers show a gap, not its cause."],
            ]}
          />
        </Answer>
        <DataTable
          head={['Conversion', 'SSF', 'Sales-led', 'Read']}
          num={[1, 2]}
          rows={[
            ['LeadGen → LeadDev', '72.0%', '71.4%', 'Same top of funnel'],
            ['LeadDev → Sales', '—', '86.7%', 'Sales-led only'],
            ['Sales → Onboarding', '—', '83.1%', 'Sales-led only'],
            ['LeadDev → Onboarding (overall)', '86.1%', '72.0%', 'SSF onboards more freely'],
            [<strong>Onboarding → Adoption</strong>, <strong style={{ color: 'var(--risk)' }}>41.0%</strong>, <strong>55.1%</strong>, <Pill tone="risk">−14.1 pp</Pill>],
            ['Adoption → Expansion', '12.5%', '42.9%', <Pill tone="watch">−30.4 pp</Pill>],
          ]}
        />
        <div className="grid c3">
          <Stat label="Non-adopters" value={`${pct(439, 536)}`} note="SSF share (439 of 536)" />
          <Stat label="Onboarded mix" value="77.5%" note="SSF share (744 of 960)" />
          <Stat label="Non-adopters, Sales-led" value="97" note="18.1% of the leak" />
        </div>
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
              ['What the numbers show', 'SSF adoption is lower (41.0% vs 55.1%), as is expansion among adopted accounts (12.5% vs 42.9%).'],
              ["What we can't prove", "Less human guidance might contribute, but it isn't proven. Sales-led customers may have different needs or intent, and Sales filters which accounts move forward."],
            ]}
          />
        </Answer>
        <Callout title="Bottom line.">
          The missing Sales stage may matter, but it's not proven to cause the gap.
        </Callout>
      </QA>
    </>
  );
}
