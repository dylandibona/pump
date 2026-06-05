# Archive

Point-in-time documents kept for history. **Not current** — for the live state
see `../CLAUDE.md` (architecture + decisions), `../README.md`, and `../BACKLOG.md`.

| File | What it was | Why archived |
|------|-------------|--------------|
| `TECH_SPECS.md` | Early technical reference | Superseded by CLAUDE.md. Stale specifics: Brzycki PR (now Epley e1RM), Bebas Neue fonts (now Monoton/Pacifico/Outfit/Space Mono), `--radius: 0` square edges (now 14px Miami Heat Wave), "no backend / no auth" (now Upstash + Supabase + magic-link auth). |
| `NOTES_2026-04-15.md` | Session notes from the Apr 15 2026 work | Historical — the PR rewrite + Miami Heat Wave redesign it describes all shipped. |
| `PUMP_FIX_SPECS.md` | Root copy of the April 15 fix specs | Explicitly superseded by `../april 15/BUG_FIXES.md` (per the Apr 15 notes); all five fixes shipped. |
| `april-15-BUG_FIXES.md` | The April 15 design-package fix specs (moved out of `../april 15/`) | Shipped. The rest of `../april 15/` (DESIGN_SYSTEM.md, RETROWAVE_SCENE.html, palm SVGs) stays in place as the design source of truth. |
| `instructions.md` | The original one-paragraph project brief (Apr 6 2026) | Founding prompt; kept for provenance. The app long outgrew it. |
| `REVIEW.md` | Comprehensive code-review audit (Apr 20 2026, through commit `a5eb913`) | Point-in-time audit. Several findings since fixed (per-set Epley PRs, canonical `isWorkingSet`, `finalizePRs` commit point, `planSessionId` rotation, the mutator-race refactor). Remaining items predate the Supabase cutover — re-audit against current code before acting. |
| `UI-REVIEW.md` | Miami Heat Wave UI implementation audit (Apr 20 2026) | Point-in-time. The `.glass`→`.pump-card` migration it tracks is still partly open; treat as a backlog reference, not current state. |

The Supabase cutover spec (`../pump_build_spec_v2.md`) stays in the root: Phase 1
is done, Phase 2 (retiring Upstash) is still pending.
