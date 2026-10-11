/**
 * Section 5 CRM model. Records are the case-study rows from the brief; the
 * Users, Contacts, Companies and the Deal are the minimum implied by those rows
 * (each Workspace has its own CB Subscription; m.weber appears on three
 * Workspaces; Jonas owns the GmbH Workspace).
 *
 * Source associations (written by the backend / existing HubSpot workflows)
 * are immutable here. Proposed associations need evidence and a named reviewer
 * before approval, are written by exactly one designated writer, and every
 * change is appended to an audit log that supports rollback.
 */
export type ObjectType = 'workspace' | 'user' | 'contact' | 'company' | 'lead' | 'deal' | 'subscription';

export interface CrmObject {
  id: string;
  type: ObjectType;
  label: string;
  meta: Record<string, string | number>;
}

export type AssocType =
  | 'workspace_subscription'
  | 'workspace_user'
  | 'user_contact'
  | 'workspace_deal'
  | 'workspace_operating_company'
  | 'subscription_billto_company'
  | 'company_parent'
  | 'deal_buying_company';

export type AssocStatus = 'source' | 'unverified' | 'proposed' | 'verified' | 'applied' | 'rejected' | 'rolled_back';

export interface Association {
  id: string;
  type: AssocType;
  from: string;
  to: string;
  status: AssocStatus;
  /** The single system or team allowed to write this association type. */
  writer: string;
  evidence?: string;
  reviewer?: string;
  note?: string;
}

export const ASSOC_WRITER: Record<AssocType, string> = {
  workspace_subscription: 'Backend sync (immutable here)',
  workspace_user: 'Backend sync (immutable here)',
  user_contact: 'HubSpot association workflow',
  workspace_deal: 'Sales (AE)',
  workspace_operating_company: 'RevOps association writer',
  subscription_billto_company: 'Finance-approved writer',
  company_parent: 'RevOps association writer',
  deal_buying_company: 'Sales (AE)',
};

export const OBJECTS: CrmObject[] = [
  { id: 'ws-mitte', type: 'workspace', label: 'Beauty Lounge Mitte', meta: { plan: 'Pro', seats: 8, motion: 'self_signup', owner: '—' } },
  { id: 'ws-charl', type: 'workspace', label: 'Beauty Lounge Charlottenburg', meta: { plan: 'Pro', seats: 6, motion: 'self_signup', owner: '—' } },
  { id: 'ws-spandau', type: 'workspace', label: 'Beauty Lounge Spandau', meta: { plan: 'Starter', seats: 4, motion: 'self_signup', owner: '—' } },
  { id: 'ws-gmbh', type: 'workspace', label: 'Beauty Lounge GmbH', meta: { plan: 'Business', seats: 25, motion: 'sales_led', owner: 'Jonas (AE)' } },
  { id: 'ws-physio', type: 'workspace', label: 'Physio Nord Hamburg', meta: { plan: 'Pro', seats: 11, motion: 'self_signup', owner: '—' } },
  { id: 'ws-milo', type: 'workspace', label: 'Café Milo', meta: { plan: 'Starter', seats: 3, motion: 'self_signup', owner: '—' } },
  { id: 'sub-mitte', type: 'subscription', label: 'CB sub · Mitte', meta: { authority: 'Chargebee' } },
  { id: 'sub-charl', type: 'subscription', label: 'CB sub · Charlottenburg', meta: { authority: 'Chargebee' } },
  { id: 'sub-spandau', type: 'subscription', label: 'CB sub · Spandau', meta: { authority: 'Chargebee' } },
  { id: 'sub-gmbh', type: 'subscription', label: 'CB sub · GmbH', meta: { authority: 'Chargebee' } },
  { id: 'sub-physio', type: 'subscription', label: 'CB sub · Physio Nord', meta: { authority: 'Chargebee' } },
  { id: 'sub-milo', type: 'subscription', label: 'CB sub · Café Milo', meta: { authority: 'Chargebee' } },
  { id: 'u-weber-mitte', type: 'user', label: 'User m.weber @ Mitte', meta: { login: 'login-weber' } },
  { id: 'u-weber-charl', type: 'user', label: 'User m.weber @ Charlottenburg', meta: { login: 'login-weber' } },
  { id: 'u-weber-gmbh', type: 'user', label: 'User m.weber @ GmbH', meta: { login: 'login-weber' } },
  { id: 'u-krause-spandau', type: 'user', label: 'User s.krause @ Spandau', meta: { login: 'login-krause' } },
  { id: 'u-physio', type: 'user', label: 'User kontakt @ Physio Nord', meta: { login: 'login-physio' } },
  { id: 'u-milo', type: 'user', label: 'User hallo @ Café Milo', meta: { login: 'login-milo' } },
  { id: 'c-weber', type: 'contact', label: 'm.weber@beautylounge.de', meta: {} },
  { id: 'c-krause', type: 'contact', label: 's.krause@beautylounge.de', meta: {} },
  { id: 'c-physio', type: 'contact', label: 'kontakt@physio-nord.de', meta: {} },
  { id: 'c-milo', type: 'contact', label: 'hallo@cafemilo.de', meta: {} },
  { id: 'co-bl-domain', type: 'company', label: 'beautylounge.de (auto-created from domain)', meta: { created: 'HubSpot domain auto-create', verified: 'no' } },
  { id: 'co-bl-gmbh', type: 'company', label: 'Beauty Lounge GmbH (legal entity)', meta: { created: 'Proposed — needs Sales/Finance confirmation', verified: 'pending' } },
  { id: 'deal-gmbh', type: 'deal', label: 'Deal · Beauty Lounge GmbH (Jonas)', meta: { owner: 'Jonas (AE)' } },
];

