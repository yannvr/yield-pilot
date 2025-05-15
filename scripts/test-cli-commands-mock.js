#!/usr/bin/env node

import chalk from 'chalk';

/**
 * Mock version of the CLI output for yield-pilot
 * This demonstrates the expected output format for different strategies
 * without relying on the live APIs
 */

// Suppress console.log messages temporarily during tests
const originalConsoleLog = console.log;
function setupLogSuppression() {
  // Store the original console.log
  // Replace with filtered version that ignores specific messages
  console.log = function(...args) {
    // Only suppress certain types of log messages
    if (args.length > 0 && typeof args[0] === 'string') {
      const msg = args[0];
      // Skip logs about fetching data or API calls
      if (msg.includes('Attempting to fetch') ||
          msg.includes('Fetched') ||
          msg.includes('Sending query') ||
          msg.includes('Response received') ||
          msg.includes('Found ezETH pool')) {
        return; // Ignore this log message
      }
    }
    // Pass through all other logs to the original console.log
    originalConsoleLog.apply(console, args);
  };
}

function restoreConsoleLogs() {
  // Restore normal logging
  console.log = originalConsoleLog;
}

// Utility function to display strategy results in a readable format
function displayStrategy(strategy) {
  console.log('\n' + chalk.bold.blue('📊 Proposed Strategy'));
  console.log(chalk.bold('Route:'));

  // Display route as a flow
  console.log('  ' + strategy.proposedRoute.join(chalk.gray(' → ')));

  console.log('\n' + chalk.bold('Estimated Metrics:'));
  console.log(`  ${chalk.bold('Gross APR:')} ${chalk.green(strategy.grossAPR)}`);
  console.log(`  ${chalk.bold('Net Yield:')} ${chalk.green(strategy.netYield)}`);

  // Display period returns if available
  if (strategy.periodNetReturn) {
    console.log(`  ${chalk.bold('Period Return:')} ${chalk.green(strategy.periodNetReturn)}`);
  }

  if (strategy.absoluteReturn) {
    console.log(`  ${chalk.bold('Absolute Return:')} ${chalk.green(strategy.absoluteReturn)}`);
  }

  console.log(`  ${chalk.bold('Gas Estimate:')} ${chalk.yellow(strategy.gasEstimateEth + ' ETH')}`);

  // Risk score with color coding
  const riskColor = strategy.riskScore < 4 ? 'green' :
                    strategy.riskScore < 7 ? 'yellow' : 'red';
  console.log(`  ${chalk.bold('Risk Score:')} ${chalk[riskColor](strategy.riskScore + '/10')}`);

  console.log('\n' + chalk.bold('Strategy Insight:'));
  console.log(`  ${strategy.insight}`);

  // Display market insight if available
  if (strategy.marketInsight) {
    console.log('\n' + chalk.bold('Market Context:'));
    console.log(`  ${strategy.marketInsight}`);
  }

  // Display warnings if any
  if (strategy.warnings && strategy.warnings.length > 0) {
    console.log('\n' + chalk.bold.yellow('⚠️  Warnings:'));
    strategy.warnings.forEach(warning => {
      console.log(`  ${chalk.yellow('•')} ${warning}`);
    });
  }

  // Display data sources reliability
  if (strategy.dataSources) {
    console.log('\n' + chalk.bold('Data Source Reliability:'));
    Object.entries(strategy.dataSources).forEach(([key, value]) => {
      const color = value === 'Real Data' ? chalk.green : chalk.yellow;
      console.log(`  ${chalk.bold(key + ':')} ${color(value)}`);
    });
  }

  // Display specific warning about fallback values if present
  if (strategy.warning) {
    console.log('\n' + chalk.bold.yellow('⚠️  Data Warning:'));
    console.log(chalk.yellow(`  ${strategy.warning}`));
  }

  // Judgment with color coding
  const judgmentColor =
    strategy.judgment.includes('Optimal') ? 'green' :
    strategy.judgment.includes('Caution') ? 'yellow' : 'red';

  console.log('\n' + chalk.bold(`Judgment: ${chalk[judgmentColor](strategy.judgment)}`));
}

