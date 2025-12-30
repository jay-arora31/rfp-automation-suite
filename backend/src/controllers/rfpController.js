const rfpService = require('../services/rfpService');

/**
 * RFP Controller
 * Handles HTTP requests for RFP endpoints
 */
const rfpController = {
    /**
     * POST /api/rfp
     * Create RFP from natural language input
     */
    async create(req, res, next) {
        try {
            const { input } = req.body;

            const rfp = await rfpService.createFromNaturalLanguage(input);

            res.status(201).json(rfp);
        } catch (error) {
            next(error);
        }
    },

    /**
     * GET /api/rfp
     * List all RFPs
     */
    async list(req, res, next) {
        try {
            const { status, page, limit } = req.query;

            const result = await rfpService.findAll({
                status,
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 20,
            });

            res.json(result);
        } catch (error) {
            next(error);
        }
    },

    /**
     * GET /api/rfp/:id
     * Get single RFP with vendors and proposals
     */
    async getById(req, res, next) {
        try {
            const { id } = req.params;

            const rfp = await rfpService.findById(id);

            res.json(rfp);
        } catch (error) {
            next(error);
        }
    },

    /**
     * POST /api/rfp/:id/send
     * Send RFP to selected vendors via Gmail
     */
    async sendToVendors(req, res, next) {
        try {
            const { id } = req.params;
            const { vendorIds } = req.body;

            // First add vendors to RFP
            await rfpService.addVendors(id, vendorIds);

            // Get the Gmail service (will be implemented)
            const gmailService = require('../services/gmailService');

            // Send emails to vendors
            const results = await gmailService.sendRfpToVendors(id, vendorIds);

            res.json({
                success: true,
                message: `RFP sent to ${results.filter(r => r.status === 'sent').length} vendors`,
                results,
            });
        } catch (error) {
            next(error);
        }
    },
};

module.exports = rfpController;
