# PUMP Design System

**Codename:** Miami Heat Wave
**Version:** 1.0
**Last updated:** April 2026

PUMP is a workout tracking PWA. The design language is 1987 Miami meathead chic: light backgrounds, nuclear-saturated hot pink and cyan accents, retro script typography, and glowing cards. The retrowave header scene sets the tone. The functional UI below it is clean, legible, and fast to use mid-set.

---

## 1. Fonts

Four fonts. Each has one job.

| Font | Role | Weight(s) | Source |
|------|------|-----------|--------|
| Monoton | Brand mark only. "PUMP" in the retrowave header and nowhere else. | 400 (single weight) | `@fontsource/monoton` |
| Pacifico | Session names (Push Day, Pull Day, Leg Day) and the "Let's Go" button. Personality layer. | 400 (single weight) | `@fontsource/pacifico` |
| Outfit | All UI text: exercise names, labels, body copy, buttons (except "Let's Go"). Workhorse. | 400, 500, 600, 700, 800, 900 | `@fontsource/outfit` |
| Space Mono | All data: weights, reps, set numbers, targets, timestamps, tags, plan metadata. | 400, 700 | `@fontsource/space-mono` |

**Rules:**
- Monoton never appears below the retrowave scene header. One brand mark, one place.
- Pacifico is only for session-level names and the primary CTA. Never use it for exercise names or data.
- Outfit handles everything a user reads. Exercise names are 800 weight. Labels are 700.
- Space Mono handles everything a user scans as numerical data. Always monospaced, always 700.

---

## 2. Color Palette

### Core Colors

```css
:root {
  /* Backgrounds (light theme) */
  --pump-bg-page: #F0FCFB;           /* Ice-tinted page background */
  --pump-bg-page-warm: #FFF8FB;      /* Warm tint for gradient bottoms */
  --pump-bg-card: #FFFFFF;            /* Card surfaces */
  --pump-bg-input: #F0F8F8;          /* Input fields, inactive elements */
  --pump-bg-tinted: rgba(255,0,128,0.04); /* Active input tint */

  /* Accent - Hot */
  --pump-hot: #FF0080;               /* Primary accent. Buttons, active states, session names. */
  --pump-hot-bright: #FF3399;        /* Lighter hot for gradients */
  --pump-magenta: #FF00FF;           /* Mid-gradient accent */
  --pump-orange: #FF6B00;            /* PR badge gradient endpoint */

  /* Accent - Cool */
  --pump-cyan: #00FFEE;              /* Glow color, target badges, horizon line */
  --pump-cyan-mid: #00D4CC;          /* Readable cyan (on white backgrounds) */
  --pump-cyan-deep: #00A89E;         /* Text-safe cyan for tags */
  --pump-electric: #00AAFF;          /* Gradient midpoint */

  /* Accent - Purple */
  --pump-purple: #8B00FF;            /* Superset indicator, gradient endpoint */
  --pump-purple-mid: #6B20AA;        /* Text-safe purple */

  /* Text */
  --pump-text: #0A0A2E;              /* Primary text (near-black with blue cast) */
  --pump-text-mid: #3D3660;          /* Secondary text */
  --pump-text-dim: #7A7299;          /* Tertiary text, timestamps, labels */

  /* Scene (retrowave header only) */
  --pump-navy: #0A0020;              /* Deepest sky color */
  --pump-palm: #12001e;              /* Palm tree and mountain silhouette fill */

  /* Borders */
  --pump-border-card: rgba(10,0,32,0.06);   /* Default card border */
  --pump-border-pink: rgba(255,0,128,0.1);  /* Active card border */
  --pump-border-cyan: rgba(0,255,238,0.1);  /* Preview card border */
  --pump-border-purple: rgba(139,0,255,0.12); /* Superset card border */
}
```

### Gradients

