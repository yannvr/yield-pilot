# YieldPilot 🚀

A CLI-native DeFi strategist that helps users find optimal staking, looping, borrowing, and restaking strategies across Ethereum protocols.

## Overview

YieldPilot analyzes your investment intent and constraints to recommend the most efficient strategy route for maximizing real yield while staying within your risk parameters. It focuses on:

- **Real net yield** (APY minus gas, borrowing costs, slippage)
- **Safe risk thresholds** (based on LTV, protocol trust, volatility)
- **Ethereum protocols** (Lido, Aave, Uniswap, EigenLayer, Renzo, Kelp)
- **Modular strategies** (editable step-by-step)

## Installation

```bash
# Install dependencies
pnpm install

# Link the package for global usage
pnpm link --global
```

## Usage

### Interactive Mode

```bash
yield-pilot simulate
```

This will prompt you for the necessary inputs:
- Investment intent
- Input asset
- Amount to invest
- Risk tolerance
- Gas budget
- Time horizon

### Command Line Arguments

```bash
yield-pilot simulate --intent "maximize ETH yield" --asset ETH --amount 2.0 --risk medium
```

#### Options

- `-i, --intent` - Your investment intent (e.g., "maximize ETH yield")
- `-a, --asset` - Input asset (e.g., ETH, USDC)
- `-v, --amount` - Amount to invest
- `-r, --risk` - Risk tolerance (low, medium, high)
- `-g, --gas` - Maximum gas budget in ETH (default: 0.015)
- `-t, --time` - Time horizon in days (default: 30)
- `--json` - Output results as JSON

### Future: Execution Mode

```bash
yield-pilot exec --strategy path/to/strategy.json
```

## Example Outputs

Below are examples of different strategies YieldPilot can simulate based on varying risk tolerances and input assets.

### Low Risk ETH Staking

**Command:**
```bash
yield-pilot simulate --intent "maximize ETH yield" --asset ETH --amount 2.0 --risk low
```

For an input of 2 ETH with low risk tolerance:

```
📊 Proposed Strategy
Route:
  ETH → stETH

Estimated Metrics:
  Gross APR: 3.8%
  Net Yield: 3.7%
  Gas Estimate: 0.0020 ETH
  Risk Score: 2.0/10

Insight:
  Simple staking via Lido offers a current APR of 3.8%. Minimal gas cost for a single transaction and no liquidation risk make this a safe choice.

Judgment: Optimal for low risk
```

### Medium Risk ETH Leveraged Restaking

**Command:**
```bash
yield-pilot simulate --intent "maximize ETH yield" --asset ETH --amount 2.0 --risk medium
```

For an input of 2 ETH with medium risk tolerance:

```
📊 Proposed Strategy
Route:
  ETH → stETH → wstETH → Aave → borrow USDC → swap to ETH → Renzo

Estimated Metrics:
  Gross APR: 8.2%
  Net Yield: 7.1%
  Gas Estimate: 0.0051 ETH
  Risk Score: 5.5/10

Insight:
  This strategy uses stETH as collateral on Aave to borrow USDC (rate: 2.5%) and restake via Renzo (boost: 2.0%), increasing yield while maintaining a safe 60% LTV. Multiple transactions increase gas costs but overall yield remains strong.

Judgment: Proceed with monitoring
```

### High Risk ETH Leveraged Looping

**Command:**
```bash
yield-pilot simulate --intent "maximize ETH yield" --asset ETH --amount 2.0 --risk high
```

For an input of 2 ETH with high risk tolerance:

```
📊 Proposed Strategy
Route:
  ETH → stETH → wstETH → Aave → borrow USDC → swap to ETH → Renzo → Aave → borrow ETH → Kelp

Estimated Metrics:
  Gross APR: 12.1%
  Net Yield: 9.8%
  Gas Estimate: 0.0082 ETH
  Risk Score: 8.2/10

Insight:
  Leveraged restaking loops ETH through Aave twice (borrow rates: USDC 2.5%, ETH 3.0%) for yield via Renzo (2.0%) and Kelp (1.5%). High risk due to 75% max LTV and ETH price sensitivity. Gas costs are significant at 0.0082 ETH.

Judgment: High Risk - Monitor Closely
```

### Low Risk USDC Yield

**Command:**
```bash
yield-pilot simulate --intent "stable yield" --asset USDC --amount 5000 --risk low
```

For an input of 5000 USDC with low risk tolerance:

```
📊 Proposed Strategy
Route:
  USDC → Aave Supply

Estimated Metrics:
  Gross APR: 4.2%
  Net Yield: 4.0%
  Gas Estimate: 0.0015 ETH
  Risk Score: 2.1/10

Insight:
  Simple USDC supply to Aave provides a stable yield with current APR of 4.2%. Very low risk and minimal gas cost of 0.0015 ETH for a single transaction.

Judgment: Optimal for low risk
```

### Medium Risk USDC to ETH Strategy

**Command:**
```bash
yield-pilot simulate --intent "maximize yield" --asset USDC --amount 5000 --risk medium
```

For an input of 5000 USDC with medium risk tolerance:

```
📊 Proposed Strategy
Route:
  USDC → swap to ETH → stETH → Aave → borrow USDC

Estimated Metrics:
  Gross APR: 5.3%
  Net Yield: 4.5%
  Gas Estimate: 0.0045 ETH
  Risk Score: 5.8/10

Insight:
  Converts USDC to ETH for staking (Lido APR: 3.8%), then uses stETH as collateral to borrow back USDC (rate: 2.5%), creating a partial loop. Swap introduces minor price impact; gas costs are 0.0045 ETH.

Judgment: Proceed with caution
```

## Project Structure

- `src/cli` - CLI implementation
- `src/analyzer` - Strategy analysis and building
- `src/protocols` - Protocol data integration and aggregation
- `src/projections` - Yield calculation and projections
- `src/insights` - Market insights and recommendations
- `plugins/` - Protocol-specific plugins for real-time data

## Protocol Plugins

YieldPilot uses protocol-specific plugins to fetch real-time data directly from the source, ensuring accurate yield calculations and risk assessments. The following plugins are currently implemented:

- **protocol-lido** - Fetches data from The Graph for Lido protocol (stETH)
- **protocol-aave** - Fetches data from The Graph for Aave V3 protocol (lending/borrowing)

Additional protocol plugins are planned for:
- Renzo (ezETH)
- Kelp (rsETH)
- EigenLayer
- Yearn Finance
- Uniswap
- Gas pricing

### Creating a New Protocol Plugin

```bash
node scripts/create-plugin.js
```

This will prompt you to create a new protocol plugin with the necessary structure.

## Environment Setup

Create a `.env` file with the following API keys:

```
THEGRAPH_API_KEY=your_graph_api_key
BLOCKNATIVE_API_KEY=your_blocknative_api_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## Contributing

Contributions are welcome! Please check out our [contribution guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [DefiLlama](https://defillama.com/) for fallback protocol data
- [The Graph](https://thegraph.com/) for protocol-specific data
- All the amazing DeFi protocols that make this possible