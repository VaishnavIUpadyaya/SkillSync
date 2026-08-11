const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

require('dotenv').config();

const app = express();

// ── Security & CORS ─────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://skill-sync-red.vercel.app'
  ],
  credentials: true
}));

app.use(express.json({ limit: '2mb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many login attempts, please try again later.',
  skip: () => process.env.NODE_ENV === 'test'
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ── Load Models ──────────────────────────────────────────────────────────────
require('./models/user');
require('./models/project');
require('./models/joinRequest');
require('./models/skillQuiz');
require('./models/Message');
require('./models/Notification');
require('./models/rating');
require('./models/Endorsement');
require('./models/roadmap');
require('./models/activity');

// ── Mount Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/ratings', require('./routes/ratings'));
app.use('/api/endorsements', require('./routes/endorsements'));
app.use('/api/verify', require('./routes/verify'));
app.use('/api/roadmap', require('./routes/roadmap'));
app.use('/api/activities', require('./routes/activities'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/notifications', require('./routes/notifications'));

// ── Health Check ────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    dbState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ── Global error handler (must be after all routes) ─────────────────────────
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[${new Date().toISOString()}] ERROR ${req.method} ${req.url}:`, err.message);
  }
  res.status(err.status || 500).json({
    msg: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

module.exports = app;
