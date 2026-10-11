import { useState } from 'react';
import IncidentSimulator from './IncidentSimulator';
import { Answer, Callout, Card, DataTable, KV, Pill, QA, SectionHero, Stat } from '../components/ui';

function DriftSimulator() {
  const [migration, setMigration] = useState(40);
  const [evalDay, setEvalDay] = useState(41);
  const lastUserEdit = 19;
  const threshold = 14;
  const migrated = migration <= evalDay;
  const naive = evalDay - (migrated ? Math.max(migration, lastUserEdit) : lastUserEdit);
  const honest = evalDay - lastUserEdit;
  const naiveWatch = naive >= threshold;
  const honestWatch = honest >= threshold;
  return (
    <Card title="Try it: what one background migration does to a naive edit-based proxy (Account A)">
      <div className="grid c2">
        <label className="field">
          Hypothetical system migration on day <strong style={{ color: 'var(--ink)' }}>{migration}</strong>
          <input className="range" type="range" min={20} max={70} value={migration} onChange={(e) => setMigration(+e.target.value)} />
        </label>
        <label className="field">
          Evaluation day <strong style={{ color: 'var(--ink)' }}>{evalDay}</strong>
          <input className="range" type="range" min={20} max={71} value={evalDay} onChange={(e) => setEvalDay(+e.target.value)} />
        </label>
      </div>
      <div className="grid c3" style={{ marginTop: 14 }}>
        <Stat label="Naive 'days since last edit'" value={naive} note={migrated ? `Reset by the migration on day ${migration}` : 'Migration has not happened yet'} />
        <Stat label="Days since earlier recorded edit" value={honest} note="Day 19, actor unknown" />
        <Stat label="Freshness invented" value={Math.max(0, honest - naive)} note="days of fake recency" accent />
      </div>
      <div className="row-wrap" style={{ marginTop: 14 }}>
        <span className="small">Edit-based proxy says:</span>
        <Pill tone={naiveWatch ? 'watch' : 'ok'}>{naiveWatch ? 'WATCH' : 'NO WATCH'}</Pill>
        <span className="small">Without the system edit:</span>
        <Pill tone={honestWatch ? 'watch' : 'ok'}>{honestWatch ? 'WATCH' : 'NO WATCH'}</Pill>
        {naiveWatch !== honestWatch && <Pill tone="risk">False "healthy": the flag silently disappears</Pill>}
      </div>
      <p className="tiny muted" style={{ marginTop: 10 }}>
        Illustrative only. The migration is hypothetical, not a claim about Account A, and neither edit proves human engagement. The intended Section 4 model uses confirmed
        executions, so it would not move at all. The proxy, a dashboard or a suppression rule would.
      </p>
    </Card>
  );
}