```css
:root {
  /* Primary action gradient (buttons, checkmarks, PR celebrations) */
  --pump-grad-hot: linear-gradient(135deg, #FF0080, #FF00FF, #8B00FF);

  /* PR badge */
  --pump-grad-sunset: linear-gradient(135deg, #FF0080, #FF3399, #FF6B00);

  /* Cool accent (preview cards, target indicators) */
  --pump-grad-ice: linear-gradient(135deg, #00FFEE, #00AAFF, #8B00FF);

  /* Spectrum bar (top of cards, top of screen) */
  --pump-grad-bar: linear-gradient(90deg, #FF0080, #FF00FF, #8B00FF, #00AAFF, #00FFEE);

  /* Page background */
  --pump-grad-page: linear-gradient(180deg, #F0FCFB 0%, #FFF8FB 100%);

  /* Sun (header scene only) */
  --pump-grad-sun: radial-gradient(circle at 50% 70%,
    #FFee88, #FFcc44 20%, #FF8833 40%,
    #FF3399 65%, #FF0080 80%, #cc0066 90%, #880044);

  /* Monoton title text gradient */
  --pump-grad-title: linear-gradient(180deg,
    #FFee88 0%, #FFaa44 20%, #FF3399 50%,
    #FF0080 75%, #cc0066 100%);
}
```

---

## 3. Card Glow System

Every card in the app has a glow. Four variants based on state.

### Default (resting card)

```css
.card {
  background: var(--pump-bg-card);
  border-radius: 14px;
  border: 1px solid rgba(0,255,238,0.06);
  box-shadow:
    0 0 0 1px rgba(255,0,128,0.03),
    0 1px 3px rgba(255,0,128,0.06),
    0 0 12px rgba(0,255,238,0.06),
    0 0 20px rgba(255,0,128,0.04);
  position: relative;
  overflow: hidden;
}

/* Spectrum bar across top edge */
.card::before {
  content: '';
  position: absolute;
  top: -1px; left: -1px; right: -1px;
  height: 3px;
  background: var(--pump-grad-bar);
  border-radius: 14px 14px 0 0;
  opacity: 0.35;
}
```

### Active (current exercise being logged)

```css
.card--active {
  border-color: rgba(255,0,128,0.1);
  box-shadow:
    0 0 0 1.5px rgba(255,0,128,0.08),
    0 2px 8px rgba(255,0,128,0.12),
    0 0 20px rgba(255,0,128,0.1),
    0 0 30px rgba(0,255,238,0.06),
    0 0 50px rgba(255,0,128,0.04);
}
.card--active::before {
  opacity: 1; /* Full spectrum bar */
}
```

### Preview (session preview screen, trainer recommendations)

```css
.card--preview {
  border-color: rgba(0,255,238,0.1);
  box-shadow:
    0 0 0 1px rgba(0,255,238,0.08),
    0 2px 8px rgba(0,255,238,0.1),
    0 0 18px rgba(0,255,238,0.08),
    0 0 30px rgba(255,0,128,0.03);
}
```

### Superset (paired exercises)

```css
.card--superset {
  border-left: 3px solid var(--pump-purple);
  border-color: rgba(139,0,255,0.12);
  box-shadow:
    0 0 0 1px rgba(139,0,255,0.06),
    0 2px 8px rgba(139,0,255,0.1),
    0 0 20px rgba(139,0,255,0.06),
    0 0 30px rgba(255,0,128,0.03);
}
```

---

## 4. Component Specs

### Tags / Pills

```css
.tag {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  font-family: 'Space Mono', monospace;
}

.tag--pr      { background: rgba(255,0,128,0.12); color: var(--pump-hot); }
.tag--target  { background: rgba(0,255,238,0.14); color: var(--pump-cyan-deep); }
.tag--superset { background: rgba(139,0,255,0.1); color: var(--pump-purple-mid); }
.tag--warmup  { background: rgba(10,0,32,0.05); color: var(--pump-text-mid); }
```

### PR Badge

Appears inline with exercise name when a genuine PR is set (see PR logic in BUG_FIXES.md).

```css
.pr-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  background: var(--pump-grad-sunset);
  color: white;
  font-size: 9px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  font-family: 'Space Mono', monospace;
  box-shadow: 0 0 10px rgba(255,0,128,0.35);
  margin-left: 6px;
}
```

### Buttons

