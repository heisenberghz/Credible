---
target: dashboard (extension/src/dashboard/App.tsx)
total_score: 14
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 4
p2_count: 1
target_identity: "file:D:\\credible pro\\extension\\src\\dashboard\\App.tsx"
target_fingerprint: "sha256:06a76742ca10131d7b4ed97bcf98dba95d4cb7aa70ec96b6ba001c1e83418983"
target_path: "D:\\credible pro\\extension\\src\\dashboard\\App.tsx"
timestamp: 2026-11-04T14-53-37Z
slug: extension-src-dashboard-app-tsx
---
# Critique — Credible Command Center dashboard

Target: `extension/src/dashboard/App.tsx` (+ `dashboard.css`, `src/dashboard/components/*`)
Mode: Operate
Method: single-context degraded run (subagent depth limit reached). Assessment A completed and recorded before any detector output entered context.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Engine badge, scan timer and COPY→COPIED are real; but six nav items all jump to one section with no visual acknowledgement, the top-bar magnifier copies silently, and first paint is a bare `INITIALIZING COMMAND CENTER...` string |
| 2 | Match System / Real World | 1 | "Trust DNA", "Deterministic Precedence", "Threat Vector Distribution", "SecOps Lead", "Auditor" — written for a security analyst, not a job seeker mid-application |
| 3 | User Control and Freedom | 2 | Scroll anchors and export exist; scan cannot be cancelled (button disabled, no abort), CLEAR wipes the ledger with no confirm or undo, there is no way back to "the real latest report" once a benchmark is selected |
| 4 | Consistency and Standards | 2 | Two design languages in one viewport (`influency-*` 24px-radius lime cards above `arch-card` monospace 8px tables); two different benchmark selectors for the same data; emoji ⚠️/✓ glyphs where DESIGN.md bans icon stand-ins |
| 5 | Error Prevention | 1 | `report.score ?? 100` turns a missing score into a perfect 100 and "CLEAN SIGNALS"; destructive CLEAR has no confirmation; `alert()` is used as the no-tab guard |
| 6 | Recognition Rather Than Recall | 2 | Labels are visible on primary controls, but round icon-only top-bar buttons explain themselves only via `title`, chart values live only in hover tooltips, and nav badges "6"/"10" are unexplained constants |
| 7 | Flexibility and Efficiency | 1 | No keyboard shortcuts, no deep link to a report, no "open this report in the Command Center" from the side panel; the only accelerators are clipboard and export |
| 8 | Aesthetic and Minimalist Design | 1 | Maximal ornament: a lime gradient card out-shouts the verdict, two decorative analytics decks, a venn-bubble cluster and three progress bars precede the answer |
| 9 | Error Recovery | 1 | A failed scan writes `console.error` and nothing else; no inline error, no retry, no preserved prior state (`ErrorState` exists in the side panel and is unused here) |
| 10 | Help and Documentation | 1 | No legend for the blue-vs-lime bars, no explanation of what a score of 62 means or where the bands come from, no first-run explanation of the workflow |
| **Total** | | **14/40** | **Poor — major UX overhaul required** |

## Design Specificity Verdict

**LLM assessment.** This is not a near-miss; it is a different product's interface wearing Credible's vocabulary. The CSS file states it outright: `INFLUENCY UI/UX REPLICATION — BESPOKE MODERN LIGHT DASHBOARD`, with a token block named `/* Color Palette Tokens from Reference Image */`, `--influency-lime: #D4FF00`, `--influency-blue: #8EB0FF`. `App.tsx` still initialises `useState<string>('donators')` — a donor-dashboard route that no longer exists. The sidebar's bottom card is an upsell shell (`influency-upgrade-card`, `influency-upgrade-crown` holding a shield icon where a crown used to be) repurposed as "Defensive Engine". It closes with the line "Heuristics online." — an unconditional safety claim, in the one card that exists to be dismissible.

The consequences are structural, not cosmetic. A donor-analytics dashboard organises itself around volume over time: KPI cards, a bar chart, a share-of-total venn, a target progress list. Credible's actual task is one question about one page — *is this job a scam, and what do I do next?* Those two information architectures are opposites. So the page answers its inherited template instead of its user: four KPI cards, a six-column dual-bar chart, a bubble cluster and three target bars all sit above the verdict, and the verdict itself is a compact strip below them. On a 1366×768 laptop the "OVERALL VERDICT" row starts around y≈650 — the answer is below the fold, while invented telemetry owns the first screen.

Nothing here could not be swapped onto a fitness tracker or a crypto portfolio with a find-and-replace. The genuinely product-shaped material — the heuristic rules matrix, Proof Mode's three-layer trace, the calibration benchmark dock — is the only part that could not, and it is the part with the least visual authority.

