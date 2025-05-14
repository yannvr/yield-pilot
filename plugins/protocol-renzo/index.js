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
      rewardTokens {
        id
        name
        symbol
      }
      totalValueLockedUSD
      cumulativeSupplySideRevenueUSD
      cumulativeTotalRevenueUSD
      rewardTokenEmissionsUSD
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

  try {
    console.log("Attempting to fetch Renzo data from The Graph:", endpoint);
    if (!apiKey) {
      console.warn("Missing THEGRAPH_API_KEY in environment variables. The Graph query might fail or be rate-limited.");
    }

    const headers = { 'Content-Type': 'application/json' };
    // It's common for gateways to require the API key in an Authorization header or as part of the URL path.
    // The structure above assumes the key is part of the path if present.
    // If using a specific service query URL, Authorization header might be needed:
    // if (apiKey) { headers['Authorization'] = \`Bearer \${apiKey}\`; }


    const response = await axios.post(endpoint, { query }, { headers });

    if (response.data && response.data.errors) {
      console.error("GraphQL errors:", JSON.stringify(response.data.errors));
      throw new Error(`GraphQL errors: ${response.data.errors[0]?.message || 'Unknown GraphQL error'}`);
    }

    const data = response.data?.data;
    if (!data) {
      console.error("No data in response from The Graph:", JSON.stringify(response.data));
      throw new Error('No data returned from Renzo subgraph');
    }

    let tvl = null;
    let apr = null; // Or APY boost

    // Process Financials Daily Snapshots for TVL and potentially derive APR
    if (data.financialsDailySnapshots && data.financialsDailySnapshots.length > 0) {
      tvl = parseFloat(data.financialsDailySnapshots[0].totalValueLockedUSD);
      // APR calculation can be complex. For now, we'll see if pools data gives a direct APR/reward.
      // If not, we might need to calculate from daily revenues.
    }

    // Process Pools data (might give more specific ezETH APY if available)
    // ezETH is typically the main LST for Renzo.
    const ezEthPool = data.pools?.find(p => p.outputToken?.symbol === 'ezETH' || p.name?.toLowerCase().includes('ezeth'));
    if (ezEthPool) {
        if (!tvl) tvl = parseFloat(ezEthPool.totalValueLockedUSD);
        // Look for reward emissions or other APY indicators.
        // This is highly schema-dependent. The provided schema was high-level.
        // For now, let's assume a placeholder if direct APY isn't obvious.
        console.log("Found ezETH pool:", ezEthPool);
    }


    // Placeholder for APR - DefiLlama is often better for aggregated APYs
    // This will be refined based on actual subgraph response for rewards.

    console.log(`Renzo data from The Graph: TVL: ${tvl}`);
    return {
      tvl: tvl,
      apyBoost: apr, // This might be called 'apr', 'apy', 'rewardRate', etc.
      source: 'thegraph-renzo'
    };

  } catch (error) {
    console.error('Failed to fetch Renzo data from The Graph:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data));
    }

    console.log("Attempting fallback to DefiLlama API for Renzo...");
    try {
      const defillamaResponse = await axios.get('https://yields.llama.fi/pools');
      if (defillamaResponse.data && defillamaResponse.data.data) {
        const pools = defillamaResponse.data.data;
        const renzoPool = pools.find(p =>
          p.project === 'renzoprotocol' &&
          p.chain === 'Ethereum' && // Assuming Ethereum, adjust if Blast or other chains are primary
          p.symbol?.toLowerCase().includes('ezeth') // Common symbol for Renzo's LST
        );

        if (renzoPool) {
          console.log("Successfully fetched Renzo data from DefiLlama API");
          return {
            tvl: renzoPool.tvlUsd || null,
            apyBoost: renzoPool.apyBase || renzoPool.apy || null,
            source: 'defillama-api-fallback'
          };
        } else {
          console.warn("Renzo (ezETH) pool not found on DefiLlama Ethereum.");
        }
      }
    } catch (fallbackError) {
      console.error('Fallback to DefiLlama API for Renzo also failed:', fallbackError.message);
    }

    console.warn("Returning null or empty data for Renzo after all attempts failed.");
    return {
      tvl: null,
      apyBoost: null,
      source: 'no-data'
    };
  }
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
        description: `Stake ${amount} ${asset} with Renzo for ezETH`,
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
        description: \`Approve Renzo to spend your ${amount} ezETH\`,
        contract: '0xREPLACE_WITH_EZETH_TOKEN_ADDRESS', // ezETH token address
        method: "approve",
        params: [renzoRouterAddress, amount], // spender, amount
        gasEstimate: 80000
      },
      {
        type: "transaction",
        description: `Initiate unstake of ${amount} ${asset} from Renzo`,
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
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  (async () => {
    try {
      console.log("--- Testing Renzo Plugin ---");
      const protocolData = await getProtocolData();
      console.log('Fetched Renzo protocol data:', JSON.stringify(protocolData, null, 2));

      const sampleStrategy = { proposedRoute: ["ETH", "Stake with Renzo"] };
      const analysisResult = await analyzeStrategy(sampleStrategy, { renzo: protocolData });
      console.log('\\nAnalysis Result for Renzo strategy:', JSON.stringify(analysisResult, null, 2));

      const steps = getRequiredSteps({ asset: 'ETH', amount: '1', action: 'stake' });
      console.log('\\nRequired steps for staking ETH with Renzo:', JSON.stringify(steps, null, 2));

    } catch (err) {
      console.error('\\nTest failed:', err);
    }
  })();
}