```css
/* Primary: start session, main CTAs */
.btn-primary {
  background: var(--pump-grad-hot);
  color: white;
  border: none;
  border-radius: 14px;
  font-family: 'Pacifico', cursive; /* Only on "Let's Go" */
  font-size: 20px;
  padding: 14px;
  box-shadow: 0 0 24px rgba(255,0,128,0.35), 0 0 60px rgba(255,0,128,0.12);
  cursor: pointer;
}

/* For non-CTA primary buttons, use Outfit instead of Pacifico */
.btn-primary--ui {
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 13px;
  padding: 10px 20px;
  border-radius: 10px;
}

/* Secondary */
.btn-secondary {
  background: var(--pump-bg-input);
  color: var(--pump-text);
  border: 1px solid var(--pump-border-card);
  border-radius: 10px;
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 13px;
  padding: 10px 20px;
}

/* Ghost */
.btn-ghost {
  background: transparent;
  color: var(--pump-hot);
  border: 1.5px solid rgba(255,0,128,0.35);
  border-radius: 10px;
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 13px;
  padding: 10px 20px;
}

/* Edit (small, pill-shaped) */
.btn-edit {
  font-size: 9px;
  font-family: 'Space Mono', monospace;
  font-weight: 700;
  color: var(--pump-hot);
  background: rgba(255,0,128,0.08);
  border: none;
  padding: 4px 10px;
  border-radius: 999px;
  cursor: pointer;
}
```

### Set Input Fields

```css
.set-input {
  background: var(--pump-bg-input);
  border-radius: 7px;
  padding: 6px;
  text-align: center;
  font-family: 'Space Mono', monospace;
  font-size: 14px;
  font-weight: 700;
  color: var(--pump-text);
  border: 1.5px solid transparent;
}

.set-input--active {
  border-color: var(--pump-hot);
  background: var(--pump-bg-tinted);
  box-shadow: 0 0 10px rgba(255,0,128,0.1);
}
```

### Checkmark (set completion)

```css
.check {
  width: 20px;
  height: 20px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 800;
}

.check--done {
  background: var(--pump-grad-hot);
  color: white;
  box-shadow: 0 0 8px rgba(255,0,128,0.25);
}

.check--pending {
  background: var(--pump-bg-input);
  border: 1.5px solid rgba(10,0,32,0.08);
}
```

### Superset Connector

Appears between superset-paired exercise cards.

```css
.superset-connector {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: -2px 0 5px;
  padding: 0 4px;
}

.superset-connector::before {
  content: '';
  width: 2px;
  height: 14px;
  background: var(--pump-purple);
  border-radius: 2px;
  box-shadow: 0 0 8px rgba(139,0,255,0.4);
  margin-right: 3px;
}

.superset-connector__label {
  font-size: 8px;
  font-family: 'Space Mono', monospace;
  font-weight: 700;
  color: var(--pump-purple-mid);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
```

### Bottom Tab Bar

```css
.tab-bar {
  display: flex;
  justify-content: space-around;
  padding: 8px 10px 14px;
  background: var(--pump-bg-card);
  border-top: 1px solid var(--pump-border-card);
}

.tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  font-size: 8px;
  font-weight: 600;
  font-family: 'Outfit', sans-serif;
  color: var(--pump-text-dim);
}

.tab--active {
  color: var(--pump-hot);
}

.tab__icon {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  background: currentColor;
  opacity: 0.2;
}

.tab--active .tab__icon {
  opacity: 1;
}
```

---

## 5. Layout

### Page Background

```css
body {
  background: var(--pump-grad-page);
  font-family: 'Outfit', sans-serif;
  color: var(--pump-text);
}
```

### Spacing

- Card padding: `11px 13px`
- Card margin-bottom: `8px`
- Card border-radius: `14px`
- Set grid: `grid-template-columns: 22px 1fr 1fr 22px; gap: 5px;`
- Section padding: `14px`

### Border Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--pump-radius-card` | 14px | Cards, modals |
| `--pump-radius-input` | 7px | Input fields |
| `--pump-radius-button` | 10px | Secondary/ghost buttons |
| `--pump-radius-cta` | 14px | Primary CTA buttons |
| `--pump-radius-pill` | 999px | Tags, badges, edit buttons |
| `--pump-radius-check` | 5px | Set completion checkmarks |
| `--pump-radius-phone` | 36px | Device frame (splash only) |

---

## 6. Retrowave Header Scene

The header scene appears on the splash/loading screen and optionally as a collapsible header on the workout screen. It contains the only instance of the PUMP brand mark (Monoton).

### Structure

