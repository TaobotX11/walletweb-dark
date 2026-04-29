import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import routes from './routes';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

const ALLOWED_ORIGIN = '*';

// Security headers
app.use(helmet());

// CORS - only allow the wallet frontend
app.use(
  cors({
    origin: ALLOWED_ORIGIN,
    methods: ['GET', 'POST'],
  })
);

// Parse JSON bodies (for broadcast endpoint)
app.use(express.json({ limit: '100kb' }));

// Rate limiting: 60 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});
app.use('/api', limiter);

// Stricter rate limit for broadcast (5 per minute)
const broadcastLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many broadcast requests' },
});
app.use('/api/broadcast', broadcastLimiter);

// API routes
app.use('/api', routes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Wallet API running on port ${PORT}`);
});
