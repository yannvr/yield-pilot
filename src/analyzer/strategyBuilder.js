/**
 * Data-driven strategy generator for YieldPilot
 * Uses real protocol data to build DeFi strategy recommendations
 *
 * @param {Object} strategyInput User input defining strategy requirements
 * @param {Object} protocolData Real-time protocol data from src/protocols/index.js
 * @returns {Promise<Object>} Strategy analysis results based on actual data
 */
export async function strategyBuilder(strategyInput, protocolData) {
  // Simulate slight processing delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Default strategy parameters
  const asset = strategyInput.inputAsset || 'ETH';
  const riskTolerance = strategyInput.riskTolerance || 'medium';
  const amount = strategyInput.amount || 1.0;

  // Initialize strategy output
  let proposedRoute = [];
  let grossAPR = 0;
  let netYield = 0;
  let gasEstimateEth = 0;
  let riskScore = 0;
  let insight = '';
  let judgment = '';

  // Access real data from protocolData
  const gasData = protocolData.gas || { current: { average: 0 }, estimation: { stake: 0, swap: 0, supply: 0, borrow: 0 } };
  const lidoData = protocolData.lido || { stETHAPR: 0, fee: 0 };
  const aaveData = protocolData.aave || { supplyRates: {}, borrowRates: {} };
  const renzoData = protocolData.renzo || { apyBoost: 0, fee: 0 };
  const kelpData = protocolData.kelp || { apyBoost: 0, fee: 0 };
  const yearnData = protocolData.yearn || { vaultAPYs: {} };

  // Helper to calculate gas cost based on number of transactions
  const calculateGasEstimate = (numTransactions) => {
    const avgGasPerTx = gasData.estimation.stake || 0.002;
    return (numTransactions * avgGasPerTx).toFixed(4);
  };

  // Build strategy based on asset and risk tolerance using real data
  // console.log('Protocol Data for Route Building:', JSON.stringify(protocolData, null, 2));
  if (asset === 'ETH') {
    if (riskTolerance === 'low') {
      proposedRoute = buildLowRiskETHRoute(protocolData);
      grossAPR = lidoData.stETHAPR || 0;
      netYield = grossAPR - (lidoData.fee * grossAPR) || 0;
      gasEstimateEth = calculateGasEstimate(1);
      riskScore = 2.0;
      insight = `Simple staking via Lido offers a current APR of ${grossAPR.toFixed(1)}%. Minimal gas cost for a single transaction and no liquidation risk make this a safe choice.`;
      judgment = 'Optimal for low risk';
    } else if (riskTolerance === 'medium') {
      proposedRoute = buildMediumRiskETHRoute(protocolData);
      const baseAPR = lidoData.stETHAPR || 0;
      const boostAPR = renzoData.apyBoost || 0;
      const borrowRate = aaveData.borrowRates['USDC'] || 0;
      grossAPR = baseAPR + boostAPR + (baseAPR * 0.5); // Assume 50% leverage on base APR
      netYield = grossAPR - (lidoData.fee * baseAPR) - (renzoData.fee * boostAPR) - borrowRate;
      gasEstimateEth = calculateGasEstimate(proposedRoute.length - 1);
      riskScore = 5.5;
      insight = buildInsightForRoute(proposedRoute, baseAPR, boostAPR, borrowRate, gasEstimateEth);
      judgment = 'Proceed with monitoring';
    } else if (riskTolerance === 'high') {
      proposedRoute = buildHighRiskETHRoute(protocolData);
      const baseAPR = lidoData.stETHAPR || 0;
      const renzoBoost = renzoData.apyBoost || 0;
      const kelpBoost = kelpData.apyBoost || 0;
      const borrowRateUSDC = aaveData.borrowRates['USDC'] || 0;
      const borrowRateETH = aaveData.borrowRates['ETH'] || 0;
      grossAPR = baseAPR + renzoBoost + kelpBoost + (baseAPR * 0.8); // Assume higher leverage
      netYield = grossAPR - (lidoData.fee * baseAPR) - (renzoData.fee * renzoBoost) - (kelpData.fee * kelpBoost) - borrowRateUSDC - borrowRateETH;
      gasEstimateEth = calculateGasEstimate(proposedRoute.length - 1);
      riskScore = 8.2;
      insight = buildInsightForHighRiskRoute(proposedRoute, baseAPR, renzoBoost, kelpBoost, borrowRateUSDC, borrowRateETH, gasEstimateEth);
      judgment = 'High Risk - Monitor Closely';
    }
  } else if (asset === 'USDC') {
    if (riskTolerance === 'low') {
      proposedRoute = buildLowRiskUSDCRoute(protocolData);
      grossAPR = aaveData.supplyRates['USDC'] || 0;
      netYield = grossAPR * 0.95; // Assume small fee or cost
      gasEstimateEth = calculateGasEstimate(1);
      riskScore = 2.1;
      insight = `Simple USDC supply to Aave provides a stable yield with current APR of ${grossAPR.toFixed(1)}%. Very low risk and minimal gas cost of ${gasEstimateEth} ETH for a single transaction.`;
      judgment = 'Optimal for low risk';
    } else if (riskTolerance === 'medium') {
      proposedRoute = buildMediumRiskUSDCRoute(protocolData);
      const supplyRate = aaveData.supplyRates['stETH'] || 0;
      const borrowRate = aaveData.borrowRates['USDC'] || 0;
      const baseAPR = lidoData.stETHAPR || 0;
      grossAPR = baseAPR + supplyRate;
      netYield = grossAPR - borrowRate - (lidoData.fee * baseAPR);
      gasEstimateEth = calculateGasEstimate(proposedRoute.length - 1);
      riskScore = 5.8;
      insight = buildInsightForUSDCMediumRisk(proposedRoute, baseAPR, borrowRate, gasEstimateEth);
      judgment = 'Proceed with caution';
    } else if (riskTolerance === 'high') {
      proposedRoute = buildHighRiskUSDCRoute(protocolData);
      const baseAPR = lidoData.stETHAPR || 0;
      const boostAPR = renzoData.apyBoost || 0;
      const borrowRate = aaveData.borrowRates['USDC'] || 0;
      grossAPR = baseAPR + boostAPR + (baseAPR * 0.4);
      netYield = grossAPR - (lidoData.fee * baseAPR) - (renzoData.fee * boostAPR) - borrowRate;
      gasEstimateEth = calculateGasEstimate(proposedRoute.length - 1);
      riskScore = 7.9;
      insight = buildInsightForUSDCHighRisk(proposedRoute, baseAPR, boostAPR, borrowRate, gasEstimateEth);
      judgment = 'High Risk - Consider Partial Position';
    }
  } else {
    // Default fallback for unrecognized assets
    proposedRoute = buildDefaultRoute(protocolData);
    grossAPR = lidoData.stETHAPR || 0;
    netYield = grossAPR - (lidoData.fee * grossAPR) || 0;
    gasEstimateEth = calculateGasEstimate(1);
    riskScore = 2.0;
    insight = `Default to simple ETH staking via Lido with current APR of ${grossAPR.toFixed(1)}%. Minimal gas cost and no liquidation risk.`;
    judgment = 'Optimal for low risk';
  }

  // Adjust gas estimate based on actual ETH amount (larger amounts may not scale linearly but this is a simple model)
  gasEstimateEth = (parseFloat(gasEstimateEth) * (amount / 2.0)).toFixed(4);

  // Format percentages for output
  grossAPR = grossAPR.toFixed(1) + '%';
  netYield = netYield.toFixed(1) + '%';

  // Return the data-driven strategy
  console.log('Final Proposed Route:', proposedRoute);
  return {
    proposedRoute,
    grossAPR,
    netYield,
    gasEstimateEth,
    riskScore,
    insight,
    judgment,
    dataSources: {
      lidoAPR: lidoData.stETHAPR !== 0 ? 'Real Data' : 'No Data Available',
      aaveSupplyRates: Object.keys(aaveData.supplyRates).length > 0 && aaveData.supplyRates['stETH'] !== undefined ? 'Real Data' : 'No Data Available',
      aaveBorrowRates: Object.keys(aaveData.borrowRates).length > 0 && aaveData.borrowRates['USDC'] !== undefined ? 'Real Data' : 'No Data Available',
      renzoBoost: renzoData.apyBoost !== 0 ? 'Real Data' : 'No Data Available',
      kelpBoost: kelpData.apyBoost !== 0 ? 'Real Data' : 'No Data Available',
      gasEstimate: gasData.current.average !== 0 ? 'Real Data' : 'No Data Available'
    },
    warning: 'Warning: Some values may be zero due to unavailable API data. Check data sources for details.'
  };
}

