import { useMemo, useState } from 'react';
import { Icon, Pill } from '../components/ui';

/** All records here are mock data for the prototype, not Superchat accounts. */
type Status = 'AT RISK' | 'WATCH' | 'UNKNOWN' | 'RECOVERED';
type Motion = 'SSF' | 'Sales-led';
type Decision = 'CONFIRMED' | 'FALSE_POSITIVE' | 'SNOOZED' | 'DATA_ISSUE';

interface Ws {
  id: string;
  name: string;
  motion: Motion;
  status: Status;
  reasonCode: string;
  headline: string;
  owner: string;
  evidence: { v: string; d: string; bad?: boolean }[];
  confidence: 'VERIFIED' | 'LOW' | 'UNKNOWN';
  freshnessH: number;
  billing: 'active' | 'cancelled';
  optOut: boolean;
  lastContactDays: number | null;
}

const WORKSPACES: Ws[] = [
  {
    id: 'WS-1042',
    name: 'Demo SSF workspace',
    motion: 'SSF',
    status: 'AT RISK',
    reasonCode: 'NO_VERIFIED_RUN_14D+MSG_DECLINE',
    headline: 'No verified run · msgs −34%',
    owner: 'Lifecycle',
    evidence: [
      { v: '17d since verified run', d: 'Successful execution evidence', bad: true },
      { v: 'Messages −34%', d: '14d compared with prior 14d', bad: true },
      { v: '3 workflows · 1 agent', d: 'Depth setup (creation ≠ use)' },
      { v: 'Pro · 42 seats', d: 'Chargebee, live' },
    ],
    confidence: 'VERIFIED',
    freshnessH: 6,
    billing: 'active',
    optOut: false,
    lastContactDays: null,
  },
  {
    id: 'WS-0881',
    name: 'Demo Sales-led workspace',
    motion: 'Sales-led',
    status: 'WATCH',
    reasonCode: 'REPEATED_WORKFLOW_FAILURES',
    headline: 'Verified workflow failures',
    owner: 'CSx-1',
    evidence: [
      { v: '9 failed runs / 7d', d: 'error_category = channel_auth', bad: true },
      { v: 'Messages +2%', d: '14d vs prior 14d' },
      { v: 'Last CSx call 24d ago', d: 'HubSpot' },
      { v: 'Business · 35 seats', d: 'Chargebee, live' },
    ],
    confidence: 'VERIFIED',
    freshnessH: 6,
    billing: 'active',
    optOut: false,
    lastContactDays: 24,
  },
  {
    id: 'WS-1135',
    name: 'Demo SSF workspace',
    motion: 'SSF',
    status: 'AT RISK',
    reasonCode: 'MSG_DECLINE+NO_VERIFIED_RUN',
    headline: 'Messaging down · no run',
    owner: 'Lifecycle',
    evidence: [
      { v: '21d since verified run', d: 'Successful execution evidence', bad: true },
      { v: 'Messages −41%', d: '14d vs prior 14d', bad: true },
      { v: 'Opted out of lifecycle email', d: 'HubSpot consent' },
      { v: 'Pro · 11 seats', d: 'Chargebee, live' },
    ],
    confidence: 'VERIFIED',
    freshnessH: 6,
    billing: 'active',
    optOut: true,
    lastContactDays: null,
  },
  {
    id: 'WS-1162',
    name: 'Demo Sales-led workspace',
    motion: 'Sales-led',
    status: 'WATCH',
    reasonCode: 'DEPTH_SETUP_GAP',
    headline: 'Depth feature setup gap',
    owner: 'CSx-2',
    evidence: [
      { v: '1 template · 0 workflows', d: 'Day 45 after onboarding', bad: true },
      { v: 'Messages steady', d: 'Not proof of health' },
      { v: 'Onboarding call flagged workflows', d: 'CSx note (context only)' },
      { v: 'Business · 18 seats', d: 'Renewal in 41d' },
    ],
    confidence: 'VERIFIED',
    freshnessH: 6,
    billing: 'active',
    optOut: false,
    lastContactDays: 9,
  },
  {
    id: 'WS-1188',
    name: 'Demo SSF workspace',
    motion: 'SSF',
    status: 'WATCH',
    reasonCode: 'NO_VERIFIED_RUN_14D',
    headline: 'No verified run · cancelled yesterday',
    owner: 'Lifecycle',
    evidence: [
      { v: '15d since verified run', d: 'Successful execution evidence', bad: true },
      { v: 'Subscription cancelled', d: 'Chargebee live check', bad: true },
      { v: 'Messages −5%', d: '14d vs prior 14d' },
      { v: 'Starter · 4 seats', d: 'Chargebee' },
    ],
    confidence: 'VERIFIED',
    freshnessH: 6,
    billing: 'cancelled',
    optOut: false,
    lastContactDays: null,
  },
  { id: 'WS-1201', name: 'Demo SSF workspace', motion: 'SSF', status: 'UNKNOWN', reasonCode: 'EXECUTION_EVENTS_MISSING', headline: 'Execution telemetry missing', owner: 'RevOps', evidence: [{ v: 'No execution events', d: 'UNKNOWN, not zero use' }], confidence: 'UNKNOWN', freshnessH: 6, billing: 'active', optOut: false, lastContactDays: null },
  { id: 'WS-1210', name: 'Demo Sales-led workspace', motion: 'Sales-led', status: 'UNKNOWN', reasonCode: 'SOURCE_STALE', headline: 'HubSpot source 31h stale', owner: 'RevOps', evidence: [{ v: 'Source 31h old', d: 'Past freshness window' }], confidence: 'UNKNOWN', freshnessH: 31, billing: 'active', optOut: false, lastContactDays: null },
  { id: 'WS-1215', name: 'Demo SSF workspace', motion: 'SSF', status: 'UNKNOWN', reasonCode: 'EDIT_ORIGIN_UNKNOWN', headline: 'workflow_edited actor unknown', owner: 'RevOps', evidence: [{ v: 'Edit spike', d: 'Actor/origin missing' }], confidence: 'UNKNOWN', freshnessH: 6, billing: 'active', optOut: false, lastContactDays: null },
  { id: 'WS-0974', name: 'Demo SSF workspace', motion: 'SSF', status: 'RECOVERED', reasonCode: 'SUSTAINED_VERIFIED_RUNS', headline: 'Verified runs resumed 12d', owner: 'Lifecycle', evidence: [{ v: '12d of verified runs', d: 'Task closed' }], confidence: 'VERIFIED', freshnessH: 6, billing: 'active', optOut: false, lastContactDays: 18 },
  { id: 'WS-0912', name: 'Demo Sales-led workspace', motion: 'Sales-led', status: 'RECOVERED', reasonCode: 'FAILURES_RESOLVED', headline: 'Failures resolved after CSx call', owner: 'CSx-1', evidence: [{ v: '0 failures / 14d', d: 'Task closed' }], confidence: 'VERIFIED', freshnessH: 6, billing: 'active', optOut: false, lastContactDays: 20 },
];

