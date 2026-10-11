import { useMemo, useState } from 'react';
import { Callout, Card, DataTable, Pill, Prov, Stat } from '../components/ui';
import { detectionDay, impactAnalysis, type ImpactRow } from '../domain/drift';
import { useApp, type IncidentStage } from '../state/store';

const ORDER: IncidentStage[] = ['idle', 'detected', 'contained', 'analyzed', 'replayed', 'restored'];
const reached = (stage: IncidentStage, target: IncidentStage) => ORDER.indexOf(stage) >= ORDER.indexOf(target);

function LineChart({ day, detect }: { day: number; detect: number }) {
  const { sim } = useApp();
  const days = sim.days.filter((d) => d.day >= -21);
  const W = 980;
  const H = 260;
  const L = 48;
  const R = 16;
  const T = 16;
  const B = 34;
  const maxY = 0.13;
  const x = (d: number) => L + ((d - days[0].day) / (days[days.length - 1].day - days[0].day)) * (W - L - R);
  const y = (v: number) => T + (1 - v / maxY) * (H - T - B);
  const path = (vals: (number | null)[]): string => {
    let d = '';
    let pen = false;
    vals.forEach((v, i) => {
      if (v == null) {
        pen = false;
        return;
      }
      d += `${pen ? ' L' : ' M'}${x(days[i].day)} ${y(v)}`;
      pen = true;
    });
    return d.trim();
  };
  const upto = days.filter((d) => d.day <= day);
  return (
    <div className="svg-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Daily edited-workspace rate vs baselines">
        <rect x={x(0)} y={T} width={x(20) - x(0)} height={H - T - B} fill="var(--brand-light)" opacity={0.18} />
        <text x={x(0) + 6} y={T + 14} fontSize="11" fill="var(--navy)" fontWeight={700}>
          background migrations (days 0–20)
        </text>
        {[0, 0.03, 0.06, 0.09, 0.12].map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--line)" />
            <text x={L - 6} y={y(v) + 4} fontSize="10.5" textAnchor="end" fill="var(--ink-3)">
              {Math.round(v * 100)}%
            </text>
          </g>
        ))}
        {days.filter((d) => d.day % 7 === 0).map((d) => (
          <text key={d.day} x={x(d.day)} y={H - 12} fontSize="10.5" textAnchor="middle" fill="var(--ink-3)">
            d{d.day}
          </text>
        ))}
        <path d={path(days.map((d) => d.frozenBaseline))} fill="none" stroke="var(--navy)" strokeWidth={1.8} strokeDasharray="2 4" />
        <path d={path(days.map((d) => d.frozenBaseline * 1.5))} fill="none" stroke="var(--watch)" strokeWidth={1.2} strokeDasharray="6 4" />
        <path d={path(days.map((d) => d.rollingBaseline))} fill="none" stroke="var(--muted-line)" strokeWidth={2} strokeDasharray="7 5" />
        <path key={day} pathLength={1} className="anim-draw" d={path(upto.map((d) => d.editRate))} fill="none" stroke="var(--brand)" strokeWidth={2.6} />
        {upto.filter((d) => d.driftAlert).map((d) => (
          <circle key={d.day} cx={x(d.day)} cy={y(d.editRate)} r={3.2} fill="var(--risk)" />
        ))}
        <line x1={x(detect)} x2={x(detect)} y1={T} y2={H - B} stroke="var(--risk)" strokeWidth={1.5} strokeDasharray="4 3" />
        <text x={x(detect) + 4} y={H - B - 6} fontSize="11" fill="var(--risk)" fontWeight={700}>
          detected d{detect}
        </text>
        <line x1={x(day)} x2={x(day)} y1={T} y2={H - B} stroke="var(--navy)" strokeWidth={1.5} />
        <circle cx={x(day)} cy={y(sim.days.find((d) => d.day === day)!.editRate)} r={5} fill="var(--brand)" />
        <circle cx={x(day)} cy={y(sim.days.find((d) => d.day === day)!.editRate)} r={6} fill="none" stroke="var(--brand)" className="pulse" />
      </svg>
      <div className="legend" style={{ marginTop: 6 }}>
        <span>
          <i style={{ background: 'var(--brand)' }} />
          Edited-workspace rate (daily)
        </span>
        <span>
          <i style={{ background: 'var(--navy)' }} />
          Frozen last-known-good baseline
        </span>
        <span>
          <i style={{ background: 'var(--watch)' }} />
          1.5× drift threshold (3-day mean)
        </span>
        <span>
          <i style={{ background: 'var(--muted-line)' }} />
          Rolling same-weekday baseline (learns the contamination)
        </span>
        <span>
          <i style={{ background: 'var(--risk)' }} />
          Drift alert days
        </span>
      </div>
    </div>
  );
}

