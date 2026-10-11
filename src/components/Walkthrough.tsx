import { useEffect } from 'react';
import type { SectionId } from '../sections/registry';
import { Icon } from './ui';

export interface Step {
  section: SectionId;
  anchor: string;
  title: string;
  text: string;
}

export const STEPS: Step[] = [
  { section: 's1', anchor: 's1-kpis', title: '1 · Funnel calculations', text: 'Every rate is computed from the case-study counts. SSF adoption 41.0% vs Sales-led 55.1%: a 14.1 pp gap, and 81.9% of non-adopters. Toggle blended/split and check the drop-off table.' },
  { section: 's2', anchor: 's2-explorer', title: "2 · Account A's events", text: 'Switch between Accounts A–E. Only A has raw events. Click markers or table rows to inspect events; the evidence is split into observed / inferred / missing / proposed.' },
  { section: 's2', anchor: 's2-engine', title: '3 · Missing execution evidence', text: 'Run the engine at day 33. The result is UNKNOWN with low confidence: no execution events exist, so the edit-recency candidate is human-review only. Send it to Signal Desk → Data quality.' },
  { section: 's3', anchor: 's3-evidence', title: '4 · Why adoption first', text: 'Evidence-backed workstreams vs a claim to verify (lead quality) vs proposed experiments. No ROI is claimed.' },
  { section: 's4', anchor: 's4-arch', title: '5 · The system', text: 'Packets move along each flow at its cadence. Click any system for its boundary and guardrail, filter by timing, then run the risk engine below on any workspace.' },
  { section: 's5', anchor: 's5-explorer', title: '6 · CRM uncertainty', text: 'Current vs proposed associations. Approvals need a reviewer and a verification source; grouping by email domain is refused; roll-ups count only verified links; rollback is logged.' },
  { section: 's6', anchor: 's6-sim', title: '7 · Semantic drift', text: 'Scrub the day slider: the edit rate rises while executions stay flat. Work through detect → contain → analyse → replay (outbound off) → restore. Execution-based flags never change.' },
  { section: 's7', anchor: 'signal-desk', title: '8 · Reviewer experience', text: 'Open WS-0881, confirm, then create the CSx task; try it twice. Check the Action ledger and Outcomes. The incident banner appears here while the Section 6 hold is active.' },
  { section: 's8', anchor: 's8-assumptions', title: '9 · Assumptions and open questions', text: 'What I assumed, what I could not verify, and what I would check with access.' },
];

export function flash(anchor: string) {
  const el = document.getElementById(anchor);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const target = (el.nextElementSibling as HTMLElement | null) && el.offsetHeight === 0 ? (el.nextElementSibling as HTMLElement) : el;
  target.classList.add('flash');
  window.setTimeout(() => target.classList.remove('flash'), 2200);
}

export default function Walkthrough({ step, onStep, onClose, current }: { step: number; onStep: (n: number) => void; onClose: () => void; current: SectionId }) {
  const s = STEPS[step];
  useEffect(() => {
    if (current !== s.section) {
      window.location.hash = s.section;
      return;
    }
    const t = window.setTimeout(() => flash(s.anchor), 250);
    return () => window.clearTimeout(t);
  }, [step, current, s.section, s.anchor]);

  return (
    <div className="walkthrough" role="dialog" aria-label="Guided demo" data-testid="walkthrough">
      <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
        <span className="eyebrow" style={{ color: 'var(--brand-light)' }}>
          Guided demo · {step + 1}/{STEPS.length}
        </span>
        <button className="btn sm ghost" onClick={onClose} aria-label="Close guided demo" style={{ color: '#fff' }}>
          <Icon name="x" size={16} />
        </button>
      </div>
      <h3 style={{ color: '#fff', margin: '6px 0' }}>{s.title}</h3>
      <p className="small" style={{ color: '#c9dcef' }}>
        {s.text}
      </p>
      <div className="wt-dots">
        {STEPS.map((_, i) => (
          <button key={i} aria-label={`Step ${i + 1}`} aria-current={i === step} onClick={() => onStep(i)} />
        ))}
      </div>
      <div className="row-wrap" style={{ justifyContent: 'space-between', marginTop: 8 }}>
        <button className="btn sm" disabled={step === 0} onClick={() => onStep(step - 1)}>
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button className="btn sm primary" onClick={() => onStep(step + 1)} data-testid="wt-next">
            Next
          </button>
        ) : (
          <button className="btn sm primary" onClick={onClose}>
            Finish
          </button>
        )}
      </div>
    </div>
  );
}
