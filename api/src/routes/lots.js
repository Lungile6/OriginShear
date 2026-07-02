const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/lots
 * Get lots with pagination and filtering
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, farmer } = req.query;
    const cacheKey = `lots:${page}:${limit}:${status || 'all'}:${farmer || 'all'}`;
    
    // Check cache first
    const cached = req.cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // In production, fetch from The Graph subgraph or blockchain
    // For now, return mock data
    const lots = {
      data: [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0,
        totalPages: 0
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
    const cacheKey = `lot:${id}`;
    
    const cached = req.cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // In production, fetch from blockchain or subgraph
    const lot = null;

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

    // In production, this would call the smart contract via ethers.js
    // For now, return a success response
    res.status(201).json({ 
      message: 'Lot registration submitted to blockchain',
      lotId: Math.floor(Math.random() * 1000) 
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
router.put('/:id/validate', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { approve } = req.body;

    if (typeof approve !== 'boolean') {
      return res.status(400).json({ error: 'approve must be boolean' });
    }

    // In production, call HarvestLedger.validateLot()
    res.json({ message: `Lot ${id} ${approve ? 'approved' : 'rejected'}` });
  } catch (error) {
    console.error('Validate lot error:', error);
    res.status(500).json({ error: 'Failed to validate lot' });
  }
});

module.exports = router;
