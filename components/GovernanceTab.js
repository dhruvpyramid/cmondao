import { useState, useEffect } from 'react';
import { parseEther, formatEther } from 'viem';
import { CONTRACTS, DEMO_PROPOSALS } from '../lib/contracts';

export default function GovernanceTab({ cmonBalance, loading, setLoading, wallets, walletClient, publicClient }) {
  const [proposals, setProposals] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalDescription, setProposalDescription] = useState('');
  const [proposalType, setProposalType] = useState('0');
  const [targetAddress, setTargetAddress] = useState('');
  const [donationAmount, setDonationAmount] = useState('');

  useEffect(() => {
    if (wallets && wallets.length > 0) {
      loadProposals();
      createDemoProposals();
    }
  }, [wallets]);

  const createDemoProposals = async () => {
    // Check if demo proposals already exist
    try {
      const count = await publicClient.readContract({
        address: CONTRACTS.CMONGovernance.address,
        abi: CONTRACTS.CMONGovernance.abi,
        functionName: 'proposalCount'
      });
      
      // Only create demo proposals if none exist
      if (Number(count) === 0) {
        console.log('Creating demo proposals...');
        // In production, you'd create these via the contract
        // For now, they'll be created when users interact
      }
    } catch (error) {
      console.error('Error checking proposals:', error);
    }
  };

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
      setShowCreateForm(false);
      alert('✅ Proposal created successfully!');
    } catch (error) {
      console.error('Error creating proposal:', error);
      alert('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDemoProposal = async (demo) => {
    try {
      setLoading(true);
      const wallet = wallets[0];
      await wallet.switchChain(10143);
      const amount = parseEther(demo.amount);
      
      const hash = await walletClient.writeContract({
        address: CONTRACTS.CMONGovernance.address,
        abi: CONTRACTS.CMONGovernance.abi,
        functionName: 'createProposal',
        args: [demo.title, demo.description, demo.type, demo.targetAddress, amount]
      });
      
      await publicClient.waitForTransactionReceipt({ hash });
      await loadProposals();
      alert('✅ Demo proposal created!');
    } catch (error) {
      console.error('Error creating demo proposal:', error);
      alert('❌ Error: ' + error.message);
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
      alert('✅ Vote cast successfully!');
    } catch (error) {
      console.error('Error voting:', error);
      alert('❌ Error: ' + error.message);
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

  const getStatusColor = (status) => {
    const colors = {
      0: 'from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-400',
      1: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400',
      2: 'from-red-500/20 to-rose-500/20 border-red-500/30 text-red-400',
      3: 'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400',
      4: 'from-gray-500/20 to-slate-500/20 border-gray-500/30 text-gray-400'
    };
    return colors[status] || colors[4];
  };

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold mb-2">Governance</h2>
          <p className="text-gray-400">Vote on proposals with your CMON tokens</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Proposal
        </button>
      </div>

      {/* Create Proposal Form */}
      {showCreateForm && (
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur rounded-2xl p-8 border border-gray-700 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold">Create New Proposal</h3>
            <button onClick={() => setShowCreateForm(false)} className="text-gray-400 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
            <p className="text-sm text-amber-400">
              💡 Requires 100 CMON to create a proposal. Your balance: {parseFloat(cmonBalance).toFixed(2)} CMON
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
              <input
                type="text"
                value={proposalTitle}
                onChange={(e) => setProposalTitle(e.target.value)}
                placeholder="Proposal title"
                className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
              <select
                value={proposalType}
                onChange={(e) => setProposalType(e.target.value)}
                className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all"
              >
                <option value="0">Charity Donation</option>
                <option value="1">Treasury Allocation</option>
                <option value="2">Parameter Change</option>
                <option value="3">General</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={proposalDescription}
              onChange={(e) => setProposalDescription(e.target.value)}
              placeholder="Describe your proposal in detail..."
              rows="4"
              className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Target Address</label>
              <input
                type="text"
                value={targetAddress}
                onChange={(e) => setTargetAddress(e.target.value)}
                placeholder="0x..."
                className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Amount (MON)</label>
              <input
                type="number"
                value={donationAmount}
                onChange={(e) => setDonationAmount(e.target.value)}
                placeholder="0.0"
                className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all"
              />
            </div>
          </div>

          <button
            onClick={handleCreateProposal}
            disabled={loading || !proposalTitle || !proposalDescription || parseFloat(cmonBalance) < 100}
            className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed px-6 py-4 rounded-xl font-bold text-lg transition-all shadow-lg"
          >
            {loading ? 'Creating...' : 'Create Proposal'}
          </button>
        </div>
      )}

      {/* Demo Proposals Section */}
      {proposals.length === 0 && (
        <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur rounded-2xl p-8 border border-indigo-500/20">
          <h3 className="text-2xl font-bold mb-4">🎯 Quick Start: Demo Proposals</h3>
          <p className="text-gray-400 mb-6">Create demo proposals to test the governance system</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEMO_PROPOSALS.map((demo, idx) => (
              <div key={idx} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 hover:border-primary/50 transition-all">
                <h4 className="font-semibold mb-2">{demo.title}</h4>
                <p className="text-sm text-gray-400 mb-3 line-clamp-2">{demo.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-primary">{demo.amount} MON</span>
                  <button
                    onClick={() => handleCreateDemoProposal(demo)}
                    disabled={loading || parseFloat(cmonBalance) < 100}
                    className="text-sm bg-primary/20 hover:bg-primary/30 disabled:bg-gray-700 px-3 py-1 rounded-lg transition"
                  >
                    Create
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Proposals List */}
      <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur rounded-2xl p-8 border border-gray-700 shadow-xl">
        <h3 className="text-2xl font-bold mb-6">All Proposals</h3>

        {proposals.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-20 h-20 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg">No proposals yet</p>
            <p className="text-sm mt-2">Create the first proposal or add demo proposals above</p>
          </div>
        ) : (
          <div className="space-y-4">
            {proposals.map((proposal) => (
              <div key={proposal.id} className={`bg-gradient-to-br ${getStatusColor(proposal.status)} rounded-xl p-6 border transition-all hover:scale-[1.01]`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-xl font-bold">{proposal.title}</h4>
                      <span className="text-xs px-3 py-1 rounded-full bg-black/30">
                        #{proposal.id}
                      </span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <span className="text-xs px-3 py-1 rounded-full bg-primary/30 text-primary">
                        {getProposalTypeText(proposal.proposalType)}
                      </span>
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold`}>
                        {getStatusText(proposal.status)}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-gray-300 mb-4 leading-relaxed">{proposal.description}</p>

                {proposal.targetAddress !== '0x0000000000000000000000000000000000000000' && (
                  <div className="bg-black/20 rounded-lg p-3 mb-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Target:</span>
                      <span className="font-mono">{proposal.targetAddress.slice(0, 10)}...{proposal.targetAddress.slice(-8)}</span>
                    </div>
                    {parseFloat(proposal.amount) > 0 && (
                      <div className="flex justify-between mt-1">
                        <span className="text-gray-400">Amount:</span>
                        <span className="font-bold">{parseFloat(proposal.amount).toFixed(2)} MON</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-green-500/20 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-400">{parseFloat(proposal.forVotes).toFixed(0)}</div>
                    <div className="text-xs text-gray-400 mt-1">For</div>
                  </div>
                  <div className="bg-red-500/20 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-red-400">{parseFloat(proposal.againstVotes).toFixed(0)}</div>
                    <div className="text-xs text-gray-400 mt-1">Against</div>
                  </div>
                  <div className="bg-gray-500/20 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-gray-400">{parseFloat(proposal.abstainVotes).toFixed(0)}</div>
                    <div className="text-xs text-gray-400 mt-1">Abstain</div>
                  </div>
                </div>

                {proposal.status === 0 && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleVote(proposal.id, 1)}
                      disabled={loading}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 px-4 py-3 rounded-lg font-semibold transition-all"
                    >
                      👍 Vote For
                    </button>
                    <button
                      onClick={() => handleVote(proposal.id, 0)}
                      disabled={loading}
                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 px-4 py-3 rounded-lg font-semibold transition-all"
                    >
                      👎 Vote Against
                    </button>
                    <button
                      onClick={() => handleVote(proposal.id, 2)}
                      disabled={loading}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 px-4 py-3 rounded-lg font-semibold transition-all"
                    >
                      🤷 Abstain
                    </button>
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
