const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const validateRequest = require('../middlewares/validateRequest');
const { vendorSchemas } = require('../utils/validators');

/**
 * GET /api/vendors
 * List all vendors with optional filtering
 */
router.get(
    '/',
    validateRequest(vendorSchemas.list),
    vendorController.list
);

/**
 * GET /api/vendors/:id
 * Get single vendor by ID
 */
router.get(
    '/:id',
    validateRequest(vendorSchemas.getById),
    vendorController.getById
);

/**
 * POST /api/vendors
 * Create a new vendor
 */
router.post(
    '/',
    validateRequest(vendorSchemas.create),
    vendorController.create
);

/**
 * PUT /api/vendors/:id
 * Update vendor
 */
router.put(
    '/:id',
    validateRequest(vendorSchemas.update),
    vendorController.update
);

/**
 * DELETE /api/vendors/:id
 * Delete vendor
 */
router.delete(
    '/:id',
    validateRequest(vendorSchemas.getById),
    vendorController.delete
);

module.exports = router;
