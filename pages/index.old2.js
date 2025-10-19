import { useState, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useWalletClient, usePublicClient } from 'wagmi';
import { formatEther } from 'viem';
import { CONTRACTS, loadDeployedAddresses } from '../lib/contracts';
import StakeTab from '../components/StakeTab';
import GovernanceTab from '../components/GovernanceTab';
import Stats from '../components/Stats';

export default function Home() {
  const { ready, authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [activeTab, setActiveTab] = useState('stake');
  const [deployment, setDeployment] = useState(null);
  const [monBalance, setMonBalance] = useState('0');
  const [cmonBalance, setCmonBalance] = useState('0');
  const [totalStaked, setTotalStaked] = useState('0');
  const [totalYield, setTotalYield] = useState('0');
  const [monPrice, setMonPrice] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const dep = loadDeployedAddresses();
    setDeployment(dep);
    fetchMonPrice();
  }, []);

  useEffect(() => {
    if (authenticated && wallets.length > 0 && deployment) {
      loadData();
    }
  }, [authenticated, wallets, deployment]);

  const fetchMonPrice = async () => {
    // For demo purposes, using a mock price
    // In production, you'd fetch from Pyth oracle
    // const pythPrice = await fetchPythPrice();
    setMonPrice(1.23); // Mock price $1.23 per MON
  };

  const loadData = async () => {
    await loadBalances();
    await loadProtocolStats();
  };

  const loadBalances = async () => {
    try {
      if (!wallets || wallets.length === 0) return;
      const address = wallets[0].address;
      
      const monBal = await publicClient.readContract({
        address: CONTRACTS.MONToken.address,
        abi: CONTRACTS.MONToken.abi,
        functionName: 'balanceOf',
        args: [address]
      });
      
      const cmonBal = await publicClient.readContract({
        address: CONTRACTS.CMONToken.address,
        abi: CONTRACTS.CMONToken.abi,
        functionName: 'balanceOf',
        args: [address]
      });
      
      setMonBalance(formatEther(monBal));
      setCmonBalance(formatEther(cmonBal));
    } catch (error) {
      console.error('Error loading balances:', error);
    }
  };

  const loadProtocolStats = async () => {
    try {
      const staked = await publicClient.readContract({
        address: CONTRACTS.CMONStaking.address,
        abi: CONTRACTS.CMONStaking.abi,
        functionName: 'totalStaked'
      });
      
      const yield_ = await publicClient.readContract({
        address: CONTRACTS.CMONStaking.address,
        abi: CONTRACTS.CMONStaking.abi,
        functionName: 'totalYieldGenerated'
      });
      
      setTotalStaked(formatEther(staked));
      setTotalYield(formatEther(yield_));
    } catch (error) {
      console.error('Error loading protocol stats:', error);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-xl text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  if (!deployment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
        <div className="text-center max-w-md">
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 mb-6">
            <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h1 className="text-2xl font-bold mb-2 text-red-400">Contracts Not Deployed</h1>
            <p className="text-gray-400 mb-4">Please deploy the contracts first</p>
            <code className="bg-gray-800 px-4 py-2 rounded-lg inline-block text-sm">npm run deploy</code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold mb-3">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-secondary animate-gradient">
                CMON DAO
              </span>
            </h1>
            <p className="text-gray-400 text-lg">Put your MON to work for good causes 💚</p>
          </div>
          
          {!authenticated ? (
            <button
              onClick={login}
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-primary/50 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Connect Wallet
            </button>
          ) : (
            <div className="flex items-center gap-4">
              <div className="bg-gray-800/50 backdrop-blur rounded-xl px-6 py-3 border border-gray-700">
                <div className="text-xs text-gray-400 mb-1">Connected</div>
                <div className="font-mono text-sm font-semibold">
                  {wallets[0]?.address.slice(0, 6)}...{wallets[0]?.address.slice(-4)}
                </div>
              </div>
              <button
                onClick={logout}
                className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-xl transition-all font-semibold"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>

        {authenticated && (
          <>
            {/* Stats */}
            <Stats 
              monBalance={monBalance} 
              cmonBalance={cmonBalance} 
              totalStaked={totalStaked} 
              totalYield={totalYield}
              monPrice={monPrice}
            />
            
            {/* Tabs */}
            <div className="flex gap-2 mb-8 border-b border-gray-700 overflow-x-auto">
              <button
                onClick={() => setActiveTab('stake')}
                className={`px-8 py-4 font-bold transition-all relative ${
                  activeTab === 'stake'
                    ? 'text-primary'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Stake
                </div>
                {activeTab === 'stake' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary rounded-t-full"></div>
                )}
              </button>
              
              <button
                onClick={() => setActiveTab('governance')}
                className={`px-8 py-4 font-bold transition-all relative ${
                  activeTab === 'governance'
                    ? 'text-primary'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  Governance
                </div>
                {activeTab === 'governance' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary rounded-t-full"></div>
                )}
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'stake' && (
              <StakeTab 
                monBalance={monBalance} 
                loading={loading} 
                setLoading={setLoading} 
                wallets={wallets} 
                walletClient={walletClient} 
                publicClient={publicClient} 
                loadBalances={loadBalances} 
                loadProtocolStats={loadProtocolStats}
                monPrice={monPrice}
              />
            )}
            
            {activeTab === 'governance' && (
              <GovernanceTab 
                cmonBalance={cmonBalance} 
                loading={loading} 
                setLoading={setLoading} 
                wallets={wallets} 
                walletClient={walletClient} 
                publicClient={publicClient}
              />
            )}
          </>
        )}

        {/* Footer */}
        <div className="mt-16 text-center text-gray-500 text-sm">
          <p>Built with ❤️ for charity on Monad</p>
          <p className="mt-2">
            <a href="https://docs.monad.xyz" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition">
              Monad Docs
            </a>
            {' • '}
            <a href="https://testnet.monadexplorer.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition">
              Explorer
            </a>
            {' • '}
            <a href="https://faucet.monad.xyz" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition">
              Faucet
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