function ImpactBars({ day }: { day: number }) {
  const { sim } = useApp();
  const days = sim.days.filter((d) => d.day >= -7 && d.day <= day);
  const max = Math.max(...sim.days.map((d) => d.suppressedReviews), 1);
  return (
    <div className="bars-chart" aria-label="Suppressed reviews per day">
      {days.map((d, i) => (
        <div key={d.day} className="bc-col" title={`d${d.day}: ${d.suppressedReviews} suppressed reviews, ${d.systemCausedRecoveries} system-caused recoveries, ${d.execWatch} execution-based flags`}>
          <div className="bc-bar anim-rise" style={{ height: `${(d.suppressedReviews / max) * 100}%`, animationDelay: `${i * 12}ms` }} />
          {d.day % 7 === 0 && <span className="bc-lbl">d{d.day}</span>}
        </div>
      ))}
    </div>
  );
}

export default function IncidentSimulator() {
  const { sim, state, setMonitor, incidentDetect, incidentContain, incidentAnalyze, incidentReplay, incidentRestore, incidentReset } = useApp();
  const inc = state.incident;
  const detect = inc.detectedDay ?? detectionDay(sim, inc.monitorEnabled);
  const [day, setDay] = useState(-3);
  const [rows, setRows] = useState<ImpactRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const cur = sim.days.find((d) => d.day === day)!;
  const cumSystem = sim.days.filter((d) => d.day <= day).reduce((s, d) => s + d.systemCausedRecoveries, 0);
  const impactAtDetect = useMemo(() => impactAnalysis(sim, detect), [sim, detect]);
  const impactNoMonitor = useMemo(() => impactAnalysis(sim, 21), [sim]);

  const phases: { n: number; title: string; done: boolean; detail: string }[] = [
    { n: 1, title: 'Normal operation', done: true, detail: `Frozen baseline ${(sim.frozenBaseline * 100).toFixed(1)}% of workspaces edit a workflow per day.` },
    { n: 2, title: 'Background migrations start', done: day >= 0, detail: 'Each migration fires workflow_edited. No errors; every sync green.' },
    { n: 3, title: 'Abnormal edit rate', done: sim.firstDriftDay != null && day >= sim.firstDriftDay, detail: `3-day mean ≥ 1.5× frozen baseline from day ${sim.firstDriftDay}; executions flat.` },
    { n: 4, title: 'Edit-based logic contaminated', done: cumSystem > 0, detail: `${cumSystem} proxy RECOVERED transitions so far caused only by system edits.` },
    { n: 5, title: 'Wrong recoveries / suppressed reviews', done: cur.suppressedReviews > 0, detail: `${cur.suppressedReviews} truly stalled workspaces hidden from the edit-proxy watchlist today.` },
    { n: 6, title: 'Detection', done: reached(inc.stage, 'detected'), detail: inc.monitorEnabled ? `Integrity monitor fires on day ${detect}.` : 'No monitor: a person notices on day 21.' },
    { n: 7, title: 'Containment', done: reached(inc.stage, 'contained'), detail: 'Hold only edit-derived fields/actions; execution, billing and messaging keep syncing.' },
    { n: 8, title: 'Historical impact analysis', done: reached(inc.stage, 'analyzed'), detail: inc.affected ? `${inc.affected} workspaces diverged; ${inc.missedHelp} missed reviews.` : 'Diff naive vs corrected decisions.' },
    { n: 9, title: 'Recompute (isolated replay)', done: reached(inc.stage, 'replayed'), detail: inc.replay ? `${inc.replay.partitions} partitions; outbox ${inc.replay.outboundBefore} → ${inc.replay.outboundAfter}.` : 'Outbound disabled; no Airbyte resync.' },
    { n: 10, title: 'Controlled restoration', done: reached(inc.stage, 'restored'), detail: inc.repairCases ? `${inc.repairCases} repair reviews queued, hold released.` : 'Current-state corrections only.' },
  ];

  const next = (() => {
    switch (inc.stage) {
      case 'idle':
        return { label: day >= detect ? `Raise incident (detected day ${detect})` : `Advance to day ${detect} to detect`, run: () => (day >= detect ? incidentDetect() : setDay(detect)) };
      case 'detected':
        return { label: 'Contain: hold edit-derived outputs', run: incidentContain };
      case 'contained':
        return { label: 'Analyse historical impact', run: () => setRows(incidentAnalyze()) };
      case 'analyzed':
        return {
          label: 'Recompute affected partitions (replay, outbound off)',
          run: async () => {
            setBusy(true);
            await incidentReplay();
            setBusy(false);
          },
        };
      case 'replayed':
        return { label: 'Restore: apply current-state corrections', run: incidentRestore };
      default:
        return null;
    }
  })();

  return (
    <Card title="Incident simulator: background workflow migrations" right={<div className="row-wrap"><Prov kind="synthetic" /><Prov kind="simulated" /></div>}>
      <p className="small muted" style={{ marginTop: -6 }}>
        {sim.params.population} synthetic workspaces (seed {sim.params.seed}), {Math.round(sim.params.migratedShare * 100)}% migrated over {sim.params.rolloutDays} days. Not Superchat data.
        Pipeline status throughout: <Pill tone="ok">Airbyte ✓</Pill> <Pill tone="ok">Dagster ✓</Pill> <Pill tone="ok">Hightouch ✓</Pill>
      </p>
      <div className="row-wrap" style={{ margin: '8px 0 12px' }}>
        <label className="field" style={{ flex: 1, minWidth: 280 }}>
          Simulation day <strong style={{ color: 'var(--ink)' }}>d{day}</strong>
          <input className="range" type="range" min={-14} max={34} value={day} onChange={(e) => setDay(+e.target.value)} aria-label="Simulation day" />
        </label>
        <label className="chip">
          <input type="checkbox" checked={inc.monitorEnabled} disabled={inc.stage !== 'idle'} onChange={(e) => setMonitor(e.target.checked)} />
          Semantic-integrity monitor enabled
        </label>
      </div>
      <LineChart day={day} detect={detect} />

      <div className="grid c4" style={{ marginTop: 14 }}>
        <Stat label={`Edit rate d${day}`} value={`${(cur.editRate * 100).toFixed(1)}%`} note={`${(cur.editRate / cur.frozenBaseline).toFixed(2)}× frozen · ${cur.rollingBaseline ? (cur.editRate / cur.rollingBaseline).toFixed(2) : '—'}× rolling`} />
        <Stat label="Verified execution coverage" value={`${(cur.execCoverage * 100).toFixed(0)}%`} note={`${((cur.execCoverage - cur.frozenExecCoverage) * 100).toFixed(1)} pp vs baseline: no lift`} />
        <Stat label="Edit-proxy: suppressed reviews" value={cur.suppressedReviews} note={`${cur.systemCausedRecoveries} system-caused RECOVERED today`} accent />
        <Stat label="Execution-based flags" value={cur.execWatch} note={`${cur.execUnknown} UNKNOWN (no telemetry), unchanged by edits`} />
      </div>

      <div className="grid c2" style={{ marginTop: 16 }}>
        <div>
          <h3 style={{ fontSize: 16, marginBottom: 8 }}>Phases</h3>
          <ol className="phases">
            {phases.map((p) => (
              <li key={p.n} className={p.done ? 'done' : ''}>
                <span className="pn">{p.done ? '✓' : p.n}</span>
                <div>
                  <strong>{p.title}</strong>
                  <div className="tiny muted">{p.detail}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="stack" style={{ gap: 12 }}>
          <div className="card" style={{ background: 'var(--surface-2)' }}>
            <h3 style={{ fontSize: 16 }}>Response</h3>
            {next ? (
              <button className="btn primary" disabled={busy} onClick={next.run} data-testid="incident-next">
                {busy ? 'Replaying…' : next.label}
              </button>
            ) : (
              <Callout tone="ok" title="Restored.">
                Hold released. {inc.repairCases} repair reviews are in Signal Desk → Data quality.
              </Callout>
            )}
            <button className="btn sm ghost" style={{ marginLeft: 8 }} onClick={() => { incidentReset(); setRows(null); }}>
              Reset incident
            </button>
            <p className="tiny muted" style={{ marginTop: 10 }}>
              Signal Desk shows the incident banner while the hold is active. Execution-based flags there are unaffected, because they never used workflow_edited.
            </p>
          </div>
          <div className="card" style={{ background: 'var(--surface-2)' }}>
            <h3 style={{ fontSize: 16 }}>Why the monitor matters</h3>
            <p className="small">
              Missed reviews if caught on day {detectionDay(sim, true)}: <strong>{impactAtDetect.filter((r) => r.category === 'missed_help').length}</strong>. If nobody notices until day 21:{' '}
              <strong>{impactNoMonitor.filter((r) => r.category === 'missed_help').length}</strong>.
            </p>
            <ImpactBars day={day} />
            <p className="tiny muted">Bars: truly stalled workspaces the edit proxy stopped flagging, per day (from d-7 to the selected day). The effect persists after day 20 because of the 14-day lookback.</p>
          </div>
        </div>
      </div>

      {rows && (
        <div style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 16, marginBottom: 8 }}>
            Impact through day {detect}: {rows.length} workspaces ({rows.filter((r) => r.category === 'missed_help').length} missed help,{' '}
            {rows.filter((r) => r.category === 'wrongly_recovered').length} wrongly recovered, {rows.filter((r) => r.category === 'no_impact').length} no decision impact)
          </h3>
          <DataTable
            head={['Workspace', 'First divergence', 'Naive proxy', 'Corrected', 'Execution-based', 'Repair']}
            rows={rows.slice(0, 12).map((r) => [r.workspaceId, `d${r.firstDivergenceDay}`, r.naive, r.corrected, r.exec, r.category.replace('_', ' ')])}
          />
          {rows.length > 12 && <p className="tiny muted">Showing 12 of {rows.length}.</p>}
        </div>
      )}
    </Card>
  );
}
