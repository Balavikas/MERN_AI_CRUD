# Learning Playground — LMS Discovery UI Spec

## 1. Overview

A modern, trendy LMS discovery interface with a **"Learning Playground"** vibe. High-contrast typography, soft rounded corners (12–24px), and a vibrant blue accent system. The UI is conversational and covers course discovery, project shipping (gallery), and crew management, wrapped in a responsive shell that transitions seamlessly between light and dark modes.

---

## 2. Design System

### 2.1 Aesthetic

"Clean Tech": Slate/Zinc base, vibrant blue and cyan accents, generous radii, 1px borders, soft shadows, purposeful motion, and subtle textured backgrounds.

### 2.2 Typography

| Token | Value |
|---|---|
| Font family | `Inter` |
| Weights | 400, 500, 600, 700 |
| Nav link | 14px, semi-bold (600) |
| Pill / body small | 14px, medium (500) |
| Legal / footer fine print | 12px |

### 2.3 Color Tokens

| Token | Light | Dark |
|---|---|---|
| `--bg` | `#FFFFFF` | `#0F172A` |
| `--surface` | `#F8FAFC` | `#1E293B` |
| `--text` | `#1E293B` | `#F1F5F9` |
| `--muted` | `#64748B` | `#94A3B8` |
| `--border` | `#E2E8F0` | `#334155` |
| `--accent` | `#2563EB` | `#3B82F6` |
| `--accent-secondary` | `#0284C7` (cyan) | `#0284C7` |
| `--pill-bg` | `#FFFFFF` | `#171C2B` |
| `--progress-track` | `#E2E8F0` | `#334155` |

**Dark mode contrast rule:** body and heading text use Slate-100/200 against a Navy-900 background.

### 2.4 Radius

| Token | Value | Usage |
|---|---|---|
| `xl` | 12px | Buttons, inputs, icon containers |
| `2xl` | 16px | Cards, icon tiles |
| `3xl` | 24px | Large cards and containers |
| `full` | 9999px | Pills, progress bars, badges |

### 2.5 Borders & Elevation

- All interactive elements: `1px solid var(--border)`.
- Cards: 1px border + soft shadow.
- Buttons on hover: `shadow-md`.

### 2.6 Backgrounds

- **Top-left radial gradient:** primary accent at 10% opacity.
- **Bottom-right radial gradient:** secondary accent at 6% opacity.
- Allowed gradient opacity range across the UI: 6–20%.
- **Noise overlay:** SVG `feTurbulence type="fractalNoise"` at 6% opacity, full-viewport, `pointer-events: none`.

### 2.7 Motion

- Page/theme transitions use CSS View Transitions.
- Buttons: hover → `filter: brightness(1.1)` + `shadow-md`.
- Cards/thumbnails: subtle hover scale and brightness.
- Default transition: `0.2s ease`.
- Respect `prefers-reduced-motion` (disable scale and view transitions).

### 2.8 Accessibility

- Every interactive element has a **2px `:focus-visible` ring** in the accent color.
- Maintain WCAG AA contrast in both themes.
- Icon-only buttons (theme toggle, social icons, "Ping me") require `aria-label`.

---

## 3. Layout & Structure

### 3.1 Header (fixed)

- Height: **64px**, `border-bottom: 1px solid var(--border)`.
- **Left:** logo with a 36px square, `rounded-xl` icon container.
- **Right:**
  - Theme toggle: 32px icon inside a 40px square `rounded-xl` bordered button.
  - **"Join Now"**: high-contrast button.

### 3.2 Secondary Navbar (sticky, below header)

- Height: **56px**.
- Nav links: `Home`, `Manage Crew`, `The Toolkit` (see §4.2 Animated Nav Link).
- Search input: **420px** wide, left-aligned magnifying-glass icon.
- **"Filters"** button beside the search input.

### 3.3 Hero Welcome Section

12-column grid.

**Left — 7 columns**
1. Pill badge: "Curated just for you".
2. H1: "Welcome back, **[Name]**" — name in accent blue.
3. Sub-heading.
4. Two primary CTAs: **"Discover what's next"** and **"Jump back in"**.
5. Wrapping row of `rounded-full` category pills (e.g. "Web Development", "UI/UX") — see §4.3.

**Right — 5 columns**
- **Continue Learning** card (see §4.1), progress at **58%**, a "Resume" button, and a "Next Up" calendar-event footer.

### 3.4 Featured Course Carousel

