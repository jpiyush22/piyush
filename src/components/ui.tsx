import type { ReactNode } from 'react';

/* ───────────── Icons (inline, stroke-based, 20px grid) ───────────── */

const paths: Record<string, ReactNode> = {
  home: <path d="M3 9.5 10 4l7 5.5V16a1 1 0 0 1-1 1h-3.5v-4.5h-5V17H4a1 1 0 0 1-1-1V9.5Z" />,
  funnel: <path d="M3 4h14l-5.2 6.5V15l-3.6 1.8v-6.3L3 4Z" />,
  search: (
    <>
      <circle cx="9" cy="9" r="5" />
      <path d="m13 13 4 4" />
    </>
  ),
  flag: <path d="M5 17V3.5m0 0h9l-2 3.5 2 3.5H5" />,
  layers: (
    <>
      <path d="m10 3 7 3.5-7 3.5-7-3.5L10 3Z" />
      <path d="m3 10 7 3.5 7-3.5M3 13.5 10 17l7-3.5" />
    </>
  ),
  db: (
    <>
      <ellipse cx="10" cy="5" rx="6" ry="2.2" />
      <path d="M4 5v10c0 1.2 2.7 2.2 6 2.2s6-1 6-2.2V5M4 10c0 1.2 2.7 2.2 6 2.2s6-1 6-2.2" />
    </>
  ),
  bolt: <path d="M11 2 4 11h5l-1 7 7-9h-5l1-7Z" />,
  desk: (
    <>
      <rect x="3" y="4" width="14" height="12" rx="2" />
      <path d="M8 4v12M3 8h5" />
    </>
  ),
  video: (
    <>
      <rect x="2.5" y="5" width="11" height="10" rx="2" />
      <path d="m13.5 9 4-2.5v7l-4-2.5" />
    </>
  ),
  chat: <path d="M4 15.5V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7l-3 2.5Z" />,
  info: (
    <>
      <circle cx="10" cy="10" r="7" />
      <path d="M10 9v4.5M10 6.5v.01" />
    </>
  ),
  alert: (
    <>
      <path d="M10 3 2.5 16h15L10 3Z" />
      <path d="M10 8v3.5M10 13.8v.01" />
    </>
  ),
  check: <path d="m4.5 10.5 3.5 3.5 7.5-8" />,
  x: <path d="m5 5 10 10M15 5 5 15" />,
  arrowR: <path d="M4 10h12m-4.5-4.5L16 10l-4.5 4.5" />,
  arrowL: <path d="M16 10H4m4.5-4.5L4 10l4.5 4.5" />,
  menu: <path d="M3 5.5h14M3 10h14M3 14.5h14" />,
  sun: (
    <>
      <circle cx="10" cy="10" r="3.5" />
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.3 4.3l1.4 1.4M14.3 14.3l1.4 1.4M4.3 15.7l1.4-1.4M14.3 5.7l1.4-1.4" />
    </>
  ),
  moon: <path d="M16 12.5A6.5 6.5 0 0 1 7.5 4a6.5 6.5 0 1 0 8.5 8.5Z" />,
  download: <path d="M10 3v10m-4-4 4 4 4-4M4 16h12" />,
  print: (
    <>
      <path d="M6 7V3h8v4M6 14H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-2" />
      <rect x="6" y="11" width="8" height="6" rx="1" />
    </>
  ),
  clock: (
    <>
      <circle cx="10" cy="10" r="7" />
      <path d="M10 6v4l2.5 2" />
    </>
  ),
  sparkle: <path d="M10 2.5 11.6 8.4 17.5 10l-5.9 1.6L10 17.5l-1.6-5.9L2.5 10l5.9-1.6L10 2.5Z" />,
  shield: <path d="M10 2.5 4 5v4.5c0 4 2.6 6.6 6 8 3.4-1.4 6-4 6-8V5l-6-2.5Z" />,
};

export function Icon({ name, size = 20, className }: { name: keyof typeof paths | string; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {paths[name]}
    </svg>
  );
}

