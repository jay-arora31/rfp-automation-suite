const express = require('express');
const router = express.Router();
const { getPollingStatus, triggerPoll } = require('../jobs/emailPoller');
const gmailService = require('../services/gmailService');

/**
 * GET /api/email/status
 * Check email polling status and recent activity
 */
router.get('/status', async (req, res, next) => {
    try {
        const pollingStatus = getPollingStatus();
        const isConnected = await gmailService.isConnected();

        res.json({
            ...pollingStatus,
            gmailConnected: isConnected,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/email/poll
 * Manually trigger email polling
 */
router.post('/poll', async (req, res, next) => {
    try {
        const isConnected = await gmailService.isConnected();

        if (!isConnected) {
            return res.status(400).json({
                error: 'Gmail not connected',
                message: 'Please connect your Google account first',
            });
        }

        const result = await triggerPoll();
        res.json(result);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
