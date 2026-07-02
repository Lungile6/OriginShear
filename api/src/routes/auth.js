const express = require('express');
const { body, validationResult } = require('express-validator');
const { generateToken } = require('../middleware/auth');
const { ethers } = require('ethers');

const router = express.Router();

/**
 * POST /api/auth/login
 * Authenticate user via wallet signature
 */
router.post('/login', [
  body('wallet').isEthereumAddress().withMessage('Invalid wallet address'),
  body('signature').notEmpty().withMessage('Signature required'),
  body('message').notEmpty().withMessage('Message required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { wallet, signature, message } = req.body;

    // Verify signature
    const recoveredAddress = ethers.verifyMessage(message, signature);
    
    if (recoveredAddress.toLowerCase() !== wallet.toLowerCase()) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // In production, you would verify the user's role from the blockchain here
    // For now, we'll use a mock role
    const user = {
      wallet: wallet.toLowerCase(),
      role: 'FARMER', // This should be fetched from HarvestLedger contract
    };

    const token = generateToken(user);

    res.json({ token, user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

/**
 * POST /api/auth/verify
 * Verify JWT token
 */
router.post('/verify', (req, res) => {
  const token = req.headers.authorization?.substring(7);
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ valid: false, error: 'Invalid token' });
  }
});

/**
 * POST /api/auth/wallet-event
 * Lightweight hook for wallet connect UI events (clicked/success/failed)
 */
router.post('/wallet-event', [
  body('event')
    .isIn(['connect_clicked', 'connect_success', 'connect_failed'])
    .withMessage('Invalid wallet event'),
  body('wallet').optional().isEthereumAddress().withMessage('Invalid wallet address'),
  body('connector').optional().isString(),
  body('error').optional().isString(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { event, wallet, connector, error } = req.body;

  // This is intentionally simple: a server-side reaction point for connect events.
  console.log('[wallet-event]', {
    event,
    wallet: wallet?.toLowerCase?.() || null,
    connector: connector || null,
    error: error || null,
    at: new Date().toISOString(),
    ip: req.ip,
  });

  return res.json({ ok: true });
});

module.exports = router;
