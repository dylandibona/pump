# PUMP — Mockup vs Live Audit

> Read-only audit comparing every `/mockup` section + every live screen against the
> Volume System spec (`VOLUME_SYSTEM.md`). Documents drift, severity, and a
> specific fix for each. **Nothing in this doc has been changed yet** — this is
> the brief for the next thread.
>
> Severity legend:
> - 🔴 **Bug** — broken/visibly wrong, fix first.
> - 🟠 **Drift** — shipped diverged from mockup without explicit sign-off.
> - 🟡 **Polish** — works but doesn't fully realize the system.
> - 🟢 **Aligned** — matches the spec, no change needed.

---

## Cross-cutting bug (your report)

🔴 **BP heart button feels off-screen on the right** (`Dashboard.tsx` plan-chip row).
- Measured: at 320 / 360 / 375 / 390 viewport widths, the button's right edge sits
  at exactly the page `px-4` margin (16px from the viewport edge). It does **not**
  geometrically clip in DevTools.
- But on a real iPhone, Safari's safe-area-inset-right + a vertical scrollbar +
  the page's `max-w-lg mx-auto` interaction can push it past the edge, especially
  when the scrollbar appears (overflow shifts content).
- **Fix:** wrap the plan row in `pr-[max(1rem,env(safe-area-inset-right))]`, or
  drop the button's size from `w-12` to `w-11` on narrow viewports, or pull the
  row's right padding in by 4px to give the button breathing room. Lowest-risk
  fix: change the row container from sitting at the page padding to a slightly
  smaller `pr-3` so there's a guaranteed visual gutter.

---

## §01 Dashboard

**Mockup** (DashboardMock in `/mockup`): hero banner → plan chip + inline heart BP →
"Let's Go" CTA → 3 stat cards (warm tint, Records highlighted hot) → Recent rows
with plan session names → Latest PR dark card with featured-only treatment.

**Live** (`Dashboard.tsx`): matches after Pass 4. Order is right, BP is inline,
stat-card warm tint applies, Records highlighted, Recent rows show plan names.

| Item | Status | Notes |
|---|---|---|
| Hero banner | 🟢 | `pump-header.png`, full-bleed |
| Plan chip + BP inline | 🟢 | Just fixed in Pass 4 |
| Plan chip rendering | 🟡 | Mockup uses subtle white card; live is white card w/ shadow — same. ✓ |
| Let's Go CTA | 🟢 | Pacifico hot gradient |
| Stat cards | 🟢 | `.surface-warm` / `.surface-warm--hot` applied |
| Recent rows label | 🟢 | Plan session names ("Push Day") wired |
| Latest PR card | 🟢 | Dark navy/purple, Pacifico exercise, tabular weight, no emoji |
| Next-best PR list | 🟠 | **Mockup only shows the featured Latest PR card.** Live also renders 6 next-best rows below as small white cards. Decision: keep both? Drop the list? My read: keep both, but call this out as a deviation from the mockup. |
| Bottom EXPORT BACKUP button | 🟠 | Mockup doesn't show it. Live has a faded "EXPORT BACKUP" outline button at the bottom — still appears. Acceptable utility but not in spec. |

**Suggested fixes:**
1. Pull the plan-row right padding in (or shrink the BP button) so it doesn't kiss the screen edge.
2. Decide explicitly: featured-only Latest PR (mockup), or featured + list (current).

---

## §02 Gym cockpit (the screen you live in)

**Mockup** (GymCockpitMock): **atmospheric header band** = `pump-scene-gym.png` cropped
behind a session label ("PUSH DAY · 2 OF 6 DONE · NEXT") + Pacifico exercise name
("Bench Press") + elapsed time + **animated urgent rest timer pill**. Below: clean
**fused superset block** (one card with two halves, single shared next-up input
that flips between exercises), notes button per half (pink when notes exist),
inline rendered notes, big Outfit-tabular set rows. Reorder entry in section
header. Lightning-bolt linked/unlinked connectors between non-superset cards.

**Live** (`GymWorkout.tsx`): **structurally different.** Tactical Pass 2 only swapped
text-glow → flat on the existing layout. None of the atmospheric/structural
changes shipped.

