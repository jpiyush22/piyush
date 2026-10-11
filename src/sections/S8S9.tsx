import { Answer, Callout, Card, Icon, Pill, QA, SectionHero } from '../components/ui';

/**
 * Section 8 recordings (Loom or YouTube links are embedded; anything else is
 * shown as a link). Add, remove or reorder entries here.
 */
export const VIDEOS: { title: string; url: string }[] = [
  { title: 'Walkthrough · part 1', url: 'https://www.loom.com/share/bc819e8c31154fef80e374f939e7663f' },
  { title: 'Walkthrough · part 2', url: 'https://www.loom.com/share/aa400fbaa83c4db986b0ca700fecb8ab' },
];

function embedUrl(url: string): string | null {
  const yt = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/.exec(url);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const loom = /loom\.com\/share\/([\w-]+)/.exec(url);
  if (loom) return `https://www.loom.com/embed/${loom[1]}`;
  return null;
}

export function S8Video() {
  return (
    <>
      <SectionHero
        eyebrow="Section 8 · required"
        title="Show your working"
        lede="My recorded walkthrough of how I approached the challenge: where I started, what I assumed, what confused me, and what I'd check with more time or access."
        tags={<Pill tone="brand">Video, not a written substitute</Pill>}
      />
      {VIDEOS.length === 0 ? (
        <Card title="Walkthrough video">
          <p className="small muted">Video sent separately with the submission. Add links to VIDEOS in src/sections/S8S9.tsx to embed them here.</p>
        </Card>
      ) : (
        <div className="stack" data-testid="videos">
          {VIDEOS.map((v) => {
            const embed = embedUrl(v.url);
            return (
              <Card
                key={v.url}
                title={v.title}
                right={
                  <a className="btn sm" href={v.url} target="_blank" rel="noreferrer">
                    <Icon name="video" size={16} /> Open in Loom
                  </a>
                }
              >
                {embed ? (
                  <div style={{ position: 'relative', paddingTop: '56.25%', borderRadius: 14, overflow: 'hidden', background: 'var(--rail)' }}>
                    <iframe
                      src={embed}
                      title={v.title}
                      loading="lazy"
                      allow="fullscreen; picture-in-picture"
                      allowFullScreen
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
                    />
                  </div>
                ) : (
                  <a className="btn primary" href={v.url} target="_blank" rel="noreferrer">
                    <Icon name="video" /> Watch
                  </a>
                )}
              </Card>
            );
          })}
        </div>
      )}
      <div style={{ height: 16 }} />
      <Card title="Optional in-app demo (not a substitute for the video)" right={<button className="btn primary sm" onClick={() => window.dispatchEvent(new Event('start-walkthrough'))} data-testid="start-demo">Start guided demo</button>}>
        <p className="small">
          A 9-step tour (about 3–5 minutes) through the funnel maths, Account A's events, the risk engine, the CRM explorer, the drift incident and the Signal Desk. The recorded walkthroughs are
          above.
        </p>
      </Card>
      <div style={{ height: 16 }} />
      <div id="s8-assumptions" />
      <Card title="Assumptions and unresolved questions">
        <div className="grid c2">
          <div>
            <h3 style={{ fontSize: 16 }}>What I assumed</h3>
            <ul className="small" style={{ paddingLeft: 18 }}>
              <li>Funnel counts are accounts reaching each stage within 90 days (team estimates, one monthly cohort).</li>
              <li>Product events record configuration (created/edited/triggered), not successful execution.</li>
              <li>Each Workspace has its own CB Subscription, per the brief; shared contacts or domains prove nothing about ownership or payer.</li>
              <li>Thresholds (14-day stall, 26h freshness, 14-day cooldown, 2× / 1.5× drift) are proposals to calibrate, not benchmarks.</li>
            </ul>
          </div>
          <div>
            <h3 style={{ fontSize: 16 }}>What I'd check with access</h3>
            <ul className="small" style={{ paddingLeft: 18 }}>
              <li>Whether workflow/AI execution events exist anywhere, and whether AI-agent events after day 12 are complete.</li>
              <li>HubSpot association workflow branches, retry logs and custom association labels.</li>
              <li>Chargebee customer IDs and the real Beauty Lounge contract and payer hierarchy.</li>
              <li>Actual rep triage time and lead-source outcomes behind the Head of Sales' estimate.</li>
              <li>Engineering deployment/migration metadata and actor/origin on workflow_edited.</li>
            </ul>
          </div>
        </div>
      </Card>
      <div style={{ height: 16 }} />
      <Card title="Where the thinking went (from the written answers)">
        <div className="steps">
          {[
            ['Started with the funnel', 'Table 1 pointed at Onboarding → Adoption; Table 2 moved it to SSF (41.0% vs 55.1%). I held back on cause: the split shows a gap, not why.'],
            ['Re-derived Account A from raw events', 'Messaging flat at ~90/week while recorded depth activity stopped. The key realisation: creation and edit events are not executions, so silence can mean UNKNOWN, not churn.'],
            ['Kept the Head of Sales in the plan', 'Lead quality is a credible but unmeasured claim. A two-week audit and quick fixes, without displacing the measured adoption leak.'],
            ['Designed against the real stack', 'Warehouse owns logic, HubSpot owns work, Make/n8n only routes; daily because adoption moves in weeks; live eligibility + idempotency before anything touches a customer.'],
            ['Assumptions I had to make', 'Whether events reflect successful execution, what links Workspaces to legal/billing Companies, and what risk/action tracking already exists.'],
            ["What I'd check with access", 'HubSpot association workflow branches and retry logs, custom association labels, Chargebee customer IDs, the real Beauty Lounge contract hierarchy, and event completeness.'],
          ].map(([t, d], i) => (
            <div key={t} className="step">
              <div className="n">{i + 1}</div>
              <div>
                <div className="t">{t}</div>
                <div className="d">{d}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

export function S9Feedback() {
  return (
    <>
      <SectionHero
        eyebrow="Section 9 · not graded"
        title="Feedback on the challenge"
        lede="Blunt rather than diplomatic, as asked."
        tags={<Pill tone="brand">~15 hours end to end</Pill>}
      />
      <QA num="Q1" question="Roughly how long did this take you, end to end?" summary="About 15 hours across several sessions.">
        <Answer>
          A good amount of that time went into validating the assumptions, building the architecture and tool sketches, and making sure the answers connected, not just writing them.
        </Answer>
      </QA>
      <QA num="Q2" question="Which section took you the longest, and which was quickest?" summary="Longest: Section 4, then Section 7. Quickest: Section 3.">
        <Answer>
          Section 4 was the most time-consuming because a credible end-to-end design meant deciding where each responsibility belongs, how the tools connect and what could
          realistically ship. Section 7 also took time because of the actual wireframe. Section 3 was quickest: once I'd worked through the funnel and account patterns, the priority
          call was relatively clear.
        </Answer>
      </QA>
      <QA num="Q3" question="Was anything unclear, ambiguous, or missing: anywhere you had to guess at what we were asking for?" summary="The ambiguity felt intentional. Three real gaps forced assumptions.">
        <Answer>
          The biggest gaps were whether product events represent successful workflow execution or configuration activity, what reliably links Workspaces to legal/billing Companies, and
          what the existing risk/action tracking already covers. I made assumptions rather than treating missing evidence as proof. A brief example of the current reporting or CRM
          workflow setup would have helped distinguish what needs building from what already exists.
        </Answer>
      </QA>
      <QA num="Q4" question="Which part did you find most interesting, and which felt least worth your time?" summary="Most: Section 6. Least: the overlap between Sections 2 and 4.">
        <Answer>
          The workflow_edited scenario gets at a problem that's easy to miss: data can be technically correct and every sync green while the decisions built on it become wrong. The
          least useful part was some repetition in identifying the same adoption/risk signals across Sections 2 and 4. I understand why the sections build on each other, but a little
          less overlap would keep the focus on new decisions.
        </Answer>
      </QA>
      <QA num="Q5" question="Anything else? Too long, too vague, unrealistic, badly worded: all fair game." summary="I liked it. It's substantial, though, and an expected time budget would help.">
        <Answer>
          I liked that this tested judgment and trade-offs rather than a perfect textbook architecture. The real stack, messy CRM associations and the requirement for actual artefacts
          made it feel close to the job. My main feedback is on scope: written analysis, an architecture diagram, a tool wireframe and a required video add up to a fairly substantial
          take-home. An indication of expected time, or a slightly narrower required scope, would make it easier to judge how deep to go. I appreciated the freedom to state assumptions
          and choose a lean MVP rather than over-engineer the answer.
        </Answer>
      </QA>
      <Callout title="Files.">
        The original answer document and working spreadsheet are in the sidebar under Downloads.
      </Callout>
    </>
  );
}
