const { prisma } = require('../config/database');
const aiService = require('./aiService');

/**
 * RFP Service
 * Business logic for RFP operations
 */
const rfpService = {
    /**
     * Create RFP from natural language input
     * Uses AI to parse and structure the RFP
     */
    async createFromNaturalLanguage(input) {
        // Use AI to parse natural language into structured RFP
        const parsedRfp = await aiService.parseNaturalLanguageToRFP(input);

        // Create RFP in database
        const rfp = await prisma.rfp.create({
            data: {
                title: parsedRfp.title,
                description: parsedRfp.description,
                rawInput: input,
                items: parsedRfp.items || [],
                budget: parsedRfp.budget,
                currency: parsedRfp.currency || 'USD',
                deliveryDays: parsedRfp.deliveryDays,
                paymentTerms: parsedRfp.paymentTerms,
                warrantyTerms: parsedRfp.warrantyTerms,
                additionalTerms: parsedRfp.additionalTerms,
                status: 'draft',
            },
        });

        return rfp;
    },

    /**
     * Get all RFPs with optional status filter
     */
    async findAll({ status, page = 1, limit = 20 }) {
        const where = {};

        if (status) {
            where.status = status;
        }

        const skip = (page - 1) * limit;

        const [rfps, total] = await Promise.all([
            prisma.rfp.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip,
                include: {
                    proposals: {
                        select: { id: true },
                    },
                },
            }),
            prisma.rfp.count({ where }),
        ]);

        // Add proposal count to each RFP
        const rfpsWithCount = rfps.map(rfp => ({
            ...rfp,
            proposalCount: rfp.proposals?.length || 0,
        }));

        return {
            rfps: rfpsWithCount,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    },

    /**
     * Get RFP by ID with vendors and proposals
     */
    async findById(id) {
        const rfp = await prisma.rfp.findUnique({
            where: { id: parseInt(id) },
            include: {
                rfpVendors: {
                    include: {
                        vendor: true,
                    },
                },
                proposals: {
                    include: {
                        vendor: true,
                        items: true, // Include proposal items for detailed view
                    },
                },
                awardedVendor: true, // Include awarded vendor info
            },
        });

        if (!rfp) {
            const error = new Error('RFP not found');
            error.statusCode = 404;
            throw error;
        }

        // Format vendors with their status and proposal info
        const vendorProposalMap = new Map();
        rfp.proposals?.forEach(p => {
            vendorProposalMap.set(p.vendorId, p.id);
        });

        const vendors = rfp.rfpVendors?.map(rv => ({
            id: rv.vendor.id,
            name: rv.vendor.name,
            email: rv.vendor.email,
            sentAt: rv.sentAt,
            status: rv.status,
            hasProposal: vendorProposalMap.has(rv.vendorId),
            proposalId: vendorProposalMap.get(rv.vendorId) || null,
            followUpCount: rv.followUpCount || 0,
            lastFollowUpAt: rv.lastFollowUpAt,
            missingFields: rv.missingFields || [],
        })) || [];

        return {
            ...rfp,
            vendors,
            proposalCount: rfp.proposals?.length || 0,
        };
    },

    /**
     * Add vendors to RFP (for sending later)
     */
    async addVendors(rfpId, vendorIds) {
        const rfp = await prisma.rfp.findUnique({
            where: { id: parseInt(rfpId) },
        });

        if (!rfp) {
            const error = new Error('RFP not found');
            error.statusCode = 404;
            throw error;
        }

        // Create RfpVendor entries (upsert to handle duplicates)
        for (const vendorId of vendorIds) {
            await prisma.rfpVendor.upsert({
                where: {
                    rfpId_vendorId: {
                        rfpId: parseInt(rfpId),
                        vendorId: parseInt(vendorId),
                    },
                },
                update: {},
                create: {
                    rfpId: parseInt(rfpId),
                    vendorId: parseInt(vendorId),
                    status: 'pending',
                },
            });
        }

        return this.findById(rfpId);
    },

    /**
     * Update RFP status
     */
    async updateStatus(id, status) {
        try {
            const rfp = await prisma.rfp.update({
                where: { id: parseInt(id) },
                data: { status },
            });
            return rfp;
        } catch (error) {
            if (error.code === 'P2025') {
                const notFoundError = new Error('RFP not found');
                notFoundError.statusCode = 404;
                throw notFoundError;
            }
            throw error;
        }
    },

    /**
     * Get RfpVendor entries for an RFP
     */
    async getRfpVendors(rfpId) {
        return prisma.rfpVendor.findMany({
            where: { rfpId: parseInt(rfpId) },
            include: { vendor: true },
        });
    },

    /**
     * Update RfpVendor status after sending email
     */
    async updateRfpVendorStatus(rfpId, vendorId, { status, sentAt, emailMessageId }) {
        try {
            const rfpVendor = await prisma.rfpVendor.update({
                where: {
                    rfpId_vendorId: {
                        rfpId: parseInt(rfpId),
                        vendorId: parseInt(vendorId),
                    },
                },
                data: {
                    status,
                    sentAt,
                    emailMessageId,
                },
            });
            return rfpVendor;
        } catch (error) {
            if (error.code === 'P2025') {
                const notFoundError = new Error('RFP-Vendor relationship not found');
                notFoundError.statusCode = 404;
                throw notFoundError;
            }
            throw error;
        }
    },
};

module.exports = rfpService;
