// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@rari-capital/solmate/src/tokens/ERC721.sol";
import "@rari-capital/solmate/src/auth/Owned.sol";
import "@rari-capital/solmate/src/utils/ReentrancyGuard.sol";

contract CuteSolmateNFT is ERC721, Owned, ReentrancyGuard {
    uint256 public immutable maxPerAddressDuringMint;
    uint256 public immutable reserveForTeam;
    uint256 public totalSupply;
    uint256 public collectionSize;

    // uint256 public constant totalSupply = 10_000;

    struct SaleConfig {
        uint32 publicSaleStartTime;
        uint64 mintlistPrice;
        uint64 publicPrice;
        uint32 publicSaleKey;
    }

    SaleConfig public saleConfig;

    mapping(address => uint256) public allowlist;

    constructor(
        uint256 maxBatchSize_,
        uint256 collectionSize_,
        uint256 reserveForTeam_
    ) ERC721("Cute", "CUTE") Owned(msg.sender) {
        maxPerAddressDuringMint = maxBatchSize_;
        reserveForTeam = reserveForTeam_;
        require(
            reserveForTeam_ <= collectionSize_,
            "larger collection size needed"
        );
    }

    modifier callerIsUser() {
        require(tx.origin == msg.sender, "The caller is another contract");
        _;
    }

    function setSaleConfig(
        uint32 publicSaleStartTime,
        uint64 mintlistPriceWei,
        uint64 publicPriceWei,
        uint32 key
    ) external onlyOwner {
        saleConfig = SaleConfig(
            publicSaleStartTime,
            mintlistPriceWei,
            publicPriceWei,
            key
        );
    }

    function seedAllowlist(
        address[] memory addresses,
        uint256[] memory numSlots
    ) external onlyOwner {
        require(
            addresses.length == numSlots.length,
            "addresses does not match numSlots length"
        );
        for (uint256 i = 0; i < addresses.length; i++) {
            allowlist[addresses[i]] = numSlots[i];
        }
    }

    // For marketing etc.
    function devMint(uint256 quantity) external onlyOwner {
        require(
            totalSupply + quantity <= reserveForTeam,
            "too many already minted before dev mint"
        );
        require(
            quantity % maxPerAddressDuringMint == 0,
            "can only mint a multiple of the maxBatchSize"
        );
        uint256 numChunks = quantity / maxPerAddressDuringMint;
        for (uint256 i = 0; i < numChunks; i++) {
            _safeMint(msg.sender, maxPerAddressDuringMint);
        }
    }

    function isPublicSaleOn(
        uint256 publicPriceWei,
        uint256 publicSaleKey,
        uint256 publicSaleStartTime
    ) public view returns (bool) {
        return
            publicPriceWei != 0 &&
            publicSaleKey != 0 &&
            block.timestamp >= publicSaleStartTime;
    }

    function refundIfOver(uint256 price) private {
        require(msg.value >= price, "Need to send more ETH.");
        if (msg.value > price) {
            payable(msg.sender).transfer(msg.value - price);
        }
    }

    function allowlistMint() external payable callerIsUser {
        uint256 price = uint256(saleConfig.mintlistPrice);
        require(price != 0, "allowlist sale has not begun yet");
        require(allowlist[msg.sender] > 0, "not eligible for allowlist mint");
        require(totalSupply + 1 <= collectionSize, "reached max supply");
        allowlist[msg.sender]--;
        _safeMint(msg.sender, 1);
        refundIfOver(price);
    }

    function publicSaleMint(uint256 quantity, uint256 callerPublicSaleKey)
        external
        payable
        callerIsUser
    {
        SaleConfig memory config = saleConfig;
        uint256 publicSaleKey = uint256(config.publicSaleKey);
        uint256 publicPrice = uint256(config.publicPrice);
        uint256 publicSaleStartTime = uint256(config.publicSaleStartTime);
        require(
            publicSaleKey == callerPublicSaleKey,
            "called with incorrect public sale key"
        );

        require(
            isPublicSaleOn(publicPrice, publicSaleKey, publicSaleStartTime),
            "public sale has not begun yet"
        );
        require(totalSupply + quantity <= collectionSize, "reached max supply");
        require(
            balanceOf(msg.sender) + quantity <= maxPerAddressDuringMint,
            "can not mint this many"
        );
        _safeMint(msg.sender, quantity);
        refundIfOver(publicPrice * quantity);
    }

    // metadata URI
    string private _baseTokenURI;

    function _baseURI() internal view returns (string memory) {
        return _baseTokenURI;
    }

    function setBaseURI(string calldata baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(
            ownerOf(tokenId) != address(0),
            "ERC721Metadata: URI query for nonexistent token"
        );
        return
            bytes(_baseURI()).length > 0
                ? string(abi.encodePacked(_baseURI(), toString(tokenId)))
                : "";
    }

    function withdrawMoney() external onlyOwner nonReentrant {
        (bool success, ) = msg.sender.call{value: address(this).balance}("");
        require(success, "Transfer failed.");
    }

    /**
     * @notice utility to convert uint256 to string for vaultID
     * @param value uint256
     */
    function toString(uint256 value) internal pure returns (string memory) {
        // From Openzeppelin's implementation - MIT licence
        // https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/Strings.sol#L15-L35

        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
