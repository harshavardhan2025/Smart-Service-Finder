import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

// ──────────────────────────────────────────────
// 🔧 CONFIGURATION
// ──────────────────────────────────────────────
let redisUrl = process.env.REDIS_URL;
const clientEnabled = !!redisUrl;

if (redisUrl) {
  redisUrl = redisUrl.replace(/^['"]|['"]$/g, '');
}

// ──────────────────────────────────────────────
// 📊 CONNECTION STATE TRACKING
// ──────────────────────────────────────────────
const state = {
  status: clientEnabled ? 'disconnected' : 'disabled',   // disconnected | connecting | connected | degraded | disabled
  lastConnectedAt: null,
  lastErrorAt: null,
  lastError: null,
  reconnectAttempts: 0,
  totalOperations: 0,
  failedOperations: 0,
  cacheHits: 0,
  cacheMisses: 0,
};

// ──────────────────────────────────────────────
// 🏗️ CLIENT CREATION
// ──────────────────────────────────────────────
const client = clientEnabled ? createClient({
  url: redisUrl,
  socket: {
    connectTimeout: 5000,   // give Upstash 5s on cold start (was implicit default)
    reconnectStrategy: (retries) => {
      state.reconnectAttempts = retries;
      state.status = 'connecting';
      // Exponential backoff capped at 30 seconds
      if (retries > 20) {
        state.status = 'degraded';
        return 30000;
      }
      return Math.min(retries * 1000, 10000);
    },
    // Dynamic TLS/SSL support for global hosting (Vercel, Render, Railway, etc.)
    ...(redisUrl.startsWith('rediss://') ? {
      rejectUnauthorized: false,
      tls: true
    } : {})
  }
}) : null;

// ──────────────────────────────────────────────
// 🔌 EVENT LISTENERS
// ──────────────────────────────────────────────
let connectionPromise = null;
let lastLoggedErrorTime = 0;

if (clientEnabled && client) {
  client.on('connect', () => {
    state.status = 'connecting';
    console.log('🔄 Redis client connecting...');
  });

  client.on('ready', () => {
    state.status = 'connected';
    state.lastConnectedAt = new Date().toISOString();
    state.reconnectAttempts = 0;
    state.lastError = null;
    console.log('✅ Redis client ready to use');
  });

  client.on('error', (err) => {
    state.lastErrorAt = new Date().toISOString();
    state.lastError = err.message || String(err);

    // Silence transient errors if the socket is still open/reconnecting
    if (client.isOpen) {
      state.status = 'degraded';
      return;
    }

    state.status = 'disconnected';
    const now = Date.now();
    // Throttle error logging to once every 60 seconds to prevent console spam
    if (now - lastLoggedErrorTime > 60000) {
      console.warn('⚠️ Redis connection error. Running in offline fallback mode (connecting directly to MongoDB).');
      console.warn(`   └─ ${err.message || err}`);
      lastLoggedErrorTime = now;
    }
  });

  client.on('end', () => {
    state.status = 'disconnected';
    console.log('🔌 Redis client connection closed');
  });

  client.on('reconnecting', () => {
    state.status = 'connecting';
  });
}

// ──────────────────────────────────────────────
// 🔗 CONNECTION MANAGEMENT
// ──────────────────────────────────────────────
async function ensureConnected() {
  if (!clientEnabled || !client) {
    return false;
  }
  if (client.isOpen) {
    return true;
  }

  if (!connectionPromise) {
    state.status = 'connecting';
    connectionPromise = client.connect()
      .then(() => {
        connectionPromise = null;
        state.status = 'connected';
        state.lastConnectedAt = new Date().toISOString();
        return true;
      })
      .catch((err) => {
        connectionPromise = null;
        state.status = 'disconnected';
        state.lastError = err.message || String(err);
        state.lastErrorAt = new Date().toISOString();
        console.warn(`⚠️ Redis connect attempt failed: ${err.message}`);
        return false;
      });
  }

  // Race the connection promise against a 3s timeout
  // so that we don't block requests indefinitely if Redis is down/unreachable
  let timeoutId;
  const timeoutPromise = new Promise((resolve) => {
    timeoutId = setTimeout(() => {
      resolve(false);
    }, 3000);
  });

  const result = await Promise.race([connectionPromise, timeoutPromise]);
  clearTimeout(timeoutId);
  return result;
}

// Warm up connection immediately on file load
if (clientEnabled) {
  ensureConnected().catch(() => {});
}

// ──────────────────────────────────────────────
// 🔁 RETRY HELPER — retries transient Redis operation failures
// ──────────────────────────────────────────────
async function withRetry(operation, label, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err) {
      const isLastAttempt = attempt === maxRetries;
      if (isLastAttempt) {
        throw err;
      }
      // Brief pause before retry (100ms, 200ms)
      await new Promise(r => setTimeout(r, (attempt + 1) * 100));
    }
  }
}

// ──────────────────────────────────────────────
// 🚀 L1 HYBRID CACHE: In-Memory cache for 0ms local RAM response times
// ──────────────────────────────────────────────
const l1Cache = new Map();

// Periodically purge expired L1 cache items to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, item] of l1Cache.entries()) {
    if (item.expiry < now) {
      l1Cache.delete(key);
    }
  }
}, 30000).unref();

