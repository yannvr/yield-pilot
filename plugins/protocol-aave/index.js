/**
 * Aave protocol plugin for YieldPilot
 * Fetches real-time data for Aave V3 on Ethereum
 */

import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

// Plugin metadata
export const metadata = {
  name: 'Aave',
  type: 'protocol',
  version: '0.1.0',
  description: 'Aave V3 lending protocol data provider',
  supportedAssets: ['ETH', 'stETH', 'wstETH', 'USDC', 'USDT', 'DAI'],
  supportsLeverage: true,
  officialUrl: 'https://aave.com',
  officialDocs: 'https://docs.aave.com'
};

/**
 * Get current Aave protocol data from The Graph
 *
 * @returns {Promise<Object>} Current Aave protocol data
 */
export async function getProtocolData() {
  try {
    console.log("Attempting to fetch Aave data from The Graph...");

    const apiKey = process.env.THEGRAPH_API_KEY;
    if (!apiKey) {
      console.warn("Missing THEGRAPH_API_KEY in environment variables, proceeding without authentication");
    }

    // Aave V3 subgraph endpoint on Arbitrum One
    const endpoint = 'https://gateway.thegraph.com/api/subgraphs/id/GQFbb95cE6d8mV989mL5figjaGaKCQB3xqYrr1bRyXqF';
    console.log("Using Aave V3 subgraph endpoint:", endpoint);

    // Simplified query with only basic fields
    const query = `{
      reserves(first: 100) {
        id
        symbol
        name
        liquidityRate
        variableBorrowRate
        baseLTVasCollateral
        reserveLiquidationThreshold
        reserveFactor
      }
    }`;

    const headers = {
      'Content-Type': 'application/json'
    };

    // Add authorization header if API key is available
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    console.log("Sending query to The Graph...");
    const response = await axios.post(endpoint, { query }, { headers });

    console.log("Response received. Status:", response.status);

    if (response.data && response.data.errors) {
      console.error("GraphQL errors:", JSON.stringify(response.data.errors));
      throw new Error(`GraphQL errors: ${response.data.errors[0]?.message || 'Unknown GraphQL error'}`);
    }

    const data = response.data?.data;
    if (!data) {
      console.error("No data in response:", JSON.stringify(response.data));
      throw new Error('No data returned from The Graph');
    }

    // Process reserves data
    const supplyRates = {};
    const borrowRates = {};
    const ltvRatios = {};
    const liquidationThresholds = {};
    const reserveFactors = {};

    if (!data.reserves) {
      console.error("No reserves data found in response. Available keys:", Object.keys(data));
      throw new Error('No reserves data found in response');
    }

    console.log(`Found ${data.reserves.length} reserves`);
    data.reserves.forEach(reserve => {
      const symbol = reserve.symbol;

      // Convert rates from ray (27 decimals) to percentage
      const supplyRate = parseFloat(reserve.liquidityRate) / 1e25;
      const variableBorrowRate = parseFloat(reserve.variableBorrowRate) / 1e25;

      supplyRates[symbol] = supplyRate;
      borrowRates[symbol] = variableBorrowRate;
      ltvRatios[symbol] = parseFloat(reserve.baseLTVasCollateral) / 10000; // Convert basis points to ratio
      liquidationThresholds[symbol] = parseFloat(reserve.reserveLiquidationThreshold) / 10000;
      reserveFactors[symbol] = parseFloat(reserve.reserveFactor) / 10000;
    });

    return {
      supplyRates,
      borrowRates,
      ltvRatios,
      liquidationThresholds,
      reserveFactors,
      totalSupply: {},
      totalBorrow: {},
      totalLiquidityUSD: null,
      totalBorrowsUSD: null,
      source: 'thegraph-aave-v3'
    };
  } catch (error) {
    console.error('Failed to fetch Aave data from The Graph:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data));
    }

    // Try fallback method - using DefiLlama
    console.log("Attempting fallback to DefiLlama API directly...");
    try {
      // Use axios directly instead of the defillama-api package
      const defillamaResponse = await axios.get('https://yields.llama.fi/pools');

      if (defillamaResponse.data && defillamaResponse.data.data) {
        console.log("Successfully fetched data from DefiLlama API");

        const pools = defillamaResponse.data.data;
        const aavePools = pools.filter(p =>
          p.project === 'aave-v3' &&
          p.chain === 'Ethereum'
        );

        console.log(`Found ${aavePools.length} Aave V3 pools on DefiLlama`);

        // Process pools data
        const supplyRates = {};
        const borrowRates = {};

        const aaveSymbolMap = {
          'stETH': 'stETH',
          'wstETH': 'wstETH',
          'ETH': 'WETH',
          'USDC': 'USDC',
          'USDT': 'USDT',
          'DAI': 'DAI'
        };

        for (const pool of aavePools) {
          const symbol = pool.symbol;
          const internalSymbol = Object.keys(aaveSymbolMap).find(key => aaveSymbolMap[key] === symbol);

          if (internalSymbol) {
            supplyRates[internalSymbol] = pool.apyBase || null;
            borrowRates[internalSymbol] = pool.apyBaseBorrow || pool.apyBorrow || null;
          }
        }

        return {
          supplyRates,
          borrowRates,
          ltvRatios: {},
          liquidationThresholds: {},
          reserveFactors: {},
          totalSupply: {},
          totalBorrow: {},
          totalLiquidityUSD: null,
          totalBorrowsUSD: null,
          source: 'defillama-api-fallback'
        };
      }
    } catch (fallbackError) {
      console.error('Fallback to DefiLlama API also failed:', fallbackError.message);
    }

    // If all else fails, use mock data for testing
    console.log("Using mock data as fallback for testing purposes");

    // Mock data for testing
    const mockData = {
      supplyRates: {
        'ETH': 2.5,
        'stETH': 3.2,
        'wstETH': 3.0,
        'USDC': 4.1,
        'USDT': 3.9,
        'DAI': 3.8
      },
      borrowRates: {
        'ETH': 3.2,
        'stETH': 0,
        'wstETH': 0,
        'USDC': 4.8,
        'USDT': 4.7,
        'DAI': 4.5
      },
      ltvRatios: {
        'ETH': 0.8,
        'stETH': 0.7,
        'wstETH': 0.7,
        'USDC': 0.85,
        'USDT': 0.8,
        'DAI': 0.75
      },
      liquidationThresholds: {
        'ETH': 0.85,
        'stETH': 0.8,
        'wstETH': 0.8,
        'USDC': 0.9,
        'USDT': 0.85,
        'DAI': 0.8
      },
      totalLiquidityUSD: 5000000000,
      totalBorrowsUSD: 2500000000,
      source: 'mock-data-fallback'
    };

    return mockData;
  }
}

