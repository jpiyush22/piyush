/**
 * Guarded actions (Sections 4 and 7). Every customer-facing or CSx action goes
 * through: live pre-action checks → an atomic claim of a unique action key →
 * dispatch through an adapter → a ledger entry with its full status history.
 *
 * Only a DRY-RUN adapter exists in this app. It never touches the network; it
 * writes to an in-memory simulated outbox so delivery can be inspected and
 * reconciled. Production adapters (HubSpot tasks, lifecycle messaging, Make/n8n
 * webhooks) would implement the same interface behind server-side credentials.
 */
import { RULES, type ReasonCode, type RiskResult, type WorkspaceSnapshot } from './risk';

export type ActionType = 'csx_task' | 'ssf_nudge';
export type LedgerStatus = 'pending' | 'approved' | 'suppressed' | 'dispatched' | 'failed' | 'reconciled';
export type ReviewDecisionKind = 'CONFIRMED' | 'FALSE_POSITIVE' | 'SNOOZED' | 'DATA_ISSUE';

export interface ApprovedTemplate {
  id: string;
  name: string;
  forReasons: ReasonCode[];
  body: string;
}

/** Content approved by Lifecycle. SSF nudges may only use these. */
export const APPROVED_SSF_TEMPLATES: ApprovedTemplate[] = [
  {
    id: 'tpl-first-workflow-run',
    name: 'Get your first workflow running',
    forReasons: ['NO_VERIFIED_RUN_14D', 'MESSAGING_DECLINE'],
    body: 'A three-step guide to checking that your automations are active and running.',
  },
  {
    id: 'tpl-build-first-workflow',
    name: 'Build your first workflow',
    forReasons: ['NO_DEPTH_ADOPTION'],
    body: 'Templates and workflows that teams in your industry set up first.',
  },
];

export interface ReviewDecision {
  id: string;
  workspaceId: string;
  decision: ReviewDecisionKind;
  reason?: string;
  until?: string;
  reviewer: string;
  at: string;
  /** The engine's computed result at decision time, preserved separately and never overwritten. */
  computedState: string;
  computedReasons: ReasonCode[];
  modelVersion: string;
  previousDecision: ReviewDecisionKind | 'NONE';
}

export interface CheckResult {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
}

export interface CheckContext {
  snapshot: WorkspaceSnapshot;
  /** A FRESH re-score of the current snapshot (revalidation, not the cached flag). */
  risk: RiskResult;
  latestDecision?: ReviewDecision;
  actionType: ActionType;
  templateId?: string;
  liveBillingStatus: 'active' | 'cancelled' | 'downgraded' | 'unknown';
  existingKeyStatus?: LedgerStatus;
  /** Section 6: semantic-integrity hold on edit-derived outputs. */
  semanticHold: boolean;
  /** Today's day number on the snapshot's timeline. */
  today: number;
}

export function actionKey(workspaceId: string, reason: ReasonCode, type: ActionType, day: number): string {
  return `${workspaceId}:${reason}:${type}:cw${Math.floor(day / RULES.cooldownDays)}`;
}

/** Live checks run immediately before any action. All must pass. */
export function preActionChecks(c: CheckContext): CheckResult[] {
  const s = c.snapshot;
  const checks: CheckResult[] = [];
  const add = (id: string, label: string, ok: boolean, detail: string) => checks.push({ id, label, ok, detail });

  add('reviewer_confirmed', 'Reviewer confirmed the risk', c.latestDecision?.decision === 'CONFIRMED', c.latestDecision ? `Latest decision: ${c.latestDecision.decision}` : 'No review recorded');
  add('motion_matches', 'Action matches acquisition motion', (c.actionType === 'csx_task') === (s.motion === 'Sales-led'), c.actionType === 'csx_task' ? 'CSx tasks are for Sales-led accounts' : 'SSF nudges are for self-signup accounts');
  add('subscription_active', 'Chargebee subscription active (live check)', c.liveBillingStatus === 'active', `Live status: ${c.liveBillingStatus}`);
  add('risk_revalidated', 'Risk still flagged on re-score', c.risk.state === 'WATCH' || c.risk.state === 'AT RISK', `Re-scored now: ${c.risk.state}`);
  add('evidence_confident', 'Evidence confidence is high', c.risk.confidence === 'HIGH', `Confidence: ${c.risk.confidence}`);
  add('risk_fresh', `Score fresh (≤ ${RULES.freshnessWindowHours}h)`, s.sourceFreshnessHours <= RULES.freshnessWindowHours, `Source age ${s.sourceFreshnessHours}h`);
  add('owner_assigned', s.motion === 'Sales-led' ? 'CSx owner assigned' : 'Lifecycle owner assigned', !!s.owner, s.owner ? `Owner: ${s.owner}` : 'No owner in HubSpot');
  if (c.actionType === 'ssf_nudge') {
    add('consent', 'Customer has not opted out', !s.optedOut, s.optedOut ? 'Opted out of lifecycle email' : 'Consent on record');
    const tpl = APPROVED_SSF_TEMPLATES.find((t) => t.id === c.templateId);
    add('template_approved', 'Approved template for this reason', !!tpl && tpl.forReasons.some((r) => c.risk.reasons.includes(r)), tpl ? `Template: ${tpl.name}` : 'No approved template selected');
  }
  const since = s.lastContactDay == null ? null : c.today - s.lastContactDay;
  add('cooldown', `No contact in the last ${RULES.cooldownDays} days`, since == null || since >= RULES.cooldownDays, since == null ? 'No previous contact' : `Last contact ${since}d ago`);
  add(
    'no_prior_action',
    'No earlier action under this key',
    !c.existingKeyStatus || c.existingKeyStatus === 'failed',
    c.existingKeyStatus ? `Existing entry: ${c.existingKeyStatus}` : 'Key unclaimed',
  );
  const editDerived = c.risk.reasons.includes('EDIT_RECENCY_PROXY_LOW_CONFIDENCE');
  add('semantic_hold', 'Not held by a semantic-integrity incident', !(c.semanticHold && editDerived), c.semanticHold ? (editDerived ? 'Edit-derived reason is on hold' : 'Hold active, but this reason is execution-based') : 'No hold active');
  return checks;
}

