# Superchat · RevOps Engineer take-home: Piyush Jain

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

React 18 + TypeScript + Vite. It uses no UI or chart libraries: the diagrams are hand-built SVG. All brand colors live in `src/styles/tokens.css`. Light and dark modes are both supported. The layout is designed for desktop.

Note: this is a take-home submission, not an official Superchat product. All Signal Desk records are mock data.
