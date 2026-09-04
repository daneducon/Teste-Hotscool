---
name: Hotscool Manager Design System
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#46464a'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#77777b'
  outline-variant: '#c7c6ca'
  surface-tint: '#5f5e60'
  primary: '#19191b'
  on-primary: '#ffffff'
  primary-container: '#2e2e30'
  on-primary-container: '#979597'
  inverse-primary: '#c8c6c8'
  secondary: '#af2f22'
  on-secondary: '#ffffff'
  secondary-container: '#fe6855'
  on-secondary-container: '#690001'
  tertiary: '#251800'
  on-tertiary: '#ffffff'
  tertiary-container: '#3f2b00'
  on-tertiary-container: '#c38d00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e4e2e4'
  primary-fixed-dim: '#c8c6c8'
  on-primary-fixed: '#1b1b1d'
  on-primary-fixed-variant: '#474649'
  secondary-fixed: '#ffdad5'
  secondary-fixed-dim: '#ffb4a8'
  on-secondary-fixed: '#410000'
  on-secondary-fixed-variant: '#8d160d'
  tertiary-fixed: '#ffdea7'
  tertiary-fixed-dim: '#fabc3a'
  on-tertiary-fixed: '#271900'
  on-tertiary-fixed-variant: '#5e4200'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
  graphite-pure: '#2e2e30'
  graphite-hover: '#222223'
  graphite-muted: '#68686d'
  graphite-subtle: '#a5a5ab'
  graphite-border: '#e8e9eb'
  surface-canvas: '#f8f9fa'
  surface-card: '#ffffff'
  surface-sunken: '#f1f3f5'
  coral-primary: '#df5241'
  coral-hover: '#c84434'
  coral-subtle: '#fceee5'
  coral-surface: '#fff5f4'
  gold-accent: '#ebaf2d'
  gold-hover: '#d29a21'
  gold-subtle: '#fcf5e5'
  status-success: '#2e9e66'
  status-success-subtle: '#eaf7f0'
typography:
  display-lg:
    fontFamily: DM Sans
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: DM Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: DM Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: DM Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: DM Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.01em
  title-md:
    fontFamily: DM Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: DM Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: DM Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 21px
    letterSpacing: 0em
  body-sm:
    fontFamily: DM Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 19px
    letterSpacing: 0em
  label-lg:
    fontFamily: DM Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0em
  label-md:
    fontFamily: DM Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: DM Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  space-2xs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.25rem
  space-xl: 1.5rem
  space-2xl: 2rem
  space-3xl: 2.5rem
  space-4xl: 3rem
  layout-margin-mobile: 1rem
  layout-margin-tablet: 1.5rem
  layout-margin-desktop: 2.5rem
  gutter-desktop: 1.5rem
---

## Brand & Style

The design system establishes a high-performance, refined operational experience engineered for educational institutions, student records, and enrollment pipelines. The aesthetic merges **Modern SaaS Minimalism** with **Tactile Clarity**: quiet confidence driven by stark structural contrasts, spacious canvas environments, and focused chromatic accents.

### Core Philosophy & Audience
Targeted at academic directors, enrollment coordinators, and operational administrators, the interface removes cognitive friction in high-throughput workflows. The visual character communicates stability, precision, and executive clarity.

### Visual Style
- **Base Canvas & Layering:** Elevated pure white (`#ffffff`) surfaces positioned over an ultra-soft cool neutral background (`#f8f9fa`), achieving clear hierarchy without harsh dividers.
- **Micro-tactility:** Ultra-soft, multi-stop ambient shadows and subtle hairline container borders give widgets tactile presence.
- **Decisive Chromatic Accents:** Neutral Grafite (`#2e2e30`) anchors typography and institutional elements. Vibrant Technical Coral (`#df5241`) acts with clinical intention on primary user conversions, mission-critical callouts, and destructive confirmations. Burnished Gold (`#ebaf2d`) handles secondary attention, retention metrics, and alert statuses.

## Colors

The color architecture balances a monochrome core with focused functional chromatic accents:

