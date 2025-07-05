import Redis from 'ioredis';
import { logger } from '../utils/logger';
import type { CacheItem } from '../types';

export class CacheService {
  private redis?: Redis;
  private memoryCache: Map<string, CacheItem> = new Map();
  private useRedis: boolean = false;
  private cleanupInterval?: NodeJS.Timeout;

  constructor() {
    this.initialize();
    this.startCleanupInterval();
  }

  private async initialize(): Promise<void> {
    // Отключаем Redis для упрощения - используем только память
    if (process.env.REDIS_URL && process.env.ENABLE_REDIS === 'true') {
      try {
        this.redis = new Redis(process.env.REDIS_URL, {
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          connectTimeout: 5000,
        });

        await this.redis.connect();
        this.useRedis = true;
        logger.info('✅ Connected to Redis cache');

        // Handle Redis errors
        this.redis.on('error', (error) => {
          logger.warn('Redis connection error, falling back to memory cache:', {
            error: error.message
          });
          this.useRedis = false;
        });

        this.redis.on('connect', () => {
          logger.info('🔗 Redis connected');
          this.useRedis = true;
        });

        this.redis.on('disconnect', () => {
          logger.warn('🔌 Redis disconnected, using memory cache');
          this.useRedis = false;
        });

      } catch (error) {
        logger.info('📝 Redis not available, using in-memory cache');
        this.useRedis = false;
      }
    } else {
      logger.info('📝 Using in-memory cache (Redis disabled)');
    }
  }

  private startCleanupInterval(): void {
    // Clean expired items every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 5 * 60 * 1000);
  }