// Helper functions to dynamically build routes based on protocol data
function buildLowRiskETHRoute(protocolData) {
  const lidoData = protocolData.lido || { stETHAPR: 0 };
  return (lidoData.stETHAPR || 3.8) > 0 ? ['ETH', 'stETH'] : ['ETH', 'Hold'];
}

function buildMediumRiskETHRoute(protocolData) {
  const lidoData = protocolData.lido || { stETHAPR: 0 };
  const aaveData = protocolData.aave || { supplyRates: {}, borrowRates: {} };
  const renzoData = protocolData.renzo || { apyBoost: 0 };
  let route = [];
  if ((lidoData.stETHAPR || 3.8) > 0) {
    route.push('ETH', 'stETH', 'wstETH');
    if (aaveData.supplyRates['stETH'] > 0) {
      route.push('Aave');
      if (aaveData.borrowRates['USDC'] < 3) {
        route.push('borrow USDC', 'swap to ETH');
        if (renzoData.apyBoost > 1) {
          route.push('Renzo');
        }
      }
    }
  }
  return route.length > 1 ? route : ['ETH', 'stETH'];
}

function buildHighRiskETHRoute(protocolData) {
  const lidoData = protocolData.lido || { stETHAPR: 0 };
  const aaveData = protocolData.aave || { supplyRates: {}, borrowRates: {} };
  const renzoData = protocolData.renzo || { apyBoost: 0 };
  const kelpData = protocolData.kelp || { apyBoost: 0 };
  let route = [];
  if ((lidoData.stETHAPR || 3.8) > 0) {
    route.push('ETH', 'stETH', 'wstETH');
    if (aaveData.supplyRates['stETH'] > 0) {
      route.push('Aave');
      if (aaveData.borrowRates['USDC'] < 3.5) {
        route.push('borrow USDC', 'swap to ETH');
        if (renzoData.apyBoost > 1) {
          route.push('Renzo');
          if (aaveData.borrowRates['ETH'] < 4) {
            route.push('Aave', 'borrow ETH');
            if (kelpData.apyBoost > 1) {
              route.push('Kelp');
            }
          }
        }
      }
    }
  }
  return route.length > 2 ? route : buildMediumRiskETHRoute(protocolData);
}

