/* TEMPORARY visual mockup gallery for design direction (Volume System). Throwaway. */
import Image from 'next/image';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-6 pt-10 pb-3">
      <p className="text-[10px] tracking-[0.3em] uppercase font-bold" style={{ color: 'var(--pump-text-dim)' }}>
        {children}
      </p>
      <div className="mt-2 h-px" style={{ background: 'var(--pump-grad-bar)', opacity: 0.4 }} />
    </div>
  );
}

export default function Mockup() {
  return (
    <main className="min-h-screen relative" style={{ background: 'var(--pump-grad-page)' }}>
      <div className="fixed inset-0 bg-gradient-radial pointer-events-none" />
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-30" />

      <div className="mx-auto max-w-[430px] pb-16 relative z-10">
        <SectionLabel>01 · Dashboard</SectionLabel>
        <DashboardMock />

        <SectionLabel>02 · Gym cockpit (the screen you live in)</SectionLabel>
        <GymCockpitMock />

        <SectionLabel>03 · PR Moment (full-screen)</SectionLabel>
        <PRMomentMock />

        <SectionLabel>04 · Workout complete (no PR)</SectionLabel>
        <WorkoutCompleteMock />

        <SectionLabel>05 · Cardio session</SectionLabel>
        <CardioMock />

        <SectionLabel>06 · Empty state (first run)</SectionLabel>
        <EmptyStateMock />

        <SectionLabel>07 · Blood pressure sheet (refreshed)</SectionLabel>
        <BPSheetMock />

        <SectionLabel>08 · App icon refresh</SectionLabel>
        <IconMock />
      </div>
    </main>
  );
}

/* ────────────────────────────────────────────────────────────────────── */

