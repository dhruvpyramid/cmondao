// Load contract ABIs from compiled artifacts
const cmonTokenAbi = require('../artifacts/contracts/CMONToken.sol/CMONToken.json').abi;
const stakingAbi = require('../artifacts/contracts/CMONStakingNative.sol/CMONStakingNative.json').abi;
const governanceAbi = require('../artifacts/contracts/CMONGovernance.sol/CMONGovernance.json').abi;

// Load deployment addresses
const deployment = require('../deployments/monad-testnet-native.json');

export const CONTRACTS = {
  CMONToken: {
    address: deployment.contracts.CMONToken,
    abi: cmonTokenAbi
  },
  CMONStaking: {
    address: deployment.contracts.CMONStaking,
    abi: stakingAbi
  },
  CMONGovernance: {
    address: deployment.contracts.CMONGovernance,
    abi: governanceAbi
  }
};

// Yield allocation data (demo)
export const YIELD_ALLOCATIONS = [
  {
    name: 'Apriopri Staking Pool',
    amount: 5000,
    apr: 7,
    color: '#10b981'
  },
  {
    name: 'MeowFi Pool',
    amount: 10000,
    apr: 50,
    color: '#8b5cf6'
  },
  {
    name: 'Purps Exchange Pool',
    amount: 13000,
    apr: 35,
    color: '#f59e0b'
  },
  {
    name: 'Narwhwal Exchange',
    amount: 34500,
    apr: 23,
    color: '#3b82f6'
  }
];

// Calculate weighted average APR
export function getWeightedAPR() {
  const totalAmount = YIELD_ALLOCATIONS.reduce((sum, pool) => sum + pool.amount, 0);
  const weightedSum = YIELD_ALLOCATIONS.reduce((sum, pool) => sum + (pool.amount * pool.apr), 0);
  return (weightedSum / totalAmount).toFixed(2);
}

// Demo proposals
export const DEMO_PROPOSALS = [
  {
    title: 'Cat Rescue Organization Donation',
    description: 'Donate 500 MON to local cat rescue organization for food, medical care, and shelter maintenance',
    type: 0,
    targetAddress: '0x1234567890123456789012345678901234567890',
    amount: '500'
  },
  {
    title: 'Animal Welfare Organization Support',
    description: 'Support animal welfare organization with 750 MON for rescue operations and veterinary care',
    type: 0,
    targetAddress: '0x2345678901234567890123456789012345678901',
    amount: '750'
  },
  {
    title: 'Wildlife Conservation Fund',
    description: 'Contribute 1000 MON to wildlife conservation efforts and habitat protection',
    type: 0,
    targetAddress: '0x3456789012345678901234567890123456789012',
    amount: '1000'
  },
  {
    title: 'Developer Grant for Protocol Improvements',
    description: 'Fund developer expenses for implementing new features and optimizations - 300 MON',
    type: 1,
    targetAddress: '0x4567890123456789012345678901234567890123',
    amount: '300'
  },
  {
    title: 'Marine Life Protection Initiative',
    description: 'Support ocean cleanup and marine life protection with 600 MON donation',
    type: 0,
    targetAddress: '0x5678901234567890123456789012345678901234',
    amount: '600'
  },
  {
    title: 'Community Education Program',
    description: 'Fund educational programs about animal welfare and environmental protection - 400 MON',
    type: 0,
    targetAddress: '0x6789012345678901234567890123456789012345',
    amount: '400'
  }
];

// Load deployed addresses
export function loadDeployedAddresses() {
  try {
    return deployment;
  } catch (error) {
    console.error('Deployment file not found. Please deploy contracts first.');
    return null;
  }
}