| Item | Status | Notes |
|---|---|---|
| Atmospheric scene header | 🟠 | Not built. Live still uses `WorkoutTimerBar` (clean light bar). |
| Pacifico exercise name in header | 🟠 | Not built |
| Active rest timer with `glow-state--urgent` pulse | 🟠 | `WorkoutTimerBar` does have urgency styling, but not the mockup's standout pill |
| **Fused superset block** | 🟠 | Live still shows two separate cards visually fused via a connector. Mockup is one card with two halves + a shared input. |
| Inline note display | 🟠 | Notes exist in data model but the prominent **pink Note panel** in the active card isn't rendered. |
| Reorder entry in section header | 🟢 | Wired |
| `glow-state--active` on the next-up exercise card | 🟡 | `.pump-card--active` is used but the new `.glow-state--active` opt-in token isn't |
| Set rows: Outfit-tabular numbers | 🟢 | `font-mono` auto-falls-through to Outfit; some places still call `font-mono` (cosmetic) |
| NEW BEST banner | 🟢 | Pass 2 dropped text-glow |
| Session stats card | 🟢 | Pass 2 cleaned up |
| Complete Workout CTA | 🟡 | Mockup uses Pacifico "Finish Workout" sentence case; live uses "COMPLETE WORKOUT" all-caps |

**This is the biggest unshipped piece.** The cockpit refresh I labeled "done" in
Pass 2 was a token swap; the mockup's actual structural rebuild was deferred and
never executed.

**Suggested fixes (ranked):**
1. Atmospheric scene header + Pacifico exercise name (high-impact, structural)
2. Fused superset block (real UX upgrade for supersetting flow)
3. Pink Note panel in the active card
4. "Finish Workout" Pacifico sentence-case CTA
5. Adopt `.glow-state--active` and `.glow-state--urgent` tokens

---

## §03 PR Moment (full-screen)

**Mockup** (PRMomentMock): full-bleed `pump-pr-burst.png` (vertical 3:4) with
overlay: cyan "NEW PERSONAL RECORD" caps, Pacifico exercise name, big
Outfit-tabular "185 × 8" with cyan glow, "up from 175 × 6" caption.

**Live**: **doesn't exist as a real screen.** When a new best lands, the user
sees the existing in-cockpit "NEW BEST!" banner — that's it. No full-screen
reward moment fires.

| Item | Status | Notes |
|---|---|---|
| Trigger point in flow | 🟠 | When `newPRs` count goes up, we currently play a sound + show the banner. The full-screen reward never opens. |
| Component file | 🟠 | Doesn't exist (`PRMomentScreen.tsx` or similar) |
| Asset already in repo | 🟢 | `public/pump-pr-burst.png` is there, ready |

**Suggested fix:** build the `PRMomentScreen` component, render it as a full-screen
overlay (z-50, framer-motion fade) when `newPRs.length` rises during a session.
Add a Continue / Done button to dismiss. Time-box auto-dismiss at e.g. 6s if
untouched.

---

## §04 Workout complete (no PR)

**Mockup** (WorkoutCompleteMock): hero band with `pump-scene-complete.png` (sunset
balcony) overlaid with cyan "WORKOUT COMPLETE" + Pacifico "Push Day" + tiny
"62 min · 18 sets · 12K lbs moved" caption. Body: **Synced-to-trainer band** (cyan
check + plain English), 3 stat tiles (with one highlighted as a new PR if any),
named feel rating (Brutal / Tough / OK / Good / Easy) selected = hot gradient,
Notes for trainer block, **primary "Done" in Pacifico**, secondary "Open with
trainer".

**Live** (`SessionSummary.tsx`): partial. Pass 2 added the synced-to-trainer band
and the Done/Open-with-trainer CTAs. The hero scene band + named feel rating
were never built.

| Item | Status | Notes |
|---|---|---|
| Hero scene band with image | 🟠 | Not built. Live still has "CRUSHED IT!" + a static Trophy/Flame icon |
| "Workout Complete" + Pacifico session name overlay | 🟠 | Not built |
| Inline stats caption (62 min · 18 sets · 12K lbs) | 🟠 | Live has a stat grid lower down |
| Synced-to-trainer band | 🟢 | Pass 2 |
| Stat tiles row (3 tiles) | 🟡 | Mockup has Hit target / NEW PR / +8% vs last; live has different stat boxes via `StatBox` |
| **Named feel rating** | 🟠 | Live has 1–5 number chips; mockup has named labels (Brutal / Tough / OK / Good / Easy) |
| Notes for trainer | 🟢 | Wired |
| Done CTA | 🟢 | Pacifico hot gradient |
| Open with trainer secondary | 🟢 | Wired with copy semantics |
| Brief copy panel | 🟢 | Restyled in Pass 2 |

