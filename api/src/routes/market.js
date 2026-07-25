const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { requireValidatorRole } = require('../middleware/onchainAuth');
const { querySubgraph } = require('../lib/subgraph');
const { ethers } = require('ethers');
const { getProvider } = require('../lib/rpc');

const router = express.Router();
const OFFER_STATUS = {
  LISTED: 0,
  IN_ESCROW: 1,
  COMPLETED: 2,
  CANCELLED: 3,
};

const FARMER_MARKET_MIN_ABI = [
  "function releasePayment(uint256 offerId)",
  "function lotToOffer(uint256 lotId) view returns (uint256)",
  "function offers(uint256) view returns (uint256 offerId, uint256 lotId, address farmer, uint256 askPriceWei, address buyer, uint256 escrowAmount, uint8 status, uint256 listedAt, uint256 completedAt)",
];

const HARVEST_LEDGER_MARKET_ABI = [
  "function totalLots() view returns (uint256)",
  "function getLot(uint256 lotId) view returns (tuple(uint256 lotId, address farmer, uint8 fibreType, uint8 grade, uint32 weightGrams, string gpsZone, string seasonYear, bytes32 proofOfOrigin, uint8 status, uint256 registeredAt, uint256 validatedAt, address validatedBy, string metadataURI))",
];

const MAX_ONCHAIN_LOT_SCAN = 200;

async function fetchOffersFromChain(statusFilter) {
  const ledgerAddress = process.env.HARVEST_LEDGER_ADDRESS;
  const marketAddress = process.env.FARMER_MARKET_ADDRESS;
  if (!ledgerAddress || !marketAddress) {
    return [];
  }

  const provider = getProvider();
  const ledger = new ethers.Contract(ledgerAddress, HARVEST_LEDGER_MARKET_ABI, provider);
  const market = new ethers.Contract(marketAddress, FARMER_MARKET_MIN_ABI, provider);

  const total = Number(await ledger.totalLots());
  const scan = Math.min(total, MAX_ONCHAIN_LOT_SCAN);
  const offers = [];

  for (let lotId = 1; lotId <= scan; lotId++) {
    const lot = await ledger.getLot(lotId);
    // VALIDATED only — marketplace inventory
    if (Number(lot.status) !== 1) continue;

    const offerId = await market.lotToOffer(lotId);
    if (offerId === 0n) continue;

    const offer = await market.offers(offerId);
    const status = Number(offer.status);
    if (statusFilter !== undefined && status !== statusFilter) continue;

    offers.push({
      id: offer.offerId.toString(),
      offerId: offer.offerId.toString(),
      askPriceWei: offer.askPriceWei.toString(),
      buyer: offer.buyer,
      escrowAmount: offer.escrowAmount.toString(),
      status,
      listedAt: offer.listedAt.toString(),
      completedAt: offer.completedAt.toString(),
      farmer: { id: offer.farmer.toLowerCase(), wallet: offer.farmer },
      lot: {
        id: lot.lotId.toString(),
        lotId: lot.lotId.toString(),
        fibreType: Number(lot.fibreType),
        grade: Number(lot.grade),
        weightGrams: lot.weightGrams.toString(),
        gpsZone: lot.gpsZone,
        seasonYear: lot.seasonYear,
        proofOfOrigin: lot.proofOfOrigin,
        status: Number(lot.status),
      },
      source: "onchain",
    });
  }

  offers.sort((a, b) => Number(b.listedAt) - Number(a.listedAt));
  return offers;
}

function parsePagination(query) {
  const page = Math.max(parseInt(query.page || 1, 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || 20, 10), 1), 100);
  return { page, limit, skip: (page - 1) * limit };
}

function parseStatusFilter(input) {
  if (input === undefined || input === null || input === "") return undefined;
  const upper = String(input).toUpperCase();
  if (OFFER_STATUS[upper] !== undefined) return OFFER_STATUS[upper];
  const numeric = Number(input);
  if (Number.isInteger(numeric) && numeric >= 0 && numeric <= 3) return numeric;
  return null;
}

