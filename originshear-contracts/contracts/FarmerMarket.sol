// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./HarvestLedger.sol";

/**
 * @title FarmerMarket
 * @notice cUSD escrow marketplace for validated wool & mohair lots.
 *
 * Flow:
 *   1. Farmer lists a VALIDATED lot at asking price
 *   2. Buyer deposits cUSD into escrow via purchaseLot()
 *   3. LNWMGA confirms physical handover -> releasePayment()
 *   4. 2% platform fee covers gas subsidy for rural farmers
 *
 * cUSD addresses:
 *   Alfajores: 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1
 *   Mainnet:   0x765DE816845861e75A25fCA122bb6898B8B1282a
 */
interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract FarmerMarket is AccessControl, ReentrancyGuard, Pausable {

    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");

    IERC20 public immutable cUSD;
    HarvestLedger public immutable ledger;
    uint256 public platformFeeBps = 200; // 2%
    address public feeRecipient;

    enum OfferStatus { LISTED, IN_ESCROW, COMPLETED, CANCELLED }

    struct Offer {
        uint256     offerId;
        uint256     lotId;
        address     farmer;
        uint256     askPriceWei;
        address     buyer;
        uint256     escrowAmount;
        OfferStatus status;
        uint256     listedAt;
        uint256     completedAt;
    }

    uint256 private _offerCounter;
    mapping(uint256 => Offer)   public offers;
    mapping(uint256 => uint256) public lotToOffer;

    event LotListed(uint256 indexed offerId, uint256 indexed lotId,
        address farmer, uint256 askPrice);
    event PurchaseEscrowed(uint256 indexed offerId, address buyer, uint256 amount);
    event PaymentReleased(uint256 indexed offerId, address farmer,
        uint256 netAmount, uint256 fee);
    event OfferCancelled(uint256 indexed offerId);

    error LotNotValidated(uint256 lotId);
    error LotAlreadyListed(uint256 lotId);
    error NotLotOwner(address caller, uint256 lotId);
    error OfferNotFound(uint256 offerId);
    error WrongStatus(OfferStatus current, OfferStatus expected);
    error InvalidPrice();

    constructor(address _cUSD, address _ledger, address admin) {
        cUSD         = IERC20(_cUSD);
        ledger       = HarvestLedger(_ledger);
        feeRecipient = admin;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(VALIDATOR_ROLE, admin);
    }

    /**
     * @notice List a VALIDATED lot for sale at the given cUSD price.
     * @dev Only the registered farmer of the lot may list it, and each
     *      lot can only be listed once at a time.
     */
    function listLot(uint256 lotId, uint256 askPrice)
        external whenNotPaused returns (uint256 offerId)
    {
        if (askPrice == 0) revert InvalidPrice();
        if (lotToOffer[lotId] != 0) revert LotAlreadyListed(lotId);
        HarvestLedger.HarvestLot memory lot = ledger.getLot(lotId);
        if (lot.status != HarvestLedger.LotStatus.VALIDATED)
            revert LotNotValidated(lotId);
        if (lot.farmer != msg.sender) revert NotLotOwner(msg.sender, lotId);
        offerId = ++_offerCounter;
        offers[offerId] = Offer({
            offerId: offerId, lotId: lotId, farmer: msg.sender,
            askPriceWei: askPrice, buyer: address(0), escrowAmount: 0,
            status: OfferStatus.LISTED, listedAt: block.timestamp, completedAt: 0
        });
        lotToOffer[lotId] = offerId;
        emit LotListed(offerId, lotId, msg.sender, askPrice);
    }

    /**
     * @notice Buyer deposits the asking price in cUSD into escrow.
     * @dev Buyer must `approve()` this contract for at least `askPriceWei`
     *      before calling.
     */
    function purchaseLot(uint256 offerId) external nonReentrant whenNotPaused {
        Offer storage offer = _getOffer(offerId);
        if (offer.status != OfferStatus.LISTED)
            revert WrongStatus(offer.status, OfferStatus.LISTED);
        bool ok = cUSD.transferFrom(msg.sender, address(this), offer.askPriceWei);
        require(ok, "cUSD transfer failed");
        offer.buyer        = msg.sender;
        offer.escrowAmount = offer.askPriceWei;
        offer.status       = OfferStatus.IN_ESCROW;
        emit PurchaseEscrowed(offerId, msg.sender, offer.askPriceWei);
    }

    /**
     * @notice LNWMGA validator confirms physical handover and releases
     *         escrowed cUSD to the farmer, minus the platform fee.
     */
    function releasePayment(uint256 offerId)
        external nonReentrant onlyRole(VALIDATOR_ROLE)
    {
        Offer storage offer = _getOffer(offerId);
        if (offer.status != OfferStatus.IN_ESCROW)
            revert WrongStatus(offer.status, OfferStatus.IN_ESCROW);
        uint256 fee       = (offer.escrowAmount * platformFeeBps) / 10_000;
        uint256 netAmount = offer.escrowAmount - fee;
        offer.status      = OfferStatus.COMPLETED;
        offer.completedAt = block.timestamp;
        require(cUSD.transfer(offer.farmer, netAmount), "Farmer payment failed");
        if (fee > 0) require(cUSD.transfer(feeRecipient, fee), "Fee failed");
        emit PaymentReleased(offerId, offer.farmer, netAmount, fee);
    }

    function _getOffer(uint256 offerId) internal view returns (Offer storage) {
        if (offerId == 0 || offerId > _offerCounter) revert OfferNotFound(offerId);
        return offers[offerId];
    }

    /**
     * @notice Update the platform fee, capped at 5% (500 bps).
     */
    function setFeeBps(uint256 bps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(bps <= 500, "Max 5%");
        platformFeeBps = bps;
    }

    function pause()   external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }
}
