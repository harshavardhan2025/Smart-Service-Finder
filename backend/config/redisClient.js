import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

let redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
// Strip surrounding quotes if present (common in cloud env dashboard setups)
redisUrl = redisUrl.replace(/^['"]|['"]$/g, '');

const client = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries) => {
      // Try reconnecting every 10 seconds to avoid spamming logs if offline
      if (retries > 5) {
        return 10000;
      }
      return Math.min(retries * 1000, 5000);
    },
    // Dynamic TLS/SSL support for global hosting (Vercel, Render, Railway, etc.)
    ...(redisUrl.startsWith('rediss://') ? {
      rejectUnauthorized: false,
      tls: true
    } : {})
  }
});

let connectionPromise = null;
let lastLoggedErrorTime = 0;

client.on('connect', () => {
  console.log('Redis client connecting...');
});

client.on('ready', () => {
  console.log('Redis client ready to use');
});

client.on('error', (err) => {
  // Silence transient errors if connection socket is open/reconnecting
  if (client.isOpen) return;
  const now = Date.now();
  // Throttle error logging to once every 60 seconds to prevent console spam
  if (now - lastLoggedErrorTime > 60000) {
    console.warn('⚠️ Redis connection error. Running in offline fallback mode (connecting directly to MongoDB).');
    lastLoggedErrorTime = now;
  }
});

client.on('end', () => {
  console.log('Redis client connection closed');
});

async function ensureConnected() {
  if (client.isOpen) {
    return;
  }
  
  if (connectionPromise) {
    return connectionPromise;
  }
  
  connectionPromise = client.connect()
    .then(() => {
      connectionPromise = null;
    })
    .catch((err) => {
      connectionPromise = null;
    });
    
  return connectionPromise;
}

// Warm up connection immediately on file load
ensureConnected();

// 🚀 L1 HYBRID CACHE: In-Memory cache stage for 0ms local RAM response times
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

export async function getCache(key) {
  // 1. Try L1 (In-Memory) Cache - 0ms response time
  const l1Item = l1Cache.get(key);
  if (l1Item && l1Item.expiry > Date.now()) {
    return l1Item.value;
  }

  // 2. Try L2 (Redis) Cache
  try {
    await ensureConnected();
    if (!client.isOpen) return null;
    const value = await client.get(key);
    if (value) {
      const parsedValue = JSON.parse(value);
      // Store in L1 for subsequent rapid hits (cached in memory for 30s)
      l1Cache.set(key, {
        value: parsedValue,
        expiry: Date.now() + 30000
      });
      return parsedValue;
    }
    return null;
  } catch (err) {
    console.error(`Error reading from Redis cache for key "${key}":`, err.message || err);
    return null;
  }
}

export async function setCache(key, value, ttlSeconds = 120) {
  // Update L1 Cache
  l1Cache.set(key, {
    value: value,
    expiry: Date.now() + (ttlSeconds * 1000)
  });

  // Update L2 (Redis) Cache
  try {
    await ensureConnected();
    if (!client.isOpen) return false;
    const serializedValue = JSON.stringify(value);
    await client.set(key, serializedValue, {
      EX: ttlSeconds
    });
    return true;
  } catch (err) {
    console.error(`Error writing to Redis cache for key "${key}":`, err.message || err);
    return false;
  }
}

export async function delCache(key) {
  // Invalidate L1 Cache
  l1Cache.delete(key);

  // Invalidate L2 (Redis) Cache
  try {
    await ensureConnected();
    if (!client.isOpen) return false;
    await client.del(key);
    return true;
  } catch (err) {
    console.error(`Error deleting Redis cache key "${key}":`, err.message || err);
    return false;
  }
}

export async function getVersion(prefix) {
  try {
    await ensureConnected();
    if (!client.isOpen) return "1";
    let version = await client.get(`${prefix}:version`);
    if (!version) {
      version = Date.now().toString();
      await client.set(`${prefix}:version`, version);
    }
    return version;
  } catch (err) {
    return "1";
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
    await ensureConnected();
    if (!client.isOpen) return;
    await client.set(`${prefix}:version`, Date.now().toString());
  } catch (err) {
    // Ignore error
  }
}

export default client;
