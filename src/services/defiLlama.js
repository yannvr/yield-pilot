import axios from 'axios';
import config from '../config/index.js';
import cacheService from './cache.js';
import chalk from 'chalk';

const { baseUrl, yieldsUrl, stablecoinsUrl } = config.api.defiLlama;
const cachePrefix = config.cache.protocolPrefix;

/**
 * DefiLlama API service
 * Provides methods to fetch data from DefiLlama API with caching
 */
class DefiLlamaService {
  constructor() {
    this.client = axios.create({
      timeout: 10000, // 10 seconds
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Generate cache key for a protocol
   * @param {string} protocolId Protocol identifier
   * @param {string} dataType Type of data being cached
   * @returns {string} Cache key
   */
  getCacheKey(protocolId, dataType = 'info') {
    return `${cachePrefix}${protocolId}:${dataType}`;
  }

  /**
   * Fetch protocol information from DefiLlama
   * @param {string} protocolId Protocol identifier in DefiLlama
   * @returns {Promise<Object>} Protocol data
   */
  async getProtocolInfo(protocolId) {
    const cacheKey = this.getCacheKey(protocolId);

    try {
      // Check cache first
      const cachedData = await cacheService.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      // If not in cache, fetch from API
      console.log(chalk.blue(`📡 Fetching protocol info from DefiLlama: ${protocolId}`));
      const response = await this.client.get(`${baseUrl}/protocol/${protocolId}`);

      if (response.data) {
        // Store in cache
        const ttl = config.protocols[protocolId]?.cache?.ttl || config.redis.cacheTtl;
        await cacheService.set(cacheKey, response.data, ttl);
        return response.data;
      }

      return null;
    } catch (error) {
      console.error(chalk.red(`DefiLlama API error for ${protocolId}:`), error.message);
      return null;
    }
  }

  /**
   * Fetch TVL data for a protocol
   * @param {string} protocolId Protocol identifier in DefiLlama
   * @returns {Promise<Object>} TVL data
   */
  async getProtocolTvl(protocolId) {
    const cacheKey = this.getCacheKey(protocolId, 'tvl');

    try {
      // Check cache first
      const cachedData = await cacheService.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      // If not in cache, fetch from API
      console.log(chalk.blue(`📡 Fetching protocol TVL from DefiLlama: ${protocolId}`));
      const response = await this.client.get(`${baseUrl}/tvl/${protocolId}`);

      if (response.data) {
        // Store in cache
        const ttl = config.protocols[protocolId]?.cache?.ttl || config.redis.cacheTtl;
        await cacheService.set(cacheKey, response.data, ttl);
        return response.data;
      }

      return null;
    } catch (error) {
      console.error(chalk.red(`DefiLlama TVL API error for ${protocolId}:`), error.message);
      return null;
    }
  }

  /**
   * Fetch yield pools for a protocol
   * @param {string} protocolId Protocol identifier in DefiLlama
   * @returns {Promise<Array>} Yield pools
   */
  async getProtocolYields(protocolId) {
    const cacheKey = this.getCacheKey(protocolId, 'yields');

    try {
      // Check cache first
      const cachedData = await cacheService.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      // If not in cache, fetch from API
      console.log(chalk.blue(`📡 Fetching protocol yields from DefiLlama: ${protocolId}`));
      const response = await this.client.get(`${yieldsUrl}/pools`);

      if (response.data && Array.isArray(response.data.data)) {
        // Filter pools for the specific protocol
        const filteredPools = response.data.data.filter(pool =>
          pool.project === protocolId
        );

        // Store in cache
        const ttl = config.protocols[protocolId]?.cache?.ttl || config.redis.cacheTtl;
        await cacheService.set(cacheKey, filteredPools, ttl);
        return filteredPools;
      }

      return [];
    } catch (error) {
      console.error(chalk.red(`DefiLlama Yields API error for ${protocolId}:`), error.message);
      return [];
    }
  }

  /**
   * Get current APR for a specific pool
   * @param {string} poolId Pool identifier in DefiLlama
   * @returns {Promise<number|null>} Current APR as a percentage
   */
  async getPoolApr(poolId) {
    const cacheKey = this.getCacheKey(poolId, 'pool');

    try {
      // Check cache first
      const cachedData = await cacheService.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      // If not in cache, fetch from API
      console.log(chalk.blue(`📡 Fetching pool APR from DefiLlama: ${poolId}`));
      const response = await this.client.get(`${yieldsUrl}/pool/${poolId}`);

      if (response.data && response.data.data && response.data.data.apy) {
        const apr = response.data.data.apy;

        // Store in cache - shorter TTL for APR data
        await cacheService.set(cacheKey, apr, 1800); // 30 minutes
        return apr;
      }

      return null;
    } catch (error) {
      console.error(chalk.red(`DefiLlama Pool APR API error for ${poolId}:`), error.message);
      return null;
    }
  }

  /**
   * Fetch all protocols list from DefiLlama
   * @returns {Promise<Array>} List of protocols
   */
  async getAllProtocols() {
    const cacheKey = this.getCacheKey('all', 'protocols');

    try {
      // Check cache first
      const cachedData = await cacheService.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      // If not in cache, fetch from API
      console.log(chalk.blue(`📡 Fetching all protocols from DefiLlama`));
      const response = await this.client.get(`${baseUrl}/protocols`);

      if (response.data && Array.isArray(response.data)) {
        // Store in cache - longer TTL for list of all protocols
        await cacheService.set(cacheKey, response.data, 86400); // 24 hours
        return response.data;
      }

      return [];
    } catch (error) {
      console.error(chalk.red(`DefiLlama Protocols API error:`), error.message);
      return [];
    }
  }
}

// Create a singleton instance
const defiLlamaService = new DefiLlamaService();

export default defiLlamaService;
