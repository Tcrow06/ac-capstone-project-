// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract NFTWhitelistSale is ERC721, Ownable {
    using Strings for uint256;

    uint public MAX_PER_WALLET = 5;
    uint public price = 0.0001 ether;
    uint public nextTokenId = 1;
    string public baseURI = "https://687f2992efe65e520088915c.mockapi.io/metadata/";
    bytes32 public merkleRoot;

    mapping(address => uint8) public mintedCount;

    event Minted(address indexed user, uint8 amount);
    event Withdrawn(uint amount);
    event ChangePrice(uint _price);
    event ChangeMaxPerWallet(uint _MAX_PER_WALLET);
    event ChangeMerkleRoot(bytes32 newRoot);

    constructor(bytes32 _merkleRoot) ERC721("NFTWhitelistSale", "NWLS") Ownable(msg.sender) {
        merkleRoot = _merkleRoot;
    }

    function mint(uint8 amount, bytes32[] calldata merkleProof)
        external
        payable
    {
        require(amount > 0, "Amount must be greater than 0");
        require(msg.value >= price * amount, "Insufficient ETH");
        require(
            mintedCount[msg.sender] + amount <= MAX_PER_WALLET,
            string(
                abi.encodePacked(
                    "Mint limit reached. You can only buy ",
                    (MAX_PER_WALLET - mintedCount[msg.sender]).toString(),
                    " more NFT(s)."
                )
            )
        );

        // Verify Merkle Proof
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        require(MerkleProof.verify(merkleProof, merkleRoot, leaf), "Not whitelisted");

        mintedCount[msg.sender] += amount;
        for (uint256 i = 0; i < amount; i++) {
            _safeMint(msg.sender, nextTokenId++);
        }

        emit Minted(msg.sender, amount);
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner()).transfer(balance);
        emit Withdrawn(balance);
    }

    function setterPrice(uint _price) external onlyOwner {
        price = _price;
        emit ChangePrice(price);
    }

    function setterMaxPerWallet(uint8 _MAX_PER_WALLET) external onlyOwner {
        MAX_PER_WALLET = _MAX_PER_WALLET;
        emit ChangeMaxPerWallet(MAX_PER_WALLET);
    }

    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
        emit ChangeMerkleRoot(_merkleRoot);
    }

    function tokenURI(uint tokenId) public view override returns (string memory) {
        return string(abi.encodePacked(baseURI, Strings.toString(tokenId)));
    }

    function getAllMintedTokens()
        external
        view
        returns (
            address,
            uint[] memory,
            address[] memory,
            string[] memory
        )
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
