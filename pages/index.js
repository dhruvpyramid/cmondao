import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { createPublicClient, createWalletClient, custom, http, formatEther, parseEther } from 'viem';
import { CONTRACTS, loadDeployedAddresses, YIELD_ALLOCATIONS, getWeightedAPR, DEMO_PROPOSALS } from '../lib/contracts';

const monadTestnet = {
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { decimals: 18, name: 'MON', symbol: 'MON' },
  rpcUrls: { default: { http: ['https://rpc.ankr.com/monad_testnet'] } },
};

export default function Home() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const [activeTab, setActiveTab] = useState('stake');
  const [deployment, setDeployment] = useState(null);
  const [walletConnected, setWalletConnected] = useState(false);
  
  const [nativeMonBalance, setNativeMonBalance] = useState('0');
  const [cmonBalance, setCmonBalance] = useState('0');
  const [totalStaked, setTotalStaked] = useState('0');
  const [totalYield, setTotalYield] = useState('0');
  const [stakeInfo, setStakeInfo] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [demoVotes, setDemoVotes] = useState({});
  const [votingPowerUsed, setVotingPowerUsed] = useState(0);
  const [voteAmounts, setVoteAmounts] = useState({});
  
  const [loading, setLoading] = useState(false);
  const [stakeAmount, setStakeAmount] = useState('');
  const [showAllocations, setShowAllocations] = useState(false);

  const publicClient = createPublicClient({
    chain: monadTestnet,
    transport: http('https://rpc.ankr.com/monad_testnet'),
  });

  useEffect(() => {
    setDeployment(loadDeployedAddresses());
  }, []);

  useEffect(() => {
    if (authenticated && user?.wallet?.address && deployment && walletConnected) {
      loadAllData();
      // Redirect to stake page after login
      if (activeTab !== 'stake' && activeTab !== 'governance') {
        setActiveTab('stake');
      }
    }
  }, [authenticated, user, deployment, walletConnected]);

  const connectAndVerify = async () => {
    try {
      setLoading(true);
      
      if (!window.ethereum) {
        alert('Please install MetaMask or another Web3 wallet');
        return;
      }

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
      
      const [monBal, cmon, staked, yield_, stake, count] = await Promise.all([
        publicClient.readContract({ address: '0x20aAc86058Bcb5329eF5D2bE6ddD986C7B8AFB2F', abi: CONTRACTS.CMONToken.abi, functionName: 'balanceOf', args: [addr] }),
        publicClient.readContract({ address: CONTRACTS.CMONToken.address, abi: CONTRACTS.CMONToken.abi, functionName: 'balanceOf', args: [addr] }),
        publicClient.readContract({ address: CONTRACTS.CMONStaking.address, abi: CONTRACTS.CMONStaking.abi, functionName: 'totalStaked' }),
        publicClient.readContract({ address: CONTRACTS.CMONStaking.address, abi: CONTRACTS.CMONStaking.abi, functionName: 'totalYieldGenerated' }),
        publicClient.readContract({ address: CONTRACTS.CMONStaking.address, abi: CONTRACTS.CMONStaking.abi, functionName: 'getStakeInfo', args: [addr] }),
        publicClient.readContract({ address: CONTRACTS.CMONGovernance.address, abi: CONTRACTS.CMONGovernance.abi, functionName: 'proposalCount' }),
      ]);
      
      setNativeMonBalance(formatEther(monBal));

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
      
      // Approve MON token first
      const approvehash = await wc.writeContract({
        address: '0x20aAc86058Bcb5329eF5D2bE6ddD986C7B8AFB2F', // MON Token
        abi: CONTRACTS.CMONToken.abi, // Use same ERC20 ABI
        functionName: 'approve',
        args: [CONTRACTS.CMONStaking.address, amt]
      });
      await publicClient.waitForTransactionReceipt({ hash: approvehash });
      
      // Then stake
      const hash = await wc.writeContract({
        address: CONTRACTS.CMONStaking.address,
        abi: CONTRACTS.CMONStaking.abi,
        functionName: 'stake',
        args: [amt]
      });
      
      await publicClient.waitForTransactionReceipt({ hash });
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

  const handleDemoVote = (proposalIndex, support, voteAmount) => {
    const totalVotingPower = parseFloat(cmonBalance);
    const remainingPower = totalVotingPower - votingPowerUsed;
    
    if (totalVotingPower === 0) {
      alert('❌ You need CMON to vote! Stake MON first to get voting power.');
      return;
    }

    if (remainingPower <= 0) {
      alert('❌ No voting power left! You\'ve used all your CMON.');
      return;
    }

    const amount = parseFloat(voteAmount);
    if (!amount || amount <= 0) {
      alert('❌ Please enter a valid amount!');
      return;
    }

    if (amount > remainingPower) {
      alert(`❌ Not enough voting power! You have ${remainingPower.toFixed(2)} CMON remaining.`);
      return;
    }

    setDemoVotes(prev => {
      const newVotes = { ...prev };
      if (!newVotes[proposalIndex]) {
        newVotes[proposalIndex] = { for: 0, against: 0 };
      }
      if (support) {
        newVotes[proposalIndex].for += amount;
      } else {
        newVotes[proposalIndex].against += amount;
      }
      return newVotes;
    });
    
    setVotingPowerUsed(prev => prev + amount);
    alert(`✅ Voted with ${amount.toFixed(2)} CMON! Remaining: ${(remainingPower - amount).toFixed(2)}`);
  };

  if (!ready || !deployment) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#58a6ff]"></div></div>;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="relative max-w-6xl mx-auto mt-4 bg-[#0d1117] border border-[#30363d] rounded-3xl px-6">
        <div className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="CMON DAO" className="h-8 w-8" onError={(e) => e.target.style.display = 'none'} />
              <span className="text-lg font-semibold tracking-tight">CMON DAO</span>
            </div>
            <nav className="flex items-center gap-6">
              {authenticated && walletConnected && (
                <>
                  <button onClick={() => setActiveTab('stake')} className={`text-sm transition-colors ${activeTab === 'stake' ? 'text-white' : 'text-gray-400 hover:text-white'}`}>Stake</button>
                  <button onClick={() => setActiveTab('governance')} className={`text-sm transition-colors ${activeTab === 'governance' ? 'text-white' : 'text-gray-400 hover:text-white'}`}>Governance</button>
                </>
              )}
            </nav>
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

      {!authenticated || !walletConnected ? (
        <main className="relative overflow-hidden">
          {/* Background gradient orbs like Aave */}
          <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-[#58a6ff]/20 to-[#a371f7]/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-[#3fb950]/20 to-[#58a6ff]/20 rounded-full blur-3xl"></div>
          
          <div className="relative max-w-6xl mx-auto py-24 md:py-32">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center px-6">
              {/* Left side - Text */}
              <div>
                <div className="inline-block px-4 py-2 bg-[#238636]/20 border border-[#238636]/30 rounded-full mb-6">
                  <span className="text-sm font-semibold text-[#3fb950]">Charity-Powered Staking</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                  Put your{' '}
                  <span className="bg-gradient-to-r from-[#3fb950] to-[#58a6ff] bg-clip-text text-transparent">
                    MON
                  </span>
                  {' '}to work for good
                </h1>
                <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                  Stake your MON. Keep your principal safe. All yield generated goes directly to charitable causes voted by the community.
                </p>
                <button 
                  onClick={() => { setActiveTab('stake'); login(); }} 
                  className="bg-[#238636] hover:bg-[#2ea043] text-white font-bold px-8 py-4 rounded-xl text-lg transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2"
                >
                  <span>Start Giving Back</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
                
                <div className="grid grid-cols-3 gap-6 mt-12 pt-12 border-t border-[#30363d]">
                  <div>
                    <div className="text-3xl font-bold text-white mb-1">20%</div>
                    <div className="text-sm text-gray-500 uppercase tracking-wide">APR</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white mb-1">${(parseFloat(totalStaked) * 1.23).toFixed(0)}</div>
                    <div className="text-sm text-gray-500 uppercase tracking-wide">TVL</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white mb-1">{parseFloat(totalYield).toFixed(0)}</div>
                    <div className="text-sm text-gray-500 uppercase tracking-wide">Donated</div>
                  </div>
                </div>
              </div>
              
              {/* Right side - Graphic circles like Aave */}
              <div className="relative hidden lg:block">
                <div className="relative w-full h-[500px]">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#58a6ff] to-[#a371f7] rounded-full opacity-20 blur-2xl animate-pulse"></div>
                  <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-br from-[#3fb950] to-[#58a6ff] rounded-full opacity-20 blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-[#a371f7] to-[#3fb950] rounded-full opacity-10 blur-3xl"></div>
                  
                  {/* Floating cards */}
                  <div className="absolute top-20 right-20 card p-4 animate-fadeIn">
                    <div className="text-xs text-gray-400 mb-1">Your Impact</div>
                    <div className="text-2xl font-bold text-[#3fb950]">+{parseFloat(totalYield).toFixed(0)} MON</div>
                  </div>
                  <div className="absolute bottom-32 left-10 card p-4 animate-fadeIn" style={{animationDelay: '0.3s'}}>
                    <div className="text-xs text-gray-400 mb-1">Community</div>
                    <div className="text-2xl font-bold text-[#58a6ff]">100% Charity</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      ) : (
        <main className="max-w-6xl mx-auto py-8 px-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="card card-hover p-5 animate-fadeIn">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400 font-medium">Your CMON</span>
                <span className="badge badge-info">Voting Power</span>
              </div>
              <div className="text-3xl font-bold stat-number">{parseFloat(cmonBalance).toFixed(2)}</div>
              <div className="text-xs text-gray-500 mt-1">≈ ${(parseFloat(cmonBalance) * 1.23).toFixed(2)}</div>
            </div>

            <div className="card card-hover p-5 animate-fadeIn" style={{animationDelay: '0.1s'}}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400 font-medium">Treasury</span>
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div className="text-3xl font-bold stat-number">{parseFloat(totalStaked).toFixed(2)}</div>
              <div className="text-xs text-[#3fb950] mt-1 font-medium">Total Staked</div>
            </div>

            <div className="card card-hover p-5 animate-fadeIn cursor-pointer" style={{animationDelay: '0.2s'}} onClick={() => setShowAllocations(true)}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400 font-medium">Deployed</span>
                <span className="badge badge-warning">{getWeightedAPR()}% APR</span>
              </div>
              <div className="text-3xl font-bold stat-number">{YIELD_ALLOCATIONS.reduce((s, p) => s + p.amount, 0).toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">Click to view allocation</div>
            </div>

            <div className="card card-hover p-5 animate-fadeIn" style={{animationDelay: '0.3s'}}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400 font-medium">Charity Yield</span>
                <span className="badge badge-success">Generated</span>
              </div>
              <div className="text-3xl font-bold stat-number text-[#3fb950]">{parseFloat(totalYield).toFixed(2)}</div>
              <div className="text-xs text-gray-500 mt-1 font-medium">For good causes</div>
            </div>
          </div>

          {/* Main Content */}
          {activeTab === 'stake' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card p-6">
                <h2 className="text-xl font-bold mb-6">Stake MON</h2>
                
                <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400 font-medium">Available to stake</span>
                    <span className="text-sm font-semibold">{parseFloat(nativeMonBalance).toFixed(4)} MON</span>
                  </div>
                  <div className="text-xs text-gray-500">Your native MON balance</div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Amount</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      placeholder="0.0"
                      max={nativeMonBalance}
                      className="input-field w-full text-2xl pr-20"
                    />
                    <button onClick={() => setStakeAmount(nativeMonBalance)} className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-[#21262d] hover:bg-[#30363d] rounded text-xs font-medium transition">
                      MAX
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>≈ ${(parseFloat(stakeAmount || 0) * 1.23).toFixed(2)}</span>
                    <span className="font-medium">1 MON = 1 CMON</span>
                  </div>
                </div>

                <button onClick={handleStake} disabled={loading || !stakeAmount || parseFloat(stakeAmount) > parseFloat(nativeMonBalance)} className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? 'Processing...' : 'Stake MON'}
                </button>

                <div className="mt-6 p-4 bg-[#0d1117] border border-[#30363d] rounded-lg">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-[#58a6ff] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <div className="text-sm text-gray-400">
                      <p className="font-medium text-white mb-1">How it works</p>
                      <p>Stake native MON to receive CMON 1:1. Your staked MON generates 20% APR, with all yield going to charity. CMON gives you voting power in the DAO.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h2 className="text-xl font-bold mb-6">Your Position</h2>
                
                {stakeInfo && parseFloat(stakeInfo.amount) > 0 ? (
                  <div className="space-y-4">
                    <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-4">
                      <div className="text-sm text-gray-400 mb-1 font-medium">Staked amount</div>
                      <div className="text-3xl font-bold">{parseFloat(stakeInfo.amount).toFixed(4)} MON</div>
                      <div className="text-xs text-gray-500 mt-1">≈ ${(parseFloat(stakeInfo.amount) * 1.23).toFixed(2)}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-4">
                        <div className="text-sm text-gray-400 mb-1 font-medium">Status</div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${stakeInfo.inCooldown ? 'bg-[#d29922]' : 'bg-[#3fb950]'}`}></div>
                          <span className="text-sm font-medium">{stakeInfo.inCooldown ? 'Cooldown' : 'Active'}</span>
                        </div>
                      </div>

                      <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-4">
                        <div className="text-sm text-gray-400 mb-1 font-medium">APR</div>
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
                    <p className="text-gray-400 text-sm font-medium">No active stake</p>
                    <p className="text-gray-500 text-xs mt-1">Stake MON to start earning for charity</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'governance' && (
            <div>
              {/* Voting Power Card */}
              <div className="card p-6 mb-8 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold mb-1">Your Voting Power</h3>
                    <p className="text-sm text-gray-400">Distribute your CMON across proposals</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold stat-number">{(parseFloat(cmonBalance) - votingPowerUsed).toFixed(2)}</div>
                    <div className="text-xs text-gray-500 mt-1">of {parseFloat(cmonBalance).toFixed(2)} CMON available</div>
                  </div>
                </div>
                <div className="mt-4 bg-[#0d1117] rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-[#3fb950] to-[#58a6ff] h-full transition-all" style={{width: `${parseFloat(cmonBalance) > 0 ? ((parseFloat(cmonBalance) - votingPowerUsed) / parseFloat(cmonBalance)) * 100 : 0}%`}}></div>
                </div>
              </div>

              <h2 className="text-2xl font-bold mb-6">Active Charity Proposals</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {DEMO_PROPOSALS.map((d, i) => (
                  <div key={i} className="card card-hover p-6 animate-fadeIn" style={{animationDelay: `${i * 0.1}s`}}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="badge badge-success">Active</span>
                          <span className="badge badge-info">{d.amount} MON</span>
                        </div>
                        <h3 className="text-xl font-bold mb-2">{d.title}</h3>
                        <p className="text-sm text-gray-400 leading-relaxed">{d.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-[#238636]/10 border border-[#238636]/30 rounded-lg p-3">
                        <div className="text-2xl font-bold text-[#3fb950]">{demoVotes[i]?.for?.toFixed(0) || 0}</div>
                        <div className="text-xs text-gray-400 mt-1 font-medium">For</div>
                      </div>
                      <div className="bg-[#da3633]/10 border border-[#da3633]/30 rounded-lg p-3">
                        <div className="text-2xl font-bold text-[#f85149]">{demoVotes[i]?.against?.toFixed(0) || 0}</div>
                        <div className="text-xs text-gray-400 mt-1 font-medium">Against</div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="text-xs text-gray-400 font-medium mb-2 block">Vote Amount (CMON)</label>
                      <input
                        type="number"
                        value={voteAmounts[i] || ''}
                        onChange={(e) => setVoteAmounts({...voteAmounts, [i]: e.target.value})}
                        placeholder="0.0"
                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:border-[#58a6ff] focus:outline-none"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => { handleDemoVote(i, true, voteAmounts[i]); setVoteAmounts({...voteAmounts, [i]: ''}); }} disabled={loading} className="flex-1 py-2.5 bg-[#238636] hover:bg-[#2ea043] rounded-lg font-semibold text-sm transition disabled:opacity-50">
                        Vote For
                      </button>
                      <button onClick={() => { handleDemoVote(i, false, voteAmounts[i]); setVoteAmounts({...voteAmounts, [i]: ''}); }} disabled={loading} className="flex-1 py-2.5 bg-[#da3633] hover:bg-[#f85149] rounded-lg font-semibold text-sm transition disabled:opacity-50">
                        Vote Against
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {proposals.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-xl font-bold mb-4">On-Chain Proposals</h3>
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
                        <div className="text-xs text-gray-400 mt-1 font-medium">For</div>
                      </div>
                      <div className="bg-[#da3633]/10 border border-[#da3633]/30 rounded-lg p-3">
                        <div className="text-2xl font-bold text-[#f85149]">{parseFloat(p.againstVotes).toFixed(0)}</div>
                        <div className="text-xs text-gray-400 mt-1 font-medium">Against</div>
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
                      <div className="text-xs text-gray-400 font-medium">APR: {pool.apr}%</div>
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
