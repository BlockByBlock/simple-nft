require('dotenv').config();

import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";

const ALCHEMY_KEY = process.env.ALCHEMY_KEY || '';
const PRIVATE_KEY = process.env.PRIVATE_KEY || '';

module.exports = {
  solidity: "0.8.0",
  defaultNetwork: "ropsten",
  networks: {
    hardhat: {},
    ropsten: {
      url: `https://eth-ropsten.alchemyapi.io/v2/${ALCHEMY_KEY}`,
      accounts: [`0x${PRIVATE_KEY}`],
      chainId: 3,
    },
  },
};
