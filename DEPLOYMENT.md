# CMON DAO - Deployment Information

## 🎉 Successfully Deployed to Monad Testnet!

### Contract Addresses

| Contract | Address |
|----------|---------|
| **MON Token** | `0x20aAc86058Bcb5329eF5D2bE6ddD986C7B8AFB2F` |
| **CMON Token** | `0x7E99B1A9e2bDB613282Bfe5C319cb114c89A953B` |
| **Staking Contract** | `0x19e7d714De1ec014618593Ab9C288dc1F3c1bdf8` |
| **Governance Contract** | `0xDD547f483F1CAD299f0B6403d0E6FA29c3255147` |
| **Treasury** | `0x6CA24B8544714db5e9b300793B9869A22F42b2D2` |

### Network Information

- **Network**: Monad Testnet
- **Chain ID**: 10143
- **RPC URL**: https://testnet-rpc.monad.xyz
- **Explorer**: https://testnet.monadexplorer.com
- **Faucet**: https://faucet.monad.xyz

### Deployer Account

- **Address**: `0x6CA24B8544714db5e9b300793B9869A22F42b2D2`
- **Balance at Deployment**: 5.0 MON

## 🚀 Quick Start Guide

### 1. Get Test MON Tokens

**Option A: Use the Built-in Faucet**
1. Open the app at http://localhost:3000
2. Connect your wallet
3. Click "Get Test MON" button
4. Receive 1000 MON instantly

**Option B: Use Monad Faucet**
Visit https://faucet.monad.xyz and request testnet MON

### 2. Stake MON

1. Enter amount of MON to stake
2. Click "Stake MON"
3. Approve transaction (2 transactions: approve + stake)
4. Receive CMON tokens 1:1
5. View your stake in the dashboard

### 3. Participate in Governance

1. Navigate to "Governance" tab
2. Create a proposal (requires 100 CMON)
   - Choose proposal type
   - Add title and description
   - Specify target address and amount
3. Vote on active proposals
   - For (support)
   - Against (oppose)
   - Abstain (neutral)

### 4. Withdraw Staked MON

1. Click "Initiate Cooldown"
2. Wait 7 days
3. Enter withdrawal amount
4. Click "Withdraw MON"
5. Receive your MON back (CMON burned)

## 📊 Protocol Features

### Staking Mechanics

- **1:1 Peg**: 1 MON staked = 1 CMON received
- **APR**: 20% (configurable)
- **Cooldown Period**: 7 days for withdrawals
- **Yield Destination**: All yield goes to treasury for charity

### Governance Rules

- **Proposal Threshold**: 100 CMON minimum
- **Voting Period**: 7 days
- **Quorum**: 10% of total CMON supply
- **Voting Power**: 1 CMON = 1 vote
- **Proposal Types**:
  - Charity Donation
  - Treasury Allocation
  - Parameter Change
  - General

### Proposal Lifecycle

1. **Created** → Voting starts
2. **Active** → 7-day voting period
3. **Finalized** → After voting ends
4. **Succeeded** → If quorum met + more For votes
5. **Failed** → If quorum not met or more Against votes
6. **Executed** → Treasury executes successful proposals

## 🔗 Useful Links

### Block Explorers

- **MON Token**: https://testnet.monadexplorer.com/address/0x20aAc86058Bcb5329eF5D2bE6ddD986C7B8AFB2F
- **CMON Token**: https://testnet.monadexplorer.com/address/0x7E99B1A9e2bDB613282Bfe5C319cb114c89A953B
- **Staking**: https://testnet.monadexplorer.com/address/0x19e7d714De1ec014618593Ab9C288dc1F3c1bdf8
- **Governance**: https://testnet.monadexplorer.com/address/0xDD547f483F1CAD299f0B6403d0E6FA29c3255147

### Documentation

- [Monad Docs](https://docs.monad.xyz/)
- [Privy Docs](https://docs.privy.io/)
- [Project README](./README.md)

## 🧪 Testing Scenarios

### Scenario 1: Basic Staking Flow

```
1. Get 1000 MON from faucet
2. Stake 500 MON
3. Verify CMON balance = 500
4. Check total staked increased
```

### Scenario 2: Withdrawal Flow

```
1. Have staked MON
2. Initiate cooldown
3. Wait 7 days (or fast-forward in testing)
4. Withdraw MON
5. Verify CMON burned and MON returned
```

### Scenario 3: Governance Flow

```
1. Stake at least 100 MON to get 100 CMON
2. Create a charity donation proposal
3. Vote on the proposal
4. Wait for voting period to end
5. Finalize proposal
6. Execute if succeeded
```

### Scenario 4: Multi-User Governance

```
1. Multiple users stake MON
2. User A creates proposal
3. Users B, C, D vote
4. Check vote tallies
5. Finalize based on results
```

## 🔐 Security Considerations

### Implemented

✅ ReentrancyGuard on all critical functions
✅ OpenZeppelin audited contracts
✅ 7-day cooldown prevents flash loan attacks
✅ Role-based access control (minter roles)
✅ Proposal threshold prevents spam

### Future Enhancements

- [ ] Multi-sig treasury
- [ ] Timelock for governance execution
- [ ] Emergency pause mechanism
- [ ] Yield strategy integration
- [ ] Social credibility scoring for voting power

## 📈 Protocol Stats (Real-time)

Visit the dashboard to see:
- Total MON staked
- Total CMON supply
- Total yield generated
- Active proposals
- Your balances and voting power

## 🛠️ Developer Commands

```bash
# Compile contracts
npm run compile

# Deploy contracts
npm run deploy

# Start frontend
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 💡 Tips

1. **Get Test MON**: Use the built-in faucet button for instant MON
2. **Voting Power**: Your CMON balance = your voting power
3. **Cooldown**: Plan withdrawals 7 days in advance
4. **Proposals**: Need 100 CMON to create proposals
5. **Yield**: All generated yield goes to charity (tracked on-chain)

## 🎯 What's Next?

1. **Test the full flow** on the frontend
2. **Create your first proposal** for a charity
3. **Invite others** to stake and participate
4. **Track yield generation** for donations
5. **Vote on proposals** to decide charity recipients

## 📞 Support

- **Monad Discord**: https://discord.gg/monaddev
- **Monad Twitter**: https://x.com/monad

---

**Deployment Date**: October 19, 2025
**Deployed By**: Cascade AI Agent
**Status**: ✅ Live on Monad Testnet