let seq = 0;
const A = (type: AssocType, from: string, to: string, status: AssocStatus, note?: string): Association => ({
  id: `as-${++seq}`,
  type,
  from,
  to,
  status,
  writer: ASSOC_WRITER[type],
  note,
});

/** How the CRM looks today, per the brief. */
export function initialAssociations(): Association[] {
  seq = 0;
  return [
    A('workspace_subscription', 'ws-mitte', 'sub-mitte', 'source'),
    A('workspace_subscription', 'ws-charl', 'sub-charl', 'source'),
    A('workspace_subscription', 'ws-spandau', 'sub-spandau', 'source'),
    A('workspace_subscription', 'ws-gmbh', 'sub-gmbh', 'source'),
    A('workspace_subscription', 'ws-physio', 'sub-physio', 'source'),
    A('workspace_subscription', 'ws-milo', 'sub-milo', 'source'),
    A('workspace_user', 'ws-mitte', 'u-weber-mitte', 'source'),
    A('workspace_user', 'ws-charl', 'u-weber-charl', 'source'),
    A('workspace_user', 'ws-gmbh', 'u-weber-gmbh', 'source'),
    A('workspace_user', 'ws-spandau', 'u-krause-spandau', 'source'),
    A('workspace_user', 'ws-physio', 'u-physio', 'source'),
    A('workspace_user', 'ws-milo', 'u-milo', 'source'),
    A('user_contact', 'u-weber-mitte', 'c-weber', 'source'),
    A('user_contact', 'u-weber-charl', 'c-weber', 'source'),
    A('user_contact', 'u-weber-gmbh', 'c-weber', 'source'),
    A('user_contact', 'u-krause-spandau', 'c-krause', 'source'),
    A('user_contact', 'u-physio', 'c-physio', 'source'),
    A('user_contact', 'u-milo', 'c-milo', 'source'),
    A('workspace_deal', 'ws-gmbh', 'deal-gmbh', 'source'),
    A('workspace_operating_company', 'ws-gmbh', 'co-bl-domain', 'unverified', 'Populated by a domain-based workflow; inconsistent across workspaces'),
    // Proposed by the redesign; each needs evidence + reviewer before it may be written.
    A('workspace_operating_company', 'ws-gmbh', 'co-bl-gmbh', 'proposed', 'Operating entity for the Sales-led workspace'),
    A('workspace_operating_company', 'ws-mitte', 'co-bl-gmbh', 'proposed', 'Only if Sales/Finance confirm GmbH operates Mitte'),
    A('workspace_operating_company', 'ws-charl', 'co-bl-gmbh', 'proposed', 'Only if confirmed'),
    A('workspace_operating_company', 'ws-spandau', 'co-bl-gmbh', 'proposed', 'Only if confirmed'),
    A('subscription_billto_company', 'sub-gmbh', 'co-bl-gmbh', 'proposed', 'Payer per Chargebee account data'),
    A('deal_buying_company', 'deal-gmbh', 'co-bl-gmbh', 'proposed', 'Buying Company confirmed by AE'),
  ];
}

export interface AuditEntry {
  at: string;
  actor: string;
  action: 'approve' | 'reject' | 'apply' | 'rollback' | 'blocked';
  associationId?: string;
  before?: AssocStatus;
  after?: AssocStatus;
  detail: string;
}

export const objectById = (id: string) => OBJECTS.find((o) => o.id === id);

export function approve(list: Association[], id: string, reviewer: string, evidence: string): { list: Association[]; audit: AuditEntry } {
  const a = list.find((x) => x.id === id);
  const at = new Date().toISOString();
  if (!a) throw new Error('unknown association');
  if (a.status === 'source') return { list, audit: { at, actor: reviewer || 'unknown', action: 'blocked', associationId: id, detail: 'Source associations are immutable; proposals cannot overwrite them.' } };
  if (a.status !== 'proposed') return { list, audit: { at, actor: reviewer || 'unknown', action: 'blocked', associationId: id, detail: `Only proposed associations can be approved (status: ${a.status}).` } };
  if (!reviewer.trim() || !evidence.trim())
    return { list, audit: { at, actor: reviewer || 'unknown', action: 'blocked', associationId: id, detail: 'Approval needs a named reviewer and a verification source.' } };
  return {
    list: list.map((x) => (x.id === id ? { ...x, status: 'verified', reviewer, evidence } : x)),
    audit: { at, actor: reviewer, action: 'approve', associationId: id, before: 'proposed', after: 'verified', detail: `Verified via: ${evidence}` },
  };
}

