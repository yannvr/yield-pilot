import { createClient } from 'redis';
import config from '../config/index.js';
import chalk from 'chalk';

/**
 * Redis cache service
 * Provides caching functionality with Redis for protocol data
 */
class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.config = config.redis;
    this.cacheEnabled = config.cache.enabled;
  }

  /**
   * Initialize Redis connection
   * @returns {Promise<boolean>} Connection status
   */
  async init() {
    if (!this.cacheEnabled) {
      console.log(chalk.yellow('Cache is disabled. Using live data for all requests.'));
      return false;
    }

    try {
      this.client = createClient({
        socket: {
          host: this.config.host,
          port: this.config.port
        },
        username: this.config.username || undefined,
        password: this.config.password || undefined,
      });

      // Log connection events
      this.client.on('error', (err) => {
        console.error(chalk.red('Redis connection error:'), err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log(chalk.green('Connected to Redis cache'));
      });

      this.client.on('ready', () => {
        console.log(chalk.green('Redis cache is ready'));
        this.isConnected = true;
      });

      this.client.on('reconnecting', () => {
        console.log(chalk.yellow('Reconnecting to Redis cache...'));
      });

      this.client.on('end', () => {
        console.log(chalk.yellow('Redis connection closed'));
        this.isConnected = false;
      });

      // Connect to Redis
      await this.client.connect();
      return true;
    } catch (error) {
      console.error(chalk.red('Failed to initialize Redis cache:'), error.message);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Get data from cache
   * @param {string} key Cache key
   * @returns {Promise<any>} Cached data or null if not found
   */
  async get(key) {
    if (!this.isConnected || !this.cacheEnabled) return null;

    try {
      const data = await this.client.get(key);
      if (data) {
        console.log(chalk.green(`🔍 Cache HIT: ${key}`));
        return JSON.parse(data);
      }
      console.log(chalk.yellow(`🔍 Cache MISS: ${key}`));
      return null;
    } catch (error) {
      console.error(chalk.red(`Cache get error for key ${key}:`), error.message);
      return null;
    }
  }

  /**
   * Store data in cache
   * @param {string} key Cache key
   * @param {any} data Data to cache
   * @param {number} ttl Time to live in seconds
   * @returns {Promise<boolean>} Success status
   */
  async set(key, data, ttl = config.redis.cacheTtl) {
    if (!this.isConnected || !this.cacheEnabled) return false;

    try {
      const serializedData = JSON.stringify(data);
      await this.client.set(key, serializedData, { EX: ttl });
      console.log(chalk.green(`💾 Cache SET: ${key} (TTL: ${ttl}s)`));
      return true;
    } catch (error) {
      console.error(chalk.red(`Cache set error for key ${key}:`), error.message);
      return false;
    }
  }

  /**
   * Delete data from cache
   * @param {string} key Cache key
   * @returns {Promise<boolean>} Success status
   */
  async delete(key) {
    if (!this.isConnected || !this.cacheEnabled) return false;

    try {
      await this.client.del(key);
      console.log(chalk.yellow(`🗑️ Cache DELETE: ${key}`));
      return true;
    } catch (error) {
      console.error(chalk.red(`Cache delete error for key ${key}:`), error.message);
      return false;
    }
  }

  /**
   * Clear all cache keys with a specific prefix
   * @param {string} prefix Key prefix to clear
   * @returns {Promise<number>} Number of keys deleted
   */
  async clearByPrefix(prefix) {
    if (!this.isConnected || !this.cacheEnabled) return 0;

    try {
      // Find all keys with the prefix
      const keys = await this.client.keys(`${prefix}*`);
      if (keys.length === 0) return 0;

      // Delete all found keys
      const result = await this.client.del(keys);
      console.log(chalk.yellow(`🗑️ Cache CLEAR: ${prefix}* (${result} keys)`));
      return result;
    } catch (error) {
      console.error(chalk.red(`Cache clear error for prefix ${prefix}:`), error.message);
      return 0;
    }
  }

  /**
   * Close the Redis connection
   */
  async close() {
    if (this.client && this.isConnected) {
      try {
        await this.client.quit();
        console.log(chalk.yellow('Redis connection closed'));
      } catch (error) {
        console.error(chalk.red('Error closing Redis connection:'), error.message);
      }
      this.isConnected = false;
    }
  }
}

// Create a singleton instance
const cacheService = new CacheService();

export default cacheService;
