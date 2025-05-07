import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env file if it exists
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log('Loaded environment from .env file');
  }
} catch (err) {
  console.warn('Warning: Could not load .env file', err.message);
}

// Default configuration with fallbacks
const config = {
  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    username: process.env.REDIS_USERNAME || undefined,
    cacheTtl: parseInt(process.env.REDIS_CACHE_TTL || '3600', 10), // 1 hour default
  },

  // API configuration
  api: {
    defiLlama: {
      baseUrl: process.env.DEFILLAMA_API_URL || 'https://api.llama.fi',
      yieldsUrl: process.env.DEFILLAMA_YIELDS_API_URL || 'https://yields.llama.fi',
      stablecoinsUrl: process.env.DEFILLAMA_STABLECOINS_API_URL || 'https://stablecoins.llama.fi',
    }
  },

  // Cache settings
  cache: {
    protocolPrefix: process.env.PROTOCOL_DATA_CACHE_PREFIX || 'eigen-pilot:protocol:',
    enabled: process.env.PROTOCOL_CACHE_ENABLED !== 'false', // Default to true
  },

  // Protocol configurations
  protocols: {
    lido: {
      addresses: {
        stETH: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
        // Add any additional contract addresses
      },
      defiLlamaId: 'lido',
      cache: {
        ttl: 3600, // 1 hour
      }
    },
    aave: {
      addresses: {
        v3Lending: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2', // Aave V3 lending pool
      },
      defiLlamaId: 'aave-v3',
      cache: {
        ttl: 1800, // 30 minutes
      }
    },
    eigenLayer: {
      defiLlamaId: 'eigenlayer',
      cache: {
        ttl: 3600,
      }
    },
    renzo: {
      defiLlamaId: 'renzo',
      cache: {
        ttl: 3600,
      }
    },
    kelp: {
      defiLlamaId: 'kelp-dao',
      cache: {
        ttl: 3600,
      }
    }
  }
};

export default config;
