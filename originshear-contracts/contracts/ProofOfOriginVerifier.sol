// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./HarvestLedger.sol";

/**
 * @title ProofOfOriginVerifier
 * @notice Lightweight read-only verifier for buyer/exporter QR scanning.
 *         verify() is a free eth_call -- zero gas cost for checkpoints.
 *         logVerification() writes an on-chain audit trail.
 */
contract ProofOfOriginVerifier {

    HarvestLedger public immutable ledger;

    struct VerificationResult {
        bool    valid;
        bool    isValidated;
        address farmer;
        uint8   fibreType;
        uint8   grade;
        uint32  weightGrams;
        string  gpsZone;
        string  seasonYear;
        string  metadataURI;
        uint256 registeredAt;
    }

    event VerificationLogged(
        uint256 indexed lotId,
        bytes32 proofSubmitted,
        bool    valid,
        address verifier,
        uint256 timestamp
    );

    constructor(address _ledger) {
        ledger = HarvestLedger(_ledger);
    }

    /**
     * @notice Free, read-only verification of a lot's Proof of Origin.
     *         Intended for QR scanning at South African export checkpoints.
     */
    function verify(uint256 lotId, bytes32 proofHash)
        external view returns (VerificationResult memory result)
    {
        (bool valid, HarvestLedger.LotStatus status) =
            ledger.verifyProofOfOrigin(lotId, proofHash);
        HarvestLedger.HarvestLot memory lot = ledger.getLot(lotId);
        result = VerificationResult({
            valid:         valid,
            isValidated:   (status == HarvestLedger.LotStatus.VALIDATED),
            farmer:        lot.farmer,
            fibreType:     uint8(lot.fibreType),
            grade:         uint8(lot.grade),
            weightGrams:   lot.weightGrams,
            gpsZone:       lot.gpsZone,
            seasonYear:    lot.seasonYear,
            metadataURI:   lot.metadataURI,
            registeredAt:  lot.registeredAt
        });
    }

    /**
     * @notice Same as verify(), but writes an on-chain audit log entry
     *         (VerificationLogged event) of who checked what, and when.
     */
    function logVerification(uint256 lotId, bytes32 proofHash)
        external returns (VerificationResult memory result)
    {
        result = this.verify(lotId, proofHash);
        emit VerificationLogged(
            lotId, proofHash, result.valid, msg.sender, block.timestamp
        );
    }

    /**
     * @notice Helper for off-chain clients to compute the expected
     *         Proof of Origin hash for a given lot's attributes,
     *         matching HarvestLedger's internal computation.
     */
    function computeExpectedProof(
        address farmer, uint256 lotId, uint8 fibreType,
        uint8 grade, uint32 weightGrams,
        string calldata gpsZone, string calldata seasonYear
    ) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            farmer, lotId, fibreType, grade,
            weightGrams, gpsZone, seasonYear
        ));
    }
}
