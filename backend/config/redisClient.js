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
    }
  }
});

let isReady = false;
let lastLoggedErrorTime = 0;

client.on('connect', () => {
  console.log('Redis client connecting...');
});

client.on('ready', () => {
  console.log('Redis client ready to use');
  isReady = true;
});

client.on('error', (err) => {
  isReady = false;
  const now = Date.now();
  // Throttle error logging to once every 60 seconds to prevent console spam
  if (now - lastLoggedErrorTime > 60000) {
    console.warn('⚠️ Redis is not running locally (ECONNREFUSED). Running in offline fallback mode (connecting directly to MongoDB).');
    lastLoggedErrorTime = now;
  }
});

client.on('end', () => {
  console.log('Redis client connection closed');
  isReady = false;
});

// Try to connect asynchronously; do not block server startup if offline
client.connect().catch((err) => {
  // Silence initial error stack as it is handled by the throttled error event above
});

export async function getCache(key) {
  if (!isReady) return null;
  try {
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (err) {
    console.error(`Error reading from Redis cache for key "${key}":`, err.message || err);
    return null;
  }
}

export async function setCache(key, value, ttlSeconds = 120) {
  if (!isReady) return false;
  try {
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
  if (!isReady) return false;
  try {
    await client.del(key);
    return true;
  } catch (err) {
    console.error(`Error deleting Redis cache key "${key}":`, err.message || err);
    return false;
  }
}

export async function getVersion(prefix) {
  if (!isReady) return "1";
  try {
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
  if (!isReady) return;
  try {
    await client.set(`${prefix}:version`, Date.now().toString());
  } catch (err) {
    // Ignore error
  }
}

export default client;
