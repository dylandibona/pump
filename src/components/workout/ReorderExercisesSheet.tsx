'use client';

import { useEffect, useState } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
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
  // Local working order, seeded from props ONLY when the sheet opens. Depending
  // on `exercises` here re-seeded the order on every parent re-render while the
  // sheet was open — clobbering an in-progress drag and making reorders "not
  // take". Seed once on the open transition; commit on Done.
  const [order, setOrder] = useState<GymExercise[]>(exercises);
  useEffect(() => {
    if (open) setOrder(exercises);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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

        {/* Single scroll region. Dragging is restricted to the grip handle
            (dragListener={false} + dragControls), so touching the card body
            scrolls the list normally — that's what lets you reach exercises
            below the fold. The whole-card drag previously ate the scroll. */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-2">
          <Reorder.Group axis="y" values={order} onReorder={setOrder} className="space-y-2">
            {order.map(ex => (
              <ReorderRow key={ex.id} ex={ex} loggedCount={loggedCount(ex)} />
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

// One reorder row. Drag is initiated ONLY from the grip handle (touchAction
// none + dragControls.start), leaving the rest of the card free to scroll the
// list. The handle is a ≥44px touch target so it's easy to grab on mobile.
function ReorderRow({ ex, loggedCount }: { ex: GymExercise; loggedCount: number }) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={ex}
      dragListener={false}
      dragControls={controls}
      className="pump-card p-3 flex items-center gap-2 select-none"
      whileDrag={{ scale: 1.03, boxShadow: '0 10px 30px -10px rgba(255,0,128,0.5)' }}
    >
      <button
        type="button"
        aria-label={`Drag to reorder ${ex.name}`}
        onPointerDown={(e) => controls.start(e)}
        className="touch-target -ml-1 flex items-center justify-center text-muted-foreground active:text-primary cursor-grab active:cursor-grabbing shrink-0"
        style={{ touchAction: 'none' }}
      >
        <GripVertical className="w-5 h-5" />
      </button>
      <div className="flex-1 min-w-0">
        <p className="font-display tracking-wide truncate">{ex.name.toUpperCase()}</p>
        <p className="text-xs text-muted-foreground">
          {loggedCount} {loggedCount === 1 ? 'set' : 'sets'} logged
        </p>
      </div>
      {ex.supersetGroupId && <span className="tag tag--superset shrink-0">⚡</span>}
    </Reorder.Item>
  );
}
