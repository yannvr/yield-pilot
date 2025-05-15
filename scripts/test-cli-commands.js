#!/usr/bin/env node

import { analyzeStrategy } from '../src/analyzer/index.js';
import chalk from 'chalk';

/**
 * Simulate CLI command output for yield-pilot
 * This is a test script to show how different commands would behave
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

// Utility function to display strategy results in a readable format (copied from CLI)
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

// Test cases - different CLI commands to simulate
const testCases = [
  {
    name: 'High Risk ETH Strategy',
    command: 'yield-pilot simulate --intent "maximize ETH yield" --asset ETH --amount 2.0 --risk high',
    input: {
      intent: 'maximize ETH yield',
      inputAsset: 'ETH',
      amount: 2.0,
      riskTolerance: 'high',
      gasLimitEth: 0.015,
      timeHorizonDays: 30
    }
  },
  {
    name: 'Medium Risk ETH Strategy',
    command: 'yield-pilot simulate --intent "stable ETH income" --asset ETH --amount 5.0 --risk medium',
    input: {
      intent: 'stable ETH income',
      inputAsset: 'ETH',
      amount: 5.0,
      riskTolerance: 'medium',
      gasLimitEth: 0.015,
      timeHorizonDays: 30
    }
  },
  {
    name: 'Low Risk ETH Strategy',
    command: 'yield-pilot simulate --intent "preserve ETH capital" --asset ETH --amount 10.0 --risk low',
    input: {
      intent: 'preserve ETH capital',
      inputAsset: 'ETH',
      amount: 10.0,
      riskTolerance: 'low',
      gasLimitEth: 0.015,
      timeHorizonDays: 30
    }
  },
  {
    name: 'USDC Strategy',
    command: 'yield-pilot simulate --intent "maximize stablecoin yield" --asset USDC --amount 1000.0 --risk medium',
    input: {
      intent: 'maximize stablecoin yield',
      inputAsset: 'USDC',
      amount: 1000.0,
      riskTolerance: 'medium',
      gasLimitEth: 0.015,
      timeHorizonDays: 30
    }
  },
  {
    name: 'High Risk USDC Strategy with Long Time Horizon',
    command: 'yield-pilot simulate --intent "maximize yield" --asset USDC --amount 5000.0 --risk high --time 90',
    input: {
      intent: 'maximize yield',
      inputAsset: 'USDC',
      amount: 5000.0,
      riskTolerance: 'high',
      gasLimitEth: 0.015,
      timeHorizonDays: 90
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

      try {
        const strategy = await analyzeStrategy(testCase.input);
        displayStrategy(strategy);
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
