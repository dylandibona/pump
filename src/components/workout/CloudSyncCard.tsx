'use client';

import { useState } from 'react';
import { RefreshCw, Cloud, CloudOff, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CloudSync } from '@/hooks/useCloudSync';

function relativeTime(iso: string | null): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.round(hr / 24)}d ago`;
}

const STATUS_LABEL: Record<CloudSync['status'], string> = {
  unconfigured: 'Not connected',
  syncing: 'Syncing…',
  synced: 'Synced',
  offline: 'Offline — will retry',
  unauthorized: 'Token rejected',
  error: 'Sync unavailable',
};

export function CloudSyncCard({ sync }: { sync: CloudSync }) {
  const { status, lastSynced, hasToken, syncNow, saveToken } = sync;
  const needsToken = !hasToken || status === 'unauthorized';
  const [token, setToken] = useState('');
  const [editing, setEditing] = useState(false);

  const Icon = status === 'synced' ? Check : status === 'offline' || status === 'error' ? CloudOff : Cloud;
  const tone =
    status === 'synced' ? 'var(--pump-cyan-deep)' :
    status === 'unauthorized' || status === 'error' ? 'var(--pump-hot)' :
    'var(--muted-foreground)';

  return (
    <div className="glass rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon className="w-4 h-4 shrink-0" style={{ color: tone }} />
          <div className="min-w-0">
            <p className="text-[10px] tabular-nums tracking-[0.2em] text-muted-foreground uppercase">
              Cloud Sync
            </p>
            <p className="text-sm font-semibold truncate" style={{ color: tone }}>
              {STATUS_LABEL[status]}
              {status === 'synced' && lastSynced && (
                <span className="text-muted-foreground font-normal"> · {relativeTime(lastSynced)}</span>
              )}
            </p>
          </div>
        </div>
        {hasToken && status !== 'unauthorized' && (
          <button
            onClick={syncNow}
            disabled={status === 'syncing'}
            className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-[color:var(--pump-cyan-deep)] bg-[color:var(--pump-cyan-deep)]/12 disabled:opacity-50 transition-opacity"
            aria-label="Sync now"
          >
            <RefreshCw className={`w-4 h-4 ${status === 'syncing' ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {(needsToken || editing) && (
        <form
          onSubmit={(e) => { e.preventDefault(); saveToken(token); setToken(''); setEditing(false); }}
          className="flex items-center gap-2"
        >
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Sync token"
            autoComplete="off"
            className="flex-1 min-w-0 rounded-lg bg-black/5 border border-black/10 px-3 py-2 text-sm focus:outline-none focus:border-[color:var(--pump-cyan-deep)]/50"
          />
          <Button type="submit" size="sm" disabled={!token.trim()}>Connect</Button>
        </form>
      )}

      {hasToken && !needsToken && !editing && (
        <button
          onClick={() => setEditing(true)}
          className="text-[11px] text-muted-foreground hover:text-[color:var(--pump-hot)] transition-colors tracking-wide"
        >
          Change token
        </button>
      )}
    </div>
  );
}
