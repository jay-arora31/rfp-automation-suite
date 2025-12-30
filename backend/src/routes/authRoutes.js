const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

/**
 * GET /api/auth/google
 * Initiate Google OAuth flow
 */
router.get('/google', authController.initiateOAuth);

/**
 * GET /api/auth/google/callback
 * Handle OAuth callback from Google
 */
router.get('/google/callback', authController.handleCallback);

/**
 * GET /api/auth/status
 * Check Gmail connection status
 */
router.get('/status', authController.getStatus);

/**
 * POST /api/auth/disconnect
 * Disconnect Gmail account
 */
router.post('/disconnect', authController.disconnect);

module.exports = router;
