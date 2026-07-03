const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { requireGovernmentRole } = require('../middleware/onchainAuth');
const { querySubgraph } = require('../lib/subgraph');
const { ethers } = require('ethers');

const router = express.Router();
const MARK_STATUS = {
  ACTIVE: 0,
  EXPIRED: 1,
  REVOKED: 2,
};

const INDUSTRY_MARK_REGISTRY_MIN_ABI = [
  "function issueMark(address farmer, string farmerId, uint8 markType, string description, uint256 expiresAt, string metadataURI) returns (uint256)",
  "function revokeMark(uint256 markId)",
];

function parsePagination(query) {
  const page = Math.max(parseInt(query.page || 1, 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || 20, 10), 1), 100);
  return { page, limit, skip: (page - 1) * limit };
}

function parseStatusFilter(input) {
  if (input === undefined || input === null || input === "") return undefined;
  const upper = String(input).toUpperCase();
  if (MARK_STATUS[upper] !== undefined) return MARK_STATUS[upper];
  const numeric = Number(input);
  if (Number.isInteger(numeric) && numeric >= 0 && numeric <= 2) return numeric;
  return null;
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

function invalidateMarksCache(cache) {
  for (const key of cache.keys()) {
    if (key.startsWith("marks:") || key.startsWith("mark:") || key.includes(":marks")) {
      cache.del(key);
    }
  }
}

/**
 * GET /api/marks
 * Get marks with pagination and filtering
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { farmer } = req.query;
    const { page, limit, skip } = parsePagination(req.query);
    const parsedStatus = parseStatusFilter(req.query.status);
    if (parsedStatus === null) {
      return res.status(400).json({ error: 'Invalid status filter' });
    }
    if (farmer && !ethers.isAddress(farmer)) {
      return res.status(400).json({ error: 'Invalid farmer address filter' });
    }
    const cacheKey = `marks:${page}:${limit}:${farmer || 'all'}:${parsedStatus ?? 'all'}`;
    
    const cached = req.cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const where = {};
    if (farmer) where.farmer = farmer.toLowerCase();
    if (parsedStatus !== undefined) where.status = parsedStatus;

    const marksQuery = `
      query Marks($first: Int!, $skip: Int!, $where: Mark_filter) {
        marks(
          first: $first
          skip: $skip
          where: $where
          orderBy: issuedAt
          orderDirection: desc
        ) {
          id
          markId
          farmerId
          markType
          description
          issuedAt
          expiresAt
          status
          issuedBy
          metadataURI
          farmer {
            id
            wallet
            farmerId
            district
          }
        }
      }
    `;

    const countQuery = `
      query MarksCount($where: Mark_filter) {
        marks(where: $where) { id }
      }
    `;

    const [marksData, countData] = await Promise.all([
      querySubgraph(marksQuery, { first: limit, skip, where }),
      querySubgraph(countQuery, { where }),
    ]);
    const total = countData.marks.length;

    const marks = {
      data: marksData.marks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    };

    req.cache.set(cacheKey, marks);
    res.json(marks);
  } catch (error) {
    console.error('Get marks error:', error);
    res.status(500).json({ error: 'Failed to fetch marks' });
  }
});

/**
 * GET /api/marks/farmer/:wallet
 * Get all marks for a farmer
 */
router.get('/farmer/:wallet', authenticate, async (req, res) => {
  try {
    const { wallet } = req.params;
    if (!ethers.isAddress(wallet)) {
      return res.status(400).json({ error: 'Invalid farmer wallet address' });
    }
    const normalizedWallet = wallet.toLowerCase();
    const cacheKey = `farmer:${normalizedWallet}:marks`;
    
    const cached = req.cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const query = `
      query FarmerMarks($wallet: String!) {
        marks(
          where: { farmer: $wallet }
          orderBy: issuedAt
          orderDirection: desc
        ) {
          id
          markId
          farmerId
          markType
          description
          issuedAt
          expiresAt
          status
          issuedBy
          metadataURI
          farmer {
            id
            wallet
            farmerId
            district
          }
        }
      }
    `;
    const data = await querySubgraph(query, { wallet: normalizedWallet });
    const marks = data.marks;

    req.cache.set(cacheKey, marks);
    res.json(marks);
  } catch (error) {
    console.error('Get farmer marks error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Failed to fetch farmer marks' });
  }
});