- **Primary (`#2e2e30` - Grafite):** Serves as the bedrock of structural weight, high-order typography, active sidebar navigation states, and primary executive metrics.
- **Secondary (`#df5241` - Coral Técnico):** Reserved exclusively for core transactional conversions ("Nova Matrícula", "Efetivar Pagamento"), active focus states, and priority badges. Must never be used as general decorative filler.
- **Tertiary (`#ebaf2d` - Amarelo Queimado):** Provides attention guidance for pending enrollment reviews, verification badges, warning toasts, and auxiliary data visualization series.
- **Neutral (`#f8f9fa` - Canvas Neutro Suave):** Governs the foundation layer, establishing contrast with floating `#ffffff` modules.

### Functional Roles & Gradients
- **Interactive States:** Coral interactive states shift to `#c84434` on press/hover. Dark graphite elements shift to `#222223`.
- **System Badges & Pills:** Status tokens combine a muted tonal container with a high-contrast text element (e.g., `#fff5f4` container with `#df5241` label for critical alerts; `#fcf5e5` container with `#b88214` label for pending verification).
- **Authorized Gradient:** High-impact metric widgets or summary cards may apply a dual-stop linear gradient from `#df5241` to `#ebaf2d` at a 135-degree angle, bounded to micro-accent indicator bars or primary banners.

## Typography

The type scale is powered by **DM Sans**, delivering geometric precision with humanist legibility.

### Hierarchy & Typesetting Guidelines
- **Headlines & Metric Titles:** Rendered with `SemiBold` (600) weight paired with negative letter spacing (`-0.02em` / `-20 tracking`). Entrelinha remains tight (100% to 115%) to create decisive visual anchors in analytical views.
- **Body & Continuous Copy:** Rendered in `Regular` (400) weight with a comfortable `1.5` (150%) line height to maximize scan readability during record auditing.
- **Labels, Badges, and Microcopy:** Utilize `Medium` (500) and `SemiBold` (600). Small badge elements (`label-sm`) use uppercase styling with positive tracking (`+0.04em`) to maintain legibility at 11px.
- **Numerics & Tabular Data:** Financial metrics, student IDs, and enrollment counts must utilize font features `font-variant-numeric: tabular-nums;` to maintain strict baseline alignment across lists and dashboard tables.

## Layout & Spacing

The layout is built on a 12-column responsive fluid-grid structure complemented by a fixed, compact primary navigation rail.

### Spatial Rhythm & Breakpoints
- **Compact Sidebar Rail (Desktop):** A fixed 80px wide navigational rail anchors primary module icons, leaving maximum horizontal space for dashboard matrices.
- **Main Canvas Container:** Bound to an expansive fluid container with a maximum content clamp of `1600px` to maintain data readability on ultrawide displays.
- **Breakpoints:**
  - **Mobile (< 768px):** 4-column layout, `1rem` (16px) margin, navigation switches to bottom sheet / drawer bar.
  - **Tablet (768px – 1024px):** 8-column layout, `1.5rem` (24px) margin, 2-column card wrapping.
  - **Desktop (> 1024px):** 12-column layout, `2.5rem` (40px) margin, `1.5rem` (24px) gutters between operational widgets.

### Box Distribution
Adhere to the guideline rule of displaying **2 to 3 main functional boxes/cards per visual row** on desktop, preventing information saturation and ensuring focused scanning.

## Elevation & Depth

Visual hierarchy uses layered planes and diffused ambient shadows rather than stark heavy outlines.

### Surface Tiers
1. **Tier 0 (Root Canvas):** `#f8f9fa`. The neutral backdrop across all application layouts.
2. **Tier 1 (Surface Cards & Widgets):** `#ffffff`. Elevated using an ambient, dual-stop shadow:
   `box-shadow: 0 4px 20px -2px rgba(46, 46, 48, 0.04), 0 2px 6px -1px rgba(46, 46, 48, 0.02);`
   Border: `1px solid rgba(232, 233, 235, 0.8)`.
3. **Tier 2 (Interactive Floating Elements & Dropdowns):** `#ffffff`. Used for action menus, datepickers, and flyouts:
   `box-shadow: 0 12px 32px -4px rgba(46, 46, 48, 0.08), 0 4px 12px -2px rgba(46, 46, 48, 0.03);`
