# PUMP — Design Philosophy

> The **Volume System** is how PUMP looks and feels. Successor to v1 *Miami Heat Wave*
> (`_archive/DESIGN_SYSTEM_v1.md`). v1 defined the vocabulary (palette, fonts, cards).
> This defines the *grammar* — how loud each surface is allowed to be — so the 80s
> attitude reads as intentional swagger instead of uniform noise, while the screens
> you actually work in get out of the way.
>
> Status: **In production.** Pass 1–5 shipped to `main` (Pass 5 closed the
> mockup-vs-live audit). Outstanding work is tracked in `MOCKUP_AUDIT.md`.

---

## 1. North star

The vibe is right; the problem was **one volume, glued to 11, everywhere**. The fix
is **dynamic range**, not restraint. Keep the loud — give it a fader.

- **Loud chrome, calm canvas.** Swagger lives in the hero, CTAs, headers, and reward
  moments. The surfaces you log into get quiet so the loud moments land.
- **Calm ≠ clean.** PUMP's quiet register is still neon-trimmed synth-noir (color
  accents, spectrum bars, confident type) — never a clean SaaS look. **No Inter.
  No Instrument.** No tasteful minimal.
- **Contrast is the mechanism.** You can only feel a PR celebration pop if the
  set-logging screen around it was calm.

---

## 2. The three volumes (the spine)

Every component is assigned a volume. This is the whole system.

**V3 — SHOWPIECE** (rare, earned, maximum attitude)
Hero wordmark, primary CTAs, PR celebration, workout-complete, streaks.
Everything fires: Monoton/Pacifico, full glow, gradients, the `pump-pr-burst.png`
backdrop, sound, the live retrowave scene. Earned by the calm everywhere else.

**V2 — ATTITUDE** (ambient brand, the chrome)
Screen titles, section headers, stat labels, tab bar, tags, card trim. Stays loud —
Outfit 800 caps + tracking, spectrum-bar card edge, gradient headers — but **flat,
not glowing.** `text-glow-*` dropped here: loud *and* legible. This is where the
brand lives day-to-day.

**V1 — WORK** (the cockpit you live in)
Active set rows, inputs, the numbers you parse mid-set, dense lists, data-entry
sheets. The only place we pull back — and it's still 80s: big confident
**Outfit-tabular numerals**, single accent, spectrum-bar trim, near-black on white.
Reads like a synth control panel: precise, functional, neon-trimmed.

---

## 3. Typography

One family does the work; two display fonts add personality. **Space Mono is
retired** — it read "techie/cold."

| Voice | Job | Where |
|---|---|---|
| **Monoton** | Brand mark only | Wordmark, V3 hero moments |
| **Pacifico** | The wink / personality | CTAs, named moments ("Let's Go", "Save Reading", "Done", "Open with trainer", session names) |
| **Outfit 800, caps, tracking** | Structural shout (V2 chrome) | Titles, section labels, tags, buttons, status pills |
| **Outfit 500–600, sentence case** | Quiet register (V1 work) | Helper text, inputs, list rows, list captions |
| **Outfit, `tabular-nums`** | All numbers / data | Weights, reps, BP, timers, volumes, stats |

Tailwind `font-mono` className resolves to Outfit via `--font-mono`. The Pass 5
cleanup swept the remaining `font-mono` classNames to `tabular-nums` across the
workout components (only comments in `layout.tsx` still mention it).

---

## 4. Color

- **Brand roles (locked):**
  - **Hot-pink** `#FF0080` — primary action + brand
  - **Cyan-deep** `#00A89E` — secondary / cardio / sync
  - **Purple** `#8B00FF` — supersets
- **Status is a separate ramp,** deliberately outside the brand palette, so
  "you're in Stage 2" never reads as "this is a button":
  - BP green→amber→orange→hot→red AHA scale. Reuse for any health/status signal.
- **Glow is a state, not a texture.**
  - Resting cards → soft shadow only.
  - `glow-hot` / `glow-neon` reserved for: active set, new PR, urgent rest timer.
- **No dark-theme leftovers:** `border-white/5/10` are invisible on ice bg —
  removed across all refreshed surfaces.

---

## 5. The Overlay Contract (hard rule, enforced at the primitive)

Every sheet / modal / dialog MUST:

1. **Clamp to the viewport** (`dvh` height + safe-area), never size to content.
2. **Have a persistent, reachable dismiss** — ≥44px close in a sticky header,
   plus scrim tap-out + Escape — independent of scroll position.
3. **Scroll in one inner region;** header and footer pinned.
4. **Be acceptance-tested by measurement** on the smallest target (375×667):
   the dismiss must be on-screen without scrolling.

This bit us three times (BP height, BP first attempt, Reorder). Root cause: the
base `Sheet` primitive's `data-[side=bottom]:h-auto` default. **Fixed once at the
primitive** in `src/components/ui/sheet.tsx`, so all future sheets inherit the
contract.

---

## 6. Motion budget

- V1/V2 transitions ≤ 150–200ms (arcade-snappy). Save indulgent motion for V3.
- `animate-count-up` on numbers, `animate-pulse-neon` on urgent state (rest timer,
  pulsing "Let's Go" CTA).
- Gate ambient background animation on `prefers-reduced-motion`.

---

## 7. Asset inventory

