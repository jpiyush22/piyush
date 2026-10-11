import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon, Pill, Prov } from '../components/ui';
import { APPROVED_SSF_TEMPLATES, type ActionType, type CheckResult, type LedgerStatus, type ReviewDecisionKind } from '../domain/actions';
import { RULES, type RiskState } from '../domain/risk';
import { useApp, type DeskRow } from '../state/store';
import { RiskResultCard } from './S2Leak';

type Tab = 'review' | 'quality' | 'recovered' | 'decisions' | 'ledger' | 'outcomes';

const TONE: Record<RiskState, 'risk' | 'watch' | 'unknown' | 'ok' | 'outline'> = {
  'AT RISK': 'risk',
  WATCH: 'watch',
  UNKNOWN: 'unknown',
  RECOVERED: 'ok',
  HEALTHY: 'ok',
  EXCLUDED: 'outline',
};
const STATUS_TONE: Record<LedgerStatus, 'ok' | 'risk' | 'watch' | 'brand' | 'outline' | 'unknown'> = {
  pending: 'watch',
  approved: 'brand',
  suppressed: 'unknown',
  dispatched: 'ok',
  failed: 'risk',
  reconciled: 'ok',
};
const FP_REASONS = ['Wrong association', 'Missing execution events', 'Misleading system edit', 'Customer seasonal / expected', 'Other'];

const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

