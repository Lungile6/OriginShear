const express = require('express');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const { generateToken, verifyToken } = require('../middleware/auth');
const { ethers } = require('ethers');
const onchainRoles = require('../lib/onchainRoles');

const router = express.Router();
const CHALLENGE_TTL_SECONDS = Number(process.env.AUTH_CHALLENGE_TTL_SECONDS || 300);

function isOnchainRoleResolutionEnabled() {
  return process.env.ENABLE_ONCHAIN_ROLE_RESOLUTION === 'true';
}

function challengeCacheKey(wallet) {
  return `auth:challenge:${wallet.toLowerCase()}`;
}

function buildChallengeMessage({ wallet, nonce, issuedAt, expiresAt }) {
  return [
    'ORIGINSHEAR Login',
    `Wallet: ${wallet.toLowerCase()}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
    `Expires At: ${expiresAt}`,
    '',
    'Sign this message to authenticate.',
  ].join('\n');
}

/**
 * POST /api/auth/challenge
 * Create a short-lived, one-time wallet signature challenge.
 */
router.post('/challenge', [
  body('wallet').isEthereumAddress().withMessage('Invalid wallet address'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const wallet = req.body.wallet.toLowerCase();
  const nonce = crypto.randomBytes(16).toString('hex');
  const issuedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_SECONDS * 1000).toISOString();
  const message = buildChallengeMessage({ wallet, nonce, issuedAt, expiresAt });

  req.cache.set(challengeCacheKey(wallet), {
    nonce,
    message,
    issuedAt,
    expiresAt,
  }, CHALLENGE_TTL_SECONDS);

  return res.json({
    wallet,
    nonce,
    message,
    issuedAt,
    expiresAt,
    expiresInSeconds: CHALLENGE_TTL_SECONDS,
  });
});

/**
 * POST /api/auth/login
 * Authenticate user via one-time challenge signature
 */
router.post('/login', [
  body('wallet').isEthereumAddress().withMessage('Invalid wallet address'),
  body('signature').notEmpty().withMessage('Signature required'),
  body('nonce').isString().isLength({ min: 16 }).withMessage('Nonce required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const wallet = req.body.wallet.toLowerCase();
    const { signature, nonce } = req.body;
    const cached = req.cache.get(challengeCacheKey(wallet));

    if (!cached) {
      return res.status(401).json({ error: 'Challenge expired or not found. Request a new challenge.' });
    }

    if (cached.nonce !== nonce) {
      return res.status(401).json({ error: 'Invalid nonce. Request a new challenge.' });
    }

    if (new Date(cached.expiresAt).getTime() <= Date.now()) {
      req.cache.del(challengeCacheKey(wallet));
      return res.status(401).json({ error: 'Challenge expired. Request a new challenge.' });
    }

    // Verify signature
    const recoveredAddress = ethers.verifyMessage(cached.message, signature);
    
    if (recoveredAddress.toLowerCase() !== wallet) {
      req.cache.del(challengeCacheKey(wallet));
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // One-time challenge: consume nonce after successful verification.
    req.cache.del(challengeCacheKey(wallet));

    const fallbackRoleClaims = {
      isFarmer: false,
      isValidator: false,
      isAdmin: false,
      isGovernment: false,
      roles: ['BUYER'],
      primaryRole: 'BUYER',
    };

    const roleClaims = isOnchainRoleResolutionEnabled() && onchainRoles.getWalletRoleClaims
      ? await onchainRoles.getWalletRoleClaims(wallet)
      : fallbackRoleClaims;

    const user = {
      wallet,
      role: roleClaims.primaryRole,
      roles: roleClaims.roles,
      isFarmer: roleClaims.isFarmer,
      isValidator: roleClaims.isValidator,
      isGovernment: roleClaims.isGovernment,
      isAdmin: roleClaims.isAdmin,
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
    const decoded = verifyToken(token);
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
