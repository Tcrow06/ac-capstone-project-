import { expect } from "chai";
import { ethers } from "hardhat";
import { NFTWhitelistSale } from "../typechain";

describe("NFTWhitelistSale", function () {
  let nft: NFTWhitelistSale;
  let owner: any;
  let user1: any;
  let user2: any;
  const mintPrice = ethers.parseEther("0.0001");

  beforeEach(async () => {
    [owner, user1, user2] = await ethers.getSigners();

    const NFTFactory = await ethers.getContractFactory("NFTWhitelistSale");
    nft = (await NFTFactory.deploy()) as NFTWhitelistSale;
    await nft.waitForDeployment();
  });

  it("should deploy with correct name and symbol", async () => {
    expect(await nft.name()).to.equal("NFTWhitelistSale");
    expect(await nft.symbol()).to.equal("NWLS");
  });

  it("should allow owner to add to whitelist", async () => {
    await expect(nft.connect(owner).addToWhitelist(user1.address))
      .to.emit(nft, "AddedToWhitelist")
      .withArgs(user1.address);

    expect(await nft.whitelist(user1.address)).to.be.true;
  });

  it("should not allow non-whitelisted address to mint", async () => {
    await expect(
      nft.connect(user1).mint(1, { value: mintPrice })
    ).to.be.revertedWith("Not whitelisted");
  });

  it("should mint NFT for whitelisted user", async () => {
    await nft.addToWhitelist(user1.address);

    await expect(nft.connect(user1).mint(1, { value: mintPrice }))
      .to.emit(nft, "Minted")
      .withArgs(user1.address, 1);

    expect(await nft.ownerOf(1)).to.equal(user1.address);
    expect(await nft.mintedCount(user1.address)).to.equal(1);
  });

  it("should reject mint if amount is zero", async () => {
    await nft.addToWhitelist(user1.address);
    await expect(
      nft.connect(user1).mint(0, { value: mintPrice })
    ).to.be.revertedWith("Amount must be greater than 0");
  });

  it("should reject mint if insufficient ETH", async () => {
    await nft.addToWhitelist(user1.address);
    await expect(
      nft.connect(user1).mint(1, { value: ethers.parseEther("0.00001") })
    ).to.be.revertedWith("Insufficient ETH");
  });

  it("should not allow minting more than MAX_PER_WALLET", async () => {
    await nft.addToWhitelist(user1.address);

    // Mint MAX_PER_WALLET = 5
    for (let i = 0; i < 5; i++) {
      await nft.connect(user1).mint(1, { value: mintPrice });
    }

    await expect(
      nft.connect(user1).mint(1, { value: mintPrice })
    ).to.be.revertedWith("Mint limit reached. You can only buy 0 more NFT(s).");
  });

  it("should allow owner to withdraw ETH", async () => {
    await nft.addToWhitelist(user1.address);
    await nft.connect(user1).mint(2, { value: mintPrice * 2n });

    const balanceBefore = await ethers.provider.getBalance(owner.address);

    const tx = await nft.connect(owner).withdraw();
    const receipt = await tx.wait();
    const gasUsed = receipt?.gasUsed * receipt?.gasPrice!;

    const balanceAfter = await ethers.provider.getBalance(owner.address);

    expect(balanceAfter).to.be.greaterThan(balanceBefore - gasUsed);
  });

  it("should emit event when deleting from whitelist", async () => {
    await nft.addToWhitelist(user2.address);
    await expect(nft.deleteFromWhitelist(user2.address))
      .to.emit(nft, "DeletedFromWhitelist")
      .withArgs(user2.address);

    expect(await nft.whitelist(user2.address)).to.be.false;
  });

  it("should return correct tokenURI", async () => {
  await nft.addToWhitelist(user1.address);
  await nft.connect(user1).mint(1, { value: mintPrice });
  const uri = await nft.tokenURI(1);
  expect(uri).to.equal("https://687144367ca4d06b34b9e592.mockapi.io/metadata/1");
});
it("should return all minted tokens correctly", async () => {
  await nft.addToWhitelist(user1.address);
  await nft.connect(user1).mint(2, { value: mintPrice * BigInt(2) });


  const result = await nft.getAllMintedTokens();

  expect(result[0]).to.equal(nft.target); // contract address
  expect(result[1].length).to.equal(2); // ids
  expect(result[2][0]).to.equal(user1.address);
  expect(result[3][0]).to.equal("https://687144367ca4d06b34b9e592.mockapi.io/metadata/1");
});

});