- Section title: **"The hottest right now"**.
- Horizontal scroll (scroll-snap recommended).
- **Card** (width 360px):
  - Icon area: 144px tall, light grey background (`--surface`).
  - Badge top-right: "New" or "Popular".
  - Bold heading + instructor subtext.
  - Footer: duration and level icons + primary **"Get Started"** button.

### 3.5 Bento Management & Resources

Bento grid containing:

| Block | Contents |
|---|---|
| **Manage Crew** | 3 stat cards: Active, New, Pending |
| **Join the Movement** | Registration form, inputs 44px tall (Tailwind `h-11`), select dropdown |
| **E-Resources** | Toolkit list with download buttons |
| **Gallery** | 3-column grid of square project thumbnails |

### 3.6 Global Footer

- Background: `--surface`.
- **5 columns:**
  1. Logo, tagline, square `rounded-xl` social icons (Twitter, LinkedIn, YouTube).
  2. About
  3. Courses
  4. Resources
  5. Contact
- **Bottom bar:** copyright text + horizontal links `Terms`, `Privacy`, `Cookies` at 12px.

---

## 4. Components

### 4.1 Progress Widget Card

| Property | Value |
|---|---|
| Padding | 16px |
| Radius | 24px |
| Top section | Title + subtitle left-aligned; 48px square `rounded-2xl` icon right-aligned |
| Progress bar | 8px tall, `rounded-full`, track `#E2E8F0`, fill `#2563EB` |
| Footer | 1px top border; calendar icon, time/date info, **"Ping me"** bell icon button |

### 4.2 Animated Nav Link

- Text: 14px, semi-bold.
- Underline: absolutely positioned `<span>`, 2px tall, accent color, `bottom: -10px`.
- Default `transform: scaleX(0)`; hover/focus `scaleX(1)`.
- `transform-origin: left`; `transition: transform 0.2s ease`.

```css
.nav-link { position: relative; font-size: 14px; font-weight: 600; }
.nav-link::after {
  content: ""; position: absolute; left: 0; right: 0; bottom: -10px;
  height: 2px; background: var(--accent);
  transform: scaleX(0); transform-origin: left;
  transition: transform 0.2s ease;
}
.nav-link:hover::after,
.nav-link:focus-visible::after { transform: scaleX(1); }
```

### 4.3 Interactive Category Pill

| Property | Value |
|---|---|
| Height | 36px |
| Horizontal padding | 12px |
| Radius | 9999px |
| Border | 1px solid `#E2E8F0` |
| Background | `#FFFFFF` (light) / `#171C2B` (dark) |
| Text | 14px, medium |
| Hover | Background → `#F8FAFC`, 0.2s transition |

### 4.4 Buttons

| Variant | Spec |
|---|---|
| Primary | Accent background, white text, `rounded-xl`, hover brightness-110 + shadow-md |
| High-contrast ("Join Now") | `--text` background, `--bg` text |
| Secondary / Outline | Transparent background, 1px border, `rounded-xl` |
| Icon | 40px square, `rounded-xl`, 1px border |

---

## 5. Content & Voice

**Must:**
- Use trendy, high-energy copy — e.g. "Ship projects", "No BS", "Crush it".

**Must not:**
- Use formal academic terms like "Enrollment" or "Syllabus" without a casual modifier.

**Reference copy:** "Curated just for you", "Discover what's next", "Jump back in", "The hottest right now", "Get Started", "Manage Crew", "The Toolkit", "Join the Movement", "Ping me", "Join Now".

---

## 6. Responsive Behavior

- Hero collapses from 7/5 columns to a single stacked column on narrow screens (progress card below the welcome block).
- Search input shrinks to fluid width; secondary nav links may scroll horizontally.
- Carousel stays horizontally scrollable at all widths.
- Bento grid reflows to 1 column on mobile, 2 on tablet.
- Footer link columns wrap to 2 columns, then 1.

---

## 7. Acceptance Checklist

- [ ] Light and dark tokens implemented and switchable via the header toggle
- [ ] Theme switch uses View Transitions (with reduced-motion fallback)
- [ ] Corner radial gradients and 6% noise overlay present
- [ ] Fixed 64px header + sticky 56px secondary nav
- [ ] Nav underline grows left-to-right on hover and focus
- [ ] Progress card shows 58% fill with Resume and Next Up footer
- [ ] Carousel cards are 360px wide with 144px icon area and badge
- [ ] Bento grid includes Manage Crew, Join the Movement, E-Resources, Gallery
- [ ] 5-column footer with 12px legal bar
- [ ] 2px focus-visible ring on every interactive element
- [ ] Copy follows the voice rules in §5