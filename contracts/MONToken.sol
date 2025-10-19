// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MONToken
 * @dev Mock MON token for testing purposes
 */
contract MONToken is ERC20, Ownable {
    constructor() ERC20("MON Token", "MON") Ownable(msg.sender) {
        // Mint initial supply for testing
        _mint(msg.sender, 1000000 * 10**decimals());
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function faucet() external {
        // Allow anyone to get 1000 MON for testing
        _mint(msg.sender, 1000 * 10**decimals());
    }
}