**Deterministic scan.** `impeccable detect --json` over `extension/src` + the built dashboard HTML: exit 2, 5 findings, 0 errors.
- 3 × `overused-font` (warning) — Plus Jakarta Sans imported from Google Fonts in `dashboard.css:2`, `sidepanel.css:1`, `popup.css:1`. Converges exactly with the LLM read: the type is a stock AI-era face, and it is the same face across all three surfaces.
- 1 × `marquee` (warning) — `.scan-progress__bar` infinite `scan-progress-slide` loop in the built page. Partly a false positive on the rule name (it is an ease-in-out indeterminate sweep, not a marquee, and it correctly stops under `prefers-reduced-motion`), but the object it flagged is real: a tri-colour `#111827 → #2563EB → #D4FF00` gradient bar — the decorative-gradient habit DESIGN.md explicitly bans.
- 1 × `dark-glow` (warning) — `rgba(212,255,0,.25)` lime shadow. False positive as written (the card is lime on a *light* canvas, offset y=8, not a dark-page halo), but the instinct is right: a coloured glow on the primary data card is doing persuasion, not signalling.
- The detector caught nothing the review missed, and it cannot see what matters most here: the missing-score-becomes-100 path, the inert controls, and the two-language seam are logic and cascade problems, not markup patterns.

**Visual overlays.** None. No overlay exists and none was attempted: no browser-automation tool is exposed in this session and no playwright/puppeteer is installed in `extension/node_modules`. Layout judgements above are derived from CSS and JSX, and every one that would need a pixel to settle is flagged in "What I could not verify".

## Overall Impression

The forensic thinking is real and unusually good; the dashboard around it is a rental. The single biggest opportunity is not "make it prettier" — it is to delete the analytics template and rebuild the first screen around the verdict, the evidence, and the next action, in the Swiss/aviation language DESIGN.md already specifies.

## What's Working

1. **Proof Mode's three-layer trace** (`ProofModePanel`, `proof_mode` schema: observed signal → why it matters → corroboration, with `location` like `fieldset.kyc-verification`). This is the product's actual differentiator, and it is the one place the UI is epistemically honest: it shows where the claim came from.
2. **The calibration benchmark dock.** Three ground-truth scenarios with live score chips is a genuinely clever piece of trust-building — it lets a sceptical user test the engine before trusting it on their own job offer.
3. **Operational hygiene in the small parts.** Copy URL with COPY→COPIED state, `.MD`/`JSON` dossier export, `aria-live="polite"` scan status with an elapsed timer and a "free-tier can take about a minute" hint, `prefers-reduced-motion` honoured in `ScanProgress`. Whoever wrote these understood the constraints.

## Priority Issues

**[P0] A missing score renders as 100/100 and "CLEAN SIGNALS"**
- **What**: `App.tsx:582-601` — `const score = report.score ?? 100;`, then the verdict defaults to `'CLEAN SIGNALS'` and only two branches override it. The same `?? 100` appears in `InfluencyKpiRow.tsx:10` and the copy-summary string (`App.tsx:496`). `ScanLedger.tsx:96` defaults `statusLabel = 'CLEAN'` the same way.
- **Why it matters**: This inverts the product's first principle. A degraded, partial or unknown assessment — exactly the case the fallback exists for — is presented to a scared user as a perfect, clean result. It is the one bug on this page that can cause real harm, and it is three characters wide.
- **Fix**: Make `UNKNOWN` a first-class visual state with its own neutral (not green) treatment and its own label ("Not enough evidence to judge"). Never coerce a missing score; render `—` and suppress the dial. Enumerate `AssessmentStatus` exhaustively (`switch` with a `never` check) so no future status can fall through to clean.
- **Suggested command**: `/impeccable harden` (then `/impeccable clarify` for the unknown-state copy)

**[P1] The verdict is below the fold, behind telemetry the product does not have**
- **What**: Order of `App.tsx` content: top bar → 4 KPI cards → 2 analytics decks (`InfluencyStatisticsCard` at ~320px incl. chart, `InfluencyVisitorsCard` incl. venn bubbles) → benchmark dock → only then the "FORENSIC HORIZON" verdict. Roughly 650px of chrome before the answer, on a `height:100vh` shell that cannot scroll past its own frame.
- **Why it matters**: An Operate surface answers one question; here the user must scroll to find out whether they are being scammed, and the loudest object on screen is a lime-gradient "97/100 Overall Trust Index" — a reassurance signal that contradicts "absence of a warning is not proof of safety".
- **Fix**: Invert the order. Verdict + score band + one-line reason + primary next action in the first viewport (a single 3-zone band: signal, evidence, action). Move Trust DNA, the rules matrix, Proof Mode and the ledger below it. Retire the KPI row and the venn cluster entirely; keep at most one number, the score, next to its label.
- **Suggested command**: `/impeccable distill`, followed by `/impeccable layout`

