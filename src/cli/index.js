#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyzeStrategy } from '../analyzer/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const program = new Command();

// Read the package version from package.json
const packageJsonPath = path.join(__dirname, '../../package.json');
const packageJson = JSON.parse(
  await fs.readFile(packageJsonPath, 'utf8')
);

program
  .name('eigen-pilot')
  .description('CLI-native DeFi strategist for Ethereum protocols')
  .version(packageJson.version);

program
  .command('simulate')
  .description('Simulate a DeFi strategy based on your requirements')
  .option('-i, --intent <intent>', 'Your investment intent (e.g., "maximize ETH yield")')
  .option('-a, --asset <asset>', 'Input asset (e.g., ETH, USDC)')
  .option('-v, --amount <amount>', 'Amount to invest')
  .option('-r, --risk <risk>', 'Risk tolerance (low, medium, high)', 'medium')
  .option('-g, --gas <gas>', 'Maximum gas budget in ETH', '0.015')
  .option('-t, --time <days>', 'Time horizon in days', '30')
  .option('--json', 'Output results as JSON')
  .action(async (options) => {
    let strategyInput;

    // If required options are missing, prompt for them
    if (!options.intent || !options.asset || !options.amount) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'intent',
          message: 'What is your investment intent?',
          default: 'maximize ETH yield',
          when: !options.intent
        },
        {
          type: 'list',
          name: 'asset',
          message: 'Which asset do you want to invest?',
          choices: ['ETH', 'USDC', 'USDT', 'DAI', 'wBTC'],
          when: !options.asset
        },
        {
          type: 'number',
          name: 'amount',
          message: 'How much do you want to invest?',
          default: 1.0,
          when: !options.amount
        },
        {
          type: 'list',
          name: 'risk',
          message: 'What is your risk tolerance?',
          choices: ['low', 'medium', 'high'],
          default: 'medium',
          when: !options.risk
        },
        {
          type: 'number',
          name: 'gas',
          message: 'What is your maximum gas budget in ETH?',
          default: 0.015,
          when: !options.gas
        },
        {
          type: 'number',
          name: 'time',
          message: 'What is your time horizon in days?',
          default: 30,
          when: !options.time
        }
      ]);

      strategyInput = {
        intent: answers.intent || options.intent,
        inputAsset: answers.asset || options.asset,
        amount: parseFloat(answers.amount || options.amount),
        riskTolerance: answers.risk || options.risk,
        gasLimitEth: parseFloat(answers.gas || options.gas),
        timeHorizonDays: parseInt(answers.time || options.time, 10)
      };
    } else {
      strategyInput = {
        intent: options.intent,
        inputAsset: options.asset,
        amount: parseFloat(options.amount),
        riskTolerance: options.risk,
        gasLimitEth: parseFloat(options.gas),
        timeHorizonDays: parseInt(options.time, 10)
      };
    }

    // Display spinner while analyzing
    const spinner = ora('Analyzing optimal strategy...').start();

    try {
      const strategyResult = await analyzeStrategy(strategyInput);
      spinner.succeed('Strategy analysis complete');

      if (options.json) {
        console.log(JSON.stringify(strategyResult, null, 2));
      } else {
        displayStrategy(strategyResult);
      }
    } catch (error) {
      spinner.fail('Strategy analysis failed');
      console.error(chalk.red(`Error: ${error.message}`));
    }
  });

program
  .command('exec')
  .description('Execute a simulated strategy (requires wallet)')
  .option('-s, --strategy <path>', 'Path to strategy JSON file')
  .option('--dry-run', 'Simulate execution without sending transactions')
  .action(async (options) => {
    console.log(chalk.yellow('⚠️  Execution functionality not yet implemented'));
    console.log('This will allow executing strategies with a connected wallet');
  });

// Helper function to display strategy results in a readable format
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
  console.log('\n' + chalk.gray('Use --json flag for machine-readable output'));
}

program.parse();
