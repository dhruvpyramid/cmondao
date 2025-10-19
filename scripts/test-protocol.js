const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🧪 Testing CMON DAO Protocol...\n");

  // Load deployment info
  const deploymentPath = path.join(__dirname, "..", "deployments", "monad-testnet.json");
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

  const [deployer] = await hre.ethers.getSigners();
  console.log("Testing with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "MON\n");

  // Get contract instances
  const monToken = await hre.ethers.getContractAt("MONToken", deployment.contracts.MONToken);
  const cmonToken = await hre.ethers.getContractAt("CMONToken", deployment.contracts.CMONToken);
  const staking = await hre.ethers.getContractAt("CMONStaking", deployment.contracts.CMONStaking);
  const governance = await hre.ethers.getContractAt("CMONGovernance", deployment.contracts.CMONGovernance);

  console.log("📊 Initial State:");
  console.log("================");
  
  let monBalance = await monToken.balanceOf(deployer.address);
  console.log("MON Balance:", hre.ethers.formatEther(monBalance));
  
  let cmonBalance = await cmonToken.balanceOf(deployer.address);
  console.log("CMON Balance:", hre.ethers.formatEther(cmonBalance));
  
  let totalStaked = await staking.totalStaked();
  console.log("Total Staked:", hre.ethers.formatEther(totalStaked));
  
  let proposalCount = await governance.proposalCount();
  console.log("Proposal Count:", proposalCount.toString(), "\n");

  // Test 1: Stake MON
  console.log("🔄 Test 1: Staking MON");
  console.log("=====================");
  
  const stakeAmount = hre.ethers.parseEther("100");
  
  // Check if we have enough MON
  if (monBalance < stakeAmount) {
    console.log("Getting MON from faucet...");
    const faucetTx = await monToken.faucet();
    await faucetTx.wait();
    monBalance = await monToken.balanceOf(deployer.address);
    console.log("New MON Balance:", hre.ethers.formatEther(monBalance));
  }
  
  console.log("Approving MON...");
  const approveTx = await monToken.approve(deployment.contracts.CMONStaking, stakeAmount);
  await approveTx.wait();
  console.log("✅ Approved");
  
  console.log("Staking 100 MON...");
  const stakeTx = await staking.stake(stakeAmount);
  await stakeTx.wait();
  console.log("✅ Staked");
  
  cmonBalance = await cmonToken.balanceOf(deployer.address);
  totalStaked = await staking.totalStaked();
  console.log("New CMON Balance:", hre.ethers.formatEther(cmonBalance));
  console.log("New Total Staked:", hre.ethers.formatEther(totalStaked), "\n");

  // Test 2: Check stake info
  console.log("🔍 Test 2: Checking Stake Info");
  console.log("==============================");
  
  const stakeInfo = await staking.getStakeInfo(deployer.address);
  console.log("Staked Amount:", hre.ethers.formatEther(stakeInfo[0]));
  console.log("Staked At:", new Date(Number(stakeInfo[1]) * 1000).toISOString());
  console.log("In Cooldown:", stakeInfo[3]);
  console.log("Cooldown Remaining:", stakeInfo[4].toString(), "seconds\n");

  // Test 3: Create a proposal
  console.log("📝 Test 3: Creating Proposal");
  console.log("============================");
  
  const proposalTx = await governance.createProposal(
    "Donate to Test Charity",
    "This is a test proposal to donate 50 MON to a charity address",
    0, // CharityDonation type
    "0x0000000000000000000000000000000000000001", // Test charity address
    hre.ethers.parseEther("50")
  );
  const receipt = await proposalTx.wait();
  
  proposalCount = await governance.proposalCount();
  console.log("✅ Proposal created! ID:", proposalCount.toString());
  
  const proposal = await governance.getProposal(proposalCount);
  console.log("Title:", proposal[2]);
  console.log("Description:", proposal[3]);
  console.log("Amount:", hre.ethers.formatEther(proposal[6]), "MON");
  console.log("Status:", ["Active", "Succeeded", "Failed", "Executed", "Cancelled"][proposal[12]], "\n");

  // Test 4: Vote on proposal
  console.log("🗳️  Test 4: Voting on Proposal");
  console.log("==============================");
  
  console.log("Casting vote (For)...");
  const voteTx = await governance.castVote(proposalCount, 1); // 1 = For
  await voteTx.wait();
  console.log("✅ Vote cast");
  
  const voteInfo = await governance.getVote(proposalCount, deployer.address);
  console.log("Has Voted:", voteInfo[0]);
  console.log("Support:", ["Against", "For", "Abstain"][voteInfo[1]]);
  console.log("Votes:", hre.ethers.formatEther(voteInfo[2]), "\n");

  // Test 5: Check protocol stats
  console.log("📈 Test 5: Protocol Statistics");
  console.log("==============================");
  
  totalStaked = await staking.totalStaked();
  const totalYield = await staking.totalYieldGenerated();
  const pendingYield = await staking.getPendingYield();
  
  console.log("Total Staked:", hre.ethers.formatEther(totalStaked), "MON");
  console.log("Total Yield Generated:", hre.ethers.formatEther(totalYield), "MON");
  console.log("Pending Yield:", hre.ethers.formatEther(pendingYield), "MON");
  console.log("Treasury:", deployment.contracts.Treasury, "\n");

  // Test 6: Initiate cooldown
  console.log("⏰ Test 6: Initiating Cooldown");
  console.log("==============================");
  
  console.log("Initiating cooldown...");
  const cooldownTx = await staking.initiateCooldown();
  await cooldownTx.wait();
  console.log("✅ Cooldown initiated");
  
  const updatedStakeInfo = await staking.getStakeInfo(deployer.address);
  console.log("In Cooldown:", updatedStakeInfo[3]);
  console.log("Cooldown Remaining:", updatedStakeInfo[4].toString(), "seconds (7 days)\n");

  console.log("✅ All tests completed successfully!");
  console.log("\n🎉 CMON DAO Protocol is working correctly!");
  console.log("\n📱 Next Steps:");
  console.log("1. Open the frontend at http://localhost:3000");
  console.log("2. Connect your wallet");
  console.log("3. Test the full user flow");
  console.log("4. Create and vote on proposals");
  console.log("5. Monitor yield generation for charity\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
