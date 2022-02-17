import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers } from 'hardhat';

import { CuteNFT__factory } from '../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

describe('CuteNFT', () => {
  let cuteNftContract: Contract;
  let owner: SignerWithAddress;

  // whitelist
  let minterOne: SignerWithAddress;
  let minterTwo: SignerWithAddress;

  // public
  let minterThree: SignerWithAddress;
  let minterFour: SignerWithAddress;

  before(async () => {
    [owner, minterOne, minterTwo, minterThree, minterFour] = await ethers.getSigners();

    const cuteNftFactory = new CuteNFT__factory(owner);
    cuteNftContract = await cuteNftFactory.deploy('5', '10000', '20');
  });

  describe('setSaleConfig()', async () => {
    it('should successfully set config as owner', async () => {
      await cuteNftContract.connect(owner).setSaleConfig('1645115250', '0', ethers.utils.parseEther('0.5'), '12345678');

      const saleConfig = await cuteNftContract.saleConfig();
      expect(saleConfig[0]).to.eq(1645115250);
      expect(saleConfig[1]).to.eq(ethers.utils.parseEther('0'));
      expect(saleConfig[2]).to.eq(ethers.utils.parseEther('0.5'));
      expect(saleConfig[3]).to.eq(12345678);
    });

    it('should not set config as non-owner', async () => {
      expect(
        cuteNftContract.connect(minterOne).setSaleConfig('1645115250', '0', ethers.utils.parseEther('0.5'), '12345678'),
      ).to.be.revertedWith('Ownable');
    });
  });

  describe('seedAllowlist()', async () => {
    it('should successfully set list as owner', async () => {
      await cuteNftContract.connect(owner).seedAllowlist([minterOne.address, minterTwo.address], ['1', '2']);

      expect(await cuteNftContract.allowlist(minterOne.address)).to.eq(1);
      expect(await cuteNftContract.allowlist(minterTwo.address)).to.eq(2);
    });

    it('should not set list as non-owner', async () => {
      expect(
        cuteNftContract.connect(minterOne).seedAllowlist([minterOne.address, minterTwo.address], ['1', '2']),
      ).to.be.revertedWith('Ownable');
    });
  });

  describe('devMint()', async () => {
    it('should not mint as owner exceeding reserve', async () => {
      expect(cuteNftContract.connect(owner).devMint('21')).to.be.revertedWith(
        'too many already minted before dev mint',
      );
    });

    it('should not mint as owner without batch size', async () => {
      expect(cuteNftContract.connect(owner).devMint('19')).to.be.revertedWith(
        'can only mint a multiple of the maxBatchSize',
      );
    });

    it('should successfully mint as owner', async () => {
      await cuteNftContract.connect(owner).devMint('20');
      expect(await cuteNftContract.numberMinted(owner.address)).to.eq(20);
    });

    it('should not mint as owner after limit', async () => {
      expect(cuteNftContract.connect(owner).devMint('5')).to.be.revertedWith('too many already minted before dev mint');
    });

    it('should not set mint as non-owner', async () => {
      expect(cuteNftContract.connect(minterOne).devMint('20')).to.be.revertedWith('Ownable');
    });
  });

  describe('allowlistMint()', async () => {
    it('should not mint without price', async () => {
      expect(cuteNftContract.connect(minterOne).allowlistMint()).to.be.revertedWith('allowlist sale has not begun yet');
    });

    it('should successfully mint as minterOne', async () => {
      // todo: test balance
      await cuteNftContract
        .connect(owner)
        .setSaleConfig('1645115250', ethers.utils.parseEther('0.1'), ethers.utils.parseEther('0.5'), '12345678');

      await cuteNftContract.connect(minterOne).allowlistMint({ value: ethers.utils.parseEther('0.1') });
      expect(await cuteNftContract.numberMinted(minterOne.address)).to.eq(1);
    });

    it('should revert if mint beyond allowed number', async () => {
      expect(cuteNftContract.connect(minterOne).allowlistMint({ value: ethers.utils.parseEther('0.1') }))
        .to.be.revertedWith('not eligible for allowlist mint')
      expect(await cuteNftContract.numberMinted(minterOne.address)).to.eq(1);
    });

    it('should successfully mint as minterTwo', async () => {
      await cuteNftContract.connect(minterTwo).allowlistMint({ value: ethers.utils.parseEther('0.1') });
      await cuteNftContract.connect(minterTwo).allowlistMint({ value: ethers.utils.parseEther('0.1') });
      expect(await cuteNftContract.numberMinted(minterTwo.address)).to.eq(2);
    });

    it('should not mint as minterThree', async () => {
      expect(cuteNftContract.connect(minterThree).allowlistMint()).to.be.revertedWith(
        'not eligible for allowlist mint',
      );
    });
  });
});
