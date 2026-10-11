# Superchat — Brand and Design Reference for Claude

**Website:** https://www.superchat.com  
**Purpose:** Practical styling reference for a Superchat-themed case-study presentation, document, dashboard, mockup, or related deliverable.  
**Reference date:** October 2026  
**Important qualification:** This is a working design reference assembled from an earlier research summary, not a verified official 2026 brand manual. Distinguish historical/third-party references from recommended implementation values. Check live site or supplied brand assets if exact fidelity is critical.

---

## 1. Brand positioning and personality

Superchat is a business messaging and AI-powered communication platform. Its visual and verbal identity should feel:

- Modern, clean, product-led and technology-focused
- Approachable, confident, professional and pragmatic
- Organized, efficient, simple, trustworthy and human
- Benefits-first: clearer conversations, better customer experiences, and less manual work

**Design keywords:** modern B2B SaaS, clean minimalism, light interface, rounded cards, bento grids, confident blue, dark-navy text, generous whitespace, simple illustrations, real product UI and restrained gradients.

## 2. Color palette

### Main reference palette

These three colors were identified in a third-party Superchat brand profile in the earlier research summary. Treat them as **brand reference colors**, not confirmed current CSS tokens.

| Token | Hex | Primary application |
|---|---|---|
| Primary blue | `#145FD9` | Strong accents, prominent buttons, links, key indicators |
| Light blue | `#99D5EF` | Subtle backgrounds, accents, callout fills, illustrations |
| Dark navy | `#0D2B4D` | Major headings, dark panels, charts, high-contrast brand elements |

### Recommended supporting neutrals (not verified official brand tokens)

| Token | Hex | Application |
|---|---|---|
| White | `#FFFFFF` | Canvas and card surfaces |
| Off-white | `#F7F9FC` | Alternating section backgrounds and light panels |
| Border gray | `#E5EAF0` | Borders, dividers and separators |
| Primary text | `#111827` | Main reading text |
| Secondary text | `#475569` | Supporting text, captions, metadata |

### Suggested palette balance

- ~70% white and off-white backgrounds
- ~20% dark navy / dark body text
- ~10% blues for emphasis, CTA, highlighted information and diagrams
- Avoid large, saturated fields of blue behind dense body text; maintain accessible contrast.
- Do not introduce unrelated bright accent colors without a reason grounded in source content.

## 3. Typography

**Historical font references:** Pangea and Figtree appear in an archived Superchat design reference dating to February 2024. The live 2026 typography was **not independently verified** in the earlier summary.

| Use | Font preference | Suggested desktop size |
|---|---|---|
| Main hero / cover headline | Pangea Bold | 48–64 px |
| Section heading | Pangea Semibold | 32–40 px |
| Card / module heading | Figtree Semibold | 20–24 px |
| Standard body text | Figtree Regular | 16–18 px |
| Buttons and labels | Figtree Semibold | 14–16 px |
| Captions, small notes | Figtree Regular | 12–14 px |

- Use Pangea only if the user supplies a licensed, accessible copy. Do not falsely claim that Pangea is installed or available.
- If Pangea is unavailable, use Figtree with heavier weight for headings; fallback: `Inter`, `Arial`, sans-serif.
- Favor readable line spacing and concise headings over extra-tight tracking or all caps.
- Use clear hierarchy: bold heading, succinct deck/subheading, practical body text, muted detail.

## 4. Layout, components and visual language

**Page / slide structure**
- Clean light backgrounds, generous outer margins and breathing room.
- Left-aligned text for content-heavy slides; strong visual grouping.
- Modular card grids or bento-style compositions for feature comparisons and KPI summaries.
- Alternate white and very subtle off-white sections to create rhythm.
- Use restrained depth: fine borders, soft shadows when necessary, clear spacing.

**Cards and buttons — suggested values, not official specifications**
- Card border radius: ~16 px.
- Button radius: ~10 px.
- Card border: 1 px `#E5EAF0` where useful.
- Primary CTA fill: `#145FD9` with readable white label.
- Secondary CTA: white or off-white, blue/navy text and light-gray border.
- Spacing system: multiples of 8 px where practical.

**Imagery / diagrams**
- Prefer authentic Superchat product screens, messages, AI automation flows, unified inbox examples, integrations, customer journeys and dashboards.
- Where screenshots are unavailable, use clearly illustrative UI wireframes—not fabricated official screenshots.
- Use minimalist line icons with consistent stroke weights, labeled flows and simple arrows.
- Charts should use the palette above. Label axes, units, dates, and assumptions.
- Blue-tinted soft gradients may be used very sparingly in backgrounds or illustrated elements.
- Animations should be subtle and functional; avoid excessive effects.

