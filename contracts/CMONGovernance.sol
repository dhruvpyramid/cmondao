// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./CMONToken.sol";

/**
 * @title CMONGovernance
 * @dev DAO governance contract for proposal creation and voting
 * CMON token holders can create proposals and vote on charity donations
 */
contract CMONGovernance is Ownable, ReentrancyGuard {
    CMONToken public cmonToken;
    
    uint256 public proposalCount;
    uint256 public constant VOTING_PERIOD = 7 days;
    uint256 public constant MIN_PROPOSAL_THRESHOLD = 100 * 10**18; // 100 CMON to create proposal
    uint256 public constant QUORUM_PERCENTAGE = 10; // 10% of total supply
    
    enum ProposalType {
        CharityDonation,
        TreasuryAllocation,
        ParameterChange,
        General
    }
    
    enum ProposalStatus {
        Active,
        Succeeded,
        Failed,
        Executed,
        Cancelled
    }
    
    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        ProposalType proposalType;
        address targetAddress; // Charity address or contract to interact with
        uint256 amount; // Amount for donations
        uint256 startTime;
        uint256 endTime;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        ProposalStatus status;
        bool executed;
    }
    
    struct Vote {
        bool hasVoted;
        uint8 support; // 0 = against, 1 = for, 2 = abstain
        uint256 votes;
    }
    
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => Vote)) public proposalVotes;
    
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        ProposalType proposalType,
        uint256 startTime,
        uint256 endTime
    );
    
    event VoteCast(
        address indexed voter,
        uint256 indexed proposalId,
        uint8 support,
        uint256 votes
    );
    
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCancelled(uint256 indexed proposalId);
    
    constructor(address _cmonToken) Ownable(msg.sender) {
        cmonToken = CMONToken(_cmonToken);
    }
    
    /**
     * @dev Create a new proposal
     */
    function createProposal(
        string memory title,
        string memory description,
        ProposalType proposalType,
        address targetAddress,
        uint256 amount
    ) external returns (uint256) {
        require(
            cmonToken.balanceOf(msg.sender) >= MIN_PROPOSAL_THRESHOLD,
            "Insufficient CMON to create proposal"
        );
        
        proposalCount++;
        uint256 proposalId = proposalCount;
        
        Proposal storage proposal = proposals[proposalId];
        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.title = title;
        proposal.description = description;
        proposal.proposalType = proposalType;
        proposal.targetAddress = targetAddress;
        proposal.amount = amount;
        proposal.startTime = block.timestamp;
        proposal.endTime = block.timestamp + VOTING_PERIOD;
        proposal.status = ProposalStatus.Active;
        
        emit ProposalCreated(
            proposalId,
            msg.sender,
            title,
            proposalType,
            proposal.startTime,
            proposal.endTime
        );
        
        return proposalId;
    }
    
    /**
     * @dev Cast a vote on a proposal
     * @param proposalId The ID of the proposal
     * @param support 0 = against, 1 = for, 2 = abstain
     */
    function castVote(uint256 proposalId, uint8 support) external nonReentrant {
        require(support <= 2, "Invalid vote type");
        
        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.Active, "Proposal not active");
        require(block.timestamp <= proposal.endTime, "Voting period ended");
        
        Vote storage vote = proposalVotes[proposalId][msg.sender];
        require(!vote.hasVoted, "Already voted");
        
        uint256 votes = cmonToken.balanceOf(msg.sender);
        require(votes > 0, "No voting power");
        
        vote.hasVoted = true;
        vote.support = support;
        vote.votes = votes;
        
        if (support == 0) {
            proposal.againstVotes += votes;
        } else if (support == 1) {
            proposal.forVotes += votes;
        } else {
            proposal.abstainVotes += votes;
        }
        
        emit VoteCast(msg.sender, proposalId, support, votes);
    }
    
    /**
     * @dev Finalize a proposal after voting period
     */
    function finalizeProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.Active, "Proposal not active");
        require(block.timestamp > proposal.endTime, "Voting period not ended");
        
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        uint256 quorum = (cmonToken.totalSupply() * QUORUM_PERCENTAGE) / 100;
        
        if (totalVotes >= quorum && proposal.forVotes > proposal.againstVotes) {
            proposal.status = ProposalStatus.Succeeded;
        } else {
            proposal.status = ProposalStatus.Failed;
        }
    }
    
    /**
     * @dev Execute a succeeded proposal (only owner/treasury can execute)
     */
    function executeProposal(uint256 proposalId) external onlyOwner nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.Succeeded, "Proposal not succeeded");
        require(!proposal.executed, "Proposal already executed");
        
        proposal.executed = true;
        proposal.status = ProposalStatus.Executed;
        
        // Execution logic would go here (e.g., transfer funds to charity)
        // For now, we just mark it as executed
        
        emit ProposalExecuted(proposalId);
    }
    
    /**
     * @dev Cancel a proposal (only proposer or owner)
     */
    function cancelProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(
            msg.sender == proposal.proposer || msg.sender == owner(),
            "Not authorized"
        );
        require(proposal.status == ProposalStatus.Active, "Proposal not active");
        
        proposal.status = ProposalStatus.Cancelled;
        emit ProposalCancelled(proposalId);
    }
    
    /**
     * @dev Get proposal details
     */
    function getProposal(uint256 proposalId) external view returns (
        uint256 id,
        address proposer,
        string memory title,
        string memory description,
        ProposalType proposalType,
        address targetAddress,
        uint256 amount,
        uint256 startTime,
        uint256 endTime,
        uint256 forVotes,
        uint256 againstVotes,
        uint256 abstainVotes,
        ProposalStatus status,
        bool executed
    ) {
        Proposal memory proposal = proposals[proposalId];
        return (
            proposal.id,
            proposal.proposer,
            proposal.title,
            proposal.description,
            proposal.proposalType,
            proposal.targetAddress,
            proposal.amount,
            proposal.startTime,
            proposal.endTime,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.abstainVotes,
            proposal.status,
            proposal.executed
        );
    }
    
    /**
     * @dev Get vote information for a user on a proposal
     */
    function getVote(uint256 proposalId, address voter) external view returns (
        bool hasVoted,
        uint8 support,
        uint256 votes
    ) {
        Vote memory vote = proposalVotes[proposalId][voter];
        return (vote.hasVoted, vote.support, vote.votes);
    }
    
    /**
     * @dev Get all active proposals
     */
    function getActiveProposals() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        
        // Count active proposals
        for (uint256 i = 1; i <= proposalCount; i++) {
            if (proposals[i].status == ProposalStatus.Active) {
                activeCount++;
            }
        }
        
        // Create array of active proposal IDs
        uint256[] memory activeProposals = new uint256[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= proposalCount; i++) {
            if (proposals[i].status == ProposalStatus.Active) {
                activeProposals[index] = i;
                index++;
            }
        }
        
        return activeProposals;
    }
    
    /**
     * @dev Update minimum proposal threshold
     */
    function updateMinProposalThreshold(uint256 newThreshold) external onlyOwner {
        // This would require a proposal in production
        // For now, keeping it simple
    }
}
