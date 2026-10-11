import { useState } from 'react';
import { Answer, BlockTitle, Callout, Card, DataTable, KV, Pill, QA, SectionHero, Stat } from '../components/ui';

const RECORDS = [
  { ws: 'Beauty Lounge Mitte', plan: 'Pro', seats: 8, motion: 'self_signup', owner: '—', contact: 'm.weber@beautylounge.de' },
  { ws: 'Beauty Lounge Charlottenburg', plan: 'Pro', seats: 6, motion: 'self_signup', owner: '—', contact: 'm.weber@beautylounge.de' },
  { ws: 'Beauty Lounge Spandau', plan: 'Starter', seats: 4, motion: 'self_signup', owner: '—', contact: 's.krause@beautylounge.de' },
  { ws: 'Beauty Lounge GmbH', plan: 'Business', seats: 25, motion: 'sales_led', owner: 'Jonas (AE)', contact: 'm.weber@beautylounge.de' },
  { ws: 'Physio Nord Hamburg', plan: 'Pro', seats: 11, motion: 'self_signup', owner: '—', contact: 'kontakt@physio-nord.de' },
  { ws: 'Café Milo', plan: 'Starter', seats: 3, motion: 'self_signup', owner: '—', contact: 'hallo@cafemilo.de' },
];

interface Obj {
  id: string;
  x: number;
  y: number;
  w: number;
  title: string;
  lines: string[];
  fill: string;
  stroke: string;
  status: 'stays' | 'changes';
  detail: [string, string][];
}

const OBJS: Obj[] = [
  {
    id: 'parent',
    x: 20,
    y: 20,
    w: 250,
    title: 'COMPANY · verified parent',
    lines: ['Existing Company object', 'Optional group hierarchy'],
    fill: '#e8eefc',
    stroke: '#5b7bb0',
    status: 'changes',
    detail: [
      ['Keep', 'Existing Company object; native parent-child capability'],
      ['Change', 'Parent → child only when corporate structure is confirmed'],
      ['Never', "Create a parent because names or email domains look alike"],
    ],
  },
  {
    id: 'op',
    x: 340,
    y: 20,
    w: 260,
    title: 'COMPANY · operating entity',
    lines: ['Existing Company object', 'Verified operator relationship'],
    fill: '#e8eefc',
    stroke: '#5b7bb0',
    status: 'changes',
    detail: [
      ['Keep', 'Existing Company object used by Sales and Marketing'],
      ['Change', 'Becomes the verified business + reporting layer; Workspaces link with a clear association label, or stay unassigned for review'],
      ['Identity', 'HubSpot company ID; external legal/billing reference where available'],
    ],
  },
  {
    id: 'ws',
    x: 340,
    y: 170,
    w: 260,
    title: 'WORKSPACE · product account',
    lines: ['One record per workspace_id', 'Plan · seats · motion · risk · owner'],
    fill: '#e3f4ec',
    stroke: '#4c9a76',
    status: 'stays',
    detail: [
      ['Keep', 'Backend-created product account, plan, seats, motion, lifecycle stage, owner'],
      ['Add', 'Section 4 risk signals; association to verified operating Company'],
      ['Why', 'Exact account to target with a risk action, so a healthy location never hides a struggling one'],
    ],
  },
  {
    id: 'deal',
    x: 680,
    y: 170,
    w: 270,
    title: 'DEAL · Sales-led opportunity',
    lines: ['Buying Company + scoped workspaces', 'Not required for SSF'],
    fill: '#fdf1dd',
    stroke: '#c79a45',
    status: 'changes',
    detail: [
      ['Keep', 'Sales-led opportunities only; no Deal for every SSF signup'],
      ['Change', 'Associate the buying Company and explicitly link in-scope Workspaces (contract scope confirmed by AE)'],
      ['Why', "Jonas's opportunity scope isn't 'everyone who shares a contact'"],
    ],
  },
  {
    id: 'sub',
    x: 150,
    y: 320,
    w: 260,
    title: 'CB SUBSCRIPTION',
    lines: ['Chargebee mirror · one current', 'Chargebee ID · MRR · renewal'],
    fill: '#fdf1dd',
    stroke: '#c79a45',
    status: 'stays',
    detail: [
      ['Keep', 'Backend-created mirror of Chargebee, linked to Workspace by external subscription ID'],
      ['Change', 'Associate a verified bill-to Company when needed; preserve history without overwriting'],
      ['Truth', 'Chargebee stays authoritative for status and revenue'],
    ],
  },
  {
    id: 'user',
    x: 500,
    y: 320,
    w: 260,
    title: 'USER · workspace membership',
    lines: ['Unique per workspace', 'Activation and access context'],
    fill: '#efecfb',
    stroke: '#8b7cc7',
    status: 'stays',
    detail: [
      ['Keep', 'One User per workspace membership'],
      ['Change', 'Verify login ID; preserve User → Workspace and User → Contact links'],
      ['Why', "Don't confuse the person with the membership"],
    ],
  },
  {
    id: 'bill',
    x: 20,
    y: 470,
    w: 250,
    title: 'COMPANY · bill-to entity',
    lines: ['Existing Company object', 'Payer may differ from operator'],
    fill: '#e8eefc',
    stroke: '#5b7bb0',
    status: 'changes',
    detail: [
      ['What', 'A distinct association role of the existing Company type, not a new object'],
      ['Verified from', 'Chargebee payer/account data, Finance review'],
      ['Why', 'Correct billing vs operating roll-ups'],
    ],
  },
  {
    id: 'contact',
    x: 500,
    y: 470,
    w: 260,
    title: 'CONTACT · person',
    lines: ['One identity across memberships', 'Can appear in many workspaces'],
    fill: '#efecfb',
    stroke: '#8b7cc7',
    status: 'stays',
    detail: [
      ['Keep', 'Real person record'],
      ['Change', 'Do not use Contact as proof of Workspace ownership'],
      ['Why', 'm.weber@ appears on three Beauty Lounge workspaces; that proves nothing commercial'],
    ],
  },
  {
    id: 'lead',
    x: 830,
    y: 470,
    w: 240,
    title: 'LEAD · prequalification',
    lines: ['Keep existing process', 'No auto-opportunity per SSF'],
    fill: '#f2f3f6',
    stroke: '#a7adbb',
    status: 'stays',
    detail: [
      ['Keep', 'Original routing/qualification workflows'],
      ['Never', 'Create a Sales opportunity for all SSF'],
    ],
  },
];

