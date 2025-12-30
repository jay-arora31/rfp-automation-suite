const proposalService = require('../services/proposalService');

/**
 * Proposal Controller
 * Handles HTTP requests for proposal endpoints
 */
const proposalController = {
    /**
     * GET /api/proposals/:id
     * Get single proposal with full details
     */
    async getById(req, res, next) {
        try {
            const { id } = req.params;

            const proposal = await proposalService.findById(id);

            res.json(proposal);
        } catch (error) {
            next(error);
        }
    },
};

module.exports = proposalController;
