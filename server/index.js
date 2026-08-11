const http = require('http');
const mongoose = require('mongoose');
const { initSocket } = require('./socket');
const app = require('./app');

require('dotenv').config();

// ── Fail fast if critical env vars are missing ──────────────────────────────
const REQUIRED_ENV = ['JWT_SECRET', 'MONGO_URI', 'PORT'];
const missingEnv = REQUIRED_ENV.filter(k => !process.env[k]);
if (missingEnv.length > 0) {
  console.error(`\n❌  Missing required environment variables: ${missingEnv.join(', ')}`);
  console.error('   Create a .env file. See .env.example for reference.\n');
  process.exit(1);
}

const server = http.createServer(app);
initSocket(server);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅  MongoDB connected');
    server.listen(process.env.PORT, () =>
      console.log(`🚀  Server running on port ${process.env.PORT}`)
    );
  })
  .catch(err => {
    console.error('❌  MongoDB connection failed:', err.message);
    process.exit(1);
  });