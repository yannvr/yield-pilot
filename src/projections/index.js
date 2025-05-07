import { getProtocolData } from '../protocols/index.js';

/**
 * Calculate more precise yield projections based on strategy and current data
 *
 * @param {Object} strategy The strategy object from AI
 * @param {Object} userInput The original user input
 * @returns {Promise<Object>} Enhanced strategy with refined calculations
 */
export async function calculateYield(strategy, userInput) {
  // Get latest protocol data
  const protocolData = await getProtocolData();

  // Clone the strategy to avoid modifying the original
  const enhancedStrategy = { ...strategy };

  // Apply time horizon to yield calculations
  if (userInput.timeHorizonDays) {
    const annualMultiplier = userInput.timeHorizonDays / 365;

    // Convert APR percentages to numerical values
    const grossAPRValue = parseFloat(enhancedStrategy.grossAPR.replace('%', '')) / 100;
    const netYieldValue = parseFloat(enhancedStrategy.netYield.replace('%', '')) / 100;

    // Calculate time-adjusted returns
    const timeAdjustedGross = grossAPRValue * annualMultiplier;
    const timeAdjustedNet = netYieldValue * annualMultiplier;

    // Add these as additional fields
    enhancedStrategy.periodGrossReturn = `${(timeAdjustedGross * 100).toFixed(2)}%`;
    enhancedStrategy.periodNetReturn = `${(timeAdjustedNet * 100).toFixed(2)}%`;
    enhancedStrategy.absoluteReturn = `${(timeAdjustedNet * userInput.amount).toFixed(4)} ${userInput.inputAsset}`;
  }

  // Make gas estimate more precise based on current gas prices
  if (protocolData.gas) {
    const txCount = estimateTransactionCount(enhancedStrategy.proposedRoute);
    const avgGasPerTx = 200000; // Average gas per tx as fallback
    const gasPrice = protocolData.gas.current.average; // Gwei

    // Convert to ETH: gas * gasPrice (Gwei) * txCount / 10^9
    const gasEstimate = (avgGasPerTx * gasPrice * txCount) / 1000000000;
    enhancedStrategy.gasEstimateEth = gasEstimate.toFixed(4);

    // Check if gas cost exceeds user limit
    if (gasEstimate > userInput.gasLimitEth) {
      enhancedStrategy.warnings = enhancedStrategy.warnings || [];
      enhancedStrategy.warnings.push(`Gas estimate (${gasEstimate.toFixed(4)} ETH) exceeds your limit of ${userInput.gasLimitEth} ETH`);
    }
  }

  return enhancedStrategy;
}

/**
 * Estimate the number of transactions required for a strategy
 *
 * @param {Array<string>} route The strategy route steps
 * @returns {number} Estimated transaction count
 */
function estimateTransactionCount(route) {
  // Simple heuristic: most steps require a transaction
  // But some steps might be combined or be informational only

  // Count distinct operations that typically require transactions
  const txOperations = [
    'stETH', 'wstETH', 'Aave', 'borrow', 'swap', 'stake', 'supply', 'Renzo', 'Kelp'
  ];

  let txCount = 0;

  for (const step of route) {
    // Check if this step contains a transaction operation
    if (txOperations.some(op => step.includes(op))) {
      txCount++;
    }
  }

  return Math.max(1, txCount); // At least 1 transaction
}
