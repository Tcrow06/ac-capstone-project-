  import { expect } from "chai";
  import { ethers } from "hardhat";
  import { NFTCollection } from "../typechain";

  describe("NFTCollection", function () {
    let NFTCollection;
    let nft: any;
    let owner: any;
    let addr1:any;

    beforeEach(async () => {
      [owner, addr1] = await ethers.getSigners();
      NFTCollection = await ethers.getContractFactory("NFTCollection");
      nft = (await NFTCollection.deploy()) as NFTCollection;
      await nft.waitForDeployment();
    });


    it("should deploy with correct name and symbol", async () => {
      expect(await nft.name()).to.equal("NFTWhitelistSale");
      expect(await nft.symbol()).to.equal("NWLS");
    });

    it("should mint token correctly", async () => {
      await nft.mintTo(addr1.address);
      expect(await nft.ownerOf(1)).to.equal(addr1.address);
      expect(await nft.tokenURI(1)).to.equal("https://687f2992efe65e520088915c.mockapi.io/metadata/1");
    });

    it("should return correct getAllMintedTokens info", async () => {
      await nft.mintTo(owner.address);

      const [addrs, tokenIds, owners, tokenURIs] = await nft.getAllMintedTokens();

      expect(tokenIds.map(Number)).to.deep.equal([1]);
      expect(owners).to.deep.equal([owner.address]);
      expect(tokenURIs[0]).to.include("/1");
    });

    it("should emit Minted event", async () => {
      await expect(nft.mintTo(addr1.address))
        .to.emit(nft, "Minted")
        .withArgs(addr1.address, 1);
    });
  });