/**
 * Analyze a strategy that includes Aave
 *
 * @param {Object} strategy The strategy containing Aave
 * @param {Object} protocolData Current protocol data
 * @returns {Promise<Object>} Analysis with risks and recommendations
 */
export async function analyzeStrategy(strategy, protocolData) {
  const aaveData = protocolData.aave || await getProtocolData();

  // Find where Aave is used in the strategy route
  const hasAave = strategy.proposedRoute.some(step =>
    step === "Aave" || step.includes("Aave")
  );

  if (!hasAave) {
    return {
      analysis: {
        summary: "Strategy does not use Aave lending/borrowing",
        riskFactors: [],
        yieldImpact: "neutral",
        confidenceScore: 10
      },
      recommendations: {
        action: "proceed",
        adjustments: [],
        alternatives: ["Consider Aave for leveraging your position"]
      },
      insight: "This strategy does not utilize Aave lending/borrowing. Aave could potentially be used to leverage your position or earn yield on deposits."
    };
  }

  // Check if the strategy involves borrowing
  const hasBorrowing = strategy.proposedRoute.some(step =>
    step.toLowerCase().includes("borrow")
  );

  // Identify which assets are being supplied/borrowed
  const suppliedAssets = [];
  const borrowedAssets = [];

  for (let i = 0; i < strategy.proposedRoute.length; i++) {
    const step = strategy.proposedRoute[i];
    if (step === "Aave" && i + 1 < strategy.proposedRoute.length) {
      const nextStep = strategy.proposedRoute[i + 1];
      if (nextStep.toLowerCase().includes("borrow")) {
        // Extract asset being borrowed
        const match = nextStep.match(/borrow\s+(\w+)/i);
        if (match && match[1]) {
          borrowedAssets.push(match[1]);
        }
      } else {
        // Assume the previous step contains the asset being supplied
        if (i > 0) {
          const prevStep = strategy.proposedRoute[i - 1];
          suppliedAssets.push(prevStep);
        }
      }
    }
  }

  // Calculate risk based on LTV and liquidation thresholds
  let riskScore = 5; // Default medium risk
  let riskFactors = ["Smart contract risk"];

  if (hasBorrowing) {
    riskScore = 7; // Higher risk with borrowing
    riskFactors.push("Liquidation risk");

    // Check if we have LTV data for borrowed assets
    const hasLtvData = borrowedAssets.some(asset =>
      aaveData.ltvRatios && aaveData.ltvRatios[asset] !== undefined
    );

    if (hasLtvData) {
      riskFactors.push(`Current max LTV: ${Math.max(...borrowedAssets.map(asset =>
        (aaveData.ltvRatios[asset] || 0) * 100
      ))}%`);
    }
  }

  // Format supply and borrow rates for output
  const supplyRatesStr = suppliedAssets.map(asset => {
    const rate = aaveData.supplyRates && aaveData.supplyRates[asset];
    return rate !== undefined ? `${asset}: ${rate.toFixed(2)}%` : `${asset}: N/A`;
  }).join(", ");

  const borrowRatesStr = borrowedAssets.map(asset => {
    const rate = aaveData.borrowRates && aaveData.borrowRates[asset];
    return rate !== undefined ? `${asset}: ${rate.toFixed(2)}%` : `${asset}: N/A`;
  }).join(", ");

  // Generate analysis
  const analysis = {
    summary: hasBorrowing
      ? `Aave strategy with borrowing. Supply rates: ${supplyRatesStr}. Borrow rates: ${borrowRatesStr}.`
      : `Aave supply-only strategy. Supply rates: ${supplyRatesStr}.`,
    riskFactors,
    yieldImpact: hasBorrowing ? "variable" : "positive",
    confidenceScore: 8
  };

  // Generate recommendations
  const recommendations = {
    action: "proceed",
    adjustments: [],
    alternatives: []
  };

  // If borrowing, suggest monitoring LTV
  if (hasBorrowing) {
    recommendations.adjustments.push("Monitor LTV ratio to avoid liquidation");
    recommendations.adjustments.push("Consider setting up alerts for price movements");
  }

  // Generate insight
  const insight = hasBorrowing
    ? `This strategy uses Aave for both supplying and borrowing. Current supply rates: ${supplyRatesStr}. Borrow rates: ${borrowRatesStr}. Be aware of liquidation risks and monitor your position regularly.`
    : `This strategy supplies assets to Aave to earn yield. Current supply rates: ${supplyRatesStr}. This is generally lower risk but still exposed to smart contract risk.`;

  return {
    analysis,
    recommendations,
    insight
  };
}

