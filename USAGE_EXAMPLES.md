# CMON DAO - Usage Examples

## 🎯 Complete Usage Guide with Examples

This guide provides step-by-step examples for all protocol interactions.

---

## 1️⃣ Getting Started

### Connect to Monad Testnet

**MetaMask Configuration:**
```
Network Name: Monad Testnet
RPC URL: https://testnet-rpc.monad.xyz
Chain ID: 10143
Currency Symbol: MON
Block Explorer: https://testnet.monadexplorer.com
```

### Get Test MON Tokens

**Option A: Built-in Faucet (Easiest)**
1. Open http://localhost:3000
2. Connect wallet
3. Click "Get Test MON"
4. Receive 1000 MON instantly

**Option B: Contract Interaction**
```javascript
// Using ethers.js
const monToken = await ethers.getContractAt(
  "MONToken",
  "0x20aAc86058Bcb5329eF5D2bE6ddD986C7B8AFB2F"
);
await monToken.faucet();
// Receives 1000 MON
```

---

## 2️⃣ Staking MON

### Stake 100 MON

**Via Frontend:**
1. Go to "Stake" tab
2. Enter amount: `100`
3. Click "Stake MON"
4. Approve transaction (1st tx)
5. Confirm stake (2nd tx)
6. Receive 100 CMON

**Via Contract:**
```javascript
const monToken = await ethers.getContractAt(
  "MONToken",
  "0x20aAc86058Bcb5329eF5D2bE6ddD986C7B8AFB2F"
);
const staking = await ethers.getContractAt(
  "CMONStaking",
  "0x19e7d714De1ec014618593Ab9C288dc1F3c1bdf8"
);

// Step 1: Approve
const amount = ethers.parseEther("100");
await monToken.approve(staking.address, amount);

// Step 2: Stake
await staking.stake(amount);

// Check CMON balance
const cmonToken = await ethers.getContractAt(
  "CMONToken",
  "0x7E99B1A9e2bDB613282Bfe5C319cb114c89A953B"
);
const balance = await cmonToken.balanceOf(userAddress);
console.log("CMON Balance:", ethers.formatEther(balance));
```

### Check Your Stake

**Via Frontend:**
- View in "Withdraw MON" card
- Shows: amount, cooldown status, time remaining

**Via Contract:**
```javascript
const stakeInfo = await staking.getStakeInfo(userAddress);
console.log({
  amount: ethers.formatEther(stakeInfo[0]),
  stakedAt: new Date(Number(stakeInfo[1]) * 1000),
  cooldownStart: Number(stakeInfo[2]),
  inCooldown: stakeInfo[3],
  cooldownRemaining: Number(stakeInfo[4])
});
```

---

## 3️⃣ Withdrawing MON

### Initiate Cooldown

**Via Frontend:**
1. Go to "Stake" tab
2. Click "Initiate Cooldown"
3. Confirm transaction
4. Wait 7 days

**Via Contract:**
```javascript
await staking.initiateCooldown();
console.log("Cooldown initiated. Wait 7 days to withdraw.");
```

### Withdraw After Cooldown

**Via Frontend:**
1. Wait 7 days after cooldown
2. Enter withdrawal amount
3. Click "Withdraw MON"
4. Confirm transaction
5. Receive MON back

**Via Contract:**
```javascript
// After 7 days
const withdrawAmount = ethers.parseEther("50");
await staking.withdraw(withdrawAmount);
console.log("Withdrawn 50 MON");
```

---

## 4️⃣ Creating Proposals

### Example 1: Charity Donation Proposal

**Via Frontend:**
1. Go to "Governance" tab
2. Fill in:
   - Title: "Donate to Red Cross"
   - Description: "Proposal to donate 100 MON to Red Cross for disaster relief"
   - Type: Charity Donation
   - Target Address: `0x1234...` (charity wallet)
   - Amount: `100`
3. Click "Create Proposal"
4. Confirm transaction

**Via Contract:**
```javascript
const governance = await ethers.getContractAt(
  "CMONGovernance",
  "0xDD547f483F1CAD299f0B6403d0E6FA29c3255147"
);

await governance.createProposal(
  "Donate to Red Cross",
  "Proposal to donate 100 MON to Red Cross for disaster relief",
  0, // ProposalType.CharityDonation
  "0x1234567890123456789012345678901234567890", // Charity address
  ethers.parseEther("100")
);
```

### Example 2: Treasury Allocation Proposal

**Via Frontend:**
```
Title: "Allocate Funds for Marketing"
Description: "Allocate 50 MON for marketing campaign to attract more stakers"
Type: Treasury Allocation
Target Address: 0x5678... (marketing wallet)
Amount: 50
```

**Via Contract:**
```javascript
await governance.createProposal(
  "Allocate Funds for Marketing",
  "Allocate 50 MON for marketing campaign",
  1, // ProposalType.TreasuryAllocation
  "0x5678901234567890123456789012345678901234",
  ethers.parseEther("50")
);
```

### Example 3: Parameter Change Proposal

