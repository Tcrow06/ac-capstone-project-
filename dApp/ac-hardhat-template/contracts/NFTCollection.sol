// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract NFTCollection is ERC721 {
    using Strings for uint256;

    string private baseTokenURI="https://687f2992efe65e520088915c.mockapi.io/metadata/";
    uint256 public nextTokenId = 1;

    event Minted(address indexed to, uint256 tokenId);

    constructor() ERC721("NFTWhitelistSale", "NWLS") {}

    function mintTo(address to) external {
        uint256 tokenId = nextTokenId++;
        _safeMint(to, tokenId);
        emit Minted(to, tokenId);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        return string(abi.encodePacked(baseTokenURI, tokenId.toString()));
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
