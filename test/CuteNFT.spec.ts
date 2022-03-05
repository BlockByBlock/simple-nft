import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers } from 'hardhat';

import { CuteNFT__factory } from '../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Provider } from '@ethersproject/abstract-provider';

describe('CuteNFT', () => {
  let cuteNftContract: Contract;
  let owner: SignerWithAddress;

  // whitelist
  let minterOne: SignerWithAddress;
  let minterTwo: SignerWithAddress;

  // public
  let minterThree: SignerWithAddress;
  let minterFour: SignerWithAddress;

  let provider: Provider;

  // eg marketplace
  let operator: SignerWithAddress;

  before(async () => {
    [owner, minterOne, minterTwo, minterThree, minterFour] = await ethers.getSigners();
    provider = owner.provider as Provider;

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

  describe('setBaseURI', async () => {
    it('should set baseuri as owner', async () => {
      await cuteNftContract.connect(owner).setBaseURI('https://cutenft.s3-us-west-1.amazonaws.com/metadata/');
      expect(await cuteNftContract.tokenURI('1')).to.eq('https://cutenft.s3-us-west-1.amazonaws.com/metadata/1');
    });

    it('should set new baseuri as owner', async () => {
      await cuteNftContract.connect(owner).setBaseURI('https://asdfghjkl.mypinata.cloud/ipfs/qwertyuiop/');
      expect(await cuteNftContract.tokenURI('11')).to.eq('https://asdfghjkl.mypinata.cloud/ipfs/qwertyuiop/11');
    });
  });

  describe('allowlistMint()', async () => {
    it('should not mint without price', async () => {
      expect(cuteNftContract.connect(minterOne).allowlistMint()).to.be.revertedWith('allowlist sale has not begun yet');
    });

    it('should successfully mint as minterOne', async () => {
      await cuteNftContract
        .connect(owner)
        .setSaleConfig('1645115250', ethers.utils.parseEther('0.1'), ethers.utils.parseEther('0.5'), '12345678');

      const preBalance = await minterOne.getBalance();
      const postBalance = preBalance.sub(ethers.utils.parseEther('0.1'));

      await cuteNftContract.connect(minterOne).allowlistMint({ value: ethers.utils.parseEther('0.1') });
      expect(await cuteNftContract.numberMinted(minterOne.address)).to.eq(1);
      expect(await minterOne.getBalance()).to.be.closeTo(postBalance, 1000000000000000);
      expect(await provider.getBalance(cuteNftContract.address)).to.eq(ethers.utils.parseEther('0.1'));
    });

    it('should revert if mint beyond allowed number', async () => {
      expect(cuteNftContract.connect(minterOne).allowlistMint({ value: ethers.utils.parseEther('0.1') }))
        .to.be.revertedWith('not eligible for allowlist mint')
      expect(await cuteNftContract.numberMinted(minterOne.address)).to.eq(1);
    });

    it('should successfully mint as minterTwo', async () => {
      const preBalance = await minterTwo.getBalance();
      const postBalance = preBalance.sub(ethers.utils.parseEther('0.2'));

      await cuteNftContract.connect(minterTwo).allowlistMint({ value: ethers.utils.parseEther('0.1') });
      await cuteNftContract.connect(minterTwo).allowlistMint({ value: ethers.utils.parseEther('0.1') });

      expect(await cuteNftContract.numberMinted(minterTwo.address)).to.eq(2);
      expect(await minterTwo.getBalance()).to.be.closeTo(postBalance, 1000000000000000);
      expect(await provider.getBalance(cuteNftContract.address)).to.eq(ethers.utils.parseEther('0.3'));
    });

    it('should not mint as minterThree', async () => {
      expect(cuteNftContract.connect(minterThree).allowlistMint()).to.be.revertedWith(
        'not eligible for allowlist mint',
      );
    });
  });

  describe('publicSaleMint()', async () => {
    it('should not public mint with wrong key', async () => {
      expect(cuteNftContract.connect(minterThree).publicSaleMint('1', '1234567', { value: ethers.utils.parseEther('0.5') }))
        .to.be.revertedWith('called with incorrect public sale key');
    });

    it('should successfully mint as minterThree', async () => {
      const preBalance = await minterThree.getBalance();
      const postBalance = preBalance.sub(ethers.utils.parseEther('0.5'));

      await cuteNftContract.connect(minterThree).publicSaleMint('1', '12345678', { value: ethers.utils.parseEther('0.5') });
      expect(await cuteNftContract.numberMinted(minterThree.address)).to.eq('1');
      expect(await minterThree.getBalance()).to.be.closeTo(postBalance, 1000000000000000);
      expect(await provider.getBalance(cuteNftContract.address)).to.eq(ethers.utils.parseEther('0.8'));
    });

    it('should revert if mint beyond allowed number', async () => {
      expect(cuteNftContract.connect(minterOne).publicSaleMint('6', '12345678', { value: ethers.utils.parseEther('0.5') }))
        .to.be.revertedWith('can not mint this many');
    });

    it('should successfully mint max as minterFour', async () => {
      const preBalance = await minterFour.getBalance();
      const postBalance = preBalance.sub(ethers.utils.parseEther('2.5'));

      await cuteNftContract.connect(minterFour).publicSaleMint('5', '12345678', { value: ethers.utils.parseEther('2.5') });

      expect(await cuteNftContract.numberMinted(minterFour.address)).to.eq(5);
      expect(await minterFour.getBalance()).to.be.closeTo(postBalance, 1000000000000000);
      expect(await provider.getBalance(cuteNftContract.address)).to.eq(ethers.utils.parseEther('3.3'));
    });
  });

  describe('withdrawMoney()', async () => {
    it('should not withdraw as non owner', async () => {
      const balance = await provider.getBalance(cuteNftContract.address);
      expect(cuteNftContract.connect(minterOne).withdrawMoney()).to.be.revertedWith('Ownable');
      expect(await provider.getBalance(cuteNftContract.address)).to.eq(balance);
    });

    it('should withdraw as owner', async () => {
      const balance = await provider.getBalance(cuteNftContract.address);
      const ownerBalance = await owner.getBalance();
      const postBalance = ownerBalance.add(balance);
  
      await cuteNftContract.connect(owner).withdrawMoney();
      expect(await provider.getBalance(cuteNftContract.address)).to.eq('0');
      expect(await owner.getBalance()).to.be.closeTo(postBalance, 1000000000000000);
    });
  });
});