**[P1] The interface is a donor-analytics template, not Credible**
- **What**: `dashboard.css:5` header comment, `--influency-*` lime/periwinkle tokens from a "Reference Image", `useState('donators')` at `App.tsx:423`, the crown upsell card, arrow buttons on every KPI, a hardcoded `blueVal: 80` "threshold" bar per dimension, and a 110px lime bubble reading "Passed Rules".
- **Why it matters**: DESIGN.md commits to a Swiss/cobalt/emerald system with system-UI type and no gradients; the shipped surface is lime `#D4FF00` + periwinkle `#8EB0FF` on a radial-gradient canvas, with rounded-24px cards and a window-in-a-window drop shadow. The brand the team documented and the brand users see are two different products, and the template's semantic colour (lime = positive/upgrade) actively mislabels risk.
- **Fix**: Replace the world rather than polish it. Solid signal emerald/crimson/amber on slate, one card language, one radius scale, tabular numerals, no gradient fills, no glow. Delete `InfluencyStatisticsCard`, `InfluencyVisitorsCard` and the upgrade card; if the dimension data must appear, render it as a compact six-row labelled bar list inside the verdict band, not as a chart.
- **Suggested command**: `/impeccable shape` (replacement surface), then `/impeccable bolder` for the signal hierarchy

**[P1] Inert and mislabelled controls**
- **What**: All six sidebar items scroll to the same `#forensic-workbench-section`; "Overview" changes nothing; badges "6" and "10" are string constants. `InfluencyStatisticsCard`'s "6 Dimensions" pill, `InfluencyVisitorsCard`'s "Full Tab DOM ⌄" caret button, and the top-bar profile chip (`role="button"`, `tabIndex={0}`, no handler) are all non-functional. A fresh install reports "3 Records" because `history` seeds from `DEMO_REPORTS`. `ScanLedger.tsx:56` labels arbitrary history entries `'1. Benign' / '2. Suspicious' / '3. Ambiguous'` purely by index — a real scan can be captioned "Benign".
- **Why it matters**: In a tool that asks to be believed, a control that looks operable and is not is a credibility leak, and an index-derived verdict label is a factual error shown to the user.
- **Fix**: Either make each nav item a real view (hash-routed, one section visible) or demote the sidebar to in-page section links with scroll-spy. Remove every control with no handler. Derive ledger labels from `assessment_status`, never from position. Separate demo fixtures from real history and label them as demos.
- **Suggested command**: `/impeccable harden`, plus `/impeccable clarify` for the label pass

**[P1] Reading conditions: 3.0:1 text, 9px labels, four remote font weights**
- **What**: `--influency-text-muted: #8E95A5` (≈3.0:1 on white) and `#9CA3AF` (≈2.5:1) carry `.influency-kpi-meta`, `.influency-kpi-sub`, `.influency-subheading`, `.influency-metric-label`, `.influency-col-label`, `.trend-context` and `.tooltip-date` at 10.5–11.5px. `.influency-system-tag` is 9.5px, `sidebar-pro-chip` 9px, `horizon-micro-label` 9.5px. Plus Jakarta Sans + JetBrains Mono at four weights load from `fonts.googleapis.com` on every surface.
- **Why it matters**: Small muted text at 3:1 fails WCAG AA (4.5:1) — and these are the labels that explain the numbers. The Google Fonts import is also a third-party network request from a product whose stated positioning is "zero client PII leakage" and "zero outbound data to unverified third parties"; if it fails, the "Swiss precision" typography silently becomes Segoe UI on Windows. DESIGN.md's `font-feature-settings: 'tnum'` / `tabular-nums` law is not implemented anywhere in `dashboard.css`.
- **Fix**: Move all secondary text to `#475569` (7.4:1) and micro-labels to `#64748B` (4.8:1) at ≥11px. Bundle one variable face locally (or use the documented system-UI stack and drop the import entirely); add the tabular-nums rule. Kill the sub-10px tier.
- **Suggested command**: `/impeccable audit`, then `/impeccable typeset`

