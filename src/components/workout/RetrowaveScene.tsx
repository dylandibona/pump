'use client';

// Retrowave header scene — the brand moment. Monoton PUMP title over a
// 1987-synthwave sunset with perspective grid, palms, and scanlines.
// Ported from april 15/RETROWAVE_SCENE.html.

type Star = { top: string; left: string; size: number; opacity: number };
type Mountain = { left: string; borderWidth: string; color: string };
type Palm = { file: 1 | 2 | 3 | 4; side: 'left' | 'right'; width: number; height: number; offset: number; opacity?: number };

const STARS: Star[] = [
  { top: '6%',  left: '10%', size: 2, opacity: 0.5 },
  { top: '12%', left: '32%', size: 1, opacity: 0.7 },
  { top: '4%',  left: '55%', size: 2, opacity: 0.4 },
  { top: '18%', left: '70%', size: 1, opacity: 0.6 },
  { top: '8%',  left: '88%', size: 2, opacity: 0.5 },
  { top: '3%',  left: '42%', size: 1, opacity: 0.6 },
];

// Sun horizontal band cuts — widen toward the bottom for "setting" feel.
const SUN_CUTS: { bottom: string; height: string }[] = [
  { bottom: '10%', height: '2px' },
  { bottom: '22%', height: '3px' },
  { bottom: '34%', height: '5px' },
  { bottom: '48%', height: '7px' },
  { bottom: '62%', height: '9px' },
  { bottom: '78%', height: '12px' },
];

const MOUNTAINS: Mountain[] = [
  { left: '-5%', borderWidth: '0 80px 32px 60px', color: '#2a0044' },
  { left: '18%', borderWidth: '0 60px 24px 70px', color: '#220038' },
  { left: '55%', borderWidth: '0 90px 30px 50px', color: '#2a0044' },
  { left: '78%', borderWidth: '0 50px 22px 80px', color: '#1e0030' },
];

const PALMS: Palm[] = [
  { file: 1, side: 'left',  width: 110, height: 160, offset: -8, opacity: 0.85 },
  { file: 3, side: 'right', width: 100, height: 140, offset: -10, opacity: 0.85 },
];

interface RetrowaveSceneProps {
  tagline?: string;
  height?: number;
}

export function RetrowaveScene({ tagline = "Train like it's 1987", height = 200 }: RetrowaveSceneProps) {
  return (
    <div className="pump-scene" style={{ height }}>
      {/* Stars */}
      {STARS.map((s, i) => (
        <span
          key={i}
          className="pump-scene__star"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
          }}
        />
      ))}

      {/* Cyan coronas behind sun */}
      <div className="pump-scene__corona-outer" />
      <div className="pump-scene__corona-inner" />

      {/* Half-set sun with horizontal band cuts */}
      <div className="pump-scene__sun">
        {SUN_CUTS.map((c, i) => (
          <div key={i} className="pump-scene__sun-cut" style={{ bottom: c.bottom, height: c.height }} />
        ))}
      </div>

      {/* Mountain silhouettes */}
      <div className="pump-scene__mountains">
        {MOUNTAINS.map((m, i) => (
          <div
            key={i}
            className="pump-scene__mountain"
            style={{
              left: m.left,
              borderWidth: m.borderWidth,
              borderColor: `transparent transparent ${m.color} transparent`,
            }}
          />
        ))}
      </div>

      {/* Palm trees (masked SVGs so they pick up --pump-palm via background-color) */}
      {PALMS.map((p, i) => {
        const mask = `url(/palms/palm_${p.file}.svg)`;
        const sideStyle =
          p.side === 'left'
            ? { left: `${p.offset}%` }
            : { right: `${p.offset}%`, transform: 'scaleX(-1)' };
        return (
          <div
            key={i}
            className="pump-scene__palm"
            style={{
              ...sideStyle,
              width: p.width,
              height: p.height,
              opacity: p.opacity,
              maskImage: mask,
              WebkitMaskImage: mask,
            }}
          />
        );
      })}

      {/* Horizon line */}
      <div className="pump-scene__horizon" />

      {/* Perspective grid (animated) */}
      <div className="pump-scene__grid-container">
        <div className="pump-scene__grid-plane" />
        <div className="pump-scene__grid-glow" />
      </div>

      {/* Title overlay */}
      <div className="pump-scene__title-overlay">
        <div className="pump-scene__title">PUMP</div>
        <div className="pump-scene__tagline">{tagline}</div>
      </div>

      {/* CRT scanlines */}
      <div className="pump-scene__scanlines" />
    </div>
  );
}