function getRelayerSigner() {
  const privateKey = process.env.RELAYER_PRIVATE_KEY;
  if (!privateKey) {
    const err = new Error("RELAYER_PRIVATE_KEY is not configured");
    err.status = 501;
    throw err;
  }
  return new ethers.Wallet(
    privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`,
    getProvider()
  );
}

function invalidateMarketCache(cache) {
  for (const key of cache.keys()) {
    if (key.startsWith("offers:") || key.startsWith("offer:") || key.startsWith("payments:")) {
      cache.del(key);
    }
  }
}

/**
 * GET /api/market/offers
 * Get market offers with pagination
 */
router.get('/offers', async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const parsedStatus = parseStatusFilter(req.query.status);
    if (parsedStatus === null) {
      return res.status(400).json({ error: 'Invalid status filter' });
    }
    const cacheKey = `offers:${page}:${limit}:${parsedStatus ?? 'all'}`;
    
    const cached = req.cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const where = {};
    if (parsedStatus !== undefined) where.status = parsedStatus;

    const offersQuery = `
      query Offers($first: Int!, $skip: Int!, $where: Offer_filter) {
        offers(
          first: $first
          skip: $skip
          where: $where
          orderBy: listedAt
          orderDirection: desc
        ) {
          id
          offerId
          askPriceWei
          buyer
          escrowAmount
          status
          listedAt
          completedAt
          farmer { id wallet farmerId district }
          lot {
            id
            lotId
            fibreType
            grade
            weightGrams
            gpsZone
            seasonYear
            proofOfOrigin
            status
          }
        }
      }
    `;

    const countQuery = `
      query OffersCount($where: Offer_filter) {
        offers(where: $where) { id }
      }
    `;

    let rows = [];
    let total = 0;

    try {
      const [offersData, countData] = await Promise.all([
        querySubgraph(offersQuery, { first: limit, skip, where }),
        querySubgraph(countQuery, { where }),
      ]);
      rows = offersData.offers || [];
      total = (countData.offers || []).length;
    } catch (subgraphError) {
      console.warn("Market offers subgraph unavailable, using on-chain fallback:", subgraphError.message);
    }

    // Subgraph often lags or sits empty after redeploy — fall back to RPC.
    if (rows.length === 0) {
      const onchain = await fetchOffersFromChain(parsedStatus);
      total = onchain.length;
      rows = onchain.slice(skip, skip + limit);
    }

    const offers = {
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      }
    };

    req.cache.set(cacheKey, offers);
    res.json(offers);
  } catch (error) {
    console.error('Get offers error:', error);
    res.status(500).json({ error: 'Failed to fetch offers' });
  }
});

/**
 * GET /api/market/offers/:id
 * Get offer by ID
 */
router.get('/offers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId < 1) {
      return res.status(400).json({ error: 'Invalid offer ID' });
    }
    const cacheKey = `offer:${id}`;
    
    const cached = req.cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const query = `
      query OfferById($offerId: BigInt!) {
        offers(where: { offerId: $offerId }, first: 1) {
          id
          offerId
          askPriceWei
          buyer
          escrowAmount
          status
          listedAt
          completedAt
          farmer { id wallet farmerId district }
          lot {
            id
            lotId
            fibreType
            grade
            weightGrams
            gpsZone
            seasonYear
            proofOfOrigin
            status
          }
          purchase { id buyer amount timestamp }
          payment { id farmer netAmount fee timestamp }
        }
      }
    `;
    const data = await querySubgraph(query, { offerId: String(numericId) });
    const offer = data.offers[0] || null;

    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    req.cache.set(cacheKey, offer);
    res.json(offer);
  } catch (error) {
    console.error('Get offer error:', error);
    res.status(500).json({ error: 'Failed to fetch offer' });
  }
});

/**
 * POST /api/market/offers
 * List a lot for sale
 */
router.post('/offers', [
  authenticate,
  body('lotId').isInt().withMessage('Invalid lot ID'),
  body('askPriceWei').isInt({ min: 1 }).withMessage('Invalid price')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // This endpoint cannot safely submit on behalf of farmer wallets
    // without meta-transaction support in the contracts.
    res.status(501).json({
      error: 'Listing must be submitted from the farmer wallet client.',
      contractMethod: 'FarmerMarket.listLot',
      reason: 'No meta-transaction/relayer signature flow exists for farmer-only writes.',
    });
  } catch (error) {
    console.error('List offer error:', error);
    res.status(500).json({ error: 'Failed to list offer' });
  }
});

/**
 * POST /api/market/offers/:id/purchase
 * Purchase a lot
 */
router.post('/offers/:id/purchase', authenticate, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ error: 'Invalid offer ID' });
    }

    // This endpoint cannot safely submit on behalf of buyer wallets
    // without meta-transaction support in the contracts.
    res.status(501).json({
      error: 'Purchase must be submitted from the buyer wallet client.',
      contractMethod: 'FarmerMarket.purchaseLot',
      reason: 'No meta-transaction/relayer signature flow exists for buyer-only writes.',
    });
  } catch (error) {
    console.error('Purchase error:', error);
    res.status(500).json({ error: 'Failed to purchase' });
  }
});

/**
 * POST /api/market/offers/:id/release
 * Release payment (validator only)
 */
router.post('/offers/:id/release', authenticate, requireValidatorRole, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ error: 'Invalid offer ID' });
    }
    if (!process.env.FARMER_MARKET_ADDRESS) {
      return res.status(500).json({ error: 'FARMER_MARKET_ADDRESS is not configured' });
    }

    const signer = getRelayerSigner();
    const market = new ethers.Contract(
      process.env.FARMER_MARKET_ADDRESS,
      FARMER_MARKET_MIN_ABI,
      signer
    );
    const tx = await market.releasePayment(BigInt(id));
    const receipt = await tx.wait();

    invalidateMarketCache(req.cache);
    res.json({
      message: 'Payment released',
      txHash: tx.hash,
      blockNumber: receipt?.blockNumber ?? null,
    });
  } catch (error) {
    console.error('Release payment error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Failed to release payment' });
  }
});

/**
 * GET /api/market/payments
 * Get payment history
 */
router.get('/payments', authenticate, async (req, res) => {
  try {
    const { farmer, buyer } = req.query;
    if (farmer && !ethers.isAddress(farmer)) {
      return res.status(400).json({ error: 'Invalid farmer address filter' });
    }
    if (buyer && !ethers.isAddress(buyer)) {
      return res.status(400).json({ error: 'Invalid buyer address filter' });
    }
    const { page, limit, skip } = parsePagination(req.query);
    const cacheKey = `payments:${page}:${limit}:${farmer || 'all'}:${buyer || 'all'}`;
    
    const cached = req.cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const where = {};
    if (farmer) where.farmer = farmer.toLowerCase();
    if (buyer) where.offer_ = { buyer: buyer.toLowerCase() };

    const paymentsQuery = `
      query Payments($first: Int!, $skip: Int!, $where: Payment_filter) {
        payments(
          first: $first
          skip: $skip
          where: $where
          orderBy: timestamp
          orderDirection: desc
        ) {
          id
          farmer
          netAmount
          fee
          timestamp
          offer {
            id
            offerId
            askPriceWei
            buyer
            lot {
              id
              lotId
              fibreType
              grade
              weightGrams
              gpsZone
              seasonYear
            }
          }
        }
      }
    `;

    const countQuery = `
      query PaymentsCount($where: Payment_filter) {
        payments(where: $where) { id }
      }
    `;

    const [paymentsData, countData] = await Promise.all([
      querySubgraph(paymentsQuery, { first: limit, skip, where }),
      querySubgraph(countQuery, { where }),
    ]);
    const total = countData.payments.length;

    const payments = {
      data: paymentsData.payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    };

    req.cache.set(cacheKey, payments);
    res.json(payments);
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

module.exports = router;
