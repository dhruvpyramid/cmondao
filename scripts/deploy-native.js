const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting CMON DAO deployment (NATIVE MON)...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "MON\n");

  // Deploy CMON Token
  console.log("📝 Deploying CMON Token...");
  const CMONToken = await hre.ethers.getContractFactory("CMONToken");
  const cmonToken = await CMONToken.deploy();
  await cmonToken.waitForDeployment();
  const cmonAddress = await cmonToken.getAddress();
  console.log("✅ CMON Token deployed to:", cmonAddress);

  // Deploy CMON Staking (Native)
  console.log("📝 Deploying CMON Staking (Native MON)...");
  const CMONStakingNative = await hre.ethers.getContractFactory("CMONStakingNative");
  const staking = await CMONStakingNative.deploy(
    cmonAddress,
    deployer.address // Treasury
  );
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log("✅ CMON Staking deployed to:", stakingAddress);

  // Deploy CMON Governance
  console.log("📝 Deploying CMON Governance...");
  const CMONGovernance = await hre.ethers.getContractFactory("CMONGovernance");
  const governance = await CMONGovernance.deploy(
    cmonAddress
  );
  await governance.waitForDeployment();
  const governanceAddress = await governance.getAddress();
  console.log("✅ CMON Governance deployed to:", governanceAddress);

  // Setup permissions
  console.log("⚙️  Setting up permissions...");
  await cmonToken.addMinter(stakingAddress);
  console.log("✅ Staking contract added as CMON minter");

  // Save deployment info
  const deploymentInfo = {
    network: "monad-testnet",
    chainId: 10143,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      CMONToken: cmonAddress,
      CMONStaking: stakingAddress,
      CMONGovernance: governanceAddress,
      Treasury: deployer.address
    },
    note: "Uses NATIVE MON (gas token) for staking"
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  fs.writeFileSync(
    path.join(deploymentsDir, "monad-testnet-native.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\n📄 Deployment info saved to deployments/monad-testnet-native.json");

  console.log("\n🎉 Deployment Summary:");
  console.log("========================");
  console.log("CMON Token:", cmonAddress);
  console.log("Staking (Native):", stakingAddress);
  console.log("Governance:", governanceAddress);
  console.log("Treasury:", deployer.address);
  console.log("========================");
  console.log("\n✨ CMON DAO deployment completed successfully!");
  console.log("💡 Now using NATIVE MON for staking!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
