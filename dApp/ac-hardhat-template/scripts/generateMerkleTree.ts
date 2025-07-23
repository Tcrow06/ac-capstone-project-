// scripts/generateMerkleTree.ts
import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';
import fs from 'fs';

const whitelist = [
    '0x1e392ad503413f607fe006ba35d0e84cc36b72de',
    '0x5b38da6a701c568545dcfcb03fcb875f56beddc4',
    '0x4b20993bc481177ec7e8f571cecae8a9e22c02db'
];

const leaves = whitelist.map(addr => keccak256(addr));
const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });

const merkleRoot = tree.getHexRoot();
console.log('Merkle Root:', merkleRoot);

// ✨ Export root to a file
fs.writeFileSync('merkleRoot.json', JSON.stringify({ merkleRoot }, null, 2));
const proofs: { [address: string]: string[] } = {};

whitelist.forEach(address => {
  const proof = tree.getHexProof(keccak256(address));
  proofs[address.toLowerCase()] = proof;
});

fs.writeFileSync('proofs.json', JSON.stringify(proofs, null, 2));



