require('dotenv').config();
const app = require('./src/app');
const config = require('./src/config');
const { prisma, testConnection } = require('./src/config/database');

const startServer = async () => {
    try {
        // Test database connection
        await testConnection();

        // Prisma is already connected via testConnection
        console.log('Prisma Client ready');

        // Start email polling job
        if (config.emailPolling.enabled) {
            const startEmailPoller = require('./src/jobs/emailPoller');
            startEmailPoller();
            console.log(`Email polling started (every ${config.emailPolling.intervalMinutes} minutes)`);
        }

        // Start the server
        app.listen(config.port, () => {
            console.log(`\nServer running on ${config.backendUrl}`);
            console.log(`API documentation: ${config.backendUrl}/api`);
            console.log(`Health check: ${config.backendUrl}/health`);
            console.log(`Environment: ${config.nodeEnv}\n`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
    process.exit(1);
});

startServer();
