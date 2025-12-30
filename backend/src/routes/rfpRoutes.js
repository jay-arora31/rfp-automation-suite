const express = require('express');
const router = express.Router();
const rfpController = require('../controllers/rfpController');
const validateRequest = require('../middlewares/validateRequest');
const { rfpSchemas } = require('../utils/validators');

/**
 * POST /api/rfp
 * Create RFP from natural language
 */
router.post(
    '/',
    validateRequest(rfpSchemas.create),
    rfpController.create
);

/**
 * GET /api/rfp
 * List all RFPs
 */
router.get(
    '/',
    validateRequest(rfpSchemas.list),
    rfpController.list
);

/**
 * GET /api/rfp/:id
 * Get single RFP with vendors and proposals
 */
router.get(
    '/:id',
    validateRequest(rfpSchemas.getById),
    rfpController.getById
);

/**
 * POST /api/rfp/:id/send
 * Send RFP to selected vendors
 */
router.post(
    '/:id/send',
    validateRequest(rfpSchemas.send),
    rfpController.sendToVendors
);

/**
 * GET /api/rfp/:id/proposals
 * Get all proposals for an RFP
 */
router.get(
    '/:id/proposals',
    validateRequest(rfpSchemas.getById),
    async (req, res, next) => {
        try {
            const proposalService = require('../services/proposalService');
            const result = await proposalService.findByRfpId(req.params.id);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/rfp/:id/comparison
 * Get latest saved comparison for an RFP
 */
router.get(
    '/:id/comparison',
    validateRequest(rfpSchemas.getById),
    async (req, res, next) => {
        try {
            const comparisonService = require('../services/comparisonService');
            const result = await comparisonService.getLatestComparison(req.params.id);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/rfp/:id/comparison/status
 * Get comparison status (for polling)
 */
router.get(
    '/:id/comparison/status',
    validateRequest(rfpSchemas.getById),
    async (req, res, next) => {
        try {
            const comparisonService = require('../services/comparisonService');
            const result = await comparisonService.getComparisonStatus(req.params.id);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/rfp/:id/comparison/trigger
 * Trigger a new comparison (runs in background)
 */
router.post(
    '/:id/comparison/trigger',
    validateRequest(rfpSchemas.getById),
    async (req, res, next) => {
        try {
            const comparisonService = require('../services/comparisonService');
            const result = await comparisonService.triggerComparison(req.params.id);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/rfp/:id/compare
 * Legacy: Get AI-powered comparison of proposals (runs synchronously)
 */
router.get(
    '/:id/compare',
    validateRequest(rfpSchemas.getById),
    async (req, res, next) => {
        try {
            const comparisonService = require('../services/comparisonService');
            const result = await comparisonService.compareProposals(req.params.id);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/rfp/:id/award
 * Award RFP to a specific vendor
 */
router.post(
    '/:id/award',
    async (req, res, next) => {
        try {
            const { prisma } = require('../config/database');
            const { vendorId } = req.body;
            const rfpId = parseInt(req.params.id);

            if (!vendorId) {
                return res.status(400).json({ error: 'vendorId is required' });
            }

            // Verify vendor exists and has a proposal for this RFP
            const proposal = await prisma.proposal.findFirst({
                where: {
                    rfpId,
                    vendorId: parseInt(vendorId),
                },
                include: {
                    vendor: true,
                },
            });

            if (!proposal) {
                return res.status(404).json({ error: 'Vendor has no proposal for this RFP' });
            }

            // Update RFP status and awarded vendor
            const updatedRfp = await prisma.rfp.update({
                where: { id: rfpId },
                data: {
                    status: 'awarded',
                    awardedVendorId: parseInt(vendorId),
                    awardedAt: new Date(),
                },
                include: {
                    awardedVendor: true,
                },
            });

            res.json({
                success: true,
                message: `RFP awarded to ${proposal.vendor.name}`,
                rfp: {
                    id: updatedRfp.id,
                    status: updatedRfp.status,
                    awardedVendorId: updatedRfp.awardedVendorId,
                    awardedAt: updatedRfp.awardedAt,
                    awardedVendor: updatedRfp.awardedVendor,
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