function buildLowRiskUSDCRoute(protocolData) {
  const aaveData = protocolData.aave || { supplyRates: {} };
  return aaveData.supplyRates['USDC'] > 0 ? ['USDC', 'Aave Supply'] : ['USDC', 'Hold'];
}

function buildMediumRiskUSDCRoute(protocolData) {
  const aaveData = protocolData.aave || { supplyRates: {}, borrowRates: {} };
  const lidoData = protocolData.lido || { stETHAPR: 0 };
  let route = ['USDC'];
  if ((lidoData.stETHAPR || 3.8) > 0) {
    route.push('swap to ETH', 'stETH');
    if (aaveData.supplyRates['stETH'] > 0 && aaveData.borrowRates['USDC'] < 3) {
      route.push('Aave', 'borrow USDC');
    }
  }
  return route.length > 2 ? route : buildLowRiskUSDCRoute(protocolData);
}

function buildHighRiskUSDCRoute(protocolData) {
  const aaveData = protocolData.aave || { supplyRates: {}, borrowRates: {} };
  const lidoData = protocolData.lido || { stETHAPR: 0 };
  const renzoData = protocolData.renzo || { apyBoost: 0 };
  let route = ['USDC'];
  if ((lidoData.stETHAPR || 3.8) > 0) {
    route.push('swap to ETH', 'stETH');
    if (aaveData.supplyRates['stETH'] > 0 && aaveData.borrowRates['USDC'] < 3.5) {
      route.push('Aave', 'borrow USDC', 'swap to ETH');
      if (renzoData.apyBoost > 1) {
        route.push('Renzo');
      }
    }
  }
  return route.length > 3 ? route : buildMediumRiskUSDCRoute(protocolData);
}

function buildDefaultRoute(protocolData) {
  const lidoData = protocolData.lido || { stETHAPR: 0 };
  return lidoData.stETHAPR > 0 ? ['ETH', 'stETH'] : ['ETH', 'Hold'];
}

// Helper function to build dynamic insight based on the actual route for medium risk
function buildInsightForRoute(route, baseAPR, boostAPR, borrowRate, gasEstimateEth) {
  let insight = '';
  if (route.length <= 2) {
    insight = `Simple staking strategy with current APR of ${baseAPR.toFixed(1)}%. Minimal gas cost and low risk.`;
  } else if (route.includes('Renzo')) {
    insight = `This strategy uses stETH (APR: ${baseAPR.toFixed(1)}%) as collateral on Aave to borrow USDC (rate: ${borrowRate.toFixed(1)}%) and restake via Renzo (boost: ${boostAPR.toFixed(1)}%), increasing yield. Maintains a safe 60% LTV. Multiple transactions increase gas costs to ${gasEstimateEth} ETH.`;
  } else if (route.includes('Aave')) {
    insight = `This strategy uses stETH (APR: ${baseAPR.toFixed(1)}%) as collateral on Aave to borrow USDC (rate: ${borrowRate.toFixed(1)}%), increasing yield potential. Maintains a safe 60% LTV. Gas costs are moderate at ${gasEstimateEth} ETH.`;
  } else {
    insight = `Staking strategy with current APR of ${baseAPR.toFixed(1)}%. Gas costs are ${gasEstimateEth} ETH.`;
  }
  return insight;
}

