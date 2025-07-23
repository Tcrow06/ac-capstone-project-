// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

abstract contract NFTMintable {
    uint public MAX_PER_WALLET = 5;
    uint public price = 0.0001 ether;

    mapping(address => uint8) public mintedCount;

    event Minted(address indexed user, uint8 amount);
    event ChangePrice(uint _price);
    event ChangeMaxPerWallet(uint _max);

    function _canMint(address user, uint8 amount) internal view returns (bool, string memory) {
        if (mintedCount[user] + amount > MAX_PER_WALLET) {
            uint remain = MAX_PER_WALLET - mintedCount[user];
            return (false, string(abi.encodePacked("Mint limit reached. You can only buy ", remain, " more NFT(s).")));
        }
        return (true, "");
    }

    function setterPrice(uint _price) external virtual;

    function setterMaxPerWallet(uint8 _MAX_PER_WALLET) external virtual;
}
