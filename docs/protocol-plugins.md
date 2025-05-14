# Protocol Plugins Implementation Plan

## Overview

This document outlines the protocol plugins needed for the YieldPilot CLI to rely exclusively on actual protocol data rather than fallback values or simulated data.

## Required Protocol Plugins

1. **protocol-lido** (already implemented)
   - Fetches data from The Graph for Lido protocol
   - Provides APR, TVL, and other metrics for stETH

2. **protocol-aave**
   - Should fetch supply rates, borrow rates, and LTV ratios for various assets
   - Will use Aave's official API or subgraph
   - Required assets: ETH, stETH, wstETH, USDC, USDT, DAI

3. **protocol-renzo**
   - Should fetch APY boost, TVL, and fees
   - Will use Renzo's API or subgraph
   - Provides data for ezETH

4. **protocol-kelp**
   - Should fetch APY boost, TVL, and fees
   - Will use Kelp's API or subgraph
   - Provides data for rsETH

5. **protocol-eigenlayer**
   - Should fetch base APR and TVL
   - Will use EigenLayer's API or subgraph
   - Provides data for restaking metrics

6. **protocol-yearn**
   - Should fetch vault APYs and TVL
   - Will use Yearn's API or subgraph
   - Provides data for various vaults

7. **protocol-uniswap**
   - Should fetch pool data, liquidity, and fees
   - Will use Uniswap's API or subgraph
   - Provides data for swap routes and pricing

8. **protocol-gas**
   - Should fetch current gas prices and estimate gas costs
   - Will use Blocknative API and Etherscan as fallback
   - Provides gas estimates for various DeFi actions

## Implementation Priority

1. protocol-aave (highest priority)
2. protocol-renzo
3. protocol-kelp
4. protocol-eigenlayer
5. protocol-yearn
6. protocol-uniswap
7. protocol-gas

## Integration Steps

1. Create each plugin using the `scripts/create-plugin.js` script
2. Implement the `getProtocolData()` function in each plugin
3. Update `src/protocols/index.js` to use the plugins
4. Test each plugin individually
5. Test the integrated system with the CLI

## API Keys Required

- The Graph API key (for most subgraph queries)
- Blocknative API key (for gas estimates)
- Etherscan API key (as fallback for gas data)
- Infura or Alchemy API key (for direct RPC queries if needed)

## Testing Strategy

Each plugin should be tested with:
1. Unit tests for data fetching and processing
2. Integration tests with the CLI
3. Fallback behavior when APIs are unavailable 