**Accessibility**
- Keep body text legible against white or off-white.
- Don't place light blue text on white for important information.
- Avoid relying solely on color to convey status; pair color with text or icons.
- Preserve sufficient font sizes for projected presentations.

## 5. Verbal identity and writing style

| Attribute | Recommended approach |
|---|---|
| Tone | Confident, approachable, professional |
| Sentence structure | Short, direct, easy to scan |
| Value proposition | Highlight results, efficiency, simpler communication |
| Technical detail | Accurate and specific without unnecessary jargon |
| CTA style | Clear actions, e.g. “Request a demo” |
| Proof | Concrete KPIs, customer evidence, privacy/security claims only when validated |

**Example illustrative headline:** “Smarter conversations. Less manual work.”  
**Example illustrative support:** “Unify messages, automate workflows, and create better customer experiences with AI.”

These examples are **original suggested copy**, not asserted official slogans.

## 6. Application to a RevOps / AI / GTM engineering case study

When turning an assignment into a presentation or report:

1. Begin with a decisive problem statement and desired business outcome.
2. Show the current-state funnel or systems map; visually distinguish observed facts from hypotheses.
3. Present a clean future-state workflow with triggers, qualification logic, routing, integrations, fallbacks and handoffs.
4. Use blue for key automation steps, navy for category structure, light blue for supporting context, gray for dependencies.
5. Use KPI cards for business measures (e.g. speed-to-lead, response rate, qualification rate, conversion, data completeness). Never invent actual results.
6. Make risks, tradeoffs, assumptions, access gaps and rollout phases obvious.
7. Close with a realistic implementation roadmap and success measurement plan.
8. Preserve any assignment instructions, figures, names, business requirements and data supplied by the user.

**Useful slide motifs:** Executive summary; funnel overview; friction points; lead scoring logic; AI qualification diagram; routing decision tree; HubSpot integration architecture; exception handling; metrics dashboard; 30/60/90-day delivery plan.

## 7. Do / don't

**Do**
- Keep every slide elegant, scan-friendly and grounded in real content.
- Reuse the same typography, spacing, blue palette and card styles throughout.
- Show actual workflows, decisions and practical engineering choices rather than decorative abstractions.
- Use official logos and screenshots only when legitimately obtained.
- Separate verified brand details from stylistic recommendations.

**Don't**
- Present recommended values as official, current brand specifications.
- Invent customer logos, testimonials, metrics, claims or official app UI.
- Recreate or alter the Superchat logo from imagination when the exact official file is needed.
- Saturate the entire layout with blue, overuse gradients or clutter slides with multiple competing visual motifs.
- Use hard-to-read tiny text, dense paragraphs or low-contrast light-blue body copy.

## 8. Suggested CSS design tokens

```css
:root {
  /* Earlier third-party brand-reference colors */
  --brand-primary: #145FD9;
  --brand-light: #99D5EF;
  --brand-dark: #0D2B4D;

  /* Recommended complementary neutrals */
  --surface: #FFFFFF;
  --background: #F7F9FC;
  --border: #E5EAF0;
  --text-primary: #111827;
  --text-secondary: #475569;

  /* Historical font references; use available licensed fonts */
  --font-heading: 'Pangea', 'Figtree', 'Inter', Arial, sans-serif;
  --font-body: 'Figtree', 'Inter', Arial, sans-serif;

  /* Suggested UI geometry */
  --radius-card: 16px;
  --radius-button: 10px;
  --space-unit: 8px;
}
```

## 9. Brand assets and reference links

- Official site: https://www.superchat.com
- Superchat press page: https://www.superchat.com/presse
- Press kit link from the earlier research summary: https://drive.google.com/drive/folders/1zEcFslxRKACWXWtP-OMP_YLKwaRztIY5

**Verification reminder:** If exact visual reproduction matters, inspect the latest live site and original brand kit for the current logo files, font licenses, precise color values, components and imagery. If not available, treat this guide as an *inspired-by* design reference rather than a certified official style guide.

---

**Instructions for AI design assistants:** Prioritize clean execution, content accuracy, and consistency. Use this reference as the visual system. When choices aren't specified, make sensible restrained design decisions and label uncertain brand details rather than inventing them.
