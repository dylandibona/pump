/* PUMP Volume System — design tokens reference (dev only).
   Sibling of /mockup: /mockup shows the SCREENS, /design shows the RULES.
   Updates here whenever a token shifts. */

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="px-5 pt-12 pb-6 scroll-mt-4">
      <p className="text-[10px] tracking-[0.3em] uppercase font-bold mb-1" style={{ color: 'var(--pump-text-dim)' }}>
        {id}
      </p>
      <h2 className="font-display text-2xl tracking-[0.05em] uppercase" style={{ color: 'var(--pump-text)' }}>
        {title}
      </h2>
      <div className="mt-2 h-px" style={{ background: 'var(--pump-grad-bar)', opacity: 0.5 }} />
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3 items-center">
      <p className="text-[10px] tracking-[0.18em] uppercase font-bold" style={{ color: 'var(--pump-text-dim)' }}>{label}</p>
      <div>{children}</div>
    </div>
  );
}

function Swatch({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-14 h-14 rounded-xl shrink-0" style={{ background: value, boxShadow: '0 1px 3px rgba(10,0,32,0.08)' }} />
      <div>
        <p className="font-semibold" style={{ color: 'var(--pump-text)' }}>{name}</p>
        <p className="text-xs tabular-nums" style={{ color: 'var(--pump-text-dim)' }}>{value}</p>
      </div>
    </div>
  );
}

