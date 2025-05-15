/**
 * Renzo protocol plugin for YieldPilot
 * Renzo Protocol - Liquid Restaking
 */

import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

// Plugin metadata
export const metadata = {
  name: 'Renzo',
  type: 'protocol',
  version: '0.1.0',
  description: 'Renzo Protocol - Liquid Restaking on EigenLayer',
  supportedAssets: ['ezETH', 'ETH'], // Primarily ezETH, but takes ETH for restaking
  supportsLeverage: false, // Typically not direct leverage, but part of leveraged strategies
  officialUrl: 'https://www.renzoprotocol.com/',
  officialDocs: 'https://docs.renzoprotocol.com/'
};

/**
 * Get current Renzo protocol data from The Graph or DefiLlama
 *
 * @returns {Promise<Object>} Current Renzo protocol data
 */
export async function getProtocolData() {
  console.log("Attempting to fetch Renzo data...");
  const apiKey = process.env.THEGRAPH_API_KEY;
  const subgraphId = "HXWd4suSQ4TztRznBCi1dWdBKrHvkDPZBA2hy5nng1eL"; // For Renzo Blast as per user
  // Note: The provided link is for Arbitrum, but the page content says "blast-mainnet".
  // The Subgraph ID seems more reliable.
  // The Graph's gateway is usually preferred over direct service query URLs.
  const endpoint = `https://gateway.thegraph.com/api/${apiKey ? apiKey + '/' : ''}subgraphs/id/${subgraphId}`;

  // GraphQL query - adjust based on actual schema exploration for APY/TVL
  // Starting with querying pools and financialsDailySnapshots
  const query = `{
    pools(first: 5, orderBy: totalValueLockedUSD, orderDirection: desc) {
      id
      name
      inputTokens {
        id
        name
        symbol
      }
      outputToken {
        id
        name
        symbol
      }
      totalValueLockedUSD
      cumulativeSupplySideRevenueUSD
      cumulativeTotalRevenueUSD
    }
    financialsDailySnapshots(first: 7, orderBy: timestamp, orderDirection: desc) {
      id
      timestamp
      totalValueLockedUSD
      dailySupplySideRevenueUSD
      dailyTotalRevenueUSD
      cumulativeSupplySideRevenueUSD
      cumulativeTotalRevenueUSD
    }
  }`;

  let tvl = null;
  let apr = null; // Or APY boost
  let source = 'no-data'; // Default source

  // Try The Graph first
  try {
    console.log("Attempting to fetch Renzo data from The Graph:", endpoint);
    if (!apiKey) {
      console.warn("Missing THEGRAPH_API_KEY in environment variables. The Graph query might fail or be rate-limited.");
    }
    const headers = { 'Content-Type': 'application/json' };
    const response = await axios.post(endpoint, { query }, { headers });

    if (response.data && response.data.errors) {
      console.error("GraphQL errors:", JSON.stringify(response.data.errors));
      throw new Error(`GraphQL errors: ${response.data.errors[0]?.message || 'Unknown GraphQL error'}`);
    }
    const graphData = response.data?.data;
    if (!graphData) {
      console.error("No data in response from The Graph:", JSON.stringify(response.data));
      throw new Error('No data returned from Renzo subgraph');
    }

    // Process Financials Daily Snapshots for TVL
    if (graphData.financialsDailySnapshots && graphData.financialsDailySnapshots.length > 0) {
      tvl = parseFloat(graphData.financialsDailySnapshots[0].totalValueLockedUSD);
    }
    // Process Pools data for TVL if not found above, or to refine
    const ezEthPool = graphData.pools?.find(p => p.outputToken?.symbol === 'ezETH' || p.name?.toLowerCase().includes('ezeth'));
    if (ezEthPool) {
      if (!tvl) tvl = parseFloat(ezEthPool.totalValueLockedUSD);
      console.log("Found ezETH pool from The Graph:", ezEthPool);
      // Future: attempt to derive APR from pool revenues if possible
    }
    if (tvl !== null) {
      source = 'thegraph-renzo';
      console.log(`Renzo TVL from The Graph: ${tvl}`);
    }
  } catch (graphError) {
    console.error('Failed to fetch Renzo data from The Graph:', graphError.message);
    if (graphError.response) {
      console.error('Response status:', graphError.response.status);
      console.error('Response data:', JSON.stringify(graphError.response.data));
    }
    // If The Graph fails, tvl and apr remain null, source remains 'no-data' or previous value
  }

  // If APR is still null (not found via The Graph, or Graph call failed), try DefiLlama
  if (apr === null) {
    console.log("Attempting to fetch Renzo APY from DefiLlama API...");
    try {
      const defillamaResponse = await axios.get('https://yields.llama.fi/pools');
      if (defillamaResponse.data && defillamaResponse.data.data) {
        const pools = defillamaResponse.data.data;
        const renzoPoolLlama = pools.find(p =>
          p.project === 'renzoprotocol' &&
          (p.chain === 'Ethereum' || p.chain === 'Blast') &&
          p.symbol?.toLowerCase().includes('ezeth')
        );

        if (renzoPoolLlama) {
          apr = renzoPoolLlama.apyBase || renzoPoolLlama.apy || null;
          if (apr !== null) {
            console.log(`Successfully fetched Renzo APY from DefiLlama API: ${apr}`);
            // If TVL also came from DefiLlama (e.g. graph failed completely) or is missing,
            // update it and the source.
            if (tvl === null && renzoPoolLlama.tvlUsd) {
              tvl = renzoPoolLlama.tvlUsd;
              source = 'defillama-api-fallback';
            } else if (source === 'thegraph-renzo' && apr !== null) {
              source = 'thegraph-tvl-defillama-apy'; // Hybrid source
            } else if (tvl !== null && apr !== null) {
               // If TVL was already from graph, and APY is from DefiLlama, it's hybrid
            } else {
              source = 'defillama-api-fallback'; // Default to DefiLlama if it provided something
            }
          } else {
               console.warn("Renzo APY not found in DefiLlama pool data.");
          }
        } else {
          console.warn("Renzo (ezETH) pool not found on DefiLlama (Ethereum or Blast).");
        }
      }
    } catch (fallbackError) {
      console.error('Fallback to DefiLlama API for Renzo APY also failed:', fallbackError.message);
    }
  }

  if (tvl === null && apr === null) {
      console.warn("Returning null or empty data for Renzo after all attempts failed.");
  }

  return {
    tvl: tvl,
    apyBoost: apr,
    source: tvl === null && apr === null ? 'no-data' : source
  };
}

