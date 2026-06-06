# PUMP — Volume System (Design Elevation v2)

> Successor direction to `DESIGN_SYSTEM.md` (Miami Heat Wave v1). v1 defined the
> *vocabulary* (palette, fonts, cards). This defines the *grammar* — how loud
> each surface is allowed to be — so the 80s attitude reads as intentional
> swagger instead of uniform noise, while the screens you actually work in get
> out of the way. Nothing here is "tasteful minimal." No Inter. No Instrument.

Status: **DRAFT for local iteration.** Not implemented. Iterate before any push.

---

## 1. North star

The vibe is right; the problem is **one volume, glued to 11, everywhere**. The
fix is **dynamic range**, not restraint. Keep the loud — give it a fader.

- **Loud chrome, calm canvas.** Swagger lives in the hero, CTAs, headers, and
  reward moments. The surfaces you log into get quiet so the loud moments land.
- **Calm ≠ clean.** PUMP's quiet register is still neon-trimmed synth-noir
  (color accents, spectrum bars, confident type) — never a clean SaaS look.
- **Contrast is the mechanism.** You can only feel a PR celebration pop if the
  set-logging screen around it was calm.

---

## 2. The three volumes (the spine)

Every component is assigned a volume. This is the whole system.

**V3 — SHOWPIECE** (rare, earned, maximum attitude)
Hero wordmark, primary CTAs, PR celebration, workout-complete, streaks.
Everything fires: Monoton/Pacifico, full glow, gradients, `celebrate`
animation, sound, the live retrowave scene. Today these are *underplayed*
because the rest of the app is already this loud.

**V2 — ATTITUDE** (ambient brand, the chrome)
Screen titles, section headers, stat labels, tab bar, tags, card trim.
Stays loud — Outfit 800 caps + tracking, spectrum-bar card edge, gradient
headers — but **flat, not glowing.** Drop `text-glow-*` here: loud *and*
legible. This is where the brand lives day-to-day.

**V1 — WORK** (the cockpit you live in)
Active set rows, inputs, the numbers you parse mid-set, dense lists, data-entry
sheets. The only place we pull back — and it's still 80s: big confident
**Outfit tabular numerals**, single accent, spectrum-bar trim, near-black on
white. What it loses is *simultaneous* glow + caps + script + tracking fighting
at once. Reads like a synth control panel: precise, functional, neon-trimmed.

---

## 3. Typography — keep the attitude, give each voice a job

Four voices, four domains. **No new fonts. No Inter/Instrument.** The fix is
discipline about which voice speaks where — plus retiring Space Mono.

| Voice | Job | Where |
|---|---|---|
| **Monoton** | Brand mark only | Wordmark, V3 hero moments |
| **Pacifico** | The wink / personality | CTAs, named moments ("Let's Go", "CRUSHED IT", session names) |
| **Outfit 800, caps, tracking** | Structural shout | V2 titles, section labels, tags, buttons |
| **Outfit 500–600, sentence case** | The quiet register | V1 helper text, inputs, the boring-but-important text |
| **Outfit, `tabular-nums`** | Numbers / data | weights, reps, BP, timers, volumes |

**Space Mono is retired.** Per the BP rework: it read "techie/cold." It's
currently on tags, the PR badge, timers, and assorted labels. Replace all with
Outfit (tabular figures for numbers). This removes a whole competing voice — the
"calm" register is just Outfit dialed down, which is why it stays on-brand
instead of going generic.

The missing piece v1 lacked: a **quiet register inside Outfit** (500–600,
sentence case) so V1 can be legible without abandoning the family.

---

## 4. Color — one legend, glow as a state

- **Brand roles (locked):** hot-pink `#FF0080` = primary action + brand; cyan
  `#00A89E` = secondary / cardio / sync; purple `#8B00FF` = supersets.
- **Status is a separate ramp,** deliberately outside the brand palette, so
  "you're in Stage 2" never reads as "this is a button": the BP green→amber→
  orange→hot→red AHA scale. Reuse it for any health/status signal.
- **Glow is a state, not a texture.** Resting cards → soft shadow only.
  `glow-hot`/`glow-neon` reserved for: active set, new PR, urgent timer. Today
  everything glows, so `.pump-card--active` barely reads as active.
- **Kill dark-theme leftovers:** `border-white/5/10` (invisible on ice bg),
  mixed `rounded-xl/2xl` vs the 14px `--radius`.

---

## 5. The Overlay Contract (hard rule, learned the hard way)

Every sheet / modal / dialog MUST:
1. **Clamp to the viewport** (`dvh` height + safe-area), never size to content.
2. **Have a persistent, reachable dismiss** — a ≥44px close in a sticky header,
   plus scrim tap-out + Escape — independent of scroll position.
3. **Scroll in one inner region;** header and footer pinned.
4. **Be acceptance-tested by measurement** on the smallest target (SE/mini):
   the dismiss must be on-screen without scrolling.

