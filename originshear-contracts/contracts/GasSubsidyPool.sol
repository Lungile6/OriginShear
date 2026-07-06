// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title GasSubsidyPool
 * @author Lungile Mabelebele — ALU Capstone 2026
 * @notice Manages gas subsidy distribution to wool and mohair farmers using
 *         platform fees collected from the FarmerMarket (2% of each transaction).
 *
 * Roles:
 *   DEFAULT_ADMIN_ROLE  — LNWMGA system admin
 *   GOVERNMENT_ROLE     — Ministry of Agriculture officials
 *   FARMER_ROLE         — registered wool and mohair farmers
 */
contract GasSubsidyPool is AccessControl, Pausable {

    bytes32 public constant GOVERNMENT_ROLE = keccak256("GOVERNMENT_ROLE");
    bytes32 public constant FARMER_ROLE = keccak256("FARMER_ROLE");

    IERC20 public immutable cUSD;

    struct SubsidyClaim {
        uint256 claimId;
        address farmer;
        uint256 amount;
        uint256 claimedAt;
        string reason;
    }

    uint256 private _claimCounter;
    uint256 public maxDailyClaim; // Maximum cUSD a farmer can claim per day
    uint256 public currentBalance;

    mapping(address => uint256) public dailyClaimed;
    mapping(uint256 => SubsidyClaim) public claims;
    mapping(address => uint256[]) private _farmerClaims;

    event SubsidyDeposited(address indexed from, uint256 amount);
    event SubsidyClaimed(uint256 indexed claimId, address indexed farmer, uint256 amount);
    event MaxDailyClaimUpdated(uint256 newAmount);
    event BalanceWithdrawn(address indexed to, uint256 amount);

    error InsufficientBalance();
    error DailyLimitExceeded(uint256 claimed, uint256 limit);
    error ZeroAmount();
    error ClaimNotFound(uint256 claimId);

    constructor(address _cUSD, address admin) {
        cUSD = IERC20(_cUSD);
        maxDailyClaim = 5 * 10**18; // 5 cUSD default daily limit
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(GOVERNMENT_ROLE, admin);
    }

    /**
     * @notice Deposit cUSD into the subsidy pool
     * @dev Called by FarmerMarket when collecting platform fees
     */
    function deposit(uint256 amount) external whenNotPaused {
        if (amount == 0) revert ZeroAmount();
        
        bool success = cUSD.transferFrom(msg.sender, address(this), amount);
        require(success, "Transfer failed");
        
        currentBalance += amount;
        emit SubsidyDeposited(msg.sender, amount);
    }

    /**
     * @notice Claim gas subsidy
     * @dev Farmer-only. Limited by maxDailyClaim.
     */
    function claimSubsidy(uint256 amount, string calldata reason) 
        external whenNotPaused onlyRole(FARMER_ROLE) returns (uint256 claimId) 
    {
        if (amount == 0) revert ZeroAmount();
        if (amount > currentBalance) revert InsufficientBalance();
        
        // Check daily limit
        uint256 day = block.timestamp / 1 days;
        uint256 lastClaimDay = dailyClaimed[msg.sender] / 1e18;
        uint256 lastClaimAmount = dailyClaimed[msg.sender] % 1e18;
        
        if (lastClaimDay == day && (lastClaimAmount + amount) > maxDailyClaim) {
            revert DailyLimitExceeded(lastClaimAmount + amount, maxDailyClaim);
        }
        
        claimId = ++_claimCounter;
        claims[claimId] = SubsidyClaim({
            claimId: claimId,
            farmer: msg.sender,
            amount: amount,
            claimedAt: block.timestamp,
            reason: reason
        });
        
        _farmerClaims[msg.sender].push(claimId);
        
        bool success = cUSD.transfer(msg.sender, amount);
        require(success, "Transfer failed");
        
        currentBalance -= amount;
        
        // Update daily tracking
        if (lastClaimDay == day) {
            dailyClaimed[msg.sender] = day * 1e18 + (lastClaimAmount + amount);
        } else {
            dailyClaimed[msg.sender] = day * 1e18 + amount;
        }
        
        emit SubsidyClaimed(claimId, msg.sender, amount);
    }

    /**
     * @notice Update maximum daily claim amount
     * @dev Government-only.
     */
    function setMaxDailyClaim(uint256 newMax) external onlyRole(GOVERNMENT_ROLE) {
        maxDailyClaim = newMax;
        emit MaxDailyClaimUpdated(newMax);
    }

    /**
     * @notice Withdraw excess balance (emergency only)
     * @dev Admin-only.
     */
    function withdrawBalance(uint256 amount, address to) 
        external onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        if (amount > currentBalance) revert InsufficientBalance();
        
        bool success = cUSD.transfer(to, amount);
        require(success, "Transfer failed");
        
        currentBalance -= amount;
        emit BalanceWithdrawn(to, amount);
    }

    /**
     * @notice Get all claims for a farmer
     */
    function getFarmerClaims(address farmer) external view returns (uint256[] memory) {
        return _farmerClaims[farmer];
    }

    /**
     * @notice Get claim details
     */
    function getClaim(uint256 claimId) external view returns (SubsidyClaim memory) {
        if (claimId == 0 || claimId > _claimCounter) revert ClaimNotFound(claimId);
        return claims[claimId];
    }

    /**
     * @notice Check how much a farmer can still claim today
     */
    function availableClaim(address farmer) external view returns (uint256) {
        uint256 day = block.timestamp / 1 days;
        uint256 lastClaimDay = dailyClaimed[farmer] / 1e18;
        uint256 lastClaimAmount = dailyClaimed[farmer] % 1e18;
        
        if (lastClaimDay != day) {
            return maxDailyClaim;
        }
        
        return maxDailyClaim > lastClaimAmount ? maxDailyClaim - lastClaimAmount : 0;
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }
}