**Via Frontend:**
```
Title: "Increase APR to 25%"
Description: "Proposal to increase staking APR from 20% to 25% to attract more users"
Type: Parameter Change
Target Address: 0x19e7... (staking contract)
Amount: 0
```

**Via Contract:**
```javascript
await governance.createProposal(
  "Increase APR to 25%",
  "Proposal to increase staking APR from 20% to 25%",
  2, // ProposalType.ParameterChange
  "0x19e7d714De1ec014618593Ab9C288dc1F3c1bdf8",
  0
);
```

### Example 4: General Proposal

**Via Frontend:**
```
Title: "Add New Charity Partner"
Description: "Proposal to add UNICEF as an approved charity partner"
Type: General
Target Address: 0x0000... (or leave empty)
Amount: 0
```

---

## 5️⃣ Voting on Proposals

### Vote "For" a Proposal

**Via Frontend:**
1. Go to "Governance" tab
2. Find the proposal
3. Click "For" button
4. Confirm transaction

**Via Contract:**
```javascript
const proposalId = 1;
await governance.castVote(proposalId, 1); // 1 = For
console.log("Voted FOR proposal #1");
```

### Vote "Against" a Proposal

**Via Frontend:**
- Click "Against" button

**Via Contract:**
```javascript
await governance.castVote(proposalId, 0); // 0 = Against
console.log("Voted AGAINST proposal");
```

### Vote "Abstain"

**Via Frontend:**
- Click "Abstain" button

**Via Contract:**
```javascript
await governance.castVote(proposalId, 2); // 2 = Abstain
console.log("Abstained from voting");
```

### Check Your Vote

**Via Contract:**
```javascript
const voteInfo = await governance.getVote(proposalId, userAddress);
console.log({
  hasVoted: voteInfo[0],
  support: ["Against", "For", "Abstain"][voteInfo[1]],
  votes: ethers.formatEther(voteInfo[2])
});
```

---

## 6️⃣ Viewing Proposals

### Get All Proposals

**Via Contract:**
```javascript
const proposalCount = await governance.proposalCount();
console.log("Total proposals:", proposalCount.toString());

for (let i = 1; i <= proposalCount; i++) {
  const proposal = await governance.getProposal(i);
  console.log({
    id: proposal[0],
    proposer: proposal[1],
    title: proposal[2],
    description: proposal[3],
    type: ["Charity", "Treasury", "Parameter", "General"][proposal[4]],
    targetAddress: proposal[5],
    amount: ethers.formatEther(proposal[6]),
    forVotes: ethers.formatEther(proposal[9]),
    againstVotes: ethers.formatEther(proposal[10]),
    status: ["Active", "Succeeded", "Failed", "Executed", "Cancelled"][proposal[12]]
  });
}
```

### Get Active Proposals Only