export interface LedgerEvent {
  at: string;
  status: LedgerStatus;
  note: string;
}

export interface LedgerEntry {
  id: string;
  key: string;
  workspaceId: string;
  actionType: ActionType;
  reasonCode: ReasonCode;
  status: LedgerStatus;
  dryRun: true;
  templateId?: string;
  externalRef: string | null;
  requestedBy: string;
  createdAt: string;
  updatedAt: string;
  history: LedgerEvent[];
  failedChecks: string[];
}

export type DispatchOutcome = 'ok' | 'reject' | 'timeout';

/** The adapter boundary. Production would add HubSpot / messaging implementations. */
export interface DispatchAdapter {
  readonly mode: 'dry-run';
  dispatch(entry: LedgerEntry): Promise<{ ok: true; externalRef: string } | { ok: false; error: 'rejected' | 'timeout' }>;
  /** Look up whether a request with this key reached the destination. */
  lookup(key: string): Promise<string | null>;
  billingStatus(workspaceId: string): Promise<'active' | 'cancelled' | 'downgraded' | 'unknown'>;
}

/**
 * Simulated HubSpot / lifecycle / Chargebee. No network calls. `nextOutcome`
 * lets the demo force a rejected or timed-out delivery. A timeout still
 * DELIVERS (the response is what's lost), which is why blind retries are unsafe.
 */
export class DryRunAdapter implements DispatchAdapter {
  readonly mode = 'dry-run' as const;
  outbox: { key: string; externalRef: string; at: string }[] = [];
  nextOutcome: DispatchOutcome = 'ok';
  billing: Record<string, 'active' | 'cancelled' | 'downgraded'> = {};
  private seq = 1000;

  constructor(init?: { outbox?: DryRunAdapter['outbox']; billing?: DryRunAdapter['billing']; seq?: number }) {
    if (init?.outbox) this.outbox = init.outbox;
    if (init?.billing) this.billing = init.billing;
    if (init?.seq) this.seq = init.seq;
  }

  async dispatch(entry: LedgerEntry) {
    const outcome = this.nextOutcome;
    this.nextOutcome = 'ok';
    await Promise.resolve();
    if (outcome === 'reject') return { ok: false as const, error: 'rejected' as const };
    const externalRef = `${entry.actionType === 'csx_task' ? 'sim-task' : 'sim-msg'}-${++this.seq}`;
    this.outbox.push({ key: entry.key, externalRef, at: new Date().toISOString() });
    if (outcome === 'timeout') return { ok: false as const, error: 'timeout' as const };
    return { ok: true as const, externalRef };
  }

  async lookup(key: string) {
    return this.outbox.find((o) => o.key === key)?.externalRef ?? null;
  }

  async billingStatus(workspaceId: string) {
    return this.billing[workspaceId] ?? 'unknown';
  }

  get sequence() {
    return this.seq;
  }
}

export interface ActionRequest {
  workspaceId: string;
  actionType: ActionType;
  reasonCode: ReasonCode;
  day: number;
  templateId?: string;
  requestedBy: string;
  checks: CheckResult[];
}

export type RequestOutcome = 'dispatched' | 'suppressed' | 'duplicate' | 'failed' | 'uncertain' | 'outbound_disabled';

let idSeq = 0;
const nowIso = () => new Date().toISOString();

/**
 * The action ledger. `claim` is a synchronous test-and-set, so two requests in
 * the same JS event loop can never both claim a key; it stands in for
 * `INSERT … ON CONFLICT DO NOTHING` on a `UNIQUE(action_key)` column in
 * production. Looking up existing HubSpot tasks is NOT used as the guard.
 */
