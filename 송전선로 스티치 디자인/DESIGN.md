---
name: Transmission Precision
colors:
  surface: '#f6faff'
  surface-dim: '#d2dbe4'
  surface-bright: '#f6faff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#ecf5fe'
  surface-container: '#e6eff8'
  surface-container-high: '#e0e9f2'
  surface-container-highest: '#dbe4ed'
  on-surface: '#141d23'
  on-surface-variant: '#434751'
  inverse-surface: '#293138'
  inverse-on-surface: '#e9f2fb'
  outline: '#737782'
  outline-variant: '#c3c6d2'
  surface-tint: '#305ea4'
  primary: '#002a5c'
  on-primary: '#ffffff'
  primary-container: '#004085'
  on-primary-container: '#84aefa'
  inverse-primary: '#abc7ff'
  secondary: '#006e25'
  on-secondary: '#ffffff'
  secondary-container: '#80f98b'
  on-secondary-container: '#007327'
  tertiary: '#392900'
  on-tertiary: '#ffffff'
  tertiary-container: '#553e00'
  on-tertiary-container: '#dca600'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d7e3ff'
  primary-fixed-dim: '#abc7ff'
  on-primary-fixed: '#001b3f'
  on-primary-fixed-variant: '#0c458b'
  secondary-fixed: '#83fc8e'
  secondary-fixed-dim: '#66df75'
  on-secondary-fixed: '#002106'
  on-secondary-fixed-variant: '#00531a'
  tertiary-fixed: '#ffdf9e'
  tertiary-fixed-dim: '#fabd00'
  on-tertiary-fixed: '#261a00'
  on-tertiary-fixed-variant: '#5b4300'
  background: '#f6faff'
  on-background: '#141d23'
  surface-variant: '#dbe4ed'
  safety-orange: '#FD7E14'
  depth-blue: '#002752'
  surface-gray: '#F8F9FA'
  border-subtle: '#E9ECEF'
  kpi-navy: '#001F3F'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  chain-no:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '400'
    lineHeight: 12px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  gutter-desktop: 24px
  margin-page: 40px
  margin-mobile: 16px
  grid-column-count: '12'
  max-width-content: 1440px
---

## Brand & Style
The brand personality for this design system is **authoritative, surgical, and dependable**. It is designed for civil engineers and construction managers who require high-density information presented with absolute clarity. The aesthetic bridges the gap between high-tech industrial software and the refined usability of consumer electronics.

The design style is **Corporate Modern with Tactile nuances**. It utilizes a spacious, Apple-inspired layout that prioritizes legibility and spatial awareness. The UI communicates a sense of "physical progress" through structured layers and subtle depth, mimicking the reliability of the infrastructure it manages.

- **Minimalism:** Clean white and light gray surfaces to reduce cognitive load during complex data entry.
- **Precision:** Tight alignment and clear visual hierarchies to reflect the "Chain NO." management system.
- **Spaciousness:** Generous padding and margins to ensure the interface feels professional and "expensive," preventing the cluttered feel common in industrial software.

## Colors
This design system uses a logic-driven palette where color represents **Status and Progress**.

- **Primary (Navy Blue):** Used for structural elements, navigation, and primary "Action" buttons. It provides a grounded, institutional feel.
- **Secondary (Success Green):** Exclusively reserved for "Completed" stages (e.g., Final Paving/본포장).
- **Tertiary (Safety Gold/Yellow):** Used for "Active Work" and "In-Progress" warnings.
- **Safety Orange:** Used for critical alerts, "Current Working Head" markers, and high-priority discrepancies.
- **Neutral Grays:** Used for "Pending" tasks, Chain NO. axis labels, and inactive stages to recede into the background.

The background should primarily be `surface-gray` to differentiate card containers from the canvas. All functional colors must maintain high contrast ratios for readability in high-glare field environments (mobile use).

## Typography
The typography strategy is built for **numerical precision and structural hierarchy**.

