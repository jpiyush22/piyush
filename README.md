# Superchat · RevOps Engineer take-home: Piyush Jain

**Live:** https://jpiyush22.github.io/piyush/

An interactive app that presents my full answer to the Superchat RevOps Engineer take-home challenge, styled after the Superchat product UI. The Superchat brief "messages" each question and the answer follows it, like a conversation in the Superchat inbox.

## What's inside

| Section | What you can do |
| --- | --- |
| Overview | The whole answer on one screen |
| 1 · Read the funnel | Toggle the blended (Table 1) and by-motion (Table 2) funnel with computed conversion rates |
| 2 · Dig into the leak | Hover the plotted Account A raw events; detection design; instrumentation priorities |
| 3 · Your first week | Reply to the Head of Sales, 12-week roadmap, commitments |
| 4 · Design the system | Clickable architecture diagram with flows filtered by timing (real-time / 4h / daily / triggered / feedback) |
| 5 · The data model | Clickable object-relationship diagram, Beauty Lounge analysis, safe live-CRM rollout |
| 6 · When it breaks | Drift simulator for `workflow_edited` and a signal-integrity threshold calculator |
| 7 · Build the tool | **Signal Desk**, a working prototype: review queues, required reasons and expiry, live eligibility checks, action-key duplicate suppression, audit log |
| 8 · Show your working | Video embed (set `VIDEO_URL` in `src/sections/S8S9.tsx`) |
| 9 · Feedback | Candid notes on the challenge |

The original submission files (answers `.docx`, workings `.xlsx`, and the diagram PNGs) are in `public/files` and `public/artefacts`, and they're downloadable from the sidebar.

## Run it

```bash
npm install
npm run dev      # local dev server
npm run build    # static build in dist/ (relative paths, so it works on any static host)
```

The live site is served by GitHub Pages from the `gh-pages` branch, which holds the contents of `dist/`. To update it, rebuild and push `dist/` (plus an empty `.nojekyll`) to that branch.

React 18 + TypeScript + Vite. It uses no UI or chart libraries: the diagrams are hand-built SVG. The layout is designed for desktop.

## Design system

The styling follows the Superchat brand reference in [`docs/brand-guide.md`](docs/brand-guide.md):

- **Colors:** primary blue `#145FD9`, light blue `#99D5EF` and dark navy `#0D2B4D`, on white / off-white `#F7F9FC` surfaces with `#E5EAF0` borders. Diagrams use only blue, navy and grey; timing is told apart by dash pattern. Red, amber and green appear only for risk status, always next to a text label.
- **Type:** Figtree throughout, with heavier weights for headings. Pangea isn't licensed here, so it isn't used.
- **Shape:** 16px card radius, 10px button radius, spacing in 8px steps.
- **Logo:** the supplied Superchat mark and wordmark (`public/brand/`), used unaltered.

All tokens live in `src/styles/tokens.css`.

Note: this is a take-home submission, not an official Superchat product. All Signal Desk records are mock data.
