import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deployer address:", deployer.address);

    // Deploy contract
    const Token = await ethers.getContractFactory("MyMintableToken");
    const token = await Token.deploy();
    await token.waitForDeployment();

    const contractAddress = await token.getAddress();
    console.log("MyMintableToken deployed to:", contractAddress);

    // Mint 1000 token cho deployer
    const mintTx = await token.mint(deployer.address, ethers.parseUnits("1000", 18));
    await mintTx.wait();
    console.log(`✅ Minted 1000 tokens to ${deployer.address}`);

    // In balance của deployer
    const balance = await token.balanceOf(deployer.address);
    console.log(`Deployer balance: ${ethers.formatUnits(balance, 18)} MTK`);
}

main().catch((error) => {
    console.error("Error:", error);
    process.exitCode = 1;
});
