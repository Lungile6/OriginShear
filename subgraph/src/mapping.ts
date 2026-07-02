import { FarmerRegistered, LotRegistered, LotValidated } from "../generated/HarvestLedger/HarvestLedger";
import { LotListed, PurchaseEscrowed, PaymentReleased, OfferCancelled } from "../generated/FarmerMarket/FarmerMarket";
import { MarkIssued, MarkRevoked, MarkExpired } from "../generated/IndustryMarkRegistry/IndustryMarkRegistry";
import { Farmer, Lot, Validation, Offer, Purchase, Payment, Mark } from "../generated/schema";
import { BigInt, Bytes } from "@graphprotocol/graph-ts";

// HarvestLedger event handlers

export function handleFarmerRegistered(event: FarmerRegistered): void {
  let farmer = new Farmer(event.params.wallet.toHexString());
  farmer.wallet = event.params.wallet;
  farmer.farmerId = event.params.farmerId;
  farmer.district = event.params.district;
  farmer.active = true;
  farmer.totalLotsRegistered = BigInt.fromI32(0);
  farmer.totalWeightGrams = BigInt.fromI32(0);
  farmer.createdAt = event.block.timestamp;
  farmer.save();
}

export function handleLotRegistered(event: LotRegistered): void {
  let lot = new Lot(event.params.lotId.toString());
  lot.lotId = event.params.lotId;
  lot.farmer = event.params.farmer.toHexString();
  lot.fibreType = event.params.fibreType;
  lot.grade = event.params.grade;
  lot.weightGrams = event.params.weightGrams;
  lot.proofOfOrigin = event.params.proofOfOrigin;
  lot.status = 0;
  lot.registeredAt = event.block.timestamp;
  lot.validatedAt = null;
  lot.validatedBy = null;
  lot.createdAt = event.block.timestamp;
  lot.save();

  let farmer = Farmer.load(event.params.farmer.toHexString());
  if (farmer) {
    farmer.totalLotsRegistered = farmer.totalLotsRegistered.plus(BigInt.fromI32(1));
    farmer.totalWeightGrams = farmer.totalWeightGrams.plus(event.params.weightGrams);
    farmer.save();
  }
}

export function handleLotValidated(event: LotValidated): void {
  let lot = Lot.load(event.params.lotId.toString());
  if (lot) {
    lot.status = event.params.status;
    lot.validatedAt = event.block.timestamp;
    lot.validatedBy = event.params.validator;
    lot.save();
  }

  let validation = new Validation(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  );
  validation.lot = event.params.lotId.toString();
  validation.validator = event.params.validator;
  validation.status = event.params.status;
  validation.timestamp = event.block.timestamp;
  validation.save();
}

// FarmerMarket event handlers

export function handleLotListed(event: LotListed): void {
  let offer = new Offer(event.params.offerId.toString());
  offer.offerId = event.params.offerId;
  offer.lot = event.params.lotId.toString();
  offer.farmer = event.params.farmer.toHexString();
  offer.askPriceWei = event.params.askPrice;
  offer.buyer = null;
  offer.escrowAmount = BigInt.fromI32(0);
  offer.status = 0;
  offer.listedAt = event.block.timestamp;
  offer.completedAt = null;
  offer.createdAt = event.block.timestamp;
  offer.save();

  let lot = Lot.load(event.params.lotId.toString());
  if (lot) {
    lot.offer = event.params.offerId.toString();
    lot.save();
  }
}

export function handlePurchaseEscrowed(event: PurchaseEscrowed): void {
  let offer = Offer.load(event.params.offerId.toString());
  if (offer) {
    offer.buyer = event.params.buyer;
    offer.escrowAmount = event.params.amount;
    offer.status = 1;
    offer.save();
  }

  let purchase = new Purchase(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  );
  purchase.offer = event.params.offerId.toString();
  purchase.buyer = event.params.buyer;
  purchase.amount = event.params.amount;
  purchase.timestamp = event.block.timestamp;
  purchase.save();

  if (offer) {
    offer.purchase = purchase.id;
    offer.save();
  }
}

export function handlePaymentReleased(event: PaymentReleased): void {
  let offer = Offer.load(event.params.offerId.toString());
  if (offer) {
    offer.status = 2;
    offer.completedAt = event.block.timestamp;
    offer.save();
  }

  let payment = new Payment(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  );
  payment.offer = event.params.offerId.toString();
  payment.farmer = event.params.farmer;
  payment.netAmount = event.params.netAmount;
  payment.fee = event.params.fee;
  payment.timestamp = event.block.timestamp;
  payment.save();

  if (offer) {
    offer.payment = payment.id;
    offer.save();
  }
}

export function handleOfferCancelled(event: OfferCancelled): void {
  let offer = Offer.load(event.params.offerId.toString());
  if (offer) {
    offer.status = 3;
    offer.completedAt = event.block.timestamp;
    offer.save();
  }
}

// IndustryMarkRegistry event handlers

export function handleMarkIssued(event: MarkIssued): void {
  let mark = new Mark(event.params.markId.toString());
  mark.markId = event.params.markId;
  mark.farmer = event.params.farmer.toHexString();
  mark.farmerId = event.params.farmerId;
  mark.markType = event.params.markType;
  mark.issuedAt = event.block.timestamp;
  mark.expiresAt = event.params.expiresAt;
  mark.status = 0;
  mark.issuedBy = event.transaction.from;
  mark.createdAt = event.block.timestamp;
  mark.save();
}

export function handleMarkRevoked(event: MarkRevoked): void {
  let mark = Mark.load(event.params.markId.toString());
  if (mark) {
    mark.status = 2;
    mark.save();
  }
}

export function handleMarkExpired(event: MarkExpired): void {
  let mark = Mark.load(event.params.markId.toString());
  if (mark) {
    mark.status = 1;
    mark.save();
  }
}
