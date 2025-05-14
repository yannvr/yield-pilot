// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

import defillama from 'defillama-api';
// Import protocol plugins
import * as protocolLido from '../../plugins/protocol-lido/index.js';
import * as protocolAave from '../../plugins/protocol-aave/index.js';
import * as protocolRenzo from '../../plugins/protocol-renzo/index.js';

// Try to import other protocol plugins if they exist
let protocolBittensor = null;
try {
  protocolBittensor = await import('../../plugins/protocol-bittensor/index.js');
} catch (error) {
  console.log('Bittensor plugin not available:', error.message);
}

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
 * Fetches real-time data from protocol plugins or fallback to DefiLlama API
 *
 * @returns {Promise<Object>} Current protocol data
 */
export async function getProtocolData() {
  console.log("Fetching protocol data...");
  const missingData = {};

  try {
    // Initialize protocol data objects
    let lidoData = null;
    let aaveData = null;
    let renzoDataFromPlugin = null;
    let kelpData = null;
    let eigenLayerData = null;
    let yearnData = null;
    let gasData = null;

    // Fetch data from protocol plugins in parallel
    const pluginPromises = [];

    // Lido data from protocol-lido plugin
    pluginPromises.push(
      protocolLido.getProtocolData()
        .then(data => {
          console.log("Fetched Lido data from protocol plugin");
          lidoData = {
            stETHAPR: data.apr,
            tvl: data.totalStaked,
            fee: 0.1
          };
        })
        .catch(error => {
          console.warn("Failed to fetch Lido data from plugin:", error.message);
          missingData.lidoPlugin = `Failed to fetch from plugin: ${error.message}`;
        })
    );

    // Aave data from protocol-aave plugin
    pluginPromises.push(
      protocolAave.getProtocolData()
        .then(data => {
          console.log("Fetched Aave data from protocol plugin");
          aaveData = {
            supplyRates: data.supplyRates,
            borrowRates: data.borrowRates,
            ltv: data.ltvRatios,
            liquidationThresholds: data.liquidationThresholds,
            totalSupply: data.totalSupply,
            totalBorrow: data.totalBorrow,
            totalLiquidityUSD: data.totalLiquidityUSD,
            totalBorrowsUSD: data.totalBorrowsUSD,
            source: data.source
          };
        })
        .catch(error => {
          console.warn("Failed to fetch Aave data from plugin:", error.message);
          missingData.aavePlugin = `Failed to fetch from plugin: ${error.message}`;
        })
    );

    // Renzo data from protocol-renzo plugin
    pluginPromises.push(
      protocolRenzo.getProtocolData()
        .then(data => {
          console.log("Fetched Renzo data from protocol plugin");
          renzoDataFromPlugin = {
            apyBoost: data.apyBoost,
            tvl: data.tvl,
            source: data.source
          };
        })
        .catch(error => {
          console.warn("Failed to fetch Renzo data from plugin:", error.message);
          missingData.renzoPlugin = `Failed to fetch from plugin: ${error.message}`;
        })
    );

    // Fetch data from DefiLlama for protocols without plugins
    const [
      protocolTvls,
      ethPriceData,
      yieldPoolsData,
      yearnDefiLlamaData
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
          'Authorization': process.env.BLOCKNATIVE_API_KEY || ''
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
        const etherscanResponse = await fetch(`https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${process.env.ETHERSCAN_API_KEY || ''}`);
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
    const yearnTvl = yearnDefiLlamaData.status === 'fulfilled'
      ? safeGet(yearnDefiLlamaData.value, 'tvl', null)
      : null;

    if (yearnDefiLlamaData.status === 'rejected') {
      console.warn("Failed to fetch Yearn Finance data:", yearnDefiLlamaData.reason);
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
    // Only use this if we don't have plugin data for Lido
    let lidoStEthApr = null;
    const aaveSupplyRates = {};
    const aaveBorrowRates = {};
    let eigenLayerBaseApr = null;
    let renzoApyBoostDefillama = null;
    let kelpApyBoost = null;

    if (yieldPoolsData.status === 'fulfilled' && yieldPoolsData.value?.data) {
      const pools = yieldPoolsData.value.data;

      // Only fetch Lido data from DefiLlama if plugin failed
      if (!lidoData) {
        // Find Lido stETH pool on Ethereum
        const lidoPool = pools.find(p =>
          p.project === 'lido' &&
          p.chain === 'Ethereum' &&
          p.symbol === 'stETH'
        );
        lidoStEthApr = lidoPool ? safeGet(lidoPool, 'apyBase', null) : null;
        if (!lidoStEthApr) missingData.lidoStEthApr = 'Lido stETH APR not found in yield pools';
      }

      // Only fetch Aave data from DefiLlama if plugin failed
      if (!aaveData) {
        // Find Aave V3 Ethereum pools
        const aavePools = pools.filter(p =>
          p.project === 'aave-v3' &&
          p.chain === 'Ethereum'
        );
        const aaveSymbolMap = {
          'stETH': 'stETH',
          'wstETH': 'wstETH',
          'ETH': 'WETH',
          'USDC': 'USDC',
          'USDT': 'USDT',
          'DAI': 'DAI'
        };
        for (const pool of aavePools) {
          const symbol = pool.symbol;
          const internalSymbol = Object.keys(aaveSymbolMap).find(key => aaveSymbolMap[key] === symbol);
          if (internalSymbol) {
            const supply = safeGet(pool, 'apyBase', null);
            const borrow = safeGet(pool, 'apyBaseBorrow', null) ?? safeGet(pool, 'apyBorrow', null);
            if (supply === null) missingData[`aaveSupply_${internalSymbol}`] = `Aave supply rate for ${internalSymbol} not found`;
            if (borrow === null) missingData[`aaveBorrow_${internalSymbol}`] = `Aave borrow rate for ${internalSymbol} not found`;
            aaveSupplyRates[internalSymbol] = supply;
            aaveBorrowRates[internalSymbol] = borrow;
          }
        }
      }

      // Find EigenLayer, Renzo, and Kelp data
      const eigenLayerPool = pools.find(p =>
        p.project === 'eigenlayer' &&
        p.chain === 'Ethereum'
      );
      eigenLayerBaseApr = eigenLayerPool ? safeGet(eigenLayerPool, 'apyBase', null) : null;
      if (!eigenLayerBaseApr) missingData.eigenLayerBaseApr = 'EigenLayer base APR not found';

      // Only fetch Renzo from DefiLlama if plugin failed or didn't provide data
      if (!renzoDataFromPlugin || renzoDataFromPlugin.apyBoost === null) {
        const renzoPool = pools.find(p =>
          p.project === 'renzoprotocol' &&
          p.chain === 'Ethereum'
        );
        renzoApyBoostDefillama = renzoPool ? safeGet(renzoPool, 'apyBase', null) : null;
        if (!renzoApyBoostDefillama && !renzoDataFromPlugin?.source) missingData.renzoApyBoost = 'Renzo APY boost not found in DefiLlama';
      }

      const kelpPool = pools.find(p =>
        p.project === 'kelp-dao' &&
        p.chain === 'Ethereum'
      );
      kelpApyBoost = kelpPool ? safeGet(kelpPool, 'apyBase', null) : null;
      if (!kelpApyBoost) missingData.kelpApyBoost = 'Kelp APY boost not found';

    } else if (yieldPoolsData.status === 'rejected') {
      console.warn("Failed to fetch yield pools data:", yieldPoolsData.reason);
      missingData.yieldPools = 'Yield pools data fetch failed';
    }

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
      missingData.gasData = 'Gas data not available from any source';
    }

    // Wait for all plugin promises to complete
    await Promise.allSettled(pluginPromises);

    console.log("Finished fetching protocol data.");

    // --- Construct Final Data Object ---
    return {
      lido: lidoData || {
        stETHAPR: lidoStEthApr,
        tvl: lidoTvl,
        fee: 0.1
      },
      aave: aaveData || {
        supplyRates: aaveSupplyRates,
        borrowRates: aaveBorrowRates,
        ltv: {},
        liquidationThresholds: {},
        totalSupply: {},
        totalBorrow: {},
        source: Object.keys(aaveSupplyRates).length > 0 ? 'DefiLlama (fallback)' : 'No Data Available'
      },
      eigenLayer: {
        baseAPR: eigenLayerBaseApr,
        tvl: eigenLayerTvl
      },
      renzo: renzoDataFromPlugin || {
        apyBoost: renzoApyBoostDefillama,
        tvl: renzoTvl,
        fee: 0.15,
        source: renzoApyBoostDefillama ? 'DefiLlama (fallback)' : 'No Data Available'
      },
      kelp: {
        apyBoost: kelpApyBoost,
        tvl: kelpTvl,
        fee: 0.10
      },
      yearn: {
        tvl: yearnTvl,
        vaultAPYs: yearnVaultAPYs
      },
      uniswap: {
        pools: {}
      },
      gas: {
        current: gasCurrent,
        estimation: gasEstimation,
        ethPrice: ethPrice
      },
      missingData,
      dataSources: {
        lido: lidoData?.source || (lidoStEthApr ? 'DefiLlama' : 'No Data Available'),
        aave: aaveData?.source || (Object.keys(aaveSupplyRates).length > 0 ? 'DefiLlama (fallback)' : 'No Data Available'),
        renzo: renzoDataFromPlugin?.source || (renzoApyBoostDefillama ? 'DefiLlama (fallback)' : 'No Data Available'),
        eigenLayer: eigenLayerBaseApr ? 'DefiLlama' : 'No Data Available',
        kelp: kelpApyBoost ? 'DefiLlama' : 'No Data Available',
        gas: gasCurrent.average ? (blocknativeGasData.status === 'fulfilled' && blocknativeGasData.value?.blockPrices?.length > 0 ? 'Blocknative' : (etherscanGasData.status === 'fulfilled' && etherscanGasData.value?.result ? 'Etherscan' : 'No Data Available')) : 'No Data Available'
      }
    };
  } catch (error) {
    console.error("Critical error in getProtocolData:", error);
    // Return an empty structure with error information
    return {
      error: error.message,
      missingData: {
        critical: 'Failed to fetch protocol data due to critical error'
      }
    };
  }
}
