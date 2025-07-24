// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./NFTCollection.sol";

contract WhitelistMinter is Ownable {
    using MerkleProof for bytes32[];

    NFTCollection public immutable nft;
    bytes32 public merkleRoot;
    uint256 public price = 0.0001 ether;
    uint8 public maxPerWallet = 5;

    mapping(address => uint8) public mintedCount;

    event Minted(address indexed user, uint256 amount);
    event PriceChanged(uint256 newPrice);
    event MaxPerWalletChanged(uint8 newLimit);
    event MerkleRootUpdated(bytes32 newRoot);
    event Withdrawn(uint256 amount);

    constructor(address nftAddress, bytes32 _merkleRoot) Ownable(msg.sender){
        nft = NFTCollection(nftAddress);
        merkleRoot = _merkleRoot;
    }

    modifier onlyWhitelisted(bytes32[] calldata proof) {
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        require(proof.verify(merkleRoot, leaf), "Not whitelisted");
        _;
    }

    function mint(uint8 amount, bytes32[] calldata proof)
        external
        payable
        onlyWhitelisted(proof)
    {
        require(amount > 0, "Amount must be greater than 0");
        require(msg.value >= price * amount, "Insufficient ETH");

        uint8 alreadyMinted = mintedCount[msg.sender];
        require(alreadyMinted + amount <= maxPerWallet, "Mint limit exceeded");

        mintedCount[msg.sender] += amount;

        for (uint256 i = 0; i < amount; i++) {
            nft.mintTo(msg.sender);
        }
        
        emit Minted(msg.sender, amount);
    }

    // --- Admin Functions ---

    function setPrice(uint256 newPrice) external onlyOwner {
        price = newPrice;
        emit PriceChanged(newPrice);
    }

    function setMaxPerWallet(uint8 newLimit) external onlyOwner {
        maxPerWallet = newLimit;
        emit MaxPerWalletChanged(newLimit);
    }

    function setMerkleRoot(bytes32 newRoot) external onlyOwner {
        merkleRoot = newRoot;
        emit MerkleRootUpdated(newRoot);
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner()).transfer(balance);
        emit Withdrawn(balance);
    }
}
