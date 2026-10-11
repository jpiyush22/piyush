# Audit report

Audit of the Superchat RevOps take-home app as it stood at commit `4dda950`, before this round of fixes.

## Sources used

| Reference | Available? | Notes |
|---|---|---|
| Original Superchat take-home brief | Yes | Pasted in the session |
| Finalized answers (Google Doc) | Yes, as `.docx` export | `public/files/RevOps_Take-Home_Piyush_Jain_answers.docx` is the source of truth for strategy |
| Supporting calculations (Google Sheet) | Yes, as `.xlsx` export (18 tabs) | `public/files/RevOps_Take-Home_Piyush_Jain_workings.xlsx` |
| Section 4 architecture diagram | Yes | `public/artefacts/s4-architecture.png` |
| Section 5 CRM relationship diagram | Yes | `public/artefacts/s5-crm-relationships.png` |
| Section 7 Signal Desk wireframe | Yes | `public/artefacts/s7-signal-desk-wireframe.png` |
| Brand guide | Yes | `docs/brand-guide.md` plus supplied logo files |
| Live Google Doc / Sheet | No | Only the exported files were supplied. If the live versions changed after export, those changes are not reflected. |

## Starting point

- React 18 + TypeScript (strict) + Vite 6, a static single-page app with hash routing. No backend, database or API.
- Each section page held its own local React state. Nothing was shared between pages and nothing persisted.
- No tests, no linter, no CI. The only checks were `tsc -b` and `vite build`.
- Deployed as static files to GitHub Pages (`gh-pages` branch).

## Initial gap analysis

| Section | Required functionality | Currently implemented | Gap | Priority | Status |
|---|---|---|---|---|---|
| All | Shared, consistent state across modules | Every page has isolated `useState`; Signal Desk decisions vanish on navigation | Actions in one module don't affect others; nothing persists | Critical | Fixed |
| All | Calculations derived from source data | Funnel chart computed, but most KPI cards and tables are hand-typed strings | Numbers could drift from the dataset | High | Fixed |
| All | Automated tests | None | No unit or browser tests | Critical | Fixed |
| All | Clear labelling of provided, derived, proposed, synthetic and simulated data | Partial ("mock data" notes) | Inconsistent; no shared legend | High | Fixed |
| 1 | Drop-off analysis, assumptions, experimental-target framing | Funnel, conversions, Q&A | No explicit drop-off table; the 41% → 46% target appears only in S4 | Medium | Fixed |
| 2 | Account A–E selector, event inspection, observed / inferred / missing / proposed split | Account A timeline (hover only), static A–E cards | B–E not selectable; no evidence classification; no filters | High | Fixed |
| 2 | Day-33 candidate marked low-confidence, human-review-only | Marked "hypothetical" on the chart | Not tied to any engine; outreach-safety not demonstrated | High | Fixed |
| 3 | Evidence-backed priorities vs proposed experiments | Roadmap + answers | Not visually distinguished | Medium | Fixed |
| 4 | Working deterministic risk engine | Rules described in prose only | No engine: no reason codes, confidence, freshness or model version computed | Critical | Fixed |
| 4 | Pre-action safety checks + dry-run | Described in prose | Not executable or testable | Critical | Fixed |
| 4 | Animated flows | Static SVG | Requested animation missing | Low | Fixed |
| 5 | CRM explorer: current vs proposed, approval, migration preview, rollback, audit trail | Static clickable ERD + tables | No interactive association management | High | Fixed |
| 5 | Domain-grouping prevention | Stated in text | Not enforced anywhere | High | Fixed |
| 6 | Population-level drift simulator (baselines, detection, containment, replay, restore) | Account A slider + threshold calculator | No population, baseline chart, phases, replay or reconciliation; controls don't affect other modules | Critical | Fixed |
| 6 | Execution-based scores unaffected by edits | Asserted in text | Not demonstrated or tested | Critical | Fixed |
| 7 | Statuses computed by the risk engine | Statuses hardcoded per mock workspace | Signal Desk not connected to the engine | Critical | Fixed |
| 7 | Views: Needs Review, Data Quality, Recovered, Detail, Decisions, Action History, Outcomes | Needs review / Data quality / Recovered / Audit log | No Decisions view and no Outcomes view | High | Fixed |
| 7 | Action ledger: pending / approved / suppressed / dispatched / failed / reconciled; atomic claim; no blind retry | In-memory `Set` of keys only | No states, no concurrency or uncertain-outcome handling | Critical | Fixed |
| 7 | False positive preserves computed state | Log text only | Not stored as separate fields | High | Fixed |
| 7 | "drill down" link | Did nothing (`preventDefault`) | Fake control | Critical | Fixed (now opens the evidence drawer) |
| 7 | Synthetic WS-1042 reused "Pro · 42 seats", the same values as Account A | Mock data | Could be confused with case-study Account A | Medium | Fixed |
| 7 | Day-90 gates as proposed targets; MVP vs mature | Present | Gates not computed from tool state | Medium | Fixed |
| 8 | Guided walkthrough mode | Video placeholder + outline | No in-app guided demo | High | Fixed |
| 9 | Feedback preserved (~15 h) | Present | None | — | Verified |
| UX | No fake controls; keyboard access; empty states | Mostly fine | Drill-down link (above); no empty state in some lists | Medium | Fixed |
| UX | Layout below 900px | Sections 4 and 5 overflow horizontally | Desktop-only by earlier request; diagrams scroll inside their card | Low | Accepted (documented) |

