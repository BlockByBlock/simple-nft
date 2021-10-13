import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers } from 'hardhat';

import { CuteNFT__factory } from '../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

describe('CuteNFT', () => {
  let cuteNftContract: Contract;
  let owner: SignerWithAddress;
  let minter: SignerWithAddress;

  before(async () => {
    [owner, minter] = await ethers.getSigners();

    const cuteNftFactory = new CuteNFT__factory(owner);
    cuteNftContract = await cuteNftFactory.deploy('https://example.com/');
  });

  describe('mint', async () => {
    it('should not mint as contract start is false', async () => {
      await expect(
        cuteNftContract.connect(minter).mint(1, { value: ethers.utils.parseEther('0.005') }),
      ).to.revertedWith('mint not started');
    });

    it('should successfully mint as a minter', async () => {
      // start mint
      await cuteNftContract.connect(owner).setStart(true);

      await expect(
        await cuteNftContract.connect(minter).mint(1, { value: ethers.utils.parseEther('0.005') }),
      ).to.emit(cuteNftContract, 'MintNft');
    });

    it('should not mint as a minter with insufficient ether', async () => {
      await expect(
        cuteNftContract.connect(minter).mint(1, { value: ethers.utils.parseEther('0.0049') }),
      ).to.revertedWith('value error, please check price');
    });

    it('should not mint as a minter with insufficient ether for 2', async () => {
      await expect(
        cuteNftContract.connect(minter).mint(2, { value: ethers.utils.parseEther('0.005') }),
      ).to.revertedWith('value error, please check price');
    });

    it('should not mint as a minter with 0 token', async () => {
      await expect(
        cuteNftContract.connect(minter).mint(0, { value: ethers.utils.parseEther('0.005') }),
      ).to.revertedWith('incorrect mint number');
    });

    it('should pay owner for 1 mint', async () => {
      const beforeMintBalance = await owner.getBalance();
      await cuteNftContract.connect(minter).mint(1, { value: ethers.utils.parseEther('0.005') });
      expect(await owner.getBalance()).to.be.eq(beforeMintBalance.add(ethers.utils.parseEther('0.005')));
    });
  });

  // transfer token
  // transfer

  // retrieve baseUrl
  // get totalsupply
});
