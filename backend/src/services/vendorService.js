const { prisma } = require('../config/database');

/**
 * Vendor Service
 * Business logic for vendor CRUD operations
 */
const vendorService = {
    /**
     * Create a new vendor
     */
    async create(vendorData) {
        const vendor = await prisma.vendor.create({
            data: vendorData,
        });
        return vendor;
    },

    /**
     * Get all vendors with optional filtering
     */
    async findAll({ category, search, page = 1, limit = 20 }) {
        const where = {};

        if (category) {
            where.category = category;
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { company: { contains: search, mode: 'insensitive' } },
            ];
        }

        const skip = (page - 1) * limit;

        const [vendors, total] = await Promise.all([
            prisma.vendor.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip,
            }),
            prisma.vendor.count({ where }),
        ]);

        return {
            vendors,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    },

    /**
     * Get vendor by ID
     */
    async findById(id) {
        const vendor = await prisma.vendor.findUnique({
            where: { id: parseInt(id) },
        });

        if (!vendor) {
            const error = new Error('Vendor not found');
            error.statusCode = 404;
            throw error;
        }

        return vendor;
    },

    /**
     * Update vendor
     */
    async update(id, updateData) {
        try {
            const vendor = await prisma.vendor.update({
                where: { id: parseInt(id) },
                data: updateData,
            });
            return vendor;
        } catch (error) {
            if (error.code === 'P2025') {
                const notFoundError = new Error('Vendor not found');
                notFoundError.statusCode = 404;
                throw notFoundError;
            }
            throw error;
        }
    },

    /**
     * Delete vendor
     */
    async delete(id) {
        try {
            const vendorId = parseInt(id);

            // Use transaction to ensure clean cleanup
            await prisma.$transaction(async (tx) => {
                // 1. Find all proposals by this vendor
                const proposals = await tx.proposal.findMany({
                    where: { vendorId: vendorId },
                    select: { id: true }
                });

                const proposalIds = proposals.map(p => p.id);

                // 2. Delete Proposal Items linked to those proposals
                if (proposalIds.length > 0) {
                    await tx.proposalItem.deleteMany({
                        where: { proposalId: { in: proposalIds } }
                    });

                    // 3. Delete Proposals
                    await tx.proposal.deleteMany({
                        where: { id: { in: proposalIds } }
                    });
                }

                // 4. Delete RfpVendor associations (Safe to do manually even if cascade exists)
                await tx.rfpVendor.deleteMany({
                    where: { vendorId: vendorId }
                });

                // 5. Delete the Vendor
                await tx.vendor.delete({
                    where: { id: vendorId },
                });
            });

            return true;
        } catch (error) {
            console.error('Delete vendor error:', error);
            if (error.code === 'P2025') {
                const notFoundError = new Error('Vendor not found');
                notFoundError.statusCode = 404;
                throw notFoundError;
            }
            throw error;
        }
    },

    /**
     * Get vendors by IDs
     */
    async findByIds(ids) {
        const vendors = await prisma.vendor.findMany({
            where: {
                id: { in: ids.map(id => parseInt(id)) },
            },
        });

        return vendors;
    },
};

module.exports = vendorService;