const FP_REASONS = ['Wrong association', 'Missing execution events', 'Misleading system edit', 'Customer seasonal / expected', 'Other'];
const FRESHNESS_WINDOW_H = 26;
const COOLDOWN_DAYS = 14;

type Tab = 'review' | 'quality' | 'recovered' | 'audit';

interface LogLine {
  t: string;
  kind: 'ok' | 'bad' | 'dim';
  text: string;
}

function cooldownWindow(d = new Date()) {
  const start = Date.UTC(2026, 0, 1);
  const n = Math.floor((d.getTime() - start) / (COOLDOWN_DAYS * 86400000));
  return `cw${n}`;
}

export default function SignalDesk() {
  const [tab, setTab] = useState<Tab>('review');
  const [risk, setRisk] = useState<'ALL' | 'AT RISK' | 'WATCH'>('ALL');
  const [motion, setMotion] = useState<'ALL' | Motion>('ALL');
  const [selId, setSelId] = useState('WS-1042');
  const [reviews, setReviews] = useState<Record<string, { decision: Decision; reason?: string; until?: string }>>({});
  const [decision, setDecision] = useState<Decision | null>(null);
  const [fpReason, setFpReason] = useState('');
  const [snoozeReason, setSnoozeReason] = useState('');
  const [snoozeUntil, setSnoozeUntil] = useState('');
  const [tried, setTried] = useState(false);
  const [ledger, setLedger] = useState<Set<string>>(new Set());
  const [log, setLog] = useState<LogLine[]>([{ t: '06:00', kind: 'dim', text: 'workspace_risk_daily v0.3 scored · Hightouch synced 5 changed Workspaces' }]);
  const [aiDraft, setAiDraft] = useState<string | null>(null);

  const list = useMemo(() => {
    const byTab = WORKSPACES.filter((w) =>
      tab === 'review' ? w.status === 'AT RISK' || w.status === 'WATCH' : tab === 'quality' ? w.status === 'UNKNOWN' : tab === 'recovered' ? w.status === 'RECOVERED' : false,
    );
    return byTab.filter((w) => (risk === 'ALL' || tab !== 'review' || w.status === risk) && (motion === 'ALL' || w.motion === motion));
  }, [tab, risk, motion]);

  const ws = WORKSPACES.find((w) => w.id === selId) ?? list[0];
  const review = ws ? reviews[ws.id] : undefined;
  const counts = {
    review: WORKSPACES.filter((w) => w.status === 'AT RISK' || w.status === 'WATCH').length,
    quality: WORKSPACES.filter((w) => w.status === 'UNKNOWN').length,
    recovered: WORKSPACES.filter((w) => w.status === 'RECOVERED').length,
  };

  const now = () => new Date().toTimeString().slice(0, 5);
  const push = (kind: LogLine['kind'], text: string) => setLog((l) => [{ t: now(), kind, text }, ...l]);

  const select = (id: string) => {
    setSelId(id);
    const r = reviews[id];
    setDecision(r?.decision ?? null);
    setFpReason(r?.decision === 'FALSE_POSITIVE' ? r.reason ?? '' : '');
    setSnoozeReason(r?.decision === 'SNOOZED' ? r.reason ?? '' : '');
    setSnoozeUntil(r?.until ?? '');
    setTried(false);
    setAiDraft(null);
  };

  const errors = {
    decision: !decision ? 'Choose a decision' : '',
    fp: decision === 'FALSE_POSITIVE' && !fpReason ? 'A reason is required for a false positive' : '',
    snoozeReason: decision === 'SNOOZED' && !snoozeReason.trim() ? 'Reason required' : '',
    snoozeUntil: decision === 'SNOOZED' && !snoozeUntil ? 'Expiry required' : '',
  };
  const valid = !Object.values(errors).some(Boolean);

  const saveReview = () => {
    setTried(true);
    if (!ws || !valid || !decision) return;
    const reason = decision === 'FALSE_POSITIVE' ? fpReason : decision === 'SNOOZED' ? snoozeReason : undefined;
    const prev = reviews[ws.id]?.decision ?? 'NONE';
    setReviews((r) => ({ ...r, [ws.id]: { decision, reason, until: decision === 'SNOOZED' ? snoozeUntil : undefined } }));
    push('ok', `review ${ws.id}: ${prev} → ${decision}${reason ? ` (reason: ${reason})` : ''}${decision === 'SNOOZED' ? ` until ${snoozeUntil}` : ''} · model v0.3 score unchanged`);
    if (decision === 'DATA_ISSUE') push('dim', `QA case opened for ${ws.id}; customer-facing action blocked`);
    if (decision === 'FALSE_POSITIVE') push('dim', `${ws.id} queued for RevOps false-positive review`);
  };

  const checks = ws
    ? [
        { label: 'Reviewer confirmed risk', ok: review?.decision === 'CONFIRMED' },
        { label: 'Chargebee: subscription active (live)', ok: ws.billing === 'active' },
        { label: `Score fresh (< ${FRESHNESS_WINDOW_H}h)`, ok: ws.freshnessH < FRESHNESS_WINDOW_H },
        { label: 'Evidence confidence verified', ok: ws.confidence === 'VERIFIED' },
        { label: ws.motion === 'SSF' ? 'Not opted out of lifecycle' : `Owner assigned (${ws.owner})`, ok: ws.motion === 'SSF' ? !ws.optOut : !!ws.owner },
        { label: `No contact in last ${COOLDOWN_DAYS}d`, ok: ws.lastContactDays === null || ws.lastContactDays >= COOLDOWN_DAYS },
      ]
    : [];
  const eligible = checks.every((c) => c.ok);
  const actionType = ws?.motion === 'SSF' ? 'ssf_nudge' : 'csx_task';
  const actionKey = ws ? `${ws.id}:${ws.reasonCode}:${actionType}:${cooldownWindow()}` : '';

  const dispatch = () => {
    if (!ws) return;
    const failed = checks.filter((c) => !c.ok);
    if (failed.length) {
      push('bad', `blocked ${ws.id}: ${failed.map((f) => f.label).join('; ')}`);
      return;
    }
    if (ledger.has(actionKey)) {
      push('bad', `duplicate suppressed · action_key already claimed: ${actionKey}`);
      return;
    }
    setLedger((s) => new Set(s).add(actionKey));
    const remote = ws.motion === 'SSF' ? `msg_${Math.floor(Math.random() * 90000 + 10000)}` : `task_${Math.floor(Math.random() * 90000 + 10000)}`;
    push('ok', `claimed ${actionKey} → dispatched via Make/n8n · remote id ${remote}`);
  };

  const draftSummary = () => {
    if (!ws) return;
    const facts = ws.evidence.map((e) => e.v).join('; ');
    setAiDraft(
      `${ws.id} (${ws.motion}) is ${ws.status} for ${ws.reasonCode.replace(/_/g, ' ').toLowerCase()}. Evidence: ${facts}. Suggested playbook: ${ws.motion === 'SSF' ? 'feature-specific onboarding step' : 'CSx workflow review call'}.`,
    );
  };

  return (
    <div className="desk">
      <div className="desk-top">
        <div className="brand">
          <span style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--brand)', display: 'grid', placeItems: 'center' }}>
            <Icon name="desk" size={18} />
          </span>
          <span>Signal Desk</span>
          <span className="pill" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}>
            prototype · mock data
          </span>
        </div>
        <div className="desk-tabs" role="group" aria-label="Queues">
          {(
            [
              ['review', `Needs review (${counts.review})`],
              ['quality', `Data quality (${counts.quality})`],
              ['recovered', `Recovered (${counts.recovered})`],
              ['audit', `Audit log (${log.length})`],
            ] as [Tab, string][]
          ).map(([t, l]) => (
            <button
              key={t}
              aria-pressed={tab === t}
              onClick={() => {
                setTab(t);
                const first = WORKSPACES.find((w) =>
                  t === 'review' ? w.status === 'AT RISK' || w.status === 'WATCH' : t === 'quality' ? w.status === 'UNKNOWN' : t === 'recovered' ? w.status === 'RECOVERED' : false,
                );
                if (first) select(first.id);
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {tab === 'audit' ? (
        <div style={{ padding: 20 }}>
          <p className="small muted" style={{ marginTop: 0 }}>
            Every decision records reviewer, previous/new state, reason, model version, action key, dispatch state and remote ID. Corrections append; nothing is deleted.
          </p>
          <div className="log" style={{ maxHeight: 460 }}>
            {log.map((l, i) => (
              <div key={i}>
                <span className="dim">{l.t}</span> <span className={l.kind}>{l.text}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="desk-body">
          <div className="desk-list">
            <div className="desk-filters">
              {tab === 'review' && (
                <div className="seg" role="group" aria-label="Risk filter">
                  {(['ALL', 'AT RISK', 'WATCH'] as const).map((r) => (
                    <button key={r} aria-pressed={risk === r} onClick={() => setRisk(r)}>
                      {r === 'ALL' ? 'All' : r}
                    </button>
                  ))}
                </div>
              )}
              <div className="seg" role="group" aria-label="Motion filter">
                {(['ALL', 'SSF', 'Sales-led'] as const).map((m) => (
                  <button key={m} aria-pressed={motion === m} onClick={() => setMotion(m)}>
                    {m === 'ALL' ? 'Both' : m}
                  </button>
                ))}
              </div>
            </div>
            {list.length === 0 && <p className="small muted" style={{ padding: 16 }}>Nothing matches these filters.</p>}
            {list.map((w) => {
              const tone = w.status === 'AT RISK' ? 'risk' : w.status === 'WATCH' ? 'watch' : w.status === 'UNKNOWN' ? 'unknown' : 'ok';
              const r = reviews[w.id];
              return (
                <button key={w.id} className="desk-row" aria-current={ws?.id === w.id} onClick={() => select(w.id)}>
                  <span className="avatar" style={{ background: `var(--${tone}-soft)`, color: `var(--${tone})` }}>
                    {w.motion === 'SSF' ? 'SSF' : 'SL'}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <strong className="small">
                        {w.id} · {w.name}
                      </strong>
                      <Pill tone={tone}>{w.status}</Pill>
                    </span>
                    <span className="tiny muted" style={{ display: 'block' }}>
                      {w.headline}
                    </span>
                    <span className="tiny muted">
                      {w.owner} · {w.freshnessH}h ago {r && <Pill tone="brand">{r.decision.replace('_', ' ').toLowerCase()}</Pill>}
                    </span>
                  </span>
                </button>
              );
            })}
            <div style={{ padding: 14 }} className="tiny muted">
              {tab === 'review'
                ? 'Needs review holds only evidence-backed AT RISK and WATCH. UNKNOWN and RECOVERED have their own views.'
                : tab === 'quality'
                  ? 'Missing executions, stale sources and suspect event origin. No customer action from here.'
                  : 'Read-only history. No active task.'}
            </div>
          </div>

          {ws && (
            <div className="desk-detail">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ fontSize: 18 }}>
                    {ws.id} · {ws.name}
                  </h3>
                  <div className="tiny muted">
                    {ws.motion} · Billing {ws.billing} · Model v0.3 · As-of 06:00 · Owner {ws.owner}
                  </div>
                </div>
                <Pill tone={ws.status === 'AT RISK' ? 'risk' : ws.status === 'WATCH' ? 'watch' : ws.status === 'UNKNOWN' ? 'unknown' : 'ok'}>{ws.status}</Pill>
              </div>

              <div>
                <div className="eyebrow" style={{ marginBottom: 8 }}>
                  Why flagged · <code>{ws.reasonCode}</code>
                </div>
                <div className="evidence">
                  {ws.evidence.map((e) => (
                    <div key={e.v} className={`ev ${e.bad ? 'bad' : ''}`}>
                      <div className="v">{e.v}</div>
                      <div className="d">{e.d}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="row-wrap small">
                <strong>Data confidence</strong>
                <Pill tone={ws.confidence === 'VERIFIED' ? 'ok' : 'unknown'}>{ws.confidence}</Pill>
                <span className="muted">
                  Freshness {ws.freshnessH}h · source IDs available · <a href="#s7" onClick={(e) => e.preventDefault()}>drill down</a>
                </span>
              </div>

              {ws.status === 'RECOVERED' ? (
                <div className="callout ok">
                  <span className="ico">
                    <Icon name="check" size={18} />
                  </span>
                  <div>Recovered workspaces are read-only history. Sustained confirmed activity closed the related task.</div>
                </div>
              ) : (
                <>
                  <div>
                    <div className="eyebrow" style={{ marginBottom: 8 }}>
                      Reviewer decision
                    </div>
                    <div className="decisions" role="group" aria-label="Reviewer decision">
                      {(
                        ws.status === 'UNKNOWN'
                          ? ([['DATA_ISSUE', 'Data issue'], ['FALSE_POSITIVE', 'False positive']] as [Decision, string][])
                          : ([
                              ['CONFIRMED', 'Confirm risk'],
                              ['FALSE_POSITIVE', 'False positive'],
                              ['SNOOZED', 'Snooze'],
                              ['DATA_ISSUE', 'Data issue'],
                            ] as [Decision, string][])
                      ).map(([d, l]) => (
                        <button key={d} aria-pressed={decision === d} onClick={() => setDecision(d)}>
                          {l}
                        </button>
                      ))}
                    </div>
                    {tried && errors.decision && <div className="field"><span className="err">{errors.decision}</span></div>}
                  </div>

                  {decision === 'FALSE_POSITIVE' && (
                    <label className="field">
                      False-positive reason (required)
                      <select value={fpReason} onChange={(e) => setFpReason(e.target.value)}>
                        <option value="">Select a reason…</option>
                        {FP_REASONS.map((r) => (
                          <option key={r}>{r}</option>
                        ))}
                      </select>
                      {tried && errors.fp && <span className="err">{errors.fp}</span>}
                    </label>
                  )}
                  {decision === 'SNOOZED' && (
                    <div className="grid c2" style={{ gap: 10 }}>
                      <label className="field">
                        Snooze reason (required)
                        <input value={snoozeReason} onChange={(e) => setSnoozeReason(e.target.value)} placeholder="e.g. CSx call booked" />
                        {tried && errors.snoozeReason && <span className="err">{errors.snoozeReason}</span>}
                      </label>
                      <label className="field">
                        Snooze until (required)
                        <input type="date" value={snoozeUntil} onChange={(e) => setSnoozeUntil(e.target.value)} />
                        {tried && errors.snoozeUntil && <span className="err">{errors.snoozeUntil}</span>}
                      </label>
                    </div>
                  )}
                  {decision === 'DATA_ISSUE' && <div className="callout warn"><span className="ico"><Icon name="alert" size={18} /></span><div>Opens a separate QA case and blocks outreach. The computed score is not overwritten.</div></div>}

                  <div className="row-wrap">
                    <button className="btn" onClick={saveReview}>
                      Save review + reason
                    </button>
                    {review && <span className="tiny muted">Saved: {review.decision.replace('_', ' ').toLowerCase()}</span>}
                  </div>

                  {ws.status !== 'UNKNOWN' && (
                    <div className="card" style={{ background: 'var(--surface-2)', padding: 16 }}>
                      <div className="eyebrow" style={{ marginBottom: 8 }}>
                        Approved next step · live eligibility
                      </div>
                      <div className="stack" style={{ gap: 4 }}>
                        {checks.map((c) => (
                          <div key={c.label} className="small" style={{ display: 'flex', gap: 8, alignItems: 'center', color: c.ok ? 'var(--ok)' : 'var(--risk)' }}>
                            <Icon name={c.ok ? 'check' : 'x'} size={16} />
                            <span style={{ color: 'var(--ink-2)' }}>{c.label}</span>
                          </div>
                        ))}
                      </div>
                      <div className="tiny muted" style={{ margin: '10px 0' }}>
                        action_key <code>{actionKey}</code>
                      </div>
                      <div className="row-wrap">
                        <button className="btn primary" onClick={dispatch} disabled={!review || review.decision !== 'CONFIRMED'}>
                          {ws.motion === 'SSF' ? 'Approve SSF nudge' : 'Create / update CSx task'}
                        </button>
                        <button className="btn ghost sm" onClick={draftSummary}>
                          <Icon name="sparkle" size={16} /> Draft evidence summary
                        </button>
                      </div>
                      {!eligible && review?.decision === 'CONFIRMED' && <p className="tiny" style={{ color: 'var(--risk)', marginTop: 8 }}>Not eligible right now. Dispatch will be blocked and logged.</p>}
                      {aiDraft && (
                        <div className="callout" style={{ marginTop: 10 }}>
                          <span className="ico">
                            <Icon name="sparkle" size={18} />
                          </span>
                          <div className="small">
                            <Pill tone="unknown">AI draft · check before use</Pill>
                            <p style={{ marginTop: 6 }}>{aiDraft}</p>
                            <span className="tiny muted">Built only from the structured evidence above. It cannot set risk, pick who to contact, or send anything.</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              <div>
                <div className="eyebrow" style={{ marginBottom: 6 }}>
                  Latest activity
                </div>
                <div className="log">
                  {log.slice(0, 6).map((l, i) => (
                    <div key={i}>
                      <span className="dim">{l.t}</span> <span className={l.kind}>{l.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
