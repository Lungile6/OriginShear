const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/marks
 * Get marks with pagination and filtering
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, farmer, status } = req.query;
    const cacheKey = `marks:${page}:${limit}:${farmer || 'all'}:${status || 'all'}`;
    
    const cached = req.cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // In production, fetch from subgraph
    const marks = {
      data: [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0,
        totalPages: 0
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
 * GET /api/marks/:id
 * Get mark by ID
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `mark:${id}`;
    
    const cached = req.cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // In production, fetch from blockchain or subgraph
    const mark = null;

    if (!mark) {
      return res.status(404).json({ error: 'Mark not found' });
    }

    req.cache.set(cacheKey, mark);
    res.json(mark);
  } catch (error) {
    console.error('Get mark error:', error);
    res.status(500).json({ error: 'Failed to fetch mark' });
  }
});

/**
 * GET /api/marks/farmer/:wallet
 * Get all marks for a farmer
 */
router.get('/farmer/:wallet', authenticate, async (req, res) => {
  try {
    const { wallet } = req.params;
    const cacheKey = `farmer:${wallet}:marks`;
    
    const cached = req.cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // In production, fetch from subgraph
    const marks = [];

    req.cache.set(cacheKey, marks);
    res.json(marks);
  } catch (error) {
    console.error('Get farmer marks error:', error);
    res.status(500).json({ error: 'Failed to fetch farmer marks' });
  }
});

/**
 * POST /api/marks
 * Issue a new mark (government only)
 */
router.post('/', [
  authenticate,
  body('farmer').isEthereumAddress().withMessage('Invalid farmer address'),
  body('farmerId').notEmpty().withMessage('Farmer ID required'),
  body('markType').isIn(['0', '1', '2']).withMessage('Invalid mark type'),
  body('expiresAt').isInt({ min: Date.now() }).withMessage('Invalid expiry date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // In production, call IndustryMarkRegistry.issueMark()
    res.status(201).json({ 
      message: 'Mark issued successfully',
      markId: Math.floor(Math.random() * 1000) 
    });
  } catch (error) {
    console.error('Issue mark error:', error);
    res.status(500).json({ error: 'Failed to issue mark' });
  }
});

/**
 * PUT /api/marks/:id/revoke
 * Revoke a mark (government only)
 */
router.put('/:id/revoke', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // In production, call IndustryMarkRegistry.revokeMark()
    res.json({ message: 'Mark revoked successfully' });
  } catch (error) {
    console.error('Revoke mark error:', error);
    res.status(500).json({ error: 'Failed to revoke mark' });
  }
});

module.exports = router;
