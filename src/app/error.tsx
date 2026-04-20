'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Copy, Check, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Next.js app-router error boundary. Any thrown error inside the route tree
// lands here instead of a blank white screen. Mid-session a render crash
// from malformed plan JSON (or any other bug) now shows Dylan exactly what
// went wrong and lets him paste it back to the trainer with the stack.
//
// Reset() triggers a re-render of the boundary's children — useful when
// the underlying state has been fixed (e.g. plan replaced with valid JSON
// after seeing which field failed).
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Best-effort client log so the error is visible in the devtools
    // console in addition to the UI.
    console.error('[pump error boundary]', error);
  }, [error]);

  const errorText = [
    `Error: ${error.message}`,
    error.digest ? `Digest: ${error.digest}` : '',
    error.stack ? `\n${error.stack}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(errorText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      // Clipboard blocked — the textarea below is selectable as fallback.
    });
  };

  return (
    <main className="min-h-screen bg-background relative">
      <div className="fixed inset-0 bg-gradient-radial pointer-events-none" />
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-30" />

      <div className="max-w-lg mx-auto px-4 py-8 relative z-10 space-y-6">
        <div className="text-center space-y-3 pt-8">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto bg-destructive/20 text-destructive">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <h1 className="font-display text-4xl tracking-wider text-destructive">
            SOMETHING BROKE
          </h1>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            Copy the error below and send it to your trainer so the plan (or
            the app) can be fixed.
          </p>
        </div>

        <div className="glass rounded-2xl p-4 space-y-3">
          <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase font-mono">
            Error details
          </p>
          <textarea
            readOnly
            value={errorText}
            onFocus={(e) => e.target.select()}
            className="w-full min-h-[180px] bg-background/50 border border-white/10 rounded-xl p-3 font-mono text-xs text-foreground resize-none focus:outline-none focus:border-destructive/50"
          />
          <Button
            onClick={handleCopy}
            variant="outline"
            className="w-full h-12 font-display tracking-widest"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2 text-primary" />
                COPIED
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                COPY ERROR
              </>
            )}
          </Button>
        </div>

        <Button
          onClick={reset}
          className="w-full h-14 font-display text-lg tracking-widest"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          TRY AGAIN
        </Button>
      </div>
    </main>
  );
}
