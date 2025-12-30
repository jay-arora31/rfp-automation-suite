const { createOAuth2Client, getAuthUrl, createGmailClient } = require('../config/google');
const { prisma } = require('../config/database');
const config = require('../config');
const attachmentParser = require('./attachmentParser');
const pdfGenerator = require('./pdfGenerator');

/**
 * Gmail Service
 * Handles Gmail API operations for sending RFPs and receiving responses
 */
const gmailService = {
    /**
     * Get or create user settings
     */
    async getUserSettings() {
        let settings = await prisma.userSettings.findFirst();

        if (!settings) {
            settings = await prisma.userSettings.create({ data: {} });
        }

        return settings;
    },

    /**
     * Check if Gmail is connected
     */
    async isConnected() {
        const settings = await this.getUserSettings();
        return !!(settings.googleRefreshToken && settings.connectedEmail);
    },

    /**
     * Get OAuth authorization URL
     */
    getAuthUrl() {
        const oauth2Client = createOAuth2Client();
        return getAuthUrl(oauth2Client);
    },

    /**
     * Handle OAuth callback and save tokens
     */
    async handleOAuthCallback(code) {
        const oauth2Client = createOAuth2Client();

        // Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Get user email
        const oauth2 = require('googleapis').google.oauth2({ version: 'v2', auth: oauth2Client });
        const { data: userInfo } = await oauth2.userinfo.get();

        // Save tokens to database
        const settings = await this.getUserSettings();
        await prisma.userSettings.update({
            where: { id: settings.id },
            data: {
                googleAccessToken: tokens.access_token,
                googleRefreshToken: tokens.refresh_token,
                googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
                connectedEmail: userInfo.email,
            },
        });

        return {
            email: userInfo.email,
            connected: true,
        };
    },

    /**
     * Get authenticated Gmail client
     */
    async getGmailClient() {
        const settings = await this.getUserSettings();

        if (!settings.googleRefreshToken) {
            const error = new Error('Gmail not connected. Please connect your Google account first.');
            error.statusCode = 400;
            throw error;
        }

        const oauth2Client = createOAuth2Client();
        oauth2Client.setCredentials({
            access_token: settings.googleAccessToken,
            refresh_token: settings.googleRefreshToken,
            expiry_date: settings.googleTokenExpiry?.getTime(),
        });

        // Refresh token if expired
        if (settings.googleTokenExpiry && new Date() > settings.googleTokenExpiry) {
            const { credentials } = await oauth2Client.refreshAccessToken();
            await prisma.userSettings.update({
                where: { id: settings.id },
                data: {
                    googleAccessToken: credentials.access_token,
                    googleTokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
                },
            });
            oauth2Client.setCredentials(credentials);
        }

        return createGmailClient(oauth2Client);
    },

    /**
     * Disconnect Gmail account
     */
    async disconnect() {
        const settings = await this.getUserSettings();
        await prisma.userSettings.update({
            where: { id: settings.id },
            data: {
                googleAccessToken: null,
                googleRefreshToken: null,
                googleTokenExpiry: null,
                connectedEmail: null,
            },
        });
        return { connected: false };
    },

    /**
     * Create email message in base64 format
     */
    createMessage(to, subject, body) {
        const message = [
            `To: ${to}`,
            `Subject: ${subject}`,
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=UTF-8',
            '',
            body,
        ].join('\n');

        return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
    },

    /**
     * Create email message with PDF attachment in MIME format
     * @param {string} to - Recipient email
     * @param {string} subject - Email subject
     * @param {string} body - HTML body content
     * @param {Buffer} pdfBuffer - PDF file as buffer
     * @param {string} pdfFilename - Filename for the PDF attachment
     * @returns {string} Base64 encoded MIME message
     */
    createMessageWithAttachment(to, subject, body, pdfBuffer, pdfFilename) {
        const boundary = `boundary_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        
        const messageParts = [
            `To: ${to}`,
            `Subject: ${subject}`,
            'MIME-Version: 1.0',
            `Content-Type: multipart/mixed; boundary="${boundary}"`,
            '',
            `--${boundary}`,
            'Content-Type: text/html; charset=UTF-8',
            'Content-Transfer-Encoding: 7bit',
            '',
            body,
            '',
            `--${boundary}`,
            'Content-Type: application/pdf',
            'Content-Transfer-Encoding: base64',
            `Content-Disposition: attachment; filename="${pdfFilename}"`,
            '',
            pdfBuffer.toString('base64'),
            '',
            `--${boundary}--`,
        ];

        const message = messageParts.join('\n');
        return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
    },

    /**
     * Create reply message in base64 format with proper threading headers
     */
    createReplyMessage(to, subject, body, originalMessageId) {
        // Gmail threading requires proper In-Reply-To and References headers
        // Format the messageId properly for RFC 822 compliance
        const formattedMessageId = originalMessageId.includes('@') 
            ? `<${originalMessageId}>` 
            : `<${originalMessageId}@mail.gmail.com>`;
        
        const message = [
            `To: ${to}`,
            `Subject: ${subject}`,
            `In-Reply-To: ${formattedMessageId}`,
            `References: ${formattedMessageId}`,
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=UTF-8',
            '',
            body,
        ].join('\n');

        return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
    },

    /**
     * Reply in the same email thread
     * Used for follow-up emails when vendor response is incomplete
     */
    async replyInThread({ threadId, messageId, to, subject, body }) {
        const gmail = await this.getGmailClient();

        try {
            // Create reply message with proper headers for threading
            const rawMessage = this.createReplyMessage(to, subject, body, messageId);

            // Send as reply in the same thread
            const response = await gmail.users.messages.send({
                userId: 'me',
                requestBody: {
                    raw: rawMessage,
                    threadId: threadId, // This keeps it in the same thread
                },
            });

            console.log(`[Gmail Service] Sent reply in thread ${threadId} to ${to}`);

            return {
                success: true,
                messageId: response.data.id,
                threadId: response.data.threadId,
            };
        } catch (error) {
            console.error(`[Gmail Service] Failed to send reply in thread:`, error.message);
            return {
                success: false,
                error: error.message,
            };
        }
    },

    /**
     * Generate HTML email body for follow-up on missing details
     */
    generateMissingDetailsEmailBody(vendorName, rfpTitle, missingFields) {
        const missingList = missingFields.map(field => `
            <li style="padding: 5px 0;">${field}</li>
        `).join('');

        return `
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <p>Hi ${vendorName},</p>
                    
                    <p>Thank you for your response to our RFP: <strong>"${rfpTitle}"</strong>.</p>
                    
                    <p>To complete your proposal evaluation, we need the following additional details:</p>
                    
                    <ul style="background-color: #f8f9fa; padding: 15px 15px 15px 35px; border-left: 4px solid #3498db; margin: 20px 0;">
                        ${missingList}
                    </ul>
                    
                    <p>Please reply to this email with the missing information at your earliest convenience.</p>
                    
                </body>
            </html>
        `;
    },

    /**
     * Send RFP to multiple vendors
     */
    async sendRfpToVendors(rfpId, vendorIds) {
        const gmail = await this.getGmailClient();
        const settings = await this.getUserSettings();

        // Get RFP
        const rfp = await prisma.rfp.findUnique({
            where: { id: parseInt(rfpId) },
        });
        if (!rfp) {
            throw new Error('RFP not found');
        }

        // Generate PDF for RFP (once, used for all vendors)
        console.log(`[Gmail Service] Generating PDF for RFP-${rfp.id}...`);
        const pdfBuffer = await pdfGenerator.generateRfpPdf(rfp);
        const pdfFilename = `RFP-${rfp.id}-${rfp.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)}.pdf`;
        console.log(`[Gmail Service] PDF generated: ${pdfFilename} (${pdfBuffer.length} bytes)`);

        // Get vendors
        const vendors = await prisma.vendor.findMany({
            where: { id: { in: vendorIds.map(id => parseInt(id)) } },
        });

        const results = [];

        for (const vendor of vendors) {
            try {
                const subject = `[RFP-${rfp.id}] ${rfp.title}`;
                const body = this.generateSimpleRfpEmailBody(rfp, vendor);
                const rawMessage = this.createMessageWithAttachment(
                    vendor.email,
                    subject,
                    body,
                    pdfBuffer,
                    pdfFilename
                );

                // Send email with PDF attachment
                const response = await gmail.users.messages.send({
                    userId: 'me',
                    requestBody: {
                        raw: rawMessage,
                    },
                });

                // Fetch the sent message to get the actual Message-ID header for threading
                let actualMessageId = response.data.id;
                try {
                    const sentMessage = await gmail.users.messages.get({
                        userId: 'me',
                        id: response.data.id,
                        format: 'metadata',
                        metadataHeaders: ['Message-ID'],
                    });
                    const messageIdHeader = sentMessage.data.payload?.headers?.find(
                        h => h.name.toLowerCase() === 'message-id'
                    );
                    if (messageIdHeader?.value) {
                        // Remove angle brackets if present, we'll add them in createReplyMessage
                        actualMessageId = messageIdHeader.value.replace(/^<|>$/g, '');
                    }
                } catch (e) {
                    console.log(`[Gmail Service] Could not fetch Message-ID header, using API ID`);
                }

                // Update RfpVendor status with both messageId and threadId
                await prisma.rfpVendor.update({
                    where: {
                        rfpId_vendorId: {
                            rfpId: parseInt(rfpId),
                            vendorId: vendor.id,
                        },
                    },
                    data: {
                        status: 'sent',
                        sentAt: new Date(),
                        emailMessageId: actualMessageId, // Store actual Message-ID for proper threading
                        emailThreadId: response.data.threadId, // Save thread ID for follow-up replies
                    },
                });

                console.log(`[Gmail Service] Sent RFP to ${vendor.email} with PDF attachment`);

                results.push({
                    vendorId: vendor.id,
                    status: 'sent',
                    messageId: response.data.id,
                    threadId: response.data.threadId,
                });
            } catch (error) {
                console.error(`Failed to send to ${vendor.email}:`, error.message);
                results.push({
                    vendorId: vendor.id,
                    status: 'failed',
                    error: error.message,
                });
            }
        }

        // Update RFP status to sent if at least one email was sent
        if (results.some(r => r.status === 'sent')) {
            await prisma.rfp.update({
                where: { id: parseInt(rfpId) },
                data: { status: 'sent' },
            });
        }

        return results;
    },

    /**
     * Generate HTML email body for RFP
     */
    generateRfpEmailBody(rfp, vendor) {
        const itemsList = rfp.items.map(item => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.description || '-'}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.quantity}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.specifications?.join(', ') || '-'}</td>
      </tr>
    `).join('');

        return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #2c3e50;">Request for Proposal: ${rfp.title}</h2>
          
          <p>Dear ${vendor.name},</p>
          
          <p>We are inviting you to submit a proposal for the following procurement requirement:</p>
          
          <h3 style="color: #34495e;">Description</h3>
          <p>${rfp.description || 'Please see the requirements below.'}</p>
          
          <h3 style="color: #34495e;">Items Required</h3>
          <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
            <thead>
              <tr style="background-color: #3498db; color: white;">
                <th style="padding: 10px; border: 1px solid #ddd;">Item</th>
                <th style="padding: 10px; border: 1px solid #ddd;">Description</th>
                <th style="padding: 10px; border: 1px solid #ddd;">Quantity</th>
                <th style="padding: 10px; border: 1px solid #ddd;">Specifications</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
            </tbody>
          </table>
          
          <h3 style="color: #34495e;">Terms & Requirements</h3>
          <ul>
            ${rfp.budget ? `<li><strong>Budget:</strong> $${rfp.budget} ${rfp.currency}</li>` : ''}
            ${rfp.deliveryDays ? `<li><strong>Delivery:</strong> Within ${rfp.deliveryDays} days</li>` : ''}
            ${rfp.paymentTerms ? `<li><strong>Payment Terms:</strong> ${rfp.paymentTerms}</li>` : ''}
            ${rfp.warrantyTerms ? `<li><strong>Warranty:</strong> ${rfp.warrantyTerms}</li>` : ''}
          </ul>
          
          ${rfp.additionalTerms ? `<p><strong>Additional Terms:</strong> ${rfp.additionalTerms}</p>` : ''}
          
          <h3 style="color: #34495e;">How to Respond</h3>
          <p>Please reply to this email with your proposal including:</p>
          <ul>
            <li>Itemized pricing for each item</li>
            <li>Total cost</li>
            <li>Delivery timeline</li>
            <li>Payment terms</li>
            <li>Warranty details</li>
            <li>Any additional terms or conditions</li>
          </ul>
          
          <p style="margin-top: 30px;">
            <strong>Important:</strong> Please keep the subject line "[RFP-${rfp.id}]" in your response for proper tracking.
          </p>
          
          <p style="margin-top: 20px;">We look forward to receiving your proposal.</p>
        </body>
      </html>
    `;
    },

    /**
     * Generate simplified HTML email body for RFP (with PDF attachment)
     * Clean, enterprise-level design with purple theme matching website
     */
    generateSimpleRfpEmailBody(rfp, vendor) {
        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);">
          
          <!-- Header with Purple Gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 40px;">
              <p style="margin: 0 0 8px 0; color: rgba(255,255,255,0.8); font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">Request for Proposal</p>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">RFP-${rfp.id}</h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Dear <strong style="color: #1f2937;">${vendor.name}</strong>,
              </p>
              
              <p style="margin: 0 0 28px 0; color: #374151; font-size: 16px; line-height: 1.7;">
                We are pleased to invite you to submit a proposal for the following procurement requirement:
              </p>
              
              <!-- RFP Title Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                <tr>
                  <td style="background-color: #faf5ff; border-left: 4px solid #7c3aed; border-radius: 0 8px 8px 0; padding: 24px;">
                    <h2 style="margin: 0; color: #1f2937; font-size: 20px; font-weight: 600;">${rfp.title}</h2>
                  </td>
                </tr>
              </table>
              
              <!-- PDF Attachment Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                <tr>
                  <td style="background: linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%); border-radius: 8px; padding: 20px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right: 12px; vertical-align: top;">
                          <div style="width: 24px; height: 24px; background: #f59e0b; border-radius: 50%; text-align: center; line-height: 24px; color: white; font-size: 14px;">!</div>
                        </td>
                        <td>
                          <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                            Please see the attached PDF for complete RFP details.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Response Instructions -->
              <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px; font-weight: 600;">How to Respond</p>
              <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 15px; line-height: 1.7;">
                Please reply to this email with your proposal including pricing per item, delivery timeline, payment terms, and warranty details.
              </p>
              
              <!-- Important Note with Purple Accent -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                <tr>
                  <td style="background-color: #f5f3ff; border-left: 3px solid #7c3aed; border-radius: 0 6px 6px 0; padding: 16px 20px;">
                    <p style="margin: 0; color: #5b21b6; font-size: 14px; line-height: 1.5;">
                      <strong>Important:</strong> Please include <code style="background: #ede9fe; padding: 3px 8px; border-radius: 4px; font-family: 'SF Mono', Monaco, monospace; color: #7c3aed; font-size: 13px;">[RFP-${rfp.id}]</code> in your reply subject line for tracking.
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.6;">
                We look forward to receiving your proposal.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
    },

    /**
     * Fetch unread emails matching RFP pattern
     * Called by email poller
     */
    async fetchRfpResponses() {
        const isConnected = await this.isConnected();
        if (!isConnected) {
            console.log('[Gmail Service] Not connected, skipping poll');
            return [];
        }

        const gmail = await this.getGmailClient();

        // Search for unread emails with [RFP-*] in subject
        const response = await gmail.users.messages.list({
            userId: 'me',
            q: 'is:unread subject:[RFP-',
            maxResults: 10,
        });

        if (!response.data.messages || response.data.messages.length === 0) {
            return [];
        }

        const emails = [];

        for (const message of response.data.messages) {
            try {
                // IMMEDIATELY mark as read FIRST to prevent re-polling
                try {
                    await gmail.users.messages.modify({
                        userId: 'me',
                        id: message.id,
                        requestBody: {
                            removeLabelIds: ['UNREAD'],
                        },
                    });
                    console.log(`[Gmail Service] Marked message ${message.id} as READ`);
                } catch (markError) {
                    console.error(`[Gmail Service] Failed to mark message ${message.id} as read:`, markError.message);
                    // Continue processing even if marking fails - we'll catch duplicates in emailPoller
                }

                const fullMessage = await gmail.users.messages.get({
                    userId: 'me',
                    id: message.id,
                    format: 'full',
                });

                const headers = fullMessage.data.payload.headers;
                const subject = headers.find(h => h.name === 'Subject')?.value || '';
                const from = headers.find(h => h.name === 'From')?.value || '';

                // Extract RFP ID from subject
                const rfpIdMatch = subject.match(/\[RFP-(\d+)\]/);
                if (!rfpIdMatch) {
                    console.log(`[Gmail Service] Skipping email - no RFP ID found in subject: ${subject}`);
                    continue;
                }

                const rfpId = parseInt(rfpIdMatch[1]);

                // Get email body
                const body = this.extractEmailBody(fullMessage.data.payload);

                // Extract and parse attachments (PDF, DOCX, XLSX, etc.)
                const attachmentText = await this.parseEmailAttachments(
                    gmail, 
                    message.id, 
                    fullMessage.data.payload
                );

                emails.push({
                    messageId: message.id,
                    rfpId,
                    from,
                    subject,
                    body,
                    attachmentText, // NEW: Extracted text from attachments
                });

                console.log(`[Gmail Service] Processed email for RFP-${rfpId} from ${from}${attachmentText ? ' (with attachments)' : ''}`);
            } catch (error) {
                console.error('[Gmail Service] Error processing email:', error.message);
            }
        }

        return emails;
    },

    /**
     * Extract email body from Gmail message payload
     */
    extractEmailBody(payload) {
        let body = '';

        if (payload.body && payload.body.data) {
            body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
        } else if (payload.parts) {
            for (const part of payload.parts) {
                if (part.mimeType === 'text/plain' && part.body.data) {
                    body = Buffer.from(part.body.data, 'base64').toString('utf-8');
                    break;
                }
                if (part.mimeType === 'text/html' && part.body.data && !body) {
                    body = Buffer.from(part.body.data, 'base64').toString('utf-8');
                }
            }
        }

        // Strip HTML tags for plain text
        return body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    },

    /**
     * Extract attachments from Gmail message payload
     * @param {object} gmail - Gmail client
     * @param {string} messageId - Gmail message ID
     * @param {object} payload - Message payload
     * @returns {Promise<Array>} Array of { filename, buffer }
     */
    async extractAttachments(gmail, messageId, payload) {
        const attachments = [];

        // Recursive function to find attachments in parts
        const findAttachments = async (parts) => {
            if (!parts) return;

            for (const part of parts) {
                // Check if this part is an attachment
                if (part.filename && part.filename.length > 0 && part.body) {
                    const filename = part.filename;
                    
                    // Check if file type is supported
                    if (!attachmentParser.isSupported(filename)) {
                        console.log(`[Gmail Service] Skipping unsupported attachment: ${filename}`);
                        continue;
                    }

                    try {
                        let data;
                        
                        if (part.body.attachmentId) {
                            // Attachment data needs to be fetched separately
                            const attachment = await gmail.users.messages.attachments.get({
                                userId: 'me',
                                messageId: messageId,
                                id: part.body.attachmentId,
                            });
                            data = attachment.data.data;
                        } else if (part.body.data) {
                            // Attachment data is inline
                            data = part.body.data;
                        }

                        if (data) {
                            // Decode base64url to buffer
                            const buffer = Buffer.from(data, 'base64');
                            attachments.push({ filename, buffer });
                            console.log(`[Gmail Service] Extracted attachment: ${filename} (${buffer.length} bytes)`);
                        }
                    } catch (error) {
                        console.error(`[Gmail Service] Error extracting attachment ${filename}:`, error.message);
                    }
                }

                // Recursively check nested parts (for multipart messages)
                if (part.parts) {
                    await findAttachments(part.parts);
                }
            }
        };

        // Start from top-level parts
        if (payload.parts) {
            await findAttachments(payload.parts);
        }

        return attachments;
    },

    /**
     * Parse attachments and return combined text
     * @param {object} gmail - Gmail client
     * @param {string} messageId - Gmail message ID
     * @param {object} payload - Message payload
     * @returns {Promise<string>} Combined text from all attachments
     */
    async parseEmailAttachments(gmail, messageId, payload) {
        try {
            const attachments = await this.extractAttachments(gmail, messageId, payload);
            
            if (attachments.length === 0) {
                return '';
            }

            console.log(`[Gmail Service] Found ${attachments.length} supported attachments`);
            const combinedText = await attachmentParser.parseMultiple(attachments);
            return combinedText;
        } catch (error) {
            console.error('[Gmail Service] Error parsing attachments:', error.message);
            return '';
        }
    },
};

module.exports = gmailService;
