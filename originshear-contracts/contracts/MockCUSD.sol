// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Test-only mock of the cUSD stablecoin. Replace with the real cUSD
// address on deployment:
//   Alfajores: 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1
//   Mainnet:   0x765DE816845861e75A25fCA122bb6898B8B1282a

/**
 * @title MockCUSD
 * @notice Minimal ERC-20 used only for local Hardhat testing of
 *         FarmerMarket's escrow flow. Anyone can mint for test setup --
 *         do NOT deploy this to a live network.
 */
contract MockCUSD {
    string  public name     = "Mock Celo Dollar";
    string  public symbol   = "cUSD";
    uint8   public decimals = 18;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply   += amount;
        emit Transfer(address(0), to, amount);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to]         += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from]             -= amount;
        balanceOf[to]               += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}
