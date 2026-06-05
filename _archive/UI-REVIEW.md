# PUMP UI Review — Miami Heat Wave Implementation Audit

**Audited:** 2026-04-20
**Baseline:** `april 15/DESIGN_SYSTEM.md` v1.0 + `RETROWAVE_SCENE.html`
**Scope:** `src/app/page.tsx`, `src/app/globals.css`, all files in `src/components/workout/` except `ui/*` shadcn primitives
**Overall pillar total: 42/60 — "Good, not finished."**

---

## Executive summary

PUMP has absorbed about **75%** of the Miami Heat Wave spec cleanly — the retrowave scene, card glow system, tag styles, tab bar, and the two hero-screen CTAs (dashboard and preview "Let's Go") are on-model and look sharp. But the redesign hasn't finished landing: a large portion of the UI below the retrowave band still runs on the **old `.glass` + `rounded-xl/2xl`** world, which means many surfaces inherit a 14px radius via `--radius` while also explicitly declaring `rounded-2xl` (~28px via the scale) — the spec calls for a single 14px card radius. The clearest pattern issues:

1. **`.glass` is everywhere and `.pump-card` is barely used.** SessionSummary, CardioWorkout, WorkoutHistory, SessionDetailView, Dashboard, the Timer card, the session-stats panel in GymWorkout, and the PR celebration banner all use `.glass` instead of the spec'd `.pump-card` variants, so they lose the spectrum-bar `::before` top edge entirely.
2. **Leftover dark-theme color references.** Four files still emit `oklch(0.85 0.25 125 / …)` (the old lime-green accent) and several components use `border-white/5` / `border-white/10`, which were tuned for a dark theme and barely show against the new ice-tinted light background.
3. **Preview cards are missing the gradient left-edge accent** called for by DESIGN_SYSTEM §7 (Session Preview Screen). `SessionPreview.tsx` applies `pump-card--preview` but no gradient left border.
4. **Typography violations are limited but real.** `RetrowaveScene.tsx` never renders the tagline unless a prop is passed, and `Dashboard.tsx` doesn't pass one — "TRAIN LIKE IT'S 1987" is silently missing from the only place the spec puts it. *(NOTE: this was an explicit design decision — the user removed the tagline in commit `ad9bc6d`. Flag as "deliberate drift from spec" rather than a bug.)*
5. **`.pump-card` default vs `.pump-card--preview` border-colors collide** — default uses `--pump-border-cyan` (0.10α) which is *identical to preview*. Spec calls for default at 0.06α (softer), preview at 0.10α.

Once these are addressed, the app reads as one unified Miami Heat Wave surface rather than two eras of the redesign riding alongside each other.

---

## Pillar scores

### 1. Visual consistency with the design system — 6/10
The retrowave hero, tags (`.tag--pr/target/superset/warmup`), PR badge, and CTAs are faithful reproductions. But `.pump-card` has only been adopted in three places — `GymWorkout` exercise cards, `SessionPreview` exercise cards, and `SessionSummary` exercise-breakdown rows. The rest still wear `.glass` + `rounded-xl/2xl`, which means no spectrum-bar, wrong radius, no state variants. Redesign is mid-migration and visible as such.

### 2. Typography hierarchy — 8/10
Fonts almost always honored: Monoton locked to retrowave title, Pacifico on session names + "Let's Go" CTAs, Outfit on UI, Space Mono on numeric data. Three drifts: (a) retrowave tagline missing (deliberate), (b) `SessionDetailView` double-titles (nav "SESSION" + body "GYM WORKOUT"), (c) `Dashboard` uses `text-gradient-vertical` on section titles ("RECENT" / "PERSONAL RECORDS") — spec is silent on section titles.

