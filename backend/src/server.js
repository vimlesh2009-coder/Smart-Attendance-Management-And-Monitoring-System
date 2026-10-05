require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

// Cache the DB connection promise
let dbPromise = null;

const ensureDB = async () => {
  if (!dbPromise) {
    dbPromise = connectDB().catch((error) => {
      dbPromise = null;
      throw error;
    });
  }

  return dbPromise;
};

// Vercel / serverless handler
const handler = async (req, res) => {
  try {
    await ensureDB();
    return app(req, res);
  } catch (error) {
    console.error('Database / Server Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to connect to database',
      error:
        process.env.NODE_ENV === 'production'
          ? 'Database connection failed'
          : error.message,
    });
  }
};

// Local development
if (require.main === module) {
  ensureDB()
    .then(() => {
      const server = app.listen(PORT, () => {
        logger.info(
          `Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
        );
        logger.info(`API available at http://localhost:${PORT}/api`);
        logger.info(`Health check: http://localhost:${PORT}/health`);
      });

      const shutdown = (signal) => {
        logger.info(`${signal} received — shutting down gracefully`);

        server.close(() => {
          logger.info('HTTP server closed');
          process.exit(0);
        });

        setTimeout(() => {
          logger.error('Forced shutdown after timeout');
          process.exit(1);
        }, 10000);
      };

      process.on('SIGTERM', () => shutdown('SIGTERM'));
      process.on('SIGINT', () => shutdown('SIGINT'));

      process.on('unhandledRejection', (reason) => {
        logger.error(`Unhandled Rejection: ${reason}`);
      });

      process.on('uncaughtException', (error) => {
        logger.error(`Uncaught Exception: ${error.message}`);
        process.exit(1);
      });
    })
    .catch((error) => {
      logger.error(`Failed to start server: ${error.message}`);
      process.exit(1);
    });
}

module.exports = handler;