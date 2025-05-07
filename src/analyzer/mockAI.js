/**
 * Mock AI strategy generator for development
 * In production, this would be replaced with a real AI service call
 *
 * @param {Object} strategyInput User input defining strategy requirements
 * @returns {Promise<Object>} Mock strategy analysis results
 */
export async function mockAIStrategy(strategyInput) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Asset-specific strategies based on input asset and risk tolerance
  const strategies = {
    ETH: {
      low: {
        proposedRoute: ["ETH", "stETH"],
        grossAPR: "3.8%",
        netYield: "3.7%",
        gasEstimateEth: "0.0021",
        riskScore: 2.0,
        insight: "Simple staking via Lido provides safe yield with minimal gas costs and no liquidation risk. Current Lido staking APR is stable at ~3.8%. Gas cost is minimal for a single transaction.",
        judgment: "Optimal for low risk"
      },
      medium: {
        proposedRoute: ["ETH", "stETH", "wstETH", "Aave", "borrow USDC", "swap to ETH", "Renzo"],
        grossAPR: "8.2%",
        netYield: "7.1%",
        gasEstimateEth: "0.0051",
        riskScore: 5.5,
        insight: "This strategy uses stETH as collateral on Aave to borrow and restake via Renzo, increasing yield while maintaining a safe 60% LTV. Multiple transactions increase gas costs but overall yield remains strong.",
        judgment: "Proceed with monitoring"
      },
      high: {
        proposedRoute: ["ETH", "stETH", "wstETH", "Aave", "borrow USDC", "swap to ETH", "Renzo", "Aave", "borrow ETH", "Kelp"],
        grossAPR: "16.4%",
        netYield: "11.2%",
        gasEstimateEth: "0.0094",
        riskScore: 8.2,
        insight: "This leveraged restaking strategy loops ETH through Aave twice to amplify yield via both Renzo and Kelp, creating multiple yield streams. Risk is high due to 75% max LTV and ETH price sensitivity. Complex execution requires multiple transactions.",
        judgment: "High Risk - Monitor Closely"
      }
    },
    USDC: {
      low: {
        proposedRoute: ["USDC", "Aave Supply"],
        grossAPR: "4.2%",
        netYield: "4.0%",
        gasEstimateEth: "0.0018",
        riskScore: 2.1,
        insight: "Simple USDC supply to Aave provides stable yield with very low risk. Current supply APR is ~4.2% with minimal gas cost for a single transaction.",
        judgment: "Optimal for low risk"
      },
      medium: {
        proposedRoute: ["USDC", "swap to ETH", "stETH", "Aave", "borrow USDC"],
        grossAPR: "7.2%",
        netYield: "6.1%",
        gasEstimateEth: "0.0062",
        riskScore: 5.8,
        insight: "This strategy converts USDC to ETH for staking, then uses stETH as collateral to borrow back USDC, creating a partial loop. Initial swap has some price impact but overall yield is enhanced.",
        judgment: "Proceed with caution"
      },
      high: {
        proposedRoute: ["USDC", "swap to ETH", "stETH", "Aave", "borrow USDC", "swap to ETH", "Renzo"],
        grossAPR: "12.4%",
        netYield: "9.1%",
        gasEstimateEth: "0.0089",
        riskScore: 7.9,
        insight: "Complex strategy that leverages initial USDC to gain ETH exposure and restaking yield. Multiple swaps introduce slippage risk and higher gas costs, but yield is significantly amplified.",
        judgment: "High Risk - Consider Partial Position"
      }
    }
  };

  // Default to ETH/medium if asset not recognized
  const asset = strategies[strategyInput.inputAsset] ? strategyInput.inputAsset : "ETH";
  const risk = strategies[asset][strategyInput.riskTolerance] ? strategyInput.riskTolerance : "medium";

  // Return the appropriate strategy based on user input
  return strategies[asset][risk];
}
