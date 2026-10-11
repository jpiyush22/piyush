import { useState } from 'react';
import { Card, Pill, Prov } from '../components/ui';
import type { CheckResult } from '../domain/actions';
import { RULES, accountASnapshot, scoreWorkspace, type RiskResult, type WorkspaceSnapshot } from '../domain/risk';
import { SYNTHETIC_WORKSPACES } from '../domain/workspaces';
import { useApp } from '../state/store';
import { RiskResultCard } from './S2Leak';

const BASES: { id: string; label: string; snap: () => WorkspaceSnapshot }[] = [
  ...SYNTHETIC_WORKSPACES.map((w) => ({ id: w.workspaceId, label: `${w.workspaceId} · ${w.motion} (synthetic)`, snap: () => ({ ...w }) })),
  { id: 'ACCOUNT-A', label: 'Account A @ day 33 (case study)', snap: () => accountASnapshot(33) },
];

/** Section 4: run the deterministic engine on a snapshot, edit its inputs, and dry-run pre-action checks. */
export default function EnginePlayground() {
  const { checksFor, desk } = useApp();
  const [baseId, setBaseId] = useState('WS-1042');
  const [snap, setSnap] = useState<WorkspaceSnapshot>(() => BASES[0].snap());
  const [result, setResult] = useState<RiskResult | null>(null);
  const [checks, setChecks] = useState<CheckResult[] | null>(null);
  const [edited, setEdited] = useState(false);

  const pick = (id: string) => {
    setBaseId(id);
    setSnap(BASES.find((b) => b.id === id)!.snap());
    setResult(null);
    setChecks(null);
    setEdited(false);
  };
  const set = (patch: Partial<WorkspaceSnapshot>) => {
    setSnap((s) => ({ ...s, ...patch }));
    setEdited(true);
    setChecks(null);
  };
  const sinceRun = snap.lastSuccessfulRunDay == null ? 60 : snap.asOfDay - snap.lastSuccessfulRunDay;
  const msgDelta = snap.messages14d != null && snap.messagesPrev14d ? Math.round((snap.messages14d / snap.messagesPrev14d - 1) * 100) : 0;
  const inDesk = desk.some((d) => d.snapshot.workspaceId === baseId);

  return (
    <Card title="Risk engine: run it" right={<div className="row-wrap"><Prov kind="proposed" /><Prov kind="simulated" /></div>}>
      <p className="small muted" style={{ marginTop: -6 }}>
        The same deterministic rules the warehouse model would run ({'model '}
        <code>v0.3-exec</code>). Thresholds are the proposed pilot values: stall {RULES.stallDays}d, decline ≤ {RULES.messagingDecline * 100}%, failures ≥ {RULES.repeatedFailures}/7d,
        freshness ≤ {RULES.freshnessWindowHours}h.
      </p>
      <div className="grid c2">
        <div className="stack" style={{ gap: 10 }}>
          <label className="field">
            Workspace snapshot
            <select value={baseId} onChange={(e) => pick(e.target.value)} aria-label="Workspace snapshot">
              {BASES.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
          </label>
          <div className="grid c2" style={{ gap: 10 }}>
            <label className="field">
              Execution telemetry
              <select value={snap.executionTelemetry} onChange={(e) => set({ executionTelemetry: e.target.value as 'available' | 'missing' })}>
                <option value="available">available</option>
                <option value="missing">missing</option>
              </select>
            </label>
            <label className="field">
              Subscription (Chargebee)
              <select value={snap.billing.status} onChange={(e) => set({ billing: { ...snap.billing, status: e.target.value as 'active' } })}>
                <option value="active">active</option>
                <option value="cancelled">cancelled</option>
                <option value="downgraded">downgraded</option>
              </select>
            </label>
          </div>
          <label className="field">
            Days since last verified successful run: <strong style={{ color: 'var(--ink)' }}>{snap.executionTelemetry === 'missing' ? 'n/a (no telemetry)' : sinceRun}</strong>
            <input
              className="range"
              type="range"
              min={0}
              max={45}
              value={Math.min(sinceRun, 45)}
              disabled={snap.executionTelemetry === 'missing'}
              onChange={(e) => set({ lastSuccessfulRunDay: snap.asOfDay - +e.target.value })}
            />
          </label>
          <label className="field">
            Messaging, 14d vs prior 14d: <strong style={{ color: 'var(--ink)' }}>{msgDelta}%</strong>
            <input className="range" type="range" min={-60} max={40} value={msgDelta} onChange={(e) => set({ messages14d: Math.round(500 * (1 + +e.target.value / 100)), messagesPrev14d: 500 })} />
          </label>
          <div className="grid c2" style={{ gap: 10 }}>
            <label className="field">
              Failed runs (7d)
              <input type="number" min={0} value={snap.failedRuns7d ?? 0} onChange={(e) => set({ failedRuns7d: Math.max(0, +e.target.value) })} />
            </label>
            <label className="field">
              Source age (hours)
              <input type="number" min={0} value={snap.sourceFreshnessHours} onChange={(e) => set({ sourceFreshnessHours: Math.max(0, +e.target.value) })} />
            </label>
            <label className="field">
              Depth features set up
              <input type="number" min={0} value={snap.depthSetupCount} onChange={(e) => set({ depthSetupCount: Math.max(0, +e.target.value) })} />
            </label>
            <label className="field">
              Previous state
              <select value={snap.previousState ?? ''} onChange={(e) => set({ previousState: (e.target.value || undefined) as WorkspaceSnapshot['previousState'] })}>
                <option value="">none</option>
                <option value="WATCH">WATCH</option>
                <option value="AT RISK">AT RISK</option>
              </select>
            </label>
          </div>
          <div className="row-wrap">
            <button className="btn primary" onClick={() => setResult(scoreWorkspace(snap))} data-testid="run-engine">
              Run risk engine
            </button>
            <button
              className="btn"
              disabled={!inDesk || edited || !result || !result.reviewEligible}
              title={!inDesk ? 'Pre-action checks use the live Signal Desk state, so they need a desk workspace' : edited ? 'Checks run on the real snapshot, not edited inputs' : undefined}
              onClick={async () => setChecks(await checksFor(baseId, snap.motion === 'SSF' ? 'ssf_nudge' : 'csx_task', 'tpl-first-workflow-run'))}
            >
              Dry-run pre-action checks
            </button>
            {edited && <Pill tone="watch">Inputs edited: what-if only</Pill>}
          </div>
        </div>
        <div>
          {result ? (
            <RiskResultCard r={result} />
          ) : (
            <div className="empty">Pick a snapshot, adjust the inputs if you like, then run the engine. The result shows state, reason codes, confidence, evidence timestamps, freshness and model version.</div>
          )}
          {checks && (
            <div className="card anim-rise" style={{ marginTop: 12, background: 'var(--surface-2)' }} data-testid="dry-run-checks">
              <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
                <strong>Pre-action checks (dry-run, nothing sent)</strong>
                <Pill tone={checks.every((c) => c.ok) ? 'ok' : 'risk'}>{checks.every((c) => c.ok) ? 'Eligible' : `${checks.filter((c) => !c.ok).length} blocking`}</Pill>
              </div>
              <ul className="checklist">
                {checks.map((c) => (
                  <li key={c.id} className={c.ok ? 'ok' : 'bad'}>
                    <span>{c.ok ? '✓' : '✗'}</span> {c.label} <span className="muted tiny">· {c.detail}</span>
                  </li>
                ))}
              </ul>
              <p className="tiny muted">Confirm the risk in Signal Desk (Section 7) to clear the reviewer check, then dispatch there.</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
