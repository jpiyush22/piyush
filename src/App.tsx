import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { BrandLogo, BrandMark, Icon } from './components/ui';
import { SECTIONS, type SectionId } from './sections/registry';
import Overview from './sections/Overview';
import S1Funnel from './sections/S1Funnel';
import S2Leak from './sections/S2Leak';
import S3FirstWeek from './sections/S3FirstWeek';
import S4System from './sections/S4System';
import S5DataModel from './sections/S5DataModel';
import S6Breaks from './sections/S6Breaks';
import S7Tool from './sections/S7Tool';
import { S8Video, S9Feedback } from './sections/S8S9';

const readHash = (): SectionId => {
  const h = window.location.hash.replace('#', '') as SectionId;
  return SECTIONS.some((s) => s.id === h) ? h : 'overview';
};

export default function App() {
  const [current, setCurrent] = useState<SectionId>(readHash);
  const [navOpen, setNavOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onHash = () => {
      setCurrent(readHash());
      setNavOpen(false);
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = (id: SectionId) => {
    if (id === current) window.scrollTo({ top: 0, behavior: 'smooth' });
    window.location.hash = id;
  };

  const meta = SECTIONS.find((s) => s.id === current)!;
  const idx = SECTIONS.findIndex((s) => s.id === current);
  const prev = SECTIONS[idx - 1];
  const next = SECTIONS[idx + 1];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? SECTIONS.filter((s) => `${s.title} ${s.preview} section ${s.num}`.toLowerCase().includes(q)) : SECTIONS;
  }, [query]);

  const pages: Record<SectionId, ReactNode> = {
    overview: <Overview go={go} />,
    s1: <S1Funnel />,
    s2: <S2Leak />,
    s3: <S3FirstWeek />,
    s4: <S4System />,
    s5: <S5DataModel />,
    s6: <S6Breaks />,
    s7: <S7Tool />,
    s8: <S8Video />,
    s9: <S9Feedback />,
  };

  return (
    <div className={`app ${navOpen ? 'nav-open' : ''}`}>
      <aside className="rail" aria-label="App">
        <div className="rail-logo">
          <BrandMark />
        </div>
        {SECTIONS.map((s) => (
          <button key={s.id} className="rail-btn" aria-current={current === s.id ? 'page' : undefined} onClick={() => go(s.id)} aria-label={s.title}>
            <Icon name={s.icon} />
            <span className="tip">
              {s.id === 'overview' ? '' : `${s.num}. `}
              {s.title}
            </span>
          </button>
        ))}
        <div className="rail-spacer" />
        <div className="rail-avatar" title="Piyush Jain">
          PJ
        </div>
      </aside>

      <div className="scrim" onClick={() => setNavOpen(false)} />

      <nav className="nav" aria-label="Sections">
        <div className="nav-head">
          <BrandLogo className="nav-logo" />
          <div className="nav-title">RevOps take-home</div>
          <div className="nav-sub">Piyush Jain · RevOps Engineer candidate</div>
          <label className="nav-search">
            <Icon name="search" size={16} />
            <input placeholder="Search sections" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search sections" />
          </label>
        </div>
        <div className="nav-list">
          <div className="nav-group">Inbox · {filtered.length}</div>
          {filtered.map((s) => (
            <button key={s.id} className="nav-item" aria-current={current === s.id ? 'page' : undefined} onClick={() => go(s.id)}>
              <span className="avatar" style={{ background: s.color }}>
                {s.num}
              </span>
              <span className="meta">
                <span className="row">
                  <span className="name">{s.title}</span>
                  {s.tag && <span className="tag">{s.tag}</span>}
                </span>
                <span className="preview" style={{ display: 'block' }}>
                  {s.preview}
                </span>
              </span>
            </button>
          ))}
          <div className="nav-group">Downloads</div>
          <a className="nav-item" href="files/RevOps_Take-Home_Piyush_Jain_answers.docx" download>
            <span className="avatar" style={{ background: '#0d2b4d' }}>
              <Icon name="download" size={16} />
            </span>
            <span className="meta">
              <span className="name" style={{ color: 'var(--ink)' }}>Written answers</span>
              <span className="preview" style={{ display: 'block' }}>.docx</span>
            </span>
          </a>
          <a className="nav-item" href="files/RevOps_Take-Home_Piyush_Jain_workings.xlsx" download>
            <span className="avatar" style={{ background: '#0d2b4d' }}>
              <Icon name="download" size={16} />
            </span>
            <span className="meta">
              <span className="name" style={{ color: 'var(--ink)' }}>Workings + calculations</span>
              <span className="preview" style={{ display: 'block' }}>.xlsx · 18 tabs</span>
            </span>
          </a>
        </div>
        <div className="nav-foot">
          <button className="btn sm" onClick={() => window.print()}>
            <Icon name="print" size={16} /> Print section
          </button>
        </div>
      </nav>

      <main className="main">
        <header className="topbar">
          <button className="btn ghost sm menu-btn" onClick={() => setNavOpen(true)} aria-label="Open sections">
            <Icon name="menu" />
          </button>
          <div className="crumb">
            <span className="avatar" style={{ background: meta.color }}>
              {meta.num}
            </span>
            <div style={{ minWidth: 0 }}>
              <div className="crumb-title">{meta.id === 'overview' ? 'Superchat · RevOps take-home' : `Section ${meta.num} · ${meta.title}`}</div>
              <div className="crumb-sub">
                <span className="online-dot" /> Piyush Jain · RevOps Engineer candidate
              </div>
            </div>
          </div>
          {next && (
            <button className="btn sm primary" onClick={() => go(next.id)}>
              Next <Icon name="arrowR" size={16} />
            </button>
          )}
        </header>

        <div className="content">
          {pages[current]}

          <div className="page-footer">
            {prev ? (
              <button className="btn" onClick={() => go(prev.id)}>
                <Icon name="arrowL" size={16} /> {prev.id === 'overview' ? 'Overview' : `${prev.num}. ${prev.title}`}
              </button>
            ) : (
              <span />
            )}
            {next && (
              <button className="btn primary" onClick={() => go(next.id)}>
                {next.num}. {next.title} <Icon name="arrowR" size={16} />
              </button>
            )}
          </div>
          <p className="tiny muted" style={{ marginTop: 32, textAlign: 'center' }}>
            Take-home submission by Piyush Jain for the Superchat RevOps Engineer role. Not an official Superchat product.
          </p>
        </div>
      </main>
    </div>
  );
}
