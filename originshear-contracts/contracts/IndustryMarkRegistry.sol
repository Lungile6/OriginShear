// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title IndustryMarkRegistry
 * @author Lungile Mabelebele — ALU Capstone 2026
 * @notice On-chain registry for industry marks (ear tags, branding, tattoos)
 *         issued by the Lesotho government to wool/mohair farmers.
 *
 * Roles:
 *   DEFAULT_ADMIN_ROLE  — LNWMGA system admin
 *   GOVERNMENT_ROLE     — Ministry of Agriculture officials
 *   FARMER_ROLE         — registered wool and mohair farmers
 */
contract IndustryMarkRegistry is AccessControl, Pausable {

    bytes32 public constant GOVERNMENT_ROLE = keccak256("GOVERNMENT_ROLE");
    bytes32 public constant FARMER_ROLE = keccak256("FARMER_ROLE");

    enum MarkType { VISUAL_EAR_TAG, BRANDING, TATTOO }
    enum MarkStatus { ACTIVE, EXPIRED, REVOKED }

    struct IndustryMark {
        uint256 markId;
        address farmer;
        string farmerId;
        MarkType markType;
        string description;
        uint256 issuedAt;
        uint256 expiresAt;
        MarkStatus status;
        address issuedBy;
        string metadataURI;
    }

    uint256 private _markCounter;

    mapping(uint256 => IndustryMark) public marks;
    mapping(address => uint256[]) private _farmerMarks;
    mapping(string => bool) private _farmerIdToRegistered;

    event MarkIssued(uint256 indexed markId, address indexed farmer, string farmerId, MarkType markType, uint256 expiresAt);
    event MarkRevoked(uint256 indexed markId, address indexed revokedBy);
    event MarkExpired(uint256 indexed markId);

    error FarmerNotRegistered(string farmerId);
    error MarkNotFound(uint256 markId);
    error MarkAlreadyActive(address farmer);
    error InvalidExpiryDate(uint256 expiry);
    error NotMarkOwner(address caller, uint256 markId);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(GOVERNMENT_ROLE, admin);
    }

    /**
     * @notice Register a farmer ID to the system (called during farmer onboarding)
     * @dev Government-only. Links a farmer ID to their wallet address.
     */
    function registerFarmerId(address, string calldata farmerId)
        external onlyRole(GOVERNMENT_ROLE)
    {
        if (_farmerIdToRegistered[farmerId]) revert FarmerNotRegistered(farmerId);
        _farmerIdToRegistered[farmerId] = true;
    }

    /**
     * @notice Issue an industry mark to a farmer
     * @dev Government-only. Each farmer can have multiple marks (e.g., ear tag + branding)
     */
    function issueMark(
        address farmer,
        string calldata farmerId,
        MarkType markType,
        string calldata description,
        uint256 expiresAt,
        string calldata metadataURI
    ) external onlyRole(GOVERNMENT_ROLE) whenNotPaused returns (uint256 markId) {
        if (expiresAt <= block.timestamp) revert InvalidExpiryDate(expiresAt);
        
        markId = ++_markCounter;
        marks[markId] = IndustryMark({
            markId: markId,
            farmer: farmer,
            farmerId: farmerId,
            markType: markType,
            description: description,
            issuedAt: block.timestamp,
            expiresAt: expiresAt,
            status: MarkStatus.ACTIVE,
            issuedBy: msg.sender,
            metadataURI: metadataURI
        });
        
        _farmerMarks[farmer].push(markId);
        emit MarkIssued(markId, farmer, farmerId, markType, expiresAt);
    }

    /**
     * @notice Revoke an active mark (e.g., for fraud or non-compliance)
     * @dev Government-only.
     */
    function revokeMark(uint256 markId) external onlyRole(GOVERNMENT_ROLE) {
        IndustryMark storage mark = _getMark(markId);
        if (mark.status != MarkStatus.ACTIVE) revert MarkNotFound(markId);
        
        mark.status = MarkStatus.REVOKED;
        emit MarkRevoked(markId, msg.sender);
    }

    /**
     * @notice Check and update expiry status of a mark
     * @dev Can be called by anyone to update expired marks
     */
    function checkExpiry(uint256 markId) external {
        IndustryMark storage mark = _getMark(markId);
        if (mark.status == MarkStatus.ACTIVE && block.timestamp >= mark.expiresAt) {
            mark.status = MarkStatus.EXPIRED;
            emit MarkExpired(markId);
        }
    }

    /**
     * @notice Get all marks for a farmer
     */
    function getFarmerMarks(address farmer) external view returns (uint256[] memory) {
        return _farmerMarks[farmer];
    }

    /**
     * @notice Get mark details
     */
    function getMark(uint256 markId) external view returns (IndustryMark memory) {
        return _getMark(markId);
    }

    /**
     * @notice Check if a mark is currently valid (active and not expired)
     */
    function isMarkValid(uint256 markId) external view returns (bool) {
        IndustryMark memory mark = marks[markId];
        if (mark.markId == 0) return false;
        return mark.status == MarkStatus.ACTIVE && block.timestamp < mark.expiresAt;
    }

    function _getMark(uint256 markId) internal view returns (IndustryMark storage) {
        if (markId == 0 || markId > _markCounter) revert MarkNotFound(markId);
        return marks[markId];
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }
}