**Via Contract:**
```javascript
const activeProposalIds = await governance.getActiveProposals();
console.log("Active proposals:", activeProposalIds);

for (const id of activeProposalIds) {
  const proposal = await governance.getProposal(id);
  console.log(`Proposal #${id}: ${proposal[2]}`);
}
```

---

## 7️⃣ Protocol Statistics

### View Total Staked

**Via Frontend:**
- Displayed in stats cards at top

**Via Contract:**
```javascript
const totalStaked = await staking.totalStaked();
console.log("Total Staked:", ethers.formatEther(totalStaked), "MON");
```

### View Total Yield Generated

**Via Contract:**
```javascript
const totalYield = await staking.totalYieldGenerated();
console.log("Total Yield:", ethers.formatEther(totalYield), "MON");
```

### View Pending Yield

**Via Contract:**
```javascript
const pendingYield = await staking.getPendingYield();
console.log("Pending Yield:", ethers.formatEther(pendingYield), "MON");
```

### Calculate Yield Manually

**Via Contract:**
```javascript
// Trigger yield calculation
await staking.calculateYield();
console.log("Yield calculated and updated");
```

---

## 8️⃣ Advanced Scenarios

### Scenario: Multiple Users Staking

**User A:**
```javascript
// Stake 1000 MON
await monToken.approve(staking.address, ethers.parseEther("1000"));
await staking.stake(ethers.parseEther("1000"));
```

**User B:**
```javascript
// Stake 500 MON
await monToken.approve(staking.address, ethers.parseEther("500"));
await staking.stake(ethers.parseEther("500"));
```

**Check Total:**
```javascript
const total = await staking.totalStaked();
console.log("Total:", ethers.formatEther(total)); // 1500 MON
```

### Scenario: Proposal with Multiple Voters

**User A (100 CMON):**
```javascript
await governance.castVote(1, 1); // For
```

**User B (50 CMON):**
```javascript
await governance.castVote(1, 0); // Against
```

**User C (75 CMON):**
```javascript
await governance.castVote(1, 1); // For
```

**Check Results:**
```javascript
const proposal = await governance.getProposal(1);
console.log({
  forVotes: ethers.formatEther(proposal[9]),    // 175 CMON
  againstVotes: ethers.formatEther(proposal[10]) // 50 CMON
});
// Proposal would succeed (175 > 50)
```

### Scenario: Partial Withdrawal

**Stake 1000 MON:**
```javascript
await staking.stake(ethers.parseEther("1000"));
```

**Initiate Cooldown:**
```javascript
await staking.initiateCooldown();
```

**Wait 7 days, then withdraw 300 MON:**
```javascript
await staking.withdraw(ethers.parseEther("300"));
// Still have 700 MON staked
```

---

## 9️⃣ Monitoring Events

### Listen for Staking Events

**Via ethers.js:**
```javascript
staking.on("Staked", (user, amount, cmonMinted) => {
  console.log(`${user} staked ${ethers.formatEther(amount)} MON`);
  console.log(`Received ${ethers.formatEther(cmonMinted)} CMON`);
});
```

### Listen for Voting Events

**Via ethers.js:**
```javascript
governance.on("VoteCast", (voter, proposalId, support, votes) => {
  const supportText = ["Against", "For", "Abstain"][support];
  console.log(`${voter} voted ${supportText} on proposal #${proposalId}`);
  console.log(`Voting power: ${ethers.formatEther(votes)} CMON`);
});
```

### Listen for Proposal Events

**Via ethers.js:**
```javascript
governance.on("ProposalCreated", (proposalId, proposer, title) => {
  console.log(`New proposal #${proposalId}: ${title}`);
  console.log(`Created by: ${proposer}`);
});
```

---

## 🔟 Troubleshooting

### Issue: Transaction Fails

**Check:**
1. Sufficient MON balance
2. Sufficient gas (MON for fees)
3. Correct network (Monad Testnet)
4. Contract addresses correct

### Issue: Can't Create Proposal

**Requirement:**
- Need at least 100 CMON
- Stake 100+ MON first

### Issue: Can't Withdraw

**Check:**
1. Cooldown initiated?
2. 7 days passed?
3. Sufficient staked amount?

### Issue: Vote Not Counted

**Check:**
1. Have CMON balance?
2. Haven't voted already?
3. Proposal still active?

---

## 📊 Example Calculations

### Yield Calculation

**Formula:**
```
Yield = (TotalStaked × APR × TimeElapsed) / (100 × SecondsPerYear)
```

**Example:**
```
TotalStaked = 1000 MON
APR = 20%
TimeElapsed = 30 days = 2,592,000 seconds
SecondsPerYear = 31,536,000

Yield = (1000 × 20 × 2,592,000) / (100 × 31,536,000)
     = 51,840,000,000 / 3,153,600,000
     = 16.44 MON
```

### Voting Power

**Formula:**
```
VotingPower = CMON Balance
```

**Example:**
```
Staked 500 MON → 500 CMON → 500 votes
```

### Quorum Check

**Formula:**
```
Quorum = (TotalSupply × QuorumPercentage) / 100
```

**Example:**
```
TotalSupply = 10,000 CMON
QuorumPercentage = 10%

Quorum = (10,000 × 10) / 100 = 1,000 CMON

Proposal needs 1,000+ votes to be valid
```

---

## 🎓 Best Practices

### For Stakers

1. ✅ Start with small amounts to test
2. ✅ Understand the 7-day cooldown
3. ✅ Keep some MON for gas fees
4. ✅ Monitor yield generation
5. ✅ Participate in governance

### For Proposal Creators

1. ✅ Write clear, detailed descriptions
2. ✅ Specify exact amounts and addresses
3. ✅ Choose appropriate proposal type
4. ✅ Engage community before creating
5. ✅ Respond to questions/concerns

### For Voters

1. ✅ Read proposals carefully
2. ✅ Consider impact on charity
3. ✅ Vote based on merit
4. ✅ Participate in discussions
5. ✅ Vote on all proposals

---

## 🚀 Quick Reference

### Contract Addresses
```
MON Token:    0x20aAc86058Bcb5329eF5D2bE6ddD986C7B8AFB2F
CMON Token:   0x7E99B1A9e2bDB613282Bfe5C319cb114c89A953B
Staking:      0x19e7d714De1ec014618593Ab9C288dc1F3c1bdf8
Governance:   0xDD547f483F1CAD299f0B6403d0E6FA29c3255147
Treasury:     0x6CA24B8544714db5e9b300793B9869A22F42b2D2
```

### Key Parameters
```
APR:                    20%
Cooldown Period:        7 days
Proposal Threshold:     100 CMON
Voting Period:          7 days
Quorum:                 10%
CMON:MON Ratio:         1:1
```

### Important Functions
```
monToken.faucet()                           - Get 1000 MON
staking.stake(amount)                       - Stake MON
staking.initiateCooldown()                  - Start withdrawal
staking.withdraw(amount)                    - Withdraw MON
governance.createProposal(...)              - Create proposal
governance.castVote(id, support)            - Vote on proposal
```

---

**Happy Staking! 🎉**

For more help, check:
- README.md
- DEPLOYMENT.md
- SUMMARY.md
