// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title ReputationSystem
 * @author Lungile Mabelebele — ALU Capstone 2026
 * @notice On-chain reputation tracking for farmers and buyers
 *         based on transaction history and dispute outcomes.
 *
 * Roles:
 *   DEFAULT_ADMIN_ROLE  — LNWMGA system admin
 *   VALIDATOR_ROLE      — LNWMGA district validators
 */
contract ReputationSystem is AccessControl, Pausable {

    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");

    enum EntityType { FARMER, BUYER }
    enum Rating { POOR, FAIR, GOOD, EXCELLENT }

    struct Reputation {
        uint256 entityId;
        EntityType entityType;
        address wallet;
        uint256 totalTransactions;
        uint256 successfulTransactions;
        uint256 disputesWon;
        uint256 disputesLost;
        uint256 totalScore;
        Rating currentRating;
        uint256 lastUpdated;
    }

    struct Review {
        uint256 reviewId;
        uint256 transactionId;
        address reviewer;
        address reviewed;
        EntityType reviewedType;
        uint8 score; // 1-5
        string comment;
        uint256 timestamp;
    }

    uint256 private _reputationCounter;
    uint256 private _reviewCounter;

    mapping(address => Reputation) public reputations;
    mapping(uint256 => Review) public reviews;
    mapping(address => uint256[]) private _entityReviews;

    event ReputationUpdated(address indexed wallet, Rating newRating, uint256 totalScore);
    event ReviewSubmitted(uint256 indexed reviewId, address indexed reviewer, address indexed reviewed, uint8 score);
    event ReputationReset(address indexed wallet, string reason);

    error EntityNotFound(address wallet);
    error InvalidScore(uint8 score);
    error CannotReviewSelf(address reviewer, address reviewed);
    error ReviewNotFound(uint256 reviewId);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(VALIDATOR_ROLE, admin);
    }

    /**
     * @notice Register an entity in the reputation system
     * @dev Called when a farmer is registered or a buyer makes first purchase
     */
    function registerEntity(
        address wallet,
        EntityType entityType
    ) external whenNotPaused {
        if (reputations[wallet].wallet != address(0)) {
            // Already registered, just update type if needed
            reputations[wallet].entityType = entityType;
            return;
        }

        _reputationCounter++;
        reputations[wallet] = Reputation({
            entityId: _reputationCounter,
            entityType: entityType,
            wallet: wallet,
            totalTransactions: 0,
            successfulTransactions: 0,
            disputesWon: 0,
            disputesLost: 0,
            totalScore: 0,
            currentRating: Rating.FAIR,
            lastUpdated: block.timestamp
        });

        emit ReputationUpdated(wallet, Rating.FAIR, 0);
    }

    /**
     * @notice Record a successful transaction
     * @dev Called by FarmerMarket when payment is released
     */
    function recordSuccessfulTransaction(address farmer, address buyer) 
        external whenNotPaused 
    {
        _updateTransactionCount(farmer, true);
        _updateTransactionCount(buyer, true);
    }

    /**
     * @notice Record a dispute outcome
     * @dev Called by DisputeResolution when a dispute is resolved
     */
    function recordDisputeOutcome(
        address farmer,
        address buyer,
        bool farmerWon
    ) external onlyRole(VALIDATOR_ROLE) whenNotPaused {
        if (farmerWon) {
            reputations[farmer].disputesWon++;
            reputations[buyer].disputesLost++;
        } else {
            reputations[farmer].disputesLost++;
            reputations[buyer].disputesWon++;
        }
        
        _recalculateRating(farmer);
        _recalculateRating(buyer);
    }

    /**
     * @notice Submit a review
     * @dev Can be called by any party to a transaction
     */
    function submitReview(
        uint256 transactionId,
        address reviewed,
        EntityType reviewedType,
        uint8 score,
        string calldata comment
    ) external whenNotPaused returns (uint256 reviewId) {
        if (score < 1 || score > 5) revert InvalidScore(score);
        if (msg.sender == reviewed) revert CannotReviewSelf(msg.sender, reviewed);
        
        reviewId = ++_reviewCounter;
        reviews[reviewId] = Review({
            reviewId: reviewId,
            transactionId: transactionId,
            reviewer: msg.sender,
            reviewed: reviewed,
            reviewedType: reviewedType,
            score: score,
            comment: comment,
            timestamp: block.timestamp
        });
        
        _entityReviews[reviewed].push(reviewId);
        
        // Update reputation score
        reputations[reviewed].totalScore += score;
        reputations[reviewed].lastUpdated = block.timestamp;
        
        _recalculateRating(reviewed);
        
        emit ReviewSubmitted(reviewId, msg.sender, reviewed, score);
    }

    /**
     * @notice Get reputation for an address
     */
    function getReputation(address wallet) external view returns (Reputation memory) {
        if (reputations[wallet].wallet == address(0)) revert EntityNotFound(wallet);
        return reputations[wallet];
    }

    /**
     * @notice Get all reviews for an entity
     */
    function getEntityReviews(address entity) external view returns (uint256[] memory) {
        return _entityReviews[entity];
    }

    /**
     * @notice Get review by ID
     */
    function getReview(uint256 reviewId) external view returns (Review memory) {
        if (reviewId == 0 || reviewId > _reviewCounter) revert ReviewNotFound(reviewId);
        return reviews[reviewId];
    }

    /**
     * @notice Reset reputation (admin only, for fraud cases)
     */
    function resetReputation(address wallet, string calldata reason) 
        external onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        if (reputations[wallet].wallet == address(0)) revert EntityNotFound(wallet);
        
        reputations[wallet].totalScore = 0;
        reputations[wallet].currentRating = Rating.FAIR;
        reputations[wallet].lastUpdated = block.timestamp;
        
        emit ReputationReset(wallet, reason);
    }

    /**
     * @notice Update transaction count
     */
    function _updateTransactionCount(address wallet, bool successful) internal {
        if (reputations[wallet].wallet == address(0)) return;
        
        reputations[wallet].totalTransactions++;
        if (successful) {
            reputations[wallet].successfulTransactions++;
        }
        
        _recalculateRating(wallet);
    }

    /**
     * @notice Recalculate rating based on metrics
     */
    function _recalculateRating(address wallet) internal {
        Reputation storage rep = reputations[wallet];
        
        if (rep.totalTransactions == 0) {
            rep.currentRating = Rating.FAIR;
            return;
        }
        
        // Calculate success rate
        uint256 successRate = (rep.successfulTransactions * 100) / rep.totalTransactions;
        
        // Calculate average score
        uint256 reviewCount = _entityReviews[wallet].length;
        uint256 avgScore = reviewCount > 0 
            ? rep.totalScore / reviewCount 
            : 3;
        
        // Calculate dispute win rate
        uint256 totalDisputes = rep.disputesWon + rep.disputesLost;
        uint256 disputeWinRate = totalDisputes > 0 
            ? (rep.disputesWon * 100) / totalDisputes 
            : 50;
        
        // Combined score (weighted)
        uint256 combinedScore = 
            (successRate * 40) / 100 +      // 40% weight
            (avgScore * 20) / 100 +          // 20% weight
            (disputeWinRate * 40) / 100;     // 40% weight
        
        // Determine rating
        if (combinedScore >= 85) {
            rep.currentRating = Rating.EXCELLENT;
        } else if (combinedScore >= 70) {
            rep.currentRating = Rating.GOOD;
        } else if (combinedScore >= 50) {
            rep.currentRating = Rating.FAIR;
        } else {
            rep.currentRating = Rating.POOR;
        }
        
        rep.lastUpdated = block.timestamp;
        emit ReputationUpdated(wallet, rep.currentRating, rep.totalScore);
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }
}
