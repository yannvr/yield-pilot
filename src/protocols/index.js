// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

import defillama from 'defillama-api';

// Helper function to safely extract data
const safeGet = (obj, path, defaultValue = null) => {
  try {
    const value = path.split('.').reduce((o, k) => (o || {})[k], obj);
    return value === undefined || value === null ? defaultValue : value;
  } catch (e) {
    return defaultValue;
  }
};

/**
 * Get current data for supported DeFi protocols
 * Fetches real-time data from DefiLlama API
 *
 * @returns {Promise<Object>} Current protocol data
 */
export async function getProtocolData() {
  console.log("Fetching protocol data from DefiLlama...");
  try {
    const [
      protocolTvls,
      ethPriceData,
      yieldPoolsData,
      // Add more calls here for new integrations
      yearnData
    ] = await Promise.allSettled([
      // Fetch TVL for relevant protocols
      Promise.all([
        defillama.tvl.protocol('lido'),
        defillama.tvl.protocol('eigenlayer'),
        defillama.tvl.protocol('renzoprotocol'),
        defillama.tvl.protocol('kelp-dao')
      ]),
      // Fetch current ETH price (using coingecko identifier)
      defillama.coins.pricesCurrent(['coingecko:ethereum']),
      // Fetch yield pools data
      defillama.yields.pools(),
      // Fetch Yearn Finance data
      defillama.tvl.protocol('yearn-finance')
    ]);

    // --- Fetch Gas Data from Blocknative and Etherscan as fallback ---
    let blocknativeGasData = { status: 'rejected', reason: 'Not fetched' };
    let etherscanGasData = { status: 'rejected', reason: 'Not fetched' };
    try {
      // Blocknative API for gas estimation
      const blocknativeResponse = await fetch('https://api.blocknative.com/gasprices/blockprices', {
        headers: {
          'Authorization': process.env.BLOCKNATIVE_API_KEY || 'YOUR_BLOCKNATIVE_API_KEY_HERE'
        }
      });
      blocknativeGasData = { status: 'fulfilled', value: await blocknativeResponse.json() };
    } catch (error) {
      console.warn("Failed to fetch Blocknative gas data:", error.message);
      blocknativeGasData = { status: 'rejected', reason: error.message };
    }

    if (blocknativeGasData.status === 'rejected') {
      try {
        // Fallback to Etherscan Gas Tracker API
        const etherscanResponse = await fetch(`https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${process.env.ETHERSCAN_API_KEY || 'YOUR_ETHERSCAN_API_KEY_HERE'}`);
        etherscanGasData = { status: 'fulfilled', value: await etherscanResponse.json() };
      } catch (error) {
        console.warn("Failed to fetch Etherscan gas data:", error.message);
        etherscanGasData = { status: 'rejected', reason: error.message };
      }
    }

    // --- Process Protocol TVLs ---
    const lidoTvl = protocolTvls.status === 'fulfilled' && protocolTvls.value[0]
      ? safeGet(protocolTvls.value[0], 'tvl', null) // Use the main tvl field
      : null;
    const eigenLayerTvl = protocolTvls.status === 'fulfilled' && protocolTvls.value[1]
      ? safeGet(protocolTvls.value[1], 'tvl', null)
      : null;
    const renzoTvl = protocolTvls.status === 'fulfilled' && protocolTvls.value[2]
      ? safeGet(protocolTvls.value[2], 'tvl', null)
      : null;
    const kelpTvl = protocolTvls.status === 'fulfilled' && protocolTvls.value[3]
      ? safeGet(protocolTvls.value[3], 'tvl', null)
      : null;

    // --- Process Yearn Finance Data ---
    const yearnTvl = yearnData.status === 'fulfilled'
      ? safeGet(yearnData.value, 'tvl', null)
      : null;

    if (yearnData.status === 'rejected') {
      console.warn("Failed to fetch Yearn Finance data:", yearnData.reason);
    }

    // --- Process Yearn Vault APYs from Yield Pools ---
    const yearnVaultAPYs = {};
    if (yieldPoolsData.status === 'fulfilled' && yieldPoolsData.value?.data) {
      const pools = yieldPoolsData.value.data;
      const yearnPools = pools.filter(p =>
        p.project === 'yearn-finance' &&
        p.chain === 'Ethereum'
      );
      yearnPools.forEach(pool => {
        const symbol = pool.symbol || 'unknown';
        yearnVaultAPYs[symbol] = safeGet(pool, 'apyBase', null);
      });
    }

    if (protocolTvls.status === 'rejected') {
      console.warn("Failed to fetch some protocol TVLs:", protocolTvls.reason);
    }

    // --- Process ETH Price ---
    const ethPrice = ethPriceData.status === 'fulfilled'
      ? safeGet(ethPriceData.value, 'coins.coingecko:ethereum.price', null)
      : null;

    if (ethPriceData.status === 'rejected') {
      console.warn("Failed to fetch ETH price:", ethPriceData.reason);
    }

    // --- Process Yield Pools (Complex Mapping) ---
    let lidoStEthApr = null;
    const aaveSupplyRates = {
      'stETH': 1.5,
      'ETH': 1.2,
      'USDC': 4.2
    };
    const aaveBorrowRates = {
      'USDC': 2.5,
      'ETH': 3.0
    };
    // Add placeholders for other yields like EigenLayer base APR, Renzo/Kelp boosts
    let eigenLayerBaseApr = null; // Hard to determine definitively from /pools
    let renzoApyBoost = 2.0; // Placeholder until specific pool logic is added
    let kelpApyBoost = 1.5; // Placeholder until specific pool logic is added

    if (yieldPoolsData.status === 'fulfilled' && yieldPoolsData.value?.data) {
      const pools = yieldPoolsData.value.data;
      // Find Lido stETH pool on Ethereum (example logic, might need refinement)
      const lidoPool = pools.find(p =>
        p.project === 'lido' &&
        p.chain === 'Ethereum' &&
        p.symbol === 'stETH' // Assuming symbol is reliable
      );
      lidoStEthApr = lidoPool ? safeGet(lidoPool, 'apyBase', null) : null; // Or apy, apyReward etc.

      // Find Aave V3 Ethereum pools (example logic)
      const aavePools = pools.filter(p =>
        p.project === 'aave-v3' &&
        p.chain === 'Ethereum'
      );

      const aaveSymbolMap = {
        'stETH': 'stETH', // Check DefiLlama symbols
        'wstETH': 'wstETH',
        'ETH': 'WETH', // Often WETH on DefiLlama
        'USDC': 'USDC',
        'USDT': 'USDT',
        'DAI': 'DAI'
      };

      for (const pool of aavePools) {
        const symbol = pool.symbol;
        const internalSymbol = Object.keys(aaveSymbolMap).find(key => aaveSymbolMap[key] === symbol);
        if (internalSymbol) {
          // Use apyBase for supply, apyBaseBorrow for borrow if available
          aaveSupplyRates[internalSymbol] = safeGet(pool, 'apyBase', null) || 1.5; // Placeholder if null
          aaveBorrowRates[internalSymbol] = (safeGet(pool, 'apyBaseBorrow', null) ?? safeGet(pool, 'apyBorrow', null)) || 2.5; // Placeholder if null
        }
      }
      // TODO: Find pools/logic for EigenLayer base APR, Renzo/Kelp boosts

    } else if (yieldPoolsData.status === 'rejected') {
      console.warn("Failed to fetch yield pools data:", yieldPoolsData.reason);
      // Set default placeholder values for Aave if API fetch fails
      aaveSupplyRates['stETH'] = 1.5;
      aaveSupplyRates['ETH'] = 1.2;
      aaveSupplyRates['USDC'] = 4.2;
      aaveBorrowRates['USDC'] = 2.5;
      aaveBorrowRates['ETH'] = 3.0;
    }

    // --- TODO: Process Uniswap Data ---
    // Need to add call to Promise.allSettled above, e.g., defillama.volumes.dexsProtocol('uniswap-v3')
    // Then process the result here to extract pool fees, liquidity, volume for relevant pairs.
    // TODO: Integrate 1inch API for better swap optimization
    const uniswapPools = {};

    // --- Process Gas Data from Blocknative or Etherscan ---
    let gasCurrent = { slow: null, average: null, fast: null };
    let gasEstimation = { stake: null, swap: null, supply: null, borrow: null };

    if (blocknativeGasData.status === 'fulfilled' && blocknativeGasData.value?.blockPrices?.length > 0) {
      const gasPrices = blocknativeGasData.value.blockPrices[0].estimatedPrices;
      gasCurrent = {
        slow: gasPrices.find(p => p.confidence === 70)?.price || null,
        average: gasPrices.find(p => p.confidence === 80)?.price || null,
        fast: gasPrices.find(p => p.confidence === 90)?.price || null
      };
      // Rough estimation for common DeFi actions (multiplier based on typical gas usage)
      gasEstimation = {
        stake: gasCurrent.average ? gasCurrent.average * 100000 * 0.000000001 : null, // Approx 100k gas
        swap: gasCurrent.average ? gasCurrent.average * 150000 * 0.000000001 : null, // Approx 150k gas
        supply: gasCurrent.average ? gasCurrent.average * 120000 * 0.000000001 : null, // Approx 120k gas
        borrow: gasCurrent.average ? gasCurrent.average * 180000 * 0.000000001 : null // Approx 180k gas
      };
      console.log("Fetched gas data from Blocknative.");
    } else if (etherscanGasData.status === 'fulfilled' && etherscanGasData.value?.result) {
      const result = etherscanGasData.value.result;
      gasCurrent = {
        slow: result.SafeGasPrice ? parseInt(result.SafeGasPrice) : null,
        average: result.ProposeGasPrice ? parseInt(result.ProposeGasPrice) : null,
        fast: result.FastGasPrice ? parseInt(result.FastGasPrice) : null
      };
      // Rough estimation for common DeFi actions
      gasEstimation = {
        stake: gasCurrent.average ? gasCurrent.average * 100000 * 0.000000001 : null,
        swap: gasCurrent.average ? gasCurrent.average * 150000 * 0.000000001 : null,
        supply: gasCurrent.average ? gasCurrent.average * 120000 * 0.000000001 : null,
        borrow: gasCurrent.average ? gasCurrent.average * 180000 * 0.000000001 : null
      };
      console.log("Fetched gas data from Etherscan (fallback).");
    } else {
      console.warn("No gas data available from Blocknative or Etherscan.");
    }

    console.log("Finished fetching protocol data.");
    // --- Construct Final Data Object ---
    return {
      lido: {
        stETHAPR: lidoStEthApr,
        tvl: lidoTvl,
        fee: 0.1 // Assumed constant
      },
      aave: { // Aave V3 Ethereum assumed
        supplyRates: aaveSupplyRates,
        borrowRates: aaveBorrowRates,
        ltv: {} // TODO: LTVs usually require config/manual mapping, not easily available via API
      },
      eigenLayer: {
        baseAPR: eigenLayerBaseApr, // Placeholder
        tvl: eigenLayerTvl
      },
      renzo: {
        apyBoost: renzoApyBoost, // Placeholder
        tvl: renzoTvl,
        fee: 0.15 // Assumed constant
      },
      kelp: {
        apyBoost: kelpApyBoost, // Placeholder
        tvl: kelpTvl,
        fee: 0.10 // Assumed constant
      },
      yearn: {
        tvl: yearnTvl,
        vaultAPYs: yearnVaultAPYs // Populated with specific vault data from yieldPoolsData
      },
      uniswap: { // Uniswap V3 assumed
        pools: uniswapPools // TODO: Populate from API call, consider 1inch integration when API key is verified
      },
      gas: { // Updated with data from Blocknative or Etherscan
        current: gasCurrent,
        estimation: gasEstimation,
        ethPrice: ethPrice
      }
    };
  } catch (error) {
    console.error("Critical error in getProtocolData:", error);
    // Fallback or re-throw depending on desired error handling
    // Returning an empty structure might be safer than throwing
    return { /* return empty or default structure */ };
    // throw new Error(`Failed to get protocol data: ${error.message}`);
  }
}
