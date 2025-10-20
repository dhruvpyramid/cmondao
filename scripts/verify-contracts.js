const hre = require("hardhat");

async function main() {
  console.log("🔍 Starting contract verification on Monad Explorer...\n");

  // Contract addresses from deployment
  const CMON_TOKEN = "0xBeb007Bd4f059F0D514bA93529FBDec88EA581F3";
  const CMON_STAKING = "0x6Df1e508c4eb61b04eb9c364Bc1a42406FEf1a63";
  const CMON_GOVERNANCE = "0x94a38c15Ff1728112660D98e41C71B767b8314BE";
  const TREASURY = "0x6CA24B8544714db5e9b300793B9869A22F42b2D2";

  // Verify CMONToken
  console.log("1️⃣ Verifying CMONToken...");
  try {
    await hre.run("verify:verify", {
      address: CMON_TOKEN,
      constructorArguments: []
    });
    console.log("✅ CMONToken verified successfully!\n");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ CMONToken already verified!\n");
    } else {
      console.log("❌ CMONToken verification failed:", error.message, "\n");
    }
  }

  // Verify CMONStakingNative
  console.log("2️⃣ Verifying CMONStakingNative...");
  try {
    await hre.run("verify:verify", {
      address: CMON_STAKING,
      constructorArguments: [CMON_TOKEN, TREASURY],
      contract: "contracts/CMONStakingNative.sol:CMONStakingNative"
    });
    console.log("✅ CMONStakingNative verified successfully!\n");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ CMONStakingNative already verified!\n");
    } else {
      console.log("❌ CMONStakingNative verification failed:", error.message, "\n");
    }
  }

  // Verify CMONGovernance
  console.log("3️⃣ Verifying CMONGovernance...");
  try {
    await hre.run("verify:verify", {
      address: CMON_GOVERNANCE,
      constructorArguments: [CMON_TOKEN]
    });
    console.log("✅ CMONGovernance verified successfully!\n");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ CMONGovernance already verified!\n");
    } else {
      console.log("❌ CMONGovernance verification failed:", error.message, "\n");
    }
  }

  console.log("🎉 Verification process complete!");
  console.log("\n📍 View your contracts on Monad Explorer:");
  console.log(`   CMONToken: https://testnet.monadexplorer.com/address/${CMON_TOKEN}`);
  console.log(`   CMONStaking: https://testnet.monadexplorer.com/address/${CMON_STAKING}`);
  console.log(`   CMONGovernance: https://testnet.monadexplorer.com/address/${CMON_GOVERNANCE}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
