/**
 * Single shared state for every module, so an action in one place (a reviewer
 * decision, an incident containment, an approved CRM link) is reflected
 * everywhere that reads it. Persisted to localStorage; nothing leaves the
 * browser. "Reset demo" restores the initial state.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ActionService, actionKey, preActionChecks, type ActionType, type CheckResult, type ReviewDecision, type ReviewDecisionKind } from '../domain/actions';
import { applyVerified, approve as crmApprove, initialAssociations, reject as crmReject, rollbackApplied, type Association, type AuditEntry as CrmAudit } from '../domain/crm';
import { DEFAULT_PARAMS, detectionDay, impactAnalysis, simulate, type ImpactRow, type SimResult } from '../domain/drift';
import { scoreWorkspace, type ReasonCode, type RiskResult, type WorkspaceSnapshot } from '../domain/risk';
import { DESK_TODAY, LIVE_BILLING, SYNTHETIC_WORKSPACES } from '../domain/workspaces';

export type IncidentStage = 'idle' | 'detected' | 'contained' | 'analyzed' | 'replayed' | 'restored';

export interface IncidentState {
  stage: IncidentStage;
  monitorEnabled: boolean;
  detectedDay: number | null;
  affected: number;
  missedHelp: number;
  replay: { attempted: number; outboundBefore: number; outboundAfter: number; partitions: number } | null;
  repairCases: number;
  history: { at: string; stage: IncidentStage; note: string }[];
}

export interface DataQualityCase {
  id: string;
  workspaceId: string;
  source: 'section-2' | 'reviewer' | 'incident' | 'engine';
  reason: string;
  openedAt: string;
  status: 'open' | 'resolved';
}

export interface AppAudit {
  at: string;
  module: 'Signal Desk' | 'Risk engine' | 'CRM' | 'Incident' | 'Account A' | 'Feedback' | 'Demo';
  text: string;
}

export interface RuleImprovement {
  at: string;
  text: string;
  basedOn: string;
}

interface Persisted {
  version: 3;
  reviews: ReviewDecision[];
  ledger: ReturnType<ActionService['serialize']> | null;
  audit: AppAudit[];
  crm: { associations: Association[]; audit: CrmAudit[] };
  incident: IncidentState;
  dq: DataQualityCase[];
  improvements: RuleImprovement[];
  reviewTimings: { workspaceId: string; ms: number }[];
}

const KEY = 'superchat-revops-demo-v3';

const initialIncident = (): IncidentState => ({
  stage: 'idle',
  monitorEnabled: true,
  detectedDay: null,
  affected: 0,
  missedHelp: 0,
  replay: null,
  repairCases: 0,
  history: [],
});

const initial = (): Persisted => ({
  version: 3,
  reviews: [],
  ledger: null,
  audit: [{ at: new Date().toISOString(), module: 'Demo', text: 'Demo state initialised. All integrations are simulated (dry-run).' }],
  crm: { associations: initialAssociations(), audit: [] },
  incident: initialIncident(),
  dq: [],
  improvements: [],
  reviewTimings: [],
});

function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Persisted;
      if (p.version === 3) return p;
    }
  } catch {
    /* storage unavailable or corrupt: start fresh */
  }
  return initial();
}

export interface DeskRow {
  snapshot: WorkspaceSnapshot;
  risk: RiskResult;
  latest?: ReviewDecision;
}

interface Ctx {
  state: Persisted;
  sim: SimResult;
  desk: DeskRow[];
  actions: ActionService;
  ledgerVersion: number;
  semanticHold: boolean;
  today: number;
  recordReview(input: { workspaceId: string; decision: ReviewDecisionKind; reason?: string; until?: string; reviewer: string }): ReviewDecision;
  checksFor(workspaceId: string, actionType: ActionType, templateId?: string): Promise<CheckResult[]>;
  requestAction(input: { workspaceId: string; actionType: ActionType; templateId?: string; requestedBy: string }): Promise<string>;
  requestConcurrent(input: { workspaceId: string; actionType: ActionType; templateId?: string; requestedBy: string }, n: number): Promise<string[]>;
  reconcile(key: string): Promise<void>;
  setNextOutcome(o: 'ok' | 'reject' | 'timeout'): void;
  openDq(c: Omit<DataQualityCase, 'id' | 'openedAt' | 'status'>): void;
  resolveDq(id: string): void;
  crmApprove(id: string, reviewer: string, evidence: string): CrmAudit;
  crmReject(id: string, reviewer: string, reason: string): CrmAudit;
  crmApply(actor: string): void;
  crmRollback(actor: string): void;
  setMonitor(on: boolean): void;
  incidentDetect(): void;
  incidentContain(): void;
  incidentAnalyze(): ImpactRow[];
  incidentReplay(): Promise<void>;
  incidentRestore(): void;
  incidentReset(): void;
  addImprovement(text: string, basedOn: string): void;
  logReviewTime(workspaceId: string, ms: number): void;
  log(module: AppAudit['module'], text: string): void;
  reset(): void;
}

