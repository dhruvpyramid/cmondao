import { useState, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useWalletClient, usePublicClient } from 'wagmi';
import { formatEther, parseEther } from 'viem';
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const dep = loadDeployedAddresses();
    setDeployment(dep);
  }, []);

  useEffect(() => {
    if (authenticated && wallets.length > 0 && deployment) {
      loadData();
    }
  }, [authenticated, wallets, deployment]);

  const loadData = async () => {
    await loadBalances();
    await loadProtocolStats();
  };

  const loadBalances = async () => {
    try {
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
    return <div className="min-h-screen flex items-center justify-center"><div className="text-xl">Loading...</div></div>;
  }

  if (!deployment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">⚠️ Contracts Not Deployed</h1>
          <p>Please deploy contracts first: <code className="bg-gray-800 px-4 py-2 rounded">npm run deploy</code></p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-5xl font-bold mb-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">CMON DAO</span>
            </h1>
            <p className="text-gray-400">Put your MON to work for good causes</p>
          </div>
          {!authenticated ? (
            <button onClick={login} className="bg-primary hover:bg-primary/80 px-6 py-3 rounded-lg font-semibold transition">
              Connect Wallet
            </button>
          ) : (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-400">Connected</div>
                <div className="font-mono text-sm">{wallets[0]?.address.slice(0, 6)}...{wallets[0]?.address.slice(-4)}</div>
              </div>
              <button onClick={logout} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition">Disconnect</button>
            </div>
          )}
        </div>

        {authenticated && (
          <>
            <Stats monBalance={monBalance} cmonBalance={cmonBalance} totalStaked={totalStaked} totalYield={totalYield} loading={loading} setLoading={setLoading} wallets={wallets} walletClient={walletClient} publicClient={publicClient} loadBalances={loadBalances} />
            
            <div className="flex gap-4 mb-6 border-b border-gray-700">
              <button onClick={() => setActiveTab('stake')} className={`px-6 py-3 font-semibold transition ${activeTab === 'stake' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-gray-200'}`}>Stake</button>
              <button onClick={() => setActiveTab('governance')} className={`px-6 py-3 font-semibold transition ${activeTab === 'governance' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-gray-200'}`}>Governance</button>
            </div>

            {activeTab === 'stake' && <StakeTab monBalance={monBalance} loading={loading} setLoading={setLoading} wallets={wallets} walletClient={walletClient} publicClient={publicClient} loadBalances={loadBalances} loadProtocolStats={loadProtocolStats} />}
            {activeTab === 'governance' && <GovernanceTab cmonBalance={cmonBalance} loading={loading} setLoading={setLoading} wallets={wallets} walletClient={walletClient} publicClient={publicClient} />}
          </>
        )}
      </div>
    </div>
  );
}
