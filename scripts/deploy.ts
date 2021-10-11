import fs from 'fs';
import { ethers } from 'hardhat';

async function main() {
  try {
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying contract with account: ${deployer.address}`);

    const balance = await deployer.getBalance();
    console.log(`Account balance: ${balance.toString()}`);

    const nftFactory = await ethers.getContractFactory('CuteNFT');

    // contract
    const nftContract = await nftFactory.deploy();
    console.log(`Contract Address: ${nftContract.address}`);

    const data = {
      address: nftContract.address,
      abi: JSON.parse(nftContract.interface.format('json') as string),
    };
    fs.writeFileSync(`${__dirname}/generated/nftContract.json`, JSON.stringify(data));

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
