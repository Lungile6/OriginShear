// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./HarvestLedger.sol";
import "./FarmerMarket.sol";

/**
 * @title DisputeResolution
 * @author Lungile Mabelebele — ALU Capstone 2026
 * @notice Handles disputes between buyers and farmers over lot quality/mismatch
 *
 * Roles:
 *   DEFAULT_ADMIN_ROLE  — LNWMGA system admin
 *   ARBITER_ROLE       — Dispute resolution arbiters
 */
contract DisputeResolution is AccessControl, Pausable {

    bytes32 public constant ARBITER_ROLE = keccak256("ARBITER_ROLE");

    enum DisputeType { QUALITY_MISMATCH, WEIGHT_DISCREPANCY, FIBRE_TYPE_ERROR, OTHER }
    enum DisputeStatus { OPEN, IN_REVIEW, RESOLVED_FARMER, RESOLVED_BUYER, CANCELLED }

    struct Dispute {
        uint256 disputeId;
        uint256 offerId;
        address farmer;
        address buyer;
        DisputeType disputeType;
        string description;
        DisputeStatus status;
        address openedBy;
        uint256 openedAt;
        uint256 resolvedAt;
        address resolvedBy;
        string resolutionNote;
        uint256 refundAmount;
    }

    uint256 private _disputeCounter;

    mapping(uint256 => Dispute) public disputes;
    mapping(uint256 => uint256[]) private _disputesByOffer;

    IERC20 public immutable cUSD;
    FarmerMarket public immutable market;
    HarvestLedger public immutable ledger;

    event DisputeOpened(uint256 indexed disputeId, uint256 indexed offerId, address indexed openedBy, DisputeType disputeType);
    event DisputeResolved(uint256 indexed disputeId, DisputeStatus status, address resolvedBy, uint256 refundAmount);
    event DisputeCancelled(uint256 indexed disputeId, address cancelledBy);

    error DisputeNotFound(uint256 disputeId);
    error OfferNotInEscrow(uint256 offerId);
    error NotPartyToDispute(address caller, uint256 disputeId);
    error InvalidDisputeStatus(DisputeStatus current, DisputeStatus expected);
    error EmptyDescription();

    constructor(address _cUSD, address _market, address _ledger, address admin) {
        cUSD = IERC20(_cUSD);
        market = FarmerMarket(_market);
        ledger = HarvestLedger(_ledger);
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ARBITER_ROLE, admin);
    }

    /**
     * @notice Open a dispute on an offer
     * @dev Can be called by farmer or buyer. Offer must be in escrow.
     */
    function openDispute(
        uint256 offerId,
        DisputeType disputeType,
        string calldata description
    ) external whenNotPaused returns (uint256 disputeId) {
        if (bytes(description).length == 0) revert EmptyDescription();
        
        // Get offer details from market
        (, , address farmer, , address buyer, , uint8 status) = getOfferDetails(offerId);
        
        if (status != 1) revert OfferNotInEscrow(offerId); // Not IN_ESCROW
        
        // Verify caller is either farmer or buyer
        if (msg.sender != farmer && msg.sender != buyer) {
            revert NotPartyToDispute(msg.sender, 0);
        }
        
        disputeId = ++_disputeCounter;
        disputes[disputeId] = Dispute({
            disputeId: disputeId,
            offerId: offerId,
            farmer: farmer,
            buyer: buyer,
            disputeType: disputeType,
            description: description,
            status: DisputeStatus.OPEN,
            openedBy: msg.sender,
            openedAt: block.timestamp,
            resolvedAt: 0,
            resolvedBy: address(0),
            resolutionNote: "",
            refundAmount: 0
        });
        
        _disputesByOffer[offerId].push(disputeId);
        emit DisputeOpened(disputeId, offerId, msg.sender, disputeType);
    }

    /**
     * @notice Resolve a dispute
     * @dev Arbiter-only. Can refund buyer or release to farmer.
     */
    function resolveDispute(
        uint256 disputeId,
        DisputeStatus resolution,
        string calldata resolutionNote,
        uint256 refundAmount
    ) external onlyRole(ARBITER_ROLE) whenNotPaused {
        Dispute storage dispute = _getDispute(disputeId);
        
        if (dispute.status != DisputeStatus.OPEN && dispute.status != DisputeStatus.IN_REVIEW) {
            revert InvalidDisputeStatus(dispute.status, DisputeStatus.OPEN);
        }
        
        if (resolution != DisputeStatus.RESOLVED_FARMER && resolution != DisputeStatus.RESOLVED_BUYER) {
            revert InvalidDisputeStatus(resolution, DisputeStatus.RESOLVED_FARMER);
        }
        
        dispute.status = resolution;
        dispute.resolvedAt = block.timestamp;
        dispute.resolvedBy = msg.sender;
        dispute.resolutionNote = resolutionNote;
        dispute.refundAmount = refundAmount;
        
        // Handle refund if buyer wins
        if (resolution == DisputeStatus.RESOLVED_BUYER && refundAmount > 0) {
            bool success = cUSD.transfer(dispute.buyer, refundAmount);
            require(success, "Refund transfer failed");
        }
        
        emit DisputeResolved(disputeId, resolution, msg.sender, refundAmount);
    }

    /**
     * @notice Cancel a dispute
     * @dev Can be called by the party who opened it.
     */
    function cancelDispute(uint256 disputeId) external whenNotPaused {
        Dispute storage dispute = _getDispute(disputeId);
        
        if (dispute.openedBy != msg.sender) {
            revert NotPartyToDispute(msg.sender, disputeId);
        }
        
        if (dispute.status != DisputeStatus.OPEN && dispute.status != DisputeStatus.IN_REVIEW) {
            revert InvalidDisputeStatus(dispute.status, DisputeStatus.OPEN);
        }
        
        dispute.status = DisputeStatus.CANCELLED;
        emit DisputeCancelled(disputeId, msg.sender);
    }

    /**
     * @notice Get dispute by ID
     */
    function getDispute(uint256 disputeId) external view returns (Dispute memory) {
        return _getDispute(disputeId);
    }

    /**
     * @notice Get all disputes for an offer
     */
    function getDisputesByOffer(uint256 offerId) external view returns (uint256[] memory) {
        return _disputesByOffer[offerId];
    }

    /**
     * @notice Get total number of disputes
     */
    function totalDisputes() external view returns (uint256) {
        return _disputeCounter;
    }

    /**
     * @notice Helper to get offer details from FarmerMarket
     * @dev This is a simplified version - in production, you'd call the actual contract
     */
    function getOfferDetails(uint256 offerId) 
        public pure returns (
            uint256 _offerId,
            uint256 lotId,
            address farmer,
            uint256 askPriceWei,
            address buyer,
            uint256 escrowAmount,
            uint8 status
        ) 
    {
        // In production, call FarmerMarket.offers(offerId)
        // For now, return placeholder values
        return (offerId, 0, address(0), 0, address(0), 0, 0);
    }

    function _getDispute(uint256 disputeId) internal view returns (Dispute storage) {
        if (disputeId == 0 || disputeId > _disputeCounter) revert DisputeNotFound(disputeId);
        return disputes[disputeId];
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }
}
