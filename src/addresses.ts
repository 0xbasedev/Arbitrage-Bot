// src/addresses.ts for multi-chain/L2 and flashloan support

// Add your chain here! Chain key should match your environment/config
export const CHAIN_CONFIGS = {
  ethereum: {
    WETH_ADDRESS: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    FACTORY_ADDRESSES: [
      '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f', // Uniswap
      '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac', // Sushi
      // add more here
    ],
    FLASHLOAN_PROVIDER: '0x7BeA39867e4169DBe237d55C8242a8f2fcdCC387', // Aave mainnet LendingPool V2
  },
  arbitrum: {
    WETH_ADDRESS: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
    FACTORY_ADDRESSES: [
      '0xc35DADB65012ec5796536bD9864eD8773aBc74C4', // Sushi
      '0x1F98431c8aD98523631AE4a59f267346ea31F984', // Uniswap V3
      // add more
    ],
    FLASHLOAN_PROVIDER: '0xC9BdeEd33CD01541e1eeD10f9021b1051B7F6B4a', // Aave Arbitrum LendingPool V2
  },
  base: {
    WETH_ADDRESS: '0x4200000000000000000000000000000000000006', // Base mainnet WETH
    FACTORY_ADDRESSES: [
      '0x858E3312ed3A876947EA49d572A7C42DE08af7EE', // Sushi Base
    ],
    FLASHLOAN_PROVIDER: '', // TODO: Insert provider if available
  },
  polygon: {
    WETH_ADDRESS: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
    FACTORY_ADDRESSES: [
      '0xc35DADB65012ec5796536bD9864eD8773aBc74C4', // Sushi
      '0x5757371414417b8c6caad45baef941abc7d3ab32', // QuickSwap
      // add more
    ],
    FLASHLOAN_PROVIDER: '0x8dff5e27ea6b7ac08ebfdf9eb090f32ee9a30fcf', // Aave Polygon LendingPool V2
  },
  bsc: {
    WETH_ADDRESS: '0xBB4CdB9CBd36B01BD1cBaEBF2De08d9173bc095c', // PancakeSwap WBNB
    FACTORY_ADDRESSES: [
      '0xca143ce32fe78f1f7019d7d551a6402fc5350c73', // PancakeSwap V2
    ],
    FLASHLOAN_PROVIDER: '', // PancakeSwap supports flashswap via router/pair
  },
  avalanche: {
    WETH_ADDRESS: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
    FACTORY_ADDRESSES: [
      '0x9Ad6C38BE94206cA50bb0d90783181662f0Cfa10', // TraderJoe
      '0xc35DADB65012ec5796536bD9864eD8773aBc74C4', // Sushi
    ],
    FLASHLOAN_PROVIDER: '', // TODO: Add provider if available
  },
  pulsechain: {
    WETH_ADDRESS: '', // Not available, TODO
    FACTORY_ADDRESSES: [],
    FLASHLOAN_PROVIDER: '',
  },
  monad: {
    WETH_ADDRESS: '', // TODO
    FACTORY_ADDRESSES: [],
    FLASHLOAN_PROVIDER: '',
  },
  sonic: {
    WETH_ADDRESS: '', // TODO
    FACTORY_ADDRESSES: [],
    FLASHLOAN_PROVIDER: '',
  },
  unichain: {
    WETH_ADDRESS: '', // TODO
    FACTORY_ADDRESSES: [],
    FLASHLOAN_PROVIDER: '',
  },
  hyperevm: {
    WETH_ADDRESS: '', // TODO
    FACTORY_ADDRESSES: [],
    FLASHLOAN_PROVIDER: '',
  },
};

export const ACTIVE_CHAIN = process.env.L2_CHAIN || 'ethereum';
export const USE_FLASHLOAN = process.env.USE_FLASHLOAN === "true";
export const WETH_ADDRESS = CHAIN_CONFIGS[ACTIVE_CHAIN].WETH_ADDRESS;
export const FACTORY_ADDRESSES = CHAIN_CONFIGS[ACTIVE_CHAIN].FACTORY_ADDRESSES;
export const FLASHLOAN_PROVIDER = CHAIN_CONFIGS[ACTIVE_CHAIN].FLASHLOAN_PROVIDER;
