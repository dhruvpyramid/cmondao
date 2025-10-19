import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { createPublicClient, createWalletClient, custom, http, formatEther, parseEther } from 'viem';
import { CONTRACTS, loadDeployedAddresses, YIELD_ALLOCATIONS, getWeightedAPR, DEMO_PROPOSALS } from '../lib/contracts';

const monadTestnet = {
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { decimals: 18, name: 'MON', symbol: 'MON' },
  rpcUrls: { default: { http: ['https://testnet-rpc.monad.xyz'] } },
};

export default function Home() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const [activeView, setActiveView] = useState('stake');
  const [deployment, setDeployment] = useState(null);
  
  // Balances
  const [monBalance, setMonBalance] = useState('0');
  const [cmonBalance, setCmonBalance] = useState('0');
  const [totalStaked, setTotalStaked] = useState('0');
  const [totalYield, setTotalYield] = useState('0');
  const [stakeInfo, setStakeInfo] = useState(null);
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [stakeAmount, setStakeAmount] = useState('');
  const [showAllocations, setShowAllocations] = useState(false);
  const [proposals, setProposals] = useState([]);

  const publicClient = createPublicClient({
    chain: monadTestnet,
    transport: http('https://testnet-rpc.monad.xyz'),
  });

  useEffect(() => {
    setDeployment(loadDeployedAddresses());
  }, []);

  useEffect(() => {
    if (authenticated && user?.wallet?.address && deployment) {
      loadAllData();
    }
  }, [authenticated, user, deployment]);

  const getWalletClient = async () => {
    if (!window.ethereum) throw new Error('No wallet found');
    return createWalletClient({
      chain: monadTestnet,
      transport: custom(window.ethereum),
      account: user.wallet.address,
    });
  };

  const loadAllData = async () => {
    try {
      const address = user.wallet.address;
      
      // Load balances
      const [mon, cmon, staked, yield_, stake] = await Promise.all([
        publicClient.readContract({
          address: CONTRACTS.MONToken.address,
          abi: CONTRACTS.MONToken.abi,
          functionName: 'balanceOf',
          args: [address],
        }),
        publicClient.readContract({
          address: CONTRACTS.CMONToken.address,
          abi: CONTRACTS.CMONToken.abi,
          functionName: 'balanceOf',
          args: [address],
        }),
        publicClient.readContract({
          address: CONTRACTS.CMONStaking.address,
          abi: CONTRACTS.CMONStaking.abi,
          functionName: 'totalStaked',
        }),
        publicClient.readContract({
          address: CONTRACTS.CMONStaking.address,
          abi: CONTRACTS.CMONStaking.abi,
          functionName: 'totalYieldGenerated',
        }),
        publicClient.readContract({
          address: CONTRACTS.CMONStaking.address,
          abi: CONTRACTS.CMONStaking.abi,
          functionName: 'getStakeInfo',
          args: [address],
        }),
      ]);

      setMonBalance(formatEther(mon));
      setCmonBalance(formatEther(cmon));
      setTotalStaked(formatEther(staked));
      setTotalYield(formatEther(yield_));
      setStakeInfo({
        amount: formatEther(stake[0]),
        inCooldown: stake[3],
        cooldownRemaining: Number(stake[4]),
      });

      // Load proposals
      const count = await publicClient.readContract({
        address: CONTRACTS.CMONGovernance.address,
        abi: CONTRACTS.CMONGovernance.abi,
        functionName: 'proposalCount',
      });

      const proposalList = [];
      for (let i = 1; i <= Number(count); i++) {
        const p = await publicClient.readContract({
          address: CONTRACTS.CMONGovernance.address,
          abi: CONTRACTS.CMONGovernance.abi,
          functionName: 'getProposal',
          args: [i],
        });
        proposalList.push({
          id: Number(p[0]),
          title: p[2],
          description: p[3],
          forVotes: formatEther(p[9]),
          againstVotes: formatEther(p[10]),
          status: Number(p[12]),
        });
      }
      setProposals(proposalList);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleGetMON = async () => {
    try {
      setLoading(true);
      const walletClient = await getWalletClient();
      const hash = await walletClient.writeContract({
        address: CONTRACTS.MONToken.address,
        abi: CONTRACTS.MONToken.abi,
        functionName: 'faucet',
      });
      await publicClient.waitForTransactionReceipt({ hash });
      await loadAllData();
      alert('✅ Claimed 1000 MON!');
    } catch (error) {
      console.error(error);
      alert('❌ ' + (error.message || 'Transaction failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleStake = async () => {
    try {
      setLoading(true);
      const walletClient = await getWalletClient();
      const amount = parseEther(stakeAmount);
      
      const approveHash = await walletClient.writeContract({
        address: CONTRACTS.MONToken.address,
        abi: CONTRACTS.MONToken.abi,
        functionName: 'approve',
        args: [CONTRACTS.CMONStaking.address, amount],
      });
      await publicClient.waitForTransactionReceipt({ hash: approveHash });
      
      const stakeHash = await walletClient.writeContract({
        address: CONTRACTS.CMONStaking.address,
        abi: CONTRACTS.CMONStaking.abi,
        functionName: 'stake',
        args: [amount],
      });
      await publicClient.waitForTransactionReceipt({ hash: stakeHash });
      
      await loadAllData();
      setStakeAmount('');
      alert('✅ Staked successfully!');
    } catch (error) {
      console.error(error);
      alert('❌ ' + (error.message || 'Transaction failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (proposalId, support) => {
    try {
      setLoading(true);
      const walletClient = await getWalletClient();
      const hash = await walletClient.writeContract({
        address: CONTRACTS.CMONGovernance.address,
        abi: CONTRACTS.CMONGovernance.abi,
        functionName: 'castVote',
        args: [proposalId, support],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      await loadAllData();
      alert('✅ Vote cast!');
    } catch (error) {
      console.error(error);
      alert('❌ ' + (error.message || 'Transaction failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDemoProposal = async (demo) => {
    try {
      setLoading(true);
      const walletClient = await getWalletClient();
      const hash = await walletClient.writeContract({
        address: CONTRACTS.CMONGovernance.address,
        abi: CONTRACTS.CMONGovernance.abi,
        functionName: 'createProposal',
        args: [demo.title, demo.description, demo.type, demo.targetAddress, parseEther(demo.amount)],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      await loadAllData();
      alert('✅ Proposal created!');
    } catch (error) {
      console.error(error);
      alert('❌ ' + (error.message || 'Transaction failed'));
    } finally {
      setLoading(false);
    }
  };

  if (!ready || !deployment) {
    return (
      <div className="min-h-screen bg-[#0a0b0d] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0b0d] text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="relative border-b border-white/5 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xl">
                C
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">CMON DAO</h1>
                <p className="text-sm text-gray-400">Charity-Powered Staking</p>
              </div>
            </div>

            {!authenticated ? (
              <button
                onClick={login}
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-500/50 transition-all"
              >
                Connect Wallet
              </button>
            ) : (
              <div className="flex items-center gap-4">
                <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                  <div className="text-xs text-gray-400">Connected</div>
                  <div className="font-mono text-sm">{user?.wallet?.address?.slice(0, 6)}...{user?.wallet?.address?.slice(-4)}</div>
                </div>
                <button onClick={logout} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition">
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {authenticated && (
        <main className="relative max-w-7xl mx-auto px-6 py-12">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-indigo-500/50 transition-all group">
              <div className="text-sm text-gray-400 mb-2">Your CMON</div>
              <div className="text-4xl font-bold mb-1">{parseFloat(cmonBalance).toFixed(2)}</div>
              <div className="text-xs text-gray-500">Voting Power</div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-emerald-500/50 transition-all">
              <div className="text-sm text-gray-400 mb-2">Treasury</div>
              <div className="text-4xl font-bold mb-1">{parseFloat(totalStaked).toFixed(2)}</div>
              <div className="text-xs text-gray-500">Total Staked</div>
            </div>

            <div 
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-amber-500/50 transition-all cursor-pointer"
              onClick={() => setShowAllocations(true)}
            >
              <div className="text-sm text-gray-400 mb-2">Deployed</div>
              <div className="text-4xl font-bold mb-1">{YIELD_ALLOCATIONS.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</div>
              <div className="text-xs text-amber-400">APR: {getWeightedAPR()}%</div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-rose-500/50 transition-all">
              <div className="text-sm text-gray-400 mb-2">Charity Yield</div>
              <div className="text-4xl font-bold mb-1">{parseFloat(totalYield).toFixed(2)}</div>
              <div className="text-xs text-gray-500">Generated</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 bg-white/5 p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveView('stake')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeView === 'stake' ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Stake
            </button>
            <button
              onClick={() => setActiveView('governance')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeView === 'governance' ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Governance
            </button>
          </div>

          {/* Stake View */}
          {activeView === 'stake' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
                <h2 className="text-2xl font-bold mb-6">Stake MON</h2>
                
                <div className="bg-white/5 rounded-xl p-4 mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-400">Balance</span>
                    <span className="font-semibold">{parseFloat(monBalance).toFixed(2)} MON</span>
                  </div>
                  <button
                    onClick={handleGetMON}
                    disabled={loading}
                    className="w-full mt-2 px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 rounded-lg text-sm transition"
                  >
                    Get Test MON
                  </button>
                </div>

                <div className="mb-6">
                  <input
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder="0.0"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-2xl focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={() => setStakeAmount(monBalance)}
                    className="mt-2 text-sm text-indigo-400 hover:text-indigo-300"
                  >
                    Use Max
                  </button>
                </div>

                <button
                  onClick={handleStake}
                  disabled={loading || !stakeAmount}
                  className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-indigo-500/50 disabled:opacity-50 transition-all"
                >
                  {loading ? 'Processing...' : 'Stake MON'}
                </button>
              </div>

              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
                <h2 className="text-2xl font-bold mb-6">Your Position</h2>
                {stakeInfo && parseFloat(stakeInfo.amount) > 0 ? (
                  <div className="space-y-4">
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="text-sm text-gray-400">Staked</div>
                      <div className="text-3xl font-bold">{parseFloat(stakeInfo.amount).toFixed(2)} MON</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="text-sm text-gray-400">Status</div>
                      <div className="text-lg">{stakeInfo.inCooldown ? '⏳ Cooldown Active' : '✅ Active'}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-6xl mb-4">📊</div>
                    <p>No active stake</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Governance View */}
          {activeView === 'governance' && (
            <div>
              {proposals.length === 0 && (
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 mb-8">
                  <h3 className="text-xl font-bold mb-4">Demo Proposals</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {DEMO_PROPOSALS.slice(0, 3).map((demo, i) => (
                      <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <h4 className="font-semibold mb-2">{demo.title}</h4>
                        <p className="text-sm text-gray-400 mb-3 line-clamp-2">{demo.description}</p>
                        <button
                          onClick={() => handleCreateDemoProposal(demo)}
                          disabled={loading}
                          className="w-full px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 rounded-lg text-sm transition"
                        >
                          Create
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {proposals.map((p) => (
                  <div key={p.id} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                    <h3 className="text-xl font-bold mb-2">{p.title}</h3>
                    <p className="text-gray-400 mb-4">{p.description}</p>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-green-500/10 rounded-lg p-3">
                        <div className="text-2xl font-bold text-green-400">{parseFloat(p.forVotes).toFixed(0)}</div>
                        <div className="text-xs text-gray-400">For</div>
                      </div>
                      <div className="bg-red-500/10 rounded-lg p-3">
                        <div className="text-2xl font-bold text-red-400">{parseFloat(p.againstVotes).toFixed(0)}</div>
                        <div className="text-xs text-gray-400">Against</div>
                      </div>
                    </div>
                    {p.status === 0 && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleVote(p.id, 1)}
                          disabled={loading}
                          className="flex-1 py-3 bg-green-500/20 hover:bg-green-500/30 rounded-lg font-semibold transition"
                        >
                          Vote For
                        </button>
                        <button
                          onClick={() => handleVote(p.id, 0)}
                          disabled={loading}
                          className="flex-1 py-3 bg-red-500/20 hover:bg-red-500/30 rounded-lg font-semibold transition"
                        >
                          Vote Against
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      )}

      {/* Allocations Modal */}
      {showAllocations && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAllocations(false)}>
          <div className="bg-[#0a0b0d] border border-white/10 rounded-2xl max-w-2xl w-full p-8" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-bold mb-6">Capital Deployment</h3>
            <div className="space-y-4">
              {YIELD_ALLOCATIONS.map((pool, i) => (
                <div key={i} className="bg-white/5 rounded-xl p-4">
                  <div className="flex justify-between mb-2">
                    <div>
                      <div className="font-semibold">{pool.name}</div>
                      <div className="text-sm text-gray-400">APR: {pool.apr}%</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold" style={{ color: pool.color }}>{pool.amount.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">MON</div>
                    </div>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: `${(pool.amount / 62500) * 100}%`, backgroundColor: pool.color }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