const RELS: { a: string; b: string; label: string; card: string; dashed?: boolean; pts: [number, number][]; lx: number; ly: number }[] = [
  { a: 'parent', b: 'op', label: 'verified parent → child', card: '0..1 : many', dashed: true, pts: [[270, 55], [340, 55]], lx: 120, ly: 110 },
  { a: 'op', b: 'ws', label: 'operates', card: '1 : many (verified)', pts: [[470, 90], [470, 170]], lx: 478, ly: 128 },
  { a: 'op', b: 'deal', label: 'buying Company', card: '1 : many', pts: [[600, 55], [815, 55], [815, 170]], lx: 690, ly: 46 },
  { a: 'deal', b: 'ws', label: 'in-scope workspaces', card: 'explicit, optional', dashed: true, pts: [[680, 205], [600, 205]], lx: 640, ly: 258 },
  { a: 'ws', b: 'sub', label: 'has subscription', card: '1 current; history', pts: [[400, 240], [400, 280], [280, 280], [280, 320]], lx: 286, ly: 274 },
  { a: 'ws', b: 'user', label: 'has users', card: '1 : many', pts: [[540, 240], [540, 280], [630, 280], [630, 320]], lx: 560, ly: 274 },
  { a: 'sub', b: 'bill', label: 'billed to (if verified)', card: 'distinct role', dashed: true, pts: [[200, 390], [200, 430], [145, 430], [145, 470]], lx: 30, ly: 446 },
  { a: 'user', b: 'contact', label: 'maps to person', card: 'many : 1', pts: [[630, 390], [630, 470]], lx: 638, ly: 432 },
  { a: 'lead', b: 'contact', label: 'relates to person', card: '', dashed: true, pts: [[830, 505], [760, 505]], lx: 764, ly: 496 },
];

function ERD() {
  const [sel, setSel] = useState('ws');
  const o = OBJS.find((x) => x.id === sel)!;
  return (
    <Card
      title="Proposed object relationships"
      right={
        <a className="btn sm" href="artefacts/s5-crm-relationships.png" target="_blank" rel="noreferrer">
          Original PNG
        </a>
      }
    >
      <div className="legend" style={{ marginBottom: 10 }}>
        <span>
          <svg width="28" height="8" aria-hidden="true">
            <line x1="0" y1="4" x2="28" y2="4" stroke="#5b7bb0" strokeWidth="2" />
          </svg>
          Core association
        </span>
        <span>
          <svg width="28" height="8" aria-hidden="true">
            <line x1="0" y1="4" x2="28" y2="4" stroke="#c79a45" strokeWidth="2" strokeDasharray="4 3" />
          </svg>
          Optional / explicitly verified
        </span>
        <span>
          <Pill tone="ok">stays</Pill> <Pill tone="brand">changes</Pill>
        </span>
      </div>
      <div className="svg-wrap">
        <svg viewBox="0 0 1090 560" role="img" aria-label="Proposed HubSpot object relationship diagram">
          <defs>
            <marker id="erd-ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill="#5b7bb0" />
            </marker>
          </defs>
          {RELS.map((r, i) => (
            <g key={i} opacity={sel && !(r.a === sel || r.b === sel) ? 0.35 : 1}>
              <path
                d={r.pts.map((p, j) => `${j ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ')}
                fill="none"
                stroke={r.dashed ? '#c79a45' : '#5b7bb0'}
                strokeWidth={r.a === sel || r.b === sel ? 2.6 : 1.8}
                strokeDasharray={r.dashed ? '5 4' : undefined}
                markerEnd="url(#erd-ar)"
              />
            </g>
          ))}
          {OBJS.map((b) => (
            <g key={b.id} onClick={() => setSel(b.id)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSel(b.id)} tabIndex={0} role="button" aria-label={`${b.title}: details`} style={{ cursor: 'pointer' }}>
              <rect x={b.x} y={b.y} width={b.w} height={70} rx={14} fill={b.fill} stroke={b.stroke} strokeWidth={sel === b.id ? 3 : 1.5} />
              <text x={b.x + b.w / 2} y={b.y + 24} fontSize="13" fontWeight={750} textAnchor="middle" fill="#14182e">
                {b.title}
              </text>
              {b.lines.map((l, i) => (
                <text key={i} x={b.x + b.w / 2} y={b.y + 43 + i * 15} fontSize="11.5" textAnchor="middle" fill="#3d4360">
                  {l}
                </text>
              ))}
            </g>
          ))}
          {RELS.map((r, i) => (
            <text key={i} x={r.lx} y={r.ly} fontSize="11" fill="var(--ink-2)" fontWeight={600} opacity={sel && !(r.a === sel || r.b === sel) ? 0.45 : 1}>
              {r.label}
              {r.card && <tspan fill="var(--ink-3)" fontWeight={400}>{` · ${r.card}`}</tspan>}
            </text>
          ))}
        </svg>
      </div>
      <div className="card" style={{ background: 'var(--surface-2)', marginTop: 12 }}>
        <div className="row-wrap" style={{ marginBottom: 8 }}>
          <strong>{o.title}</strong>
          <Pill tone={o.status === 'stays' ? 'ok' : 'brand'}>{o.status}</Pill>
        </div>
        <KV items={o.detail} />
      </div>
      <p className="tiny muted" style={{ marginTop: 10 }}>
        Parent, operating and bill-to are distinct roles of the existing HubSpot Company object, not three new object types. The payer can be the operating Company or a different
        verified Company. Click any object for details.
      </p>
    </Card>
  );
}

export default function S5DataModel() {
  const bl = RECORDS.filter((r) => r.ws.startsWith('Beauty'));
  return (
    <>
      <SectionHero
        eyebrow="Section 5"
        title="The data model"
        lede="HubSpot handles one workspace well. It struggles with a customer that runs several workspaces. As Superchat moves upmarket, that's the shape of account that gets bigger and more common."
        tags={
          <>
            <Pill tone="ok">Workspace stays the product grain</Pill>
            <Pill tone="brand">Company becomes the verified layer</Pill>
            <Pill tone="risk">Never group by email domain</Pill>
          </>
        }
      />

      <Card title="Recent account records">
        <DataTable
          head={['Workspace', 'Plan', 'Seats', 'Motion', 'Owner', 'Primary contact']}
          num={[2]}
          rows={RECORDS.map((r) => [
            <strong>{r.ws}</strong>,
            r.plan,
            r.seats,
            <Pill tone={r.motion === 'sales_led' ? 'brand' : undefined}>{r.motion}</Pill>,
            r.owner,
            <code>{r.contact}</code>,
          ])}
        />
        <p className="tiny muted" style={{ marginTop: 8 }}>
          Each row is a separate Workspace with its own CB Subscription.
        </p>
      </Card>

      <div className="grid c4" style={{ margin: '16px 0 28px' }}>
        <Stat label="Beauty Lounge workspaces" value={bl.length} note="Separate records + subscriptions" />
        <Stat label="Licensed seats" value={bl.reduce((s, r) => s + r.seats, 0)} note="Not a verified group total" />
        <Stat label="SSF / Sales-led seats" value="18 / 25" note="Jonas listed as AE on GmbH only" />
        <Stat label="Same legal customer?" value="UNKNOWN" note="Names + domains prove nothing" accent />
      </div>

      <BlockTitle>Questions</BlockTitle>

      <QA
        num="Q1"
        question="Walk us through what our CRM can and can't answer about the accounts above. Be specific: which questions would a CS lead, a finance person, or Jonas ask that this structure handles badly?"
        summary="Workspace-level facts are usable. Cross-workspace reporting, revenue roll-ups and owner/action decisions aren't reliable, because the associations that would support them are missing or inconsistent."
      >
        <Answer>
          <KV
            items={[
              ['What it can answer', 'At the Workspace level: plan, seats, acquisition motion, listed owner and primary contact. Subscription details where associations formed correctly.'],
              ['Beauty Lounge', "8 + 6 + 4 + 25 = 43 licensed seats across four separate subscriptions. They look related, but that doesn't prove they're one legal customer or payer."],
            ]}
          />
        </Answer>
        <div className="grid c3">
          {[
            ['CS lead', 'Which Beauty Lounge locations need help, and who should follow up?', "No reliable group-level view: Workspace → Company associations aren't consistently populated and Company parent/child links aren't used. A shared Contact may not be the right owner for every workspace."],
            ['Finance', "What's Beauty Lounge's total recurring revenue and renewal exposure?", "Four separate subscriptions, but nothing reliably establishes which belong to the same billing or legal entity. The sample has seats and plans, not prices, payer or renewal dates."],
            ['Jonas (AE)', 'Do the three SSF locations belong to my 25-seat GmbH account? Is there expansion?', "He owns the GmbH Workspace, not necessarily the other three. Shared email contacts don't establish the commercial relationship or which contract covers each location."],
          ].map(([who, q, why]) => (
            <div key={who} className="card" style={{ padding: 16 }}>
              <Pill tone="brand">{who}</Pill>
              <p style={{ margin: '10px 0 8px', fontWeight: 650 }}>“{q}”</p>
              <p className="small muted">{why}</p>
            </div>
          ))}
        </div>
        <DataTable
          head={['Object', 'Today', 'Works', 'Breaks']}
          rows={[
            ['Workspace', 'Real product workspace; pushed from backend in real time', 'Use workspace_id as the reporting grain', 'Not itself a legal parent account'],
            ['CB Subscription', 'Mirrors Chargebee; one per shown Workspace', 'Works when the Workspace association is correct', "Can't infer a shared payer across four subscriptions"],
            ['User / Contact', 'Users are workspace-specific; a shared login maps several Users to one Contact', 'User and Contact remain distinct', 'Contact-level reports mix workspace activity or double-count people'],
            ['Company', 'Created manually or auto-created from email domain', 'Workspace → Company association type exists', 'Not consistently populated; no parent/child hierarchy'],
            ['Deal / Lead', 'Deal = Sales-led opportunity; Lead = prequalification', 'Jonas may use the GmbH Deal/Workspace', 'SSF workspaces have no Deal; deal relation must be verified'],
          ]}
        />
        <Callout title="Other two records.">
          Physio Nord Hamburg (Pro, 11) and Café Milo (Starter, 3) can each be described as individual SSF Workspaces. The sample doesn't establish any parent company, shared payer,
          wider customer group or Sales relationship for either.
        </Callout>
      </QA>

      <QA
        num="Q2"
        question="Superchat is moving upmarket, and accounts like this will become more common, and bigger. Redesign the model: what changes, what stays, and why? Show the objects and how they relate."
        summary="Keep Workspace as the product account and keep the existing HubSpot objects. Add verified Company relationships (operating, bill-to, optional parent) so larger customers can be understood without merging independent workspaces."
      >
        <ERD />
        <div className="grid c2">
          <Answer label="What stays">
            <KV
              items={[
                ['Workspace', 'One record per actual Superchat workspace, carrying product ID, plan, seats, motion, lifecycle stage, owner and Section 4 risk signals.'],
                ['CB Subscription', 'Linked to its Workspace by external subscription ID. Supports history without overwriting past records.'],
                ['User → Contact', 'Workspace-specific Users, each linked to the Contact for that person. One Contact can relate to several Workspaces.'],
                ['Lead / Deal', 'Leads for qualification and Deals for Sales-led opportunities. No Deal for every SSF signup.'],
              ]}
            />
          </Answer>
          <Answer label="What changes">
            <KV
              items={[
                ['Company', 'Becomes the verified business and reporting layer. Parent/child only when corporate structure is confirmed.'],
                ['Workspace → Company', 'A clear association label to the verified operating Company, or unassigned for review.'],
                ['Subscription → bill-to', 'Linked when needed, since the payer may differ from the operating entity.'],
                ['Deal', "Associated with its actual buying Company, explicitly linking the Workspaces in the contract, so Jonas sees real cross-workspace expansion."],
                ['Ownership', 'Group/account owner kept separate from Workspace CSx or AE where they differ. Stable IDs, required labels, an "unverified" state.'],
              ]}
            />
          </Answer>
        </div>
        <DataTable
          head={['Workspace', 'Seats', 'Motion', 'Operating Company', 'Opportunity scope']}
          num={[1]}
          rows={[
            ...bl.map((r) => [r.ws, r.seats, r.motion, <Pill tone="unknown">{r.motion === 'sales_led' ? 'Needs validation too' : 'Unverified; review first'}</Pill>, r.motion === 'sales_led' ? 'Jonas owns stated AE record; verify Deal scope' : "Not automatically Jonas's"]),
            [<strong>Across 4</strong>, <strong>43</strong>, '—', 'Grouping UNKNOWN', "Don't sum group MRR before payer verification"],
          ]}
        />
        <div className="grid c2">
          <Callout tone="ok" title="Why it's worth it.">
            CS sees group-level health and still acts on the exact at-risk Workspace. Finance rolls up revenue by verified paying Company and, separately, by confirmed parent. Sales
            sees real buying relationships. The Section 4 risk model keeps writing to Workspace, so a healthy location doesn't hide a struggling one.
          </Callout>
          <Callout tone="danger" title="What I'd avoid.">
            Mass-merging Workspaces, unnecessary new custom objects, inferring legal relationships from a shared Contact, and changing product or billing record creation flows just to
            make reports look cleaner.
          </Callout>
        </div>
        <DataTable
          head={['Guardrail', 'Rule', 'Avoid', 'Owner']}
          rows={[
            ['Identity', 'Stable workspace/subscription/user IDs; dedupe by external keys', 'Email-domain rules to create a corporate group', 'Data + RevOps'],
            ['Source of truth', 'Product = usage; Chargebee = subscriptions/revenue; Stripe = payment evidence; Sales = deal context', 'Double-counted revenue', 'Billing / CRM'],
            ['Validation', 'Stage unresolved associations for review; record verification source + date', 'Fabricating missing Company links', 'Sales / CSx / Finance'],
            ['Ownership', 'Explicit owners/roles; group owner can differ from Workspace CSx/AE', 'Fan-out of tasks', 'GTM Ops'],
            ['Pilot', 'Validate Beauty Lounge with stakeholders, then expand gradually', 'Bulk merges or a new custom object in release one', 'RevOps'],
          ]}
        />
      </QA>

      <QA
        num="Q3"
        question="Your redesign has to happen on a live CRM that GTM teams use every day. What would you change first, what would you deliberately leave alone, and what could go wrong in between?"
        summary="Audit first, agree one writer per association, pilot verified links in read-only comparison, then roll out in small, logged, reversible batches."
      >
        <Card title="Roll out in controlled steps">
          <div className="steps">
            {[
              ['Week 1 · Inventory', 'Map Workspace → CB Subscription, User → Contact, Workspace → Deal and Workspace → Company associations, plus every retry and fallback workflow by self-signup, checkout link and partner. Count missing, duplicate and wrong links. Snapshot configs and association IDs.', 'No edits to production routing or billing'],
              ['Week 1 · Rules + write ownership', 'Product Workspace ID and Chargebee subscription ID as immutable keys. Sales/CSx or Finance confirm operating, bill-to and Deal scope. Unknowns go to an exception queue, never a domain auto-match. Exactly one authorised writer per association type, with a versioned change log.', 'Preserve working syncs; save previous branches for rollback'],
              ['Week 2 · Dry run', 'A sample with Beauty Lounge, SSF, Sales-led and partner/checkout routes, in a read-only comparison mapping reviewed with record owners before any write.', "Don't trigger customer workflows"],
              ['Week 2 · Small write pilot', 'Write only approved links through the assigned writer; shadow or gate conflicting fallback branches on pilot records; review diffs.', 'Subscription totals reconcile, ownership unchanged, no duplicate CSx tasks'],
              ['After sign-off · Expand', 'Backfill in small batches, log every change, publish group reports only once reconciled.', 'Stop on mismatch; roll back only newly changed associations'],
            ].map(([t, d, k], i) => (
              <div key={t} className="step">
                <div className="n">{i + 1}</div>
                <div>
                  <div className="t">{t}</div>
                  <div className="d">{d}</div>
                  <div className="tiny" style={{ marginTop: 4 }}>
                    <Pill tone="ok">Keep working: {k}</Pill>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <DataTable
          head={['Area', 'Change first', 'Leave alone', 'Reason']}
          rows={[
            ['Workspace → Company', 'Populate only when the operating Company is confirmed', 'Workspace IDs, lifecycle/risk data, product-created records', 'Risk alerts stay at Workspace level'],
            ['Company hierarchy', 'Parent-child only for confirmed relationships', 'Bulk Company merges, domain grouping', 'Franchise/brand ≠ common legal parent'],
            ['CB Subscription / bill-to', 'Verify subscription ID; separate bill-to when payer known', 'Backend mirror and Chargebee billing', 'No double-counting or wrong payer totals'],
            ['User → Contact', 'Validate shared login identity across Users', 'Existing User and Contact objects', 'Shared Contact ≠ ownership'],
            ['Deal / Lead', 'Link buying Company + in-scope Workspaces', 'SSF signup flow; Lead & Deal creation', "Don't hand Jonas all related-looking accounts"],
            ['Association workflows', 'One writer per type; fallbacks in shadow on pilot records', 'Working creation and unrelated retry paths', 'Prevents last-writer-wins overwrites and churn'],
          ]}
        />
        <Card title="What could go wrong, and how I'd catch it">
          <DataTable
            head={['Failure mode', 'Impact', 'Early check', 'Containment', 'Recovery']}
            rows={[
              ['Wrong Company link', 'Wrong group health and ownership', 'Sample records + exceptions', 'Stop mapping writes; suppress group automation', 'Restore from change log'],
              ['Workflow race / duplicates', 'Fallback overwrites mapping; orphans', 'Association counts, duplicate IDs, retry spikes', 'Stop new writer; reactivate previous safe branch', 'Reconcile and replay safe batch'],
              ['Billing mismatch', 'Inflated MRR, wrong payer', 'Per-subscription and Finance totals before/after', 'Hide consolidated report', 'Recalculate from Chargebee IDs'],
              ['Wrong CSx task / outreach', 'Wrong owner; unwanted customer contact', 'Restricted test view; inspect trigger ownership', 'Disable group-triggered tasks', 'Clean tasks; owner-led review of sent comms'],
              ['Late data / failed association', 'Records look unlinked; false alerts', 'Freshness + exception dashboard', 'Mark UNKNOWN; no auto-remap', 'Retry once sources catch up'],
            ]}
          />
        </Card>
        <Callout title="First two-week commitment:">
          an association map, a baseline of existing failures, a verified Beauty Lounge pilot and a reconciliation report reviewed with Sales, CSx and Finance. Already-sent customer
          communications need an owner-led review, not just a technical rollback.
        </Callout>
      </QA>
    </>
  );
}