export class ActionService {
  entries = new Map<string, LedgerEntry>();
  suppressed: LedgerEntry[] = [];
  /** False during Section 6 historical replay: nothing may be dispatched. */
  outboundEnabled = true;
  private listeners = new Set<() => void>();

  constructor(public adapter: DryRunAdapter) {}

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  private emit() {
    this.listeners.forEach((f) => f());
  }

  private newEntry(req: ActionRequest, key: string, status: LedgerStatus, note: string): LedgerEntry {
    const at = nowIso();
    return {
      id: `act-${Date.now().toString(36)}-${++idSeq}`,
      key,
      workspaceId: req.workspaceId,
      actionType: req.actionType,
      reasonCode: req.reasonCode,
      status,
      dryRun: true,
      templateId: req.templateId,
      externalRef: null,
      requestedBy: req.requestedBy,
      createdAt: at,
      updatedAt: at,
      history: [{ at, status, note }],
      failedChecks: req.checks.filter((c) => !c.ok).map((c) => c.label),
    };
  }

  private transition(e: LedgerEntry, status: LedgerStatus, note: string, externalRef?: string | null) {
    e.status = status;
    e.updatedAt = nowIso();
    if (externalRef !== undefined) e.externalRef = externalRef;
    e.history.push({ at: e.updatedAt, status, note });
  }

  /** Atomic claim of a key. Returns false if the key is already held. */
  claim(key: string, entry: LedgerEntry): boolean {
    const existing = this.entries.get(key);
    if (existing && existing.status !== 'failed') return false;
    this.entries.set(key, entry);
    return true;
  }

  async request(req: ActionRequest): Promise<{ outcome: RequestOutcome; entry: LedgerEntry }> {
    const key = actionKey(req.workspaceId, req.reasonCode, req.actionType, req.day);
    if (!this.outboundEnabled) {
      const e = this.newEntry(req, key, 'suppressed', 'Outbound disabled (historical replay). Nothing was sent.');
      this.suppressed.push(e);
      this.emit();
      return { outcome: 'outbound_disabled', entry: e };
    }
    const failed = req.checks.filter((c) => !c.ok && c.id !== 'no_prior_action');
    if (failed.length) {
      const e = this.newEntry(req, key, 'suppressed', `Blocked by checks: ${failed.map((f) => f.label).join('; ')}`);
      this.suppressed.push(e);
      this.emit();
      return { outcome: 'suppressed', entry: e };
    }
    const entry = this.newEntry(req, key, 'pending', 'Key claimed');
    if (!this.claim(key, entry)) {
      const holder = this.entries.get(key)!;
      const dup = this.newEntry(req, key, 'suppressed', `Duplicate: key already claimed (${holder.status})`);
      this.suppressed.push(dup);
      this.emit();
      return { outcome: 'duplicate', entry: dup };
    }
    this.transition(entry, 'approved', 'All live checks passed');
    this.emit();
    const res = await this.adapter.dispatch(entry);
    if (res.ok) {
      this.transition(entry, 'dispatched', `Dry-run delivery recorded (${this.adapter.mode})`, res.externalRef);
      this.emit();
      return { outcome: 'dispatched', entry };
    }
    if (res.error === 'timeout') {
      this.transition(entry, 'pending', 'Outcome uncertain (timeout). Reconcile before any retry.');
      this.emit();
      return { outcome: 'uncertain', entry };
    }
    this.transition(entry, 'failed', 'Destination rejected the request. Safe to retry.');
    this.emit();
    return { outcome: 'failed', entry };
  }

  /** Resolve a pending/uncertain entry by asking the destination, never by resending. */
  async reconcile(key: string): Promise<LedgerEntry | null> {
    const e = this.entries.get(key);
    if (!e || e.status !== 'pending') return e ?? null;
    const ref = await this.adapter.lookup(key);
    if (ref) this.transition(e, 'reconciled', 'Found at destination; no resend needed', ref);
    else this.transition(e, 'failed', 'Not found at destination; safe to retry');
    this.emit();
    return e;
  }

  all(): LedgerEntry[] {
    return [...this.entries.values(), ...this.suppressed].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  serialize() {
    return {
      entries: [...this.entries.values()],
      suppressed: this.suppressed,
      outbox: this.adapter.outbox,
      seq: this.adapter.sequence,
    };
  }

  static restore(data: ReturnType<ActionService['serialize']> | null, billing: DryRunAdapter['billing']): ActionService {
    const svc = new ActionService(new DryRunAdapter({ outbox: data?.outbox ?? [], billing, seq: data?.seq }));
    data?.entries.forEach((e) => svc.entries.set(e.key, e));
    svc.suppressed = data?.suppressed ?? [];
    return svc;
  }
}