4. **Tier 3 (Modal Dialogs & Drawers):** `#ffffff` sitting on an overlay backdrop of `rgba(46, 46, 48, 0.45)` with `backdrop-filter: blur(4px)`.
   `box-shadow: 0 24px 48px -8px rgba(46, 46, 48, 0.16);`

### Inset & Sunken Treatments
Data fields, search bars, and filter strips utilize a sunken foundation (`#ffffff` or `#f1f3f5`) with an ultra-thin perimeter stroke (`#e8e9eb`) to set them visually behind Tier 1 cards.

## Shapes

The shape system features softened, organic geometry with standard radii between 16px and 24px.

### Corner Radii Guidelines
- **Outer System Cards & Panels:** Apply `rounded-xl` (16px) to `rounded-2xl` (24px) for master analytic containers, enrollment tracking boards, and modular statistics panels.
- **Form Fields & Inputs:** Set to `0.75rem` (12px) to ensure soft integration without appearing bulbous.
- **Buttons:**
  - Standard action buttons: `0.75rem` (12px).
  - Pill action buttons & status tags: Fully rounded (`9999px`).
- **Status Pills & Chips:** Fully pill-shaped (`9999px`) to distinguish categorical metadata from rectangular input components.

## Components

### Buttons
- **Primary Action (Coral Técnico):**
  - Background: `#df5241`, Text: `#ffffff`, Font: DM Sans SemiBold (`14px`), DM Sans Normal (`12px`), Padding: `10px 20px`, Radius: `12px`.
  - Hover: `#c84434` with subtle drop shadow: `0 4px 12px rgba(223, 82, 65, 0.25)`.
  - Used for top-tier calls-to-action: "Confirmar Matrícula", "Salvar Aluno".
- **Secondary (Dark Graphite):**
  - Background: `#2e2e30`, Text: `#ffffff`, Hover: `#222223`.
  - Used for primary navigational triggers and administrative controls.
- **Tertiary / Ghost:**
  - Background: Transparent, Border: `1px solid #e8e9eb`, Text: `#2e2e30`.
  - Hover: Background `#f1f3f5`.

### Status Badges & Pills
- **Matrícula Ativa (Success):** Background `#eaf7f0`, Text `#2e9e66`, Border: `1px solid rgba(46, 158, 102, 0.15)`. Radius: `9999px`.
- **Pendente / Em Análise (Gold Accent):** Background `#fcf5e5`, Text `#9c7013`, Border: `1px solid rgba(235, 175, 45, 0.25)`.
- **Cancelado / Risco (Priority Coral):** Background `#fff5f4`, Text `#df5241`, Border: `1px solid rgba(223, 82, 65, 0.2)`.

### Cards & Modular Containers
- Pure white background (`#ffffff`), `20px` border-radius, `24px` internal padding.
- Hairline stroke: `1px solid #f1f3f5`.
- Subtle elevation: multi-stop ambient shadow preventing hard edges against `#f8f9fa`.
- Header area integrates a crisp title in `title-md` (`#2e2e30`) paired with an auxiliary counter or trailing icon button.

### Form Fields & Inputs
- **Base Style:** Background `#ffffff`, Border: `1px solid #e8e9eb`, Height: `44px`, Padding: `0 16px`, Radius: `12px`, Typography: `body-md`.
- **Focus State:** Border: `1.5px solid #df5241`, Ring: `0 0 0 3px rgba(223, 82, 65, 0.12)`, Outline: none.
- **Labeling:** Positioned above input in `label-md` (`#68686d`), weight `500`.

### Navigation Tabs & Switchers
- **Segmented Controls:** Container in `#f1f3f5` with `12px` radius. Active tab sits as an elevated white pill (`#ffffff`, `box-shadow: 0 2px 6px rgba(46, 46, 48, 0.06)`), text in `#2e2e30` SemiBold.
- **Underline Tabs:** Clean horizontal strip; active tab features an ink indicator bar in `#df5241` (`3px` height, rounded tops).

### Lists & Student Data Tables
- Header row styled with uppercase `label-sm` (`#a5a5ab`), separated by a hairline border (`#e8e9eb`).
- Data rows feature `48px` minimum height, hover state in `#f8f9fa`, with smooth cross-transitions (`150ms`).
- Student identifiers pair circular avatars with `title-md` for the primary name and `body-sm` (`#68686d`) for the registration ID.