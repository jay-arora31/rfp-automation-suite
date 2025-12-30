const express = require('express');
const router = express.Router();
const chatService = require('../services/chatService');

/**
 * POST /api/chat/rfp
 * Process a chat message for RFP creation
 * 
 * Body: { messages: [{ role: "user"|"assistant", content: "..." }] }
 * 
 * Response: { message, status, collectedData, missingFields, readyForPreview, rfp? }
 */
router.post('/rfp', async (req, res, next) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Messages array is required',
            });
        }

        // Process the conversation
        const response = await chatService.processMessage(messages);

        // If confirmed, create the RFP
        if (response.status === 'confirmed' && response.collectedData) {
            const rfp = await chatService.createRfpFromChat(response.collectedData);

            return res.status(201).json({
                ...response,
                message: `Great! Your RFP "${rfp.title}" has been created successfully! 🎉\n\nRFP ID: ${rfp.id}`,
                rfp: {
                    id: rfp.id,
                    title: rfp.title,
                    status: rfp.status,
                },
            });
        }

        res.json(response);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/chat/rfp/create
 * Manually create RFP from collected data (alternative to auto-create on confirm)
 */
router.post('/rfp/create', async (req, res, next) => {
    try {
        const { collectedData } = req.body;

        if (!collectedData || !collectedData.items || collectedData.items.length === 0) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Collected data with at least one item is required',
            });
        }

        const rfp = await chatService.createRfpFromChat(collectedData);

        res.status(201).json({
            success: true,
            message: 'RFP created successfully',
            rfp,
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