const AppCtx = createContext<Ctx | null>(null);

export function useApp(): Ctx {
  const c = useContext(AppCtx);
  if (!c) throw new Error('useApp outside provider');
  return c;
}

const now = () => new Date().toISOString();

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(load);
  const actionsRef = useRef<ActionService>(ActionService.restore(state.ledger, LIVE_BILLING));
  const [ledgerVersion, setLedgerVersion] = useState(0);
  const sim = useMemo(() => simulate(DEFAULT_PARAMS), []);

  // Persist on every change.
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...state, ledger: actionsRef.current.serialize() }));
    } catch {
      /* storage full or blocked: the demo still works for this session */
    }
  }, [state, ledgerVersion]);

  useEffect(() => actionsRef.current.subscribe(() => setLedgerVersion((v) => v + 1)) as () => void, []);

  const log = useCallback((module: AppAudit['module'], text: string) => {
    setState((s) => ({ ...s, audit: [{ at: now(), module, text }, ...s.audit].slice(0, 400) }));
  }, []);

  const semanticHold = ['detected', 'contained', 'analyzed', 'replayed'].includes(state.incident.stage);

  const desk: DeskRow[] = useMemo(
    () =>
      SYNTHETIC_WORKSPACES.map((snapshot) => {
        const risk = scoreWorkspace(snapshot);
        const latest = [...state.reviews].reverse().find((r) => r.workspaceId === snapshot.workspaceId);
        return { snapshot, risk, latest };
      }),
    [state.reviews],
  );

  const recordReview: Ctx['recordReview'] = (input) => {
    const row = desk.find((d) => d.snapshot.workspaceId === input.workspaceId);
    if (!row) throw new Error('unknown workspace');
    const decision: ReviewDecision = {
      id: `rev-${Date.now().toString(36)}-${state.reviews.length}`,
      workspaceId: input.workspaceId,
      decision: input.decision,
      reason: input.reason,
      until: input.until,
      reviewer: input.reviewer,
      at: now(),
      computedState: row.risk.state,
      computedReasons: row.risk.reasons,
      modelVersion: row.risk.modelVersion,
      previousDecision: row.latest?.decision ?? 'NONE',
    };
    setState((s) => {
      const dq =
        input.decision === 'DATA_ISSUE'
          ? [{ id: `dq-${Date.now().toString(36)}`, workspaceId: input.workspaceId, source: 'reviewer' as const, reason: input.reason || 'Reviewer flagged a data issue', openedAt: now(), status: 'open' as const }, ...s.dq]
          : s.dq;
      return {
        ...s,
        reviews: [...s.reviews, decision],
        dq,
        audit: [
          {
            at: now(),
            module: 'Signal Desk' as const,
            text: `${input.reviewer} reviewed ${input.workspaceId}: ${decision.previousDecision} → ${input.decision}${input.reason ? ` (${input.reason})` : ''}. Computed state ${row.risk.state} (${row.risk.modelVersion}) preserved unchanged.`,
          },
          ...s.audit,
        ],
      };
    });
    return decision;
  };

  const checksFor: Ctx['checksFor'] = async (workspaceId, actionType, templateId) => {
    const row = desk.find((d) => d.snapshot.workspaceId === workspaceId)!;
    const svc = actionsRef.current;
    const live = await svc.adapter.billingStatus(workspaceId);
    const fresh = scoreWorkspace(row.snapshot);
    const key = actionKey(workspaceId, fresh.primaryReason, actionType, DESK_TODAY);
    return preActionChecks({
      snapshot: row.snapshot,
      risk: fresh,
      latestDecision: row.latest,
      actionType,
      templateId,
      liveBillingStatus: live,
      existingKeyStatus: svc.entries.get(key)?.status,
      semanticHold,
      today: DESK_TODAY,
    });
  };

  const doRequest = async (input: { workspaceId: string; actionType: ActionType; templateId?: string; requestedBy: string }) => {
    const row = desk.find((d) => d.snapshot.workspaceId === input.workspaceId)!;
    const checks = await checksFor(input.workspaceId, input.actionType, input.templateId);
    const reasonCode: ReasonCode = scoreWorkspace(row.snapshot).primaryReason;
    return actionsRef.current.request({ ...input, reasonCode, day: DESK_TODAY, checks });
  };

  const requestAction: Ctx['requestAction'] = async (input) => {
    const r = await doRequest(input);
    log('Signal Desk', `${input.actionType} for ${input.workspaceId}: ${r.outcome}${r.entry.externalRef ? ` (${r.entry.externalRef})` : ''} · key ${r.entry.key}`);
    return r.outcome;
  };

  const requestConcurrent: Ctx['requestConcurrent'] = async (input, n) => {
    const row = desk.find((d) => d.snapshot.workspaceId === input.workspaceId)!;
    const checks = await checksFor(input.workspaceId, input.actionType, input.templateId);
    const reasonCode = scoreWorkspace(row.snapshot).primaryReason;
    const results = await Promise.all(Array.from({ length: n }, () => actionsRef.current.request({ ...input, reasonCode, day: DESK_TODAY, checks })));
    const outcomes = results.map((r) => r.outcome);
    log('Signal Desk', `${n} concurrent ${input.actionType} requests for ${input.workspaceId}: ${outcomes.join(', ')}`);
    return outcomes;
  };

  const reconcile: Ctx['reconcile'] = async (key) => {
    const e = await actionsRef.current.reconcile(key);
    log('Signal Desk', `Reconciled ${key}: ${e?.status}${e?.externalRef ? ` (${e.externalRef})` : ''}`);
  };

  const pushIncident = (s: Persisted, stage: IncidentStage, note: string, patch: Partial<IncidentState> = {}): Persisted => ({
    ...s,
    incident: { ...s.incident, ...patch, stage, history: [...s.incident.history, { at: now(), stage, note }] },
    audit: [{ at: now(), module: 'Incident' as const, text: note }, ...s.audit],
  });

  const ctx: Ctx = {
    state,
    sim,
    desk,
    actions: actionsRef.current,
    ledgerVersion,
    semanticHold,
    today: DESK_TODAY,
    recordReview,
    checksFor,
    requestAction,
    requestConcurrent,
    reconcile,
    setNextOutcome: (o) => {
      actionsRef.current.adapter.nextOutcome = o;
      setLedgerVersion((v) => v + 1);
    },
    openDq: (c) =>
      setState((s) => {
        if (s.dq.some((d) => d.workspaceId === c.workspaceId && d.status === 'open' && d.source === c.source)) return s;
        return {
          ...s,
          dq: [{ ...c, id: `dq-${Date.now().toString(36)}-${s.dq.length}`, openedAt: now(), status: 'open' }, ...s.dq],
          audit: [{ at: now(), module: c.source === 'section-2' ? 'Account A' : 'Signal Desk', text: `Data-quality case opened for ${c.workspaceId}: ${c.reason}` }, ...s.audit],
        };
      }),
    resolveDq: (id) =>
      setState((s) => ({
        ...s,
        dq: s.dq.map((d) => (d.id === id ? { ...d, status: 'resolved' } : d)),
        audit: [{ at: now(), module: 'Signal Desk', text: `Data-quality case ${id} resolved` }, ...s.audit],
      })),
    crmApprove: (id, reviewer, evidence) => {
      const r = crmApprove(state.crm.associations, id, reviewer, evidence);
      setState((s) => ({ ...s, crm: { associations: r.list, audit: [r.audit, ...s.crm.audit] } }));
      return r.audit;
    },
    crmReject: (id, reviewer, reason) => {
      const r = crmReject(state.crm.associations, id, reviewer, reason);
      setState((s) => ({ ...s, crm: { associations: r.list, audit: [r.audit, ...s.crm.audit] } }));
      return r.audit;
    },
    crmApply: (actor) => {
      const r = applyVerified(state.crm.associations, actor);
      setState((s) => ({ ...s, crm: { associations: r.list, audit: [...r.audit, ...s.crm.audit] } }));
    },
    crmRollback: (actor) => {
      const r = rollbackApplied(state.crm.associations, actor);
      setState((s) => ({ ...s, crm: { associations: r.list, audit: [...r.audit, ...s.crm.audit] } }));
    },
    setMonitor: (on) => setState((s) => ({ ...s, incident: { ...s.incident, monitorEnabled: on } })),
    incidentDetect: () =>
      setState((s) => {
        const d = detectionDay(sim, s.incident.monitorEnabled);
        return pushIncident(
          s,
          'detected',
          s.incident.monitorEnabled
            ? `Semantic-integrity monitor alerted on day ${d}: workflow_edited coverage above the frozen baseline with no lift in verified executions.`
            : `No monitor: noticed by a person on day ${d}.`,
          { detectedDay: d },
        );
      }),
    incidentContain: () =>
      setState((s) =>
        pushIncident(s, 'contained', 'Contained: edit-derived HubSpot fields and edit-dependent actions held. Execution-based risk, billing and messaging signals keep syncing.'),
      ),
    incidentAnalyze: () => {
      const d = state.incident.detectedDay ?? detectionDay(sim, state.incident.monitorEnabled);
      const rows = impactAnalysis(sim, d);
      const missed = rows.filter((r) => r.category === 'missed_help').length;
      setState((s) =>
        pushIncident(s, 'analyzed', `Impact analysis through day ${d}: ${rows.length} workspaces diverged on the edit proxy; ${missed} had a review suppressed. Execution-based states unchanged.`, {
          affected: rows.length,
          missedHelp: missed,
        }),
      );
      return rows;
    },
    incidentReplay: async () => {
      const d = state.incident.detectedDay ?? detectionDay(sim, state.incident.monitorEnabled);
      const rows = impactAnalysis(sim, d).filter((r) => r.category === 'missed_help');
      const svc = actionsRef.current;
      const before = svc.adapter.outbox.length;
      svc.outboundEnabled = false;
      try {
        for (const r of rows)
          await svc.request({ workspaceId: r.workspaceId, actionType: 'ssf_nudge', reasonCode: 'NO_VERIFIED_RUN_14D', day: d, requestedBy: 'historical-replay', checks: [] });
      } finally {
        svc.outboundEnabled = true;
      }
      const after = svc.adapter.outbox.length;
      const partitions = d - sim.params.startDay + 1;
      setState((s) =>
        pushIncident(
          s,
          'replayed',
          `Isolated replay of ${partitions} daily partitions (lookback + incident) with a versioned exclusion of migration edits. ${rows.length} historical actions re-evaluated with outbound disabled; outbox ${before} → ${after}. No Airbyte resync needed.`,
          { replay: { attempted: rows.length, outboundBefore: before, outboundAfter: after, partitions } },
        ),
      );
    },
    incidentRestore: () =>
      setState((s) => {
        const n = s.incident.missedHelp;
        const repair: DataQualityCase = {
          id: `dq-incident-${Date.now().toString(36)}`,
          workspaceId: `${n} SIM workspaces`,
          source: 'incident',
          reason: `Incident repair: re-check ${n} workspaces whose reviews were suppressed, against CURRENT eligibility. No automatic outreach.`,
          openedAt: now(),
          status: 'open',
        };
        return pushIncident({ ...s, dq: [repair, ...s.dq] }, 'restored', `Restored: corrected current-state fields approved for sync; hold released; ${n} repair reviews queued; regression check added (system edits never count as engagement).`, {
          repairCases: n,
        });
      }),
    incidentReset: () => setState((s) => ({ ...s, incident: { ...initialIncident(), monitorEnabled: s.incident.monitorEnabled } })),
    addImprovement: (text, basedOn) =>
      setState((s) => ({
        ...s,
        improvements: [{ at: now(), text, basedOn }, ...s.improvements],
        audit: [{ at: now(), module: 'Feedback', text: `Rule/playbook improvement logged: ${text}` }, ...s.audit],
      })),
    logReviewTime: (workspaceId, ms) => setState((s) => ({ ...s, reviewTimings: [...s.reviewTimings, { workspaceId, ms }] })),
    log,
    reset: () => {
      try {
        localStorage.removeItem(KEY);
      } catch {
        /* ignore */
      }
      actionsRef.current = ActionService.restore(null, LIVE_BILLING);
      actionsRef.current.subscribe(() => setLedgerVersion((v) => v + 1));
      setState(initial());
      setLedgerVersion((v) => v + 1);
    },
  };

  return <AppCtx.Provider value={ctx}>{children}</AppCtx.Provider>;
}
