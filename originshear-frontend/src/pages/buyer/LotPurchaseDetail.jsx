import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  useAccount,
  useChainId,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import AppLayout from "../../layouts/AppLayout";
import LotVerificationPanel from "../../components/lot/LotVerificationPanel";
import { useCusdBalance } from "../../hooks/useCusdBalance";
import { HARVEST_LEDGER_ABI, FibreTypeLabel, GradeLabel } from "../../contracts/HarvestLedger";
import { FARMER_MARKET_ABI, OfferStatus, OfferStatusLabel, ERC20_ABI } from "../../contracts/FarmerMarket";
import { getContractAddresses } from "../../contracts/addresses";
import { formatCUSD, cusdToLSL, gramsToKg, shorten } from "../../lib/utils";
import BilingualText from "../../components/ui/BilingualText";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Icon from "../../components/ui/Icon";
import { LotCardSkeleton } from "../../components/ui/Skeleton";
import OpenDisputePanel from "../../components/market/OpenDisputePanel";

export default function LotPurchaseDetail() {
  const { lotId } = useParams();
  const { address } = useAccount();
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);
  const { data: balance } = useCusdBalance(address);
  const [purchaseStep, setPurchaseStep] = useState(null);

  const { data: lot, isLoading: loadingLot } = useReadContract({
    address: addresses?.harvestLedger,
    abi: HARVEST_LEDGER_ABI,
    functionName: "getLot",
    args: lotId ? [BigInt(lotId)] : undefined,
    query: { enabled: Boolean(addresses && lotId) },
  });

  const { data: offerId } = useReadContract({
    address: addresses?.farmerMarket,
    abi: FARMER_MARKET_ABI,
    functionName: "lotToOffer",
    args: lotId ? [BigInt(lotId)] : undefined,
    query: { enabled: Boolean(addresses && lotId) },
  });

  const { data: offer, refetch: refetchOffer } = useReadContract({
    address: addresses?.farmerMarket,
    abi: FARMER_MARKET_ABI,
    functionName: "offers",
    args: offerId && Number(offerId) > 0 ? [offerId] : undefined,
    query: { enabled: Boolean(addresses && offerId && Number(offerId) > 0) },
  });

  const offerData = useMemo(
    () =>
      offer
        ? {
            offerId: offer[0],
            lotId: offer[1],
            farmer: offer[2],
            askPriceWei: offer[3],
            buyer: offer[4],
            escrowAmount: offer[5],
            status: offer[6],
          }
        : null,
    [offer]
  );

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: addresses?.cUSD,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address && addresses?.farmerMarket ? [address, addresses.farmerMarket] : undefined,
    query: { enabled: Boolean(addresses && address) },
  });

  const { writeContract, data: txHash, isPending, error: writeError, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const busy = isPending || isConfirming;
  const proof = lot?.proofOfOrigin;
  const isListed = offerData?.status === OfferStatus.LISTED;
  const isEscrow =
    offerData?.status === OfferStatus.IN_ESCROW &&
    offerData?.buyer?.toLowerCase() === address?.toLowerCase();
  const isCompleted = offerData?.status === OfferStatus.COMPLETED;
  const needsApproval =
    isListed &&
    offerData?.askPriceWei &&
    BigInt(allowance ?? 0n) < BigInt(offerData.askPriceWei);
  const canPurchase = Boolean(address && addresses?.farmerMarket);

  useEffect(() => {
    if (!isSuccess || !purchaseStep) return;

    if (purchaseStep === "approve" && offerData?.offerId && addresses?.farmerMarket) {
      reset();
      setTimeout(() => {
        setPurchaseStep("purchase");
        writeContract({
          address: addresses.farmerMarket,
          abi: FARMER_MARKET_ABI,
          functionName: "purchaseLot",
          args: [offerData.offerId],
        });
      }, 0);
      return;
    }

    if (purchaseStep === "purchase") {
      setTimeout(() => {
        setPurchaseStep(null);
        refetchOffer();
        refetchAllowance();
        reset();
      }, 0);
    }
  }, [
    isSuccess,
    purchaseStep,
    offerData,
    addresses,
    writeContract,
    refetchOffer,
    refetchAllowance,
    reset,
  ]);

  function handlePurchase() {
    if (!addresses?.farmerMarket || !offerData?.offerId) return;

    if (needsApproval && addresses?.cUSD) {
      setPurchaseStep("approve");
      writeContract({
        address: addresses.cUSD,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [addresses.farmerMarket, offerData.askPriceWei],
      });
      return;
    }

    setPurchaseStep("purchase");
    writeContract({
      address: addresses.farmerMarket,
      abi: FARMER_MARKET_ABI,
      functionName: "purchaseLot",
      args: [offerData.offerId],
    });
  }

  if (loadingLot) {
    return (
      <AppLayout role="BUYER" title="ORIGINSHEAR">
        <div className="px-margin-mobile pt-stack-lg">
          <LotCardSkeleton />
        </div>
      </AppLayout>
    );
  }

  if (!addresses) {
    return (
      <AppLayout role="BUYER" title="ORIGINSHEAR">
        <div className="px-4 py-6">
          <p className="text-body-sm text-on-surface-variant mb-3">
            Marketplace contracts are not available on your current network.
          </p>
          <Link to="/connect" className="text-primary font-bold text-label-sm">
            Connect wallet and switch network
          </Link>
        </div>
      </AppLayout>
    );
  }

  if (!lot) {
    return (
      <AppLayout role="BUYER" title="ORIGINSHEAR">
        <p className="px-4 py-6 text-body-sm text-on-surface-variant">
          Lot not found or not available right now.
        </p>
      </AppLayout>
    );
  }

  return (
    <AppLayout role="BUYER" title="ORIGINSHEAR">
      <div className="px-margin-mobile pt-stack-lg pb-8 max-w-[1024px] mx-auto">
        <Link to="/buyer/marketplace" className="text-primary text-label-sm font-bold mb-3 inline-flex items-center gap-1">
          <Icon name="arrow_back" className="!text-base" />
          Back to Marketplace
        </Link>

        <Card role="buyer" className="mb-stack-md">
          <p className="text-label-sm text-on-surface-variant uppercase">Lot #{lotId}</p>
          <p className="font-bold text-headline-sm mb-2">
            {FibreTypeLabel[lot.fibreType]} · Grade {GradeLabel[lot.grade]} · {gramsToKg(lot.weightGrams)} kg
          </p>
          <p className="text-body-sm text-on-surface-variant">{lot.gpsZone}, Lesotho</p>
          {offerData && (
            <div className="mt-3 pt-3 border-t border-outline-variant flex justify-between items-center">
              <div>
                <p className="text-label-sm text-on-surface-variant">Asking Price</p>
                <p className="font-bold text-headline-sm text-primary">
                  {formatCUSD(offerData.askPriceWei)} cUSD
                </p>
              </div>
              <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-label-sm font-bold">
                {OfferStatusLabel[offerData.status]}
              </span>
            </div>
          )}
        </Card>

        <section className="mb-stack-lg">
          <div className="flex items-center justify-between mb-3 gap-3">
            <h2 className="text-label-lg text-on-surface-variant uppercase tracking-widest">
              <BilingualText en="Origin Verification" st="Netefatso ea Tšimo" size="label-lg" />
            </h2>
            {proof && (
              <Link to={`/buyer/verify/lot/${lotId}?proof=${proof}`} className="text-primary text-label-sm font-bold">
                Open Full Verify
              </Link>
            )}
          </div>
          <LotVerificationPanel lotId={lotId} proof={proof} showDownloadButton={false} />
        </section>

        {offerData && (
          <Card role="buyer">
            <h2 className="font-bold mb-3 flex items-center gap-2">
              <Icon name="shopping_cart" className="text-primary" />
              <BilingualText en="Purchase" st="Reka" size="body-lg" />
            </h2>

            <div className="flex justify-between text-body-sm mb-4">
              <span className="text-on-surface-variant">Your cUSD balance</span>
              <span className="font-bold">{formatCUSD(balance)} cUSD</span>
            </div>

            {isListed && (
              <>
                <p className="text-body-sm text-on-surface-variant mb-4">
                  Deposits {formatCUSD(offerData.askPriceWei)} cUSD into escrow. LNWMGA releases payment
                  to the farmer after physical handover.
                </p>
                {!canPurchase && (
                  <p className="text-label-sm text-on-surface-variant mb-3">
                    Connect wallet to purchase this selected lot.
                  </p>
                )}
                <Button
                  onClick={handlePurchase}
                  disabled={
                    busy ||
                    !canPurchase ||
                    BigInt(balance ?? 0n) < BigInt(offerData.askPriceWei ?? 0n)
                  }
                  loading={busy}
                  size="lg"
                  icon={<Icon name="payments" />}
                >
                  {busy
                    ? purchaseStep === "approve"
                      ? "Approving cUSD…"
                      : "Confirming purchase…"
                    : !canPurchase
                      ? "Connect Wallet to Buy"
                      : needsApproval
                        ? `Approve & Buy · ${formatCUSD(offerData.askPriceWei)} cUSD`
                        : `Buy Lot · ${formatCUSD(offerData.askPriceWei)} cUSD`}
                </Button>
                {!canPurchase && (
                  <Link to="/connect" className="text-primary text-label-sm font-bold mt-2 inline-block">
                    Go to Connect
                  </Link>
                )}
                {canPurchase && BigInt(balance ?? 0n) < BigInt(offerData.askPriceWei ?? 0n) && (
                  <p className="text-label-sm text-error mt-2">
                    Insufficient cUSD balance (≈ {cusdToLSL(offerData.askPriceWei)} LSL needed)
                  </p>
                )}
              </>
            )}

            {isEscrow && (
              <div className="bg-tertiary-fixed text-on-tertiary-fixed rounded-lg p-4 flex gap-3">
                <Icon name="lock_clock" />
                <div>
                  <p className="font-bold">Payment in Escrow</p>
                  <p className="text-body-sm mt-1">
                    {formatCUSD(offerData.escrowAmount)} cUSD held until LNWMGA confirms fibre handover.
                  </p>
                </div>
              </div>
            )}

            {isEscrow &&
              address &&
              offerData.buyer?.toLowerCase() === address.toLowerCase() && (
                <div className="mt-4">
                  <OpenDisputePanel
                    disputeAddress={addresses?.disputeResolution}
                    offerId={offerData.offerId}
                    onOpened={() => refetchOffer()}
                  />
                </div>
              )}

            {offerData.status === OfferStatus.IN_ESCROW &&
              offerData.buyer &&
              offerData.buyer.toLowerCase() !== address?.toLowerCase() && (
                <p className="text-body-sm text-on-surface-variant">
                  This lot is already in escrow with buyer {shorten(offerData.buyer)}.
                </p>
              )}

            {isCompleted && (
              <p className="text-body-sm text-primary font-semibold">
                This lot purchase is complete. View it in your purchase history.
              </p>
            )}

            {writeError && (
              <p className="text-label-sm text-error mt-3">
                {writeError.shortMessage || writeError.message}
              </p>
            )}
          </Card>
        )}

        {!offerData && (
          <p className="text-body-sm text-on-surface-variant">
            This lot is not currently listed on the marketplace.
          </p>
        )}
      </div>
    </AppLayout>
  );
}