function DashboardMock() {
  return (
    <>
      <div className="relative">
        <Image src="/pump-header.png" alt="Pump" width={1920} height={640} className="w-full" priority />
      </div>
      <div className="px-4 space-y-5 -mt-2">
        <div className="flex items-center gap-2 pt-4">
          <button className="flex-1 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left"
            style={{ boxShadow: '0 1px 3px rgba(10,0,32,0.06)' }}>
            <span className="text-[10px] tracking-[0.2em] uppercase text-[color:var(--pump-text-dim)] font-semibold">Active plan</span>
            <span className="ml-auto text-sm font-semibold text-[color:var(--pump-text)]">Reboot · Block 2</span>
          </button>
          <button aria-label="Log blood pressure"
            className="shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--pump-grad-hot)', boxShadow: '0 6px 16px -8px rgba(255,0,128,0.55)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8l1 1.1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
            </svg>
          </button>
        </div>
        <button className="w-full rounded-2xl py-5 text-white text-3xl animate-pulse-neon"
          style={{ fontFamily: 'var(--font-pacifico), cursive', background: 'var(--pump-grad-hot)' }}>
          Let&rsquo;s Go
        </button>
        <div className="grid grid-cols-3 gap-3">
          {[['12', 'Workouts'], ['4', 'Records'], ['38K', 'Lbs Moved']].map(([n, l]) => (
            <div key={l} className="rounded-2xl p-4 text-center"
              style={{
                background: 'linear-gradient(180deg, #FFFFFF 0%, #FFF8FB 100%)',
                boxShadow: '0 1px 3px rgba(255,0,128,0.08), 0 0 12px rgba(0,255,238,0.06)',
                border: '1px solid rgba(255, 0, 128, 0.06)',
              }}>
              <p className="font-display text-3xl tabular-nums" style={{ color: 'var(--pump-text)' }}>{n}</p>
              <p className="text-[10px] tracking-[0.18em] uppercase text-[color:var(--pump-text-dim)] mt-1 font-semibold">{l}</p>
            </div>
          ))}
        </div>
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl tracking-[0.12em] uppercase" style={{ color: 'var(--pump-text)' }}>Recent</h2>
            <span className="text-xs font-semibold text-[color:var(--pump-cyan-deep)] uppercase tracking-wider">View all</span>
          </div>
          <div className="space-y-2">
            {[['Push Day', 'Today', '6 exercises'], ['Lower + Core', 'Yesterday', '5 exercises'], ['Zone 2', 'Sat', '32 min']].map(([t, d, m]) => (
              <div key={t} className="flex items-center gap-3 rounded-2xl bg-white p-3" style={{ boxShadow: '0 1px 2px rgba(10,0,32,0.05)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,0,128,0.08)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--pump-hot)" strokeWidth="2" strokeLinecap="round"><path d="M6.5 6.5h11M6.5 17.5h11M4 9v6M20 9v6M9 12h6" /></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold" style={{ color: 'var(--pump-text)' }}>{t}</p>
                  <p className="text-xs text-[color:var(--pump-text-dim)]">{d}</p>
                </div>
                <span className="text-sm tabular-nums text-[color:var(--pump-text-mid)]">{m}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, #0A0020 0%, #180845 50%, #3a0868 100%)',
            boxShadow: '0 6px 24px -8px rgba(139,0,255,0.5), inset 0 0 0 1px rgba(0,255,238,0.15)',
          }}>
          <div className="absolute inset-x-4 top-3 h-px" style={{
            background: 'linear-gradient(90deg, transparent, rgba(0,255,238,0.6), transparent)',
            boxShadow: '0 0 8px rgba(0,255,238,0.4)',
          }} />
          <div className="px-5 py-5 text-center relative">
            <p className="text-[10px] tracking-[0.3em] uppercase font-bold" style={{ color: 'rgba(0,255,238,0.85)' }}>
              Latest Personal Record
            </p>
            <p className="text-white text-3xl mt-2"
              style={{ fontFamily: 'var(--font-pacifico), cursive', textShadow: '0 0 18px rgba(255,0,128,0.55), 0 0 36px rgba(139,0,255,0.4)' }}>
              Bench 185 × 8
            </p>
            <p className="text-[11px] tracking-wider uppercase mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Two days ago
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

/* Connector between two adjacent exercise cards. `linked` = supersetted. */
function SupersetLink({ linked }: { linked?: boolean }) {
  if (linked) {
    return (
      <div className="mx-4 relative h-7 flex items-center justify-center">
        {/* purple connector strip on both edges, brighter in the center */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px]"
          style={{
            background: 'linear-gradient(90deg, var(--pump-purple) 0%, var(--pump-purple) 30%, var(--pump-purple) 70%, var(--pump-purple) 100%)',
            opacity: 0.85,
            boxShadow: '0 0 10px rgba(139,0,255,0.55), 0 0 24px rgba(139,0,255,0.25)',
          }} />
        {/* badge */}
        <div className="relative flex items-center gap-1.5 rounded-full px-3 py-1"
          style={{ background: 'linear-gradient(135deg, #8B00FF, #6B20AA)', boxShadow: '0 4px 14px -4px rgba(139,0,255,0.6)' }}>
          <span className="text-white" style={{ textShadow: '0 0 6px rgba(255,255,255,0.6)' }}>⚡</span>
          <span className="text-[10px] tracking-[0.18em] uppercase font-bold text-white">Superset</span>
        </div>
      </div>
    );
  }
  return (
    <div className="mx-4 relative h-6 flex items-center justify-center">
      <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 border-t border-dashed"
        style={{ borderColor: 'rgba(139,0,255,0.18)' }} />
      <button className="relative flex items-center gap-1 rounded-full px-2 py-0.5"
        style={{ background: 'var(--pump-bg-page)' }}>
        <span style={{ color: 'rgba(139,0,255,0.45)', fontSize: '10px' }}>⚡</span>
        <span className="text-[9px] tracking-[0.2em] uppercase font-bold" style={{ color: 'rgba(139,0,255,0.55)' }}>Link</span>
      </button>
    </div>
  );
}

/* One half of a fused superset block — header, optional note, completed sets. No input.
   The input is shared at the bottom of the block. */
function SupersetHalf({ name, meta, note, sets, active }: {
  name: string;
  meta: string;
  note?: string;
  sets: [string, string][];
  active?: boolean;
}) {
  return (
    <div className="px-4 py-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {active && <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--pump-hot)', boxShadow: '0 0 6px var(--pump-hot)' }} />}
          <p className="font-display text-base" style={{ color: 'var(--pump-text)' }}>{name}</p>
        </div>
        <button aria-label="Notes" className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: note ? 'rgba(255,0,128,0.10)' : 'transparent', color: note ? 'var(--pump-hot)' : 'var(--pump-text-dim)' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/>
          </svg>
        </button>
      </div>
      <p className="text-[10px] tracking-[0.15em] uppercase font-bold mb-2" style={{ color: 'var(--pump-text-dim)' }}>{meta}</p>
      {note && (
        <div className="rounded-lg px-2.5 py-1.5 mb-2 flex gap-2"
          style={{ background: 'rgba(255,0,128,0.05)', border: '1px solid rgba(255,0,128,0.10)' }}>
          <p className="text-xs italic" style={{ color: 'var(--pump-text-mid)' }}>{note}</p>
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {sets.map(([w, r], i) => (
          <div key={i} className="rounded-md px-2 py-1 flex items-center gap-1.5" style={{ background: 'var(--pump-bg-input)' }}>
            <span className="font-display tabular-nums text-sm" style={{ color: 'var(--pump-text)' }}>{w}</span>
            <span className="text-[9px] uppercase tracking-wide font-bold" style={{ color: 'var(--pump-text-dim)' }}>×</span>
            <span className="font-display tabular-nums text-sm" style={{ color: 'var(--pump-text)' }}>{r}</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--pump-cyan-deep)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
        ))}
      </div>
    </div>
  );
}

function CollapsedExercise({ name, progress, last }: { name: string; progress: string; last: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl px-4 py-3"
      style={{ background: '#FFFFFF', boxShadow: '0 1px 2px rgba(10,0,32,0.05)' }}>
      <div className="flex-1 min-w-0">
        <p className="font-semibold" style={{ color: 'var(--pump-text)' }}>{name}</p>
        <p className="text-xs" style={{ color: 'var(--pump-text-dim)' }}>{progress} · {last}</p>
      </div>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--pump-text-dim)" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
    </div>
  );
}

function GymCockpitMock() {
  return (
    <div className="mx-4 rounded-3xl overflow-hidden relative" style={{ boxShadow: '0 16px 48px -16px rgba(255,0,128,0.25)' }}>
      {/* ─── Atmospheric timer header — gym scene as a dark band, V3 chrome ─── */}
      <div className="relative">
        <Image src="/pump-scene-gym.png" alt="" width={1920} height={680} className="w-full h-[170px] object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(10,0,32,0.55) 0%, rgba(10,0,32,0.7) 60%, rgba(10,0,32,0.85) 100%)' }} />
        <div className="absolute inset-0 flex flex-col">
          <div className="px-5 pt-4 flex items-start justify-between">
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase font-bold" style={{ color: 'rgba(0,255,238,0.9)', textShadow: '0 0 10px rgba(0,255,238,0.5)' }}>
                Push Day · 2 of 6 done · Next
              </p>
              <p className="text-white" style={{ fontFamily: 'var(--font-pacifico), cursive', fontSize: '28px', lineHeight: 1.1, textShadow: '0 0 14px rgba(255,0,128,0.5)' }}>
                Bench Press
              </p>
            </div>
            <button className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(4px)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
          </div>
          <div className="flex-1 flex items-end px-5 pb-3 gap-3">
            <div>
              <p className="text-[9px] uppercase tracking-[0.25em] font-bold" style={{ color: 'rgba(255,255,255,0.55)' }}>Elapsed</p>
              <p className="text-white tabular-nums font-display" style={{ fontSize: '24px', lineHeight: 1, textShadow: '0 0 8px rgba(0,0,0,0.4)' }}>24:18</p>
            </div>
            <div className="flex-1" />
            <div className="rounded-xl px-4 py-2 animate-pulse-neon"
              style={{ background: 'rgba(255,0,128,0.18)', border: '1px solid rgba(255,0,128,0.5)' }}>
              <p className="text-[9px] uppercase tracking-[0.25em] font-bold" style={{ color: 'rgba(255,0,128,0.95)' }}>Rest</p>
              <p className="text-white tabular-nums font-display" style={{ fontSize: '24px', lineHeight: 1, textShadow: '0 0 10px rgba(255,0,128,0.7)' }}>0:42</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Exercises section header — reorder entry point lives here ─── */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between" style={{ background: 'var(--pump-bg-page)' }}>
        <h3 className="font-display text-[11px] tracking-[0.25em] uppercase font-bold" style={{ color: 'var(--pump-text-dim)' }}>
          Exercises · 6
        </h3>
        <button className="flex items-center gap-1.5 text-[11px] tracking-[0.18em] uppercase font-bold" style={{ color: 'var(--pump-cyan-deep)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="7 16 3 20 7 24" transform="translate(0 -10)"/>
            <polyline points="17 8 21 4 17 0" transform="translate(0 10)"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
            <line x1="3" y1="14" x2="21" y2="14"/>
          </svg>
          Reorder
        </button>
      </div>

      {/* ─── Cockpit body — calm light surface ─── */}
      <div style={{ background: 'var(--pump-bg-page)' }}>
        {/* ─── FUSED SUPERSET BLOCK ─── one card containing both exercises with a shared input
            that toggles between them as you log sets. Both halves stay "in play". ─── */}
        <div className="mx-4 rounded-2xl relative overflow-hidden"
          style={{
            background: '#FFFFFF',
            border: '1px solid rgba(139, 0, 255, 0.28)',
            boxShadow: '0 0 0 1px rgba(139,0,255,0.08), 0 4px 14px -4px rgba(255,0,128,0.18), 0 0 24px rgba(139,0,255,0.10)',
          }}>
          <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: 'var(--pump-grad-bar)' }} />

          {/* Superset header — chip across the top */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div className="flex items-center gap-2 rounded-full px-2.5 py-1"
              style={{ background: 'linear-gradient(135deg, #8B00FF, #6B20AA)', boxShadow: '0 2px 10px -4px rgba(139,0,255,0.6)' }}>
              <span className="text-white" style={{ textShadow: '0 0 6px rgba(255,255,255,0.6)', fontSize: '11px' }}>⚡</span>
              <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-white">Superset</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button aria-label="Unlink superset" className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ color: 'var(--pump-text-dim)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              </button>
              <button aria-label="More" className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ color: 'var(--pump-text-dim)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
              </button>
            </div>
          </div>

          {/* Exercise A — Bench Press */}
          <SupersetHalf
            name="Bench Press"
            meta="3 of 4 sets · Last 175 × 8 · Target 180 × 8"
            note="2 sec down, full ROM. Bar to chest, no bounce."
            sets={[['175','8'], ['180','8'], ['180','7']]}
            active
          />

          {/* Divider — visually fuses but separates the two halves */}
          <div className="mx-4 my-1 h-px relative" style={{ background: 'rgba(139,0,255,0.15)' }}>
            <span className="absolute left-1/2 -translate-x-1/2 -top-2 px-2 text-xs font-bold"
              style={{ background: '#FFFFFF', color: 'var(--pump-purple)' }}>⚡</span>
          </div>

          {/* Exercise B — Incline DB Press */}
          <SupersetHalf
            name="Incline DB Press"
            meta="1 of 3 sets · Last 55 × 10 · Target 55 × 10"
            sets={[['55','10']]}
          />

          {/* ─── ONE shared input — labeled with the exercise that's up next ─── */}
          <div className="m-4 mt-2 rounded-xl p-3" style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #FFF0F8 100%)', border: '1px solid rgba(255,0,128,0.18)', boxShadow: '0 1px 4px rgba(255,0,128,0.1)' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] tracking-[0.2em] uppercase font-bold" style={{ color: 'var(--pump-hot)' }}>
                Next up · Bench Press · Set 4
              </p>
              <button className="text-[10px] tracking-[0.15em] uppercase font-bold" style={{ color: 'var(--pump-text-dim)' }}>
                Switch
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 text-center">
                <p className="font-display text-4xl tabular-nums" style={{ color: 'var(--pump-text)' }}>180</p>
                <p className="text-[9px] tracking-[0.2em] uppercase font-bold mt-0.5" style={{ color: 'var(--pump-text-dim)' }}>lbs</p>
              </div>
              <div className="text-2xl font-display" style={{ color: 'var(--pump-text-dim)' }}>×</div>
              <div className="flex-1 text-center">
                <p className="font-display text-4xl tabular-nums" style={{ color: 'var(--pump-text)' }}>8</p>
                <p className="text-[9px] tracking-[0.2em] uppercase font-bold mt-0.5" style={{ color: 'var(--pump-text-dim)' }}>reps</p>
              </div>
              <button className="rounded-xl w-12 h-12 flex items-center justify-center text-white"
                style={{ background: 'var(--pump-grad-hot)', boxShadow: '0 4px 14px -4px rgba(255,0,128,0.6)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
              </button>
            </div>
          </div>
        </div>

        {/* ─── SUPERSET CONNECTOR — UNLINKED affordance ─── */}
        <SupersetLink />

        {/* Collapsed exercises with link affordances between them */}
        <div className="mx-4">
          <CollapsedExercise name="Overhead Press" progress="0 of 4 sets" last="Last: 95 × 10" />
        </div>
        <SupersetLink />
        <div className="mx-4">
          <CollapsedExercise name="Pull-Ups" progress="0 of 3 sets · BW" last="Last: BW × 10" />
        </div>
        <SupersetLink />
        <div className="mx-4 mb-4">
          <CollapsedExercise name="Dumbbell Row" progress="0 of 3 sets" last="Last: 55 × 12" />
        </div>

        {/* Complete workout — V2/V3 boundary moment */}
        <div className="px-4 pb-5">
          <button className="w-full rounded-2xl py-4 text-white text-2xl"
            style={{ fontFamily: 'var(--font-pacifico), cursive', background: 'var(--pump-grad-hot)', boxShadow: '0 8px 24px -8px rgba(255,0,128,0.55)' }}>
            Finish Workout
          </button>
        </div>
      </div>
    </div>
  );
}

function PRMomentMock() {
  return (
    <div className="mx-4 rounded-3xl overflow-hidden relative" style={{ aspectRatio: '3/4', boxShadow: '0 16px 48px -16px rgba(139,0,255,0.5)' }}>
      <Image src="/pump-pr-burst.png" alt="" fill className="object-cover" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
        <p className="text-[10px] tracking-[0.4em] uppercase font-bold" style={{ color: 'rgba(0,255,238,0.95)', textShadow: '0 0 12px rgba(0,255,238,0.7)' }}>
          New Personal Record
        </p>
        <p className="text-white mt-2" style={{ fontFamily: 'var(--font-pacifico), cursive', fontSize: '44px', lineHeight: 1, textShadow: '0 0 24px rgba(255,0,128,0.7), 0 0 48px rgba(255,0,128,0.4)' }}>
          Bench
        </p>
        <p className="text-white tabular-nums font-display mt-2" style={{ fontSize: '64px', lineHeight: 1, textShadow: '0 0 16px rgba(0,255,238,0.6)' }}>
          185 × 8
        </p>
        <p className="text-[11px] tracking-[0.2em] uppercase mt-3 font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
          up from 175 × 6
        </p>
      </div>
    </div>
  );
}

function WorkoutCompleteMock() {
  return (
    <div className="mx-4 rounded-3xl overflow-hidden" style={{ boxShadow: '0 16px 48px -16px rgba(255,0,128,0.4)' }}>
      {/* ─── Hero band — image + title overlay ─── */}
      <div className="relative h-[260px]">
        <Image src="/pump-scene-complete.png" alt="" fill className="object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(10,0,32,0.15) 0%, rgba(10,0,32,0.0) 30%, rgba(10,0,32,0.0) 60%, rgba(10,0,32,0.55) 100%)' }} />
        <div className="absolute inset-0 flex flex-col justify-end p-6">
          <p className="text-[11px] tracking-[0.4em] uppercase font-bold mb-1"
            style={{ color: 'rgba(0,255,238,0.95)', textShadow: '0 0 14px rgba(0,255,238,0.7)' }}>
            Workout Complete
          </p>
          <p className="text-white" style={{ fontFamily: 'var(--font-pacifico), cursive', fontSize: '44px', lineHeight: 1, textShadow: '0 0 18px rgba(255,0,128,0.6)' }}>
            Push Day
          </p>
          <p className="text-white/70 text-xs mt-1">62 min · 18 sets · 12K lbs moved</p>
        </div>
      </div>

      {/* ─── Body — stats + feel + actions on a clean light surface ─── */}
      <div className="p-5 space-y-5" style={{ background: 'var(--pump-bg-page)' }}>
        {/* Sync reassurance — the most important thing to know on this screen */}
        <div className="flex items-center gap-2 rounded-2xl px-3 py-2"
          style={{ background: 'rgba(0,168,158,0.08)', border: '1px solid rgba(0,168,158,0.18)' }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'var(--pump-cyan-deep)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] tracking-[0.2em] uppercase font-bold" style={{ color: 'var(--pump-cyan-deep)' }}>Synced to trainer</p>
            <p className="text-xs" style={{ color: 'var(--pump-text-mid)' }}>Your trainer sees this in their dashboard. No paste needed.</p>
          </div>
        </div>

        {/* Stat tiles row */}
        <div className="grid grid-cols-3 gap-3">
          {[['4', 'Hit target'], ['1', 'New PR'], ['+8%', 'vs last']].map(([n, l], i) => (
            <div key={l} className="rounded-2xl p-3 text-center"
              style={{
                background: i === 1 ? 'linear-gradient(135deg, #FFFFFF 0%, #FFF0F8 100%)' : 'linear-gradient(180deg, #FFFFFF 0%, #FFF8FB 100%)',
                border: i === 1 ? '1px solid rgba(255,0,128,0.18)' : '1px solid rgba(255,0,128,0.06)',
                boxShadow: i === 1 ? '0 1px 4px rgba(255,0,128,0.18), 0 0 12px rgba(255,0,128,0.06)' : '0 1px 3px rgba(255,0,128,0.06)',
              }}>
              <p className="font-display text-2xl tabular-nums" style={{ color: i === 1 ? 'var(--pump-hot)' : 'var(--pump-text)' }}>{n}</p>
              <p className="text-[9px] tracking-[0.2em] uppercase font-bold mt-1" style={{ color: 'var(--pump-text-dim)' }}>{l}</p>
            </div>
          ))}
        </div>

        {/* Feel rating */}
        <div className="rounded-2xl p-4" style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(10,0,32,0.05)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] tracking-[0.25em] uppercase font-bold" style={{ color: 'var(--pump-cyan-deep)' }}>How did it feel?</p>
            <p className="text-xs italic" style={{ color: 'var(--pump-text-mid)' }}>Goes to your trainer</p>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {[
              { n: 1, label: 'Brutal' },
              { n: 2, label: 'Tough' },
              { n: 3, label: 'OK' },
              { n: 4, label: 'Good' },
              { n: 5, label: 'Easy' },
            ].map(({ n, label }) => {
              const active = n === 4;
              return (
                <button key={n} className="rounded-xl py-2.5 flex flex-col items-center gap-0.5 transition-all"
                  style={{
                    background: active ? 'var(--pump-grad-hot)' : 'var(--pump-bg-input)',
                    color: active ? '#fff' : 'var(--pump-text-mid)',
                    border: active ? 'none' : '1px solid var(--pump-border-card)',
                    boxShadow: active ? '0 4px 14px -4px rgba(255,0,128,0.55)' : 'none',
                  }}>
                  <span className="font-display tabular-nums text-lg">{n}</span>
                  <span className="text-[9px] tracking-[0.15em] uppercase font-bold">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick note for trainer */}
        <div className="rounded-2xl p-4" style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(10,0,32,0.05)' }}>
          <p className="text-[11px] tracking-[0.25em] uppercase font-bold mb-2" style={{ color: 'var(--pump-cyan-deep)' }}>Notes for trainer</p>
          <p className="text-sm italic" style={{ color: 'var(--pump-text-dim)' }}>Shoulder felt tight on overheads — tap to add a note…</p>
        </div>

        {/* Primary action — Done is the honest primary because the data IS already there */}
        <button className="w-full rounded-2xl py-4 text-white text-2xl"
          style={{ fontFamily: 'var(--font-pacifico), cursive', background: 'var(--pump-grad-hot)', boxShadow: '0 8px 24px -8px rgba(255,0,128,0.55)' }}>
          Done
        </button>
        {/* Secondary — honest about what it does: opens a conversation with the trainer */}
        <button className="w-full rounded-2xl py-3.5 flex items-center justify-center gap-2 text-sm tracking-[0.18em] uppercase font-bold"
          style={{ background: 'transparent', color: 'var(--pump-text-mid)', border: '1px solid var(--pump-border-card)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
          Open with trainer
        </button>
      </div>
    </div>
  );
}

function CardioMock() {
  return (
    <div className="mx-4 rounded-3xl overflow-hidden relative" style={{ aspectRatio: '4/5', boxShadow: '0 16px 48px -16px rgba(255,0,128,0.4)' }}>
      <Image src="/pump-scene-cardio.png" alt="" fill className="object-cover" />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.0) 30%, rgba(0,0,0,0.0) 60%, rgba(0,0,0,0.45) 100%)' }} />
      <div className="absolute inset-0 flex flex-col">
        <div className="px-6 pt-7">
          <p className="text-[11px] tracking-[0.35em] uppercase font-bold"
            style={{ color: 'rgba(0,255,238,0.95)', textShadow: '0 0 14px rgba(0,255,238,0.6)' }}>
            Cardio · Run
          </p>
          <p className="text-white mt-1" style={{ fontFamily: 'var(--font-pacifico), cursive', fontSize: '36px', lineHeight: 1.05, textShadow: '0 0 18px rgba(255,0,128,0.55)' }}>
            Zone 2 cruise
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-white tabular-nums font-display" style={{ fontSize: '72px', lineHeight: 1, textShadow: '0 0 18px rgba(0,255,238,0.5)' }}>
              32:14
            </p>
            <div className="flex justify-center gap-6 mt-4 text-white">
              {[['3.2', 'mi'], ['10:04', '/mi']].map(([n, u]) => (
                <div key={u}>
                  <p className="font-display tabular-nums text-xl">{n}</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>{u}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="px-4 pb-5">
          <button className="w-full rounded-2xl py-4 text-white text-2xl"
            style={{ fontFamily: 'var(--font-pacifico), cursive', background: 'var(--pump-grad-hot)' }}>
            Finish
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyStateMock() {
  return (
    <div className="mx-4 rounded-3xl overflow-hidden relative" style={{ aspectRatio: '3/4', boxShadow: '0 16px 48px -16px rgba(139,0,255,0.5)' }}>
      <Image src="/pump-scene-empty.png" alt="" fill className="object-cover" />
      <div className="absolute inset-x-0 bottom-0 p-6 text-center"
        style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(10,0,32,0.65) 100%)' }}>
        <p className="text-[11px] tracking-[0.35em] uppercase font-bold" style={{ color: 'rgba(0,255,238,0.95)', textShadow: '0 0 14px rgba(0,255,238,0.6)' }}>
          Ready when you are
        </p>
        <p className="text-white mt-1" style={{ fontFamily: 'var(--font-pacifico), cursive', fontSize: '34px', textShadow: '0 0 16px rgba(255,0,128,0.6)' }}>
          Log your first set
        </p>
        <p className="text-white/70 text-sm mt-2">Your trainer&rsquo;s plan is waiting on the dashboard.</p>
      </div>
    </div>
  );
}

function BPSheetMock() {
  return (
    <div className="mx-4 rounded-3xl overflow-hidden" style={{ background: '#FFFFFF', boxShadow: '0 16px 48px -16px rgba(255,0,128,0.25)', border: '1px solid var(--pump-border-card)' }}>
      {/* Header — flat caps (V2), no gradient text */}
      <div className="relative px-5 pt-5 pb-4 border-b" style={{ borderColor: 'var(--pump-border-card)' }}>
        <div className="flex items-center justify-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--pump-hot)"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8l1 1.1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>
          <h3 className="font-display text-lg tracking-[0.18em] uppercase" style={{ color: 'var(--pump-text)' }}>Blood Pressure</h3>
        </div>
        <button className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center" style={{ color: 'var(--pump-text-dim)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        {/* Log | Recent segmented */}
        <div className="flex gap-1 mt-4 p-1 rounded-xl" style={{ background: 'var(--pump-bg-input)' }}>
          {['Log', 'Recent'].map((label, i) => {
            const active = i === 0;
            return (
              <button key={label}
                className="flex-1 rounded-lg py-2 text-sm tracking-[0.18em] uppercase font-bold"
                style={active
                  ? { background: '#FFFFFF', color: 'var(--pump-hot)', boxShadow: '0 1px 4px rgba(255,0,128,0.15)' }
                  : { color: 'var(--pump-text-dim)' }
                }>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-5 space-y-4" style={{ background: 'var(--pump-bg-page)' }}>
        {/* SYS / DIA — big confident card with warm tint */}
        <div className="rounded-2xl p-4 relative overflow-hidden"
          style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #FFF8FB 100%)', boxShadow: '0 1px 4px rgba(255,0,128,0.08), 0 0 14px rgba(0,255,238,0.05)', border: '1px solid rgba(255,0,128,0.08)' }}>
          <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: 'var(--pump-grad-bar)', opacity: 0.5 }} />
          <div className="flex items-center gap-3 pt-1">
            <div className="flex-1 text-center">
              <p className="font-display tabular-nums" style={{ fontSize: '56px', lineHeight: 1, color: 'var(--pump-text)' }}>129</p>
              <p className="text-[10px] tracking-[0.2em] uppercase font-bold mt-1" style={{ color: 'var(--pump-text-dim)' }}>Systolic</p>
            </div>
            <div className="text-4xl font-display pb-5" style={{ color: 'var(--pump-text-dim)' }}>/</div>
            <div className="flex-1 text-center">
              <p className="font-display tabular-nums" style={{ fontSize: '56px', lineHeight: 1, color: 'var(--pump-text)' }}>85</p>
              <p className="text-[10px] tracking-[0.2em] uppercase font-bold mt-1" style={{ color: 'var(--pump-text-dim)' }}>Diastolic</p>
            </div>
          </div>
          {/* AHA category pill — status color, deliberately outside brand palette */}
          <div className="flex justify-center mt-3">
            <span className="rounded-full px-3 py-1 text-[10px] tracking-[0.2em] uppercase font-bold text-white"
              style={{ background: '#FF6B00', boxShadow: '0 2px 8px -2px rgba(255,107,0,0.5)' }}>
              Stage 1
            </span>
          </div>
        </div>

        {/* Pulse + When */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-3" style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(10,0,32,0.05)' }}>
            <p className="text-[10px] tracking-[0.2em] uppercase font-bold" style={{ color: 'var(--pump-text-dim)' }}>Pulse</p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="font-display tabular-nums text-3xl" style={{ color: 'var(--pump-text)' }}>68</span>
              <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: 'var(--pump-text-dim)' }}>bpm</span>
            </div>
          </div>
          <div className="rounded-2xl p-3" style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(10,0,32,0.05)' }}>
            <p className="text-[10px] tracking-[0.2em] uppercase font-bold" style={{ color: 'var(--pump-text-dim)' }}>When</p>
            <p className="text-sm mt-2" style={{ color: 'var(--pump-text)' }}>Now · 6:57 PM</p>
          </div>
        </div>

        {/* Meds — clean caps, no Pacifico, no mono */}
        <div className="rounded-2xl p-4" style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(10,0,32,0.05)' }}>
          <p className="text-[11px] tracking-[0.2em] uppercase font-bold mb-3" style={{ color: 'var(--pump-cyan-deep)' }}>Took lisinopril 10mg today?</p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {[
              { v: true, label: 'Yes' },
              { v: false, label: 'No' },
            ].map(({ v, label }) => {
              const active = v === true;
              return (
                <button key={label}
                  className="rounded-xl py-3 text-sm tracking-[0.18em] uppercase font-bold"
                  style={active
                    ? { background: 'var(--pump-grad-hot)', color: '#fff', boxShadow: '0 4px 14px -4px rgba(255,0,128,0.5)' }
                    : { background: 'var(--pump-bg-input)', color: 'var(--pump-text-mid)', border: '1px solid var(--pump-border-card)' }
                  }>
                  {label}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] tracking-[0.18em] uppercase font-bold mb-2" style={{ color: 'var(--pump-text-dim)' }}>How long ago?</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { k: 'lt1h', label: '<1h' },
              { k: '1to3h', label: '1–3h' },
              { k: '3to6h', label: '3–6h' },
              { k: '6to12h', label: '6–12h' },
              { k: 'gt12h', label: '12h+' },
              { k: 'not_today', label: 'Not yet' },
            ].map(({ k, label }) => {
              const active = k === '3to6h';
              return (
                <button key={k}
                  className="rounded-lg py-2 text-sm tracking-wide font-bold"
                  style={active
                    ? { background: 'var(--pump-cyan-deep)', color: '#fff' }
                    : { background: 'var(--pump-bg-input)', color: 'var(--pump-text-mid)', border: '1px solid var(--pump-border-card)' }
                  }>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Save */}
        <button className="w-full rounded-2xl py-4 text-white text-2xl"
          style={{ fontFamily: 'var(--font-pacifico), cursive', background: 'var(--pump-grad-hot)', boxShadow: '0 8px 24px -8px rgba(255,0,128,0.55)' }}>
          Save Reading
        </button>
      </div>
    </div>
  );
}

function IconMock() {
  return (
    <div className="px-4">
      <div className="flex items-end gap-6 justify-center">
        {[
          { src: '/pump-icon-neon.png', label: 'New', size: 96 },
          { src: '/pump-icon-512.png', label: 'Current', size: 96 },
        ].map(({ src, label, size }) => (
          <div key={label} className="text-center">
            <div className="rounded-[22px] overflow-hidden mx-auto" style={{ width: size, height: size, boxShadow: '0 8px 24px -8px rgba(0,0,0,0.3)' }}>
              <Image src={src} alt={label} width={size} height={size} className="w-full h-full object-cover" />
            </div>
            <p className="text-[10px] tracking-[0.2em] uppercase mt-2 font-semibold" style={{ color: 'var(--pump-text-dim)' }}>
              {label}
            </p>
          </div>
        ))}
      </div>
      <p className="text-center text-xs mt-5 px-6" style={{ color: 'var(--pump-text-mid)' }}>
        Drop-in replacement for pump-icon-192/512.png if you want this as the home-screen icon.
      </p>
    </div>
  );
}