**Suggested fixes:**
1. Build the hero scene band (highest visual impact)
2. Add named feel rating (low effort, big personality win)
3. Reconsider the StatBox grid to match the 3-tile design

---

## §05 Cardio session

**Mockup** (CardioMock): full-bleed `pump-scene-cardio.png` (neon Miami highway)
backdrop, with cyan "CARDIO · RUN" caps at top-left, Pacifico "Zone 2 cruise",
big Outfit-tabular "32:14" timer centered at the vanishing point, "3.2 mi / 10:04 /mi"
stats below, "Finish" Pacifico CTA pinned at the bottom.

**Live** (`CardioWorkout.tsx`): regular light-theme flow (activity picker, entries
list, distance/duration inputs, stats grid). Pass 2 only stripped text-glow from
the stat numbers.

| Item | Status | Notes |
|---|---|---|
| Full-bleed scene backdrop | 🟠 | Not built |
| Pacifico session name | 🟠 | Not built (live doesn't even have a session name UI) |
| Centered timer at vanishing point | 🟠 | Live has Timer in a different layout |
| "Finish" Pacifico CTA | 🟡 | Live has "COMPLETE WORKOUT" all-caps |
| Activity type picker (RUN/BIKE/SWIM/etc.) | 🟢 | Lives correctly; not in the mockup but the user confirmed it must stay |
| Stat tile colors | 🟢 | Pass 2 calmed them |

**Suggested fixes:**
1. Either a) make cardio session a fundamentally different screen (mockup's
   cinematic layout) or b) accept the cardio screen is "the activity logger" not
   "the cardio moment" and just adopt the system tokens. **Decision needed.**

---

## §06 Empty state (first run)

**Mockup** (EmptyStateMock): full-bleed `pump-scene-empty.png` (floating dumbbell)
3:4 card with cyan "READY WHEN YOU ARE" + Pacifico "Log your first set" + helper
caption.

**Live**: Dashboard's `EmptyState` component (`Dashboard.tsx:430`) is a different
small `glass` card with a Dumbbell icon and "No workouts yet" + "Start your first
workout above". The empty-state scene asset is currently used on the **sign-in**
screen but not the dashboard empty state.

| Item | Status | Notes |
|---|---|---|
| Scene-based empty state | 🟠 | Not used on dashboard; asset is on sign-in |
| Pacifico "Log your first set" call | 🟠 | Live uses "No workouts yet" caps |
| Pump-scene-empty placement | 🟡 | Sign-in already uses it; could double-purpose for empty state if Dylan agrees |

**Suggested fix:** Two paths — either build a different first-run empty-state with
its own asset (need a new scene) or reframe the mockup to use a different asset
since sign-in claimed the dumbbell scene. Lowest effort: replace EmptyState
component with a scene-overlay version, but pick a DIFFERENT scene (cardio
highway? beach?) so it's not a duplicate.

---

## §07 Blood pressure sheet

**Mockup** (BPSheetMock): flat caps header, **big SYS/DIA card with subtle
spectrum-bar trim + warm tint**, separate Pulse + When tiles, meds card with
Yes/No + bucket chips, Pacifico "Save Reading" CTA.

**Live** (`BloodPressureSheet.tsx`): Pass 2 polished the typography (caps headers
not gradient, Pacifico Save Reading). Did NOT add the warm-tint or spectrum-bar
trim to the SYS/DIA card.

| Item | Status | Notes |
|---|---|---|
| Flat caps header | 🟢 | Pass 2 |
| **SYS/DIA card warm tint + spectrum bar** | 🟠 | Mockup card is `.surface-warm` + spectrum-bar at top; live is plain card |
| Pulse / When tiles | 🟢 | Both clean |
| Meds Yes/No + bucket chips | 🟢 | Pass 2 |
| Save Reading Pacifico | 🟢 | Pass 2 |
| LOG / RECENT segmented control | 🟢 | Wired |
| Copy-for-doctor on Recent | 🟢 | Wired |

**Suggested fix:** Add `.surface-warm` + the 3px spectrum bar `::before` to the
SYS/DIA card per `pump-card` pattern. ~5 lines of CSS/className change.

---

## §08 Sign-in (refreshed)

**Mockup** (SignInMock): full-bleed `pump-scene-empty.png`, "Let's Pump!" brushy
logo, dark-glass form with welcome / email / Pacifico Send magic link / caption.

**Live** (`AuthGate.tsx`): matches. Splash uses same scene for seamless transition.

