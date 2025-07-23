// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./NFTBase.sol";
import "./NFTWhitelist.sol";
import "./NFTMintable.sol";
import "./NFTAdmin.sol";

contract NFTWhitelistSale is NFTBase, NFTWhitelist, NFTMintable, NFTAdmin {
    constructor(bytes32 _merkleRoot)
        NFTBase("NFTWhitelistSale", "NWLS", "https://687f2992efe65e520088915c.mockapi.io/metadata/")
        Ownable(msg.sender)
    {
        merkleRoot = _merkleRoot;
    }

    function mint(uint8 amount, bytes32[] calldata merkleProof) external payable {
        require(amount > 0, "Amount must be greater than 0");
        require(msg.value >= price * amount, "Insufficient ETH");

        (bool canMint, string memory reason) = _canMint(msg.sender, amount);
        require(canMint, reason);
        require(_verifyWhitelist(msg.sender, merkleProof), "Not whitelisted");

        mintedCount[msg.sender] += amount;
        for (uint256 i = 0; i < amount; i++) {
            _safeMint(msg.sender, nextTokenId++);
        }

        emit Minted(msg.sender, amount);
    }

    function setterPrice(uint _price) external override onlyOwner {
        price = _price;
        emit ChangePrice(price);
    }

    function setterMaxPerWallet(uint8 _MAX_PER_WALLET) external override onlyOwner {
        MAX_PER_WALLET = _MAX_PER_WALLET;
        emit ChangeMaxPerWallet(MAX_PER_WALLET);
    }

    function setMerkleRoot(bytes32 _merkleRoot) external override onlyOwner {
        merkleRoot = _merkleRoot;
        emit ChangeMerkleRoot(_merkleRoot);
    }

    function getAllMintedTokens()
        external
        view
        returns (address, uint[] memory, address[] memory, string[] memory)
    {
        uint total = nextTokenId - 1;
        uint[] memory ids = new uint[](total);
        address[] memory owners = new address[](total);
        string[] memory uris = new string[](total);

        for (uint i = 0; i < total; i++) {
            ids[i] = i + 1;
            owners[i] = ownerOf(i + 1);
            uris[i] = tokenURI(i + 1);
        }

        return (address(this), ids, owners, uris);
    }
}
