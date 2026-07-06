// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title PriceOracle
 * @author Lungile Mabelebele — ALU Capstone 2026
 * @notice On-chain price oracle for wool and mohair market prices
 *         Provides fair market price suggestions for wool and mohair farmers.
 *
 * Roles:
 *   DEFAULT_ADMIN_ROLE  — LNWMGA system admin
 *   ORACLE_ROLE        — Price feed providers (Ministry of Agriculture)
 */
contract PriceOracle is AccessControl, Pausable {

    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    enum FibreType { WOOL, MOHAIR }
    enum Grade { A, B, C }

    struct PriceData {
        FibreType fibreType;
        Grade grade;
        uint256 pricePerKgWei; // Price in cUSD per kg (wei units)
        uint256 timestamp;
        address submittedBy;
    }

    struct PriceHistory {
        uint256 priceId;
        FibreType fibreType;
        Grade grade;
        uint256 pricePerKgWei;
        uint256 timestamp;
    }

    uint256 private _priceCounter;

    mapping(FibreType => mapping(Grade => PriceData)) public currentPrices;
    mapping(uint256 => PriceHistory) public priceHistory;
    mapping(FibreType => mapping(Grade => uint256[])) private _priceHistoryByType;

    IERC20 public immutable cUSD;

    event PriceUpdated(FibreType indexed fibreType, Grade indexed grade, uint256 pricePerKgWei, address submittedBy);
    event PriceHistoryAdded(uint256 indexed priceId, FibreType fibreType, Grade grade, uint256 pricePerKgWei);

    error InvalidPrice(uint256 price);
    error ZeroPrice();

    constructor(address _cUSD, address admin) {
        cUSD = IERC20(_cUSD);
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ORACLE_ROLE, admin);
    }

    /**
     * @notice Update price for a specific fibre type and grade
     * @dev Oracle-only. Price must be > 0.
     */
    function updatePrice(
        FibreType fibreType,
        Grade grade,
        uint256 pricePerKgWei
    ) external onlyRole(ORACLE_ROLE) whenNotPaused {
        if (pricePerKgWei == 0) revert ZeroPrice();
        
        // Store old price in history
        PriceData storage oldPrice = currentPrices[fibreType][grade];
        if (oldPrice.pricePerKgWei > 0) {
            _addToHistory(fibreType, grade, oldPrice.pricePerKgWei, oldPrice.timestamp);
        }
        
        // Update current price
        currentPrices[fibreType][grade] = PriceData({
            fibreType: fibreType,
            grade: grade,
            pricePerKgWei: pricePerKgWei,
            timestamp: block.timestamp,
            submittedBy: msg.sender
        });
        
        emit PriceUpdated(fibreType, grade, pricePerKgWei, msg.sender);
    }

    /**
     * @notice Get current price for fibre type and grade
     */
    function getCurrentPrice(FibreType fibreType, Grade grade) 
        external view returns (uint256 pricePerKgWei, uint256 timestamp) 
    {
        PriceData memory data = currentPrices[fibreType][grade];
        return (data.pricePerKgWei, data.timestamp);
    }

    /**
     * @notice Get suggested price for a lot (calculates based on weight)
     */
    function getSuggestedPrice(
        FibreType fibreType,
        Grade grade,
        uint32 weightGrams
    ) external view returns (uint256 suggestedPriceWei) {
        PriceData memory data = currentPrices[fibreType][grade];
        if (data.pricePerKgWei == 0) return 0;
        
        // Convert grams to kg and calculate price
        uint256 weightKg = weightGrams / 1000;
        suggestedPriceWei = data.pricePerKgWei * weightKg;
    }

    /**
     * @notice Get price history for a specific type and grade
     */
    function getPriceHistory(FibreType fibreType, Grade grade) 
        external view returns (uint256[] memory) 
    {
        return _priceHistoryByType[fibreType][grade];
    }

    /**
     * @notice Get all current prices
     */
    function getAllCurrentPrices() 
        external view returns (
            uint256 woolA, uint256 woolB, uint256 woolC,
            uint256 mohairA, uint256 mohairB, uint256 mohairC
        ) 
    {
        return (
            currentPrices[FibreType.WOOL][Grade.A].pricePerKgWei,
            currentPrices[FibreType.WOOL][Grade.B].pricePerKgWei,
            currentPrices[FibreType.WOOL][Grade.C].pricePerKgWei,
            currentPrices[FibreType.MOHAIR][Grade.A].pricePerKgWei,
            currentPrices[FibreType.MOHAIR][Grade.B].pricePerKgWei,
            currentPrices[FibreType.MOHAIR][Grade.C].pricePerKgWei
        );
    }

    /**
     * @notice Batch update multiple prices
     * @dev Oracle-only. More gas efficient than individual updates.
     */
    function batchUpdatePrices(
        FibreType[] calldata fibreTypes,
        Grade[] calldata grades,
        uint256[] calldata prices
    ) external onlyRole(ORACLE_ROLE) whenNotPaused {
        require(
            fibreTypes.length == grades.length && grades.length == prices.length,
            "Array length mismatch"
        );
        
        for (uint256 i = 0; i < fibreTypes.length; i++) {
            if (prices[i] == 0) revert ZeroPrice();
            
            PriceData storage oldPrice = currentPrices[fibreTypes[i]][grades[i]];
            if (oldPrice.pricePerKgWei > 0) {
                _addToHistory(fibreTypes[i], grades[i], oldPrice.pricePerKgWei, oldPrice.timestamp);
            }
            
            currentPrices[fibreTypes[i]][grades[i]] = PriceData({
                fibreType: fibreTypes[i],
                grade: grades[i],
                pricePerKgWei: prices[i],
                timestamp: block.timestamp,
                submittedBy: msg.sender
            });
            
            emit PriceUpdated(fibreTypes[i], grades[i], prices[i], msg.sender);
        }
    }

    /**
     * @notice Add price to history
     */
    function _addToHistory(
        FibreType fibreType,
        Grade grade,
        uint256 pricePerKgWei,
        uint256 timestamp
    ) internal {
        _priceCounter++;
        priceHistory[_priceCounter] = PriceHistory({
            priceId: _priceCounter,
            fibreType: fibreType,
            grade: grade,
            pricePerKgWei: pricePerKgWei,
            timestamp: timestamp
        });
        
        _priceHistoryByType[fibreType][grade].push(_priceCounter);
        emit PriceHistoryAdded(_priceCounter, fibreType, grade, pricePerKgWei);
    }

    /**
     * @notice Get price history entry by ID
     */
    function getPriceHistoryEntry(uint256 priceId) 
        external view returns (PriceHistory memory) 
    {
        return priceHistory[priceId];
    }

    /**
     * @notice Check if price data is stale (older than 7 days)
     */
    function isPriceStale(FibreType fibreType, Grade grade) 
        external view returns (bool) 
    {
        PriceData memory data = currentPrices[fibreType][grade];
        if (data.timestamp == 0) return true;
        
        return block.timestamp > data.timestamp + 7 days;
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }
}
