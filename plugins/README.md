# EigenPilot Plugins

This directory contains modular plugins for EigenPilot, allowing extension of the core functionality with new protocols, risk models, data sources, and gas optimizations.

## Plugin Types

EigenPilot supports the following types of plugins:

- **Protocol Plugins**: Integrate with specific DeFi protocols (Lido, Aave, Uniswap, etc.)
- **Risk Plugins**: Provide risk scoring and analysis models
- **Data Plugins**: Connect to external data sources for market data, price feeds, etc.
- **Gas Plugins**: Optimize transaction gas usage and timing

## Plugin Structure

Each plugin should follow this standard structure:

```
protocol-name/
  ├── package.json         # Plugin metadata and dependencies
  ├── index.js             # Main plugin entry point
  ├── README.md            # Plugin documentation
  └── test/                # Tests for the plugin
```

## Plugin Interface

All plugins must export the following:

```javascript
// Plugin metadata
export const metadata = {
  name: 'Plugin Name',
  type: 'protocol | risk | data | gas',
  version: '0.1.0',
  description: 'Plugin description',
  // Plugin-specific metadata
};

// Core functionality methods
export async function someMethod() {
  // Plugin implementation
}
```

## Protocol Plugins

Protocol plugins must implement:

- `getProtocolData()` - Return current protocol data (rates, fees, etc.)
- `analyzeStrategy(strategy, protocolData)` - Analyze a strategy using this protocol
- `getRequiredSteps(options)` - Return steps required to execute with this protocol

## Risk Plugins

Risk plugins must implement:

- `assessRisk(strategy, protocolData)` - Return a risk assessment for a strategy
- `getMaxLTV(asset, protocol)` - Recommend a max LTV for a given asset/protocol

## Data Plugins

Data plugins must implement:

- `getMarketData(assets)` - Return current market data for specified assets
- `getPriceHistory(asset, timeframe)` - Return historical price data

## Gas Plugins

Gas plugins must implement:

- `estimateGasCosts(steps)` - Estimate gas costs for a set of transaction steps
- `optimizeTransactions(steps)` - Suggest optimized transaction ordering/batching

## Creating a New Plugin

1. Create a new directory with the plugin name (e.g., `protocol-uniswap`)
2. Create a `package.json` with the plugin metadata
3. Implement the plugin interface in `index.js`
4. Add tests in the `test/` directory
5. Document usage in a `README.md` file

## Example Usage

```javascript
import { getProtocolData } from '@eigen-pilot/protocol-lido';

const lidoData = await getProtocolData();
console.log(`Current Lido staking APR: ${lidoData.stETHAPR}%`);
``` 