import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

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

export async function getCache(key) {
  try {
    await ensureConnected();
    if (!client.isOpen) return null;
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (err) {
    console.error(`Error reading from Redis cache for key "${key}":`, err.message || err);
    return null;
  }
}

export async function setCache(key, value, ttlSeconds = 120) {
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
  try {
    await ensureConnected();
    if (!client.isOpen) return;
    await client.set(`${prefix}:version`, Date.now().toString());
  } catch (err) {
    // Ignore error
  }
}

export default client;
