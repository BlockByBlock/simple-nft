//Contract based on [https://docs.openzeppelin.com/contracts/3.x/erc721](https://docs.openzeppelin.com/contracts/3.x/erc721)
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract CuteNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    event MintNft(address indexed sender, uint256 startWith, uint256 times);

    // supply counters
    uint256 public totalNfts;
    uint256 public totalCount = 9999;

    // max mint per tx
    uint256 public maxBatch = 10;

    // price per mint 0.05E
    uint256 public price = 5000000000000000;

    // mint start
    bool private started;

    constructor() public ERC721("CuteNFT", "CUTE") {}

    function setStart(bool _start) public onlyOwner {
        started = _start;
    }

    function mintNFT(
        address recipient,
        string memory tokenURI,
        uint256 _times
    ) payable public {
        require(started, "mint not started");

        require(
            _times > 0 && _times <= maxBatch,
            "exceed max mint per tx"
        );
        require(totalNfts + _times <= totalCount, "mint over!");

        require(msg.value == _times * price, "value error, please check price.");
        payable(owner()).transfer(msg.value);


        _tokenIds.increment();

        uint256 newItemId = _tokenIds.current();
        _mint(recipient, newItemId);
        _setTokenURI(newItemId, tokenURI);

        emit MintNft(_msgSender(), totalNfts+1, _times);

        for(uint256 i=0; i< _times; i++){
            _mint(_msgSender(), 1 + totalNfts++);
        }
    }
}