- **Hanken Grotesk (Headlines):** A sharp, modern grotesque that feels engineered. Use this for top-level KPI numbers and Section names.
- **Inter (Body):** Used for all form labels, descriptions, and UI controls. It ensures maximum legibility in both desktop and mobile contexts.
- **JetBrains Mono (Technical Labels):** Crucial for "Chain NO." markers, meter counts (m), and coordinate data. The monospaced nature prevents "jumping" numbers when data updates in real-time.

**Formatting Rules:**
- All measurements (meters) must be right-aligned in tables to allow for easy decimal comparison.
- Chain NO. identifiers (e.g., NO. 116) should always use the `label-mono` style for a technical, blueprint-like aesthetic.

## Layout & Spacing
This design system employs a **Fixed Grid** approach for desktop to facilitate consistent A3 printing, while transitioning to a **Fluid Layout** for mobile 조회 (inquiry).

**Desktop Layout:**
- 12-column grid with a 1440px max-width.
- Main navigation is situated in a slim, fixed top bar to maximize vertical space for the linear progress charts.
- The "Progress Board" uses a horizontal scroll mechanism if the 3,448m span exceeds viewport width, but must scale down for the "Print" view.

**Mobile Layout:**
- Single column. Dashboard cards stack vertically.
- The "Step Graph" is replaced by "Status Cards" per section to avoid horizontal legibility issues on narrow screens.

**Spacing Rhythm:**
- Use increments of 8px (base unit).
- Card containers use `gutter-desktop` (24px) padding to maintain the spacious Apple-inspired feel.

## Elevation & Depth
Visual hierarchy is established through **Tonal Layering and Ambient Shadows**. 

1.  **Level 0 (Canvas):** `surface-gray` (#F8F9FA). This is the background for the entire application.
2.  **Level 1 (Main Cards):** Pure white (#FFFFFF) with a very soft, diffused shadow (15% opacity, 20px blur, 4px Y-offset). This is used for the Dashboard modules and the Map Overlay.
3.  **Level 2 (Active Elements/Inputs):** A subtle 1px border (`border-subtle`) combined with a slight inset shadow for input fields to create a tactile "field-entry" feel.
4.  **Level 3 (Modals/Popups):** Higher elevation shadow (25% opacity) with a backdrop blur (Glassmorphism) when appearing over the Map or Charts to maintain context of the underlying data.

Avoid bold borders. Use color shifts and shadows to define boundaries.

## Shapes
The shape language is **distinctly rounded** to soften the industrial nature of the data.

- **Standard Containers:** 0.5rem (8px) for buttons and small inputs.
- **Large Components (Cards):** 1rem (16px) for main dashboard modules.
- **Step Bars:** The 7-stage progress bars should have fully rounded ends (pill-shaped) to represent a continuous "pipe-like" construction flow.
- **Interactive Markers:** Map pins and "Current Work" markers should be circular or soft-edged icons to contrast against the linear grid of the construction path.

## Components

**Progress Bars (The 7-Step Cycle):**
- Each stage is a segment of a horizontal bar.
- Completed = Green. In-Progress = Gold/Yellow. Pending = Light Gray.
- Hovering over a segment displays a tooltip with `Chain NO.`, `m`, and `Date of Completion`.

**Input Fields (Daily Progress):**
- Labels sit above the input.
- Successful entry shows a momentary green glow.
- Validation errors (e.g., ELP > Excavation) show a "Safety Orange" border with an inline error message in `label-mono`.

**KPI Cards:**
- Large display typography for the percentage.
- A secondary "Sub-KPI" below it (e.g., "320m / 3,448m").
- Backgrounds are white with a subtle 2px top-accent line in the `primary_color_hex`.

**Buttons:**
- **Primary:** Navy Blue background, white text, 16px corner radius.
- **Secondary (Print/Export):** Ghost style (border only) or Light Gray background.

**Map Overlay:**
- The polyline path on the map should be 8px thick.
- It is dynamically colored based on the "most advanced completed stage" at that specific m-point.
- A "pulsing" Safety Orange dot marks the "Current Working Head" (선단).