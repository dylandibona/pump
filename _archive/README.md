# Archive

Point-in-time documents kept for history. **Not current** — for the live state
see `../CLAUDE.md` (architecture + decisions), `../DESIGN.md` (Volume System),
`../MOCKUP_AUDIT.md` (living punch list), `../README.md`, and `../BACKLOG.md`.

| File / dir | What it was | Why archived |
|------|-------------|--------------|
| `DESIGN_SYSTEM_v1.md` | v1 of the design system, "Miami Heat Wave" (Apr 15 2026 design package). Vocabulary level — palette, fonts, card system. | Superseded by `../DESIGN.md` (Volume System v2), which adds the *grammar* (three volumes, glow-as-state, Overlay Contract). v1 vocabulary is still mostly intact — Outfit / Pacifico / Monoton, hot-pink + cyan + purple, 14px card radius — but Space Mono is retired and the loud-everywhere assumption is replaced. |
| `RETROWAVE_SCENE.html` | Reference HTML for the original animated retrowave dashboard hero. | Orphaned. The dashboard now renders `public/pump-header.png` directly. The `RetrowaveScene.tsx` component that ported this is still on disk but unmounted. |
| `palms/palm_*.svg` | Palm silhouette SVGs masked by the retrowave scene. | Orphaned with `RETROWAVE_SCENE.html`. |
| `april-15-README.md` | The April 15 design-package README — handover doc for the Miami Heat Wave brief. | Historical; everything in it shipped or moved into `../DESIGN.md` + `MOCKUP_AUDIT.md`. |
| `TECH_SPECS.md` | Early technical reference. | Superseded by `../CLAUDE.md`. Stale specifics: Brzycki PR (now Epley e1RM), Bebas Neue fonts (now Monoton / Pacifico / Outfit), `--radius: 0` square edges (now 14px), "no backend / no auth" (now Supabase + magic-link auth). |
| `NOTES_2026-04-15.md` | Session notes from the Apr 15 2026 work. | Historical — the PR rewrite + Miami Heat Wave redesign all shipped. |
| `PUMP_FIX_SPECS.md` | Root copy of the April 15 fix specs. | Explicitly superseded by `april-15-BUG_FIXES.md` (per the Apr 15 notes); all five fixes shipped. |
| `april-15-BUG_FIXES.md` | The April 15 design-package fix specs (moved out of the original `april 15/` folder). | Shipped. |
| `instructions.md` | The original one-paragraph project brief (Apr 6 2026). | Founding prompt; kept for provenance. The app long outgrew it. |
| `REVIEW.md` | Comprehensive code-review audit (Apr 20 2026, through commit `a5eb913`). | Point-in-time audit. Several findings since fixed (per-set Epley PRs, canonical `isWorkingSet`, `finalizePRs` commit point, `planSessionId` rotation, the mutator-race refactor). Remaining items predate the Supabase cutover — re-audit against current code before acting. |
| `UI-REVIEW.md` | Miami Heat Wave UI implementation audit (Apr 20 2026). | Point-in-time. The `.glass`→`.pump-card` migration it tracks is still partly open; current punch list lives in `../MOCKUP_AUDIT.md`. |

The Supabase cutover spec (`../pump_build_spec_v2.md`) stays in the root: Phase 1
is done, Phase 2 (retiring Upstash) is still pending.
