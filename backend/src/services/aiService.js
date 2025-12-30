const { callOpenAI } = require('../config/openai');
const {
    RFP_PARSING_PROMPT,
    VENDOR_RESPONSE_PARSING_PROMPT,
    PROPOSAL_ANALYSIS_PROMPT,
    PROPOSAL_COMPARISON_PROMPT,
} = require('../utils/prompts');

/**
 * AI Service
 * Handles all OpenAI API interactions for RFP processing
 */
const aiService = {
    /**
     * Parse natural language input into structured RFP data
     * @param {string} naturalLanguageInput - User's description of procurement needs
     * @returns {object} Structured RFP data
     */
    async parseNaturalLanguageToRFP(naturalLanguageInput) {
        console.log('[AI Service] Parsing natural language to RFP...');

        const result = await callOpenAI(
            RFP_PARSING_PROMPT,
            `Parse the following procurement request:\n\n${naturalLanguageInput}`,
            { maxTokens: 2000 }
        );

        // Validate required fields
        if (!result.title || !result.items) {
            throw new Error('AI failed to parse RFP correctly');
        }

        console.log('[AI Service] RFP parsed successfully:', result.title);
        return result;
    },

    /**
     * Parse vendor email response into structured proposal data
     * @param {string} emailContent - Raw email content from vendor
     * @param {object} rfpContext - RFP context for reference
     * @returns {object} Structured proposal data
     */
    async parseVendorResponse(emailContent, rfpContext = {}) {
        console.log('[AI Service] Parsing vendor response...');

        const contextInfo = rfpContext.title
            ? `\n\nRFP Context: ${rfpContext.title}\nItems requested: ${JSON.stringify(rfpContext.items)}`
            : '';

        const result = await callOpenAI(
            VENDOR_RESPONSE_PARSING_PROMPT,
            `Parse the following vendor email response:${contextInfo}\n\n---\n\n${emailContent}`,
            { maxTokens: 2000 }
        );

        console.log('[AI Service] Vendor response parsed successfully');
        return result;
    },

    /**
     * Analyze a single proposal and generate score/summary
     * @param {object} proposal - Proposal data
     * @param {object} rfp - RFP data for context
     * @returns {object} Analysis with score, summary, strengths, weaknesses
     */
    async analyzeProposal(proposal, rfp) {
        console.log('[AI Service] Analyzing proposal...');

        const result = await callOpenAI(
            PROPOSAL_ANALYSIS_PROMPT,
            `Analyze this proposal against the RFP requirements:

RFP Requirements:
- Title: ${rfp.title}
- Budget: ${rfp.budget ? `$${rfp.budget}` : 'Not specified'}
- Items: ${JSON.stringify(rfp.items)}
- Delivery: ${rfp.deliveryDays ? `${rfp.deliveryDays} days` : 'Not specified'}
- Payment Terms: ${rfp.paymentTerms || 'Not specified'}
- Warranty: ${rfp.warrantyTerms || 'Not specified'}

Vendor Proposal:
- Vendor: ${proposal.vendorName || 'Unknown'}
- Total Price: $${proposal.totalPrice || 'Not specified'}
- Delivery: ${proposal.deliveryDays ? `${proposal.deliveryDays} days` : 'Not specified'}
- Items: ${JSON.stringify(proposal.items || proposal.parsedData?.items || [])}
- Payment Terms: ${proposal.paymentTerms || 'Not specified'}
- Warranty: ${proposal.warrantyTerms || 'Not specified'}`,
            { maxTokens: 1500 }
        );

        console.log('[AI Service] Proposal analyzed with score:', result.score);
        return result;
    },

    /**
     * Compare multiple proposals and generate recommendation
     * @param {object} rfp - RFP data
     * @param {array} proposals - Array of proposals to compare
     * @returns {object} Comparison with rankings and recommendation
     */
    async compareProposals(rfp, proposals) {
        console.log('[AI Service] Comparing', proposals.length, 'proposals...');

        const proposalSummaries = proposals.map((p, index) => ({
            id: p.id,
            vendorId: p.vendorId,
            vendorName: p.vendor?.name || `Vendor ${index + 1}`,
            totalPrice: p.totalPrice,
            deliveryDays: p.deliveryDays,
            paymentTerms: p.paymentTerms,
            warrantyTerms: p.warrantyTerms,
            items: p.items?.map(item => ({
                name: item.itemName,
                unitPrice: item.unitPrice,
                quantity: item.quantity,
                totalPrice: item.totalPrice,
                warranty: item.warranty,
            })) || p.parsedData?.items || [],
        }));

        const result = await callOpenAI(
            PROPOSAL_COMPARISON_PROMPT,
            `Compare these proposals for the RFP:

RFP Requirements:
- Title: ${rfp.title}
- Budget: ${rfp.budget ? `$${rfp.budget}` : 'Not specified'}
- Items Needed: ${JSON.stringify(rfp.items)}
- Required Delivery: ${rfp.deliveryDays ? `${rfp.deliveryDays} days` : 'Not specified'}
- Payment Terms: ${rfp.paymentTerms || 'Not specified'}
- Warranty Required: ${rfp.warrantyTerms || 'Not specified'}

Proposals to Compare:
${JSON.stringify(proposalSummaries, null, 2)}`,
            { maxTokens: 3500 }
        );

        console.log('[AI Service] Comparison complete. Recommended vendor:', result.recommendation?.vendorName);
        return result;
    },
};

module.exports = aiService;
