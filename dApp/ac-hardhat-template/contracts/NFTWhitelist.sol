// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

abstract contract NFTWhitelist {
    bytes32 public merkleRoot;

    event ChangeMerkleRoot(bytes32 newRoot);

    function _verifyWhitelist(address account, bytes32[] calldata proof) internal view returns (bool) {
        bytes32 leaf = keccak256(abi.encodePacked(account));
        return MerkleProof.verify(proof, merkleRoot, leaf);
    }

    function setMerkleRoot(bytes32 _merkleRoot) external virtual;
}
