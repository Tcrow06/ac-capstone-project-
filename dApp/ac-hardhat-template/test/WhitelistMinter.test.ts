import { expect } from "chai";
import { ethers } from "hardhat";
import { parseEther, ZeroHash } from "ethers";
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";
import { BigNumber } from "@ethersproject/bignumber";


describe("WhitelistMinter", function () {
  let nft: any, minter: any;
  let owner: any, whitelisted: any, notWhitelisted: any;
  let merkleTree: MerkleTree, root: string, proof: string[];

  beforeEach(async () => {
    [owner, whitelisted, notWhitelisted] = await ethers.getSigners();

    const leaf = keccak256(whitelisted.address);
    merkleTree = new MerkleTree([leaf], keccak256, { sortPairs: true });
    root = merkleTree.getHexRoot();
    proof = merkleTree.getHexProof(leaf);

    const NFT = await ethers.getContractFactory("NFTCollection");
    nft = await NFT.deploy();
    await nft.waitForDeployment();

    const Minter = await ethers.getContractFactory("WhitelistMinter");
    minter = await Minter.deploy(await nft.getAddress(), root);
    await minter.waitForDeployment();

  });

  it("should mint NFT for whitelisted address", async () => {
    await minter.connect(whitelisted).mint(1, proof, {
      value: parseEther("0.0001"),
    });

    expect(await nft.ownerOf(1)).to.equal(whitelisted.address);
  });

  it("should fail for non-whitelisted address", async () => {
    await expect(
      minter.connect(notWhitelisted).mint(1, [], {
        value: parseEther("0.0001"),
      })
    ).to.be.revertedWith("Not whitelisted");
  });

  it("should reject if sent less ETH than required", async () => {
    await expect(
      minter.connect(whitelisted).mint(1, proof, {
        value: parseEther("0.00001"),
      })
    ).to.be.revertedWith("Insufficient ETH");
  });

  it("should reject minting more than maxPerWallet", async () => {
    await minter.connect(owner).setMaxPerWallet(2);

    await minter.connect(whitelisted).mint(2, proof, {
      value: parseEther("0.0002"),
    });

    await expect(
      minter.connect(whitelisted).mint(1, proof, {
        value: parseEther("0.0001"),
      })
    ).to.be.revertedWith("Mint limit exceeded");
  });

  it("should allow owner to set price", async () => {
    await minter.setPrice(parseEther("0.0005"));
    expect(await minter.price()).to.equal(parseEther("0.0005"));
  });

  it("should allow owner to change Merkle root", async () => {
    await minter.setMerkleRoot(ZeroHash);
    expect(await minter.merkleRoot()).to.equal(ZeroHash);
  });

  it("should allow owner to withdraw ETH", async () => {
  await minter.connect(whitelisted).mint(1, proof, {
    value: parseEther("0.0001"),
  });

  const ownerBalanceBefore = await ethers.provider.getBalance(owner.address); // bigint

  const tx = await minter.withdraw();
  const receipt = await tx.wait();
  let gasUsed: bigint, gasPrice:bigint;
  gasUsed = receipt.gasUsed; // bigint
  gasPrice = receipt.gasPrice ?? 0n; // bigint or undefined
  const gasCost  = gasUsed * gasPrice; // bigint

  const receivedAmount = parseEther("0.0001"); // bigint
  const delta = parseEther("0.00001"); // bigint

  const expected = ownerBalanceBefore + receivedAmount - gasCost; // bigint

  const ownerBalanceAfter = await ethers.provider.getBalance(owner.address); // bigint

  // So sánh kiểu bigint → dùng Math.abs(a - b) <= delta
  const difference = ownerBalanceAfter > expected
    ? ownerBalanceAfter - expected
    : expected - ownerBalanceAfter;

  expect(difference <= delta).to.be.true;
});



});
