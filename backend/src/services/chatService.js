const { openai } = require('../config/openai');
const { RFP_CHAT_PROMPT } = require('../utils/prompts');
const { prisma } = require('../config/database');

/**
 * Chat Service
 * Handles conversational RFP creation with multi-turn dialogue
 */
const chatService = {
    /**
     * Process a chat message and return AI response
     * @param {Array} messages - Conversation history from frontend
     * @returns {Object} AI response with message, status, and collected data
     */
    async processMessage(messages) {
        // Format messages for OpenAI
        const formattedMessages = [
            { role: 'system', content: RFP_CHAT_PROMPT },
            ...messages.map(msg => ({
                role: msg.role,
                content: msg.content,
            })),
        ];

        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: formattedMessages,
                response_format: { type: 'json_object' },
                max_tokens: 1500,
                temperature: 0.7,
            });

            let content = response.choices[0]?.message?.content;

            if (!content) {
                throw new Error('Empty response from AI');
            }

            // Clean content if it contains markdown code blocks
            if (content.includes('```json')) {
                content = content.replace(/```json\n?|\n?```/g, '');
            } else if (content.includes('```')) {
                content = content.replace(/```\n?|\n?```/g, '');
            }

            let parsed;
            try {
                parsed = JSON.parse(content);
            } catch (parseError) {
                console.error('[Chat Service] JSON Parse Error:', parseError.message);
                console.error('[Chat Service] Raw Content:', content);
                throw new Error('Failed to parse AI response');
            }

            // Ensure required fields exist
            return {
                message: parsed.message || "I'm sorry, I couldn't process that. Could you try again?",
                status: parsed.status || 'collecting',
                collectedData: parsed.collectedData || {},
                missingFields: parsed.missingFields || [],
                readyForPreview: parsed.readyForPreview || false,
            };
        } catch (error) {
            console.error('[Chat Service] Error:', error.message);
            throw error;
        }
    },

    /**
     * Create RFP from collected chat data
     * @param {Object} collectedData - Data collected through conversation
     * @returns {Object} Created RFP
     */
    async createRfpFromChat(collectedData) {
        // Generate raw input from collected data for auditing
        const rawInput = this.generateRawInput(collectedData);

        const rfp = await prisma.rfp.create({
            data: {
                title: collectedData.title || 'Untitled RFP',
                description: collectedData.description || null,
                rawInput,
                items: collectedData.items || [],
                budget: collectedData.budget || null,
                currency: collectedData.currency || 'USD',
                deliveryDays: collectedData.deliveryDays || null,
                paymentTerms: collectedData.paymentTerms || null,
                warrantyTerms: collectedData.warrantyTerms || null,
                additionalTerms: collectedData.additionalTerms || null,
                status: 'draft',
            },
        });

        return rfp;
    },

    /**
     * Generate a readable summary from collected data
     */
    generateRawInput(data) {
        const parts = [];

        if (data.items && data.items.length > 0) {
            const itemDescriptions = data.items.map(item => {
                let desc = `${item.quantity || 1}x ${item.name}`;
                if (item.specifications && item.specifications.length > 0) {
                    desc += ` (${item.specifications.join(', ')})`;
                }
                return desc;
            });
            parts.push(`Items: ${itemDescriptions.join('; ')}`);
        }

        if (data.budget) {
            parts.push(`Budget: $${data.budget} ${data.currency || 'USD'}`);
        }

        if (data.deliveryDays) {
            parts.push(`Delivery: ${data.deliveryDays} days`);
        }

        if (data.paymentTerms) {
            parts.push(`Payment Terms: ${data.paymentTerms}`);
        }

        if (data.warrantyTerms) {
            parts.push(`Warranty: ${data.warrantyTerms}`);
        }

        return parts.join('. ') || 'Created via chat';
    },
};

module.exports = chatService;