/**
 * Analyze a strategy that includes Renzo
 *
 * @param {Object} strategy The strategy to analyze
 * @param {Object} protocolData Current protocol data including Renzo's
 * @returns {Promise<Object>} Analysis with risks and recommendations
 */
export async function analyzeStrategy(strategy, protocolData) {
  const renzoData = protocolData.renzo || (await getProtocolData()); // Fetch if not provided

  const usesRenzo = strategy.proposedRoute.some(step =>
    typeof step === 'string' && step.toLowerCase().includes('renzo')
  );

  if (!usesRenzo) {
    return {
      analysis: { summary: "Strategy does not use Renzo.", riskFactors: [], yieldImpact: "neutral", confidenceScore: 10 },
      recommendations: { action: "proceed", adjustments: [], alternatives: ["Consider Renzo for ETH liquid restaking."] },
      insight: "This strategy does not involve Renzo for liquid restaking."
    };
  }

  let insight = "Renzo is used for liquid restaking ETH via EigenLayer.";
  if (renzoData.apyBoost) {
    insight += ` Current estimated APY boost from Renzo: ${renzoData.apyBoost.toFixed(2)}%.`;
  } else {
    insight += " APY data for Renzo is currently unavailable.";
  }
  if (renzoData.tvl) {
    insight += ` Renzo TVL: $${(renzoData.tvl / 1e6).toFixed(2)}M.`;
  }

  return {
    analysis: {
      summary: "Strategy incorporates Renzo for liquid restaking.",
      riskFactors: ["Smart contract risk (Renzo & EigenLayer)", "ezETH de-pegging risk", "EigenLayer slashing risk"],
      yieldImpact: renzoData.apyBoost ? "positive" : "unknown",
      confidenceScore: renzoData.apyBoost ? 7 : 5
    },
    recommendations: {
      action: "proceed_with_caution",
      adjustments: ["Understand EigenLayer restaking mechanics and risks.", "Monitor ezETH liquidity and peg."],
      alternatives: []
    },
    insight
  };
}

