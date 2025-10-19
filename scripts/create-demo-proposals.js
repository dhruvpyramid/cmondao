const hre = require("hardhat");

async function main() {
  console.log("🎯 Creating demo charity proposals...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Creating proposals with account:", deployer.address);

  // Load deployment
  const deployment = require('../deployments/monad-testnet-native.json');
  
  const governance = await hre.ethers.getContractAt(
    "CMONGovernance",
    deployment.contracts.CMONGovernance
  );

  const proposals = [
    {
      title: "Save the Whales Foundation",
      description: "Donate 1000 MON to international whale conservation efforts and ocean protection programs",
      type: 0, // CharityDonation
      targetAddress: "0x1234567890123456789012345678901234567890",
      amount: hre.ethers.parseEther("1000")
    },
    {
      title: "Local Animal Shelter Support",
      description: "Support local animal shelter with 750 MON for food, medical care, and facility maintenance",
      type: 0,
      targetAddress: "0x2345678901234567890123456789012345678901",
      amount: hre.ethers.parseEther("750")
    },
    {
      title: "Ocean Cleanup Initiative",
      description: "Fund ocean cleanup operations with 1200 MON to remove plastic waste and protect marine life",
      type: 0,
      targetAddress: "0x3456789012345678901234567890123456789012",
      amount: hre.ethers.parseEther("1200")
    },
    {
      title: "Wildlife Conservation Fund",
      description: "Contribute 900 MON to endangered species protection and habitat restoration projects",
      type: 0,
      targetAddress: "0x4567890123456789012345678901234567890123",
      amount: hre.ethers.parseEther("900")
    },
    {
      title: "Endangered Species Protection",
      description: "Support global endangered species protection programs with 850 MON donation",
      type: 0,
      targetAddress: "0x5678901234567890123456789012345678901234",
      amount: hre.ethers.parseEther("850")
    },
    {
      title: "Community Pet Rescue Program",
      description: "Fund local pet rescue and adoption programs with 600 MON for veterinary care and shelter",
      type: 0,
      targetAddress: "0x6789012345678901234567890123456789012345",
      amount: hre.ethers.parseEther("600")
    }
  ];

  console.log("Creating 6 charity proposals...\n");

  for (let i = 0; i < proposals.length; i++) {
    const p = proposals[i];
    console.log(`${i + 1}. ${p.title} - ${hre.ethers.formatEther(p.amount)} MON`);
    
    const tx = await governance.createProposal(
      p.title,
      p.description,
      p.type,
      p.targetAddress,
      p.amount
    );
    
    await tx.wait();
    console.log(`   ✅ Created (tx: ${tx.hash.slice(0, 10)}...)\n`);
  }

  console.log("🎉 All 6 charity proposals created!");
  console.log("\n💡 Users can now vote on these proposals in the Governance tab!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
