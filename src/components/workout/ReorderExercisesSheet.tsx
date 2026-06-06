'use client';

import { useEffect, useState } from 'react';
import { Reorder } from 'framer-motion';
import { GripVertical, X } from 'lucide-react';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import type { GymExercise } from '@/lib/types';

// Dedicated reorder surface (not inline drag — the live exercise cards are full
// of number inputs, so inline DnD fights typing/scrolling on mobile). Compact
// cards: name, logged-set count, superset badge, drag handle. Order is committed
// on Done via onReorder(orderedIds); each exercise keeps its own sets[], so
// logged data travels with the card.
export function ReorderExercisesSheet({
  open,
  onOpenChange,
  exercises,
  onReorder,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercises: GymExercise[];
  onReorder: (orderedIds: string[]) => void;
}) {
  // Local working order, seeded from props each time the sheet opens.
  const [order, setOrder] = useState<GymExercise[]>(exercises);
  useEffect(() => {
    if (open) setOrder(exercises);
  }, [open, exercises]);

  const loggedCount = (ex: GymExercise) => ex.sets.filter(s => !s.isPlanned).length;

  const handleDone = () => {
    onReorder(order.map(e => e.id));
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        // Inline height beats the base primitive's `data-[side=bottom]:h-auto`
        // variant (which otherwise sizes the sheet to content). Flex column =
        // sticky header, one scroll region, pinned footer — the overlay contract.
        style={{ height: '85dvh', maxHeight: '85dvh' }}
        className="glass-strong border-t-2 border-primary/30 flex flex-col p-0 gap-0"
      >
        <SheetHeader className="shrink-0 px-4 pt-4 pb-2 relative">
          <SheetTitle className="font-display text-2xl tracking-wider text-gradient text-center">
            REORDER
          </SheetTitle>
          <p className="text-center text-xs text-muted-foreground mt-1">
            Drag to reorder. Moving a superset member apart unlinks it.
          </p>
          <SheetClose
            aria-label="Close"
            render={
              <button className="absolute top-1 right-1 touch-target flex items-center justify-center rounded-full text-[color:var(--pump-text-dim)] hover:text-[color:var(--pump-text)] active:scale-95 transition" />
            }
          >
            <X className="w-6 h-6" />
          </SheetClose>
        </SheetHeader>

        {/* Single scroll region. The Reorder.Group lives INSIDE it — making the
            group itself the scroll container clipped the list past the fold and
            fought touch-drag. */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-2">
          <Reorder.Group axis="y" values={order} onReorder={setOrder} className="space-y-2">
            {order.map(ex => (
              <Reorder.Item
                key={ex.id}
                value={ex}
                className="pump-card p-3 flex items-center gap-3 cursor-grab active:cursor-grabbing select-none"
                whileDrag={{ scale: 1.03, boxShadow: '0 10px 30px -10px rgba(255,0,128,0.5)' }}
              >
                <GripVertical className="w-5 h-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-display tracking-wide truncate">{ex.name.toUpperCase()}</p>
                  <p className="text-xs text-muted-foreground">
                    {loggedCount(ex)} {loggedCount(ex) === 1 ? 'set' : 'sets'} logged
                  </p>
                </div>
                {ex.supersetGroupId && <span className="tag tag--superset shrink-0">⚡</span>}
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>

        <div className="shrink-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-[color:var(--pump-bg-card)] border-t border-[color:var(--pump-border-card)]">
          <Button onClick={handleDone} className="w-full touch-target" size="lg">
            DONE
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
