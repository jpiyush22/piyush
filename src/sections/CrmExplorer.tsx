import { useState } from 'react';
import { Callout, Card, DataTable, Pill, Prov } from '../components/ui';
import { ASSOC_WRITER, OBJECTS, dataQualityIssues, groupByEmailDomain, migrationPreview, objectById, seatRollup, sharedContacts, type AssocStatus, type Association } from '../domain/crm';
import { useApp } from '../state/store';

const STATUS_TONE: Record<AssocStatus, 'brand' | 'ok' | 'watch' | 'risk' | 'outline' | 'unknown'> = {
  source: 'outline',
  unverified: 'risk',
  proposed: 'watch',
  verified: 'brand',
  applied: 'ok',
  rejected: 'unknown',
  rolled_back: 'unknown',
};

/** Items needing a decision first, immutable source links last. */
const ORDER: AssocStatus[] = ['proposed', 'unverified', 'verified', 'applied', 'rejected', 'rolled_back', 'source'];

const TYPE_LABEL: Record<Association['type'], string> = {
  workspace_subscription: 'Workspace → CB Subscription',
  workspace_user: 'Workspace → User',
  user_contact: 'User → Contact',
  workspace_deal: 'Workspace → Deal',
  workspace_operating_company: 'Workspace → operating Company',
  subscription_billto_company: 'Subscription → bill-to Company',
  company_parent: 'Company → parent Company',
  deal_buying_company: 'Deal → buying Company',
};

function ReviewForm({ a }: { a: Association }) {
  const { crmApprove, crmReject } = useApp();
  const [reviewer, setReviewer] = useState('');
  const [evidence, setEvidence] = useState('');
  const [msg, setMsg] = useState<{ tone: 'ok' | 'risk'; text: string } | null>(null);
  return (
    <div className="stack" style={{ gap: 6, minWidth: 260 }}>
      <input aria-label={`Reviewer for ${a.id}`} placeholder="Reviewer (name, team)" value={reviewer} onChange={(e) => setReviewer(e.target.value)} className="inp" />
      <input aria-label={`Evidence for ${a.id}`} placeholder="Verification source / reason" value={evidence} onChange={(e) => setEvidence(e.target.value)} className="inp" />
      <div className="row-wrap">
        <button
          className="btn sm primary"
          onClick={() => {
            const r = crmApprove(a.id, reviewer, evidence);
            setMsg(r.action === 'approve' ? { tone: 'ok', text: 'Verified' } : { tone: 'risk', text: r.detail });
          }}
        >
          Approve
        </button>
        <button
          className="btn sm"
          onClick={() => {
            const r = crmReject(a.id, reviewer, evidence);
            setMsg(r.action === 'reject' ? { tone: 'ok', text: 'Rejected' } : { tone: 'risk', text: r.detail });
          }}
        >
          Reject
        </button>
      </div>
      {msg && (
        <span className="tiny" style={{ color: `var(--${msg.tone})` }} role="status">
          {msg.text}
        </span>
      )}
    </div>
  );
}

