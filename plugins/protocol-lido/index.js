/**
 * Lido protocol plugin for YieldPilot
 * This plugin provides data and analysis for the Lido liquid staking protocol
 */

import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

// Protocol metadata
export const metadata = {
  name: 'Lido',
  type: 'protocol',
  version: '0.1.0',
  description: 'Lido liquid staking protocol (ETH → stETH)',
  supportedAssets: ['ETH'],
  supportsLeverage: false,
  officialUrl: 'https://lido.fi',
  officialDocs: 'https://docs.lido.fi'
};

/**
 * Get current Lido protocol data from The Graph
 *
 * @returns {Promise<Object>} Current Lido protocol data
 */
export async function getProtocolData() {
  const apiKey = process.env.THEGRAPH_API_KEY;
  if (!apiKey) {
    throw new Error('Missing THEGRAPH_API_KEY in environment variables');
  }
  const endpoint = 'https://gateway.thegraph.com/api/subgraphs/id/Sxx812XgeKyzQPaBpR5YZWmGV5fZuBaPdh7DFhzSwiQ';
  const query = `{
    totalRewards(first: 1, orderBy: block, orderDirection: desc) {
      apr
      totalRewards
      totalRewardsWithFees
    }
    lidoSubmissions(first: 1, orderBy: block, orderDirection: desc) {
      amount
      block
    }
  }`;
  try {
    const response = await axios.post(endpoint, { query }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    const data = response.data.data;
    const apr = data.totalRewards?.[0]?.apr || null;
    const totalRewards = data.totalRewards?.[0]?.totalRewards || null;
    const totalStaked = data.lidoSubmissions?.[0]?.amount || null;
    return {
      apr,
      totalRewards,
      totalStaked,
      source: 'thegraph-decentralized'
    };
  } catch (error) {
    console.error('Failed to fetch Lido data from The Graph:', error.message);
    throw error;
  }
}

/**
 * Analyze a strategy that includes Lido
 *
 * @param {Object} strategy The strategy containing Lido
 * @param {Object} protocolData Current protocol data
 * @returns {Promise<Object>} Analysis with risks and recommendations
 */
export async function analyzeStrategy(strategy, protocolData) {
  const lidoData = protocolData.lido || await getProtocolData();

  // Find where Lido is used in the strategy route
  const hasLido = strategy.proposedRoute.some(step =>
    step === "stETH" || step.includes("stETH")
  );

  if (!hasLido) {
    return {
      analysis: {
        summary: "Strategy does not use Lido staking",
        riskFactors: [],
        yieldImpact: "neutral",
        confidenceScore: 10
      },
      recommendations: {
        action: "proceed",
        adjustments: [],
        alternatives: ["Consider Lido staking for base ETH yield"]
      },
      insight: "This strategy does not utilize Lido staking. For ETH strategies, Lido provides a safe base yield with minimal gas costs and no liquidation risk."
    };
  }

  // Use real data fields
  const apr = lidoData.apr ? Number(lidoData.apr).toFixed(2) : 'N/A';
  const totalStaked = lidoData.totalStaked ? lidoData.totalStaked : 'N/A';

  const analysis = {
    summary: `Lido currently offers an APR of ${apr}% with a total of ${totalStaked} ETH staked.`,
    riskFactors: [
      "Smart contract risk (limited)",
      "Validator slashing risk (limited by distribution)"
    ],
    yieldImpact: "positive",
    confidenceScore: 9
  };

  const recommendations = {
    action: "proceed",
    adjustments: [],
    alternatives: []
  };

  const insight = `Lido staking provides a consistent APR (currently ${apr}%) with minimal gas costs. Lido has the highest TVL among liquid staking protocols and distributes validator risk across many operators. Total staked: ${totalStaked} ETH.`;

  return {
    analysis,
    recommendations,
    insight
  };
}

/**
 * Get the steps required to interact with Lido
 *
 * @param {Object} options Options for the strategy
 * @returns {Array<Object>} Required transaction steps
 */
export function getRequiredSteps(options) {
  // Define the transaction steps for interacting with Lido
  return [
    {
      type: "transaction",
      description: "Stake ETH in Lido to receive stETH",
      contract: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
      method: "submit",
      params: [],
      gasEstimate: 180000
    }
  ];
}

// Simple test for getProtocolData and analyzeStrategy
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      const protocolData = await getProtocolData();
      console.log('Fetched protocol data:', protocolData);
      const sampleStrategy = { proposedRoute: ["ETH", "stETH"] };
      const result = await analyzeStrategy(sampleStrategy, { lido: protocolData });
      console.log('analyzeStrategy result:', result);
    } catch (err) {
      console.error('Test failed:', err);
    }
  })();
}
