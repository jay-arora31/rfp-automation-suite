const express = require('express');
const router = express.Router();

// Import route modules
const vendorRoutes = require('./vendorRoutes');
const rfpRoutes = require('./rfpRoutes');
const authRoutes = require('./authRoutes');
const proposalRoutes = require('./proposalRoutes');
const emailRoutes = require('./emailRoutes');
const chatRoutes = require('./chatRoutes');

// Mount routes
router.use('/vendors', vendorRoutes);
router.use('/rfp', rfpRoutes);
router.use('/auth', authRoutes);
router.use('/proposals', proposalRoutes);
router.use('/email', emailRoutes);
router.use('/chat', chatRoutes);

// API info endpoint
router.get('/', (req, res) => {
    res.json({
        name: 'RFP Management API',
        version: '1.0.0',
        endpoints: {
            vendors: '/api/vendors',
            rfp: '/api/rfp',
            auth: '/api/auth',
            proposals: '/api/proposals',
            email: '/api/email',
            chat: '/api/chat',
        },
    });
});

module.exports = router;

