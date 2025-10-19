// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./CMONToken.sol";

/**
 * @title CMONStakingNative
 * @dev Staking contract where users stake NATIVE MON and receive CMON tokens
 * Implements 7-day cooldown for withdrawals and yield generation for charity
 */
contract CMONStakingNative is Ownable, ReentrancyGuard {
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
        address _cmonToken,
        address _treasury
    ) Ownable(msg.sender) {
        cmonToken = CMONToken(_cmonToken);
        treasury = _treasury;
        lastYieldCalculation = block.timestamp;
    }
    
    /**
     * @dev Stake native MON tokens
     */
    function stake() external payable nonReentrant {
        require(msg.value > 0, "Cannot stake 0");
        
        calculateYield();
        
        StakeInfo storage userStake = stakes[msg.sender];
        
        userStake.amount += msg.value;
        userStake.stakedAt = block.timestamp;
        userStake.inCooldown = false;
        userStake.cooldownStart = 0;
        
        totalStaked += msg.value;
        
        // Mint CMON 1:1 with staked MON
        cmonToken.mint(msg.sender, msg.value);
        
        emit Staked(msg.sender, msg.value, msg.value);
    }
    
    /**
     * @dev Initiate cooldown period before withdrawal
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
            "Cooldown period not finished"
        );
        
        calculateYield();
        
        userStake.amount -= amount;
        totalStaked -= amount;
        
        if (userStake.amount == 0) {
            userStake.inCooldown = false;
            userStake.cooldownStart = 0;
        }
        
        // Burn CMON tokens
        cmonToken.burn(msg.sender, amount);
        
        // Transfer native MON back to user
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit Withdrawn(msg.sender, amount, amount);
    }
    
    /**
     * @dev Calculate and distribute yield to treasury
     */
    function calculateYield() public {
        if (totalStaked == 0) return;
        
        uint256 timeElapsed = block.timestamp - lastYieldCalculation;
        if (timeElapsed == 0) return;
        
        uint256 yield = (totalStaked * APR * timeElapsed) / (100 * SECONDS_PER_YEAR);
        
        if (yield > 0 && address(this).balance >= yield) {
            totalYieldGenerated += yield;
            lastYieldCalculation = block.timestamp;
            
            // Send yield to treasury
            (bool success, ) = treasury.call{value: yield}("");
            require(success, "Yield transfer failed");
            
            emit YieldCalculated(yield, block.timestamp);
        }
    }
    
    /**
     * @dev Get pending yield amount
     */
    function getPendingYield() external view returns (uint256) {
        if (totalStaked == 0) return 0;
        
        uint256 timeElapsed = block.timestamp - lastYieldCalculation;
        return (totalStaked * APR * timeElapsed) / (100 * SECONDS_PER_YEAR);
    }
    
    /**
     * @dev Get stake info for a user
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
     * @dev Get total funds in contract
     */
    function getTotalFunds() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Update treasury address
     */
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }
    
    /**
     * @dev Receive function to accept native MON
     */
    receive() external payable {}
}
