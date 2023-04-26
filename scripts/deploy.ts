const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const GovernanceTokenFactory = await hre.ethers.getContractFactory("GovernanceTokenFactory");
  const governanceTokenFactory = await GovernanceTokenFactory.deploy();

  await governanceTokenFactory.deployed();

  console.log("GovernanceTokenFactory deployed to:", governanceTokenFactory.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });