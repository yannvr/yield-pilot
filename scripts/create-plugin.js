#!/usr/bin/env node

import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Plugin creator script for YieldPilot
 * Creates boilerplate for new plugins with correct structure
 */
async function createPlugin() {
  try {
    console.log(chalk.blue('📦 YieldPilot Plugin Creator'));
    console.log(chalk.gray('This utility will walk you through creating a new plugin\n'));

    // Get plugin information from the user
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'type',
        message: 'What type of plugin would you like to create?',
        choices: [
          { name: 'Protocol Plugin (e.g., Aave, Uniswap)', value: 'protocol' },
          { name: 'Risk Plugin (e.g., Volatility, Smart Contract)', value: 'risk' },
          { name: 'Data Plugin (e.g., Price Feed, TVL Tracker)', value: 'data' },
          { name: 'Gas Plugin (e.g., Optimizer, Estimator)', value: 'gas' }
        ]
      },
      {
        type: 'input',
        name: 'name',
        message: 'Plugin name (e.g., "aave" for protocol-aave):',
        validate: input => input.trim().length > 0 || 'Name is required'
      },
      {
        type: 'input',
        name: 'description',
        message: 'Short description:',
        validate: input => input.trim().length > 0 || 'Description is required'
      },
      {
        type: 'confirm',
        name: 'createTests',
        message: 'Would you like to create test files?',
        default: true
      }
    ]);

    // Format directory name
    const dirName = `${answers.type}-${answers.name.toLowerCase().replace(/\s+/g, '-')}`;
    const pluginDir = path.join(__dirname, '..', 'plugins', dirName);

    // Check if directory already exists
    try {
      await fs.access(pluginDir);
      console.log(chalk.red(`\nPlugin directory already exists at: ${pluginDir}`));

      const overwriteAnswer = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: 'Would you like to overwrite it?',
          default: false
        }
      ]);

      if (!overwriteAnswer.overwrite) {
        console.log(chalk.yellow('Plugin creation cancelled.'));
        return;
      }
    } catch (err) {
      // Directory doesn't exist, which is good
    }

    // Create plugin directory
    await fs.mkdir(pluginDir, { recursive: true });

    // Create test directory if requested
    if (answers.createTests) {
      await fs.mkdir(path.join(pluginDir, 'test'), { recursive: true });
    }

    // Create package.json
    const packageJson = {
      name: `@eigen-pilot/${dirName}`,
      version: "0.1.0",
      description: answers.description,
      type: "module",
      main: "index.js",
      scripts: {
        test: "node --test"
      },
      keywords: [
        "eigen-pilot",
        "plugin",
        answers.type,
        answers.name.toLowerCase()
      ],
      author: "",
      license: "MIT"
    };

    await fs.writeFile(
      path.join(pluginDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // Create README.md with template
    await fs.writeFile(
      path.join(pluginDir, 'README.md'),
      getReadmeTemplate(answers.type, answers.name, answers.description)
    );

    // Create index.js with template
    await fs.writeFile(
      path.join(pluginDir, 'index.js'),
      getIndexTemplate(answers.type, answers.name, answers.description)
    );

    // Create test file if requested
    if (answers.createTests) {
      await fs.writeFile(
        path.join(pluginDir, 'test', 'index.test.js'),
        getTestTemplate(answers.type, answers.name)
      );
    }

    console.log(chalk.green('\n✅ Plugin created successfully!'));
    console.log(`Plugin location: ${chalk.cyan(pluginDir)}`);

    // Install dependencies
    console.log(chalk.yellow('\nInstalling plugin dependencies...'));

    try {
      await execAsync('pnpm install', { cwd: process.cwd() });
      console.log(chalk.green('✅ Dependencies installed successfully!'));
    } catch (err) {
      console.log(chalk.red(`Error installing dependencies: ${err.message}`));
      console.log(chalk.yellow('You may need to run "pnpm install" manually.'));
    }

    // Output next steps
    console.log(chalk.blue('\nNext steps:'));
    console.log(`1. Edit ${chalk.cyan(`plugins/${dirName}/index.js`)} to implement your plugin logic`);
    console.log(`2. Update ${chalk.cyan(`plugins/${dirName}/README.md`)} with detailed documentation`);
    console.log(`3. Run ${chalk.cyan(`pnpm test`)} to run plugin tests`);

  } catch (error) {
    console.error(chalk.red('Error creating plugin:'), error);
  }
}

// Template generators
function getReadmeTemplate(type, name, description) {
  const formattedName = name.charAt(0).toUpperCase() + name.slice(1);

  return `# ${formattedName} ${capitalizeFirstLetter(type)} Plugin for YieldPilot

${description}

## Features

- Feature 1
- Feature 2
- Feature 3

## Usage

\`\`\`javascript
import {
  metadata,
  // Import appropriate methods based on plugin type
} from '@eigen-pilot/${type}-${name.toLowerCase().replace(/\s+/g, '-')}';

// Example usage code
\`\`\`

## API Reference

### \`metadata\`

Plugin metadata object with name, description, and version.

### \`methodName()\`

Description of method

## Additional Documentation

Add detailed documentation here.
`;
}