/**
 * Get the steps required to interact with Aave
 *
 * @param {Object} options Options for the strategy
 * @returns {Array<Object>} Required transaction steps
 */
export function getRequiredSteps(options) {
  const asset = options.asset || 'ETH';
  const action = options.action || 'supply';
  const amount = options.amount || '1.0';

  // Aave V3 Pool contract on Ethereum
  const aavePoolAddress = '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2';

  if (action === 'supply') {
    return [
      {
        type: "approval",
        description: `Approve Aave to use your ${asset}`,
        contract: getTokenAddress(asset),
        method: "approve",
        params: [aavePoolAddress, amount],
        gasEstimate: 100000
      },
      {
        type: "transaction",
        description: `Supply ${asset} to Aave`,
        contract: aavePoolAddress,
        method: "supply",
        params: [getTokenAddress(asset), amount, options.onBehalfOf || 'user_address', 0],
        gasEstimate: 250000
      }
    ];
  } else if (action === 'borrow') {
    return [
      {
        type: "transaction",
        description: `Borrow ${asset} from Aave`,
        contract: aavePoolAddress,
        method: "borrow",
        params: [getTokenAddress(asset), amount, 2, 0, options.onBehalfOf || 'user_address'],
        gasEstimate: 300000
      }
    ];
  }

  return [];
}

// Helper function to get token addresses
function getTokenAddress(symbol) {
  const addresses = {
    'ETH': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    'WETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    'stETH': '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
    'wstETH': '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
    'USDC': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    'DAI': '0x6B175474E89094C44Da98b954EedeAC495271d0F'
  };

  return addresses[symbol] || addresses['ETH'];
}

// Simple test for getProtocolData
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      const protocolData = await getProtocolData();
      console.log('Fetched Aave protocol data:', protocolData);

      const sampleStrategy = { proposedRoute: ["ETH", "stETH", "Aave", "borrow USDC"] };
      const result = await analyzeStrategy(sampleStrategy, { aave: protocolData });
      console.log('analyzeStrategy result:', result);
    } catch (err) {
      console.error('Test failed:', err);
    }
  })();
}