// Mock strategies for different risk profiles
const mockStrategies = {
  // ETH Strategies
  'high-eth': {
    proposedRoute: ['ETH', 'stETH', 'wstETH', 'Aave', 'borrow USDC', 'swap to ETH', 'Renzo', 'Aave', 'borrow ETH', 'Kelp'],
    grossAPR: '12.5%',
    netYield: '8.7%',
    periodNetReturn: '2.2% (30 days)',
    absoluteReturn: '+0.17 ETH (on 2.0 ETH)',
    gasEstimateEth: '0.025',
    riskScore: 8.2,
    insight: 'This complex strategy leverages stETH (APR: 3.8%) collateral on Aave to borrow USDC (rate: 2.1%) and restake via both Renzo (boost: 4.2%) and Kelp (boost: 3.9%). The multi-collateral position adds yield but increases liquidation risk. High gas costs of 0.025 ETH across multiple transactions.',
    marketInsight: 'Current market shows restaking yields are high but volatile. ETH price is relatively stable, benefiting leveraged positions with controlled risk. Monitor borrowing rates closely.',
    warnings: [
      'High liquidation risk at 80% LTV',
      'Multiple protocol dependencies increase smart contract risk',
      'Leveraged position may require active management'
    ],
    dataSources: {
      lidoAPR: 'Real Data',
      aaveSupplyRates: 'Real Data',
      aaveBorrowRates: 'Real Data',
      renzoBoost: 'Real Data',
      kelpBoost: 'Real Data',
      gasEstimate: 'Real Data'
    },
    judgment: 'High Risk - Monitor Closely'
  },
  'medium-eth': {
    proposedRoute: ['ETH', 'stETH', 'wstETH', 'Aave', 'borrow USDC', 'swap to ETH', 'Renzo'],
    grossAPR: '8.4%',
    netYield: '6.1%',
    periodNetReturn: '1.5% (30 days)',
    absoluteReturn: '+0.30 ETH (on 5.0 ETH)',
    gasEstimateEth: '0.018',
    riskScore: 5.5,
    insight: 'This strategy uses stETH (APR: 3.8%) as collateral on Aave to borrow USDC (rate: 1.9%) and restake via Renzo (boost: 4.2%), increasing yield. Maintains a safe 60% LTV. Multiple transactions increase gas costs to 0.018 ETH.',
    marketInsight: 'Current market conditions favor this balanced approach. Aave borrowing rates remain low, while Renzo offers solid restaking rewards. The strategy benefits from the stability of stETH while capturing additional yield.',
    warnings: [
      'Medium liquidation risk at 60% LTV',
      'Monitor borrowing rates for changes'
    ],
    dataSources: {
      lidoAPR: 'Real Data',
      aaveSupplyRates: 'Real Data',
      aaveBorrowRates: 'Real Data',
      renzoBoost: 'Real Data',
      gasEstimate: 'Real Data'
    },
    judgment: 'Proceed with monitoring'
  },
  'low-eth': {
    proposedRoute: ['ETH', 'stETH'],
    grossAPR: '3.8%',
    netYield: '3.6%',
    periodNetReturn: '0.9% (30 days)',
    absoluteReturn: '+0.36 ETH (on 10.0 ETH)',
    gasEstimateEth: '0.005',
    riskScore: 2.0,
    insight: 'Simple staking via Lido offers a current APR of 3.8%. Minimal gas cost for a single transaction and no liquidation risk make this a safe choice.',
    marketInsight: 'Lido staking provides reliable yield and has maintained consistent performance. Recently, stETH has traded at a small premium to ETH on secondary markets, indicating strong demand.',
    dataSources: {
      lidoAPR: 'Real Data',
      gasEstimate: 'Real Data'
    },
    judgment: 'Optimal for low risk'
  },
  // USDC Strategies
  'medium-usdc': {
    proposedRoute: ['USDC', 'swap to ETH', 'stETH', 'Aave', 'borrow USDC'],
    grossAPR: '6.2%',
    netYield: '4.8%',
    periodNetReturn: '1.2% (30 days)',
    absoluteReturn: '+$48.00 (on $1000.0)',
    gasEstimateEth: '0.014',
    riskScore: 5.8,
    insight: 'This strategy swaps USDC to ETH for staking (APR: 3.8%) and uses stETH as Aave collateral to borrow back USDC at a lower rate (2.0%). The loop creates a leveraged position with moderate risk and gas costs of 0.014 ETH.',
    marketInsight: 'USDC maintains stability while capturing ETH staking yields. Current market conditions show a positive spread between staking rewards and USDC borrowing costs, making this strategy viable.',
    warnings: [
      'ETH price volatility could affect collateral value',
      'Monitor borrowing rates for changes'
    ],
    dataSources: {
      lidoAPR: 'Real Data',
      aaveSupplyRates: 'Real Data',
      aaveBorrowRates: 'Real Data',
      gasEstimate: 'Real Data'
    },
    judgment: 'Proceed with caution'
  },
  'high-usdc': {
    proposedRoute: ['USDC', 'swap to ETH', 'stETH', 'Aave', 'borrow USDC', 'swap to ETH', 'Renzo'],
    grossAPR: '9.5%',
    netYield: '7.1%',
    periodNetReturn: '1.8% (30 days)',
    periodNetReturn90: '5.3% (90 days)',
    absoluteReturn: '+$355.00 (on $5000.0)',
    gasEstimateEth: '0.022',
    riskScore: 7.9,
    insight: 'This high-risk strategy starts with USDC to ETH conversion for staking (APR: 3.8%), supplies stETH to Aave, borrows more USDC to convert and restake via Renzo (boost: 4.2%). Creates significant leverage with high potential yield but increased risk and gas costs of 0.022 ETH.',
    marketInsight: 'The 90-day time horizon allows compounding benefits to accumulate. Current market shows restaking yields via Renzo are attractive while borrowing costs remain moderate. The strategy benefits from longer exposure but increases risk over this period.',
    warnings: [
      'High liquidation risk at 75% LTV',
      'Multiple protocol dependencies increase smart contract risk',
      'ETH price volatility could require position management'
    ],
    dataSources: {
      lidoAPR: 'Real Data',
      aaveSupplyRates: 'Real Data',
      aaveBorrowRates: 'Real Data',
      renzoBoost: 'Real Data',
      gasEstimate: 'Real Data'
    },
    judgment: 'High Risk - Consider Partial Position'
  }
};

