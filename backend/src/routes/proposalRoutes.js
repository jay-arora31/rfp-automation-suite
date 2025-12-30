const express = require('express');
const router = express.Router();
const proposalController = require('../controllers/proposalController');
const validateRequest = require('../middlewares/validateRequest');
const { proposalSchemas } = require('../utils/validators');

/**
 * GET /api/proposals/:id
 * Get single proposal with full details
 */
router.get(
    '/:id',
    validateRequest(proposalSchemas.getById),
    proposalController.getById
);

module.exports = router;