### 3. Color system + contrast / a11y — 6/10
Core tokens correct. Specific issues:
- `text-primary` (#FF0080) on white at small sizes measures ~4.4:1 — WCAG AA fail for body text where hot-pink is the *only* role signal.
- `text-accent` = `--pump-cyan-deep` (#00A89E) on white ~3.0:1 — fails AA for small body text, passes for large. Used on small captions.
- `text-muted-foreground` (#7A7299) on white ~4.9:1 — passes AA narrowly.
- `border-white/5` / `border-white/10` leftovers from dark theme — invisible on the ice background.
- Live countdown (WorkoutTimerBar) urgency relies on glow + pulse-neon — no text-change fallback for reduced-motion.

### 4. Spacing and layout rhythm — 7/10
`.pump-card` declares spec padding (`11px 13px`) but consumers override with `p-3/p-4/p-6`. Mixed stack gaps. Card margin-bottom: spec `8px`, some use `space-y-2` (8), others `space-y-3/4`. **Collision risk:** on iPhone 13 mini widths, the WorkoutTimerBar's right-side rest chip + X + interval badge can wrap. BottomTabBar + WorkoutTimerBar safe-area handling correct.

### 5. Motion and interaction quality — 8/10
Framer-motion use generally well-chosen: `layoutId="tab-dot"` / `"tab-indicator"` on BottomTabBar is exactly the kind of motion that communicates "this one is active." Grid animation respects `prefers-reduced-motion`. But:
- `animate-shimmer` / `animate-pulse-neon` don't respect reduced-motion.
- `animate-count-up` / `float` / `celebrate` / `stagger-*` / `bg-dots` utilities defined in globals.css but never used — dead.
- Dashboard stacks 4 fixed absolute divs behind content (halo + grid + radial); none gated on reduced-motion.

### 6. Information hierarchy + one-handed mid-gym UX — 7/10
Critical path well-considered: sticky WorkoutTimerBar, thumb-sized rest presets, target+PR tags atop exercise cards, `touch-target` min-52 on inputs. But:
- Exercise card's add/duplicate button row cramped on iPhone SE.
- Destructive set-delete X with no confirm or undo — a slip erases a set mid-gym.
- Set-row grid uses `grid-cols-4 gap-2` instead of spec's `22px 1fr 1fr 22px / gap 5px`, wasting space on the set-number cell.
- Reps Input missing explicit `inputMode="numeric"` — iOS 17+ sometimes shows full keyboard.
- Back gesture confirm fires mid-workout even with zero logged sets.

---

## Findings by severity

### BLOCKER

**B1. `.pump-card` default border too bright; indistinguishable from `.pump-card--preview`**
`src/app/globals.css:272,310`. Spec §3 says default `rgba(0,255,238,0.06)`, preview `rgba(0,255,238,0.10)`. Both currently set to `--pump-border-cyan` (0.10). The distinction the spec draws between "default" and "preview" is lost.
**Fix:** Add `--pump-border-card-soft: rgba(0, 255, 238, 0.06)` and use it on `.pump-card`, keep `--pump-border-cyan` on `.pump-card--preview`.

**B2. Four components emit the dead lime-accent color `oklch(0.85 0.25 125 …)`**
`SessionStart.tsx:49`, `SessionSummary.tsx:116`, `Timer.tsx:53,54`. Pre-redesign dark+lime theme. Produces a faint greenish radial wash clashing with Miami palette.
**Fix:** Replace with `rgba(255,0,128,0.12)` or `rgba(0,255,238,0.10)` keyed off the new palette.

*(Note: retrowave tagline omission was audited as a BLOCKER by the auditor but is actually a deliberate user decision in commit `ad9bc6d`. Not a bug.)*

### MAJOR

**M1. `.glass` used instead of `.pump-card` on most surfaces**
- `Dashboard.tsx`: Plan status chip, StatCard, Recent sessions rows, PR panel, Empty state
- `SessionSummary.tsx`: stats grid, exercise-breakdown container, brief panel, PR celebration
- `CardioWorkout.tsx`: add-activity form, session-stats panel, CardioEntryCard
- `GymWorkout.tsx`: PR celebration, ADD-exercise sheet, session-stats panel, cardio-toggle button, add-interval button
- `WorkoutHistory.tsx`: stats summary cards, empty state, session rows, month header bg
- `SessionDetailView` (in `page.tsx:488+`): every card
- `PlanLoader.tsx`: entire tree
- `Timer.tsx:42`: main timer card

**Impact:** No spectrum-bar top edge, wrong radius (~28px where spec says 14px), no state variants.
**Fix:** Migrate to `.pump-card` (+ `--preview` / `--superset` where relevant). `.glass` utility can stay as backwards-compat shim.

**M2. Preview cards missing the ice-gradient left edge**
DESIGN_SYSTEM.md §7: "Preview cards use the cyan glow variant. Each has a gradient left-edge accent (ice gradient, 3px, 50% opacity)." `SessionPreview.tsx:107–117` applies `pump-card pump-card--preview` but no gradient left accent.
**Fix:** Add `.pump-card--preview::after` pseudo-element with `background: var(--pump-grad-ice); width: 3px; left: 0; inset-block: 0; opacity: 0.5;`.

**M3. Nav bar script title renders at `text-3xl` — crowded on iPhone SE**
`src/app/page.tsx:188`. Script-font titles "Plan" / "History" / "New Workout" at 30px Pacifico with `text-glow-hot`. On a 320px wide viewport the title is squeezed between back chevron + "BACK" label and the 40px timer button.
**Fix:** Reduce to `text-2xl` on `sm` breakpoint, or move "BACK" label to icon-only on root views.

**M4. `SessionDetailView` double-titles the page**
Nav shows "SESSION" at top, body shows `font-display text-4xl` "GYM WORKOUT" / "CARDIO WORKOUT". User preference in MEMORY.md: "no duplicate nav titles."
**Fix:** Pick one. Preferred: remove body title, put the date in the nav slot instead.

**M5. Set-row grid disagrees with spec**
Spec §5: `grid-template-columns: 22px 1fr 1fr 22px; gap: 5px;`. Implementation: `grid-cols-4 gap-2` (equal columns, 8px gap). Set-number cell is 3-4× wider than needed on iPhone widths, crowding the weight/reps inputs.
**Fix:** `grid-cols-[22px_1fr_1fr_22px] gap-[5px]`.

**M6. `border-white/5` / `border-white/10` leftovers from dark theme**
- `SessionSummary.tsx:402,404`
- `PlanLoader.tsx:163,189,216`
- `SessionPreview.tsx:201`
- `SessionDetailView` in `page.tsx:659`
- `Dashboard.tsx:246`
- `ExerciseAutocomplete.tsx:177`
**Fix:** Swap for `border-[color:var(--pump-border-card)]`.

**M7. `rounded-xl` / `rounded-2xl` inconsistency**
Spec: 14px card radius. Tailwind mapping: `rounded-xl` → ~21px, `rounded-2xl` → ~28px. ~55 occurrences across 9 files. Cards at 28px next to `.pump-card` at 14px on the same screen.
**Fix:** Standardize on `rounded-lg` (maps to `--radius` = 14px) for card-scale surfaces, or migrate to `.pump-card`.

**M8. Exercise card header "HIST" button label is opaque**
`GymWorkout.tsx:529`. "HIST" isn't a standard abbreviation. Costs the user a beat mid-set.
**Fix:** Lucide `History` icon with aria-label, or full word "HISTORY".

**M9. Destructive set deletion has no confirm or undo**
`GymWorkout.tsx:665`. Single tap on X removes a logged set. No undo, no toast. Mid-gym mis-tap erases a PR attempt.
**Fix:** Short toast with Undo (3s), or long-press requirement.

### MINOR

- **m1** `.superset-connector` from spec §4 not implemented. `GymWorkout.tsx:202–227` uses flat "SUPERSET" text.
- **m2** `.check--done` / `.check--pending` spec classes (§4) not used — hand-rolled pattern in `GymWorkout.tsx:737–744`.
- **m3** `.btn-edit` spec class (§4) not implemented.
- **m4** Dashboard "EXPORT BACKUP" button has `opacity-50` with no explanation — reads as disabled.
- **m5** `text-gradient-vertical` on Dashboard section titles — spec silent on section titles.
- **m6** PR celebration banner in gym view uses cyan accents; SessionSummary uses sunset `.pr-badge`. Inconsistent.
- **m7** `IntervalRunner` progress-dot strip can overflow on long sequences (50-step Tabata → 50 dots wrapping). Cap or collapse to a progress bar when `>20`.
- **m8** `glass-strong` used only once (Timer sheet). Keep or inline.
- **m9** `animate-float`, `animate-celebrate`, `animate-count-up`, `bg-dots`, `stagger-*` defined but unused. **Delete.**
- **m10** `.font-brand` utility defined but never applied (Monoton applied inline). **Delete.**
- **m11** `.tag--warmup` correctly implemented but used on "BASELINE" label (different semantic), not on actual warmup sets.
- **m12** Shadcn Calendar inside SessionStart Popover — selected-day picks up `--primary` (hot-pink, correct) but hover/outside-month states untuned.
- **m13** SessionPreview bottom action bar `border-white/10` (invisible).
- **m14** ExerciseAutocomplete "Add custom" row uses cyan while rest is pink-dominant — semantic muddle.

### NIT

- **n1** BottomTabBar `max(env(safe-area-inset-bottom), 0px)` — `0px` default is redundant (iOS returns 0 if absent).
- **n2** PR banner `⚡` emoji renders differently on iOS vs macOS Safari.
- **n3** WorkoutHistory sticky month header `bg-background/80 backdrop-blur-sm` floats over a `space-y-8` gap. Reduce to `space-y-6`.
- **n4** SessionSummary "CRUSHED IT!" at `text-6xl tracking-wider` wraps awkwardly on 320px.
- **n5** IntervalRunner header right-column "Step N / M" crowds when sequence name wraps.
- **n6** Bodyweight / Warmup toggles use hand-rolled checkbox; switch to shadcn `Checkbox` for consistency.
- **n7** Retrowave stars opacity 0.4–0.7 barely visible against deep-purple sky. Matches reference HTML — acceptable.
- **n8** `getViewTitle()` mixes title case ("New Workout") and uppercase ("SESSION PREVIEW") — correct given the case split, just worth noting.

---

## Spec drift map

| Spec reference | Implementation location | Drift |
|---|---|---|
| §3 Card — `border-radius: 14px`, padding `11px 13px`, margin-bottom `8px` | `globals.css:268–293` (correct); consumers override in ~55 places | Consumers override |
| §3 Card default border `rgba(0,255,238,0.06)` | `globals.css:272` uses `--pump-border-cyan` (0.10) | 67% brighter than spec |
| §3 Card active `rgba(255,0,128,0.1)` | `globals.css:296` correct | — |
| §3 Preview `rgba(0,255,238,0.1)` | same as default base — no distinction | Loss of variant contrast |
| §4 Tags | `globals.css:358–372` correct | — |
| §4 PR badge | `globals.css:374–387` correct | — |
| §4 Buttons `.btn-primary--ui` / `.btn-secondary` / `.btn-ghost` / `.btn-edit` | shadcn `<Button>` used; classes not defined | Spec classes unimplemented |
| §4 Set input `.set-input` + `.set-input--active` | Not defined; hand-rolled via shadcn `<Input className="touch-target text-center font-mono">` | No pink-border focus state |
| §4 Checkmark `.check` / `.check--done` / `.check--pending` | Not defined; hand-rolled in `GymWorkout.tsx:737–744` | Minor |
| §4 Superset connector | Not defined; flat text in `GymWorkout.tsx:202–227` | Flat label instead |
| §4 Tab bar | Close; spec uses 8px font, impl `text-[9px]` + framer layoutId | Acceptable |
| §5 Set grid `22px 1fr 1fr 22px / gap 5px` | `GymWorkout.tsx:588,594,632` uses `grid-cols-4 gap-2` | Drift |
| §5 Border radius scale (14/7/10/999/5/36) | Only `--radius: 14px` defined; rest missing | Partial |
| §6 Retrowave scene | `RetrowaveScene.tsx` + `globals.css:526–766` match closely | Tagline intentionally removed |
| §7 Active Workout — "Session name in Pacifico (e.g. 'Push Day')" at top | `GymWorkout.tsx:485` uses `font-display` uppercase; no Pacifico in-session header | **Major drift — Pacifico not used on in-session header** |
| §7 Preview card — gradient left-edge accent (ice, 3px, 50%) | `SessionPreview.tsx` not present | Missing |
| §8 Palm SVG fill `#12001e` via mask-image | `RetrowaveScene.tsx:92–111` correct | — |

---

## Dead code / orphaned styles

Defined in `globals.css` with zero consumers:

- `.animate-float` (lines 446–448, 463)
- `.animate-celebrate` (433–439, 462)
- `.animate-count-up` (451–454, 464)
- `.stagger-1` through `.stagger-5` (477–481)
- `.bg-dots` (492–495)
- `.font-brand` (194–197)
- `.text-gradient-ice` (223–229)

**Recommendation:** Delete all of the above (~40 lines). Spec reference remains the source.

Low-usage worth keeping:
- `.glass-strong` — 1 usage (Timer sheet)
- `.hide-scrollbar` — 1 usage (Dashboard PR list)

---

## Questions for designer

1. **Section titles** — Dashboard uses `text-gradient-vertical` on "RECENT" / "PERSONAL RECORDS". Spec silent. Intentional or should they be flat `text-pump-text`?
2. **Active workout header** — §7 calls for session name in Pacifico ("Push Day") at top of active workout. Currently no Pacifico session name on the active workout screen. Should it live above the timer bar?
3. **`.glass` vs `.pump-card` future** — retire `.glass` once migration completes, or keep as alias?
4. **Session Detail double-title** — nav "SESSION" + body "GYM WORKOUT". Remove body title?
5. **PR celebration** — cyan (GymWorkout banner) vs sunset (`.pr-badge` in SessionSummary). Which canonical?
6. **EXPORT BACKUP** — subtle system affordance or first-class? Current `opacity-50` reads as disabled.
7. **Preview gradient left-edge** — all ice, or swap to hot for superset pairs?
8. **Script-font nav title glow** — spec'd or freelance? Removing glow may improve legibility on narrow screens.
9. **Shadcn primitive theming parity** — per-primitive theming pass in a variants file, or inline overrides per consumer?

---

## Top 5 priority fixes (in order)

1. **Migrate `.glass` users to `.pump-card`** (M1) — largest single consistency win.
2. **Fix `.pump-card` default border alpha** (B1) — 2-line CSS change restores variant distinction.
3. **Purge the lime `oklch()` artifacts** (B2) — 5 occurrences across 4 files.
4. **Add the gradient left-edge to preview cards** (M2) — signature flourish missing.
5. **Fix set-row grid to `22px 1fr 1fr 22px`** (M5) — single-line change, mid-gym usability win.

---

*See companion file `REVIEW.md` for the behavioral / correctness audit.*