```
┌──────────────────────────────────┐
│  Stars (scattered white dots)    │
│                                  │
│         Cyan corona (blurred)    │
│         ┌─────────────┐         │
│         │  Half-sun    │         │
│         │  (semicircle │         │
│         │   with cuts) │         │
│         └──────────────┘         │
│  Mountains ▲  ▲    ▲   ▲        │
│  Palm(L)            Palm(R)     │
│  ═══ horizon line (cyan/pink) ══│
│  ╱╱╱╱╱ perspective grid ╱╱╱╱╱╱ │
│  ╱╱╱╱╱ (animated scroll) ╱╱╱╱╱ │
│                                  │
│        PUMP  (Monoton)           │
│   TRAIN LIKE IT'S 1987          │
│                                  │
│  [scanline overlay]              │
└──────────────────────────────────┘
```

### Key elements

- **Sky:** Vertical gradient from near-black (#050818) through deep purple, magenta, hot pink, orange, gold, then abrupt cut to pink/maroon/dark below the horizon
- **Sun:** Half-circle (semicircle clipped at horizon). Radial gradient from gold center to hot pink edge. Horizontal band cuts that get wider toward the bottom. Shadow glow in pink and cyan.
- **Cyan corona:** Two radial gradients behind the sun. Outer (200px, heavily blurred) and inner (140px, lightly blurred). Both centered on sun position. These create the backlit cyan halo.
- **Mountains:** CSS triangles in dark purple, positioned along the horizon.
- **Palm trees:** SVG silhouettes (assets/palm_1.svg through palm_4.svg). Fill color: `#12001e`. Left palm is taller, right palm is mirrored (`scaleX(-1)`) and slightly shorter.
- **Horizon line:** Full-width, 2px, gradient from transparent to cyan to pink to cyan to transparent. Box-shadow in cyan and pink.
- **Grid:** Perspective-transformed repeating grid (cyan vertical lines, pink horizontal lines). Animated scrolling toward the viewer at 1.8s loop. This is the "driving into the sunset" effect.
- **Title:** "PUMP" in Monoton, sunset gradient fill, triple drop-shadow (pink glow + larger pink glow + cyan offset). Centered in the scene.
- **Tagline:** "TRAIN LIKE IT'S 1987" in Space Mono, uppercase, wide letter-spacing, cyan color with cyan text-shadow.
- **Scanlines:** Full-scene overlay of 2px transparent / 2px rgba(0,0,0,0.03) repeating stripes. CRT texture.

### Grid animation

```css
@keyframes grid-scroll {
  0%   { transform: rotateX(58deg) translateY(0); }
  100% { transform: rotateX(58deg) translateY(28px); }
}

.grid-plane {
  animation: grid-scroll 1.8s linear infinite;
}
```

---

## 7. Screen Specifications

### Active Workout Screen

Top to bottom:
1. Session name in Pacifico (e.g., "Push Day") + time in Space Mono
2. Plan name in Space Mono, dim color
3. Exercise cards stacked vertically
4. Bottom tab bar

Each exercise card contains:
- Exercise name (Outfit 800) + PR badge if applicable + target tag (e.g., "4x8-10")
- Set rows in a 4-column grid: set number | weight input | reps input | check
- Active set has pink-bordered inputs with glow
- Completed sets show gradient checkmark
- Future sets show target weight dimmed with a dash for reps

### Session Preview Screen

Top to bottom:
1. "PREVIEW" label in Space Mono, cyan color, uppercase
2. Session name in Pacifico
3. Exercise count + estimated time in Space Mono
4. Preview cards (one per exercise): name, target (sets x reps @ weight), edit button
5. "Let's Go" CTA button (Pacifico, gradient background, pink glow)
6. Bottom tab bar

Preview cards use the cyan glow variant. Each has a gradient left-edge accent (ice gradient, 3px, 50% opacity). Edit buttons are pill-shaped, pink text on pink-tinted background.

---

## 8. Assets

### Palm Tree SVGs

Located in `assets/`. Four variants for scene composition:

| File | Dimensions | Use |
|------|-----------|-----|
| palm_1.svg | 743 x 1129 | Left side, tall |
| palm_2.svg | 768 x 1087 | Left side, alternate |
| palm_3.svg | 885 x 1066 | Right side (mirrored) |
| palm_4.svg | 998 x 1103 | Right side, alternate |

All SVGs have a default fill of `#0c0c0c`. Override to `#12001e` (var(--pump-palm)) in CSS or inline. Mirror right-side palms with `transform: scaleX(-1)`.

### Sound (PR celebration)

Use Web Audio API to play a short chime (under 2 seconds) that mixes with existing audio playback. Do not interrupt music/podcasts. See BUG_FIXES.md spec #3 for implementation.
