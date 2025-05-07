/**
 * Generate additional market insights for the strategy
 * In production, this would call a real AI model with market data
 *
 * @param {Object} strategy The strategy object
 * @param {Object} protocolData Current protocol data
 * @returns {Promise<Object>} Strategy with added market insights
 */
export async function generateInsights(strategy, protocolData) {
  // Mock market insights for development
  const mockInsights = {
    ETH: {
      low: "ETH staking rates have been stable around 3.8% for the past quarter. Recent Shanghai upgrade has increased liquidity for stETH, reducing slippage risk. Market volatility is moderate but staking remains safe.",
      medium: "Leveraged staking strategies benefit from current ETH price stability and Aave's overcollateralization. Watch for potential interest rate changes if borrowing utilization increases. The Renzo protocol has shown steady growth in TVL.",
      high: "Double leverage strategies are susceptible to ETH price volatility. Current 30-day historical volatility is 42%, slightly lower than previous quarter. Multiple restaking protocols introduces smart contract risk exposure, but increases diversification."
    },
    USDC: {
      low: "USDC lending rates have increased 0.4% in the past month due to higher borrowing demand. Circle's reserves remain fully backed and transparent. Gas costs for USDC transactions remain low.",
      medium: "Converting USDC to ETH for staking introduces price exposure but captures higher base yields. Current ETH/USD correlation is moderate at 0.62, providing some diversification benefit.",
      high: "Multi-step USDC→ETH→restaking strategies are sensitive to both ETH price action and gas costs. Recent EIP-1559 changes have made gas more predictable but still variable during high network activity."
    }
  };

  // Determine which insight to return based on asset and risk
  const asset = strategy.proposedRoute[0] || "ETH";
  let riskLevel = "medium";

  if (strategy.riskScore <= 3) {
    riskLevel = "low";
  } else if (strategy.riskScore >= 7) {
    riskLevel = "high";
  }

  // Select appropriate insight or fallback to medium risk ETH
  const insightKey = mockInsights[asset] ? asset : "ETH";
  const marketInsight = mockInsights[insightKey][riskLevel] || mockInsights.ETH.medium;

  // Return enhanced strategy with market insight
  return {
    ...strategy,
    marketInsight
  };
}