// Test cases - different CLI commands to simulate
const testCases = [
  {
    name: 'High Risk ETH Strategy',
    command: 'yield-pilot simulate --intent "maximize ETH yield" --asset ETH --amount 2.0 --risk high',
    strategy: mockStrategies['high-eth']
  },
  {
    name: 'Medium Risk ETH Strategy',
    command: 'yield-pilot simulate --intent "stable ETH income" --asset ETH --amount 5.0 --risk medium',
    strategy: mockStrategies['medium-eth']
  },
  {
    name: 'Low Risk ETH Strategy',
    command: 'yield-pilot simulate --intent "preserve ETH capital" --asset ETH --amount 10.0 --risk low',
    strategy: mockStrategies['low-eth']
  },
  {
    name: 'USDC Strategy (Medium Risk)',
    command: 'yield-pilot simulate --intent "maximize stablecoin yield" --asset USDC --amount 1000.0 --risk medium',
    strategy: mockStrategies['medium-usdc']
  },
  {
    name: 'High Risk USDC Strategy with Long Time Horizon',
    command: 'yield-pilot simulate --intent "maximize yield" --asset USDC --amount 5000.0 --risk high --time 90',
    strategy: {
      ...mockStrategies['high-usdc'],
      periodNetReturn: mockStrategies['high-usdc'].periodNetReturn90
    }
  }
];

// Run all test cases
async function runTests() {
  // Suppress noisy logs
  setupLogSuppression();

  try {
    for (const testCase of testCases) {
      console.log('\n' + chalk.bold.blue('='.repeat(80)));
      console.log(chalk.bold('Testing command:'));
      console.log(chalk.cyan(testCase.command));
      console.log(chalk.bold.blue('='.repeat(80)));

      console.log(chalk.yellow('Processing...'));

      // Simulate slight delay to make it feel like real processing
      await new Promise(resolve => setTimeout(resolve, 800));

      try {
        displayStrategy(testCase.strategy);
      } catch (error) {
        console.error(chalk.red(`Error for ${testCase.name}:`), error);
      }
    }
  } finally {
    // Always restore console logs when done
    restoreConsoleLogs();
  }
}

// Execute all tests
runTests().catch(error => {
  // Make sure logs are restored even if there's an error
  restoreConsoleLogs();
  console.error(chalk.red('Test execution failed:'), error);
  process.exit(1);
});
