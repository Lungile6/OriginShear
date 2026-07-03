const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { requireValidatorRole } = require('../middleware/onchainAuth');
const { querySubgraph } = require('../lib/subgraph');
const { ethers } = require('ethers');

const router = express.Router();
const LOT_STATUS = {
  PENDING: 0,
  VALIDATED: 1,
  REJECTED: 2,
  SOLD: 3,
};

const HARVEST_LEDGER_MIN_ABI = [
  "function validateLot(uint256 lotId, bool approve)",
];

function parsePagination(query) {
  const page = Math.max(parseInt(query.page || 1, 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || 20, 10), 1), 100);
  return { page, limit, skip: (page - 1) * limit };
}

function parseStatusFilter(input) {
  if (input === undefined || input === null || input === "") return undefined;
  const upper = String(input).toUpperCase();
  if (LOT_STATUS[upper] !== undefined) return LOT_STATUS[upper];
  const numeric = Number(input);
  if (Number.isInteger(numeric) && numeric >= 0 && numeric <= 3) return numeric;
  return null;
}

function invalidateLotsCache(cache) {
  for (const key of cache.keys()) {
    if (key.startsWith("lots:") || key.startsWith("lot:")) {
      cache.del(key);
    }
  }
}

function getRelayerSigner() {
  const privateKey = process.env.RELAYER_PRIVATE_KEY;
  if (!privateKey) {
    const err = new Error("RELAYER_PRIVATE_KEY is not configured");
    err.status = 501;
    throw err;
  }

  const rpcUrl = process.env.CELO_SEPOLIA_RPC_URL || "https://forno.celo-sepolia.celo-testnet.org";
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  return new ethers.Wallet(privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`, provider);
}

/**
 * GET /api/lots
 * Get lots with pagination and filtering
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { farmer } = req.query;
    const { page, limit, skip } = parsePagination(req.query);
    const parsedStatus = parseStatusFilter(req.query.status);
    if (parsedStatus === null) {
      return res.status(400).json({ error: "Invalid status filter" });
    }
    if (farmer && !ethers.isAddress(farmer)) {
      return res.status(400).json({ error: "Invalid farmer address filter" });
    }

    const cacheKey = `lots:${page}:${limit}:${parsedStatus ?? 'all'}:${farmer || 'all'}`;
    
    // Check cache first
    const cached = req.cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const where = {};
    if (parsedStatus !== undefined) where.status = parsedStatus;
    if (farmer) where.farmer = farmer.toLowerCase();

    const lotsQuery = `
      query Lots($first: Int!, $skip: Int!, $where: Lot_filter) {
        lots(
          first: $first
          skip: $skip
          where: $where
          orderBy: registeredAt
          orderDirection: desc
        ) {
          id
          lotId
          fibreType
          grade
          weightGrams
          gpsZone
          seasonYear
          proofOfOrigin
          status
          registeredAt
          validatedAt
          validatedBy
          metadataURI
          farmer {
            id
            wallet
            farmerId
            district
            active
          }
        }
      }
    `;

    const countQuery = `
      query LotsCount($where: Lot_filter) {
        lots(where: $where) { id }
      }
    `;

    const [lotsData, countData] = await Promise.all([
      querySubgraph(lotsQuery, { first: limit, skip, where }),
      querySubgraph(countQuery, { where }),
    ]);

    const total = countData.lots.length;
    const lots = {
      data: lotsData.lots,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    };

    // Cache for 5 minutes
    req.cache.set(cacheKey, lots);
    res.json(lots);
  } catch (error) {
    console.error('Get lots error:', error);
    res.status(500).json({ error: 'Failed to fetch lots' });
  }
});

/**
 * GET /api/lots/:id
 * Get lot by ID
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId < 1) {
      return res.status(400).json({ error: 'Invalid lot ID' });
    }

    const cacheKey = `lot:${id}`;
    
    const cached = req.cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const query = `
      query LotById($lotId: BigInt!) {
        lots(where: { lotId: $lotId }, first: 1) {
          id
          lotId
          fibreType
          grade
          weightGrams
          gpsZone
          seasonYear
          proofOfOrigin
          status
          registeredAt
          validatedAt
          validatedBy
          metadataURI
          farmer {
            id
            wallet
            farmerId
            district
            active
          }
          offer {
            id
            offerId
            askPriceWei
            status
            buyer
            escrowAmount
            listedAt
            completedAt
          }
        }
      }
    `;

    const data = await querySubgraph(query, { lotId: String(numericId) });
    const lot = data.lots[0] || null;

    if (!lot) {
      return res.status(404).json({ error: 'Lot not found' });
    }

    req.cache.set(cacheKey, lot);
    res.json(lot);
  } catch (error) {
    console.error('Get lot error:', error);
    res.status(500).json({ error: 'Failed to fetch lot' });
  }
});

/**
 * POST /api/lots
 * Register a new lot (proxy to blockchain)
 */
router.post('/', [
  authenticate,
  body('fibreType').isIn(['0', '1', '2']).withMessage('Invalid fibre type'),
  body('grade').isIn(['0', '1', '2']).withMessage('Invalid grade'),
  body('weightGrams').isInt({ min: 1, max: 4000000 }).withMessage('Invalid weight'),
  body('gpsZone').notEmpty().withMessage('GPS zone required'),
  body('seasonYear').notEmpty().withMessage('Season year required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // This endpoint cannot safely submit on behalf of farmer wallets
    // without meta-transaction support in the contracts.
    res.status(501).json({
      error: 'Direct lot registration must be submitted from the farmer wallet client.',
      contractMethod: 'HarvestLedger.registerLot',
      reason: 'No meta-transaction/relayer signature flow exists for farmer-only writes.',
    });
  } catch (error) {
    console.error('Register lot error:', error);
    res.status(500).json({ error: 'Failed to register lot' });
  }
});

/**
 * PUT /api/lots/:id/validate
 * Validate a lot (validator only)
 */
router.put('/:id/validate', authenticate, requireValidatorRole, async (req, res) => {
  try {
    const { id } = req.params;
    const numericId = Number(id);
    const { approve } = req.body;

    if (!Number.isInteger(numericId) || numericId < 1) {
      return res.status(400).json({ error: 'Invalid lot ID' });
    }
    if (typeof approve !== 'boolean') {
      return res.status(400).json({ error: 'approve must be boolean' });
    }

    if (!process.env.HARVEST_LEDGER_ADDRESS) {
      return res.status(500).json({ error: 'HARVEST_LEDGER_ADDRESS is not configured' });
    }

    const signer = getRelayerSigner();
    const ledger = new ethers.Contract(
      process.env.HARVEST_LEDGER_ADDRESS,
      HARVEST_LEDGER_MIN_ABI,
      signer
    );
    const tx = await ledger.validateLot(BigInt(numericId), approve);
    const receipt = await tx.wait();

    invalidateLotsCache(req.cache);
    res.json({
      message: `Lot ${id} ${approve ? 'approved' : 'rejected'}`,
      txHash: tx.hash,
      blockNumber: receipt?.blockNumber ?? null,
    });
  } catch (error) {
    console.error('Validate lot error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Failed to validate lot' });
  }
});

module.exports = router;
