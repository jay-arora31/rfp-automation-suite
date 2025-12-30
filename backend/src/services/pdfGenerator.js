const PDFDocument = require('pdfkit');

/**
 * PDF Generator Service
 * Creates professional invoice-style PDF documents for RFPs
 */
const pdfGenerator = {
    /**
     * Generate RFP PDF document in invoice format
     * @param {Object} rfp - The RFP object
     * @returns {Promise<Buffer>} PDF as buffer
     */
    async generateRfpPdf(rfp) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: 'A4',
                    margin: 50,
                    autoFirstPage: true,
                });

                const chunks = [];
                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                // Colors
                const purple = '#7c3aed';
                const darkText = '#111827';
                const grayText = '#6b7280';
                const lightGray = '#9ca3af';
                const border = '#e5e7eb';
                const bgLight = '#f9fafb';

                const pageWidth = doc.page.width;
                const marginLeft = 50;
                const contentWidth = pageWidth - 100;

                let y = 30;

                // ========== HEADER ==========
                // Purple accent line at top
                doc.rect(0, 0, pageWidth, 4).fill(purple);

                // Document title
                doc.fontSize(24)
                   .fillColor(darkText)
                   .font('Helvetica-Bold')
                   .text('Request for Proposal', marginLeft, y);

                // RFP Reference - right aligned
                doc.fontSize(10)
                   .fillColor(grayText)
                   .font('Helvetica')
                   .text(`RFP-${rfp.id}`, marginLeft, y, { width: contentWidth, align: 'right' });
                
                doc.fontSize(10)
                   .text(new Date().toLocaleDateString('en-US', { 
                       year: 'numeric', 
                       month: 'short', 
                       day: 'numeric' 
                   }), marginLeft, y + 15, { width: contentWidth, align: 'right' });

                y += 50;

                // Divider line
                doc.moveTo(marginLeft, y)
                   .lineTo(pageWidth - 50, y)
                   .strokeColor(border)
                   .lineWidth(1)
                   .stroke();

                y += 20;

                // ========== RFP TITLE ==========
                doc.fontSize(16)
                   .fillColor(darkText)
                   .font('Helvetica-Bold')
                   .text(rfp.title, marginLeft, y);

                y += 30;

                // ========== ITEMS TABLE ==========
                doc.fontSize(9)
                   .fillColor(lightGray)
                   .font('Helvetica-Bold')
                   .text('ITEMS', marginLeft, y);

                y += 15;

                const tableTop = y;
                const col1W = 180;
                const col2W = 50;
                const col3W = 180;
                const col4W = 80;
                const tableWidth = col1W + col2W + col3W + col4W;

                // Table header
                doc.rect(marginLeft, y, tableWidth, 25).fill(bgLight);

                doc.fontSize(8)
                   .fillColor(grayText)
                   .font('Helvetica-Bold');

                doc.text('ITEM', marginLeft + 10, y + 9);
                doc.text('QTY', marginLeft + col1W + 10, y + 9);
                doc.text('SPECIFICATIONS', marginLeft + col1W + col2W + 10, y + 9);
                doc.text('WARRANTY', marginLeft + col1W + col2W + col3W + 10, y + 9);

                y += 25;

                // Table rows
                const rowHeight = 35;
                if (rfp.items && rfp.items.length > 0) {
                    rfp.items.forEach((item) => {
                        // Item name
                        doc.fontSize(10)
                           .fillColor(darkText)
                           .font('Helvetica-Bold')
                           .text(item.name || '-', marginLeft + 10, y + 10, { width: col1W - 15 });

                        // Quantity
                        doc.fontSize(10)
                           .font('Helvetica')
                           .text(String(item.quantity || '-'), marginLeft + col1W + 10, y + 10);

                        // Specifications
                        const specs = item.specifications?.join(', ') || '-';
                        doc.fontSize(9)
                           .fillColor(grayText)
                           .text(specs, marginLeft + col1W + col2W + 10, y + 10, { width: col3W - 15 });

                        // Warranty
                        doc.fontSize(9)
                           .fillColor(purple)
                           .font('Helvetica-Bold')
                           .text(item.warranty || '-', marginLeft + col1W + col2W + col3W + 10, y + 10);

                        y += rowHeight;

                        // Row border
                        doc.moveTo(marginLeft, y)
                           .lineTo(marginLeft + tableWidth, y)
                           .strokeColor(border)
                           .stroke();
                    });
                }

                // Table border
                doc.rect(marginLeft, tableTop, tableWidth, y - tableTop)
                   .strokeColor(border)
                   .stroke();

                y += 25;

                // ========== TERMS ==========
                doc.fontSize(9)
                   .fillColor(lightGray)
                   .font('Helvetica-Bold')
                   .text('TERMS', marginLeft, y);

                y += 15;

                const terms = [];
                if (rfp.budget) terms.push(['Budget', `$${Number(rfp.budget).toLocaleString()} ${rfp.currency || 'USD'}`]);
                if (rfp.deliveryDays) terms.push(['Delivery', `${rfp.deliveryDays} days`]);
                if (rfp.paymentTerms) terms.push(['Payment', rfp.paymentTerms]);
                if (rfp.warrantyTerms) terms.push(['Warranty', rfp.warrantyTerms]);

                terms.forEach(([label, value]) => {
                    doc.fontSize(9)
                       .fillColor(grayText)
                       .font('Helvetica')
                       .text(label, marginLeft, y);

                    doc.fontSize(10)
                       .fillColor(darkText)
                       .font('Helvetica-Bold')
                       .text(value, marginLeft + 100, y);

                    y += 18;
                });

                y += 20;

                // Divider
                doc.moveTo(marginLeft, y)
                   .lineTo(pageWidth - 50, y)
                   .strokeColor(border)
                   .stroke();

                y += 20;

                // ========== HOW TO RESPOND ==========
                doc.fontSize(9)
                   .fillColor(lightGray)
                   .font('Helvetica-Bold')
                   .text('HOW TO RESPOND', marginLeft, y);

                y += 15;

                doc.fontSize(9)
                   .fillColor(grayText)
                   .font('Helvetica')
                   .text('Reply to the RFP email with: itemized pricing, delivery timeline, payment terms, and warranty details.', marginLeft, y, { width: contentWidth });

                y += 25;

                // Important note
                doc.rect(marginLeft, y, contentWidth, 28).fill(bgLight);

                doc.fontSize(9)
                   .fillColor(darkText)
                   .font('Helvetica')
                   .text('Include ', marginLeft + 12, y + 9, { continued: true })
                   .font('Helvetica-Bold')
                   .fillColor(purple)
                   .text(`[RFP-${rfp.id}]`, { continued: true })
                   .font('Helvetica')
                   .fillColor(darkText)
                   .text(' in your reply subject line.');

                // ========== FOOTER ==========
                doc.fontSize(8)
                   .fillColor(lightGray)
                   .font('Helvetica')
                   .text(`RFP-${rfp.id} | ${new Date().toLocaleDateString()}`, marginLeft, 780, { width: contentWidth, align: 'center' });

                // Finalize - single page only
                doc.end();

            } catch (error) {
                console.error('[PDF Generator] Error creating PDF:', error);
                reject(error);
            }
        });
    },
};

module.exports = pdfGenerator;
