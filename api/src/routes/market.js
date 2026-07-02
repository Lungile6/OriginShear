const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/market/offers
 * Get market offers with pagination
 */
router.get('/offers', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const cacheKey = `offers:${page}:${limit}:${status || 'all'}`;
    
    const cached = req.cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // In production, fetch from subgraph
    const offers = {
      data: [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0,
        totalPages: 0
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
router.get('/offers/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `offer:${id}`;
    
    const cached = req.cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // In production, fetch from subgraph
    const offer = null;

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

    // In production, call FarmerMarket.listLot()
    res.status(201).json({ 
      message: 'Lot listed for sale',
      offerId: Math.floor(Math.random() * 1000) 
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
    const { id } = req.params;

    // In production, call FarmerMarket.purchaseLot()
    res.json({ message: 'Purchase submitted to blockchain' });
  } catch (error) {
    console.error('Purchase error:', error);
    res.status(500).json({ error: 'Failed to purchase' });
  }
});

/**
 * POST /api/market/offers/:id/release
 * Release payment (validator only)
 */
router.post('/offers/:id/release', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // In production, call FarmerMarket.releasePayment()
    res.json({ message: 'Payment released' });
  } catch (error) {
    console.error('Release payment error:', error);
    res.status(500).json({ error: 'Failed to release payment' });
  }
});

/**
 * GET /api/market/payments
 * Get payment history
 */
router.get('/payments', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, farmer } = req.query;
    const cacheKey = `payments:${page}:${limit}:${farmer || 'all'}`;
    
    const cached = req.cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // In production, fetch from subgraph (includes net amounts)
    const payments = {
      data: [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0,
        totalPages: 0
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
