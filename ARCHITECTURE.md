# Architecture

A static React 18 + TypeScript + Vite single-page app. There is no backend. Everything runs in the browser and nothing calls a production system.

```
src/
  domain/            pure, framework-free business logic (unit-tested)
    funnel.ts        Section 1 counts + every derived rate
    events.ts        Account A raw extract, derived metrics, A–E profiles
    risk.ts          deterministic risk engine (v0.3-exec) + legacy edit proxy
    actions.ts       pre-action checks, action ledger, dry-run adapter
    workspaces.ts    synthetic Signal Desk snapshots + live billing
    crm.ts           CRM objects, associations, approval/rollback/audit
    drift.ts         seeded semantic-drift population simulator
  state/store.tsx    single shared React context, persisted to localStorage
  sections/          one page per brief section + interactive modules
  components/        UI primitives, provenance tags, guided walkthrough
tests/unit           Vitest (domain)
tests/e2e            Playwright (browser journeys)
```

## Data flow

```
case-study data ─┐
synthetic data ──┼─► domain/* (pure functions) ─► state/store (shared, persisted) ─► sections/*
                 │                                    ▲                │
                 │                    user actions ───┘                └─► DryRunAdapter (in-memory outbox)
```

- **Section 1** reads `METRICS` from `funnel.ts`; the counts are the only inputs.
- **Section 2** derives Account A's metrics from the raw extract and runs `scoreWorkspace(accountASnapshot(day))`. It can open a data-quality case in the store.
- **Section 4** runs the same engine on any snapshot (what-if edits allowed) and calls the store's `checksFor` for a dry-run.
- **Section 5** applies `crm.ts` operations through the store and keeps a CRM audit trail.
- **Section 6** reads the memoised `simulate()` result. Its incident actions update `state.incident`. Containment sets `semanticHold`, which Signal Desk and the pre-action checks read. Replay calls `ActionService.request` with `outboundEnabled = false`. Restore adds a repair case to the data-quality queue.
- **Section 7** scores the synthetic snapshots on render, records reviews, runs live checks and dispatches through `ActionService`. Outcomes reads reviews, ledger, data-quality cases, incident state and improvements.

## State ownership

| State | Owner | Notes |
|---|---|---|
| Computed risk | Engine (pure) | Recomputed from snapshots, never stored or overwritten |
| Reviewer decisions | Store (`reviews`) | Append-only; each stores the computed state and model version at decision time |
| Action ledger + simulated outbox | `ActionService` (in the store's ref) | Serialised to `localStorage` on change |
| CRM associations + audit | Store (`crm`) | Source links immutable |
| Incident | Store (`incident`) | Stage machine: idle → detected → contained → analyzed → replayed → restored |
| Data-quality cases, improvements, review timings, audit log | Store | |

## Adapter boundary

`DispatchAdapter` (`dispatch`, `lookup`, `billingStatus`) is the only seam to the outside. The app ships one implementation, `DryRunAdapter`: an in-memory outbox and live billing map, with a switch to simulate rejected or timed-out deliveries. A production build would add HubSpot-task, lifecycle-messaging and Chargebee adapters behind a small server holding scoped credentials. No secrets exist in this repo.

## Action safeguards

1. Reviewer must have **CONFIRMED** (confirming never sends anything by itself).
2. Live checks: action type matches the motion · Chargebee status active (live lookup, not the cached score) · fresh re-score still WATCH/AT RISK · HIGH confidence · source ≤ 26h · owner assigned · consent (SSF) · approved template (SSF) · 14-day cooldown · no prior claim · no semantic hold on edit-derived reasons.
3. Atomic claim of `workspace_id:reason_code:action_type:cw{floor(day/14)}`. This stands in for `INSERT … ON CONFLICT DO NOTHING` on `UNIQUE(action_key)`; a HubSpot task lookup is never the guard.
4. Dispatch outcomes: `dispatched` with an external ref · `failed` (definitive, retry allowed) · timeout stays `pending` and must be **reconciled** against the destination, never resent.
5. During historical replay, outbound is disabled; attempts are logged as suppressed.

## Known limitations

See [AUDIT_REPORT.md](AUDIT_REPORT.md#remaining-issues-and-limitations). The main ones: no backend or cross-tab transactional store; two day-90 gates need pilot data; synthetic populations and proposed thresholds; desktop-only layout.
