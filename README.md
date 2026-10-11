# Superchat · RevOps Engineer take-home: Piyush Jain

**Live:** https://jpiyush22.github.io/piyush/

An interactive app that presents my full answer to the Superchat RevOps Engineer take-home challenge, styled after the Superchat product UI. The Superchat brief "messages" each question and the answer follows it, like a conversation in the Superchat inbox.

## What's inside

| Section | What you can do |
| --- | --- |
| Overview | The whole answer on one screen |
| 1 · Read the funnel | Toggle the blended (Table 1) and by-motion (Table 2) funnel with computed conversion rates |
| 2 · Dig into the leak | Accounts A–E explorer, event inspector, observed/inferred/missing/proposed split, engine run on Account A |
| 3 · Your first week | Reply to the Head of Sales, 12-week roadmap, commitments |
| 4 · Design the system | Animated, clickable architecture diagram with timing filters, plus a runnable deterministic risk engine and dry-run pre-action checks |
| 5 · The data model | CRM explorer: current vs proposed associations, evidence-gated approvals, migration preview, apply, rollback, audit trail |
| 6 · When it breaks | Population incident simulator: baselines, drift detection, containment, impact analysis, replay with outbound disabled, restore |
| 7 · Build the tool | **Signal Desk**: engine-scored queues, reviewer decisions with required reasons, live pre-action checks, atomic action ledger (concurrency, uncertain delivery, reconcile), Decisions and Outcomes views |
| 8 · Show your working | Video embed (set `VIDEO_URL` in `src/sections/S8S9.tsx`), guided 9-step demo, assumptions and open questions |
| 9 · Feedback | Candid notes on the challenge |

The original submission files (answers `.docx`, workings `.xlsx`, and the diagram PNGs) are in `public/files` and `public/artefacts`, and they're downloadable from the sidebar.

## Run it

```bash
npm install
npm run dev        # local dev server
npm test           # 66 unit tests (Vitest) for the domain logic
npm run test:e2e   # 10 browser journeys (Playwright, Chromium)
npm run build      # type check + static build in dist/
```

No credentials are needed. Every integration is a dry-run adapter with no network access, and demo state lives in your browser (Signal Desk → *Reset demo state*).

The live site is served by GitHub Pages from the `gh-pages` branch, which holds the contents of `dist/`. To update it, rebuild and push `dist/` (plus an empty `.nojekyll`) to that branch.

## Documentation

- [AUDIT_REPORT.md](AUDIT_REPORT.md): gap analysis, fixes, verification evidence, remaining issues
- [FEATURE_COVERAGE.md](FEATURE_COVERAGE.md): Section 1–9 requirement matrix
- [ARCHITECTURE.md](ARCHITECTURE.md): modules, data flow, state ownership, adapters, safeguards
- [DEMO_GUIDE.md](DEMO_GUIDE.md): 3–5 minute app walkthrough (separate from the Section 8 video)
- [TEST_RESULTS.md](TEST_RESULTS.md): what was run and what passed

React 18 + TypeScript + Vite. It uses no UI or chart libraries: the diagrams are hand-built SVG. Business logic lives in `src/domain/` as pure, unit-tested modules; `src/state/store.tsx` shares state across every section. The layout is designed for desktop.

## Design system

The styling follows the Superchat brand reference in [`docs/brand-guide.md`](docs/brand-guide.md):

- **Colors:** primary blue `#145FD9`, light blue `#99D5EF` and dark navy `#0D2B4D`, on white / off-white `#F7F9FC` surfaces with `#E5EAF0` borders. Diagrams use only blue, navy and grey; timing is told apart by dash pattern. Red, amber and green appear only for risk status, always next to a text label.
- **Type:** Figtree throughout, with heavier weights for headings. Pangea isn't licensed here, so it isn't used.
- **Shape:** 16px card radius, 10px button radius, spacing in 8px steps.
- **Logo:** the supplied Superchat mark and wordmark (`public/brand/`), used unaltered.

All tokens live in `src/styles/tokens.css`.

Note: this is a take-home submission, not an official Superchat product. All Signal Desk records are mock data.