/**
 * Get the steps required to interact with Renzo
 * (e.g., deposit ETH to get ezETH)
 *
 * @param {Object} options Options for the strategy (asset, amount, action)
 * @returns {Array<Object>} Required transaction steps
 */
export function getRequiredSteps(options) {
  const { asset = 'ETH', amount = '1.0', action = 'stake' } = options;

  // Placeholder - actual contract addresses and methods depend on Renzo's deployment
  const renzoRouterAddress = '0xREPLACE_WITH_RENZO_ROUTER_ADDRESS'; // Example

  if (action === 'stake' && asset === 'ETH') {
    return [
      {
        type: "transaction",
        description: 'Stake ' + amount + ' ' + asset + ' with Renzo for ezETH',
        contract: renzoRouterAddress,
        method: "depositETH", // This is a guess, check Renzo docs for actual method
        params: [], // May need recipient address or other params
        value: amount, // Sending ETH
        gasEstimate: 200000 // Rough estimate
      }
    ];
  } else if (action === 'unstake' && asset === 'ezETH') {
    // Unstaking from Renzo can be more complex (e.g., involving a withdrawal queue)
    return [
       {
        type: "approval", // If ezETH is an ERC20, approval might be needed
        description: 'Approve Renzo to spend your ' + amount + ' ' + asset,
        contract: '0xREPLACE_WITH_EZETH_TOKEN_ADDRESS', // ezETH token address
        method: "approve",
        params: [renzoRouterAddress, amount], // spender, amount
        gasEstimate: 80000
      },
      {
        type: "transaction",
        description: 'Initiate unstake of ' + amount + ' ' + asset + ' from Renzo',
        contract: renzoRouterAddress,
        method: "withdrawETH", // Guess, check docs
        params: [amount], // Amount of ezETH to unstake
        gasEstimate: 250000
      }
    ];
  }
  return [];
}

// Simple test for getProtocolData
const path = await import('path');
const url = await import('url');
const currentFilePath = url.fileURLToPath(import.meta.url);
const scriptPath = path.resolve(process.argv[1]);

if (currentFilePath === scriptPath) {
  (async () => {
    try {
      console.log("--- Testing Renzo Plugin ---");
      const protocolData = await getProtocolData();
      console.log('Fetched Renzo protocol data:', JSON.stringify(protocolData, null, 2));

      console.log("\n--- Testing analyzeStrategy with various scenarios ---");

      const strategiesToTest = [
        {
          name: "Direct ETH Restaking via Renzo",
          strategy: { proposedRoute: ["ETH", "Stake ETH with Renzo for ezETH"] }
        },
        {
          name: "Leveraged Staking Loop involving Renzo",
          strategy: { proposedRoute: ["Stake ETH with Lido for stETH", "Deposit stETH to Aave", "Borrow ETH from Aave against stETH", "Restake borrowed ETH with Renzo for ezETH"] }
        },
        {
          name: "Simple Lido Staking (No Renzo)",
          strategy: { proposedRoute: ["Stake ETH with Lido for stETH"] }
        },
        {
          name: "Strategy mentioning Renzo but as part of a broader context",
          strategy: { proposedRoute: ["Swap USDC to ETH", "Research Renzo protocol", "Decide on staking options"] }
        }
      ];

      for (const { name, strategy } of strategiesToTest) {
        console.log(`\n--- Analyzing Strategy: ${name} ---`);
        const analysisResult = await analyzeStrategy(strategy, { renzo: protocolData });
        console.log('Analysis Result:', JSON.stringify(analysisResult, null, 2));
      }

      console.log("\n--- Testing getRequiredSteps ---");
      const steps = getRequiredSteps({ asset: 'ETH', amount: '1', action: 'stake' });
      console.log('\nRequired steps for staking ETH with Renzo:', JSON.stringify(steps, null, 2));

      const unstakeSteps = getRequiredSteps({ asset: 'ezETH', amount: '10', action: 'unstake' });
      console.log('\nRequired steps for unstaking ezETH from Renzo:', JSON.stringify(unstakeSteps, null, 2));


    } catch (err) {
      console.error('\nTest failed:', err.message);
      if (err.stack) {
        console.error(err.stack);
      }
    }
  })();
}
