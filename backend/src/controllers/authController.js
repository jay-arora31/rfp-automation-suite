const gmailService = require('../services/gmailService');
const config = require('../config');

/**
 * Auth Controller
 * Handles Google OAuth authentication
 */
const authController = {
    /**
     * GET /api/auth/google
     * Redirect to Google OAuth consent screen
     */
    async initiateOAuth(req, res, next) {
        try {
            const authUrl = gmailService.getAuthUrl();
            res.redirect(authUrl);
        } catch (error) {
            next(error);
        }
    },

    /**
     * GET /api/auth/google/callback
     * Handle OAuth callback from Google
     */
    async handleCallback(req, res, next) {
        try {
            const { code } = req.query;

            if (!code) {
                return res.status(400).json({
                    error: 'Missing code',
                    message: 'Authorization code is required',
                });
            }

            const result = await gmailService.handleOAuthCallback(code);

            // Redirect to frontend with success
            const redirectUrl = `${config.frontendUrl}/settings?gmail=connected&email=${encodeURIComponent(result.email)}`;
            res.redirect(redirectUrl);
        } catch (error) {
            // Redirect to frontend with error
            const redirectUrl = `${config.frontendUrl}/settings?gmail=error&message=${encodeURIComponent(error.message)}`;
            res.redirect(redirectUrl);
        }
    },

    /**
     * GET /api/auth/status
     * Check if Gmail is connected
     */
    async getStatus(req, res, next) {
        try {
            const settings = await gmailService.getUserSettings();

            res.json({
                connected: !!(settings.googleRefreshToken && settings.connectedEmail),
                email: settings.connectedEmail,
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * POST /api/auth/disconnect
     * Disconnect Gmail account
     */
    async disconnect(req, res, next) {
        try {
            await gmailService.disconnect();

            res.json({
                success: true,
                message: 'Google account disconnected',
            });
        } catch (error) {
            next(error);
        }
    },
};

module.exports = authController;