The fixes, verification evidence and remaining issues are recorded under [Fixes and verification](#fixes-and-verification).

## Fixes and verification

| # | Issue | Severity | Fix | Verified by |
|---|---|---|---|---|
| 1 | No shared state; decisions lost on navigation | Critical | `src/state/store.tsx`: one React context for reviews, action ledger, audit log, CRM associations, incident, data-quality cases and improvements, persisted to `localStorage`, with a reset | e2e: *persistence and reset*; Steps 2–3 (Section 2 → Signal Desk hand-off); Steps 6–7 (incident → desk banner) |
| 2 | Hand-typed business numbers | High | `src/domain/funnel.ts` computes every rate; Sections 1, 3 and 4 and the Overview read from it | unit: *matches every rate quoted in the answers*, *reconcile to the blended totals* |
| 3 | No risk engine | Critical | `src/domain/risk.ts`: deterministic `scoreWorkspace` returning state, reason codes, confidence, queue, review eligibility, proposed action, evidence with days, freshness and model version | 19 unit tests in `risk.test.ts`; e2e *Section 4 engine playground* |
| 4 | Signal Desk statuses hardcoded | Critical | Desk rows are synthetic snapshots scored by the engine at render time | unit: *states come from the engine and cover every queue* |
| 5 | No executable pre-action safety; no dry-run | Critical | `src/domain/actions.ts`: `preActionChecks` (reviewer, motion, live Chargebee status, re-score, confidence, freshness, owner, consent, approved template, cooldown, prior key, semantic hold), `ActionService` with atomic key claim and status history, and `DryRunAdapter` (no network) | 18 unit tests incl. concurrency, timeout→reconcile, replay; `fetch` is stubbed and asserted never called |
| 6 | Ledger lacked states and concurrency/uncertain handling | Critical | Statuses: pending / approved / suppressed / dispatched / failed / reconciled; timeouts stay `pending` until reconciled against the destination; only definitive rejections may be retried | unit + e2e *Steps 4–5* |
| 7 | False positive didn't preserve computed state | High | `ReviewDecision` stores `computedState`, `computedReasons` and `modelVersion` beside the human decision | e2e: "computed WATCH preserved"; Decisions view |
| 8 | Fake "drill down" link | Critical | Replaced with a working evidence drawer (`RiskResultCard`) | Manual browser check |
| 9 | Missing Signal Desk views | High | Added Decisions, Action ledger (status filters, reconcile) and Outcomes (day-90 gates measured from session state, improvement log) | e2e *Step 8* |
| 10 | Section 2 static | High | Account explorer: A–E selector, observed / inferred / missing / proposed split, lane filters, event search table, click-to-inspect, engine run at any day, data-quality hand-off; B–E clearly narrative-only | e2e *Steps 2–3* |
| 11 | Day-33 flag not tied to rules | High | Engine returns `EDIT_RECENCY_PROXY_LOW_CONFIDENCE` with `human_review_only`, LOW confidence, not review-eligible | unit day 32/33/71; e2e |
| 12 | No CRM explorer | High | `src/domain/crm.ts` + `CrmExplorer`: current vs proposed, approve/reject requiring reviewer + evidence, immutable source links, single writer per type, migration preview, apply, rollback, audit trail, verified-only roll-ups, refusal to group by domain | 9 unit tests; e2e *Section 5* |
| 13 | No population drift simulator | Critical | `src/domain/drift.ts` (seeded, 400 synthetic workspaces) + `IncidentSimulator`: rolling vs frozen baselines, spike and 3-day drift checks, execution vs edit-proxy paths, ten phases, contain/analyse/replay/restore wired into shared state | 8 unit tests incl. *execution-based states identical with and without migrations*; e2e *Steps 6–7* |
| 14 | Replay could trigger outreach | Critical | `ActionService.outboundEnabled = false` during replay; attempts recorded as `suppressed: Outbound disabled`; outbox count shown before/after | unit + e2e (outbox stays 0) |
| 15 | No guided walkthrough | High | `Walkthrough`: nine steps that navigate to and highlight the exact panel; also launchable from Section 8 | e2e *guided demo walks all nine steps* |
| 16 | Evidence vs experiments not distinguished (S3) | Medium | Table classifying workstreams as case-study evidence, a claim to verify, or a proposed experiment | Manual |
| 17 | "Shippable alone in 2 weeks" overclaimed | Medium | Reworded to "First slice: 2 weeks, solo"; Section 7 adds an explicit MVP vs mature comparison stating the full app is not a two-week production build | Manual |
| 18 | Synthetic WS-1042 echoed Account A ("Pro · 42 seats") | Medium | Synthetic records relabelled "Synthetic … workspace" with distinct values | Manual |
| 19 | "AI draft" implied an LLM call | Medium | Labelled as template-generated in this demo (no LLM call) | Manual |
| 20 | Provenance unclear | High | `Prov` tag (case-study / derived / proposed / synthetic / simulated) on every module | Manual |
| 21 | Animations requested | Low | Moving packets (`animateMotion`) on every architecture and CRM edge, at cadence-based speeds; dash flow on dashed edges; growing bars; line draw on the drift chart; pulsing cursors. All disabled under `prefers-reduced-motion` | e2e asserts `animateMotion` present; manual |
| 22 | Dev dependency vulnerabilities (Vitest/tinypool advisories) | High | Pinned `vitest@5.0.3` | `npm audit`: 0 vulnerabilities |

## Remaining issues and limitations

- **No backend.** State lives in one browser's `localStorage`. The atomic claim is a synchronous test-and-set in a single JS runtime; two browser tabs do not share a transactional store. Production needs the Postgres `UNIQUE(action_key)` ledger described in Section 7.
- **Two day-90 gates can't be measured in a demo.** "Reviewed within 2 business days" is approximated by "reviewed this session", and the "20% faster than HubSpot-only" gate needs pilot data. Both are labelled that way in the Outcomes view.
- **Snooze expiry doesn't auto-resurface** (there's no scheduler).
- **Accounts B–E are narrative-only** by design: no events are invented for them.
- **The evidence summary is template text**, not an LLM.
- **Below 900px width**, diagrams scroll inside their cards. The layout is desktop-only by earlier request.
- **No ESLint config.** TypeScript strict mode (`noUnused*`) is the static check.
- **No automated accessibility (axe) audit.** Interactive SVG nodes and markers are keyboard-focusable with labels, and status is never conveyed by colour alone.
- **The live Google Doc and Sheet weren't accessible**; their `.docx` and `.xlsx` exports were used.
