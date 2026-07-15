require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache');

const authRoutes = require('./routes/auth');
const lotRoutes = require('./routes/lots');
const farmerRoutes = require('./routes/farmers');
const marketRoutes = require('./routes/market');
const markRoutes = require('./routes/marks');
const newsRoutes = require("./routes/news");
const ipfsRoutes = require("./routes/ipfs");

const app = express();

// Security middleware
app.use(helmet());

function resolveCorsOrigin(origin, callback) {
  const configured = (process.env.FRONTEND_URL || "http://localhost:5173")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

  // Dev: Vite may hop to 5174/5175 if 5173 is busy; also allow LAN preview hosts.
  const isLocalVite =
    typeof origin === "string" &&
    /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+):(5173|5174|5175)$/.test(
      origin
    );

  if (!origin || configured.includes(origin) || isLocalVite) {
    return callback(null, true);
  }
  return callback(new Error(`CORS blocked for origin: ${origin}`));
}

app.use(
  cors({
    origin: resolveCorsOrigin,
    credentials: true,
  })
);
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Rate limiting - optimized for 2G/3G networks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  }
});

app.use('/api', limiter);

// Cache for frequently accessed data
const cache = new NodeCache({ stdTTL: 300 }); // 5 minute cache

// Make cache available to routes
app.use((req, res, next) => {
  req.cache = cache;
  next();
});

// Health check endpoint (no rate limiting)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/lots', lotRoutes);
app.use('/api/farmers', farmerRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/marks', markRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/ipfs", ipfsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`ORIGINSHEAR API running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

module.exports = app;