**[P2] Silent failure, and a destructive CLEAR with no guard**
- **What**: `handleTriggerScan` catches into `console.error('Scan failed:', e)` and stops the spinner — no message, no retry, the previous report still on screen as if nothing happened. The no-tab path calls `alert(...)`. `handleClearHistory` empties the ledger and deletes storage with no confirmation and no undo.
- **Why it matters**: For a 60-second AI call on a free tier, a silent failure is indistinguishable from success — the user reads stale evidence as current. And the ledger is the only audit trail.
- **Fix**: Reuse the existing `ErrorState` in the dashboard with a retry button and the preserved prior report marked stale. Replace `alert` with an inline callout. Make CLEAR a two-step confirm (or move it behind a menu) and keep an undo toast.
- **Suggested command**: `/impeccable harden`

## Persona Red Flags

**Alex (Power User).** Wants the verdict in one keystroke. Finds: no keyboard shortcut for scan or for opening the dashboard; six nav items that all scroll to the same place, so his mental map of the app is wrong on first click; a magnifier button that copies to clipboard with zero feedback, so he cannot tell if it worked; a bell that only scrolls; three separate "go to the workbench" affordances (nav, four arrow buttons, engine card) doing the same thing. The only real accelerator is `.MD` export, and he has to scroll past two fake charts to reach it.

**Sam (Accessibility).** Tabs through: the top-bar profile (`role="button"`, `tabIndex={0}`, no `onKeyDown`) — a focus stop that announces as a button and does nothing; six chart columns with the same defect, whose actual values are only in CSS `title` tooltips and never in the accessible name (`aria-label="Payment Dimension"`); a `role="tablist"` in `BenchmarkSwitcher` with no roving tabindex, no arrow-key handling and no `tabpanel`; the bar chart has no table or text equivalent, so the six dimension scores are invisible to a screen reader; muted labels at 2.5–3.0:1 that fail AA at their size; and, after any of these focus traps, no visible indication of which section she is in because there is no scroll-spy.

**Riley (Stress Tester).** Clears the ledger — no confirm, history gone, and the benchmark dock still offers "01 BENIGN" as if it were history. Selects the ambiguous benchmark, then scans: on failure the 62/100 ambiguous report stays on screen under a stopped spinner. Loads the dashboard with no stored report and no service worker (dev server): sees the "Corporate Career Portal 97" demo as if it were his own last scan. Deletes storage mid-session: KPI card 4 still reads "3 Records". A report with `score: null` gives 100 and "CLEAN SIGNALS". A report with a status outside the three branches gets `CLEAN SIGNALS` too, via the default.

## Minor Observations

- `if (!report)` returns a monospace one-liner with no skeleton and no timeout — on a slow service-worker handshake the product appears broken.
- `dashboard.css` imports `sidepanel.css`, so a 380px panel stylesheet ships into the full-tab surface; both define `:root`, `*` and `body`, and the later file wins on `body` background.
- `InfluencyKpiRow` computes `passedCount = executed - findings`; one rule can emit several findings, so the ratio can be negative (clamped to 0) and the percentage is not a pass rate.
- The "+N FLAGGED" chip prefixes a count with a plus sign, implying growth.
- `HeuristicMatrix` uses ⚠️ and ✓ as status glyphs — DESIGN.md bans emoji stand-ins and specifies authored SVGs. The same file mixes `fontFamily: 'monospace'` inline styles with the shell's JetBrains Mono.
- The bar chart's blue "threshold" is `80` for all six dimensions and is never explained; the legend exists only as `title` text on 16px bars.
- KPI card 1 renders `score < 10 ? '0'+score : score` — `01` for 1, but `1` for 10. Cosmetic, but it is the kind of detail this brand claims.
- `.influency-window-frame` is `calc(100vh - 28px)` with `max-width:1360px`, so on a 1920px display the workstation floats in a 280px-per-side gutter of radial-gradient canvas.
- `@media (max-width: 720px)` stacks the sidebar above content, but the frame is an extension page — the mobile branch is dead code that still costs maintenance.
- `BenchmarkSwitcher` chips concatenate `badge · label · [Score: NN]` into one 10–11px string; at 380px-equivalent widths they wrap unpredictably.

## Questions to Consider

- If the first screen could contain exactly three things — the verdict, the single most damning piece of evidence, and the next action — what would you delete without hesitation?
- Does a job seeker need six Trust DNA dimensions, or does one honest sentence ("this page asks for a crypto deposit before an interview") do more work than the entire chart?
- What would a *confident* version of this look like — a page that states "we found three red flags and here is the sentence from the page that proves it", instead of one that displays telemetry it cannot substantiate?

## What I could not verify without a browser

Contrast ratios are computed from token values, not sampled from rendered pixels. Actual first-paint height of the verdict band, the wrapping of the benchmark chips at 1366/1440/1920, focus-ring visibility on the lime card (`outline` is `#111827`, expected fine), and any layout overflow inside `.influency-window-frame` are inferred from CSS. No screenshot, no overlay, no DevTools run.