function ThresholdCheck() {
  const [baseActive, setBaseActive] = useState(1000);
  const [baseEdited, setBaseEdited] = useState(100);
  const [active, setActive] = useState(1000);
  const [edited, setEdited] = useState(230);
  const [baseExec, setBaseExec] = useState(0.2);
  const [exec, setExec] = useState(0.2);
  const [haveExec, setHaveExec] = useState(true);
  const minActive = 50;
  const ratio = 2;
  const br = baseEdited / baseActive;
  const cr = edited / active;
  const mult = br ? cr / br : 0;
  const execLift = exec - baseExec;
  const insufficient = active < minActive;
  const investigate = !insufficient && mult >= ratio && (!haveExec || execLift <= 0.01);
  const num = (v: number, set: (n: number) => void, step = 1) => <input type="number" value={v} step={step} min={0} onChange={(e) => set(Number(e.target.value))} />;
  return (
    <Card title="Signal-integrity check: hypothetical threshold calculator">
      <div className="grid c3">
        <label className="field">Baseline active workspaces {num(baseActive, setBaseActive)}</label>
        <label className="field">Baseline workspaces edited {num(baseEdited, setBaseEdited)}</label>
        <label className="field">Today's active workspaces {num(active, setActive)}</label>
        <label className="field">Today's workspaces edited {num(edited, setEdited)}</label>
        <label className="field">
          Baseline confirmed execution rate {num(baseExec, setBaseExec, 0.01)}
        </label>
        <label className="field">
          Today's confirmed execution rate {num(exec, setExec, 0.01)}
        </label>
      </div>
      <label className="row-wrap small" style={{ marginTop: 10, cursor: 'pointer' }}>
        <input type="checkbox" checked={haveExec} onChange={(e) => setHaveExec(e.target.checked)} /> Execution telemetry available
      </label>
      <div className="grid c4" style={{ marginTop: 14 }}>
        <Stat label="Baseline edit rate" value={`${(br * 100).toFixed(1)}%`} note="frozen last-known-good" />
        <Stat label="Current edit rate" value={`${(cr * 100).toFixed(1)}%`} />
        <Stat label="Multiplier" value={`${mult.toFixed(2)}×`} note={`alert at ≥ ${ratio}×`} />
        <Stat label="Independent use change" value={haveExec ? `${(execLift * 100).toFixed(1)} pp` : 'UNKNOWN'} note={haveExec ? 'confirmed executions' : 'engagement = UNKNOWN'} />
      </div>
      <div style={{ marginTop: 14 }}>
        {insufficient ? (
          <Callout tone="warn" title="Insufficient data.">
            Fewer than {minActive} active workspaces: report "insufficient data" rather than a strong alert.
          </Callout>
        ) : investigate ? (
          <Callout tone="danger" title="INVESTIGATE.">
            Edit rate is {mult.toFixed(1)}× baseline {haveExec ? 'with no parallel lift in confirmed executions' : 'and execution telemetry is missing, so edit-derived engagement is UNKNOWN'}. One
            deduplicated Slack alert to the RevOps owner + Engineering; hold only edit-derived Hightouch fields. No CRM health change, no outreach.
          </Callout>
        ) : (
          <Callout tone="ok" title="No alert.">
            Edit behaviour is within range, or confirmed executions rose with it.
          </Callout>
        )}
      </div>
      <p className="tiny muted" style={{ marginTop: 10 }}>
        2× and a 50-workspace minimum are test thresholds to calibrate, not Superchat benchmarks.
      </p>
    </Card>
  );
}

