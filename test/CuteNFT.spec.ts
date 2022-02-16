import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers } from 'hardhat';

import { CuteNFT__factory } from '../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

describe('CuteNFT', () => {
  let cuteNftContract: Contract;
  let owner: SignerWithAddress;
  let minter: SignerWithAddress;

  // eg marketplace
  let operator: SignerWithAddress;

  before(async () => {
    [owner, minter, operator] = await ethers.getSigners();

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

      await expect(await cuteNftContract.connect(minter).mint(1, { value: ethers.utils.parseEther('0.005') })).to.emit(
        cuteNftContract,
        'MintNft',
      );
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
  describe('transfer', async () => {
    it('should successfully transfer token', async () => {
      await expect(await cuteNftContract.connect(minter).transferFrom(minter.address, owner.address, 1)).to.emit(
        cuteNftContract,
        'Transfer',
      );
    });

    it('should allow operator to transfer token', async () => {
      await expect(await cuteNftContract.connect(minter).setApprovalForAll(operator.address, true)).to.emit(
        cuteNftContract,
        'ApprovalForAll',
      );

      expect(await cuteNftContract.isApprovedForAll(minter.address, operator.address)).to.be.true;

      await expect(await cuteNftContract.connect(operator).transferFrom(minter.address, owner.address, 2)).to.emit(
        cuteNftContract,
        'Transfer',
      );
    });
  });

  describe('getTotalSupply', async () => {
    it('should return total supply', async () => {
      expect(await cuteNftContract.totalSupply()).to.be.eq(10000);
    });
  });

  // retrieve baseUrl
  describe('baseUrl', async () => {
    it('should return baseUri', async () => {
      expect(await cuteNftContract.baseTokenURI()).to.be.not.empty;
    });

    it('should set baseUri', async () => {
      expect(await cuteNftContract.connect(owner).setBaseURI('google.com')).to.emit(cuteNftContract, 'BaseURIChanged');
    });
  });
});
