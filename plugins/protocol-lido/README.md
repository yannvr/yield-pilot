# Lido Protocol Plugin for EigenPilot

This plugin integrates Lido liquid staking protocol into EigenPilot, enabling ETH staking strategies with real-time data and analysis.

## Features

- Fetches real-time Lido staking APR, fees, and TVL
- Analyzes stETH/ETH ratio and premium/discount
- Provides risk assessment for Lido-based strategies
- Returns transaction steps for Lido interactions

## Usage

```javascript
import { 
  metadata, 
  getProtocolData, 
  analyzeStrategy, 
  getRequiredSteps 
} from '@eigen-pilot/protocol-lido';

// Get protocol metadata
console.log(`Plugin: ${metadata.name} v${metadata.version}`);

// Get current Lido data
const lidoData = await getProtocolData();
console.log(`Current stETH APR: ${lidoData.stETHAPR}%`);

// Analyze a strategy that uses Lido
const strategy = {
  proposedRoute: ["ETH", "stETH", "wstETH", "Aave"],
  // ... other strategy data
};
const analysis = await analyzeStrategy(strategy, { lido: lidoData });
console.log(`Analysis: ${analysis.analysis.summary}`);

// Get transaction steps for staking in Lido
const steps = getRequiredSteps({ amount: 2.0 });
console.log(`Required steps: ${steps.length}`);
```

## API Reference

### `metadata`

Plugin metadata object with name, description, and version.

### `getProtocolData()`

Returns current Lido protocol data including:

- `stETHAPR` - Current annual percentage rate for staking
- `totalStaked` - Total ETH staked in Lido
- `fee` - Lido protocol fee percentage
- `validatorCount` - Number of Lido validators
- `stethEthRatio` - Current stETH to ETH ratio
- `premium` - Premium/discount of stETH vs ETH (negative means discount)
- `metrics` - Additional metrics including TVL and APR history

### `analyzeStrategy(strategy, protocolData)`

Analyzes a strategy that includes Lido, returning:

- `analysis` - Analysis of the strategy including summary, risk factors, and confidence score
- `recommendations` - Recommendations for the strategy including action and adjustments
- `insight` - Detailed insight explaining the analysis

### `getRequiredSteps(options)`

Returns the transaction steps required to interact with Lido:

- Steps to stake ETH and receive stETH
- Contract addresses and methods
- Gas estimates for each step

## Risk Factors

The plugin considers the following risk factors:

- Smart contract risk
- Validator slashing risk
- stETH/ETH peg stability
- Market depth and exit liquidity
- Validator performance 