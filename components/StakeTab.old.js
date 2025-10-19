import { useState, useEffect } from 'react';
import { parseEther } from 'viem';
import { CONTRACTS } from '../lib/contracts';

export default function StakeTab({ monBalance, loading, setLoading, wallets, walletClient, publicClient, loadBalances, loadProtocolStats }) {
  const [stakeAmount, setStakeAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [stakeInfo, setStakeInfo] = useState(null);

  useEffect(() => {
    loadStakeInfo();
  }, [wallets]);

  const loadStakeInfo = async () => {
    try {
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
      alert('Successfully staked MON!');
    } catch (error) {
      console.error('Error staking:', error);
      alert('Error staking: ' + error.message);
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
      alert('Cooldown initiated! You can withdraw after 7 days.');
    } catch (error) {
      console.error('Error initiating cooldown:', error);
      alert('Error: ' + error.message);
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
      alert('Successfully withdrawn MON!');
    } catch (error) {
      console.error('Error withdrawing:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
        <h2 className="text-2xl font-bold mb-4">Stake MON</h2>
        <p className="text-gray-400 text-sm mb-6">Stake your MON tokens to receive CMON and support charity</p>
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">Amount to Stake</label>
          <input type="number" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} placeholder="0.0" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary" />
          <div className="text-xs text-gray-500 mt-1">Available: {parseFloat(monBalance).toFixed(2)} MON</div>
        </div>
        <button onClick={handleStake} disabled={loading || !stakeAmount || parseFloat(stakeAmount) <= 0} className="w-full bg-primary hover:bg-primary/80 disabled:bg-gray-700 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold transition">
          {loading ? 'Processing...' : 'Stake MON'}
        </button>
      </div>

      <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
        <h2 className="text-2xl font-bold mb-4">Withdraw MON</h2>
        <p className="text-gray-400 text-sm mb-6">Withdraw your staked MON (7-day cooldown required)</p>
        {stakeInfo && (
          <div className="mb-4 p-4 bg-gray-900 rounded-lg">
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Your Stake:</span>
              <span className="font-semibold">{stakeInfo.amount.toFixed(2)} MON</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Cooldown Status:</span>
              <span className={stakeInfo.inCooldown ? 'text-yellow-400' : 'text-gray-400'}>
                {stakeInfo.inCooldown ? 'Active' : 'Not Started'}
              </span>
            </div>
            {stakeInfo.inCooldown && stakeInfo.cooldownRemaining > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-400">Time Remaining:</span>
                <span className="text-yellow-400">
                  {Math.floor(stakeInfo.cooldownRemaining / 86400)}d {Math.floor((stakeInfo.cooldownRemaining % 86400) / 3600)}h
                </span>
              </div>
            )}
          </div>
        )}
        {stakeInfo && stakeInfo.amount > 0 && !stakeInfo.inCooldown && (
          <button onClick={handleInitiateCooldown} disabled={loading} className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold transition mb-4">
            {loading ? 'Processing...' : 'Initiate Cooldown'}
          </button>
        )}
        {stakeInfo && stakeInfo.inCooldown && stakeInfo.cooldownRemaining === 0 && (
          <>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Amount to Withdraw</label>
              <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="0.0" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary" />
              <div className="text-xs text-gray-500 mt-1">Staked: {stakeInfo.amount.toFixed(2)} MON</div>
            </div>
            <button onClick={handleWithdraw} disabled={loading || !withdrawAmount || parseFloat(withdrawAmount) <= 0} className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold transition">
              {loading ? 'Processing...' : 'Withdraw MON'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
