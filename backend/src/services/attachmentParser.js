const mammoth = require('mammoth');
const xlsx = require('xlsx');

/**
 * Attachment Parser Service
 * Extracts text content from various file formats
 */
const attachmentParser = {
    /**
     * Supported file extensions
     */
    supportedExtensions: ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'csv', 'txt'],

    /**
     * Check if file type is supported
     */
    isSupported(filename) {
        const ext = this.getExtension(filename);
        return this.supportedExtensions.includes(ext);
    },

    /**
     * Get file extension from filename
     */
    getExtension(filename) {
        if (!filename) return '';
        const parts = filename.split('.');
        return parts.length > 1 ? parts.pop().toLowerCase() : '';
    },

    /**
     * Main parser - routes to correct parser based on file type
     * @param {Buffer} buffer - File content as buffer
     * @param {string} filename - Original filename
     * @returns {Promise<string>} Extracted text content
     */
    async parseAttachment(buffer, filename) {
        const ext = this.getExtension(filename);
        console.log(`[Attachment Parser] Parsing ${filename} (type: ${ext})`);

        try {
            switch (ext) {
                case 'pdf':
                    return await this.parsePdf(buffer);
                case 'docx':
                    return await this.parseDocx(buffer);
                case 'doc':
                    return await this.parseDoc(buffer);
                case 'xlsx':
                case 'xls':
                    return await this.parseExcel(buffer);
                case 'csv':
                    return await this.parseCsv(buffer);
                case 'txt':
                    return this.parseTxt(buffer);
                default:
                    console.log(`[Attachment Parser] Unsupported file type: ${ext}`);
                    return null;
            }
        } catch (error) {
            console.error(`[Attachment Parser] Error parsing ${filename}:`, error.message);
            return null;
        }
    },

    /**
     * Parse PDF files
     */
    async parsePdf(buffer) {
        try {
            // pdf-parse exports PDFParse as a class
            const pdfModule = require('pdf-parse');
            const parser = new pdfModule.PDFParse({ data: buffer });
            await parser.load();
            const result = await parser.getText();
            
            const text = result.text || '';
            const numPages = result.total || 1;
            
            console.log(`[Attachment Parser] PDF parsed: ${numPages} pages, ${text.length} chars`);
            return text;
        } catch (error) {
            console.error('[Attachment Parser] PDF parse error:', error.message);
            throw error;
        }
    },

    /**
     * Parse DOCX files (Microsoft Word)
     */
    async parseDocx(buffer) {
        try {
            const result = await mammoth.extractRawText({ buffer });
            console.log(`[Attachment Parser] DOCX parsed: ${result.value.length} chars`);
            if (result.messages.length > 0) {
                console.log('[Attachment Parser] DOCX warnings:', result.messages);
            }
            return result.value;
        } catch (error) {
            console.error('[Attachment Parser] DOCX parse error:', error.message);
            throw error;
        }
    },

    /**
     * Parse DOC files (older Word format)
     * Note: mammoth doesn't support .doc, so we'll try basic extraction
     */
    async parseDoc(buffer) {
        // DOC files are binary and harder to parse without specialized libraries
        // For now, we'll try to extract any readable text
        console.log('[Attachment Parser] DOC format has limited support, attempting basic extraction');
        try {
            // Try to find readable text in the binary
            const text = buffer.toString('utf-8');
            // Filter out non-printable characters
            const readable = text.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
            return readable.length > 50 ? readable : null;
        } catch (error) {
            console.error('[Attachment Parser] DOC parse error:', error.message);
            return null;
        }
    },

    /**
     * Parse Excel files (XLSX, XLS)
     */
    async parseExcel(buffer) {
        try {
            const workbook = xlsx.read(buffer, { type: 'buffer' });
            let fullText = '';

            // Extract text from all sheets
            for (const sheetName of workbook.SheetNames) {
                const sheet = workbook.Sheets[sheetName];
                // Convert to CSV format for readability
                const csv = xlsx.utils.sheet_to_csv(sheet);
                fullText += `\n--- Sheet: ${sheetName} ---\n${csv}\n`;
            }

            console.log(`[Attachment Parser] Excel parsed: ${workbook.SheetNames.length} sheets, ${fullText.length} chars`);
            return fullText.trim();
        } catch (error) {
            console.error('[Attachment Parser] Excel parse error:', error.message);
            throw error;
        }
    },

    /**
     * Parse CSV files
     */
    async parseCsv(buffer) {
        try {
            // CSV is already text, just decode it
            const text = buffer.toString('utf-8');
            console.log(`[Attachment Parser] CSV parsed: ${text.length} chars`);
            return text;
        } catch (error) {
            console.error('[Attachment Parser] CSV parse error:', error.message);
            throw error;
        }
    },

    /**
     * Parse TXT files
     */
    parseTxt(buffer) {
        const text = buffer.toString('utf-8');
        console.log(`[Attachment Parser] TXT parsed: ${text.length} chars`);
        return text;
    },

    /**
     * Parse multiple attachments and combine their text
     * @param {Array} attachments - Array of { buffer, filename }
     * @returns {Promise<string>} Combined text from all attachments
     */
    async parseMultiple(attachments) {
        if (!attachments || attachments.length === 0) {
            return '';
        }

        const results = [];

        for (const attachment of attachments) {
            if (!this.isSupported(attachment.filename)) {
                console.log(`[Attachment Parser] Skipping unsupported file: ${attachment.filename}`);
                continue;
            }

            const text = await this.parseAttachment(attachment.buffer, attachment.filename);
            if (text) {
                results.push({
                    filename: attachment.filename,
                    text: text,
                });
            }
        }

        if (results.length === 0) {
            return '';
        }

        // Combine all attachment texts with headers
        const combined = results.map(r => 
            `\n=== Attachment: ${r.filename} ===\n${r.text}`
        ).join('\n');

        console.log(`[Attachment Parser] Combined ${results.length} attachments`);
        return combined;
    },
};

module.exports = attachmentParser;

