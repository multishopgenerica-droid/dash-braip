import Redis from 'ioredis';
import { env } from './env';

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });

    redis.on('connect', () => {
      console.log('Redis connected successfully');
    });

    redis.on('error', (error) => {
      console.error('Redis connection error:', error);
    });
  }

  return redis;
}

export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
    console.log('Redis disconnected');
  }
}

// Cache helpers
export async function setCache(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  const client = getRedis();
  await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
}

export async function getCache<T>(key: string): Promise<T | null> {
  const client = getRedis();
  const data = await client.get(key);
  return data ? JSON.parse(data) : null;
}

export async function deleteCache(key: string): Promise<void> {
  const client = getRedis();
  await client.del(key);
}

export async function deleteCachePattern(pattern: string): Promise<void> {
  const client = getRedis();
  const keys = await client.keys(pattern);
  if (keys.length > 0) {
    await client.del(...keys);
  }
}
