const express = require('express');
const { authenticate } = require('../middleware/auth');
const { ethers } = require('ethers');
const { querySubgraph } = require('../lib/subgraph');

const router = express.Router();

function parsePagination(query) {
  const page = Math.max(parseInt(query.page || 1, 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || 20, 10), 1), 100);
  return { page, limit, skip: (page - 1) * limit };
}

function normalizeWalletOrFail(wallet, res) {
  if (!ethers.isAddress(wallet)) {
    res.status(400).json({ error: 'Invalid wallet address' });
    return null;
  }
  return wallet.toLowerCase();
}

/**
 * GET /api/farmers/:wallet
 * Get farmer profile
 */
router.get('/:wallet', authenticate, async (req, res) => {
  try {
    const wallet = normalizeWalletOrFail(req.params.wallet, res);
    if (!wallet) return;
    const cacheKey = `farmer:${wallet}`;
    
    const cached = req.cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const query = `
      query FarmerByWallet($wallet: String!) {
        farmers(where: { id: $wallet }, first: 1) {
          id
          wallet
          farmerId
          district
          active
          totalLotsRegistered
          totalWeightGrams
          createdAt
        }
      }
    `;
    const data = await querySubgraph(query, { wallet });
    const farmer = data.farmers[0] || null;

    if (!farmer) {
      return res.status(404).json({ error: 'Farmer not found' });
    }

    req.cache.set(cacheKey, farmer);
    res.json(farmer);
  } catch (error) {
    console.error('Get farmer error:', error);
    res.status(500).json({ error: 'Failed to fetch farmer' });
  }
});

/**
 * GET /api/farmers/:wallet/lots
 * Get all lots for a farmer
 */
router.get('/:wallet/lots', authenticate, async (req, res) => {
  try {
    const wallet = normalizeWalletOrFail(req.params.wallet, res);
    if (!wallet) return;
    const { page, limit, skip } = parsePagination(req.query);
    const cacheKey = `farmer:${wallet}:lots:${page}:${limit}`;
    
    const cached = req.cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const lotsQuery = `
      query FarmerLots($wallet: String!, $first: Int!, $skip: Int!) {
        lots(
          where: { farmer: $wallet }
          first: $first
          skip: $skip
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

    const countQuery = `
      query FarmerLotsCount($wallet: String!) {
        lots(where: { farmer: $wallet }) { id }
      }
    `;

    const [lotsData, countData] = await Promise.all([
      querySubgraph(lotsQuery, { wallet, first: limit, skip }),
      querySubgraph(countQuery, { wallet }),
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

    req.cache.set(cacheKey, lots);
    res.json(lots);
  } catch (error) {
    console.error('Get farmer lots error:', error);
    res.status(500).json({ error: 'Failed to fetch farmer lots' });
  }
});

/**
 * GET /api/farmers/:wallet/stats
 * Get farmer statistics
 */
router.get('/:wallet/stats', authenticate, async (req, res) => {
  try {
    const wallet = normalizeWalletOrFail(req.params.wallet, res);
    if (!wallet) return;
    const cacheKey = `farmer:${wallet}:stats`;
    
    const cached = req.cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const statsQuery = `
      query FarmerStats($wallet: String!) {
        farmers(where: { id: $wallet }, first: 1) {
          totalLotsRegistered
          totalWeightGrams
        }
        lots(where: { farmer: $wallet, status: 1 }) { id }
        offers(where: { farmer: $wallet, status: 2 }) { id }
        payments(where: { farmer: $wallet }) {
          netAmount
        }
      }
    `;

    const data = await querySubgraph(statsQuery, { wallet });
    const farmer = data.farmers[0] || null;
    const totalRevenue = (data.payments || []).reduce(
      (acc, payment) => acc + BigInt(payment.netAmount || "0"),
      0n
    );

    const stats = {
      totalLots: farmer ? Number(farmer.totalLotsRegistered) : 0,
      totalWeightGrams: farmer ? Number(farmer.totalWeightGrams) : 0,
      validatedLots: data.lots.length,
      soldLots: data.offers.length,
      totalRevenue: totalRevenue.toString(),
    };

    req.cache.set(cacheKey, stats);
    res.json(stats);
  } catch (error) {
    console.error('Get farmer stats error:', error);
    res.status(500).json({ error: 'Failed to fetch farmer stats' });
  }
});

module.exports = router;
