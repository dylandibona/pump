'use client';

import { motion } from 'framer-motion';
import { Dumbbell, Clock, ClipboardList } from 'lucide-react';

export type TabKey = 'workout' | 'history' | 'plan';

interface BottomTabBarProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

const TABS: { key: TabKey; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'workout', label: 'WORKOUT', Icon: Dumbbell },
  { key: 'history', label: 'HISTORY', Icon: Clock },
  { key: 'plan',    label: 'PLAN',    Icon: ClipboardList },
];

export function BottomTabBar({ active, onChange }: BottomTabBarProps) {
  return (
    <motion.nav
      className="fixed bottom-0 inset-x-0 z-40 border-t border-[color:var(--pump-border-card)] bg-[color:var(--pump-bg-card)]/95 backdrop-blur-md"
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      // Respect iOS home indicator inset
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0px)' }}
    >
      <div className="max-w-lg mx-auto flex items-stretch justify-around px-2 pt-2 pb-3">
        {TABS.map(({ key, label, Icon }) => {
          const isActive = key === active;
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className="relative flex-1 flex flex-col items-center gap-1 py-1 group"
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? 'text-[color:var(--pump-hot)]' : 'text-[color:var(--pump-text-dim)] group-hover:text-[color:var(--pump-text-mid)]'
                  }`}
                />
                {isActive && (
                  <motion.span
                    layoutId="tab-dot"
                    className="absolute inset-0 -z-10 rounded-full bg-[color:var(--pump-hot)]/12 blur-md"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </div>
              <span
                className={`text-[9px] font-bold tracking-[0.18em] transition-colors ${
                  isActive ? 'text-[color:var(--pump-hot)]' : 'text-[color:var(--pump-text-dim)]'
                }`}
                style={{ fontFamily: 'var(--font-outfit), sans-serif' }}
              >
                {label}
              </span>
              {isActive && (
                <motion.span
                  layoutId="tab-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full"
                  style={{ background: 'var(--pump-grad-bar)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
}
