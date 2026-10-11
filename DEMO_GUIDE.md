# Demo guide (3–5 minutes)

An optional live walkthrough of the app. It is **not** the required 1–3 minute Section 8 video, which is recorded separately.

**Before you start:** open https://jpiyush22.github.io/piyush/ (or `npm run dev`). If you've clicked around before, go to Signal Desk and press **Reset demo state**. Press **Guided demo** in the top bar to have the app navigate and highlight each step for you.

| # | Where | Do this | Point out |
|---|---|---|---|
| 1 | Section 1 | Toggle *Table 1 · blended* / *Table 2 · by motion*; switch the drop-off table to SSF | 41.0% vs 55.1%, a 14.1 pp gap; SSF is 439 of 536 non-adopters; every rate is computed and motions reconcile; the 46% figure is a proposed target |
| 2 | Section 2 | Filter events for `workflow_edited`; click day 19 | The last recorded edit is configuration, not usage; the extract has 0 execution events |
| 3 | Section 2 | Run the engine at day 32, then day 33; *Send to Signal Desk · Data quality* | UNKNOWN, LOW confidence, `EDIT_RECENCY_PROXY_LOW_CONFIDENCE` → human review only, no outreach |
| 4 | Section 3 | Evidence vs experiments table | Lead quality is a claim to verify, not ignored; no ROI claimed |
| 5 | Section 4 | Watch the moving packets; click *Dagster*; filter *Scheduled · daily*; run the engine on WS-1042, then flip telemetry to *missing* | AT RISK with two reason codes becomes UNKNOWN: missing data isn't inactivity |
| 6 | Section 5 | *Try: group by email domain* → blocked; *Proposed model*, approve GmbH → legal entity without a reviewer (blocked), then with one; apply; roll back | Verified-only roll-up (25 seats); 43 stays a workspace-level sum; audit trail |
| 7 | Section 6 | Drag the day slider to d12; Raise incident → Contain | Edit rate 1.6× frozen baseline while executions are flat; rolling baseline creeps up |
| 8 | Section 7 | Note the incident banner; open WS-0881 → Confirm → Save → *Create CSx task* → click again → *Simulate 3 concurrent requests* | Execution-based flags unchanged; one dispatch, duplicates suppressed |
| 9 | Section 7 | WS-1188 → Confirm → dispatch | Cached as active, cancelled on the live check → suppressed |
| 10 | Section 6 | Analyse → Replay → Restore | Missed reviews on day 2 vs day 21 (18 vs 104); outbox unchanged during replay; repair cases queued |
| 11 | Section 7 | *Action ledger*, *Decisions*, *Outcomes*; log an improvement | Computed state preserved beside human decisions; gates labelled proposed; closed-loop gate flips to met |
| 12 | Section 8 | Assumptions and unresolved questions | What I'd verify with real access |

All workspaces outside the case-study accounts are synthetic, and every integration is a dry-run.