export default function DesignReference() {
  return (
    <main className="min-h-screen relative" style={{ background: 'var(--pump-grad-page)' }}>
      <div className="fixed inset-0 bg-gradient-radial pointer-events-none" />
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-30" />

      <div className="mx-auto max-w-[640px] pb-20 relative z-10">
        {/* Header */}
        <header className="px-5 pt-10">
          <p className="text-[10px] tracking-[0.3em] uppercase font-bold" style={{ color: 'var(--pump-text-dim)' }}>
            Volume System · v2 · Reference
          </p>
          <h1 className="font-display text-4xl tracking-wide mt-1" style={{ color: 'var(--pump-text)' }}>
            How PUMP&nbsp;sounds.
          </h1>
          <p className="mt-3 text-sm" style={{ color: 'var(--pump-text-mid)' }}>
            One vocabulary, three volumes. Loud chrome, calm canvas. The screens are in <code>/mockup</code>;
            the rules live here.
          </p>
          <nav className="mt-4 flex flex-wrap gap-2">
            {[
              ['01', 'The three volumes'],
              ['02', 'Type system'],
              ['03', 'Color & status'],
              ['04', 'Surfaces & cards'],
              ['05', 'Glow as state'],
              ['06', 'Tags · buttons'],
              ['07', 'Overlay contract'],
            ].map(([id, label]) => (
              <a key={id} href={`#${id}`}
                className="rounded-full px-3 py-1 text-[10px] tracking-[0.18em] uppercase font-bold"
                style={{ background: 'rgba(255,0,128,0.08)', color: 'var(--pump-hot)' }}>
                {id} · {label}
              </a>
            ))}
          </nav>
        </header>

        {/* 01 — three volumes */}
        <Section id="01" title="The three volumes">
          <p className="text-sm" style={{ color: 'var(--pump-text-mid)' }}>
            Every component belongs to one of three volumes. The fader is the whole system.
          </p>
          {[
            {
              v: 'V3', tag: 'SHOWPIECE', tone: 'Rare. Earned. Loud.',
              desc: 'Hero, PR moment, workout-complete, CTAs. Pacifico, Monoton, full gradients, glow, animated, sound. The screenshot moments.',
              bg: 'linear-gradient(135deg, #FF0080, #8B00FF)', fg: '#fff',
            },
            {
              v: 'V2', tag: 'ATTITUDE', tone: 'Ambient chrome. Loud but flat.',
              desc: 'Screen titles, section labels, tab bar, tags, spectrum-bar card trim. Outfit 800 caps tracked. NO text-glow — loud and legible.',
              bg: '#FFFFFF', fg: 'var(--pump-text)', accent: 'var(--pump-grad-bar)',
            },
            {
              v: 'V1', tag: 'WORK', tone: 'The cockpit. Calm, neon-trimmed synth-noir.',
              desc: 'Set rows, inputs, data lists, sheets. Big Outfit-tabular numbers, sentence case helpers, single accent, glow only on state. Calm ≠ clean.',
              bg: '#FFF8FB', fg: 'var(--pump-text)',
            },
          ].map(({ v, tag, tone, desc, bg, fg, accent }) => (
            <div key={v} className="rounded-2xl overflow-hidden relative" style={{ background: bg, color: fg, boxShadow: '0 1px 3px rgba(10,0,32,0.06)' }}>
              {accent && <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: accent, opacity: 0.5 }} />}
              <div className="p-5">
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-3xl tabular-nums">{v}</span>
                  <span className="text-[10px] tracking-[0.25em] uppercase font-bold opacity-80">{tag}</span>
                </div>
                <p className="text-sm mt-1 opacity-90">{tone}</p>
                <p className="text-xs mt-2 opacity-80">{desc}</p>
              </div>
            </div>
          ))}
        </Section>

        {/* 02 — type */}
        <Section id="02" title="Type system">
          <p className="text-sm" style={{ color: 'var(--pump-text-mid)' }}>
            One family does the work; two display fonts add personality. <strong>Space Mono is retired.</strong>
          </p>
          <div className="space-y-5">
            <Row label="Brand">
              <p style={{ fontFamily: 'var(--font-monoton), Impact, sans-serif', fontSize: 32, letterSpacing: '0.06em' }}>PUMP</p>
              <p className="text-xs mt-1" style={{ color: 'var(--pump-text-dim)' }}>Monoton · wordmark only · V3</p>
            </Row>
            <Row label="Moment">
              <p style={{ fontFamily: 'var(--font-pacifico), cursive', fontSize: 36, lineHeight: 1 }}>Let&rsquo;s Go</p>
              <p className="text-xs mt-1" style={{ color: 'var(--pump-text-dim)' }}>Pacifico · CTAs, session names, the wink · V3</p>
            </Row>
            <Row label="Chrome">
              <p className="font-display tracking-[0.18em] uppercase">Workout Complete</p>
              <p className="text-xs mt-1" style={{ color: 'var(--pump-text-dim)' }}>Outfit 800 · UPPERCASE + tracked · labels, titles, tags · V2</p>
            </Row>
            <Row label="Body">
              <p className="text-base" style={{ fontFamily: 'var(--font-outfit), sans-serif', fontWeight: 500, color: 'var(--pump-text)' }}>
                You logged 18 sets in 62 minutes.
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--pump-text-dim)' }}>Outfit 500–600 · sentence case · helpers, list rows · V1 (.text-body-quiet)</p>
            </Row>
            <Row label="Data">
              <p className="font-display tabular-nums" style={{ fontSize: 40, lineHeight: 1, color: 'var(--pump-text)' }}>185 × 8</p>
              <p className="text-xs mt-1" style={{ color: 'var(--pump-text-dim)' }}>Outfit 800 · tabular-nums · weights, reps, BP, timers</p>
            </Row>
          </div>
        </Section>

        {/* 03 — color */}
        <Section id="03" title="Color & status">
          <p className="text-sm" style={{ color: 'var(--pump-text-mid)' }}>
            Brand roles never carry status. Status colors live deliberately outside the brand palette so
            &ldquo;Stage 2&rdquo; never reads as &ldquo;primary action.&rdquo;
          </p>
          <div>
            <p className="label-caps label-caps-dim mb-3">Brand · roles locked</p>
            <div className="grid grid-cols-1 gap-3">
              <Swatch name="Hot · primary action, brand" value="#FF0080" />
              <Swatch name="Cyan-deep · secondary, cardio, sync" value="#00A89E" />
              <Swatch name="Purple · supersets" value="#8B00FF" />
              <Swatch name="Text · navy" value="#0A0A2E" />
            </div>
          </div>
          <div>
            <p className="label-caps label-caps-dim mb-3 mt-4">Surfaces</p>
            <div className="grid grid-cols-1 gap-3">
              <Swatch name="Page" value="var(--pump-grad-page)" />
              <Swatch name="Card" value="#FFFFFF" />
              <Swatch name="Card · warm" value="linear-gradient(180deg, #FFFFFF 0%, #FFF8FB 100%)" />
              <Swatch name="Input" value="#F0F8F8" />
            </div>
          </div>
          <div>
            <p className="label-caps label-caps-dim mb-3 mt-4">Status · AHA blood pressure (outside brand palette)</p>
            <div className="flex flex-wrap gap-2">
              {[
                ['Normal', 'status-bp-normal'],
                ['Elevated', 'status-bp-elevated'],
                ['Stage 1', 'status-bp-stage1'],
                ['Stage 2', 'status-bp-stage2'],
                ['Crisis', 'status-bp-crisis'],
              ].map(([label, cls]) => (
                <span key={label} className={`rounded-full px-3 py-1 text-[10px] tracking-[0.2em] uppercase font-bold ${cls}`}>{label}</span>
              ))}
            </div>
          </div>
        </Section>

        {/* 04 — surfaces */}
        <Section id="04" title="Surfaces & cards">
          <p className="text-sm" style={{ color: 'var(--pump-text-mid)' }}>
            Three surface tiers. <strong>Resting cards do not glow.</strong> Glow is a state (see §05).
          </p>
          <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(10,0,32,0.06)' }}>
            <p className="label-caps label-caps-dim">.surface-card · resting</p>
            <p className="text-body-quiet mt-1">Bench Press · 3 of 4 sets logged</p>
          </div>
          <div className="surface-warm rounded-2xl p-5">
            <p className="label-caps label-caps-dim">.surface-warm · leg-warmer hotness</p>
            <p className="text-body-quiet mt-1">Stats cards, secondary CTAs, paired exercises.</p>
          </div>
          <div className="surface-warm--hot rounded-2xl p-5">
            <p className="label-caps" style={{ color: 'var(--pump-hot)' }}>.surface-warm--hot · attention</p>
            <p className="text-body-quiet mt-1">Active inputs, the next-up set tile.</p>
          </div>
        </Section>

        {/* 05 — glow as state */}
        <Section id="05" title="Glow as state">
          <p className="text-sm" style={{ color: 'var(--pump-text-mid)' }}>
            Ambient glow is banned. A component glows because it&rsquo;s <em>doing something</em>.
          </p>
          <div className="grid grid-cols-1 gap-3">
            {[
              { cls: 'glow-state glow-state--active', label: '.glow-state--active', desc: 'Current set, expanded exercise, next-up.' },
              { cls: 'glow-state glow-state--urgent', label: '.glow-state--urgent', desc: 'Rest timer about to fire. Animated pulse.' },
              { cls: 'glow-state glow-state--win', label: '.glow-state--win', desc: 'New best, PR moment, milestone.' },
            ].map(({ cls, label, desc }) => (
              <div key={cls} className={`rounded-2xl p-4 ${cls}`} style={{ background: '#FFFFFF' }}>
                <p className="label-caps" style={{ color: 'var(--pump-hot)' }}>{label}</p>
                <p className="text-body-quiet mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* 06 — tags + buttons */}
        <Section id="06" title="Tags & buttons">
          <Row label="Tags">
            <div className="flex flex-wrap gap-2">
              <span className="tag tag--pr">Best 185 × 8</span>
              <span className="tag tag--target">Target 180 × 8</span>
              <span className="tag tag--superset">⚡ Superset</span>
              <span className="tag tag--warmup">Warmup</span>
            </div>
          </Row>
          <Row label="PR badge">
            <span className="pr-badge">New Best</span>
          </Row>
          <Row label="Primary">
            <button className="w-full rounded-2xl py-3 text-white text-xl"
              style={{ fontFamily: 'var(--font-pacifico), cursive', background: 'var(--pump-grad-hot)', boxShadow: '0 6px 18px -8px rgba(255,0,128,0.55)' }}>
              Let&rsquo;s Go
            </button>
          </Row>
          <Row label="Caps action">
            <button className="w-full rounded-2xl py-3 text-sm tracking-[0.18em] uppercase font-bold"
              style={{ background: 'var(--pump-grad-hot)', color: '#fff' }}>
              Save Reading
            </button>
          </Row>
          <Row label="Secondary">
            <button className="w-full rounded-2xl py-3 text-sm tracking-[0.18em] uppercase font-bold"
              style={{ background: 'transparent', color: 'var(--pump-text-mid)', border: '1px solid var(--pump-border-card)' }}>
              Done
            </button>
          </Row>
        </Section>

        {/* 07 — overlay contract */}
        <Section id="07" title="Overlay contract">
          <p className="text-sm" style={{ color: 'var(--pump-text-mid)' }}>
            Every sheet, modal, dialog must satisfy these. <strong>Enforced at the primitive</strong>
            (<code>src/components/ui/sheet.tsx</code>) so consumers inherit it for free.
          </p>
          <ul className="space-y-2 text-sm" style={{ color: 'var(--pump-text)' }}>
            {[
              'Height-clamped to viewport (dvh + safe-area). Never sized to content.',
              'Persistent ≥44px close in a sticky header. Reachable from any scroll position.',
              'Scrim tap-out and Escape close — independent of scroll position.',
              'One inner scroll region; header and footer pinned.',
              'Acceptance = measured at 375×667. Bounding rect, not eyeballs.',
            ].map((rule, i) => (
              <li key={i} className="flex gap-2">
                <span className="font-display tabular-nums shrink-0" style={{ color: 'var(--pump-cyan-deep)' }}>{i + 1}.</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </main>
  );
}
