import { useState } from 'react';
 import { YIELD_ALLOCATIONS, getWeightedAPR } from '../lib/contracts';

export default function Stats({ monBalance, cmonBalance, totalStaked, totalYield, monPrice }) {
  const [showAllocations, setShowAllocations] = useState(false);

  const totalDeployed = YIELD_ALLOCATIONS.reduce((sum, pool) => sum + pool.amount, 0);
  const weightedAPR = getWeightedAPR();

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Your CMON Balance */}
        <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur rounded-2xl p-6 border border-indigo-500/20 hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="text-gray-400 text-sm font-medium">Your CMON</div>
            <div className="bg-indigo-500/20 p-2 rounded-lg">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            {parseFloat(cmonBalance).toFixed(2)}
          </div>
          <div className="text-xs text-gray-500">Voting Power</div>
          {monPrice > 0 && (
            <div className="text-sm text-gray-400 mt-2">
              ≈ ${(parseFloat(cmonBalance) * monPrice).toFixed(2)}
            </div>
          )}
        </div>

        {/* Treasury & Total Staked */}
        <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur rounded-2xl p-6 border border-emerald-500/20 hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="text-gray-400 text-sm font-medium">Treasury Balance</div>
            <div className="bg-emerald-500/20 p-2 rounded-lg">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <div className="text-4xl font-bold mb-2 text-emerald-400">
            {parseFloat(totalStaked).toFixed(2)}
          </div>
          <div className="text-xs text-gray-500">Total MON Staked</div>
          {monPrice > 0 && (
            <div className="text-sm text-gray-400 mt-2">
              ≈ ${(parseFloat(totalStaked) * monPrice).toFixed(2)}
            </div>
          )}
        </div>

        {/* Deployed Capital */}
        <div 
          className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur rounded-2xl p-6 border border-amber-500/20 hover:border-amber-500/40 transition-all cursor-pointer group"
          onClick={() => setShowAllocations(true)}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-gray-400 text-sm font-medium">Deployed Capital</div>
            <div className="bg-amber-500/20 p-2 rounded-lg group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <div className="text-4xl font-bold mb-2 text-amber-400">
            {totalDeployed.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">MON Earning Yield</div>
          <div className="text-sm text-amber-400 mt-2 flex items-center gap-1">
            <span>Avg APR: {weightedAPR}%</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Total Yield for Charity */}
        <div className="bg-gradient-to-br from-rose-500/10 to-pink-500/10 backdrop-blur rounded-2xl p-6 border border-rose-500/20 hover:border-rose-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="text-gray-400 text-sm font-medium">Charity Yield</div>
            <div className="bg-rose-500/20 p-2 rounded-lg">
              <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </div>
          <div className="text-4xl font-bold mb-2 text-rose-400">
            {parseFloat(totalYield).toFixed(2)}
          </div>
          <div className="text-xs text-gray-500">Total Generated</div>
          {monPrice > 0 && (
            <div className="text-sm text-gray-400 mt-2">
              ≈ ${(parseFloat(totalYield) * monPrice).toFixed(2)}
            </div>
          )}
        </div>
      </div>

      {/* Yield Allocations Modal */}
      {showAllocations && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAllocations(false)}>
          <div className="bg-gray-900 rounded-2xl border border-gray-700 max-w-2xl w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Capital Deployment</h3>
              <button onClick={() => setShowAllocations(false)} className="text-gray-400 hover:text-white transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {YIELD_ALLOCATIONS.map((pool, idx) => (
                <div key={idx} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-semibold text-lg">{pool.name}</div>
                      <div className="text-sm text-gray-400">APR: {pool.apr}%</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold" style={{ color: pool.color }}>
                        {pool.amount.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">MON</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all"
                      style={{ 
                        width: `${(pool.amount / totalDeployed) * 100}%`,
                        backgroundColor: pool.color
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {((pool.amount / totalDeployed) * 100).toFixed(1)}% of total deployment
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-gray-400">Total Deployed</div>
                  <div className="text-2xl font-bold text-amber-400">{totalDeployed.toLocaleString()} MON</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Weighted Avg APR</div>
                  <div className="text-2xl font-bold text-amber-400">{weightedAPR}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
