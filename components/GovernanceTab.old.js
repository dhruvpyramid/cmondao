import { useState, useEffect } from 'react';
import { parseEther, formatEther } from 'viem';
import { CONTRACTS } from '../lib/contracts';

export default function GovernanceTab({ cmonBalance, loading, setLoading, wallets, walletClient, publicClient }) {
  const [proposals, setProposals] = useState([]);
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalDescription, setProposalDescription] = useState('');
  const [proposalType, setProposalType] = useState('0');
  const [targetAddress, setTargetAddress] = useState('');
  const [donationAmount, setDonationAmount] = useState('');

  useEffect(() => {
    loadProposals();
  }, [wallets]);

  const loadProposals = async () => {
    try {
      const count = await publicClient.readContract({
        address: CONTRACTS.CMONGovernance.address,
        abi: CONTRACTS.CMONGovernance.abi,
        functionName: 'proposalCount'
      });
      const proposalList = [];
      for (let i = 1; i <= Number(count); i++) {
        const proposal = await publicClient.readContract({
          address: CONTRACTS.CMONGovernance.address,
          abi: CONTRACTS.CMONGovernance.abi,
          functionName: 'getProposal',
          args: [i]
        });
        proposalList.push({
          id: Number(proposal[0]),
          proposer: proposal[1],
          title: proposal[2],
          description: proposal[3],
          proposalType: Number(proposal[4]),
          targetAddress: proposal[5],
          amount: formatEther(proposal[6]),
          startTime: Number(proposal[7]),
          endTime: Number(proposal[8]),
          forVotes: formatEther(proposal[9]),
          againstVotes: formatEther(proposal[10]),
          abstainVotes: formatEther(proposal[11]),
          status: Number(proposal[12]),
          executed: proposal[13]
        });
      }
      setProposals(proposalList.reverse());
    } catch (error) {
      console.error('Error loading proposals:', error);
    }
  };

  const handleCreateProposal = async () => {
    try {
      setLoading(true);
      const wallet = wallets[0];
      await wallet.switchChain(10143);
      const amount = donationAmount ? parseEther(donationAmount) : 0n;
      const hash = await walletClient.writeContract({
        address: CONTRACTS.CMONGovernance.address,
        abi: CONTRACTS.CMONGovernance.abi,
        functionName: 'createProposal',
        args: [proposalTitle, proposalDescription, Number(proposalType), targetAddress, amount]
      });
      await publicClient.waitForTransactionReceipt({ hash });
      await loadProposals();
      setProposalTitle('');
      setProposalDescription('');
      setTargetAddress('');
      setDonationAmount('');
      alert('Proposal created successfully!');
    } catch (error) {
      console.error('Error creating proposal:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (proposalId, support) => {
    try {
      setLoading(true);
      const wallet = wallets[0];
      await wallet.switchChain(10143);
      const hash = await walletClient.writeContract({
        address: CONTRACTS.CMONGovernance.address,
        abi: CONTRACTS.CMONGovernance.abi,
        functionName: 'castVote',
        args: [proposalId, support]
      });
      await publicClient.waitForTransactionReceipt({ hash });
      await loadProposals();
      alert('Vote cast successfully!');
    } catch (error) {
      console.error('Error voting:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status) => {
    const statuses = ['Active', 'Succeeded', 'Failed', 'Executed', 'Cancelled'];
    return statuses[status] || 'Unknown';
  };

  const getProposalTypeText = (type) => {
    const types = ['Charity Donation', 'Treasury Allocation', 'Parameter Change', 'General'];
    return types[type] || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
        <h2 className="text-2xl font-bold mb-4">Create Proposal</h2>
        <p className="text-gray-400 text-sm mb-6">Requires 100 CMON to create a proposal</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Title</label>
            <input type="text" value={proposalTitle} onChange={(e) => setProposalTitle(e.target.value)} placeholder="Proposal title" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Type</label>
            <select value={proposalType} onChange={(e) => setProposalType(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary">
              <option value="0">Charity Donation</option>
              <option value="1">Treasury Allocation</option>
              <option value="2">Parameter Change</option>
              <option value="3">General</option>
            </select>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">Description</label>
          <textarea value={proposalDescription} onChange={(e) => setProposalDescription(e.target.value)} placeholder="Describe your proposal..." rows="4" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Target Address</label>
            <input type="text" value={targetAddress} onChange={(e) => setTargetAddress(e.target.value)} placeholder="0x..." className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Amount (MON)</label>
            <input type="number" value={donationAmount} onChange={(e) => setDonationAmount(e.target.value)} placeholder="0.0" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary" />
          </div>
        </div>
        <button onClick={handleCreateProposal} disabled={loading || !proposalTitle || !proposalDescription || parseFloat(cmonBalance) < 100} className="w-full bg-primary hover:bg-primary/80 disabled:bg-gray-700 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold transition">
          {loading ? 'Processing...' : 'Create Proposal'}
        </button>
      </div>

      <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
        <h2 className="text-2xl font-bold mb-6">Proposals</h2>
        {proposals.length === 0 ? (
          <div className="text-center text-gray-400 py-8">No proposals yet. Create the first one!</div>
        ) : (
          <div className="space-y-4">
            {proposals.map((proposal) => (
              <div key={proposal.id} className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{proposal.title}</h3>
                    <div className="flex gap-2 text-sm">
                      <span className="bg-primary/20 text-primary px-2 py-1 rounded">{getProposalTypeText(proposal.proposalType)}</span>
                      <span className={`px-2 py-1 rounded ${proposal.status === 0 ? 'bg-green-500/20 text-green-400' : proposal.status === 1 ? 'bg-blue-500/20 text-blue-400' : proposal.status === 3 ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {getStatusText(proposal.status)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-400">#{proposal.id}</div>
                </div>
                <p className="text-gray-300 mb-4">{proposal.description}</p>
                {proposal.targetAddress !== '0x0000000000000000000000000000000000000000' && (
                  <div className="text-sm text-gray-400 mb-4">
                    <div>Target: {proposal.targetAddress.slice(0, 10)}...{proposal.targetAddress.slice(-8)}</div>
                    {parseFloat(proposal.amount) > 0 && <div>Amount: {parseFloat(proposal.amount).toFixed(2)} MON</div>}
                  </div>
                )}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-800 rounded p-3">
                    <div className="text-green-400 font-bold">{parseFloat(proposal.forVotes).toFixed(0)}</div>
                    <div className="text-xs text-gray-400">For</div>
                  </div>
                  <div className="bg-gray-800 rounded p-3">
                    <div className="text-red-400 font-bold">{parseFloat(proposal.againstVotes).toFixed(0)}</div>
                    <div className="text-xs text-gray-400">Against</div>
                  </div>
                  <div className="bg-gray-800 rounded p-3">
                    <div className="text-gray-400 font-bold">{parseFloat(proposal.abstainVotes).toFixed(0)}</div>
                    <div className="text-xs text-gray-400">Abstain</div>
                  </div>
                </div>
                {proposal.status === 0 && (
                  <div className="flex gap-2">
                    <button onClick={() => handleVote(proposal.id, 1)} disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 px-4 py-2 rounded-lg transition">For</button>
                    <button onClick={() => handleVote(proposal.id, 0)} disabled={loading} className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 px-4 py-2 rounded-lg transition">Against</button>
                    <button onClick={() => handleVote(proposal.id, 2)} disabled={loading} className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 px-4 py-2 rounded-lg transition">Abstain</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