| Item | Status | Notes |
|---|---|---|
| Scene backdrop | 🟢 | `pump-scene-empty.png` |
| Logo asset | 🟢 | `lets-pump.png` (v2, tighter) |
| Dark-glass form | 🟢 | rgba navy + backdrop-blur + spectrum-bar trim |
| Pacifico Send magic link | 🟢 | Hot gradient |
| Splash mood | 🟢 | Same scene, no light-theme flash |

---

## §09 App icon refresh

**Decision** (yours): keep wordmark icon, save the neon dumbbell for something else
in the app.

**Status:** 🟢 unchanged per decision.

---

## Live screens NOT in the mockup (Pass 3 work + others)

### History list (`WorkoutHistory.tsx`)
🟢 Refreshed in Pass 3 — calm white cards, sentence-case "Gym"/"Cardio", demoted
Delete button. **Note:** the type label here is still raw type, not plan session
name — Pass 4's `sessionLabel(s)` helper isn't applied here. Should be.

### Session detail (in `page.tsx`)
🟡 Pass 3 calmed cards and dropped text-glow on the header. Should also use
`sessionLabel` (plan session name) instead of raw "Gym Workout"/"Cardio Workout".

### Plan view (`PlanLoader.tsx`)
🟢 Pass 3 — sentence-case names, clean cards, calm chips.

### Reorder sheet (`ReorderExercisesSheet.tsx`)
🟡 Functional but the BP sheet refresh tokens (segmented control style, flat
caps) were never applied here. Worth a Pass 5 polish.

### Timer sheet (in `page.tsx`)
🟡 Still uses `glass-strong` + `text-gradient` on the title. Should adopt the new
Sheet primitive's contract (inherits viewport clamp + 44px close from Pass 1).

### Floating glass-pill back button (`page.tsx`)
🟢 Pass 3 — scroll-triggered floating pill.

### `/design` reference page
🟢 Documents the rules. Should be kept in sync as tokens evolve.

### `/mockup` gallery
🟢 The source of truth for design intent. Should be reflected back to live as
gaps are closed.

---

## Cross-cutting drift items

1. 🟠 **Plan session name rendering** — only the Dashboard's Recent rows use the
   `sessionLabel(s)` helper. History list and Session detail still render raw
   "Gym"/"Cardio" instead of the trainer-plan name. Should propagate.
2. 🟡 **Pacifico for moment CTAs is not yet universal** — Dashboard's "Let's Go",
   workout-complete "Done", BP "Save Reading", sign-in "Send magic link" all use
   it. But cockpit "COMPLETE WORKOUT" and cardio "COMPLETE WORKOUT" still use
   font-display all-caps. Should be Pacifico to match.
3. 🟡 **`.glow-state--*` tokens defined but not adopted** — Pass 1 added them;
   only the rest timer in cockpit needs them (Pass 2 cockpit work deferred).
4. 🟡 **font-mono usages remain in source** — auto-fallthrough to Outfit via the
   CSS var, but className "font-mono" still litters several components.
   Cosmetic; one-pass removal would clean it up.
5. 🟡 **`text-3xl` script titles in nav** — Pass 3 removed text-glow but the
   title is still large; on small phones it can crowd against the back button.

---

## Recommended Pass 5 sequencing

In priority order, where each step is independently shippable:

1. **BP button overflow fix** — your bug. Small change, big perceived quality win.
2. **Cockpit atmospheric header** — biggest unshipped surface; high effort but
   highest impact.
3. **Fused superset block** — UX upgrade for supersetting flow.
4. **PR full-screen reward** — the V3 moment that completes the reward loop.
5. **Workout-complete hero band + named feel rating** — completes the daily
   trainer handshake screen.
6. **Cardio session screen** — needs a design decision first (atmospheric or
   activity-logger?)
7. **BP sheet SYS/DIA warm-tint + spectrum bar** — small polish, completes the BP work.
8. **Empty state with a scene** — needs a new asset OR a decision on scene reuse.
9. **Cross-cutting:** apply `sessionLabel` everywhere, sweep remaining
   `font-mono` className usages, adopt `glow-state--*` tokens where state warrants.

---

## What's already aligned and shouldn't be touched

- Sign-in (§08): matches mockup; works well.
- Dashboard order + BP placement (§01): fixed in Pass 4; don't drift again.
- Pass 1 foundations (tokens, Sheet primitive, /design page, Space Mono retired).
- Tech fixes (name normalization, prs table, session-write idempotency,
  Overlay Contract on Sheet primitive).
