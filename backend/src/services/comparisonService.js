const { prisma } = require('../config/database');
const aiService = require('./aiService');

/**
 * Comparison Service
 * AI-powered proposal comparison and recommendations with persistence
 */
const comparisonService = {
    /**
     * Get the latest saved comparison for an RFP
     */
    async getLatestComparison(rfpId) {
        const comparison = await prisma.rfpComparison.findFirst({
            where: { 
                rfpId: parseInt(rfpId),
                status: 'completed'
            },
            orderBy: { completedAt: 'desc' },
        });

        if (!comparison) {
            return null;
        }

        // Get RFP details
        const rfp = await prisma.rfp.findUnique({
            where: { id: parseInt(rfpId) },
        });

        return {
            id: comparison.id,
            rfpId: comparison.rfpId,
            rfpTitle: rfp?.title,
            status: comparison.status,
            proposalCount: comparison.proposalCount,
            comparison: comparison.comparisonData,
            completedAt: comparison.completedAt,
        };
    },

    /**
     * Get comparison status (for polling)
     */
    async getComparisonStatus(rfpId) {
        // Check for any pending/processing comparison
        const pendingComparison = await prisma.rfpComparison.findFirst({
            where: { 
                rfpId: parseInt(rfpId),
                status: { in: ['pending', 'processing'] }
            },
            orderBy: { createdAt: 'desc' },
        });

        if (pendingComparison) {
            return {
                id: pendingComparison.id,
                status: pendingComparison.status,
                startedAt: pendingComparison.startedAt,
            };
        }

        // Check for completed comparison
        const completedComparison = await prisma.rfpComparison.findFirst({
            where: { 
                rfpId: parseInt(rfpId),
                status: 'completed'
            },
            orderBy: { completedAt: 'desc' },
        });

        if (completedComparison) {
            return {
                id: completedComparison.id,
                status: 'completed',
                completedAt: completedComparison.completedAt,
            };
        }

        return { status: 'none' };
    },

    /**
     * Trigger a new comparison (runs in background)
     */
    async triggerComparison(rfpId) {
        const parsedRfpId = parseInt(rfpId);

        // Check if comparison is already in progress
        const existing = await prisma.rfpComparison.findFirst({
            where: { 
                rfpId: parsedRfpId,
                status: { in: ['pending', 'processing'] }
            },
        });

        if (existing) {
            return {
                id: existing.id,
                status: existing.status,
                message: 'Comparison already in progress',
            };
        }

        // Get proposal count
        const proposalCount = await prisma.proposal.count({
            where: { rfpId: parsedRfpId },
        });

        if (proposalCount < 1) {
            return {
                status: 'error',
                message: 'No proposals to compare',
            };
        }

        // Create new comparison record
        const comparison = await prisma.rfpComparison.create({
            data: {
                rfpId: parsedRfpId,
                status: 'pending',
                proposalCount,
            },
        });

        // Run comparison in background (don't await)
        this.runComparisonInBackground(comparison.id, parsedRfpId);

        return {
            id: comparison.id,
            status: 'pending',
            message: 'Comparison started',
        };
    },

    /**
     * Run comparison in background and save results
     */
    async runComparisonInBackground(comparisonId, rfpId) {
        try {
            // Update status to processing
            await prisma.rfpComparison.update({
                where: { id: comparisonId },
                data: { status: 'processing' },
            });

            console.log(`[Comparison] Starting comparison ${comparisonId} for RFP ${rfpId}`);

            // Run the actual comparison
            const result = await this.compareProposals(rfpId);

            // Save results
            await prisma.rfpComparison.update({
                where: { id: comparisonId },
                data: {
                    status: 'completed',
                    comparisonData: result.comparison,
                    completedAt: new Date(),
                },
            });

            console.log(`[Comparison] Completed comparison ${comparisonId} for RFP ${rfpId}`);
        } catch (error) {
            console.error(`[Comparison] Failed comparison ${comparisonId}:`, error);

            // Save error
            await prisma.rfpComparison.update({
                where: { id: comparisonId },
                data: {
                    status: 'failed',
                    error: error.message,
                    completedAt: new Date(),
                },
            });
        }
    },

    /**
     * Compare all proposals for an RFP and generate recommendations
     */
    async compareProposals(rfpId) {
        // Get RFP
        const rfp = await prisma.rfp.findUnique({
            where: { id: parseInt(rfpId) },
        });

        if (!rfp) {
            const error = new Error('RFP not found');
            error.statusCode = 404;
            throw error;
        }

        // Get all proposals for this RFP with items
        const proposals = await prisma.proposal.findMany({
            where: { rfpId: parseInt(rfpId) },
            include: {
                vendor: {
                    select: { id: true, name: true, email: true, company: true },
                },
                items: true,
            },
        });

        if (proposals.length === 0) {
            return {
                rfpId,
                rfpTitle: rfp.title,
                comparison: {
                    summary: 'No proposals received yet for this RFP.',
                    recommendation: null,
                    rankings: [],
                },
            };
        }

        if (proposals.length === 1) {
            // Only one proposal - no comparison needed
            const proposal = proposals[0];
            return {
                rfpId,
                rfpTitle: rfp.title,
                comparison: {
                    summary: `Only 1 proposal received from ${proposal.vendor?.name || 'Unknown Vendor'}.`,
                    recommendation: {
                        vendorId: proposal.vendorId,
                        vendorName: proposal.vendor?.name,
                        reason: 'Only proposal received',
                        confidence: 0.5,
                    },
                    rankings: [
                        {
                            rank: 1,
                            vendorId: proposal.vendorId,
                            vendorName: proposal.vendor?.name,
                            totalPrice: proposal.totalPrice,
                            deliveryDays: proposal.deliveryDays,
                            warranty: proposal.warrantyTerms,
                            score: proposal.aiScore || 0.5,
                            reasoning: 'Only proposal received for this RFP.',
                            pros: proposal.aiAnalysis?.strengths || ['Submitted proposal'],
                            cons: proposal.aiAnalysis?.weaknesses || ['No other proposals to compare'],
                            items: proposal.items?.map(item => ({
                                name: item.itemName,
                                unitPrice: item.unitPrice,
                                quantity: item.quantity,
                                totalPrice: item.totalPrice,
                                warranty: item.warranty,
                            })) || [],
                        },
                    ],
                    criteria: {
                        priceWeight: 0.4,
                        deliveryWeight: 0.25,
                        warrantyWeight: 0.2,
                        completenessWeight: 0.15,
                    },
                },
            };
        }

        // Multiple proposals - use AI for comparison
        const comparison = await aiService.compareProposals(rfp, proposals);

        return {
            rfpId,
            rfpTitle: rfp.title,
            budget: rfp.budget,
            deliveryDays: rfp.deliveryDays,
            items: rfp.items,
            comparison: {
                summary: comparison.summary,
                recommendation: comparison.recommendation,
                rankings: comparison.rankings || [],
                comparisonNotes: comparison.comparisonNotes,
                riskAssessment: comparison.riskAssessment,
                criteria: {
                    priceWeight: 0.4,
                    deliveryWeight: 0.25,
                    warrantyWeight: 0.2,
                    completenessWeight: 0.15,
                },
            },
        };
    },
};

module.exports = comparisonService;
