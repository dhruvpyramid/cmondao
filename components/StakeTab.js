import { useState, useEffect } from 'react';
import { parseEther } from 'viem';
import { CONTRACTS } from '../lib/contracts';

export default function StakeTab({ monBalance, loading, setLoading, wallets, walletClient, publicClient, loadBalances, loadProtocolStats, monPrice }) {
  const [stakeAmount, setStakeAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [stakeInfo, setStakeInfo] = useState(null);

  useEffect(() => {
    if (wallets && wallets.length > 0) {
      loadStakeInfo();
    }
  }, [wallets]);

  const loadStakeInfo = async () => {
    try {
      if (!wallets || wallets.length === 0) return;
      const address = wallets[0].address;
      const info = await publicClient.readContract({
        address: CONTRACTS.CMONStaking.address,
        abi: CONTRACTS.CMONStaking.abi,
        functionName: 'getStakeInfo',
        args: [address]
      });
      setStakeInfo({
        amount: parseFloat(info[0]) / 1e18,
        stakedAt: Number(info[1]),
        cooldownStart: Number(info[2]),
        inCooldown: info[3],
        cooldownRemaining: Number(info[4])
      });
    } catch (error) {
      console.error('Error loading stake info:', error);
    }
  };

  const handleGetMON = async () => {
    try {
      setLoading(true);
      const wallet = wallets[0];
      await wallet.switchChain(10143);
      const hash = await walletClient.writeContract({
        address: CONTRACTS.MONToken.address,
        abi: CONTRACTS.MONToken.abi,
        functionName: 'faucet'
      });
      await publicClient.waitForTransactionReceipt({ hash });
      await loadBalances();
      alert('✅ Successfully claimed 1000 MON!');
    } catch (error) {
      console.error('Error claiming MON:', error);
      alert('❌ Error claiming MON: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStake = async () => {
    try {
      setLoading(true);
      const wallet = wallets[0];
      await wallet.switchChain(10143);
      const amount = parseEther(stakeAmount);
      
      const approveHash = await walletClient.writeContract({
        address: CONTRACTS.MONToken.address,
        abi: CONTRACTS.MONToken.abi,
        functionName: 'approve',
        args: [CONTRACTS.CMONStaking.address, amount]
      });
      await publicClient.waitForTransactionReceipt({ hash: approveHash });
      
      const stakeHash = await walletClient.writeContract({
        address: CONTRACTS.CMONStaking.address,
        abi: CONTRACTS.CMONStaking.abi,
        functionName: 'stake',
        args: [amount]
      });
      await publicClient.waitForTransactionReceipt({ hash: stakeHash });
      
      await loadBalances();
      await loadStakeInfo();
      await loadProtocolStats();
      setStakeAmount('');
      alert('✅ Successfully staked MON!');
    } catch (error) {
      console.error('Error staking:', error);
      alert('❌ Error staking: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateCooldown = async () => {
    try {
      setLoading(true);
      const wallet = wallets[0];
      await wallet.switchChain(10143);
      const hash = await walletClient.writeContract({
        address: CONTRACTS.CMONStaking.address,
        abi: CONTRACTS.CMONStaking.abi,
        functionName: 'initiateCooldown'
      });
      await publicClient.waitForTransactionReceipt({ hash });
      await loadStakeInfo();
      alert('✅ Cooldown initiated! You can withdraw after 7 days.');
    } catch (error) {
      console.error('Error initiating cooldown:', error);
      alert('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    try {
      setLoading(true);
      const wallet = wallets[0];
      await wallet.switchChain(10143);
      const amount = parseEther(withdrawAmount);
      const hash = await walletClient.writeContract({
        address: CONTRACTS.CMONStaking.address,
        abi: CONTRACTS.CMONStaking.abi,
        functionName: 'withdraw',
        args: [amount]
      });
      await publicClient.waitForTransactionReceipt({ hash });
      
      await loadBalances();
      await loadStakeInfo();
      await loadProtocolStats();
      setWithdrawAmount('');
      alert('✅ Successfully withdrawn MON!');
    } catch (error) {
      console.error('Error withdrawing:', error);
      alert('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Stake Card */}
      <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur rounded-2xl p-8 border border-gray-700 hover:border-primary/50 transition-all shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-primary/20 p-3 rounded-xl">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold">Stake MON</h2>
        </div>
        
        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
          Stake your MON tokens to receive CMON and support charity through yield generation
        </p>

        {/* MON Balance Display */}
        <div className="bg-gray-900/50 rounded-xl p-4 mb-6 border border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-gray-400">Your MON Balance</div>
              <div className="text-2xl font-bold mt-1">{parseFloat(monBalance).toFixed(2)} MON</div>
              {monPrice > 0 && (
                <div className="text-sm text-gray-500">≈ ${(parseFloat(monBalance) * monPrice).toFixed(2)}</div>
              )}
            </div>
            <button
              onClick={handleGetMON}
              disabled={loading}
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 disabled:from-gray-700 disabled:to-gray-700 px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Get MON
            </button>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">Amount to Stake</label>
          <div className="relative">
            <input
              type="number"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              placeholder="0.0"
              className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-4 text-lg focus:outline-none focus:border-primary transition-all"
            />
            <button
              onClick={() => setStakeAmount(monBalance)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-primary hover:text-primary/80 font-semibold"
            >
              MAX
            </button>
          </div>
          {stakeAmount && monPrice > 0 && (
            <div className="text-sm text-gray-500 mt-2">
              ≈ ${(parseFloat(stakeAmount) * monPrice).toFixed(2)}
            </div>
          )}
        </div>

        <button
          onClick={handleStake}
          disabled={loading || !stakeAmount || parseFloat(stakeAmount) <= 0}
          className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed px-6 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-primary/20"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            'Stake MON'
          )}
        </button>
      </div>

      {/* Withdraw Card */}
      <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur rounded-2xl p-8 border border-gray-700 hover:border-rose-500/50 transition-all shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-rose-500/20 p-3 rounded-xl">
            <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold">Withdraw MON</h2>
        </div>
        
        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
          Withdraw your staked MON (7-day cooldown required)
        </p>

        {stakeInfo && (
          <div className="mb-6 p-5 bg-gray-900/50 rounded-xl border border-gray-700">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-400 mb-1">Your Stake</div>
                <div className="text-xl font-bold">{stakeInfo.amount.toFixed(2)} MON</div>
                {monPrice > 0 && (
                  <div className="text-xs text-gray-500">≈ ${(stakeInfo.amount * monPrice).toFixed(2)}</div>
                )}
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Cooldown Status</div>
                <div className={`text-xl font-bold ${stakeInfo.inCooldown ? 'text-yellow-400' : 'text-gray-400'}`}>
                  {stakeInfo.inCooldown ? '⏳ Active' : '⏸️ Not Started'}
                </div>
              </div>
            </div>
            
            {stakeInfo.inCooldown && stakeInfo.cooldownRemaining > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Time Remaining</span>
                  <span className="text-yellow-400 font-bold">
                    {Math.floor(stakeInfo.cooldownRemaining / 86400)}d {Math.floor((stakeInfo.cooldownRemaining % 86400) / 3600)}h
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                  <div 
                    className="bg-yellow-400 h-2 rounded-full transition-all"
                    style={{ width: `${((604800 - stakeInfo.cooldownRemaining) / 604800) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {stakeInfo && stakeInfo.amount > 0 && !stakeInfo.inCooldown && (
          <button
            onClick={handleInitiateCooldown}
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed px-6 py-4 rounded-xl font-bold text-lg transition-all shadow-lg mb-4"
          >
            {loading ? 'Processing...' : 'Initiate Cooldown'}
          </button>
        )}

        {stakeInfo && stakeInfo.inCooldown && stakeInfo.cooldownRemaining === 0 && (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">Amount to Withdraw</label>
              <div className="relative">
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.0"
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-4 text-lg focus:outline-none focus:border-rose-500 transition-all"
                />
                <button
                  onClick={() => setWithdrawAmount(stakeInfo.amount.toString())}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-rose-400 hover:text-rose-300 font-semibold"
                >
                  MAX
                </button>
              </div>
              {withdrawAmount && monPrice > 0 && (
                <div className="text-sm text-gray-500 mt-2">
                  ≈ ${(parseFloat(withdrawAmount) * monPrice).toFixed(2)}
                </div>
              )}
            </div>

            <button
              onClick={handleWithdraw}
              disabled={loading || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
              className="w-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed px-6 py-4 rounded-xl font-bold text-lg transition-all shadow-lg"
            >
              {loading ? 'Processing...' : 'Withdraw MON'}
            </button>
          </>
        )}

        {(!stakeInfo || stakeInfo.amount === 0) && (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p>No active stake</p>
            <p className="text-sm mt-1">Stake MON to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