// ──────────────────────────────────────────────
// 📖 CACHE READ
// ──────────────────────────────────────────────
export async function getCache(key) {
  state.totalOperations++;

  // 1. Try L1 (In-Memory) Cache — 0ms response time
  const l1Item = l1Cache.get(key);
  if (l1Item && l1Item.expiry > Date.now()) {
    state.cacheHits++;
    return l1Item.value;
  }

  // 2. Try L2 (Redis) Cache
  try {
    const connected = await ensureConnected();
    if (!connected || !client.isOpen) {
      state.cacheMisses++;
      return null;
    }

    const value = await withRetry(async () => {
      return await client.get(key);
    }, `GET ${key}`);

    if (value) {
      const parsedValue = JSON.parse(value);
      // Store in L1 for subsequent rapid hits (cached in memory for 30s)
      l1Cache.set(key, {
        value: parsedValue,
        expiry: Date.now() + 30000
      });
      state.cacheHits++;
      return parsedValue;
    }
    state.cacheMisses++;
    return null;
  } catch (err) {
    state.failedOperations++;
    state.cacheMisses++;
    console.error(`❌ Redis GET failed for "${key}":`, err.message || err);
    return null;
  }
}

// ──────────────────────────────────────────────
// ✏️ CACHE WRITE
// ──────────────────────────────────────────────
export async function setCache(key, value, ttlSeconds = 120) {
  state.totalOperations++;

  // Update L1 Cache (always, even if Redis is down)
  l1Cache.set(key, {
    value: value,
    expiry: Date.now() + (ttlSeconds * 1000)
  });

  // Update L2 (Redis) Cache
  try {
    const connected = await ensureConnected();
    if (!connected || !client.isOpen) return false;

    const serializedValue = JSON.stringify(value);
    await withRetry(async () => {
      await client.set(key, serializedValue, { EX: ttlSeconds });
    }, `SET ${key}`);
    return true;
  } catch (err) {
    state.failedOperations++;
    console.error(`❌ Redis SET failed for "${key}":`, err.message || err);
    return false;
  }
}

// ──────────────────────────────────────────────
// 🗑️ CACHE DELETE
// ──────────────────────────────────────────────
export async function delCache(key) {
  state.totalOperations++;

  // Invalidate L1 Cache
  l1Cache.delete(key);

  // Invalidate L2 (Redis) Cache
  try {
    const connected = await ensureConnected();
    if (!connected || !client.isOpen) return false;

    await withRetry(async () => {
      await client.del(key);
    }, `DEL ${key}`);
    return true;
  } catch (err) {
    state.failedOperations++;
    console.error(`❌ Redis DEL failed for "${key}":`, err.message || err);
    return false;
  }
}

// ──────────────────────────────────────────────
// 🔢 CACHE VERSIONING
// ──────────────────────────────────────────────
export async function getVersion(prefix) {
  try {
    const connected = await ensureConnected();
    if (!connected || !client.isOpen) return Date.now().toString(); // unique fallback to bust stale caches
    
    let version = await withRetry(async () => {
      return await client.get(`${prefix}:version`);
    }, `GET ${prefix}:version`);

    if (!version) {
      version = Date.now().toString();
      await client.set(`${prefix}:version`, version);
    }
    return version;
  } catch (err) {
    state.failedOperations++;
    // Return unique timestamp so caches are never silently stale
    return Date.now().toString();
  }
}

export async function invalidateVersion(prefix) {
  // Invalidate any local L1 caches associated with this prefix to ensure fresh reads
  for (const key of l1Cache.keys()) {
    if (key.startsWith(prefix)) {
      l1Cache.delete(key);
    }
  }

  try {
    const connected = await ensureConnected();
    if (!connected || !client.isOpen) return;
    await withRetry(async () => {
      await client.set(`${prefix}:version`, Date.now().toString());
    }, `INVALIDATE ${prefix}:version`);
  } catch (err) {
    state.failedOperations++;
    // Ignore — L1 was already cleared, and next read will generate a new version
  }
}

// ──────────────────────────────────────────────
// 🏥 HEALTH CHECK — exported for /api/health endpoint
// ──────────────────────────────────────────────
export async function getRedisHealth() {
  if (!clientEnabled) {
    return {
      status: 'disabled',
      message: 'REDIS_URL not configured — running without Redis cache',
    };
  }

  const health = {
    status: state.status,
    lastConnectedAt: state.lastConnectedAt,
    lastError: state.lastError,
    lastErrorAt: state.lastErrorAt,
    reconnectAttempts: state.reconnectAttempts,
    stats: {
      totalOperations: state.totalOperations,
      failedOperations: state.failedOperations,
      cacheHits: state.cacheHits,
      cacheMisses: state.cacheMisses,
      hitRate: state.totalOperations > 0
        ? `${((state.cacheHits / state.totalOperations) * 100).toFixed(1)}%`
        : 'N/A',
      l1CacheSize: l1Cache.size,
    },
    ping: null,
  };

  // Live PING test
  try {
    const connected = await ensureConnected();
    if (connected && client.isOpen) {
      const start = Date.now();
      const pong = await client.ping();
      const latency = Date.now() - start;
      health.ping = {
        ok: pong === 'PONG',
        latencyMs: latency,
        response: pong,
      };
    } else {
      health.ping = { ok: false, message: 'Client not connected' };
    }
  } catch (err) {
    health.ping = { ok: false, error: err.message || String(err) };
  }

  return health;
}

export default client;
