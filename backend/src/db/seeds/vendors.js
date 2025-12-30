const { prisma } = require('../../config/database');

async function seedVendors() {
    console.log('🌱 Seeding vendors...');

    const vendors = [
        {
            name: 'TechSupply Inc',
            email: 'sales@techsupply.com',
            company: 'TechSupply Inc',
            phone: '+1-555-0101',
            category: 'IT Equipment',
            address: '123 Tech Street, Silicon Valley, CA 94025',
            notes: 'Reliable supplier for laptops and computer hardware',
        },
        {
            name: 'Office Essentials',
            email: 'orders@officeessentials.com',
            company: 'Office Essentials LLC',
            phone: '+1-555-0102',
            category: 'Office Supplies',
            address: '456 Business Ave, New York, NY 10001',
            notes: 'Wide range of office furniture and supplies',
        },
        {
            name: 'Global Electronics',
            email: 'procurement@globalelectronics.com',
            company: 'Global Electronics Corp',
            phone: '+1-555-0103',
            category: 'IT Equipment',
            address: '789 Innovation Blvd, Austin, TX 78701',
            notes: 'Competitive pricing on bulk electronics orders',
        },
    ];

    for (const vendor of vendors) {
        await prisma.vendor.upsert({
            where: { email: vendor.email },
            update: vendor,
            create: vendor,
        });
    }

    console.log(`✅ Seeded ${vendors.length} vendors`);
}

// Run if called directly
if (require.main === module) {
    seedVendors()
        .then(() => {
            console.log('✅ Seeding complete');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Seeding failed:', error);
            process.exit(1);
        });
}

module.exports = seedVendors;