export default function S6Breaks() {
  return (
    <>
      <SectionHero
        eyebrow="Section 6 · optional"
        title="When it breaks"
        lede="Engineering ships background workflow migrations. Each one fires workflow_edited, across most workspaces, for three weeks. Nothing errors and every sync is green. That's semantic drift, not an outage."
        tags={
          <>
            <Pill tone="risk">Green pipelines, wrong decisions</Pill>
            <Pill tone="brand">Replay, don't resync</Pill>
            <Pill tone="ok">Cheap fix: one daily SQL check</Pill>
          </>
        }
      />

      <div id="s6-sim" />
      <IncidentSimulator />
      <div style={{ height: 16 }} />
      <DriftSimulator />
      <div style={{ height: 28 }} />

      <QA
        num="Q1"
        question="Trace what this does to your system: the signal, the flags, the actions. Where does the damage land first, who feels it, and after how long?"
        summary="If the model uses confirmed executions as designed, risk shouldn't move. Any leftover edit-based proxy, dashboard or suppression rule produces false health within a day, and that reaches CSx and lifecycle queues on the next sync."
      >
        <Card title="Failure trace through the stack">
          <div className="steps">
            {[
              ['Product backend', 'System migration fires a valid workflow_edited. The event now includes non-user work.', 'As channel changes occur over 3 weeks'],
              ['Warehouse + Dagster', 'Naive last-edit / last-activity timestamp refreshes; a derived WATCH may clear or be delayed.', 'Next daily model run: first incorrect classification'],
              ['Hightouch → HubSpot', 'Wrong WATCH / AT RISK status or reason may sync, subject to other independent signals.', 'Next daily reverse-ETL'],
              ['HubSpot → Make/n8n', 'Property-change actions may close or suppress tasks and lifecycle nudges, depending on trigger logic.', 'Shortly after CRM update'],
              ['CSx + lifecycle teams', 'Follow-up queues and SSF guidance shrink incorrectly; teams trust a false sense of improvement.', 'Same or following day'],
              ['Customers / outcomes', 'Customers miss timely help; retention and adoption effects show up much later.', 'Days to weeks, persisting after week 3'],
            ].map(([t, d, w], i) => (
              <div className="step" key={t}>
                <div className="n" style={i >= 4 ? { background: 'var(--risk-soft)', color: 'var(--risk)' } : undefined}>
                  {i + 1}
                </div>
                <div>
                  <div className="t">
                    {t} <span className="muted small">· {w}</span>
                  </div>
                  <div className="d">{d}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <DataTable
          head={['Implementation', 'Impact of automatic edits', 'Why']}
          rows={[
            ['Intended S4 risk signal', <Pill tone="ok">No change</Pill>, 'Uses successful workflow/AI executions; independent billing/failure signals still apply'],
            ['Stopgap last-edit proxy', <Pill tone="risk">Possible false health</Pill>, 'System edits update apparent recency without proving customer engagement'],
            ['Infrastructure status', <Pill>All green</Pill>, "Schema valid; ingestion/transformation/sync succeed. A higher event count isn't higher adoption."],
          ]}
        />
        <div className="grid c2">
          <Answer label="Who feels it, and when">
            <p className="small">
              The first damage is to the meaning of the raw usage signal, then to the warehouse's daily classifications (within roughly a day of each migration). The next HubSpot sync
              and triggered workflow carry it into GTM actions. CSx and lifecycle teams see fewer legitimate accounts to help; customers lose timely guidance. It spreads as migrations
              reach more workspaces, and any 14-day lookback stays misleading after the final migration.
            </p>
          </Answer>
          <Answer label="First thing I'd verify">
            <p className="small">
              Compare workflow_edited counts with successful executions and deployment history. Check actor/origin metadata and every downstream use of the event: warehouse models,
              dashboards, HubSpot properties, task triggers and suppression rules. Exclude system edits from engagement; if origin can't be determined, mark the proxy untrusted.
            </p>
          </Answer>
        </div>
      </QA>

      <QA
        num="Q2"
        question="Three weeks pass before anyone notices. Walk through the cleanup: what do you recompute, what do you do about actions your system already took on the wrong accounts, and how do you handle it when full re-ingestion is expensive?"
        summary="Treat it as a data-correctness incident. Contain, snapshot, classify, replay only the affected partitions in isolation, then repair the customer decisions one by one. No full Airbyte resync."
      >
        <Card title="Recovery runbook (order matters)">
          <DataTable
            head={['Step', 'Action', 'Output', 'Owner']}
            rows={[
              ['1. Contain', 'Pause edit-dependent rules, status changes and outbound automation; leave independent signals and ingestion live', 'Paused-trigger inventory; note to CSx/lifecycle that recent "Recovered" may be wrong', 'RevOps + GTM Ops, immediately'],
              ['2. Snapshot', 'Preserve raw events, historical scores, Dagster runs, Hightouch writes, HubSpot/Make/n8n action logs', 'Immutable baseline + audit log', 'Data + RevOps'],
              ['3. Classify edits', 'Deployment boundary + job IDs; match by event_id, workflow_id, workspace_id, actor/origin. Uncertain edits → UNKNOWN', 'Versioned exclusion/classification table (raw stays immutable)', 'Engineering + Data'],
              ['4. Recompute', 'Replay daily partitions with ≥14-day pre-incident lookback AND a post-incident tail until contaminated edits age out', 'Corrected status/reason per day, model version', 'Dagster + warehouse'],
              ['5. Diff', 'Old vs corrected WATCH / AT RISK / RECOVERED and action eligibility', 'Explicit affected-Workspace list and days', 'RevOps + CSx'],
              ['6. Reconcile actions', 'Join corrections to HubSpot history, tasks, sends/suppressions, Make/n8n logs', 'Repair ledger: missed / closed / unnecessary / no impact', 'RevOps + Lifecycle'],
              ['7. Repair selectively', 'Recheck CURRENT subscription, risk, opt-out, owner, recent contact; then act once', 'Approved current-state fixes, no duplicates', 'Assigned CSx / lifecycle owner'],
              ['8. QA + resume', 'Reconcile, add regression check (system edits never count as engagement), restart in a monitored batch', 'Sign-off + rollback plan', 'Data + GTM owners'],
            ]}
          />
        </Card>
        <div className="grid c2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
          {[
            ['Missed help', 'risk', 'Re-evaluate today; if still eligible, create one approved follow-up.'],
            ['Task wrongly closed/snoozed', 'watch', 'Reopen or replace only when still relevant and the owner approves.'],
            ['Unnecessary message sent', 'unknown', "Can't unsend. Owner decides if a correction is warranted; no automated apology."],
            ['No change', 'ok', 'Leave untouched; record as unaffected (useful control cohort).'],
          ].map(([t, tone, d]) => (
            <div key={t} className="card" style={{ padding: 16 }}>
              <Pill tone={tone as 'risk'}>{t}</Pill>
              <p className="small" style={{ marginTop: 8 }}>
                {d}
              </p>
            </div>
          ))}
        </div>
        <div className="grid c3">
          <Stat label="Incident window" value="21 days" />
          <Stat label="Rolling lookback" value="+14 days" />
          <Stat label="Minimum raw scan" value="35 days" note="plus a post-incident tail" accent />
        </div>
        <Answer label="Keeping the Airbyte bill under control">
          <KV
            items={[
              ['Raw data already present', 'No reason for a full Airbyte resync. Apply a small correction mapping and rerun only affected Dagster partitions + dependencies in an isolated replay, with Hightouch and all customer-facing automations OFF.'],
              ['Raw evidence missing', 'A targeted API export or a bounded incremental backfill from a validated cursor, never a full reload.'],
              ['Reverse ETL repair', 'Once validated, sync only CURRENT approved Workspace state. Never replay historical risk transitions into live messaging.'],
              ['Still needed', 'Engineering migration/job metadata and actual action logs. Neither is supplied in the challenge.'],
            ]}
          />
        </Answer>
        <Callout title="Bottom line:">correcting the model is only half the cleanup. I also have to find and repair customer interventions that were missed, delayed or wrongly triggered.</Callout>
      </QA>

      <QA
        num="Q3"
        question="You couldn't have predicted this exact change. What's the cheapest thing you could have built to catch it, and surprises like it, in a week instead of three?"
        summary="One daily signal-integrity SQL check in Dagster, before the edit-dependent Hightouch sync. It compares against a rolling and a frozen last-known-good baseline, alerts one owner, and holds only the untrusted fields."
      >
        <ThresholdCheck />
        <DataTable
          head={['Check', 'Warehouse computation', 'If anomalous']}
          rows={[
            ['Event behaviour', 'Distinct workspaces with workflow_edited ÷ recently active workspaces; event count per active workspace (deduped). Same-weekday rolling + frozen baseline; 3–7-day drift.', 'Investigate source or release'],
            ['Event meaning', 'Edit rate vs independent successful workflow/AI executions. If unavailable, keep rate + recovery checks and mark engagement UNKNOWN.', 'Review suspect rates; never auto-contact'],
            ['Decisions', '% WATCH/AT RISK → RECOVERED plus suppressed tasks/nudges without supporting usage', 'Review affected workspaces'],
            ['Data health', 'Source age, missing/duplicate IDs, invalid workspace join, unknown origin', 'Keep customer automation gated'],
          ]}
        />
        <Callout tone="warn" title="Why the frozen baseline matters:">
          the migrations roll out gradually over three weeks. A purely rolling baseline would slowly learn the contamination as "normal". A modest but persistent shift in decisions
          can reveal more than one big spike.
        </Callout>
        <Card title="One-week solo build">
          <DataTable
            head={['Day', 'Deliverable', 'Acceptance check']}
            rows={[
              ['1–2', 'Inventory every edit-derived decision; define active-workspace denominator, rolling + stored last-known-good baselines, gate owner', 'Know which Hightouch fields can be gated without stopping others'],
              ['3', 'Versioned SQL checks + Dagster pre-flight dependency before the edit-dependent Hightouch sync', 'Monitors edit rates + unsupported RECOVERED even with execution telemetry UNKNOWN'],
              ['4', 'Dry-run a gradual 3-week drift, frozen-baseline protection, missing-execution scenario', 'Flag holds only affected outputs; no false customer contact'],
              ['5', 'One deduplicated Slack alert + narrow pre-Hightouch hold + owner runbook', 'Owner sees both baselines, sample IDs, affected transitions before release'],
            ]}
          />
        </Card>
        <Answer label="Why it's cheap and generalisable">
          <p className="small">
            It reuses data already in the warehouse and tools Superchat already runs, so there's no new ingestion and no full resync. It watches the relationship between an event,
            verified behaviour and GTM decisions rather than the spelling of one event, so it can catch similar semantic changes on the next daily run. It won't catch every subtle
            drift, so I'd track alert-to-investigation time and false-positive rate, and keep improving actor/origin and execution instrumentation.
          </p>
        </Answer>
      </QA>
    </>
  );
}
