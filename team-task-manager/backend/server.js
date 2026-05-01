require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║         TaskFlow API Server           ║
  ╠═══════════════════════════════════════╣
  ║  Status  : Running ✅                 ║
  ║  Port    : ${PORT}                        ║
  ║  Env     : ${process.env.NODE_ENV || 'development'}              ║
  ╚═══════════════════════════════════════╝
  `);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => process.exit(0));
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});