function Detail({ row, reviewer }: { row: DeskRow; reviewer: string }) {
  const { recordReview, checksFor, requestAction, requestConcurrent, setNextOutcome, actions, ledgerVersion, semanticHold, logReviewTime, today } = useApp();
  const { snapshot: s, risk, latest } = row;
  const [decision, setDecision] = useState<ReviewDecisionKind | null>(null);
  const [reason, setReason] = useState('');
  const [until, setUntil] = useState('');
  const [tried, setTried] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [templateId, setTemplateId] = useState(APPROVED_SSF_TEMPLATES.find((t) => t.forReasons.includes(risk.primaryReason))?.id ?? '');
  const [checks, setChecks] = useState<CheckResult[] | null>(null);
  const [lastOutcome, setLastOutcome] = useState<string | null>(null);
  const [aiDraft, setAiDraft] = useState<string | null>(null);
  const opened = useRef(Date.now());
  const actionType: ActionType = s.motion === 'SSF' ? 'ssf_nudge' : 'csx_task';
  const reviewable = risk.queue === 'needs_review';

  useEffect(() => {
    let live = true;
    if (reviewable) checksFor(s.workspaceId, actionType, templateId).then((c) => live && setChecks(c));
    return () => {
      live = false;
    };
  }, [s.workspaceId, latest?.id, templateId, ledgerVersion, semanticHold]);

  const errors = {
    decision: !decision ? 'Choose a decision' : '',
    reason: (decision === 'FALSE_POSITIVE' || decision === 'SNOOZED' || decision === 'DATA_ISSUE') && !reason.trim() ? 'A reason is required' : '',
    until: decision === 'SNOOZED' && !until ? 'An expiry date is required' : '',
  };
  const valid = !Object.values(errors).some(Boolean);

  const save = () => {
    setTried(true);
    if (!valid || !decision) return;
    recordReview({ workspaceId: s.workspaceId, decision, reason: reason.trim() || undefined, until: until || undefined, reviewer });
    logReviewTime(s.workspaceId, Date.now() - opened.current);
    setSaved(decision);
    setTried(false);
  };

  const keyEntries = actions.all().filter((e) => e.workspaceId === s.workspaceId);
  const pending = keyEntries.filter((e) => e.status === 'pending');
  const failing = checks?.filter((c) => !c.ok) ?? [];

  return (
    <div className="desk-detail" data-testid="desk-detail">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ fontSize: 20 }}>
            {s.workspaceId} · {s.name}
          </h3>
          <div className="tiny muted">
            {s.motion} · {s.billing.plan} · {s.billing.seats} seats · Owner {s.owner ?? '—'} · Model {risk.modelVersion} · As-of day {risk.asOfDay} · Source {s.sourceFreshnessHours}h old
          </div>
        </div>
        <div className="row-wrap">
          <Pill tone={TONE[risk.state]}>{risk.state}</Pill>
          <Pill tone={risk.confidence === 'HIGH' ? 'ok' : 'unknown'}>{risk.confidence} confidence</Pill>
          <Prov kind="synthetic" />
        </div>
      </div>

      <div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>
          Why flagged · {risk.reasons.map((r) => <code key={r} style={{ marginRight: 4 }}>{r}</code>)}
        </div>
        <div className="evidence">
          {risk.evidence.map((e) => (
            <div key={e.label} className={`ev ${e.supportsRisk ? 'bad' : ''}`}>
              <div className="v">{e.value}</div>
              <div className="d">
                {e.label} · {e.source}
              </div>
            </div>
          ))}
        </div>
        <div className="row-wrap" style={{ marginTop: 8 }}>
          <span className="small">
            Previous interventions: {s.lastContactDay == null ? 'none recorded' : `contact ${today - s.lastContactDay}d ago`} · {keyEntries.filter((e) => e.status === 'dispatched' || e.status === 'reconciled').length} dispatched in this demo
          </span>
          <button className="btn sm ghost" onClick={() => setEvidenceOpen((o) => !o)} aria-expanded={evidenceOpen}>
            {evidenceOpen ? 'Hide' : 'Drill down:'} evidence & explanation
          </button>
        </div>
        {evidenceOpen && <RiskResultCard r={risk} />}
      </div>

      {risk.state === 'RECOVERED' || risk.state === 'HEALTHY' ? (
        <div className="callout ok">
          <span className="ico">
            <Icon name="check" size={18} />
          </span>
          <div>{risk.explanation} Read-only: no active task.</div>
        </div>
      ) : (
        <>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              Reviewer decision {latest && <span className="muted">· latest: {latest.decision.replace('_', ' ').toLowerCase()} by {latest.reviewer}</span>}
            </div>
            <div className="decisions" role="group" aria-label="Reviewer decision">
              {(
                (reviewable
                  ? [
                      ['CONFIRMED', 'Confirm risk'],
                      ['FALSE_POSITIVE', 'False positive'],
                      ['SNOOZED', 'Snooze'],
                      ['DATA_ISSUE', 'Data issue'],
                    ]
                  : [
                      ['DATA_ISSUE', 'Data issue'],
                      ['FALSE_POSITIVE', 'Not a real issue'],
                    ]) as [ReviewDecisionKind, string][]
              ).map(([d, l]) => (
                <button
                  key={d}
                  aria-pressed={decision === d}
                  onClick={() => {
                    setDecision(d);
                    setSaved(null);
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          {(decision === 'FALSE_POSITIVE' || decision === 'DATA_ISSUE') && (
            <label className="field">
              Reason (required)
              {decision === 'FALSE_POSITIVE' ? (
                <select value={reason} onChange={(e) => setReason(e.target.value)} aria-label="False positive reason">
                  <option value="">Select a reason…</option>
                  {FP_REASONS.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              ) : (
                <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. execution events missing since release" aria-label="Data issue reason" />
              )}
              {tried && errors.reason && <span className="err">{errors.reason}</span>}
            </label>
          )}
          {decision === 'SNOOZED' && (
            <div className="grid c2" style={{ gap: 10 }}>
              <label className="field">
                Snooze reason (required)
                <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. CSx call already booked" aria-label="Snooze reason" />
                {tried && errors.reason && <span className="err">{errors.reason}</span>}
              </label>
              <label className="field">
                Snooze until (required)
                <input type="date" value={until} onChange={(e) => setUntil(e.target.value)} aria-label="Snooze until" />
                {tried && errors.until && <span className="err">{errors.until}</span>}
              </label>
            </div>
          )}
          {decision === 'CONFIRMED' && <p className="tiny muted">Confirming records the decision only. It never sends anything by itself.</p>}
          {decision === 'DATA_ISSUE' && <p className="tiny muted">Opens a data-quality case and blocks customer outreach. The computed score is kept as-is.</p>}
          {decision === 'FALSE_POSITIVE' && <p className="tiny muted">The computed state ({risk.state}) is preserved separately; your correction feeds RevOps quality review.</p>}
          <div className="row-wrap">
            <button className="btn" onClick={save} data-testid="save-review">
              Save review + reason
            </button>
            {tried && errors.decision && <span className="tiny" style={{ color: 'var(--risk)' }}>{errors.decision}</span>}
            {saved && (
              <span className="tiny" role="status" style={{ color: 'var(--ok)' }}>
                ✓ Saved: {saved.replace('_', ' ').toLowerCase()} (computed {risk.state} preserved)
              </span>
            )}
          </div>

          {reviewable && (
            <div className="card" style={{ background: 'var(--surface-2)', padding: 16 }} data-testid="action-panel">
              <div className="row-wrap" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                <div className="eyebrow">Approved next step · live pre-action checks</div>
                <Prov kind="simulated" />
              </div>
              {actionType === 'ssf_nudge' && (
                <label className="field" style={{ marginBottom: 8 }}>
                  Approved template
                  <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} aria-label="Approved template">
                    <option value="">Select approved content…</option>
                    {APPROVED_SSF_TEMPLATES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {checks ? (
                <ul className="checklist" data-testid="checks">
                  {checks.map((c) => (
                    <li key={c.id} className={c.ok ? 'ok' : 'bad'}>
                      <span>{c.ok ? '✓' : '✗'}</span> {c.label} <span className="muted tiny">· {c.detail}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="tiny muted">Running live checks…</p>
              )}
              <div className="row-wrap">
                <button
                  className="btn primary"
                  data-testid="dispatch"
                  onClick={async () => setLastOutcome(await requestAction({ workspaceId: s.workspaceId, actionType, templateId, requestedBy: reviewer }))}
                >
                  {actionType === 'ssf_nudge' ? 'Approve SSF nudge' : 'Create CSx task'}
                </button>
                <button
                  className="btn sm"
                  onClick={async () => setLastOutcome((await requestConcurrent({ workspaceId: s.workspaceId, actionType, templateId, requestedBy: reviewer }, 3)).join(' · '))}
                  title="Fires three identical requests at the same time"
                >
                  Simulate 3 concurrent requests
                </button>
                <label className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  Next delivery
                  <select onChange={(e) => setNextOutcome(e.target.value as 'ok' | 'reject' | 'timeout')} value={actions.adapter.nextOutcome} aria-label="Next simulated delivery outcome">
                    <option value="ok">succeeds</option>
                    <option value="reject">is rejected</option>
                    <option value="timeout">times out (uncertain)</option>
                  </select>
                </label>
              </div>
              {failing.length > 0 && <p className="tiny" style={{ color: 'var(--risk)', marginTop: 8 }}>{failing.length} check(s) failing: dispatch will be suppressed and logged, not sent.</p>}
              {lastOutcome && (
                <p className="small" role="status" style={{ marginTop: 8 }} data-testid="last-outcome">
                  Result: <strong>{lastOutcome}</strong>
                </p>
              )}
              {pending.length > 0 && <p className="tiny" style={{ color: 'var(--watch)' }}>{pending.length} pending entry(ies) with an uncertain outcome. Reconcile in the Action ledger before any retry.</p>}
              <button
                className="btn ghost sm"
                style={{ marginTop: 6 }}
                onClick={() =>
                  setAiDraft(
                    `${s.workspaceId} (${s.motion}) is ${risk.state}: ${risk.reasons.map((r) => r.toLowerCase().replace(/_/g, ' ')).join('; ')}. Evidence: ${risk.evidence
                      .filter((e) => e.supportsRisk)
                      .map((e) => `${e.label} ${e.value}`)
                      .join('; ')}.`,
                  )
                }
              >
                <Icon name="sparkle" size={16} /> Draft evidence summary
              </button>
              {aiDraft && (
                <div className="callout" style={{ marginTop: 8 }}>
                  <span className="ico">
                    <Icon name="sparkle" size={18} />
                  </span>
                  <div className="small">
                    <Pill tone="unknown">Draft · template-generated in this demo (no LLM call) · check before use</Pill>
                    <p style={{ marginTop: 6 }}>{aiDraft}</p>
                    <span className="tiny muted">Built only from the structured evidence above. In the mature tool an LLM could phrase this; it could never set risk, choose recipients or send.</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Outcomes() {
  const { state, desk, actions, ledgerVersion, addImprovement } = useApp();
  const [text, setText] = useState('');
  const eligible = desk.filter((d) => d.risk.queue === 'needs_review');
  const reviewed = eligible.filter((d) => d.latest);
  const times = state.reviewTimings.map((t) => t.ms / 1000);
  const med = median(times);
  const entries = useMemo(() => actions.all(), [actions, ledgerVersion]);
  const sent = entries.filter((e) => e.status === 'dispatched' || e.status === 'reconciled');
  const inappropriate = sent.filter((e) => {
    const row = desk.find((d) => d.snapshot.workspaceId === e.workspaceId);
    return row && (row.snapshot.optedOut || actions.adapter.billing[e.workspaceId] !== 'active');
  });
  const dups = entries.filter((e) => e.history[0]?.note.startsWith('Duplicate'));
  const fp = state.reviews.filter((r) => r.decision === 'FALSE_POSITIVE');
  const fpTally = FP_REASONS.map((r) => [r, fp.filter((x) => x.reason === r).length] as const).filter(([, n]) => n > 0);
  const pct = eligible.length ? reviewed.length / eligible.length : 0;

  const gates = [
    {
      t: 'Reviewer habit',
      target: '≥ 70% of eligible flagged cases reviewed within 2 business days',
      value: `${reviewed.length}/${eligible.length} reviewed (${Math.round(pct * 100)}%) this session`,
      status: pct >= 0.7 ? 'met' : 'not met',
    },
    {
      t: 'Time saved',
      target: '≥ 20% lower median review time vs comparable HubSpot-only cases',
      value: med == null ? 'No reviews timed yet' : `Median ${med.toFixed(1)}s per review here. HubSpot-only baseline: not measured (needs pilot data)`,
      status: 'not measurable',
    },
    {
      t: 'Safety',
      target: 'No increase in duplicate or inappropriate outreach or opt-outs',
      value: `${inappropriate.length} inappropriate sends · ${dups.length} duplicates blocked · ${sent.length} dry-run sends`,
      status: inappropriate.length === 0 ? 'met' : 'not met',
    },
    {
      t: 'Closed loop',
      target: '≥ 1 documented improvement based on reviewer corrections',
      value: `${state.improvements.length} logged`,
      status: state.improvements.length >= 1 ? 'met' : 'not met',
    },
  ];

  return (
    <div style={{ padding: 20 }} className="stack" data-testid="outcomes">
      <div className="row-wrap">
        <Pill tone="watch">Proposed day-90 gates</Pill>
        <span className="small muted">Values below are measured from this demo session's actions, not Superchat results.</span>
      </div>
      <div className="grid c2">
        {gates.map((g) => (
          <div key={g.t} className="stat">
            <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
              <div className="label">{g.t}</div>
              <Pill tone={g.status === 'met' ? 'ok' : g.status === 'not met' ? 'risk' : 'unknown'}>{g.status}</Pill>
            </div>
            <div className="small" style={{ marginTop: 6 }}>
              <strong>Target:</strong> {g.target}
            </div>
            <div className="note">{g.value}</div>
          </div>
        ))}
      </div>
      <div className="grid c3">
        <div className="card" style={{ background: 'var(--surface-2)' }}>
          <h3>Reviewer corrections</h3>
          {fpTally.length === 0 ? <p className="small muted">No false positives recorded yet.</p> : fpTally.map(([r, n]) => <p key={r} className="small">{r}: <strong>{n}</strong></p>)}
          <p className="tiny muted">Corrections are stored beside the computed state and never overwrite the model. RevOps uses them to change rules deliberately.</p>
        </div>
        <div className="card" style={{ background: 'var(--surface-2)' }}>
          <h3>Interventions</h3>
          <p className="small">
            Dispatched (dry-run): <strong>{sent.length}</strong> · Suppressed: <strong>{entries.filter((e) => e.status === 'suppressed').length}</strong> · Pending:{' '}
            <strong>{entries.filter((e) => e.status === 'pending').length}</strong> · Failed: <strong>{entries.filter((e) => e.status === 'failed').length}</strong>
          </p>
          <p className="tiny muted">Whether interventions improve adoption needs mature 90-day cohorts and a holdout. Not measurable in a demo.</p>
        </div>
        <div className="card" style={{ background: 'var(--surface-2)' }}>
          <h3>Data quality</h3>
          <p className="small">
            Open cases: <strong>{state.dq.filter((d) => d.status === 'open').length}</strong> · Resolved: <strong>{state.dq.filter((d) => d.status === 'resolved').length}</strong>
          </p>
          <p className="small">Incident: {state.incident.stage === 'idle' ? 'none' : `${state.incident.stage} (${state.incident.missedHelp} missed reviews found)`}</p>
        </div>
      </div>
      <div className="card">
        <h3>Log a rule or playbook improvement from reviewer feedback</h3>
        <div className="row-wrap">
          <input className="inp" style={{ flex: 1, minWidth: 260 }} value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Exclude system-originated workflow_edited from the edit-recency proxy" aria-label="Improvement" />
          <button
            className="btn primary sm"
            disabled={!text.trim()}
            onClick={() => {
              addImprovement(text.trim(), fpTally.map(([r, n]) => `${r} ×${n}`).join(', ') || 'reviewer notes');
              setText('');
            }}
          >
            Log improvement
          </button>
        </div>
        {state.improvements.map((i) => (
          <p key={i.at} className="small" style={{ marginTop: 8 }}>
            ✓ {i.text} <span className="tiny muted">(based on: {i.basedOn})</span>
          </p>
        ))}
      </div>
    </div>
  );
}

export default function SignalDesk() {
  const { desk, state, actions, ledgerVersion, reconcile, resolveDq, semanticHold, reset } = useApp();
  const [tab, setTab] = useState<Tab>('review');
  const [motion, setMotion] = useState<'ALL' | 'SSF' | 'Sales-led'>('ALL');
  const [risk, setRisk] = useState<'ALL' | 'AT RISK' | 'WATCH'>('ALL');
  const [ledgerFilter, setLedgerFilter] = useState<'all' | LedgerStatus>('all');
  const [reviewer, setReviewer] = useState('Piyush (RevOps)');
  const queueOf: Record<'review' | 'quality' | 'recovered', string> = { review: 'needs_review', quality: 'data_quality', recovered: 'recovered_history' };
  const list = tab === 'review' || tab === 'quality' || tab === 'recovered' ? desk.filter((d) => d.risk.queue === queueOf[tab]) : [];
  const filtered = list.filter((d) => (motion === 'ALL' || d.snapshot.motion === motion) && (tab !== 'review' || risk === 'ALL' || d.risk.state === risk));
  const [selId, setSelId] = useState('WS-1042');
  const sel = filtered.find((d) => d.snapshot.workspaceId === selId) ?? filtered[0];
  const entries = useMemo(() => actions.all(), [actions, ledgerVersion]);
  const openDq = state.dq.filter((d) => d.status === 'open');
  const count = (q: string) => desk.filter((d) => d.risk.queue === q).length;

  const tabs: [Tab, string][] = [
    ['review', `Needs review (${count('needs_review')})`],
    ['quality', `Data quality (${count('data_quality') + openDq.length})`],
    ['recovered', `Recovered (${count('recovered_history')})`],
    ['decisions', `Decisions (${state.reviews.length})`],
    ['ledger', `Action ledger (${entries.length})`],
    ['outcomes', 'Outcomes'],
  ];

  return (
    <div className="desk" id="signal-desk">
      <div className="desk-top">
        <div className="brand">
          <span style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--brand)', display: 'grid', placeItems: 'center' }}>
            <Icon name="desk" size={18} />
          </span>
          <span>Signal Desk</span>
          <span className="pill" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}>
            synthetic data · dry-run
          </span>
        </div>
        <div className="desk-tabs" role="tablist" aria-label="Signal Desk views">
          {tabs.map(([t, l]) => (
            <button key={t} role="tab" aria-selected={tab === t} aria-pressed={tab === t} onClick={() => setTab(t)}>
              {l}
            </button>
          ))}
        </div>
        <label className="desk-reviewer">
          Reviewer
          <input value={reviewer} onChange={(e) => setReviewer(e.target.value)} aria-label="Reviewer name" />
        </label>
      </div>

      {semanticHold && (
        <div className="desk-banner" role="status">
          <Icon name="alert" size={18} /> Semantic-integrity incident ({state.incident.stage}): edit-derived fields and actions are on hold. Execution-based flags below are unaffected.
        </div>
      )}

      {tab === 'outcomes' ? (
        <Outcomes />
      ) : tab === 'decisions' ? (
        <div style={{ padding: 20 }}>
          {state.reviews.length === 0 ? (
            <div className="empty">No reviewer decisions yet. Open a case in Needs review and save a decision.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Workspace</th>
                    <th>Previous → new</th>
                    <th>Reason</th>
                    <th>Computed state (preserved)</th>
                    <th>Reviewer</th>
                  </tr>
                </thead>
                <tbody>
                  {[...state.reviews].reverse().map((r) => (
                    <tr key={r.id}>
                      <td className="tiny">{new Date(r.at).toLocaleTimeString()}</td>
                      <td>{r.workspaceId}</td>
                      <td>
                        {r.previousDecision} → <strong>{r.decision}</strong>
                      </td>
                      <td className="small">
                        {r.reason ?? '—'}
                        {r.until ? ` (until ${r.until})` : ''}
                      </td>
                      <td>
                        <Pill tone={TONE[r.computedState as RiskState]}>{r.computedState}</Pill> <span className="tiny muted">{r.modelVersion}</span>
                      </td>
                      <td className="small">{r.reviewer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : tab === 'ledger' ? (
        <div style={{ padding: 20 }} className="stack">
          <div className="row-wrap">
            <div className="seg" role="group" aria-label="Ledger status filter">
              {(['all', 'dispatched', 'pending', 'reconciled', 'failed', 'suppressed'] as const).map((f) => (
                <button key={f} aria-pressed={ledgerFilter === f} onClick={() => setLedgerFilter(f)}>
                  {f}
                </button>
              ))}
            </div>
            <span className="tiny muted">
              Simulated outbox: {actions.adapter.outbox.length} delivery(ies). Key = workspace + reason + action type + {RULES.cooldownDays}-day window, claimed atomically.
            </span>
          </div>
          {entries.filter((e) => ledgerFilter === 'all' || e.status === ledgerFilter).length === 0 ? (
            <div className="empty">No ledger entries{ledgerFilter !== 'all' ? ` with status "${ledgerFilter}"` : ''} yet.</div>
          ) : (
            <div className="table-wrap" style={{ maxHeight: 480, overflow: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Action key</th>
                    <th>External ref</th>
                    <th>History</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {entries
                    .filter((e) => ledgerFilter === 'all' || e.status === ledgerFilter)
                    .map((e) => (
                      <tr key={e.id} data-testid="ledger-row">
                        <td>
                          <Pill tone={STATUS_TONE[e.status]}>{e.status}</Pill>
                        </td>
                        <td>
                          <code className="tiny">{e.key}</code>
                          <div className="tiny muted">by {e.requestedBy}</div>
                        </td>
                        <td className="tiny">{e.externalRef ?? '—'}</td>
                        <td className="tiny">
                          {e.history.map((h, i) => (
                            <div key={i}>
                              {h.status}: {h.note}
                            </div>
                          ))}
                        </td>
                        <td>
                          {e.status === 'pending' && (
                            <button className="btn sm" onClick={() => reconcile(e.key)}>
                              Reconcile
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
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
            {filtered.length === 0 && <div className="empty" style={{ margin: 12 }}>Nothing matches these filters.</div>}
            {filtered.map((d) => (
              <button key={d.snapshot.workspaceId} className="desk-row" aria-current={sel?.snapshot.workspaceId === d.snapshot.workspaceId} onClick={() => setSelId(d.snapshot.workspaceId)} data-testid={`row-${d.snapshot.workspaceId}`}>
                <span className="avatar" style={{ background: `var(--${TONE[d.risk.state] === 'outline' ? 'surface-3' : TONE[d.risk.state] + '-soft'})`, color: `var(--${TONE[d.risk.state] === 'outline' ? 'ink-2' : TONE[d.risk.state]})` }}>
                  {d.snapshot.motion === 'SSF' ? 'SSF' : 'SL'}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <strong className="small">{d.snapshot.workspaceId}</strong>
                    <Pill tone={TONE[d.risk.state]}>{d.risk.state}</Pill>
                  </span>
                  <span className="tiny muted" style={{ display: 'block' }}>
                    {d.risk.reasons.join(' + ').toLowerCase().replace(/_/g, ' ')}
                  </span>
                  <span className="tiny muted">
                    {d.snapshot.owner ?? 'no owner'} · {d.snapshot.sourceFreshnessHours}h old {d.latest && <Pill tone="brand">{d.latest.decision.replace('_', ' ').toLowerCase()}</Pill>}
                  </span>
                </span>
              </button>
            ))}
            {tab === 'quality' && (
              <div style={{ padding: 12 }}>
                <div className="eyebrow" style={{ marginBottom: 6 }}>
                  Open data-quality cases ({openDq.length})
                </div>
                {openDq.length === 0 && <p className="tiny muted">None. Account A can be sent here from Section 2; incident repairs land here from Section 6.</p>}
                {openDq.map((c) => (
                  <div key={c.id} className="dq-case" data-testid="dq-case">
                    <div className="small">
                      <strong>{c.workspaceId}</strong> · <span className="muted">{c.source}</span>
                    </div>
                    <div className="tiny">{c.reason}</div>
                    <button className="btn sm ghost" onClick={() => resolveDq(c.id)}>
                      Mark resolved
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ padding: 14 }} className="tiny muted">
              {tab === 'review'
                ? 'Only evidence-backed AT RISK and WATCH from the engine. UNKNOWN and RECOVERED never appear here.'
                : tab === 'quality'
                  ? 'Missing telemetry, stale sources and suspect event origin. No customer action from this view.'
                  : 'Read-only history: recovery required confirmed successful runs.'}
            </div>
          </div>
          {sel ? <Detail key={sel.snapshot.workspaceId} row={sel} reviewer={reviewer} /> : <div className="empty" style={{ margin: 20 }}>Select a workspace.</div>}
        </div>
      )}
      <div className="desk-foot">
        <span className="tiny muted">State persists in this browser. Nothing is sent to HubSpot, Make/n8n or customers.</span>
        <button
          className="btn sm ghost"
          onClick={() => {
            if (window.confirm('Reset all demo state (reviews, ledger, CRM changes, incident)?')) reset();
          }}
        >
          Reset demo state
        </button>
      </div>
    </div>
  );
}