/**
 * GET /api/marks/:id
 * Get mark by ID
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId < 1) {
      return res.status(400).json({ error: 'Invalid mark ID' });
    }
    const cacheKey = `mark:${numericId}`;
    
    const cached = req.cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const query = `
      query MarkById($markId: BigInt!) {
        marks(where: { markId: $markId }, first: 1) {
          id
          markId
          farmerId
          markType
          description
          issuedAt
          expiresAt
          status
          issuedBy
          metadataURI
          farmer {
            id
            wallet
            farmerId
            district
          }
        }
      }
    `;
    const data = await querySubgraph(query, { markId: String(numericId) });
    const mark = data.marks[0] || null;

    if (!mark) {
      return res.status(404).json({ error: 'Mark not found' });
    }

    req.cache.set(cacheKey, mark);
    res.json(mark);
  } catch (error) {
    console.error('Get mark error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Failed to fetch mark' });
  }
});

/**
 * POST /api/marks
 * Issue a new mark (government only)
 */
router.post('/', [
  authenticate,
  requireGovernmentRole,
  body('farmer').isEthereumAddress().withMessage('Invalid farmer address'),
  body('farmerId').notEmpty().withMessage('Farmer ID required'),
  body('markType').isIn(['0', '1', '2']).withMessage('Invalid mark type'),
  body('expiresAt').isInt({ min: 1 }).withMessage('Invalid expiry date'),
  body('description').optional().isString(),
  body('metadataURI').optional().isString(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!process.env.INDUSTRY_MARK_REGISTRY_ADDRESS) {
      return res.status(500).json({ error: 'INDUSTRY_MARK_REGISTRY_ADDRESS is not configured' });
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    const expiresAt = Number(req.body.expiresAt);
    if (expiresAt <= nowSeconds) {
      return res.status(400).json({ error: 'expiresAt must be a future unix timestamp (seconds)' });
    }

    const signer = getRelayerSigner();
    const registry = new ethers.Contract(
      process.env.INDUSTRY_MARK_REGISTRY_ADDRESS,
      INDUSTRY_MARK_REGISTRY_MIN_ABI,
      signer
    );

    const tx = await registry.issueMark(
      req.body.farmer,
      req.body.farmerId,
      Number(req.body.markType),
      req.body.description || "Official government mark",
      BigInt(expiresAt),
      req.body.metadataURI || ""
    );
    const receipt = await tx.wait();
    invalidateMarksCache(req.cache);

    res.status(201).json({
      message: 'Mark issued successfully',
      txHash: tx.hash,
      blockNumber: receipt?.blockNumber ?? null,
    });
  } catch (error) {
    console.error('Issue mark error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Failed to issue mark' });
  }
});

/**
 * PUT /api/marks/:id/revoke
 * Revoke a mark (government only)
 */
router.put('/:id/revoke', authenticate, requireGovernmentRole, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ error: 'Invalid mark ID' });
    }
    if (!process.env.INDUSTRY_MARK_REGISTRY_ADDRESS) {
      return res.status(500).json({ error: 'INDUSTRY_MARK_REGISTRY_ADDRESS is not configured' });
    }

    const signer = getRelayerSigner();
    const registry = new ethers.Contract(
      process.env.INDUSTRY_MARK_REGISTRY_ADDRESS,
      INDUSTRY_MARK_REGISTRY_MIN_ABI,
      signer
    );
    const tx = await registry.revokeMark(BigInt(id));
    const receipt = await tx.wait();
    invalidateMarksCache(req.cache);

    res.json({
      message: 'Mark revoked successfully',
      txHash: tx.hash,
      blockNumber: receipt?.blockNumber ?? null,
    });
  } catch (error) {
    console.error('Revoke mark error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Failed to revoke mark' });
  }
});

module.exports = router;
