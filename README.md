# CMON DAO 🌟

**Put your $MON to work for good causes**

CMON DAO is a decentralized autonomous organization built on Monad that allows users to stake their MON tokens to generate yield for charitable donations. Stakers receive CMON tokens (1:1 pegged to MON) which grant them governance rights to vote on which charities receive funding.

## 🎯 Core Features

- **Stake MON, Get CMON**: Stake your MON tokens and receive CMON tokens 1:1
- **Yield for Charity**: The DAO collectively uses staked MON in yield strategies (20% APR), with all gains donated to good causes
- **7-Day Cooldown**: Your CMON is always redeemable with a 7-day cooldown period for withdrawals
- **DAO Governance**: CMON holders can create and vote on proposals for charity donations and protocol decisions
- **Full Transparency**: Track total staked funds, yield generated, and all governance decisions on-chain

## 🏗️ Architecture

### Smart Contracts

1. **MONToken.sol** - Mock MON token for testing (includes faucet)
2. **CMONToken.sol** - Proof-of-stake token received when staking MON
3. **CMONStaking.sol** - Main staking contract with cooldown mechanism
4. **CMONGovernance.sol** - DAO governance for proposals and voting

### Frontend

- **Next.js** - React framework for the web app
- **Privy** - Wallet connection and authentication
- **Wagmi/Viem** - Ethereum interactions
- **TailwindCSS** - Modern, responsive UI

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Compile smart contracts
npm run compile

# Deploy contracts to Monad testnet
npm run deploy

# Start the frontend
npm run dev
```

The app will be available at `http://localhost:3000`

## 📝 Smart Contract Details

### Staking Flow

1. User approves MON tokens for staking contract
2. User stakes MON → receives CMON 1:1
3. Staked MON generates yield at 20% APR
4. Yield is tracked and allocated to treasury for charity donations
5. User can initiate 7-day cooldown to withdraw
6. After cooldown, user can withdraw MON (burns CMON)

### Governance Flow

1. User with ≥100 CMON creates a proposal
2. Proposal types: Charity Donation, Treasury Allocation, Parameter Change, General
3. Voting period: 7 days
4. Vote options: For, Against, Abstain
5. Voting power = CMON balance
6. Quorum: 10% of total CMON supply
7. Proposal succeeds if: quorum met + more For than Against votes
8. Owner/treasury executes successful proposals

## 🔧 Configuration

### Environment Variables

Create `.env.local` with:

```
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_secret
NEXT_PUBLIC_MONAD_RPC=https://testnet.monad.xyz
NEXT_PUBLIC_CHAIN_ID=10143
```

### Hardhat Configuration

The project is pre-configured for Monad testnet:
- Chain ID: 10143
- RPC: https://testnet.monad.xyz

## 📊 Protocol Stats

The dashboard displays:
- Your MON balance (with test faucet)
- Your CMON balance (voting power)
- Total MON staked in protocol
- Total yield generated for charity

## 🗳️ Governance

### Creating Proposals

Requirements:
- Minimum 100 CMON balance
- Provide: title, description, type, target address, amount

### Voting

- Vote with your CMON balance
- Options: For (1), Against (0), Abstain (2)
- One vote per proposal per address
- Voting power = CMON balance at time of vote

## 🔐 Security Features

- ReentrancyGuard on all state-changing functions
- OpenZeppelin battle-tested contracts
- 7-day cooldown prevents flash loan attacks
- Minter role restrictions on CMON token

## 🎨 UI Features

- Modern, dark-themed interface
- Real-time balance updates
- Transaction status tracking
- Responsive design for mobile/desktop
- Wallet connection via Privy

## 📄 Contract Addresses

After deployment, addresses are saved to `deployments/monad-testnet.json`:

```json
{
  "MONToken": "0x...",
  "CMONToken": "0x...",
  "CMONStaking": "0x...",
  "CMONGovernance": "0x...",
  "Treasury": "0x..."
}
```

## 🧪 Testing

Get test MON tokens:
1. Connect your wallet
2. Click "Get Test MON" button
3. Receive 1000 MON instantly

## 🛠️ Development

```bash
# Compile contracts
npm run compile

# Deploy to Monad testnet
npm run deploy

# Run frontend dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📚 Tech Stack

- **Blockchain**: Monad (EVM-compatible)
- **Smart Contracts**: Solidity 0.8.20
- **Development**: Hardhat
- **Frontend**: Next.js 14, React 18
- **Wallet**: Privy
- **Web3**: Wagmi, Viem
- **Styling**: TailwindCSS
- **Libraries**: OpenZeppelin Contracts

## 🤝 Contributing

This is a DAO protocol - governance decisions are made by CMON holders!

## 📜 License

MIT

## 🌐 Links

- [Monad Docs](https://docs.monad.xyz/)
- [Privy Docs](https://docs.privy.io/)
- [OpenZeppelin](https://docs.openzeppelin.com/)

---

**Built with ❤️ for charity on Monad**
