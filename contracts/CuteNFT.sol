//Contract based on [https://docs.openzeppelin.com/contracts/3.x/erc721](https://docs.openzeppelin.com/contracts/3.x/erc721)
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract CuteNFT is ERC721URIStorage, Ownable {
    using Strings for uint256;
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    event MintNft(address indexed sender, uint256 startWith, uint256 times);
    event BaseURIChanged(string baseURI);

    // supply counters
    uint256 public constant totalSupply = 10000;    // etherscan requirement
    uint256 public constant MAX_PER_MINT = 10;
    uint256 public constant PRICE = 5000000000000000; // price per mint 0.005E
    address public constant devAddress =
        0x6D173418E4D31C4f000098C4d95Ff737AC133C7a;

    uint256 public numTokensMinted;

    // mint start
    bool private started;

    string public baseTokenURI;

    // Set baseUrl during constructor?
    constructor(string memory initialURI) public ERC721("CuteNFT", "CUTE") {
        baseTokenURI = initialURI;
    }

    function setStart(bool _start) public onlyOwner {
        started = _start;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseTokenURI;
    }

    function setBaseURI(string memory baseURI) public onlyOwner {
        baseTokenURI = baseURI;
        emit BaseURIChanged(baseURI);
    }

    function mint(uint256 _times) public payable {
        require(started, "mint not started");

        require(_times > 0 && _times <= MAX_PER_MINT, "incorrect mint number");
        require(numTokensMinted + _times <= totalSupply, "mint over!");

        require(
            msg.value == _times * PRICE,
            "value error, please check price."
        );
        // pay direct to contract owner
        payable(owner()).transfer(msg.value);

        for (uint256 i = 0; i < _times; i++) {
            _tokenIds.increment();

            uint256 newItemId = _tokenIds.current();
            _mint(_msgSender(), 1 + numTokensMinted++);
            _setTokenURI(
                newItemId,
                string(
                    abi.encodePacked(
                        baseTokenURI,
                        newItemId.toString(),
                        ".json"
                    )
                )
            );
            
            emit MintNft(_msgSender(), totalSupply + 1, _times);
        }
    }

    function withdrawAll() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "Insufficent balance");
        _withdraw(devAddress, balance);
    }

    function _withdraw(address _address, uint256 _amount) private {
        (bool success, ) = _address.call{value: _amount}("");
        require(success, "Failed to withdraw Ether");
    }
}
