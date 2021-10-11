require('dotenv').config();

import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';

const ALCHEMY_KEY = process.env.ALCHEMY_KEY || '';
const PRIVATE_KEY = process.env.PRIVATE_KEY || '';
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || '';

module.exports = {
  solidity: "0.8.0",
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
    ropsten: {
      url: `https://eth-ropsten.alchemyapi.io/v2/${ALCHEMY_KEY}`,
      accounts: [`0x${PRIVATE_KEY}`],
      chainId: 3,
    },
    mumbai: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${ALCHEMY_KEY}`,
      accounts: [`0x${PRIVATE_KEY}`],
      chainId: 80001,
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  typechain: {
    outDir: 'typechain',
    target: 'ethers-v5',
  },
};