function getIndexTemplate(type, name, description) {
  const formattedName = name.charAt(0).toUpperCase() + name.slice(1);

  let template = `/**
 * ${formattedName} ${type} plugin for YieldPilot
 * ${description}
 */

// Plugin metadata
export const metadata = {
  name: '${formattedName}',
  type: '${type}',
  version: '0.1.0',
  description: '${description}'`;

  if (type === 'protocol') {
    template += `,
  supportedAssets: [],
  supportsLeverage: false,
  officialUrl: 'https://example.com',
  officialDocs: 'https://docs.example.com'
};

/**
 * Get current protocol data
 * In production, this would fetch real-time data from APIs/subgraphs
 *
 * @returns {Promise<Object>} Current protocol data
 */
export async function getProtocolData() {
  // TODO: Implement protocol data fetching
  return {
    // Protocol-specific data
  };
}

/**
 * Analyze a strategy that includes this protocol
 *
 * @param {Object} strategy The strategy to analyze
 * @param {Object} protocolData Current protocol data
 * @returns {Promise<Object>} Analysis with risks and recommendations
 */
export async function analyzeStrategy(strategy, protocolData) {
  // TODO: Implement strategy analysis
  return {
    analysis: {
      summary: "",
      riskFactors: [],
      yieldImpact: "neutral",
      confidenceScore: 5
    },
    recommendations: {
      action: "proceed",
      adjustments: [],
      alternatives: []
    },
    insight: ""
  };
}

/**
 * Get the steps required to interact with this protocol
 *
 * @param {Object} options Options for the strategy
 * @returns {Array<Object>} Required transaction steps
 */
export function getRequiredSteps(options) {
  // TODO: Implement required transaction steps
  return [];
}`;
  } else if (type === 'risk') {
    template += `
};

/**
 * Assess risk for a given strategy
 *
 * @param {Object} strategy The strategy to assess
 * @param {Object} protocolData Protocol data for context
 * @returns {Promise<Object>} Risk assessment
 */
export async function assessRisk(strategy, protocolData) {
  // TODO: Implement risk assessment
  return {
    overallRiskScore: 5,
    breakdown: {
      // Risk breakdown
    },
    riskFactors: []
  };
}

/**
 * Get maximum recommended LTV for a given asset and protocol
 *
 * @param {string} asset Asset symbol
 * @param {string} protocol Protocol name
 * @returns {number} Maximum recommended LTV as a decimal (0-1)
 */
export function getMaxLTV(asset, protocol) {
  // TODO: Implement max LTV logic
  return 0.7; // Default conservative value
}`;
  } else if (type === 'data') {
    template += `
};

/**
 * Get current market data for specified assets
 *
 * @param {Array<string>} assets Asset symbols to get data for
 * @returns {Promise<Object>} Current market data
 */
export async function getMarketData(assets) {
  // TODO: Implement market data fetching
  return {
    // Asset-specific data
  };
}

/**
 * Get historical price data for an asset
 *
 * @param {string} asset Asset symbol
 * @param {string} timeframe Timeframe (e.g., "1d", "7d", "30d")
 * @returns {Promise<Array>} Historical price data
 */
export async function getPriceHistory(asset, timeframe) {
  // TODO: Implement price history fetching
  return [];
}`;
  } else if (type === 'gas') {
    template += `
};

/**
 * Estimate gas costs for a set of transaction steps
 *
 * @param {Array<Object>} steps Transaction steps
 * @returns {Promise<Object>} Gas cost estimates
 */
export async function estimateGasCosts(steps) {
  // TODO: Implement gas cost estimation
  return {
    totalGasEth: 0,
    breakdown: []
  };
}

/**
 * Optimize transaction ordering and batching
 *
 * @param {Array<Object>} steps Transaction steps
 * @returns {Array<Object>} Optimized transaction steps
 */
export function optimizeTransactions(steps) {
  // TODO: Implement transaction optimization
  return steps;
}`;
  }

  return template;
}

function getTestTemplate(type, name) {
  const formattedName = name.charAt(0).toUpperCase() + name.slice(1);

  return `import { describe, it } from 'node:test';
import assert from 'node:assert';
import { metadata } from '../index.js';

describe('${formattedName} ${type} plugin', () => {
  it('should have correct metadata', () => {
    assert.strictEqual(metadata.type, '${type}');
    assert.strictEqual(typeof metadata.name, 'string');
    assert.strictEqual(typeof metadata.version, 'string');
    assert.strictEqual(typeof metadata.description, 'string');
  });

  // Add more tests for your plugin functionality
});
`;
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Run the script
createPlugin();