**Active / brand assets (in use):**
- `pump-header.png` — neon "Pump" banner, dashboard hero (V3)
- `letspump3-transparent.png` — brushy "Let's Pump!" wordmark, sign-in splash (V3)
- `new-PR.png` — wordmark over the PR burst (V3, in PRMomentScreen)
- `pump-pr-burst.png` — vertical 3:4 starburst backdrop for the PR moment
- `pump-scene-empty.png` — floating dumbbell night-sky, sign-in + splash
- `pump-scene-beach.png` — beach scene, dashboard first-run empty state (in use)
- `pump-scene-complete.png` — sunset balcony, workout-complete hero band (in use)
- `pump-scene-gym.png` — neon gym, cockpit atmospheric header in `WorkoutTimerBar` (in use)
- `pump-scene-cardio.png` — neon highway, reserved for the deferred cardio "start" splash
- `pump-icon-192.png` / `pump-icon-512.png` / `apple-touch-icon.png` — PWA icons (wordmark)

**Retired (archived in `_archive/`):**
- v1 `DESIGN_SYSTEM.md` (Miami Heat Wave) — superseded by this doc.
- `RETROWAVE_SCENE.html` + `palms/palm_*.svg` — orphaned reference for the
  unused `RetrowaveScene.tsx` component.

**Audio:**
- `Short But Huge, Very Action Bomb Movie Explosion.mp3` — PR reward sound,
  played via Web Audio (see `src/lib/sounds.ts`).

---

## 8. Tokens (the cascade)

Foundation utilities defined in `src/app/globals.css`. Opt-in tokens:

- **Type registers:** `.text-body-quiet` (V1), `.label-caps` (V2), `.label-caps-cyan`
- **Surfaces:** `.surface-warm`, `.surface-warm--hot`
- **State glow:** `.glow-state` + `.glow-state--active|urgent|win`
- **Status colors (outside brand palette):** `.status-bp-normal|elevated|stage1|stage2|crisis`
- **Cards:** `.pump-card` + `--active|preview|superset` modifiers (V1 source-of-truth
  pattern; legacy `.glass` is being phased out)
- **Spectrum bar:** the 3px gradient top edge on `.pump-card::before`

The **`/design`** dev route (`src/app/design/page.tsx`) renders every token in
context — sibling to `/mockup` which shows the screens.

---

## 9. What shipped vs. open

For the latest punch list see **`MOCKUP_AUDIT.md`** at the project root.

**Shipped (Pass 1–4):**
- Foundation tokens, Space Mono retirement, Sheet primitive Overlay Contract,
  `/design` reference page.
- Volume System applied to: sign-in, dashboard, workout-complete, BP sheet,
  history list, session detail, plan view, cardio session token swap.
- Tech fixes: exercise name normalization (with backfill), records from curated
  `prs` Supabase table, idempotent session writes.
- Floating glass-pill back button on scroll.
- Dashboard alignment to `/mockup §01` (BP inline heart, real plan session names).

**Shipped (Pass 5 — closed the audit):**
- **Gym cockpit atmospheric header** — `WorkoutTimerBar` rebuilt on the
  `pump-scene-gym.png` band: session meta (cyan caps) + up-next exercise
  (Pacifico) + elapsed + rest controls; rest pill pulses via
  `glow-state--urgent`. Inline pink note panel on the active card. Pacifico
  "Finish Workout" CTA. Timer logic unchanged.
- **PR full-screen reward** — `PRMomentScreen` fires in-session when `newPRs`
  grows (`pump-pr-burst.png` + `new-PR.png` + Pacifico exercise + "up from").
- **Workout-complete hero scene band** — `pump-scene-complete.png` overlay +
  Pacifico session name + `min · sets · lbs moved` caption.
- **Named feel rating** — Brutal / Tough / OK / Good / Easy (`SessionSummary`).
- **Dashboard empty state** — `pump-scene-beach.png` scene card.
- **BP sheet SYS/DIA card** — `.surface-warm` + spectrum-bar trim.
- **Sign-in logo** — `letspump3-transparent.png`.
- **BP heart overflow** — safe-area-inset-right gutter.
- **`sessionLabel(s, plan)`** — promoted to `src/lib/utils.ts`; applied on
  Dashboard Recent, History list, Session detail.
- **`font-mono` className sweep** — replaced with `tabular-nums` app-wide.

**Deferred / open questions:**
- Fused superset block (one card, two halves, single shared input) — meaningful
  UX change. Queued as its own scoped pass (not bundled with visual refresh).
- Cardio "cinematic" treatment — keep the functional logger; add a pre-flow
  "Start cardio" splash (`pump-scene-cardio.png`) later. Logger-first for now.
- `.glass` → `.pump-card` migration — broad cosmetic cleanup, lowest priority.

---

## 10. Practical rules of thumb

- **The mockup is the spec.** `/mockup` defines intent; deviations need explicit
  sign-off, not silent overrides during a refactor.
- **Visual refresh is cheap and reversible. UX redesign is neither.** Never bundle
  the two in one pass.
- **Pacifico for moments, Outfit-caps for chrome, Outfit-tabular for data.** If
  it's a number, it's tabular. If it's a structural label, it's caps tracked. If
  it's a "wink" or named moment, it's Pacifico.
- **Status uses the status ramp, not brand.** Hot-pink is never a warning;
  cyan-deep is never a success.
- **Don't ambient-animate.** Glow + motion are reserved for state.
- **End-of-session docs sweep is mandatory.** When a UI fix or feature ships,
  reflect it in `CLAUDE.md` + `BACKLOG.md` + this doc before considering the
  work done.