export default function CrmExplorer() {
  const { state, crmApply, crmRollback, log } = useApp();
  const [view, setView] = useState<'current' | 'proposed'>('current');
  const [typeFilter, setTypeFilter] = useState<'all' | Association['type']>('all');
  const [domainMsg, setDomainMsg] = useState<string | null>(null);
  const list = state.crm.associations;
  const shown = list
    .filter((a) => (view === 'current' ? a.status === 'source' || a.status === 'unverified' : true))
    .filter((a) => typeFilter === 'all' || a.type === typeFilter)
    .sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status));
  const preview = migrationPreview(list);
  const applied = list.filter((a) => a.status === 'applied');
  const rollup = seatRollup(list);
  const issues = dataQualityIssues(list);
  const billTo = list.filter((a) => a.type === 'subscription_billto_company' && (a.status === 'verified' || a.status === 'applied'));

  return (
    <Card
      title="CRM relationship explorer"
      right={
        <div className="row-wrap">
          <Prov kind="case-study" />
          <Prov kind="simulated" />
        </div>
      }
    >
      <p className="small muted" style={{ marginTop: -6 }}>
        Records are the six rows from the brief. Users, Contacts, Companies and the Deal are the minimum those rows imply. Changes here are a simulator: nothing is written to HubSpot.
      </p>
      <div className="row-wrap" style={{ marginBottom: 12 }}>
        <div className="seg" role="group" aria-label="CRM view">
          <button aria-pressed={view === 'current'} onClick={() => setView('current')}>
            Current CRM
          </button>
          <button aria-pressed={view === 'proposed'} onClick={() => setView('proposed')}>
            Proposed model
          </button>
        </div>
        <label className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          Association type
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)} aria-label="Association type filter">
            <option value="all">All</option>
            {Object.entries(TYPE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <button
          className="btn sm"
          onClick={() => {
            const r = groupByEmailDomain();
            setDomainMsg(r.reason);
            log('CRM', 'Attempt to group Workspaces by email domain was refused.');
          }}
        >
          Try: group Workspaces by email domain
        </button>
      </div>
      {domainMsg && (
        <div style={{ marginBottom: 12 }}>
          <Callout tone="danger" title="Blocked.">
            {domainMsg}
          </Callout>
        </div>
      )}

      <div className="table-wrap" style={{ maxHeight: 420, overflow: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Association</th>
              <th>From → To</th>
              <th>Status</th>
              <th>Single writer</th>
              <th>Evidence / note</th>
              <th>Review</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr>
                <td colSpan={6} className="muted">
                  No associations of this type in this view.
                </td>
              </tr>
            )}
            {shown.map((a) => (
              <tr key={a.id} data-testid={`assoc-${a.id}`}>
                <td className="small">{TYPE_LABEL[a.type]}</td>
                <td className="small">
                  {objectById(a.from)!.label} → <strong>{objectById(a.to)!.label}</strong>
                </td>
                <td>
                  <Pill tone={STATUS_TONE[a.status]}>{a.status.replace('_', ' ')}</Pill>
                </td>
                <td className="tiny">{a.writer}</td>
                <td className="tiny">
                  {a.evidence ? `${a.evidence} · ${a.reviewer}` : a.note ?? '—'}
                </td>
                <td>{a.status === 'proposed' ? <ReviewForm a={a} /> : <span className="tiny muted">{a.status === 'source' ? 'Immutable source link' : '—'}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid c3" style={{ marginTop: 16 }}>
        <div className="card" style={{ background: 'var(--surface-2)' }}>
          <h3>Data-quality issues ({issues.length})</h3>
          <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
            {issues.map((i) => (
              <li key={i.text} style={{ color: i.severity === 'high' ? 'var(--risk)' : undefined }}>
                {i.text}
              </li>
            ))}
          </ul>
        </div>
        <div className="card" style={{ background: 'var(--surface-2)' }}>
          <h3>Shared contacts</h3>
          {sharedContacts(list).map((c) => (
            <p key={c.contact} className="small">
              <code>{c.contact}</code> is a Contact on {c.workspaces.join(', ')}. <strong>Not proof</strong> of common ownership or payer.
            </p>
          ))}
          <p className="tiny muted">One person, several workspace memberships (Users), one Contact.</p>
        </div>
        <div className="card" style={{ background: 'var(--surface-2)' }} data-testid="seat-rollup">
          <h3>Verified roll-ups</h3>
          {rollup.length === 0 ? (
            <p className="small muted">No verified operating-Company links yet, so there is no group roll-up. The 43 Beauty Lounge seats stay a workspace-level sum.</p>
          ) : (
            rollup.map((r) => (
              <p key={r.company} className="small">
                <strong>{r.company}</strong>: {r.seats} seats across {r.workspaces.length} verified workspace(s) ({r.workspaces.join(', ')})
              </p>
            ))
          )}
          <p className="small">
            <strong>Payer:</strong> {billTo.length ? billTo.map((b) => `${objectById(b.from)!.label} → ${objectById(b.to)!.label}`).join('; ') : 'no verified bill-to Company yet'}.
          </p>
          <p className="tiny muted">Revenue roll-up: not computable. The sample has seats and plans, not prices. Chargebee stays the billing authority.</p>
        </div>
      </div>

      <div className="grid c2" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="card-title">
            <h3>Migration preview</h3>
            <div className="row-wrap">
              <button className="btn sm primary" disabled={preview.length === 0} onClick={() => crmApply('RevOps (pilot)')}>
                Apply {preview.length} verified to pilot
              </button>
              <button className="btn sm" disabled={applied.length === 0} onClick={() => crmRollback('RevOps (pilot)')}>
                Roll back pilot batch ({applied.length})
              </button>
            </div>
          </div>
          {preview.length === 0 ? (
            <p className="small muted">Nothing verified to write yet. Approve a proposed association above (named reviewer + verification source).</p>
          ) : (
            <DataTable
              head={['Write', 'Writer', 'Evidence']}
              rows={preview.map((p) => [`${objectById(p.from)!.label} → ${objectById(p.to)!.label}`, p.writeAs, `${p.evidence} · ${p.reviewer}`])}
            />
          )}
          <p className="tiny muted" style={{ marginTop: 8 }}>
            Writers by type: {Object.entries(ASSOC_WRITER).filter(([k]) => k.includes('company')).map(([k, v]) => `${TYPE_LABEL[k as Association['type']]}: ${v}`).join(' · ')}. Source links are never rewritten; rollback only reverts
            links this redesign applied.
          </p>
        </div>
        <div className="card">
          <h3>Audit trail ({state.crm.audit.length})</h3>
          {state.crm.audit.length === 0 ? (
            <p className="small muted">No changes yet.</p>
          ) : (
            <div className="table-wrap" style={{ maxHeight: 260, overflow: 'auto' }}>
              <table>
                <tbody>
                  {state.crm.audit.map((e, i) => (
                    <tr key={i}>
                      <td className="tiny">{new Date(e.at).toLocaleTimeString()}</td>
                      <td>
                        <Pill tone={e.action === 'blocked' ? 'risk' : e.action === 'rollback' ? 'watch' : 'ok'}>{e.action}</Pill>
                      </td>
                      <td className="tiny">
                        {e.actor}: {e.detail}
                        {e.before && ` (${e.before} → ${e.after})`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <p className="tiny muted" style={{ marginTop: 10 }}>
        {OBJECTS.filter((o) => o.type === 'workspace').length} Workspaces · each stays a separate product account with its own subscription. The Section 4 risk engine keeps scoring
        individual Workspaces.
      </p>
    </Card>
  );
}