// Helper function to build dynamic insight based on the actual route for high risk
function buildInsightForHighRiskRoute(route, baseAPR, renzoBoost, kelpBoost, borrowRateUSDC, borrowRateETH, gasEstimateEth) {
  let insight = '';
  if (route.includes('Kelp')) {
    insight = `Leveraged restaking loops ETH through Aave twice (borrow rates: USDC ${borrowRateUSDC.toFixed(1)}%, ETH ${borrowRateETH.toFixed(1)}%) for yield via Renzo (${renzoBoost.toFixed(1)}%) and Kelp (${kelpBoost.toFixed(1)}%). High risk due to 75% max LTV and ETH price sensitivity. Gas costs are significant at ${gasEstimateEth} ETH.`;
  } else if (route.includes('Renzo')) {
    insight = `Leveraged restaking loops ETH through Aave (borrow rate: USDC ${borrowRateUSDC.toFixed(1)}%) for yield via Renzo (${renzoBoost.toFixed(1)}%). High risk due to 70% LTV. Gas costs are high at ${gasEstimateEth} ETH.`;
  } else if (route.includes('Aave')) {
    insight = `Leveraged strategy uses stETH (APR: ${baseAPR.toFixed(1)}%) as collateral on Aave (borrow rate: USDC ${borrowRateUSDC.toFixed(1)}%). Moderate to high risk with gas costs at ${gasEstimateEth} ETH.`;
  } else {
    insight = `Simple staking strategy with current APR of ${baseAPR.toFixed(1)}%. Gas costs are ${gasEstimateEth} ETH. Risk is lower than intended for high tolerance.`;
  }
  return insight;
}

// Helper function to build dynamic insight for USDC medium risk strategy
function buildInsightForUSDCMediumRisk(route, baseAPR, borrowRate, gasEstimateEth) {
  let insight = '';
  if (route.length <= 2) {
    const apr = route.includes('Aave Supply') ? (aaveData.supplyRates['USDC'] || 4.2) : 0;
    insight = `Simple USDC supply to Aave provides a stable yield with current APR of ${apr.toFixed(1)}%. Very low risk and minimal gas cost of ${gasEstimateEth} ETH.`;
  } else if (route.includes('Aave')) {
    insight = `Converts USDC to ETH for staking (Lido APR: ${baseAPR.toFixed(1)}%), then uses stETH as collateral to borrow back USDC (rate: ${borrowRate.toFixed(1)}%), creating a partial loop. Swap introduces minor price impact; gas costs are ${gasEstimateEth} ETH.`;
  } else {
    insight = `Converts USDC to ETH for staking (Lido APR: ${baseAPR.toFixed(1)}%). Gas costs are ${gasEstimateEth} ETH.`;
  }
  return insight;
}

// Helper function to build dynamic insight for USDC high risk strategy
function buildInsightForUSDCHighRisk(route, baseAPR, boostAPR, borrowRate, gasEstimateEth) {
  let insight = '';
  if (route.includes('Renzo')) {
    insight = `Complex strategy leverages USDC to gain ETH exposure (Lido APR: ${baseAPR.toFixed(1)}%) and restaking yield via Renzo (boost: ${boostAPR.toFixed(1)}%). Multiple swaps increase slippage risk and gas costs to ${gasEstimateEth} ETH, but yield is amplified.`;
  } else if (route.includes('Aave')) {
    insight = `Leveraged strategy converts USDC to ETH (Lido APR: ${baseAPR.toFixed(1)}%) and uses stETH as collateral on Aave to borrow USDC (rate: ${borrowRate.toFixed(1)}%). High risk due to price exposure; gas costs are ${gasEstimateEth} ETH.`;
  } else {
    const apr = route.includes('Aave Supply') ? (aaveData.supplyRates['USDC'] || 4.2) : 0;
    insight = `Simple USDC supply to Aave with APR of ${apr.toFixed(1)}%. Gas costs are minimal at ${gasEstimateEth} ETH. Risk is lower than intended for high tolerance.`;
  }
  return insight;
}
