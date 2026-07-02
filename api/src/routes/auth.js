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

module.exports = router;