This bit us three times (BP height, BP first attempt, reorder). Root cause: the
base `Sheet` primitive's `data-[side=bottom]:h-auto` default, which every
consumer silently inherits and overrides. **Fix the primitive once** so the
contract is enforced there, not re-discovered per component.

---

## 6. Motion budget

- V1/V2 transitions ≤ 150–200ms (arcade-snappy). Save indulgent motion for V3.
- Deploy `animate-count-up` on numbers (defined, unused) — on-brand + useful.
- Gate ambient background animation on `prefers-reduced-motion`.

---

## 7. Asset strategy (from the asset audit)

**Activate (we already have these):**
- **Retrowave scene** (`RetrowaveScene.tsx` + the 4 palm SVGs + full CSS) — bring
  it back as the **workout-complete reward** (V3), not an ambient header. Rare =
  special. Currently fully built but orphaned.
- **Logo lockup** — `pump.logo.nobackground.png` (transparent, most versatile)
  for in-app branding; `pump.logo.flat.png` for light surfaces. Define one
  lockup + clear-space rule.
- **Reward sound** — wire the existing explosion/`Web Audio` path to PR/complete.

**Retire:**
- Space Mono (see §3).
- Orphaned wordmark variants (`pump-wordmark*.png`) — keep one, archive rest.
- Default Next.js svgs (`file/globe/window/next/vercel.svg`).

**Create (gaps for polish):**
- Empty-state art: no workouts / no history / no plan / no readings (neon line art).
- A small exercise-pictogram set (barbell, dumbbell, cable, machine, bodyweight).
- Branded loading/sync/offline indicators.
- PR celebration treatment (particles/glow burst tied to `celebrate` + sound).
- OG/social image.

---

## 8. Screen-by-screen direction

- **Dashboard** — hero wordmark (V3) stays; stat row + section headers V2 (flat,
  no text-glow); cards calmer. BP card already exemplifies V1/entry done right.
- **Gym "cockpit" (highest priority)** — set rows to V1: big Outfit-tabular
  numbers, single accent, glow only on the *active* exercise, generous targets,
  **confirm/undo on set delete**, `inputMode="numeric"`. This is the screen you
  live in; it should feel like a focused instrument.
- **Workout complete / PR** — the V3 moment: retrowave scene, sound, count-up,
  the loudest the app ever gets. Earned by the calm everywhere else.
- **Summary / History / Plan** — V2 chrome, V1 lists; retire `.glass` →
  `.pump-card`; kill radius/border drift.
- **All sheets** — conform to the Overlay Contract (§5).

---

## 9. Local iteration & testing plan

The goal: iterate on the *look* fast, locally, without fighting the auth gate or
the multi-view nav, and **never push to `main` until approved.**

**A. Branch.** Do all of this on `design-elevation` (off `main`). `main` stays
shippable; merge only when we're happy.

**B. A dev-only Component Gallery.** Add a route (e.g. `/design`, dev-only /
behind a flag, never linked in the app) that renders every surface and state on
one scrollable page:
- cards: resting / active / superset / preview
- tags, PR badge, buttons (all variants), inputs (idle/active), set row
- the dashboard BP card, stat cards, section headers
- each sheet (BP Log/Recent, Reorder) open inline
- empty states, the V3 reward moment
- a typography + color-token specimen sheet
This sidesteps the gated nav **and** the headless-preview transition limitation
(one static page, no `AnimatePresence`), so both of us can view/screenshot it and
iterate on pixels directly. Delete or keep gated before any prod merge.

**C. Token-first.** Land §3/§4 utilities (quiet Outfit register, glow-as-state,
status ramp, retire Space Mono) before touching screens, so changes cascade.

**D. The loop.**
1. Edit tokens/component → 2. view in the gallery locally (`next dev`; I drive
the preview against `/design`) → 3. screenshot + review together → 4. iterate →
5. when a surface is approved, wire it into the real screen + verify → 6. repeat.

**E. Env / auth for local design work.** The gallery renders ungated (it's a
design surface). For full-app local viewing, a small **dev-only AuthGate bypass**
(`process.env.NODE_ENV === 'development'`) avoids login friction without weakening
production. (Today we hand-move `.env.local` aside — the dev bypass is cleaner.)

**F. Verification standard.** Overlay Contract measured at 375×667; reduced-motion
checked; tsc + `next build` green before any merge.

**G. Push.** Only after you sign off, merge `design-elevation` → `main`.

---

## 10. Phasing

1. **Foundations** — tokens (§3/§4), retire Space Mono, fix the `Sheet`
   primitive (§5), build the Component Gallery (§9B). *No screen looks change yet.*
2. **Gym cockpit** (§8) — highest usability + attitude payoff.
3. **Glow/text-glow sweep** app-wide (§4) — the "intentional, not exhausting" win.
4. **Reward moments** — retrowave-complete scene, PR sound + count-up (§7, V3).
5. **Voice + empty states** — micro-copy, empty-state art, one easter egg.
6. **Cleanup** — `.glass`→`.pump-card`, radius/border drift, prune dead CSS + orphan assets.
