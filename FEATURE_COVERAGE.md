# Feature coverage

Status key: **Implemented** = works in the app · **Simulated** = works against simulated integrations or synthetic data (dry-run) · **Partial** = some of the requirement · **Missing** = not built. "Tested" names the automated test that covers it (`U` = unit, `E` = browser end-to-end).

| Section | Requirement | Status | Tested |
|---|---|---|---|
| 1 | Case-study counts preserved; SSF has no Sales stage | Implemented | U funnel: counts, no Sales stage |
| 1 | All conversions computed (44.2%, 41.0%, 55.1%, 14.1 pp, 12.5%, 42.9%, 81.9%, 77.5%…) | Implemented | U funnel: every quoted rate; E Step 1 |
| 1 | Motions reconcile to blended totals | Implemented | U + E Step 1 |
| 1 | Interactive funnel (blended / by motion), drop-off table per motion | Implemented | E Step 1 |
| 1 | Assumptions + "describes, doesn't prove cause"; 46% labelled proposed target | Implemented | U funnel; E Step 1 |
| 2 | Account A raw events, ordering, derived metrics | Implemented | U events |
| 2 | Account A–E selector; B–E narrative-only (no invented events) | Implemented | U events; E Steps 2–3 |
| 2 | Observed / inferred / missing / proposed split | Implemented | E Steps 2–3 |
| 2 | Timeline lane filters, event search, click-to-inspect with provenance | Implemented | E Steps 2–3 |
| 2 | Missing execution evidence = UNKNOWN | Implemented | U risk/events; E |
| 2 | Day-33 candidate low-confidence, human-review-only, no outreach | Implemented | U risk (day 32/33); E |
| 2 | Send to Signal Desk data-quality queue | Implemented | E Steps 2–3 |
| 3 | Priorities, quarter roadmap, Head of Sales response (from answers) | Implemented | Manual |
| 3 | Evidence-backed vs claim-to-verify vs proposed experiment | Implemented | Manual |
| 3 | No fabricated ROI or savings | Implemented | Manual review |
| 4 | Architecture with boundaries, direction, timing, feedback, failure handling | Implemented | E Section 4 |
| 4 | Diagram controls (node detail, timing filter) respond; animated flows | Implemented | E Section 4 |
| 4 | Deterministic engine: state, reasons, evidence days, freshness, confidence, model version, review eligibility, proposed action | Implemented | U risk (19 tests); E Section 4 |
| 4 | HEALTHY / WATCH / AT RISK / RECOVERED / UNKNOWN (+ EXCLUDED for cancelled) | Implemented | U risk |
| 4 | Edits never count as usage or recovery | Implemented | U risk; U drift |
| 4 | Pre-action safety checks + genuine dry-run | Simulated | U actions (fetch never called); E Section 4 |
| 5 | Workspace / User / Contact / Company / Lead / Deal / CB Subscription | Implemented (Lead shown in the ERD only) | U crm |
| 5 | Current vs proposed associations; ambiguous/unverified flagged | Implemented | E Section 5 |
| 5 | Approve/reject needs reviewer + evidence; source links immutable | Implemented | U crm; E Section 5 |
| 5 | Single writer per association type; migration preview; apply; rollback; audit trail | Simulated | U crm; E Section 5 |
| 5 | Domain/shared-contact grouping refused; verified-only roll-ups; Chargebee billing authority | Implemented | U crm; E Section 5 |
| 6 | Population simulator: normal → migrations → anomaly → contamination → wrong recoveries | Simulated (synthetic) | U drift |
| 6 | Rolling vs frozen baseline; spike + 3-day drift; execution cross-check; works without telemetry | Simulated | U drift |
| 6 | Execution-based scores unaffected by edit events | Implemented | U drift: identical with/without migrations |
| 6 | Detect → contain → analyse → replay (outbound off) → restore, wired to Signal Desk | Simulated | E Steps 6–7 |
| 6 | Account A single-migration illustration + threshold calculator | Implemented | Manual |
| 7 | Needs review / Data quality / Recovered queues kept separate | Implemented | E Steps 4–5 |
| 7 | Workspace detail (risk, evidence, confidence, timestamps, messaging, subscription, owner, interventions, model, freshness, next step) | Implemented | E Steps 4–5 |
| 7 | Confirm / False positive (reason) / Snooze (reason + expiry) / Data issue (QA case) | Implemented | E Steps 4–5 |
| 7 | Create CSx task / approve SSF nudge with approved templates only | Simulated | U actions; E Steps 4–5 |
| 7 | Action key + atomic claim; pending → reconciled; no blind retry; external refs | Simulated | U actions; E Steps 4–5 |
| 7 | Reviewer Decisions and Action ledger views | Implemented | E Steps 4–5 |
| 7 | Feedback loop: corrections tallied, improvement log, model never overwritten | Implemented | E Step 8 |
| 7 | Day-90 gates shown as proposed; measured from session where possible | Partial (2 of 4 gates need pilot data) | E Step 8 |
| 7 | MVP vs mature distinction | Implemented | Manual |
| 8 | Guided walkthrough across all nine topics | Implemented | E guided demo |
| 8 | Video | Implemented: two Loom recordings embedded (recorded by the candidate) | E guided demo / manual |
| 9 | Feedback preserved (~15 h) | Implemented | Manual |
| All | Provenance labels; shared state; persistence + reset | Implemented | E persistence |
