const vendorService = require('../services/vendorService');

/**
 * Vendor Controller
 * Handles HTTP requests for vendor endpoints
 */
const vendorController = {
    /**
     * GET /api/vendors
     * List all vendors with optional filtering
     */
    async list(req, res, next) {
        try {
            const { category, search, page, limit } = req.query;

            const result = await vendorService.findAll({
                category,
                search,
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 20,
            });

            res.json(result);
        } catch (error) {
            next(error);
        }
    },

    /**
     * GET /api/vendors/:id
     * Get single vendor by ID
     */
    async getById(req, res, next) {
        try {
            const { id } = req.params;

            const vendor = await vendorService.findById(id);

            res.json(vendor);
        } catch (error) {
            next(error);
        }
    },

    /**
     * POST /api/vendors
     * Create a new vendor
     */
    async create(req, res, next) {
        try {
            const vendor = await vendorService.create(req.body);

            res.status(201).json(vendor);
        } catch (error) {
            next(error);
        }
    },

    /**
     * PUT /api/vendors/:id
     * Update vendor
     */
    async update(req, res, next) {
        try {
            const { id } = req.params;

            const vendor = await vendorService.update(id, req.body);

            res.json(vendor);
        } catch (error) {
            next(error);
        }
    },

    /**
     * DELETE /api/vendors/:id
     * Delete vendor
     */
    async delete(req, res, next) {
        try {
            const { id } = req.params;

            await vendorService.delete(id);

            res.status(204).send();
        } catch (error) {
            next(error);
        }
    },
};

module.exports = vendorController;