  private cleanupExpired(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, item] of this.memoryCache.entries()) {
      if (item.expiresAt <= now) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => {
      this.memoryCache.delete(key);
    });

    if (expiredKeys.length > 0) {
      logger.debug(`🧹 Cleaned up ${expiredKeys.length} expired cache items`);
    }
  }

  /**
   * Get value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      if (this.useRedis && this.redis && this.redis.status === 'ready') {
        const value = await this.redis.get(key);
        if (value) {
          return JSON.parse(value);
        }
        return null;
      } else {
        // Memory cache
        const item = this.memoryCache.get(key);
        if (item) {
          if (item.expiresAt > Date.now()) {
            return item.data;
          } else {
            this.memoryCache.delete(key);
          }
        }
        return null;
      }
    } catch (error) {
      logger.debug(`Cache get error for key ${key}, using memory fallback`);
      // Fallback to memory cache
      const item = this.memoryCache.get(key);
      if (item && item.expiresAt > Date.now()) {
        return item.data;
      }
      return null;
    }
  }

  /**
   * Set value in cache with TTL (in seconds)
   */
  async set<T = any>(key: string, value: T, ttl: number = 300): Promise<boolean> {
    try {
      // Always save to memory cache as fallback
      const expiresAt = Date.now() + (ttl * 1000);
      this.memoryCache.set(key, {
        data: value,
        expiresAt,
      });

      if (this.useRedis && this.redis && this.redis.status === 'ready') {
        await this.redis.setex(key, ttl, JSON.stringify(value));
      }
      
      return true;
    } catch (error) {
      logger.debug(`Cache set error for key ${key}, using memory cache`);
      // Memory cache already set above
      return true;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      this.memoryCache.delete(key);
      
      if (this.useRedis && this.redis && this.redis.status === 'ready') {
        const result = await this.redis.del(key);
        return result > 0;
      } else {
        return true;
      }
    } catch (error) {
      logger.debug(`Cache delete error for key ${key}`);
      return true;
    }
  }

  /**
   * Get or set pattern - if value doesn't exist, call getter and cache result
   */
  async getOrSet<T = any>(
    key: string, 
    getter: () => Promise<T>, 
    ttl: number = 300
  ): Promise<T> {
    let value = await this.get<T>(key);
    
    if (value === null) {
      value = await getter();
      if (value !== undefined && value !== null) {
        await this.set(key, value, ttl);
      }
    }
    
    return value;
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (this.useRedis && this.redis) {
        const result = await this.redis.exists(key);
        return result === 1;
      } else {
        const item = this.memoryCache.get(key);
        return item !== undefined && item.expiresAt > Date.now();
      }
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Increment a numeric value
   */
  async increment(key: string, by: number = 1, ttl?: number): Promise<number> {
    try {
      if (this.useRedis && this.redis) {
        const result = await this.redis.incrby(key, by);
        if (ttl) {
          await this.redis.expire(key, ttl);
        }
        return result;
      } else {
        // Memory cache
        const current = await this.get<number>(key) || 0;
        const newValue = current + by;
        await this.set(key, newValue, ttl || 300);
        return newValue;
      }
    } catch (error) {
      logger.error(`Cache increment error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Get multiple keys at once
   */
  async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
    try {
      if (this.useRedis && this.redis) {
        const values = await this.redis.mget(...keys);
        return values.map(value => value ? JSON.parse(value) : null);
      } else {
        return keys.map(key => {
          const item = this.memoryCache.get(key);
          if (item && item.expiresAt > Date.now()) {
            return item.data;
          }
          return null;
        });
      }
    } catch (error) {
      logger.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  }

  /**
   * Set multiple keys at once
   */
  async mset<T = any>(entries: Array<{ key: string; value: T; ttl?: number }>): Promise<boolean> {
    try {
      if (this.useRedis && this.redis) {
        const pipeline = this.redis.pipeline();
        entries.forEach(({ key, value, ttl = 300 }) => {
          pipeline.setex(key, ttl, JSON.stringify(value));
        });
        await pipeline.exec();
        return true;
      } else {
        entries.forEach(({ key, value, ttl = 300 }) => {
          const expiresAt = Date.now() + (ttl * 1000);
          this.memoryCache.set(key, {
            data: value,
            expiresAt,
          });
        });
        return true;
      }
    } catch (error) {
      logger.error('Cache mset error:', error);
      return false;
    }
  }

  /**
   * Clear all cache (use with caution)
   */
  async clear(): Promise<boolean> {
    try {
      if (this.useRedis && this.redis) {
        await this.redis.flushdb();
        return true;
      } else {
        this.memoryCache.clear();
        return true;
      }
    } catch (error) {
      logger.error('Cache clear error:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { type: string; size: number; hits: number; misses: number } {
    if (this.useRedis && this.redis) {
      return {
        type: 'redis',
        size: 0, // Would need Redis INFO command
        hits: 0,
        misses: 0,
      };
    } else {
      return {
        type: 'memory',
        size: this.memoryCache.size,
        hits: 0, // Could track these with counters
        misses: 0,
      };
    }
  }

  /**
   * Disconnect from cache
   */
  async disconnect(): Promise<void> {
    try {
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
      }

      if (this.redis) {
        await this.redis.disconnect();
        logger.info('📦 Disconnected from Redis cache');
      }

      this.memoryCache.clear();
      logger.info('🧹 Cleared memory cache');
    } catch (error) {
      logger.error('Cache disconnect error:', error);
    }
  }

  // Convenience methods for common cache patterns

  /**
   * Cache user data
   */
  async cacheUser(userId: string, userData: any, ttl: number = 1800): Promise<boolean> {
    return this.set(`user:${userId}`, userData, ttl);
  }

  /**
   * Get cached user data
   */
  async getUser(userId: string): Promise<any | null> {
    return this.get(`user:${userId}`);
  }

  /**
   * Cache guild data
   */
  async cacheGuild(guildId: string, guildData: any, ttl: number = 3600): Promise<boolean> {
    return this.set(`guild:${guildId}`, guildData, ttl);
  }

  /**
   * Get cached guild data
   */
  async getGuild(guildId: string): Promise<any | null> {
    return this.get(`guild:${guildId}`);
  }

  /**
   * Cache command cooldown
   */
  async setCooldown(userId: string, commandName: string, seconds: number): Promise<boolean> {
    return this.set(`cooldown:${userId}:${commandName}`, true, seconds);
  }

  /**
   * Check if user is on cooldown
   */
  async isOnCooldown(userId: string, commandName: string): Promise<boolean> {
    return this.exists(`cooldown:${userId}:${commandName}`);
  }

  /**
   * Rate limiting
   */
  async checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const count = await this.increment(`ratelimit:${key}`, 1, windowSeconds);
    
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      resetTime: Date.now() + (windowSeconds * 1000),
    };
  }
} 