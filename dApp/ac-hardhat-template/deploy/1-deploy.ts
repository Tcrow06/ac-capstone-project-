  import { HardhatRuntimeEnvironment } from "hardhat/types";
  import { DeployFunction } from "hardhat-deploy/types";
  import fs from 'fs';


  const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const merkleData = JSON.parse(fs.readFileSync('merkleRoot.json', 'utf-8'));
    const merkleRoot = merkleData.merkleRoot;

    console.log("====================");
    console.log(hre.network.name);
    console.log("====================");

    console.log("====================");
    console.log("Deploy NFTWhitelistSale Contract");
    console.log("====================");

    await deploy("NFTWhitelistSale", {
      contract: "NFTWhitelistSale",
      args: [merkleRoot],
      from: deployer,
      log: true,
      autoMine: true,
      skipIfAlreadyDeployed: false,
    });
  };

  func.tags = ["deploy"];
  export default func;
