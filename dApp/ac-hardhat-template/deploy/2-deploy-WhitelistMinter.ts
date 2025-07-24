  import { HardhatRuntimeEnvironment } from "hardhat/types";
  import { DeployFunction } from "hardhat-deploy/types";
  import fs from 'fs';

  const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy, get } = deployments;
    const { deployer } = await getNamedAccounts();

    const merkleData = JSON.parse(fs.readFileSync('merkleRoot.json', 'utf-8'));
    const merkleRoot = merkleData.merkleRoot;

    const nftDeployment = await get("NFTCollection"); // 💡
    const nftAddress = nftDeployment.address;

    console.log("====================");
    console.log(hre.network.name);
    console.log("====================");

    console.log("====================");
    console.log("Deploy WhitelistMinter Contract");
    console.log("====================");

    await deploy("WhitelistMinter", {
      contract: "WhitelistMinter",
      args: [nftAddress,merkleRoot],
      from: deployer,
      log: true,
      autoMine: true,
      skipIfAlreadyDeployed: false,
    });
  };

  func.tags = ["Whitelist"];
  func.dependencies = ["NFT"];
  export default func;
