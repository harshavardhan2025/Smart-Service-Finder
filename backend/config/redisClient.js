import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

let redisUrl = process.env.REDIS_URL;
const clientEnabled = !!redisUrl;
if (redisUrl) redisUrl = redisUrl.replace(/^['\"]|['\"]$/g, '');

const state = {
  status: clientEnabled ? 'disconnected' : 'disabled',
  lastConnectedAt: null,
  lastErrorAt: null,
  lastError: null,
  reconnectAttempts: 0,
  totalOperations: 0,
  failedOperations: 0,
  cacheHits: 0,
  cacheMisses: 0,
};

const client = clientEnabled ? createClient({
  url: redisUrl,
  socket: {
    connectTimeout: 5000,
    reconnectStrategy: (retries) => {
      state.reconnectAttempts = retries;
      state.status = 'connecting';
      if (retries > 20) { state.status = 'degraded'; return 30000; }
      return Math.min(retries * 1000, 10000);
    },
    ...(redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false, tls: true } : {})
  }
}) : null;

let connectionPromise = null;
let lastLoggedErrorTime = 0;

if (clientEnabled && client) {
  client.on('connect', () => { state.status = 'connecting'; });
  client.on('ready', () => {
    state.status = 'connected';
    state.lastConnectedAt = new Date().toISOString();
    state.reconnectAttempts = 0;
    state.lastError = null;
    console.log('✅ Redis ready');
  });
  client.on('error', (err) => {
    state.lastErrorAt = new Date().toISOString();
    state.lastError = err.message || String(err);
    if (client.isOpen) { state.status = 'degraded'; return; }
    state.status = 'disconnected';
    const now = Date.now();
    if (now - lastLoggedErrorTime > 60000) {
      console.warn('⚠️ Redis offline — falling back to MongoDB directly.');
      lastLoggedErrorTime = now;
    }
  });
  client.on('end', () => { state.status = 'disconnected'; });
  client.on('reconnecting', () => { state.status = 'connecting'; });
}

async function ensureConnected() {
  if (!clientEnabled || !client) return false;
  if (client.isOpen) return true;

  if (!connectionPromise) {
    state.status = 'connecting';
    connectionPromise = client.connect()
      .then(() => { connectionPromise = null; state.status = 'connected'; state.lastConnectedAt = new Date().toISOString(); return true; })
      .catch((err) => { connectionPromise = null; state.status = 'disconnected'; state.lastError = err.message || String(err); state.lastErrorAt = new Date().toISOString(); return false; });
  }

  // Race against 3s timeout so a down Redis never blocks a request
  let timeoutId;
  const result = await Promise.race([
    connectionPromise,
    new Promise(resolve => { timeoutId = setTimeout(() => resolve(false), 3000); })
  ]);
  clearTimeout(timeoutId);
  return result;
}

if (clientEnabled) ensureConnected().catch(() => {});

async function withRetry(operation, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try { return await operation(); }
    catch (err) {
      if (attempt === maxRetries) throw err;
      await new Promise(r => setTimeout(r, (attempt + 1) * 100));
    }
  }
}

// L1 in-memory cache for 0ms local hits
const l1Cache = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [key, item] of l1Cache.entries()) {
    if (item.expiry < now) l1Cache.delete(key);
  }
}, 30000).unref();

export async function getCache(key) {
  state.totalOperations++;
  const l1 = l1Cache.get(key);
  if (l1 && l1.expiry > Date.now()) { state.cacheHits++; return l1.value; }

  try {
    const connected = await ensureConnected();
    if (!connected || !client.isOpen) { state.cacheMisses++; return null; }
    const value = await withRetry(() => client.get(key));
    if (value) {
      const parsed = JSON.parse(value);
      l1Cache.set(key, { value: parsed, expiry: Date.now() + 30000 });
      state.cacheHits++;
      return parsed;
    }
    state.cacheMisses++;
    return null;
  } catch (err) {
    state.failedOperations++;
    state.cacheMisses++;
    console.error(`❌ Redis GET "${key}":`, err.message);
    return null;
  }
}

export async function setCache(key, value, ttlSeconds = 120) {
  state.totalOperations++;
  l1Cache.set(key, { value, expiry: Date.now() + ttlSeconds * 1000 });
  try {
    const connected = await ensureConnected();
    if (!connected || !client.isOpen) return false;
    await withRetry(() => client.set(key, JSON.stringify(value), { EX: ttlSeconds }));
    return true;
  } catch (err) {
    state.failedOperations++;
    console.error(`❌ Redis SET "${key}":`, err.message);
    return false;
  }
}

export async function delCache(key) {
  state.totalOperations++;
  l1Cache.delete(key);
  try {
    const connected = await ensureConnected();
    if (!connected || !client.isOpen) return false;
    await withRetry(() => client.del(key));
    return true;
  } catch (err) {
    state.failedOperations++;
    console.error(`❌ Redis DEL "${key}":`, err.message);
    return false;
  }
}

export async function getVersion(prefix) {
  try {
    const connected = await ensureConnected();
    if (!connected || !client.isOpen) return Date.now().toString();
    let version = await withRetry(() => client.get(`${prefix}:version`));
    if (!version) {
      version = Date.now().toString();
      await client.set(`${prefix}:version`, version);
    }
    return version;
  } catch {
    state.failedOperations++;
    return Date.now().toString();
  }
}

export async function invalidateVersion(prefix) {
  for (const key of l1Cache.keys()) {
    if (key.startsWith(prefix)) l1Cache.delete(key);
  }
  try {
    const connected = await ensureConnected();
    if (!connected || !client.isOpen) return;
    await withRetry(() => client.set(`${prefix}:version`, Date.now().toString()));
  } catch {
    state.failedOperations++;
  }
}

export async function getRedisHealth() {
  if (!clientEnabled) return { status: 'disabled', message: 'REDIS_URL not configured' };

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
      hitRate: state.totalOperations > 0 ? `${((state.cacheHits / state.totalOperations) * 100).toFixed(1)}%` : 'N/A',
      l1CacheSize: l1Cache.size,
    },
    ping: null,
  };

  try {
    const connected = await ensureConnected();
    if (connected && client.isOpen) {
      const start = Date.now();
      const pong = await client.ping();
      health.ping = { ok: pong === 'PONG', latencyMs: Date.now() - start, response: pong };
    } else {
      health.ping = { ok: false, message: 'Client not connected' };
    }
  } catch (err) {
    health.ping = { ok: false, error: err.message || String(err) };
  }

  return health;
}

export default client;
