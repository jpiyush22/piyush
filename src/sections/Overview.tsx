import { Icon, Pill, Stat } from '../components/ui';
import { SECTIONS, type SectionId } from './registry';

export default function Overview({ go }: { go: (id: SectionId) => void }) {
  return (
    <>
      <section className="hero">
        <div className="eyebrow">RevOps Engineer · Take-home challenge</div>
        <h1>
          The leak isn't lead quality. It's <span className="grad">self-signup adoption.</span>
        </h1>
        <p>
          536 of 960 onboarded accounts never reach Adoption, and 439 of them are self-signup. This is my full answer to the Superchat brief: the diagnosis, the early-warning system,
          the CRM model, the failure drill and a working prototype of the tool that sits on top.
        </p>
        <div className="row-wrap">
          <button className="btn primary" onClick={() => go('s1')}>
            Start with the funnel <Icon name="arrowR" size={16} />
          </button>
          <button className="btn" onClick={() => go('s7')}>
            Open the Signal Desk prototype
          </button>
          <button className="btn" onClick={() => go('s4')}>
            See the architecture
          </button>
        </div>
        <div className="hero-chat" aria-hidden="true">
          <div className="b in">Hey 👋 Where's the biggest problem in this funnel, and how confident are you?</div>
          <div className="b out">Onboarding → Adoption. SSF converts 41.0% vs 55.1% Sales-led: a 14.1 pp gap, and 81.9% of all non-adopters.</div>
          <div className="b in">And what would you build first?</div>
          <div className="b out">A daily, explainable Workspace risk signal, with one safe, human-approved action. I can ship it alone in two weeks.</div>
        </div>
        <p className="tiny" style={{ marginTop: 20, color: '#9fb6cf' }}>
          Submitted by Piyush Jain · numbers are the illustrative team estimates from the brief
        </p>
      </section>

      <div className="bento" style={{ margin: '24px 0 32px' }}>
        <div className="card bento-feature">
          <div className="eyebrow">Key finding</div>
          <h3 style={{ fontSize: 24, margin: '8px 0 6px' }}>Onboarding → Adoption is where accounts stall</h3>
          <p className="small" style={{ color: 'var(--ink-2)' }}>
            Same top of funnel for both motions (≈72% LeadGen → LeadDev). The gap opens after onboarding.
          </p>
          <div className="compare">
            {[
              ['SSF (self-signup)', 305, 744, 'var(--ssf)'],
              ['Sales-led', 119, 216, 'var(--sales)'],
            ].map(([l, n, d, c]) => (
              <div key={l as string}>
                <div className="compare-head">
                  <span>{l}</span>
                  <strong>{(((n as number) / (d as number)) * 100).toFixed(1)}%</strong>
                </div>
                <div className="compare-track">
                  <div style={{ width: `${((n as number) / (d as number)) * 100}%`, background: c as string }} />
                </div>
                <div className="tiny muted">
                  {n} of {d} onboarded accounts reached Adoption
                </div>
              </div>
            ))}
          </div>
          <div className="row-wrap" style={{ marginTop: 16 }}>
            <Pill tone="brand">−14.1 pp gap</Pill>
            <Pill tone="outline">SSF = 439 of 536 non-adopters (81.9%)</Pill>
          </div>
        </div>
        <Stat label="Didn't reach adoption" value="55.8%" note="536 of 960 onboarded" accent />
        <Stat label="Expansion of adopted" value="12.5 / 42.9%" note="SSF vs Sales-led, 90-day window" />
        <Stat label="Pilot target" value="+5 pp" note="SSF 41% → ~46%, a test target, not a forecast" />
        <Stat label="First slice" value="2 weeks" note="One engineer, existing stack" />
        {[
          ['Diagnose', 'Sections 1–3', 'The funnel leaks after onboarding, mostly in SSF. Account A shows depth features fading while messaging stays flat. Lead quality gets a two-week audit, not the quarter.', 's1'],
          ['Build', 'Sections 4–5', 'The warehouse scores each Workspace daily, Hightouch syncs it to HubSpot, and Make/n8n routes it with live eligibility and idempotency. Company becomes a verified layer; Workspace stays the grain.', 's4'],
          ['Own', 'Sections 6–7', 'A cheap signal-integrity check catches semantic drift. Signal Desk is the review surface; it starts as HubSpot views and has explicit kill criteria.', 's6'],
        ].map(([t, s, d, id]) => (
          <button key={t} className="card bento-third sec-card" onClick={() => go(id as SectionId)}>
            <div className="row-wrap" style={{ justifyContent: 'space-between', width: '100%' }}>
              <h3 style={{ margin: 0 }}>{t}</h3>
              <Pill tone="brand">{s}</Pill>
            </div>
            <p>{d}</p>
          </button>
        ))}
      </div>

      <div className="block-title">
        <h2>All sections</h2>
        <span className="small muted">Every question from the brief, answered in order</span>
      </div>
      <div className="grid c3">
        {SECTIONS.filter((s) => s.id !== 'overview').map((s) => (
          <button key={s.id} className="sec-card" onClick={() => go(s.id)}>
            <div className="top">
              <span className="avatar" style={{ background: s.color }}>
                <Icon name={s.icon} size={18} />
              </span>
              {s.tag ? <Pill tone="outline">{s.tag}</Pill> : <span className="tiny muted">Section {s.num}</span>}
            </div>
            <h3>{s.title}</h3>
            <p>{s.preview}</p>
          </button>
        ))}
      </div>
    </>
  );
}
