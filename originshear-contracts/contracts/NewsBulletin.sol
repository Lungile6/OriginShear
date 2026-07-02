// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title NewsBulletin
 * @author Lungile Mabelebele — ALU Capstone 2026
 * @notice On-chain storage for government news bulletins and announcements
 *         for the wool and mohair industry.
 *
 * Roles:
 *   DEFAULT_ADMIN_ROLE  — LNWMGA system admin
 *   GOVERNMENT_ROLE     — Ministry of Agriculture officials
 */
contract NewsBulletin is AccessControl, Pausable {

    bytes32 public constant GOVERNMENT_ROLE = keccak256("GOVERNMENT_ROLE");

    enum BulletinType { PRICE_ALERT, MARKET_NOTICE, REGULATION, GENERAL }
    enum BulletinStatus { ACTIVE, ARCHIVED }

    struct Bulletin {
        uint256 bulletinId;
        BulletinType bulletinType;
        string title;
        string body;
        address publishedBy;
        uint256 publishedAt;
        BulletinStatus status;
        string metadataURI;
    }

    uint256 private _bulletinCounter;

    mapping(uint256 => Bulletin) public bulletins;
    mapping(uint256 => uint256[]) private _bulletinsByType;

    event BulletinPublished(uint256 indexed bulletinId, BulletinType bulletinType, string title, address publishedBy);
    event BulletinArchived(uint256 indexed bulletinId, address archivedBy);

    error BulletinNotFound(uint256 bulletinId);
    error EmptyTitle();
    error EmptyBody();

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(GOVERNMENT_ROLE, admin);
    }

    /**
     * @notice Publish a new bulletin
     * @dev Government-only.
     */
    function publishBulletin(
        BulletinType bulletinType,
        string calldata title,
        string calldata body,
        string calldata metadataURI
    ) external onlyRole(GOVERNMENT_ROLE) whenNotPaused returns (uint256 bulletinId) {
        if (bytes(title).length == 0) revert EmptyTitle();
        if (bytes(body).length == 0) revert EmptyBody();
        
        bulletinId = ++_bulletinCounter;
        bulletins[bulletinId] = Bulletin({
            bulletinId: bulletinId,
            bulletinType: bulletinType,
            title: title,
            body: body,
            publishedBy: msg.sender,
            publishedAt: block.timestamp,
            status: BulletinStatus.ACTIVE,
            metadataURI: metadataURI
        });
        
        _bulletinsByType[uint256(bulletinType)].push(bulletinId);
        emit BulletinPublished(bulletinId, bulletinType, title, msg.sender);
    }

    /**
     * @notice Archive a bulletin
     * @dev Government-only.
     */
    function archiveBulletin(uint256 bulletinId) external onlyRole(GOVERNMENT_ROLE) {
        Bulletin storage bulletin = _getBulletin(bulletinId);
        bulletin.status = BulletinStatus.ARCHIVED;
        emit BulletinArchived(bulletinId, msg.sender);
    }

    /**
     * @notice Get bulletin by ID
     */
    function getBulletin(uint256 bulletinId) external view returns (Bulletin memory) {
        return _getBulletin(bulletinId);
    }

    /**
     * @notice Get all bulletins of a specific type
     */
    function getBulletinsByType(BulletinType bulletinType) external view returns (uint256[] memory) {
        return _bulletinsByType[uint256(bulletinType)];
    }

    /**
     * @notice Get all active bulletins
     */
    function getActiveBulletins() external view returns (Bulletin[] memory) {
        Bulletin[] memory active = new Bulletin[](_bulletinCounter);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= _bulletinCounter; i++) {
            if (bulletins[i].status == BulletinStatus.ACTIVE) {
                active[count] = bulletins[i];
                count++;
            }
        }
        
        // Resize array to actual count
        Bulletin[] memory result = new Bulletin[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = active[i];
        }
        
        return result;
    }

    /**
     * @notice Get total number of bulletins
     */
    function totalBulletins() external view returns (uint256) {
        return _bulletinCounter;
    }

    function _getBulletin(uint256 bulletinId) internal view returns (Bulletin storage) {
        if (bulletinId == 0 || bulletinId > _bulletinCounter) revert BulletinNotFound(bulletinId);
        return bulletins[bulletinId];
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }
}
