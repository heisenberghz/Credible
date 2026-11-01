# Design System & Visual Specification

<!-- impeccable:design-schema 1 -->

## Architectural Philosophy
Credible is an epistemologically honest, client-side cybersecurity defense workstation. Its visual world rejects generic AI templates, purple-to-pink gradient slop, and superficial decoration. It is inspired by Swiss architectural minimalism, high-reliability aerospace avionics, and modern engineering workstations (Linear, Raycast, CrowdStrike Falcon).

## 1. Palette & Signal Colors
Credible uses solid, high-contrast signal colors calibrated for WCAG AA compliance across light surfaces.

| Token | Value | Semantic Role |
|---|---|---|
| `--bg-base` | `#F8FAFC` | Main canvas background |
| `--bg-surface` | `#FFFFFF` | Card and component surface |
| `--bg-subtle` | `#F1F5F9` | Elevated controls, inactive pills, table tracks |
| `--text-primary` | `#0F172A` | Primary typography, obsidian brand elements |
| `--text-secondary` | `#475569` | Explanations, metadata, subheadings |
| `--text-muted` | `#64748B` | Micro-labels, timestamps, captions |
| `--border-subtle` | `#E2E8F0` | Default 1px card and separator borders |
| `--border-active` | `#CBD5E1` | Interactive control resting borders |
| `--signal-emerald` | `#059669` | Clean verdicts, passed rules, high score |
| `--signal-emerald-bg` | `#ECFDF5` | Clean verdict container fill |
| `--signal-emerald-border` | `#A7F3D0` | Clean verdict container stroke |
| `--signal-crimson` | `#E11D48` | Critical threat verdicts, flagged rules, low score |
| `--signal-crimson-bg` | `#FFF1F2` | Critical threat container fill |
| `--signal-crimson-border` | `#FECDD3` | Critical threat container stroke |
| `--signal-amber` | `#D97706` | Caution, unverified entity, medium score |
| `--signal-amber-bg` | `#FFFBEB` | Caution container fill |
| `--signal-amber-border` | `#FDE68A` | Caution container stroke |
| `--accent-cobalt` | `#0052FF` | Forensic core accent, active focus ring |

## 2. Typography
- **Stack:** `-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', Roboto, Helvetica, sans-serif`
- **Monospace Stack:** `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace`
- **Tabular Figures:** Always enabled via `font-feature-settings: 'tnum', 'cv02', 'cv03', 'cv04', 'cv11'` and `font-variant-numeric: tabular-nums`.
- **Typographic Scale:**
  - Command Display: 18px / 800 weight / letter-spacing -0.02em
  - Card Headings: 14px / 700 weight
  - Body Text: 14px / 450 weight / line-height 1.6
  - Monospace Badges & Tags: 10px–11px / 700 weight / letter-spacing 0.04em
  - Micro Captions: 11px / 500 weight / `#64748B`

## 3. Brand Mark & Iconography
- **Logo Emblem:** An unsloped faceted defensive shield with an intersecting cobalt forensic diamond core and white central beacon. Zero generic squares, zero emoji stand-ins.
- **Icon System:** All icons are authored SVGs rendered with 1.75px–2px stroke widths, rounded or square terminal caps, and matching bounding boxes (14px–20px).
- **Prohibited Anti-Patterns:**
  - Strictly zero emojis standing in for system icons (no `🛡️`, `⚡`, `🔍`, `⚠️`, `📄`).
  - Strictly zero thick left borders (`border-left: 3px solid ...`).
  - Strictly zero AI gradients (`linear-gradient(135deg, #a855f7, #ec4899)`).

## 4. Layout Architecture
- **Dashboard Command Center:**
  - Header: Sticky command ribbon with brand lockup, active engine status beacon, and action buttons.
  - Calibration Benchmark Dock: Segmented control for toggling ground-truth test scenarios with live score chips.
  - KPI Executive Grid: Strictly locked 4-column desktop grid (`repeat(4, minmax(0, 1fr))`) collapsing to 2x2 on tablet (`repeat(2, 1fr)`) and 1x4 on mobile. Eliminates stranded single cards.
  - Forensic Heuristic Rules Matrix: Full-width observable rules verification grid.
  - 2-Column Forensic Workbench: Left column (Threat findings, Trust DNA, Limitations); Right column (Next best actions, Proof Mode trace, Scan ledger).
- **Side Panel Companion (380px):**
  - Sticky header matching command center styling.
  - Verdict banner with SVG indicator and interactive copy button.
  - Self-contained SVG ScoreGauge with mathematically centered `<text>`.
  - Responsive accordion cards for Threat Findings, Trust DNA, Proof Mode, and Runbook Checklist.

