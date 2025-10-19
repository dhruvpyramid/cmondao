// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./CMONToken.sol";

/**
 * @title CMONStaking
 * @dev Staking contract where users stake MON and receive CMON tokens
 * Implements 7-day cooldown for withdrawals and yield generation for charity
 */
contract CMONStaking is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public monToken;
    CMONToken public cmonToken;
    
    uint256 public constant COOLDOWN_PERIOD = 7 days;
    uint256 public constant APR = 20; // 20% APR
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    
    uint256 public totalStaked;
    uint256 public totalYieldGenerated;
    uint256 public lastYieldCalculation;
    
    address public treasury;
    
    struct StakeInfo {
        uint256 amount;
        uint256 stakedAt;
        uint256 cooldownStart;
        bool inCooldown;
    }
    
    mapping(address => StakeInfo) public stakes;
    
    event Staked(address indexed user, uint256 amount, uint256 cmonMinted);
    event CooldownInitiated(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount, uint256 cmonBurned);
    event YieldCalculated(uint256 amount, uint256 timestamp);
    event TreasuryUpdated(address indexed newTreasury);
    
    constructor(
        address _monToken,
        address _cmonToken,
        address _treasury
    ) Ownable(msg.sender) {
        monToken = IERC20(_monToken);
        cmonToken = CMONToken(_cmonToken);
        treasury = _treasury;
        lastYieldCalculation = block.timestamp;
    }
    
    /**
     * @dev Stake MON tokens and receive CMON 1:1
     */
    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        // Calculate and distribute yield before new stake
        _calculateYield();
        
        // Transfer MON from user
        monToken.safeTransferFrom(msg.sender, address(this), amount);
        
        // Update stake info
        StakeInfo storage userStake = stakes[msg.sender];
        userStake.amount += amount;
        userStake.stakedAt = block.timestamp;
        userStake.inCooldown = false;
        userStake.cooldownStart = 0;
        
        totalStaked += amount;
        
        // Mint CMON 1:1
        cmonToken.mint(msg.sender, amount);
        
        emit Staked(msg.sender, amount, amount);
    }
    
    /**
     * @dev Initiate cooldown period for withdrawal
     */
    function initiateCooldown() external {
        StakeInfo storage userStake = stakes[msg.sender];
        require(userStake.amount > 0, "No stake found");
        require(!userStake.inCooldown, "Cooldown already initiated");
        
        userStake.inCooldown = true;
        userStake.cooldownStart = block.timestamp;
        
        emit CooldownInitiated(msg.sender, userStake.amount);
    }
    
    /**
     * @dev Withdraw staked MON after cooldown period
     */
    function withdraw(uint256 amount) external nonReentrant {
        StakeInfo storage userStake = stakes[msg.sender];
        require(userStake.amount >= amount, "Insufficient stake");
        require(userStake.inCooldown, "Cooldown not initiated");
        require(
            block.timestamp >= userStake.cooldownStart + COOLDOWN_PERIOD,
            "Cooldown period not completed"
        );
        
        // Calculate and distribute yield before withdrawal
        _calculateYield();
        
        // Update stake info
        userStake.amount -= amount;
        totalStaked -= amount;
        
        if (userStake.amount == 0) {
            userStake.inCooldown = false;
            userStake.cooldownStart = 0;
        }
        
        // Burn CMON tokens
        cmonToken.burn(msg.sender, amount);
        
        // Transfer MON back to user
        monToken.safeTransfer(msg.sender, amount);
        
        emit Withdrawn(msg.sender, amount, amount);
    }
    
    /**
     * @dev Calculate yield and send to treasury
     */
    function _calculateYield() internal {
        if (totalStaked == 0) {
            lastYieldCalculation = block.timestamp;
            return;
        }
        
        uint256 timeElapsed = block.timestamp - lastYieldCalculation;
        if (timeElapsed == 0) return;
        
        // Calculate yield: (totalStaked * APR * timeElapsed) / (100 * SECONDS_PER_YEAR)
        uint256 yield = (totalStaked * APR * timeElapsed) / (100 * SECONDS_PER_YEAR);
        
        if (yield > 0 && treasury != address(0)) {
            totalYieldGenerated += yield;
            lastYieldCalculation = block.timestamp;
            
            // In a real scenario, this would come from farming strategies
            // For now, we'll track it as a debt that needs to be paid
            emit YieldCalculated(yield, block.timestamp);
        }
    }
    
    /**
     * @dev Manually trigger yield calculation (can be called by anyone)
     */
    function calculateYield() external {
        _calculateYield();
    }
    
    /**
     * @dev Get user's stake information
     */
    function getStakeInfo(address user) external view returns (
        uint256 amount,
        uint256 stakedAt,
        uint256 cooldownStart,
        bool inCooldown,
        uint256 cooldownRemaining
    ) {
        StakeInfo memory userStake = stakes[user];
        amount = userStake.amount;
        stakedAt = userStake.stakedAt;
        cooldownStart = userStake.cooldownStart;
        inCooldown = userStake.inCooldown;
        
        if (inCooldown && block.timestamp < cooldownStart + COOLDOWN_PERIOD) {
            cooldownRemaining = (cooldownStart + COOLDOWN_PERIOD) - block.timestamp;
        } else {
            cooldownRemaining = 0;
        }
    }
    
    /**
     * @dev Get total funds in the protocol
     */
    function getTotalFunds() external view returns (uint256) {
        return totalStaked;
    }
    
    /**
     * @dev Update treasury address
     */
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury address");
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }
    
    /**
     * @dev Get pending yield
     */
    function getPendingYield() external view returns (uint256) {
        if (totalStaked == 0) return 0;
        
        uint256 timeElapsed = block.timestamp - lastYieldCalculation;
        return (totalStaked * APR * timeElapsed) / (100 * SECONDS_PER_YEAR);
    }
}
