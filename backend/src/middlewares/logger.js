const morgan = require('morgan');

/**
 * Request logging middleware
 * Uses 'dev' format in development, 'combined' in production
 */
const requestLogger = morgan(
    process.env.NODE_ENV === 'development' ? 'dev' : 'combined'
);

module.exports = requestLogger;
