# Test results

Run on 2026-10-11 in the cloud sandbox (Node 22.22.0, Linux), against commit-in-progress after the audit fixes.

## Summary

| Check | Command | Result |
|---|---|---|
| Type check (strict) | `npx tsc -b` | ✅ no errors |
| Unit tests | `npm test` (Vitest 5.0.3) | ✅ **66 / 66 passed** (6 files) |
| Browser end-to-end | `npm run test:e2e` (Playwright 1.56.1, Chromium 1194, 1440×900) | ✅ **10 / 10 passed** |
| Production build | `npm run build` | ✅ built (JS ≈ 396 kB, 126 kB gzip) |
| Dependency audit | `npm audit` | ✅ 0 vulnerabilities (after pinning `vitest@5.0.3`) |
| Lint | — | ⚠️ No ESLint configured; TypeScript strict (`noUnusedLocals`/`Parameters`) is the static check |

Every e2e test also asserts **zero browser console errors and zero uncaught page errors**.

## Unit tests (66)

- **funnel (6):** exact case-study counts; SSF + Sales-led reconcile to blended at every stage; SSF has no Sales stage; every rate quoted in the answers (71.9, 82.5, 44.2, 21.0, 55.8, 72.0, 71.4, 86.7, 83.1, 86.1, 72.0, 41.0, 55.1, 14.1 pp, 12.5, 42.9, 81.9, 77.5; 536 / 439 / 97); largest drop-off is onboarding → adoption (536); 46% is a proposed target.
- **events (6):** 26 events in day order; order-independent derivation; activation day 3, workflows days 4/5/7, last edit 19, AI days 10/12 (6 runs), cancel 71, 52/59-day gaps, avg 90.2, range 88–93; zero execution events → telemetry missing; no future leakage at an as-of day; A–E facts preserved, only A has raw events.
- **risk (19):** healthy; WATCH at the 14-day boundary (13 days is not stalled); AT RISK needs an independent signal (decline / failures / downgrade); repeated failures alone are WATCH; no depth adoption; RECOVERED needs confirmed runs after a flag; edits can never produce RECOVERED/HEALTHY; UNKNOWN for missing telemetry (LOW, data-quality queue, not review-eligible); UNKNOWN for stale source even with risky evidence; conflicting evidence; cancelled → EXCLUDED; onboarding grace by motion; every result carries reasons, evidence days, freshness, version; Account A day 32 / 33 / 71; edit proxy flips on any edit; synthetic desk states cover every queue.
- **actions (18):** eligible Sales-led and SSF pass; blocks cancelled (live), opted-out, missing owner, cooldown, stale evidence, no reviewer confirmation, unapproved template, wrong motion; action-key format and cooldown windows; dispatch once then duplicate; **5 concurrent requests → exactly one dispatch**; failed checks → suppressed, never dispatched; **timeout → pending, retry blocked, reconcile finds the single delivery**; definitive rejection → retry allowed; **replay with outbound disabled sends nothing**; serialise/restore keeps the claim. `fetch` is stubbed in every test and asserted never called.
- **crm (9):** 6 separate workspaces each with one subscription; Beauty Lounge seats 8/6/4/25 = 43; shared contact surfaced but no grouping; domain grouping refused; source links immutable; approval needs reviewer and evidence; verified-only roll-up with rejected links excluded; apply then rollback leaves source links untouched; unverified domain link flagged.
- **drift (8):** deterministic per seed; **execution-based states identical with and without migrations**; edit rate rises only during the rollout; gradual drift caught by the 3-day check on day 2 (vs day 21 without a monitor); rolling baseline contaminated while frozen stays fixed; migrations more than double unsupported proxy recoveries, and system-caused recoveries are zero without migrations; impact analysis lists only affected (migrated) workspaces; no impact rows without migrations.

## Browser end-to-end (10)

1. Every section renders; sidebar search filters.
2. **Step 1:** KPIs 536 / 41.0% / 55.1% / 14.1 pp; blended shows 44.2% of Onboarding; split shows "SSF has no Sales stage"; SSF drop-off 439; reconciliation all ✓; proposed-target wording present.
3. **Steps 2–3:** filter → 3 `workflow_edited` rows; inspect day 19; 0 execution events; engine day 32 has no candidate; day 33 gives `EDIT_RECENCY_PROXY_LOW_CONFIDENCE`, LOW, human review only, not review-eligible; data-quality case appears in Signal Desk; Account B shows no invented events.
4. **Section 4:** WS-1042 → AT RISK; WS-1201 → UNKNOWN; WS-0974 → RECOVERED; dry-run checks show the reviewer check blocking; node detail and timing filter respond; `animateMotion` present.
5. **Steps 4–5:** Needs review holds exactly 5 rows (no UNKNOWN/RECOVERED); false positive and snooze validation; WS-0881 confirm → dispatched → duplicate → 3 concurrent all duplicate; WS-1188 live-cancelled → suppressed; WS-1135 opted out → suppressed; timeout → uncertain → retry duplicate → reconcile; outbox 2; ledger filters; 4 decisions recorded.
6. **Steps 6–7:** detection on day 2 → contain → desk banner shown with 5 execution-based flags unchanged → analyse → replay (outbox before = after) → restore → banner gone, repair case in data quality, ledger shows "Outbound disabled", outbox 0.
7. **Step 8:** Outcomes 0/5 reviewed; closed-loop gate flips to met after logging an improvement; safety 0 inappropriate sends; time-saved gate "not measurable".
8. **Section 5:** domain grouping blocked; approval without reviewer blocked; with reviewer → 25-seat verified roll-up; apply → rollback → audit "Restored from change log"; roll-up empty again.
9. Persistence across reload, and reset.
10. Guided demo walks steps 1–9 across sections and closes.

## Manual browser verification

Screenshots reviewed at 1440×900 for the Overview and Sections 2, 4, 5, 6 and 7 (desk + outcomes) after the changes. Issues found and fixed during this pass: proposed CRM associations were buried below the source links (now sorted first), and two ambiguous e2e selectors were tightened.

## Not tested

- Layouts below 900px (desktop-only by request).
- Browsers other than Chromium.
- Automated accessibility audit (axe).
- Multiple tabs acting on the same `localStorage` state.
- Any real HubSpot, Chargebee, Make/n8n or warehouse integration (none exists; all dry-run).
