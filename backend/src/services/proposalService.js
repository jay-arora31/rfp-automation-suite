const { prisma } = require('../config/database');
const aiService = require('./aiService');

/**
 * Proposal Service
 * Business logic for proposal operations
 */
const proposalService = {
    /**
     * Get all proposals for an RFP
     */
    async findByRfpId(rfpId) {
        const rfp = await prisma.rfp.findUnique({
            where: { id: parseInt(rfpId) },
        });

        if (!rfp) {
            const error = new Error('RFP not found');
            error.statusCode = 404;
            throw error;
        }

        const proposals = await prisma.proposal.findMany({
            where: { rfpId: parseInt(rfpId) },
            include: {
                vendor: {
                    select: { id: true, name: true, email: true, company: true },
                },
                items: true,
            },
            orderBy: { aiScore: 'desc' },
        });

        return {
            rfpId,
            rfpTitle: rfp.title,
            proposals,
            total: proposals.length,
        };
    },

    /**
     * Get proposal by ID with full details
     */
    async findById(id) {
        const proposal = await prisma.proposal.findUnique({
            where: { id: parseInt(id) },
            include: {
                vendor: true,
                rfp: true,
                items: true,
            },
        });

        if (!proposal) {
            const error = new Error('Proposal not found');
            error.statusCode = 404;
            throw error;
        }

        return proposal;
    },

    /**
     * Create proposal from parsed email data
     * Called by email poller when vendor responds
     */
    async createFromEmail(rfpId, vendorId, emailContent, parsedData) {
        // Get RFP for context
        const rfp = await prisma.rfp.findUnique({
            where: { id: parseInt(rfpId) },
        });

        if (!rfp) {
            throw new Error('RFP not found');
        }

        let proposal = await prisma.proposal.findUnique({
            where: {
                rfpId_vendorId: {
                    rfpId: parseInt(rfpId),
                    vendorId: parseInt(vendorId),
                },
            },
        });

        // Track if this is a new proposal or update
        const isNewProposal = !proposal;

        const proposalData = {
            rawEmail: emailContent,
            parsedData,
            totalPrice: parsedData.totalPrice,
            currency: parsedData.currency || 'USD',
            deliveryDays: parsedData.deliveryDays,
            paymentTerms: parsedData.paymentTerms,
            warrantyTerms: parsedData.warrantyTerms,
            receivedAt: new Date(),
        };

        if (proposal) {
            // Update existing proposal
            console.log(`[Proposal Service] Updating existing proposal for RFP ${rfpId}, Vendor ${vendorId}`);
            proposal = await prisma.proposal.update({
                where: { id: proposal.id },
                data: proposalData,
            });
        } else {
            // Create new proposal
            proposal = await prisma.proposal.create({
                data: {
                    rfpId: parseInt(rfpId),
                    vendorId: parseInt(vendorId),
                    ...proposalData,
                },
            });
        }

        // Create/update proposal items
        if (parsedData.items && parsedData.items.length > 0) {
            // Delete existing items
            await prisma.proposalItem.deleteMany({
                where: { proposalId: proposal.id },
            });

            // Create new items with warranty per item
            const items = parsedData.items.map(item => ({
                proposalId: proposal.id,
                itemName: item.name,
                description: item.description,
                quantity: item.quantity || 1,
                unitPrice: item.unitPrice || 0,
                totalPrice: item.totalPrice || (item.unitPrice * item.quantity) || 0,
                specifications: item.specifications || [],
                warranty: item.warranty || null,
            }));

            await prisma.proposalItem.createMany({
                data: items,
            });
        }

        // Analyze proposal with AI
        const vendor = await prisma.vendor.findUnique({
            where: { id: parseInt(vendorId) },
        });

        const analysis = await aiService.analyzeProposal(
            { ...proposal, vendorName: vendor?.name },
            rfp
        );

        // Update with AI analysis
        proposal = await prisma.proposal.update({
            where: { id: proposal.id },
            data: {
                aiScore: analysis.score,
                aiSummary: analysis.summary,
                aiAnalysis: {
                    strengths: analysis.strengths,
                    weaknesses: analysis.weaknesses,
                    risks: analysis.risks,
                    priceAnalysis: analysis.priceAnalysis,
                    deliveryAnalysis: analysis.deliveryAnalysis,
                },
            },
        });

        // Update RfpVendor status to responded
        await prisma.rfpVendor.update({
            where: {
                rfpId_vendorId: {
                    rfpId: parseInt(rfpId),
                    vendorId: parseInt(vendorId),
                },
            },
            data: { status: 'responded' },
        });

        // Update RFP status to evaluating if it was sent
        if (rfp.status === 'sent') {
            await prisma.rfp.update({
                where: { id: parseInt(rfpId) },
                data: { status: 'evaluating' },
            });
        }

        return this.findById(proposal.id);
    },
};

module.exports = proposalService;
