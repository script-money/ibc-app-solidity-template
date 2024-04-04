import '@nomicfoundation/hardhat-toolbox';
import { vars } from 'hardhat/config';
import '@nomicfoundation/hardhat-foundry';

// Run 'npx hardhat vars setup' to see the list of variables that need to be set
const pk1 = vars.get('PRIVATE_KEY_1');
const pk2 = vars.get('PRIVATE_KEY_2');

const config = {
  solidity: {
    version: '0.8.23',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200, // Optimize for a typical number of runs
      },
    },
  },
  networks: {
    // for Base testnet
    base: {
      url: 'https://sepolia.base.org',
      accounts: [pk1],
    },
    // for OP testnet
    optimism: {
      url: 'https://sepolia.optimism.io',
      accounts: [pk2],
    },
  },
  defaultNetwork: 'optimism',
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
  etherscan: {
    apiKey: {
      optimism: process.env.OP_BLOCKSCOUT_API_KEY || '',
      base: process.env.BASE_BLOCKSCOUT_API_KEY || '',
    },
    customChains: [
      {
        network: 'base',
        chainId: 84532,
        urls: {
          apiURL: 'https://base-sepolia.blockscout.com/api',
          browserURL: 'https://base-sepolia.blockscout.com',
        },
      },
      {
        network: 'optimism',
        chainId: 11155420,
        urls: {
          apiURL: 'https://optimism-sepolia.blockscout.com/api',
          browserURL: 'https://optimism-sepolia.blockscout.com',
        },
      },
    ],
  },
};

export default config;
