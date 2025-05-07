# EigenPilot 🚀

A CLI-native DeFi strategist that helps users find optimal staking, looping, borrowing, and restaking strategies across Ethereum protocols.

## Overview

EigenPilot analyzes your investment intent and constraints to recommend the most efficient strategy route for maximizing real yield while staying within your risk parameters. It focuses on:

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
eigen-pilot simulate
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
eigen-pilot simulate --intent "maximize ETH yield" --asset ETH --amount 2.0 --risk medium
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
eigen-pilot exec --strategy path/to/strategy.json
```

## Example Output

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
  This strategy uses stETH as collateral on Aave to borrow and restake via Renzo, 
  increasing yield while maintaining a safe 60% LTV. Multiple transactions increase 
  gas costs but overall yield remains strong.

Judgment: Proceed with monitoring
```

## Project Structure

- `src/cli` - Command line interface
- `src/analyzer` - Strategy analysis engine
- `src/protocols` - Protocol data and interactions
- `src/projections` - Yield projection calculations
- `src/insights` - Market context and insights

## Development Roadmap

See [ROADMAP.md](docs/ROADMAP.md) for the project development plan.

## License

MIT 