export function reject(list: Association[], id: string, reviewer: string, reason: string) {
  const a = list.find((x) => x.id === id);
  const at = new Date().toISOString();
  if (!a || a.status !== 'proposed' || !reviewer.trim() || !reason.trim())
    return { list, audit: { at, actor: reviewer || 'unknown', action: 'blocked' as const, associationId: id, detail: 'Rejection needs a proposed association, reviewer and reason.' } };
  return {
    list: list.map((x) => (x.id === id ? { ...x, status: 'rejected' as const, reviewer, note: reason } : x)),
    audit: { at, actor: reviewer, action: 'reject' as const, associationId: id, before: 'proposed' as const, after: 'rejected' as const, detail: reason },
  };
}

/** Migration preview: what applying verified links would write, and by whom. */
export function migrationPreview(list: Association[]) {
  return list.filter((a) => a.status === 'verified').map((a) => ({ ...a, writeAs: a.writer }));
}

export function applyVerified(list: Association[], actor: string) {
  const at = new Date().toISOString();
  const audit: AuditEntry[] = [];
  const next = list.map((a) => {
    if (a.status !== 'verified') return a;
    audit.push({ at, actor, action: 'apply', associationId: a.id, before: 'verified', after: 'applied', detail: `Written by ${a.writer} (pilot batch)` });
    return { ...a, status: 'applied' as const };
  });
  return { list: next, audit };
}

/** Rolls back only associations written by this redesign. Source links are never touched. */
export function rollbackApplied(list: Association[], actor: string) {
  const at = new Date().toISOString();
  const audit: AuditEntry[] = [];
  const next = list.map((a) => {
    if (a.status !== 'applied') return a;
    audit.push({ at, actor, action: 'rollback', associationId: a.id, before: 'applied', after: 'rolled_back', detail: 'Restored from change log' });
    return { ...a, status: 'rolled_back' as const };
  });
  return { list: next, audit };
}

/**
 * Deliberately refuses to group Workspaces by email domain or shared contact.
 * Returns the refusal so the UI can show it; it never produces a grouping.
 */
export function groupByEmailDomain(): { allowed: false; reason: string } {
  return {
    allowed: false,
    reason:
      'Refused: a shared email domain or shared Contact does not establish common legal ownership or a common payer. Group only via verified operating / bill-to Company associations.',
  };
}

const live = (s: AssocStatus) => s === 'verified' || s === 'applied';

/** Seat roll-up per Company, counting ONLY verified/applied operating links. */
export function seatRollup(list: Association[]) {
  const out = new Map<string, { company: string; workspaces: string[]; seats: number }>();
  list
    .filter((a) => a.type === 'workspace_operating_company' && live(a.status))
    .forEach((a) => {
      const ws = objectById(a.from)!;
      const co = objectById(a.to)!;
      const r = out.get(co.id) ?? { company: co.label, workspaces: [], seats: 0 };
      r.workspaces.push(ws.label);
      r.seats += Number(ws.meta.seats);
      out.set(co.id, r);
    });
  return [...out.values()];
}

/** Workspaces that share a Contact: useful to surface, never proof of common ownership. */
export function sharedContacts(list: Association[]) {
  const byContact = new Map<string, Set<string>>();
  const userWs = new Map(list.filter((a) => a.type === 'workspace_user').map((a) => [a.to, a.from]));
  list
    .filter((a) => a.type === 'user_contact')
    .forEach((a) => {
      const ws = userWs.get(a.from);
      if (!ws) return;
      const s = byContact.get(a.to) ?? new Set();
      s.add(ws);
      byContact.set(a.to, s);
    });
  return [...byContact.entries()].filter(([, s]) => s.size > 1).map(([c, s]) => ({ contact: objectById(c)!.label, workspaces: [...s].map((w) => objectById(w)!.label) }));
}

export function dataQualityIssues(list: Association[]) {
  const wsWithCompany = new Set(list.filter((a) => a.type === 'workspace_operating_company' && live(a.status)).map((a) => a.from));
  const unverified = list.filter((a) => a.status === 'unverified');
  const issues: { severity: 'high' | 'medium'; text: string }[] = [];
  OBJECTS.filter((o) => o.type === 'workspace' && !wsWithCompany.has(o.id)).forEach((o) =>
    issues.push({ severity: 'medium', text: `${o.label}: no verified operating Company` }),
  );
  unverified.forEach((a) => issues.push({ severity: 'high', text: `${objectById(a.from)!.label} → ${objectById(a.to)!.label}: unverified domain-based link` }));
  sharedContacts(list).forEach((s) => issues.push({ severity: 'medium', text: `${s.contact} is a Contact on ${s.workspaces.length} Workspaces; this is not proof of common ownership` }));
  return issues;
}
