const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting CMON DAO deployment...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "MON\n");

  // Deploy MON Token (mock token for testing)
  console.log("📝 Deploying MON Token...");
  const MONToken = await hre.ethers.getContractFactory("MONToken");
  const monToken = await MONToken.deploy();
  await monToken.waitForDeployment();
  const monAddress = await monToken.getAddress();
  console.log("✅ MON Token deployed to:", monAddress, "\n");

  // Deploy CMON Token
  console.log("📝 Deploying CMON Token...");
  const CMONToken = await hre.ethers.getContractFactory("CMONToken");
  const cmonToken = await CMONToken.deploy();
  await cmonToken.waitForDeployment();
  const cmonAddress = await cmonToken.getAddress();
  console.log("✅ CMON Token deployed to:", cmonAddress, "\n");

  // Deploy Staking Contract
  console.log("📝 Deploying CMON Staking...");
  const CMONStaking = await hre.ethers.getContractFactory("CMONStaking");
  const treasury = deployer.address; // Using deployer as treasury for now
  const staking = await CMONStaking.deploy(monAddress, cmonAddress, treasury);
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log("✅ CMON Staking deployed to:", stakingAddress, "\n");

  // Deploy Governance Contract
  console.log("📝 Deploying CMON Governance...");
  const CMONGovernance = await hre.ethers.getContractFactory("CMONGovernance");
  const governance = await CMONGovernance.deploy(cmonAddress);
  await governance.waitForDeployment();
  const governanceAddress = await governance.getAddress();
  console.log("✅ CMON Governance deployed to:", governanceAddress, "\n");

  // Setup: Add staking contract as CMON minter
  console.log("⚙️  Setting up permissions...");
  const addMinterTx = await cmonToken.addMinter(stakingAddress);
  await addMinterTx.wait();
  console.log("✅ Staking contract added as CMON minter\n");

  // Save deployment addresses
  const deploymentInfo = {
    network: "monad-testnet",
    chainId: 10143,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      MONToken: monAddress,
      CMONToken: cmonAddress,
      CMONStaking: stakingAddress,
      CMONGovernance: governanceAddress,
      Treasury: treasury
    }
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  fs.writeFileSync(
    path.join(deploymentsDir, "monad-testnet.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("📄 Deployment info saved to deployments/monad-testnet.json\n");

  console.log("🎉 Deployment Summary:");
  console.log("========================");
  console.log("MON Token:", monAddress);
  console.log("CMON Token:", cmonAddress);
  console.log("Staking:", stakingAddress);
  console.log("Governance:", governanceAddress);
  console.log("Treasury:", treasury);
  console.log("========================\n");

  console.log("✨ CMON DAO deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
