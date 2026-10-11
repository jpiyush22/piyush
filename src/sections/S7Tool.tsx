import { Answer, BlockTitle, Callout, DataTable, Pill, QA, SectionHero } from '../components/ui';
import SignalDesk from './SignalDesk';

export default function S7Tool() {
  return (
    <>
      <SectionHero
        eyebrow="Section 7"
        title="Build the tool: Signal Desk"
        lede="Not another account-health dashboard. A review-and-decision surface where a person sees why one Workspace was flagged, trusts or rejects the evidence, and takes one safe action with an auditable outcome. The warehouse still scores; HubSpot still owns operational work."
        tags={
          <>
            <Pill tone="brand">Clickable prototype below</Pill>
            <Pill tone="ok">First slice: HubSpot views, not an app</Pill>
            <Pill tone="risk">Kill criteria at day 90</Pill>
          </>
        }
      />

      <Callout title="Try it.">
        Pick a workspace, confirm the risk, then approve the action. Click the action twice to watch the action key suppress the duplicate. Try WS-1135 (opted out) and WS-1188
        (cancelled yesterday) to see the live eligibility check block dispatch. A false positive needs a reason; a snooze needs a reason and an expiry.
      </Callout>
      <div style={{ height: 14 }} />
      <SignalDesk />
      <p className="tiny muted" style={{ marginTop: 8 }}>
        All accounts, timestamps, quantities and metrics in the prototype are mock data. It does not represent a live Superchat instance.
      </p>

      <div style={{ height: 28 }} />
      <BlockTitle>The end state</BlockTitle>

      <QA
        num="End state · surface"
        question="What does the finished tool look like when it's fully grown? Who uses it, for what, and what does it show them? Sketch the main surface."
        summary="CSx works the Sales-led queue, Lifecycle handles SSF cases, and RevOps owns quality exceptions, false-positive patterns and reporting. Every row is one Workspace."
      >
        <DataTable
          head={['UI area', 'Visible / actionable', 'Primary user', 'Data source', 'Protection']}
          rows={[
            ['Prioritised Workspace queue', 'Evidence-backed AT RISK and WATCH only; separate Data quality and Recovered views', 'CSx · Lifecycle · RevOps', 'HubSpot Workspace + warehouse score', 'UNKNOWN and RECOVERED never in the customer-action queue'],
            ['Evidence panel', 'Reasons, last successful depth run, messaging change, model version, as-of, freshness, drill-down IDs', 'CSx · Lifecycle', 'workspace_risk_daily via HubSpot; Metabase drill-down', 'No edits masquerading as confirmed usage'],
            ['Review / correction', 'CONFIRM · FALSE POSITIVE (reason) · SNOOZE (reason + expiry) · DATA ISSUE → QA', 'CSx · Lifecycle · RevOps', 'HubSpot review properties + notes', 'Review state kept separate from the computed score'],
            ['Approved actions', 'CSx task or SSF nudge only after current-state checks and a unique action-key claim', 'CSx · Lifecycle', 'HubSpot / Make / n8n', 'Pilot: supervised serialized dispatch; production: transactional uniqueness'],
            ['Decision & outcome history', 'Previous reviews, task/message IDs, recoveries, missed actions; cohort comparison', 'GTM lead · RevOps', 'HubSpot timeline + warehouse', "Outcomes don't silently rewrite historical scores"],
          ]}
        />
        <details className="more">
          <summary>Original annotated wireframe (PNG)</summary>
          <div className="img-frame">
            <img src="artefacts/s7-signal-desk-wireframe.png" alt="Original Signal Desk annotated wireframe" loading="lazy" />
          </div>
        </details>
      </QA>

      <QA
        num="End state · data + actions"
        question="What data feeds it, from where, and how does it get there? What can a user do from inside it, and what happens downstream when they do?"
        summary="It reads the daily warehouse score via HubSpot and writes a separate human review state. Every action is rechecked live and claimed once by an action key, and outcomes flow back to the warehouse."
      >
        <DataTable
          head={['System', 'What it carries', 'Direction / freshness', 'Authority', 'Contract']}
          rows={[
            ['Product warehouse', 'Activity, successful executions, messaging trend, data quality', 'Existing feed', 'Product backend / warehouse', 'workspace_id + event_id; an edit is never a run'],
            [<code>workspace_risk_daily</code>, 'status, reason_code, as_of, model_version, confidence, source timestamps', 'Dagster daily after QA → Hightouch', 'Warehouse risk model', 'One workspace/day; UNKNOWN if telemetry missing'],
            ['HubSpot Workspace', 'Risk properties, owner, review_status / reason / until, tasks, notes', 'Hightouch in; reviewer changes in HubSpot', 'CRM operational state', 'Reviewer feedback distinct from computed score'],
            ['Chargebee + consent', 'Paid/active, cancel/downgrade, contact preferences, prior outreach', 'Live recheck before any action', 'Chargebee; HubSpot opt-out', "Never act on yesterday's cached eligibility"],
            ['Make / n8n + HubSpot', 'Create task, approved nudge, log key + outcome', 'On approved command only', 'HubSpot activity', 'workspace_id + reason_code + action_type + cooldown_window'],
            ['Feedback → warehouse', 'Decisions, action results, suppressions, recoveries, FP trends', 'HubSpot → Airbyte incremental', 'Review/audit records', 'Versioned corrections; nothing deleted'],
          ]}
        />
        <DataTable
          head={['Command', 'Stored / called', 'Downstream', 'Checked first']}
          rows={[
            ['Confirm risk', 'CONFIRMED + reviewer/time; shows proposed action, sends nothing', 'Enables the approved next step', 'Valid source, current eligibility'],
            ['False positive', 'FALSE_POSITIVE + mandatory reason', 'Suppresses disputed action; queues RevOps quality review', "Doesn't overwrite the warehouse status"],
            ['Snooze', 'SNOOZED + reason + expiry + reminder', "Pauses only that Workspace's action", 'Bounded TTL, explicit owner'],
            ['Data issue', 'DATA_ISSUE → separate QA case', 'No customer-facing action', 'Source freshness, associations'],
            ['Create CSx task', 'Atomic claim of action key, then dispatch; store remote task ID', 'One valid task for the verified owner', 'Live owner/status/consent; task lookup alone is not concurrency-safe'],
            ['Approve SSF nudge', 'Human-approved template; serialized pilot dispatch', 'One reviewed onboarding message', 'Active paid, opt-out, prior send, freshness, dedup claim'],
            ['Correct past review', 'Append corrective decision', 'Warehouse learns after next sync', "Can't unsend messages"],
          ]}
        />
        <Callout tone="warn" title="Concurrency, honestly.">
          Checking for an existing HubSpot task is not concurrency-safe. Production needs an atomic, durable claim: a tiny Postgres action ledger with{' '}
          <code>UNIQUE(action_key)</code> and <code>INSERT … ON CONFLICT DO NOTHING</code>. Only the successful claimant dispatches. An accepted claim is not proof a send
          succeeded, so pending and failed records are reconciled before any retry.
        </Callout>
      </QA>

      <QA
        num="End state · stack"
        question="Frontend and backend: what carries each, and why those choices for an internal tool at a 100-person company?"
        summary="A small Next.js/React queue + detail screen with thin TypeScript endpoints. It is not a second CRM or scoring engine. A tiny uniquely-constrained ledger is added only when concurrent dispatch needs it."
      >
        <DataTable
          head={['Layer', 'Choice', 'Why', 'Deliberately excluded']}
          rows={[
            ['Frontend', 'Next.js / React internal queue + evidence panel', 'TypeScript shared code; straightforward split queue/detail UI', 'A replacement CRM or second scoring tool'],
            ['Backend', 'Thin Next.js/TS endpoints: validate access + action key; call HubSpot/Make for permitted ops', 'Small surface one person can own', 'Fake exactly-once from HubSpot lookups'],
            ['State', 'MVP: HubSpot review fields + history. Later: tiny Postgres ledger with UNIQUE(action_key)', 'Reuse tools already deployed', 'New custom CRM object or DB in the pilot'],
            ['Access', 'Company SSO, server-side Workspace permissions, scoped API tokens, minimal contact data', 'CSx acts on assigned records; Lifecycle on SSF; RevOps on QA; managers see aggregates', 'Exposed secrets, unrestricted contact detail'],
          ]}
        />
      </QA>

      <QA
        num="End state · AI"
        question="Where does AI work inside the tool itself, and where did you decide it doesn't belong?"
        summary="AI can draft a short, source-linked explanation and cluster false-positive reasons for RevOps. It never assigns risk, decides who to contact, or sends anything."
      >
        <div className="grid c2">
          <Callout tone="ok" title="Allowed:">
            a brief explanation from approved structured evidence ("No confirmed workflow runs in 17 days; messaging down 34%"), suggesting which documented playbook to read, and
            clustering reviewer false-positive reasons for a weekly RevOps review. Visibly labelled and checked by a human.
          </Callout>
          <Callout tone="danger" title="Forbidden:">
            assigning the risk level, inferring intent from workflow edits, changing Company links, inventing missing events, overriding a reviewer, deciding who to contact or sending
            messages. Raw chat/message bodies and unrelated personal data stay out of the prompt.
          </Callout>
        </div>
      </QA>

      <div style={{ height: 8 }} />
      <BlockTitle>The first slice</BlockTitle>

      <QA
        num="First slice · two weeks"
        question="You're building this alone, alongside your other work. What's the version you'd ship in the first two weeks, and what did you deliberately cut?"
        summary="I'd deliberately not build the React app first. HubSpot saved views plus reviewer fields, one supervised dispatch path, and a Metabase outcomes view."
      >
        <DataTable
          head={['When', 'Build', 'Acceptance gate', 'Cut / deferred']}
          rows={[
            [<Pill tone="brand">Days 1–2</Pill>, "Validate Section 4 flags, association IDs, evidence; HubSpot saved 'Needs review' view (status, reason, confidence, scored-at, owner, last outreach) + UNKNOWN view", 'Valid IDs; UNKNOWN separate; source link works', 'Next.js app, multi-company browser'],
            [<Pill tone="brand">Days 3–5</Pill>, 'Reviewer status, reason, reviewer, review time, snooze-until fields, separate from the model score', "A false positive doesn't corrupt the computed score", 'Custom DB, complex permissions UI'],
            [<Pill tone="unknown">Days 6–8</Pill>, 'One serialized, supervised Make/n8n dispatch: live eligibility, pre-send duplicate lookup, log key + remote ID', 'Rapid double clicks, two reviewers, retries, cancellation, opt-out, interrupted dispatch', 'Unattended/concurrent sends until the ledger exists'],
            [<Pill tone="unknown">Days 9–10</Pill>, 'Feedback to warehouse via Airbyte; simple Metabase outcomes view; review with one CSx, Lifecycle and RevOps', 'Reviewers can explain case, action, feedback and rollback', 'Mobile, real-time streaming, AI copilot, multichannel builder'],
          ]}
        />
      </QA>

      <QA
        num="First slice · kill"
        question="What would make you kill this tool after three months?"
        summary="If it isn't used, isn't faster than HubSpot, or makes outreach less safe, I'd fold it back into HubSpot views and keep only the data-quality checks."
      >
        <div className="grid c2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
          {[
            ['Reviewer habit', '≥ 70%', 'of eligible flagged Workspaces get a documented review within 2 business days'],
            ['Time saved', '≥ 20%', 'lower median time per review vs comparable HubSpot-only cases'],
            ['Safety', '0 regressions', 'in duplicate/inappropriate outreach or opt-outs; any unapproved send halts dispatch'],
            ['Closed loop', '≥ 1', 'reviewer correction leads to a documented rule, source-quality or playbook improvement'],
          ].map(([t, v, d]) => (
            <div key={t} className="stat">
              <div className="label">{t}</div>
              <div className="value">{v}</div>
              <div className="note">{d}</div>
            </div>
          ))}
        </div>
        <Answer>
          <p>
            These are proposed day-90 gates, to calibrate with GTM after measuring the starting point. They're compared against a HubSpot-only baseline rather than justifying a tool
            because it exists. If the queue stays unused, adds clicks compared with HubSpot, or corrections never influence decisions, I'd kill the separate-app plan and keep only the
            useful HubSpot views and data-quality checks. Any material privacy breach or unapproved customer send halts dispatch immediately, regardless of productivity gains.
          </p>
          <p className="small muted">
            SSF 90-day adoption impact needs mature cohorts and a comparable holdout: 41% is the baseline and ~46% remains an experimental target, not a promised three-month result.
          </p>
        </Answer>
      </QA>
    </>
  );
}