/** A chat-bubble "S" mark, drawn in the spirit of the Superchat logo. */
export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-label="Superchat" role="img">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3b5bfd" />
          <stop offset="1" stopColor="#a35bff" />
        </linearGradient>
      </defs>
      <path d="M20 3C10.6 3 3 10.2 3 19.2c0 3.3 1 6.3 2.8 8.9L4 36l8.4-2.6c2.3 1.1 4.9 1.7 7.6 1.7 9.4 0 17-7.2 17-16.1S29.4 3 20 3Z" fill="url(#lg)" />
      <path
        d="M24.6 14.2c-.9-1.4-2.6-2.2-4.6-2.2-2.9 0-4.9 1.6-4.9 3.8 0 4.9 9.9 3 9.9 7.6 0 2.2-2.1 3.8-5 3.8-2.2 0-4-.9-5-2.5"
        fill="none"
        stroke="#fff"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ───────────── Primitives ───────────── */

export type Tone = 'brand' | 'risk' | 'watch' | 'ok' | 'unknown' | 'outline' | undefined;

export function Pill({ tone, children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`pill ${tone ?? ''}`}>{children}</span>;
}

export function Stat({ label, value, note, accent }: { label: string; value: ReactNode; note?: ReactNode; accent?: boolean }) {
  return (
    <div className={`stat ${accent ? 'accent' : ''}`}>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {note && <div className="note">{note}</div>}
    </div>
  );
}

export function Callout({ tone, title, children }: { tone?: 'warn' | 'danger' | 'ok'; title?: string; children: ReactNode }) {
  const icon = tone === 'warn' || tone === 'danger' ? 'alert' : tone === 'ok' ? 'check' : 'info';
  return (
    <div className={`callout ${tone ?? ''}`}>
      <span className="ico">
        <Icon name={icon} size={18} />
      </span>
      <div>
        {title && <strong>{title} </strong>}
        {children}
      </div>
    </div>
  );
}

export function Card({ title, right, children, className }: { title?: ReactNode; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`card ${className ?? ''}`}>
      {(title || right) && (
        <div className="card-title">
          {typeof title === 'string' ? <h3>{title}</h3> : title}
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

export function BlockTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="block-title">
      <h2>{children}</h2>
      {right}
    </div>
  );
}

export function DataTable({
  head,
  rows,
  num = [],
}: {
  head: ReactNode[];
  rows: ReactNode[][];
  /** Column indexes to right-align as numbers. */
  num?: number[];
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={i} className={num.includes(i) ? 'num' : undefined}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri}>
              {r.map((c, ci) => (
                <td key={ci} className={num.includes(ci) ? 'num' : undefined}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function KV({ items }: { items: [ReactNode, ReactNode][] }) {
  return (
    <dl className="kv">
      {items.map(([k, v], i) => (
        <div key={i} style={{ display: 'contents' }}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * One question from the Superchat brief rendered as an inbound chat message,
 * followed by Piyush's answer. This mirrors the Superchat inbox: the brief
 * "messages" you, and you reply.
 */
export function QA({ num, question, summary, children }: { num: string; question: ReactNode; summary?: ReactNode; children: ReactNode }) {
  return (
    <section className="qa" id={`q-${num.replace(/\W+/g, '-').toLowerCase()}`}>
      <div className="qa-head">
        <span className="qa-num">{num}</span>
      </div>
      <div className="thread">
        <div className="msg in">
          <div className="who">SC</div>
          <div className="bubble">
            <div className="meta">Superchat · brief</div>
            {question}
          </div>
        </div>
        {summary && (
          <div className="msg out">
            <div className="who">PJ</div>
            <div className="bubble">
              <div className="meta">Piyush · short answer</div>
              {summary}
            </div>
          </div>
        )}
      </div>
      <div className="qa-body">{children}</div>
    </section>
  );
}

export function Answer({ children, label = 'Full answer' }: { children: ReactNode; label?: string }) {
  return (
    <div className="answer">
      <div className="answer-head">
        <span className="who">PJ</span>
        <span className="name">{label}</span>
      </div>
      {children}
    </div>
  );
}

export function SectionHero({
  eyebrow,
  title,
  lede,
  tags,
}: {
  eyebrow: string;
  title: string;
  lede: ReactNode;
  tags?: ReactNode;
}) {
  return (
    <header className="sec-hero">
      <div className="eyebrow">{eyebrow}</div>
      <h1>{title}</h1>
      <div className="lede">{lede}</div>
      {tags && <div className="row-wrap">{tags}</div>}
    </header>
  );
}

export const pct = (n: number, d: number, digits = 1) => `${((n / d) * 100).toFixed(digits)}%`;
export const fmt = (n: number) => n.toLocaleString('en-US');
