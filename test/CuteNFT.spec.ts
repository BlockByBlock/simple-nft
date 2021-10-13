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

    // start mint
    await cuteNftContract.connect(owner).setStart(true);
  });

  describe('mint', async () => {
    it('should successfully mint', async () => {      
      await expect(
        await cuteNftContract.connect(minter).mint(1, { value: ethers.utils.parseEther('0.005') }),
      ).to.emit(cuteNftContract, 'MintNft');
    });
  });
});
