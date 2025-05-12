/**
 * Lido protocol plugin for YieldPilot
 * This plugin provides data and analysis for the Lido liquid staking protocol
 */

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
 * Get current Lido protocol data
 * In production, this would fetch real-time data from APIs/subgraphs
 *
 * @returns {Promise<Object>} Current Lido protocol data
 */
export async function getProtocolData() {
  // Mock data for development
  // In production, this would call APIs or subgraphs
  return {
    stETHAPR: 3.8,
    totalStaked: "13.2B",
    fee: 0.1,
    validatorCount: 278000,
    stethEthRatio: 0.9987,
    premium: -0.13,
    recentEvents: [
      {
        type: "rewards_distributed",
        date: "2023-05-01",
        amount: "1240 ETH"
      }
    ],
    metrics: {
      tvl: {
        value: "13.2B",
        change7d: 0.5,
        change30d: 2.3
      },
      apr: {
        current: 3.8,
        avg7d: 3.75,
        avg30d: 3.82
      }
    }
  };
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
        alternatives: ["Consider Lido staking for base ETH yield of ~3.8%"]
      },
      insight: "This strategy does not utilize Lido staking. For ETH strategies, Lido provides a safe base yield with minimal gas costs and no liquidation risk."
    };
  }

  // Basic analysis for strategies using Lido
  const isPremiumNegative = (lidoData.premium < 0);

  const analysis = {
    summary: `Lido currently offers ${lidoData.stETHAPR}% APR with ${isPremiumNegative ? 'a small discount' : 'no discount'} to ETH`,
    riskFactors: [
      "Smart contract risk (limited)",
      "Validator slashing risk (limited by distribution)",
      isPremiumNegative ? "stETH currently trading at a slight discount" : "No stETH/ETH peg issues"
    ],
    yieldImpact: "positive",
    confidenceScore: 9
  };

  // Recommendations based on APR and premium
  const recommendations = {
    action: "proceed",
    adjustments: [],
    alternatives: []
  };

  // Add context-specific recommendations
  if (isPremiumNegative && Math.abs(lidoData.premium) > 0.5) {
    recommendations.action = "caution";
    recommendations.adjustments.push("Consider waiting for stETH discount to reduce");
    analysis.riskFactors.push("Higher than normal stETH discount");
  }

  // Context-aware insight
  const insight = `Lido staking provides a consistent ${lidoData.stETHAPR}% APR with minimal gas costs. ${
    isPremiumNegative
    ? `The current ${Math.abs(lidoData.premium).toFixed(2)}% discount on stETH represents a buying opportunity but may indicate market concerns.`
    : `stETH is trading near parity with ETH indicating strong market confidence.`
  } Lido has the highest TVL among liquid staking protocols at ${lidoData.tvl} and distributes validator risk across many operators.`;

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
