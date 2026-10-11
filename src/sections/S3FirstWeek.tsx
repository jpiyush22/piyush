import { Answer, Callout, Card, DataTable, KV, Pill, Prov, QA, SectionHero } from '../components/ui';
import { FUNNEL, METRICS as M, pct1 } from '../domain/funnel';

const ROADMAP = [
  { label: 'Validate both problems', from: 1, to: 2, color: 'var(--navy)', text: 'Baseline + lead audit' },
  { label: 'Adoption-risk pilot', from: 3, to: 6, color: 'var(--brand)', text: 'Execution signals · daily SSF watchlist' },
  { label: 'Test interventions', from: 7, to: 9, color: 'var(--navy)', text: 'SSF guidance · CSx tasks' },
  { label: 'Fix proven qualification', from: 10, to: 12, color: 'var(--brand)', text: 'Routing · dedupe · source' },
  { label: 'Quick Sales fixes', from: 1, to: 12, color: 'var(--brand-light)', text: 'Ship obvious routing/duplicate fixes as soon as the audit confirms them' },
];

export default function S3FirstWeek() {
  return (
    <>
      <SectionHero
        eyebrow="Section 3"
        title="Your first week"
        lede={
          <>
            <em>"Our biggest problem is lead quality… If we just fixed qualification, everything downstream gets easier. Can you own it?"</em> — Head of Sales, after standup.
          </>
        }
        tags={
          <>
            <Pill tone="brand">Adoption first, measured</Pill>
            <Pill tone="watch">Lead quality: audit in 2 weeks</Pill>
            <Pill>Quick fixes don't wait</Pill>
          </>
        }
      />

      <div className="thread" style={{ marginBottom: 28 }}>
        <div className="msg in">
          <div className="who">HS</div>
          <div className="bubble">
            <div className="meta">Head of Sales</div>
            Look, I'll be honest: our biggest problem is lead quality. Marketing floods us with leads that go nowhere, and my reps burn half their day triaging junk. If we just fixed
            qualification, everything downstream gets easier. I'd love for this to be your first project. Can you own it?
          </div>
        </div>
        <div className="msg out">
          <div className="who"><img src="piyush.jpg" alt="Piyush Jain" /></div>
          <div className="bubble">
            <div className="meta">Piyush</div>I understand the frustration. If your reps are spending half their day sorting through poor-quality leads, we need to address that. I'd like
            to review actual leads with your team first to understand whether the problem is lead quality, routing, duplicates or missing information. I'll own that investigation and
            come back with findings and recommended fixes within two weeks.
            <br />
            <br />
            At the same time, our funnel shows a significant drop after onboarding, particularly for self-signup customers. I want to make sure we're solving both problems based on
            their actual impact.
          </div>
        </div>
      </div>

      <QA
        num="Q1"
        question="Based on what you've found so far, where does lead qualification sit relative to the other things you've seen?"
        summary="Important, but not the top priority yet. The clearest measured problem is after onboarding, and SSF never goes through Sales, so better qualification can't fix it."
      >
        <Answer>
          <p>
            The clearest problem in the data is after onboarding: <strong>536 of 960 accounts (55.8%)</strong> don't reach Adoption. SSF accounts have a particularly low adoption rate
            of <strong>{pct1(M.ssf.adoption.rate)}</strong>, and they never go through Sales. Improving sales qualification alone won't fix that.
          </p>
          <p>
            The Head of Sales says reps spend half their day screening poor-quality leads. That's an unverified claim, not a measured result, but I'd take it seriously and review lead
            sources, disqualification reasons, and time spent qualifying. The current funnel doesn't prove whether lead quality is good or bad.
          </p>
        </Answer>
        <DataTable
          head={['Metric', 'Value', 'Why it matters']}
          num={[1]}
          rows={[
            ['Onboarded accounts', String(FUNNEL.blended.Onboarding), 'Combined cohort'],
            ['Accounts not reaching Adoption', String(M.blended.nonAdopters), 'Largest absolute loss after onboarding'],
            ['SSF Adoption rate', pct1(M.ssf.adoption.rate), 'SSF has no Sales stage; fixing rep qualification cannot directly fix this path'],
            ['Sales-led Adoption rate', pct1(M.sales.adoption.rate), "Higher than SSF; doesn't prove support causes the difference"],
            ['SSF share of non-adopters', pct1(M.ssfShareOfNonAdopters), 'Most of the count comes from self-signup'],
            ['LeadGen → LeadDev', `SSF ${pct1(M.ssf.leadDev.rate)} · Sales-led ${pct1(M.sales.leadDev.rate)}`, 'Comparable top-of-funnel conversion, not a lead-quality measure'],
          ]}
        />
        <Card title="How I'd handle the Sales concern">
          <DataTable
            head={['Check', "What I'd look at", 'Why']}
            rows={[
              ['Lead sources + quality', 'Disqualified lead share by source, reason, ICP fit and outcome', 'Find whether a few sources create most wasted effort'],
              ['Rep time + routing', 'Minutes spent triaging, speed to first action, duplicates, routing misses', 'Measure true time cost before rebuilding qualification'],
              ['Downstream outcomes', 'Qualified → opportunity/closed-won, onboarding and adoption by lead source', 'See whether qualification improves actual customer results'],
            ]}
          />
        </Card>
        <Callout title="Bottom line.">
          Adoption has the clearest measured leak. Lead quality remains a credible hypothesis worth validating quickly, not a proven root cause. If the audit reveals a bigger business
          impact than expected, I'd reprioritise.
        </Callout>
      </QA>

      <QA
        num="Q2"
        question="You can't work on everything at once. Lay out your actual priority order for your first quarter, and justify why qualification lands where it does."
        summary="Validate → adoption pilot → test interventions → fix proven qualification issues. Obvious routing or duplicate fixes ship as soon as they're confirmed."
      >
        <Card title="First-quarter roadmap">
          <div className="gantt" role="img" aria-label="Twelve-week roadmap">
            <div />
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className="wk">
                W{i + 1}
              </div>
            ))}
            {ROADMAP.map((r) => (
              <div key={r.label} style={{ display: 'contents' }}>
                <div className="lbl">{r.label}</div>
                <div className="blk" style={{ gridColumn: `${r.from + 1} / ${r.to + 2}`, background: r.color, color: r.label.startsWith('Quick') ? 'var(--navy)' : '#fff' }} title={r.text}>
                  {r.text}
                </div>
              </div>
            ))}
          </div>
        </Card>
        <DataTable
          head={['#', 'Timing', 'Focus', 'Deliverable', "How I'd judge it"]}
          rows={[
            ['1', 'Weeks 1–2', 'Validate adoption and lead-quality problems', 'Funnel baseline, event-quality checks; quick rep-time / lead-routing audit', 'Reliable baseline; evidence of Sales effort, bad leads and source mix'],
            ['2', 'Weeks 3–6', 'Ship adoption-risk pilot', 'Workflow/AI execution signals; daily SSF watchlist with reasons', 'Usable account flags and acceptable false-alert rate'],
            ['3', 'Weeks 7–9', 'Test targeted intervention', 'SSF guidance and CSx tasks for Sales-led accounts', 'Adoption/feature-use change vs comparison group; actionable follow-ups'],
            ['4', 'Weeks 10–12', 'Fix proven qualification issues', 'Targeted routing / dedupe / source-quality fix, not a CRM rebuild', 'Minutes saved per lead; qualified-to-outcome performance'],
          ]}
        />
        <div id="s3-evidence" />
        <Card title="Evidence-backed priorities vs proposed experiments">
          <DataTable
            head={['Workstream', 'Basis', 'What it rests on']}
            rows={[
              ['Adoption and early-churn investigation', <Prov kind="case-study" />, `${M.blended.nonAdopters} of ${FUNNEL.blended.Onboarding} onboarded accounts don't reach Adoption; SSF ${pct1(M.ssf.adoption.rate)} vs ${pct1(M.sales.adoption.rate)}.`],
              ['Instrumentation (workflow / AI execution events)', <Prov kind="case-study" />, 'The Account A extract has no execution events, so depth usage cannot be verified.'],
              ['CRM association reliability', <Prov kind="case-study" />, 'The brief: associations arrive unlinked, have retry/fallback workflows, and Workspace → Company is inconsistently populated.'],
              ['Lead-quality and routing audit', <Pill tone="watch">Claim to verify</Pill>, '"Half their day triaging" is the Head of Sales\' estimate. Not measured yet; the audit measures it.'],
              ['Safe automation + measurement', <Prov kind="proposed" />, `SSF adoption ${pct1(M.ssf.adoption.rate)} → ~${Math.round(M.proposedSsfAdoptionTarget * 100)}% is an experiment target, measured against a holdout. No impact or ROI is claimed.`],
            ]}
          />
        </Card>
        <div className="grid c2">
          <Answer label="Why qualification comes later">
            <p>
              Our clearest measured leak is after onboarding: {M.blended.nonAdopters} of {FUNNEL.blended.Onboarding} accounts ({pct1(M.blended.nonAdoptionRate)}) do not reach Adoption, and SSF adoption is only {pct1(M.ssf.adoption.rate)}. Better Sales qualification would not
              directly fix the SSF journey. The Head of Sales may be right about wasted time, but we need to quantify it first.
            </p>
          </Answer>
          <Answer label="What could change the order">
            <p>
              I wouldn't leave Sales waiting all quarter. I'd fix obvious, low-effort routing or duplicate issues as soon as the audit confirms them. If Sales time loss and revenue
              impact clearly exceed the adoption pilot opportunity, I'd move qualification fixes forward.
            </p>
          </Answer>
        </div>
        <Card title="Lead quality: test early, build if justified">
          <DataTable
            head={['Question', 'Check', 'Decision']}
            rows={[
              ['Is the time cost real?', 'Sample triage time by rep; duplicates and routing delays; quantify hours lost', 'Fix quick, obvious problems early'],
              ['Are certain sources low quality?', 'Source, ICP match, disqualification reason, cost per qualified opportunity', 'Focus on worst sources rather than changing all lead scoring'],
              ['Does qualification change outcomes?', 'Qualified → opportunity → win → onboarding and adoption by source', 'Expand only if downstream outcomes justify it'],
            ]}
          />
        </Card>
        <Callout title="By quarter end:">
          a working adoption-risk pilot, evidence on which interventions help, and targeted lead-quality fixes based on measured impact. The two efforts need not be mutually exclusive.
        </Callout>
      </QA>

      <QA
        num="Q3"
        question="How do you respond to the Head of Sales, and what do you commit to?"
        summary="Acknowledge the pain, own a two-week diagnosis, ship quick fixes early, and don't promise an unproven full qualification rebuild."
      >
        <Card title="Exact commitments">
          <DataTable
            head={['When', "What I'd do", 'Output', 'Measure']}
            rows={[
              [
                <Pill tone="brand">Week 1</Pill>,
                'Meet a small sample of reps; inspect representative recent leads, disqualification reasons, sources and routing.',
                'Baseline of actual qualification issues and rep time lost.',
                'Sampled triage minutes per lead; duplicates; misroutes.',
              ],
              [
                <Pill tone="brand">Week 1</Pill>,
                'Identify easy fixes as soon as they are proven; coordinate with Sales before changing rules.',
                'One quick fix if warranted (e.g. duplicate prevention or routing).',
                'Change in duplicates or incorrectly assigned leads.',
              ],
              [
                <Pill tone="brand">End of week 2</Pill>,
                'Share findings with Head of Sales; rank fixes by time saved and downstream opportunity impact.',
                'One-page recommendation and agreed next step.',
                'Time spent triaging; share disqualified; qualified → opportunity.',
              ],
              [
                <Pill tone="outline">After first fix</Pill>,
                'Review outcomes with Sales; monitor whether the change actually helps.',
                'Keep, refine, or roll back the fix.',
                'Rep time saved; qualified-to-opportunity rate.',
              ],
            ]}
          />
        </Card>
        <div className="grid c2">
          <Answer label="How I'd measure it">
            <p>Rep time saved, fewer duplicate or misrouted leads, and qualified leads that turn into real opportunities. I'd review the results with Sales rather than assuming the fix worked.</p>
          </Answer>
          <Answer label="What I wouldn't promise">
            <p>An immediate full qualification overhaul, guaranteed higher lead quality, or that lead quality causes the downstream adoption drop.</p>
          </Answer>
        </div>
        <KV
          items={[
            ['Onboarding → Adoption', `${pct1(M.blended.adoption.rate)} blended: the biggest absolute leak.`],
            ['SSF Onboarding → Adoption', `${pct1(M.ssf.adoption.rate)}: improving Sales qualification can't directly fix the self-signup journey.`],
            ['Sales triage time claim', 'Unverified (Head of Sales estimate). Measure the time cost before committing to a rebuild.'],
          ]}
        />
      </QA>
    </>
  );
}
