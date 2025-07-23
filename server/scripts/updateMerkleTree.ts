import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';
import fs from 'fs';
import path from 'path';

const whitelistPath = path.join(__dirname, '../whitelist.json');
const merkleRootPath = path.join(__dirname, '../merkleRoot.json');
const proofsPath = path.join(__dirname, '../proofs.json');

export function updateMerkleTree(): { merkleRoot: string } {
  const whitelist: string[] = JSON.parse(fs.readFileSync(whitelistPath, 'utf-8'));

  const leaves = whitelist.map(addr => keccak256(addr.toLowerCase()));
  const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  const merkleRoot = tree.getHexRoot();

  // Ghi merkleRoot
  fs.writeFileSync(merkleRootPath, JSON.stringify({ merkleRoot }, null, 2));

  // Ghi proofs.json
  const proofs: Record<string, string[]> = {};
  whitelist.forEach((addr) => {
    const proof = tree.getHexProof(keccak256(addr.toLowerCase()));
    proofs[addr.toLowerCase()] = proof;
  });
  fs.writeFileSync(proofsPath, JSON.stringify(proofs, null, 2));

  return { merkleRoot };
}
