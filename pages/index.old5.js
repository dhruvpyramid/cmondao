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
  const [activeTab, setActiveTab] = useState('stake');
  const [deployment, setDeployment] = useState(null);
  const [walletConnected, setWalletConnected] = useState(false);
  
  const [monBalance, setMonBalance] = useState('0');
  const [cmonBalance, setCmonBalance] = useState('0');
  const [totalStaked, setTotalStaked] = useState('0');
  const [totalYield, setTotalYield] = useState('0');
  const [stakeInfo, setStakeInfo] = useState(null);
  const [proposals, setProposals] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [stakeAmount, setStakeAmount] = useState('');
  const [showAllocations, setShowAllocations] = useState(false);

  const publicClient = createPublicClient({
    chain: monadTestnet,
    transport: http('https://testnet-rpc.monad.xyz'),
  });

  useEffect(() => {
    setDeployment(loadDeployedAddresses());
  }, []);

  useEffect(() => {
    if (authenticated && user?.wallet?.address && deployment && walletConnected) {
      loadAllData();
    }
  }, [authenticated, user, deployment, walletConnected]);

  const connectAndVerify = async () => {
    try {
      setLoading(true);
      
      // Request account access
      if (!window.ethereum) {
        alert('Please install MetaMask or another Web3 wallet');
        return;
      }

      // Request accounts
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (!accounts || accounts.length === 0) {
        alert('No accounts found');
        return;
      }

      // Sign message to prove ownership
      const message = `Sign this message to connect to CMON DAO\n\nTimestamp: ${Date.now()}`;
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, accounts[0]],
      });

      if (signature) {
        setWalletConnected(true);
        console.log('Wallet verified with signature:', signature);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getWalletClient = async () => {
    if (!window.ethereum) throw new Error('No wallet');
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (!accounts || accounts.length === 0) throw new Error('No accounts');
    
    return createWalletClient({
      chain: monadTestnet,
      transport: custom(window.ethereum),
      account: accounts[0],
    });
  };

  const loadAllData = async () => {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (!accounts || accounts.length === 0) return;
      
      const addr = accounts[0];
      
      const [mon, cmon, staked, yield_, stake, count] = await Promise.all([
        publicClient.readContract({ address: CONTRACTS.MONToken.address, abi: CONTRACTS.MONToken.abi, functionName: 'balanceOf', args: [addr] }),
        publicClient.readContract({ address: CONTRACTS.CMONToken.address, abi: CONTRACTS.CMONToken.abi, functionName: 'balanceOf', args: [addr] }),
        publicClient.readContract({ address: CONTRACTS.CMONStaking.address, abi: CONTRACTS.CMONStaking.abi, functionName: 'totalStaked' }),
        publicClient.readContract({ address: CONTRACTS.CMONStaking.address, abi: CONTRACTS.CMONStaking.abi, functionName: 'totalYieldGenerated' }),
        publicClient.readContract({ address: CONTRACTS.CMONStaking.address, abi: CONTRACTS.CMONStaking.abi, functionName: 'getStakeInfo', args: [addr] }),
        publicClient.readContract({ address: CONTRACTS.CMONGovernance.address, abi: CONTRACTS.CMONGovernance.abi, functionName: 'proposalCount' }),
      ]);

      setMonBalance(formatEther(mon));
      setCmonBalance(formatEther(cmon));
      setTotalStaked(formatEther(staked));
      setTotalYield(formatEther(yield_));
      setStakeInfo({ amount: formatEther(stake[0]), inCooldown: stake[3], cooldownRemaining: Number(stake[4]) });

      const pList = [];
      for (let i = 1; i <= Number(count); i++) {
        const p = await publicClient.readContract({ address: CONTRACTS.CMONGovernance.address, abi: CONTRACTS.CMONGovernance.abi, functionName: 'getProposal', args: [i] });
        pList.push({ id: Number(p[0]), title: p[2], description: p[3], forVotes: formatEther(p[9]), againstVotes: formatEther(p[10]), status: Number(p[12]) });
      }
      setProposals(pList);
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  const handleStake = async () => {
    try {
      setLoading(true);
      const wc = await getWalletClient();
      const amt = parseEther(stakeAmount);
      const h1 = await wc.writeContract({ address: CONTRACTS.MONToken.address, abi: CONTRACTS.MONToken.abi, functionName: 'approve', args: [CONTRACTS.CMONStaking.address, amt] });
      await publicClient.waitForTransactionReceipt({ hash: h1 });
      const h2 = await wc.writeContract({ address: CONTRACTS.CMONStaking.address, abi: CONTRACTS.CMONStaking.abi, functionName: 'stake', args: [amt] });
      await publicClient.waitForTransactionReceipt({ hash: h2 });
      await loadAllData();
      setStakeAmount('');
      alert('✅ Staked successfully!');
    } catch (err) {
      console.error(err);
      alert('❌ ' + (err.message || 'Transaction failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (id, support) => {
    try {
      setLoading(true);
      const wc = await getWalletClient();
      const hash = await wc.writeContract({ address: CONTRACTS.CMONGovernance.address, abi: CONTRACTS.CMONGovernance.abi, functionName: 'castVote', args: [id, support] });
      await publicClient.waitForTransactionReceipt({ hash });
      await loadAllData();
      alert('✅ Vote cast!');
    } catch (err) {
      console.error(err);
      alert('❌ ' + (err.message || 'Transaction failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDemo = async (demo) => {
    try {
      setLoading(true);
      const wc = await getWalletClient();
      const hash = await wc.writeContract({ address: CONTRACTS.CMONGovernance.address, abi: CONTRACTS.CMONGovernance.abi, functionName: 'createProposal', args: [demo.title, demo.description, demo.type, demo.targetAddress, parseEther(demo.amount)] });
      await publicClient.waitForTransactionReceipt({ hash });
      await loadAllData();
      alert('✅ Proposal created!');
    } catch (err) {
      console.error(err);
      alert('❌ ' + (err.message || 'Transaction failed'));
    } finally {
      setLoading(false);
    }
  };

  if (!ready || !deployment) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#58a6ff]"></div></div>;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[#30363d] bg-[#0d1117]/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#58a6ff] to-[#a371f7] flex items-center justify-center font-bold text-lg">C</div>
                <div>
                  <h1 className="text-xl font-bold">CMON DAO</h1>
                  <p className="text-xs text-gray-500">Charity Staking Protocol</p>
                </div>
              </div>
              <nav className="hidden md:flex items-center gap-1">
                <button onClick={() => setActiveTab('stake')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'stake' ? 'bg-[#21262d] text-white' : 'text-gray-400 hover:text-white'}`}>Stake</button>
                <button onClick={() => setActiveTab('governance')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'governance' ? 'bg-[#21262d] text-white' : 'text-gray-400 hover:text-white'}`}>Governance</button>
              </nav>
            </div>
            {!authenticated || !walletConnected ? (
              <button onClick={authenticated ? connectAndVerify : login} disabled={loading} className="bg-[#238636] hover:bg-[#2ea043] text-white font-semibold px-5 py-2.5 rounded-lg transition disabled:opacity-50">
                {loading ? 'Connecting...' : authenticated ? 'Sign to Connect' : 'Connect wallet'}
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-[#161b22] border border-[#30363d] rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-[#3fb950]"></div>
                  <span className="text-sm font-mono">{user?.wallet?.address?.slice(0, 6) || window.ethereum?.selectedAddress?.slice(0, 6)}...{user?.wallet?.address?.slice(-4) || window.ethereum?.selectedAddress?.slice(-4)}</span>
                </div>
                <button onClick={() => { logout(); setWalletConnected(false); }} className="px-4 py-2 bg-[#21262d] hover:bg-[#30363d] rounded-lg text-sm transition">Disconnect</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {authenticated && walletConnected && (
        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="card card-hover p-5 animate-fadeIn">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">Your CMON</span>
                <span className="badge badge-info">Voting Power</span>
              </div>
              <div className="text-3xl font-bold stat-number">{parseFloat(cmonBalance).toFixed(2)}</div>
              <div className="text-xs text-gray-500 mt-1">≈ ${(parseFloat(cmonBalance) * 1.23).toFixed(2)}</div>
            </div>

            <div className="card card-hover p-5 animate-fadeIn" style={{animationDelay: '0.1s'}}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">Treasury</span>
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div className="text-3xl font-bold stat-number">{parseFloat(totalStaked).toFixed(2)}</div>
              <div className="text-xs text-[#3fb950] mt-1">Total Staked</div>
            </div>

            <div className="card card-hover p-5 animate-fadeIn cursor-pointer" style={{animationDelay: '0.2s'}} onClick={() => setShowAllocations(true)}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">Deployed</span>
                <span className="badge badge-warning">{getWeightedAPR()}% APR</span>
              </div>
              <div className="text-3xl font-bold stat-number">{YIELD_ALLOCATIONS.reduce((s, p) => s + p.amount, 0).toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">Click to view allocation</div>
            </div>

            <div className="card card-hover p-5 animate-fadeIn" style={{animationDelay: '0.3s'}}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">Charity Yield</span>
                <span className="badge badge-success">Generated</span>
              </div>
              <div className="text-3xl font-bold stat-number text-[#3fb950]">{parseFloat(totalYield).toFixed(2)}</div>
              <div className="text-xs text-gray-500 mt-1">For good causes</div>
            </div>
          </div>

          {/* Main Content */}
          {activeTab === 'stake' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card p-6">
                <h2 className="text-xl font-bold mb-6">Stake MON</h2>
                
                <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Available to stake</span>
                    <span className="text-sm font-semibold">{parseFloat(monBalance).toFixed(4)} MON</span>
                  </div>
                  <div className="text-xs text-gray-500">Your actual wallet balance</div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Amount</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      placeholder="0.0"
                      max={monBalance}
                      className="input-field w-full text-2xl pr-20"
                    />
                    <button onClick={() => setStakeAmount(monBalance)} className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-[#21262d] hover:bg-[#30363d] rounded text-xs font-medium transition">
                      MAX
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>≈ ${(parseFloat(stakeAmount || 0) * 1.23).toFixed(2)}</span>
                    <span>1 MON = 1 CMON</span>
                  </div>
                </div>

                <button onClick={handleStake} disabled={loading || !stakeAmount || parseFloat(stakeAmount) > parseFloat(monBalance)} className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? 'Processing...' : 'Stake MON'}
                </button>

                <div className="mt-6 p-4 bg-[#0d1117] border border-[#30363d] rounded-lg">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-[#58a6ff] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <div className="text-sm text-gray-400">
                      <p className="font-medium text-white mb-1">How it works</p>
                      <p>Stake MON to receive CMON 1:1. Your staked MON generates 20% APR, with all yield going to charity. CMON gives you voting power in the DAO.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h2 className="text-xl font-bold mb-6">Your Position</h2>
                
                {stakeInfo && parseFloat(stakeInfo.amount) > 0 ? (
                  <div className="space-y-4">
                    <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-4">
                      <div className="text-sm text-gray-400 mb-1">Staked amount</div>
                      <div className="text-3xl font-bold">{parseFloat(stakeInfo.amount).toFixed(4)} MON</div>
                      <div className="text-xs text-gray-500 mt-1">≈ ${(parseFloat(stakeInfo.amount) * 1.23).toFixed(2)}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-4">
                        <div className="text-sm text-gray-400 mb-1">Status</div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${stakeInfo.inCooldown ? 'bg-[#d29922]' : 'bg-[#3fb950]'}`}></div>
                          <span className="text-sm font-medium">{stakeInfo.inCooldown ? 'Cooldown' : 'Active'}</span>
                        </div>
                      </div>

                      <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-4">
                        <div className="text-sm text-gray-400 mb-1">APR</div>
                        <div className="text-lg font-bold text-[#3fb950]">20%</div>
                      </div>
                    </div>

                    {stakeInfo.inCooldown && stakeInfo.cooldownRemaining > 0 && (
                      <div className="bg-[#9e6a03]/10 border border-[#9e6a03]/30 rounded-lg p-4">
                        <div className="text-sm font-medium text-[#d29922] mb-2">Cooldown Period</div>
                        <div className="text-xs text-gray-400">{Math.floor(stakeInfo.cooldownRemaining / 86400)}d {Math.floor((stakeInfo.cooldownRemaining % 86400) / 3600)}h remaining</div>
                        <div className="w-full bg-[#21262d] rounded-full h-1.5 mt-2">
                          <div className="bg-[#d29922] h-1.5 rounded-full" style={{width: `${((604800 - stakeInfo.cooldownRemaining) / 604800) * 100}%`}}></div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#21262d] flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                    </div>
                    <p className="text-gray-400 text-sm">No active stake</p>
                    <p className="text-gray-500 text-xs mt-1">Stake MON to start earning for charity</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'governance' && (
            <div>
              {proposals.length === 0 && (
                <div className="card p-6 mb-6">
                  <h3 className="text-lg font-bold mb-4">Quick Start: Demo Proposals</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {DEMO_PROPOSALS.slice(0, 3).map((d, i) => (
                      <div key={i} className="bg-[#0d1117] border border-[#30363d] rounded-lg p-4 hover:border-[#58a6ff]/50 transition">
                        <h4 className="font-semibold mb-2 text-sm">{d.title}</h4>
                        <p className="text-xs text-gray-400 mb-3 line-clamp-2">{d.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#3fb950] font-medium">{d.amount} MON</span>
                          <button onClick={() => handleCreateDemo(d)} disabled={loading} className="px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] rounded text-xs font-medium transition disabled:opacity-50">Create</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {proposals.map(p => (
                  <div key={p.id} className="card card-hover p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold mb-1">{p.title}</h3>
                        <p className="text-sm text-gray-400">{p.description}</p>
                      </div>
                      <span className="badge badge-info">#{p.id}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-[#238636]/10 border border-[#238636]/30 rounded-lg p-3">
                        <div className="text-2xl font-bold text-[#3fb950]">{parseFloat(p.forVotes).toFixed(0)}</div>
                        <div className="text-xs text-gray-400 mt-1">For</div>
                      </div>
                      <div className="bg-[#da3633]/10 border border-[#da3633]/30 rounded-lg p-3">
                        <div className="text-2xl font-bold text-[#f85149]">{parseFloat(p.againstVotes).toFixed(0)}</div>
                        <div className="text-xs text-gray-400 mt-1">Against</div>
                      </div>
                    </div>

                    {p.status === 0 && (
                      <div className="flex gap-3">
                        <button onClick={() => handleVote(p.id, 1)} disabled={loading} className="flex-1 py-2.5 bg-[#238636]/20 hover:bg-[#238636]/30 border border-[#238636]/30 rounded-lg font-medium text-sm transition disabled:opacity-50">Vote For</button>
                        <button onClick={() => handleVote(p.id, 0)} disabled={loading} className="flex-1 py-2.5 bg-[#da3633]/20 hover:bg-[#da3633]/30 border border-[#da3633]/30 rounded-lg font-medium text-sm transition disabled:opacity-50">Vote Against</button>
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
          <div className="card max-w-2xl w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Capital Deployment</h3>
              <button onClick={() => setShowAllocations(false)} className="text-gray-400 hover:text-white"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="space-y-3">
              {YIELD_ALLOCATIONS.map((pool, i) => (
                <div key={i} className="bg-[#0d1117] border border-[#30363d] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-semibold text-sm">{pool.name}</div>
                      <div className="text-xs text-gray-400">APR: {pool.apr}%</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold" style={{color: pool.color}}>{pool.amount.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">MON</div>
                    </div>
                  </div>
                  <div className="w-full bg-[#21262d] rounded-full h-1.5">
                    <div className="h-1.5 rounded-full transition-all" style={{width: `${(pool.amount / 62500) * 100}%`, backgroundColor: pool.color}}></div>
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
