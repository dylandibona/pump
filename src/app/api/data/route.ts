import { Redis } from '@upstash/redis';
import { mergeEnvelopes, type SyncEnvelope } from '@/lib/sync-merge';

// Personal workout data is request-time, per-user state — never prerender or cache.
export const dynamic = 'force-dynamic';

const DATA_KEY = 'pump:data';

// Env vars are injected under different names depending on how the Redis store
// was provisioned (Vercel Marketplace Upstash uses KV_REST_API_*, a direct
// Upstash integration uses UPSTASH_REDIS_REST_*). Accept both.
function redisOrNull(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

// Gate writes/reads behind a shared bearer token. Returns an error Response
// when auth is unconfigured or fails, or null when the request is authorized.
function authError(request: Request): Response | null {
  const expected = process.env.SYNC_TOKEN;
  if (!expected) {
    return Response.json({ error: 'sync_not_configured' }, { status: 503 });
  }
  const header = request.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (token !== expected) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }
  return null;
}

export async function GET(request: Request) {
  const denied = authError(request);
  if (denied) return denied;

  const redis = redisOrNull();
  if (!redis) return Response.json({ error: 'sync_not_configured' }, { status: 503 });

  const stored = await redis.get<SyncEnvelope>(DATA_KEY);
  return Response.json({ envelope: stored ?? null });
}

export async function PUT(request: Request) {
  const denied = authError(request);
  if (denied) return denied;

  const redis = redisOrNull();
  if (!redis) return Response.json({ error: 'sync_not_configured' }, { status: 503 });

  let incoming: SyncEnvelope;
  try {
    incoming = (await request.json()) as SyncEnvelope;
  } catch {
    return Response.json({ error: 'invalid_body' }, { status: 400 });
  }
  if (!incoming || typeof incoming !== 'object' || !incoming.data) {
    return Response.json({ error: 'invalid_envelope' }, { status: 400 });
  }

  const stored = await redis.get<SyncEnvelope>(DATA_KEY);
  const merged = stored ? mergeEnvelopes(stored, incoming) : incoming;
  await redis.set(DATA_KEY, merged);
  return Response.json({ envelope: merged });
}
