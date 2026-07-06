// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title HarvestLedger
 * @author Lungile Mabelebele — ALU Capstone 2026
 * @notice Immutable registry of wool and mohair harvest lots for Lesotho
 *         wool and mohair farmers. Each lot is assigned a unique Proof of
 *         Origin hash computed on-chain at registration.
 *
 * Roles:
 *   DEFAULT_ADMIN_ROLE  — LNWMGA system admin
 *   VALIDATOR_ROLE      — LNWMGA district validators
 *   FARMER_ROLE         — registered wool and mohair farmers
 */
contract HarvestLedger is AccessControl, Pausable, ReentrancyGuard {

    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");
    bytes32 public constant FARMER_ROLE    = keccak256("FARMER_ROLE");

    enum FibreType { WOOL, MOHAIR }
    enum Grade     { A, B, C }
    enum LotStatus { PENDING, VALIDATED, REJECTED, SOLD }

    struct HarvestLot {
        uint256 lotId;
        address farmer;
        FibreType fibreType;
        Grade     grade;
        uint32    weightGrams;
        string    gpsZone;
        string    seasonYear;
        bytes32   proofOfOrigin;
        LotStatus status;
        uint256   registeredAt;
        uint256   validatedAt;
        address   validatedBy;
        string    metadataURI;
    }

    struct FarmerProfile {
        address wallet;
        string  farmerId;
        string  district;
        bool    active;
        uint256 totalLotsRegistered;
        uint256 totalWeightGrams;
    }

    uint256 private _lotCounter;

    /// @notice Total number of lots ever registered. Lets off-chain clients
    ///         (e.g. the validator queue UI) enumerate lots 1..totalLots()
    ///         without needing an indexer.
    function totalLots() external view returns (uint256) {
        return _lotCounter;
    }

    mapping(uint256 => HarvestLot)    public lots;
    mapping(address => FarmerProfile) public farmers;
    mapping(bytes32 => bool)          public usedProofs;
    mapping(address => uint256[])     private _farmerLots;

    event FarmerRegistered(address indexed wallet, string farmerId, string district);
    event LotRegistered(uint256 indexed lotId, address indexed farmer,
        bytes32 proofOfOrigin, FibreType fibreType, Grade grade, uint32 weightGrams);
    event LotValidated(uint256 indexed lotId, address indexed validator, LotStatus status);

    error NotAFarmer(address caller);
    error FarmerAlreadyRegistered(address wallet);
    error LotNotFound(uint256 lotId);
    error LotNotPending(uint256 lotId, LotStatus current);
    error DuplicateProofOfOrigin(bytes32 proof);
    error InvalidWeight();

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(VALIDATOR_ROLE, admin);
    }

    /**
     * @notice Register a wool and mohair farmer and grant them FARMER_ROLE.
     * @dev Admin-only. Reverts if the wallet is already registered.
     */
    function registerFarmer(
        address wallet,
        string calldata farmerId,
        string calldata district
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (farmers[wallet].active) revert FarmerAlreadyRegistered(wallet);
        farmers[wallet] = FarmerProfile({
            wallet: wallet, farmerId: farmerId, district: district,
            active: true, totalLotsRegistered: 0, totalWeightGrams: 0
        });
        _grantRole(FARMER_ROLE, wallet);
        emit FarmerRegistered(wallet, farmerId, district);
    }

    /**
     * @notice Register a new harvest lot and compute its Proof of Origin hash.
     * @dev FARMER_ROLE-only. Reverts on invalid weight or a Proof of Origin
     *      collision (which should never occur in practice).
     */
    function registerLot(
        FibreType    fibreType,
        Grade        grade,
        uint32       weightGrams,
        string calldata gpsZone,
        string calldata seasonYear,
        string calldata metadataURI
    ) external whenNotPaused nonReentrant onlyRole(FARMER_ROLE)
      returns (uint256 lotId)
    {
        if (weightGrams == 0 || weightGrams > 4_000_000) revert InvalidWeight();
        lotId = ++_lotCounter;
        bytes32 poo = _computeProofOfOrigin(
            msg.sender, lotId, fibreType, grade, weightGrams, gpsZone, seasonYear
        );
        if (usedProofs[poo]) revert DuplicateProofOfOrigin(poo);
        usedProofs[poo] = true;
        lots[lotId] = HarvestLot({
            lotId: lotId, farmer: msg.sender, fibreType: fibreType,
            grade: grade, weightGrams: weightGrams, gpsZone: gpsZone,
            seasonYear: seasonYear, proofOfOrigin: poo,
            status: LotStatus.PENDING, registeredAt: block.timestamp,
            validatedAt: 0, validatedBy: address(0), metadataURI: metadataURI
        });
        _farmerLots[msg.sender].push(lotId);
        farmers[msg.sender].totalLotsRegistered++;
        farmers[msg.sender].totalWeightGrams += weightGrams;
        emit LotRegistered(lotId, msg.sender, poo, fibreType, grade, weightGrams);
    }

    /**
     * @notice LNWMGA validator approves or rejects a pending lot.
     */
    function validateLot(uint256 lotId, bool approve)
        external onlyRole(VALIDATOR_ROLE)
    {
        HarvestLot storage lot = _getLot(lotId);
        if (lot.status != LotStatus.PENDING) revert LotNotPending(lotId, lot.status);
        lot.status      = approve ? LotStatus.VALIDATED : LotStatus.REJECTED;
        lot.validatedAt = block.timestamp;
        lot.validatedBy = msg.sender;
        emit LotValidated(lotId, msg.sender, lot.status);
    }

    /**
     * @dev Proof of Origin = keccak256(farmer, lotId, fibreType, grade,
     *      weightGrams, gpsZone, seasonYear). Computed deterministically
     *      on-chain so it cannot be forged off-chain.
     */
    function _computeProofOfOrigin(
        address farmer, uint256 lotId, FibreType fibreType,
        Grade grade, uint32 weightGrams,
        string memory gpsZone, string memory seasonYear
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            farmer, lotId, uint8(fibreType), uint8(grade),
            weightGrams, gpsZone, seasonYear
        ));
    }

    function getFarmerLots(address farmer) external view returns (uint256[] memory) {
        return _farmerLots[farmer];
    }

    function getLot(uint256 lotId) external view returns (HarvestLot memory) {
        return _getLot(lotId);
    }

    /**
     * @notice Check whether a submitted proof hash matches the on-chain
     *         Proof of Origin for a given lot, and return its status.
     */
    function verifyProofOfOrigin(uint256 lotId, bytes32 proofHash)
        external view returns (bool valid, LotStatus status)
    {
        HarvestLot storage lot = _getLot(lotId);
        valid  = (lot.proofOfOrigin == proofHash);
        status = lot.status;
    }

    function _getLot(uint256 lotId) internal view returns (HarvestLot storage) {
        if (lotId == 0 || lotId > _lotCounter) revert LotNotFound(lotId);
        return lots[lotId];
    }

    function pause()   external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }
}
