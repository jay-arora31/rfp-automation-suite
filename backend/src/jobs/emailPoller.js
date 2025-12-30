const cron = require('node-cron');
const config = require('../config');
const gmailService = require('../services/gmailService');
const proposalService = require('../services/proposalService');
const aiService = require('../services/aiService');
const { prisma } = require('../config/database');

let lastPollTime = null;
let isPolling = false;
const processingEmails = new Set(); // Track emails currently being processed

// Maximum follow-up emails to send per vendor
const MAX_FOLLOW_UPS = 3;

/**
 * Merge new parsed data with existing partial data
 * Preserves data from previous responses and adds new data
 */
function mergeProposalData(existing, newData) {
    const merged = { ...existing };
    
    // Merge top-level fields (only if new value exists)
    if (newData.vendorName) merged.vendorName = newData.vendorName;
    if (newData.totalPrice) merged.totalPrice = newData.totalPrice;
    if (newData.currency) merged.currency = newData.currency;
    if (newData.deliveryDays) merged.deliveryDays = newData.deliveryDays;
    if (newData.paymentTerms) merged.paymentTerms = newData.paymentTerms;
    if (newData.warrantyTerms) merged.warrantyTerms = newData.warrantyTerms;
    if (newData.additionalNotes) merged.additionalNotes = newData.additionalNotes;
    
    // Merge items array - match by name and merge fields
    if (newData.items && newData.items.length > 0) {
        merged.items = merged.items || [];
        
        for (const newItem of newData.items) {
            const existingItem = merged.items.find(
                i => i.name?.toLowerCase() === newItem.name?.toLowerCase()
            );
            
            if (existingItem) {
                // Update existing item with new values
                if (newItem.unitPrice) existingItem.unitPrice = newItem.unitPrice;
                if (newItem.totalPrice) existingItem.totalPrice = newItem.totalPrice;
                if (newItem.quantity) existingItem.quantity = newItem.quantity;
                if (newItem.warranty) existingItem.warranty = newItem.warranty;
                if (newItem.specifications?.length) existingItem.specifications = newItem.specifications;
            } else {
                // Add new item
                merged.items.push(newItem);
            }
        }
    }
    
    return merged;
}

/**
 * Check what fields are still missing from merged data
 */
function checkMissingFields(data, rfpItems) {
    const missing = [];
    
    // Check delivery timeline
    if (!data.deliveryDays) {
        missing.push('Delivery timeline');
    }
    
    // Check price for each RFP item
    const rfpItemNames = (rfpItems || []).map(i => i.name?.toLowerCase());
    
    for (const rfpItemName of rfpItemNames) {
        const proposalItem = (data.items || []).find(
            i => i.name?.toLowerCase() === rfpItemName || 
                 rfpItemName?.includes(i.name?.toLowerCase()) ||
                 i.name?.toLowerCase()?.includes(rfpItemName)
        );
        
        if (!proposalItem || !proposalItem.unitPrice) {
            // Capitalize first letter for display
            const displayName = rfpItemName ? 
                rfpItemName.charAt(0).toUpperCase() + rfpItemName.slice(1) : 
                'Item';
            missing.push(`Price for ${displayName}`);
        }
    }
    
    return missing;
}

/**
 * Process a single vendor email response
 * Handles both complete and incomplete proposals
 */
async function processVendorEmail(email) {
    // Prevent duplicate processing within same poll cycle
    const emailKey = `${email.rfpId}-${email.messageId}`;
    if (processingEmails.has(emailKey)) {
        console.log(`[Email Poller] Email ${email.messageId} already being processed, skipping`);
        return { status: 'skipped', reason: 'duplicate_in_cycle' };
    }
    processingEmails.add(emailKey);

    try {
        return await _processVendorEmailInternal(email);
    } finally {
        processingEmails.delete(emailKey);
    }
}

async function _processVendorEmailInternal(email) {
    // Get RFP for context
    const rfp = await prisma.rfp.findUnique({
        where: { id: email.rfpId },
    });
    if (!rfp) {
        console.log(`[Email Poller] RFP ${email.rfpId} not found, skipping`);
        return { status: 'skipped', reason: 'rfp_not_found' };
    }

    // Find vendor by email address
    const emailMatch = email.from.match(/<(.+)>/) || [null, email.from];
    const vendorEmail = emailMatch[1]?.trim();

    const vendor = await prisma.vendor.findUnique({
        where: { email: vendorEmail },
    });

    if (!vendor) {
        console.log(`[Email Poller] Vendor ${vendorEmail} not found, skipping`);
        return { status: 'skipped', reason: 'vendor_not_found' };
    }

    // Get RfpVendor record for thread info
    const rfpVendor = await prisma.rfpVendor.findUnique({
        where: {
            rfpId_vendorId: {
                rfpId: email.rfpId,
                vendorId: vendor.id,
            },
        },
    });

    if (!rfpVendor) {
        console.log(`[Email Poller] RfpVendor record not found for RFP ${email.rfpId}, vendor ${vendor.id}`);
        return { status: 'skipped', reason: 'rfp_vendor_not_found' };
    }

    // Check if proposal already exists and is complete
    const existingProposal = await prisma.proposal.findFirst({
        where: {
            rfpId: email.rfpId,
            vendorId: vendor.id,
        },
    });

    if (existingProposal && rfpVendor.status === 'responded') {
        console.log(`[Email Poller] Complete proposal already exists for RFP ${email.rfpId} from vendor ${vendor.name}, skipping`);
        return { status: 'skipped', reason: 'proposal_exists' };
    }

    // Check if we've already processed this exact email message
    // This prevents re-sending follow-ups for the same email
    if (rfpVendor.lastProcessedMessageId === email.messageId) {
        console.log(`[Email Poller] Email ${email.messageId} already processed for vendor ${vendor.name}, skipping`);
        return { status: 'skipped', reason: 'already_processed' };
    }

    // Prevent duplicate follow-ups - skip if we sent one in the last 2 minutes
    if (rfpVendor.lastFollowUpAt) {
        const timeSinceLastFollowUp = Date.now() - new Date(rfpVendor.lastFollowUpAt).getTime();
        const twoMinutes = 2 * 60 * 1000;
        if (timeSinceLastFollowUp < twoMinutes) {
            console.log(`[Email Poller] Follow-up sent ${Math.round(timeSinceLastFollowUp/1000)}s ago for ${vendor.name}, skipping to prevent duplicate`);
            return { status: 'skipped', reason: 'recent_followup' };
        }
    }

    // IMMEDIATELY mark this message as being processed to prevent race conditions
    await prisma.rfpVendor.update({
        where: { id: rfpVendor.id },
        data: { lastProcessedMessageId: email.messageId },
    });

    // Combine email body with attachment text (if any)
    let fullContent = email.body;
    if (email.attachmentText) {
        fullContent += '\n\n--- ATTACHMENT CONTENT ---\n' + email.attachmentText;
        console.log(`[Email Poller] Including attachment content for parsing`);
    }

    // Parse email with AI to extract proposal data
    const parsedData = await aiService.parseVendorResponse(fullContent, {
        title: rfp.title,
        items: rfp.items,
    });

    // MERGE with existing partial data if available
    const existingData = rfpVendor.partialProposalData || {};
    const mergedData = mergeProposalData(existingData, parsedData);
    
    console.log(`[Email Poller] Merged data for ${vendor.name}:`, {
        hasItems: mergedData.items?.length > 0,
        hasDelivery: !!mergedData.deliveryDays,
        itemsWithPrice: mergedData.items?.filter(i => i.unitPrice).length || 0,
    });

    // Check completeness of MERGED data
    const missingFields = checkMissingFields(mergedData, rfp.items);
    const isComplete = missingFields.length === 0;

    if (!isComplete) {
        // INCOMPLETE RESPONSE - Send follow-up email
        console.log(`[Email Poller] Incomplete response from ${vendor.name}. Missing: ${missingFields.join(', ')}`);

        // Check if we've hit the follow-up limit
        if (rfpVendor.followUpCount >= MAX_FOLLOW_UPS) {
            console.log(`[Email Poller] Max follow-ups (${MAX_FOLLOW_UPS}) reached for ${vendor.name}, creating partial proposal`);
            // Create proposal anyway with whatever data we have
            await proposalService.createFromEmail(email.rfpId, vendor.id, fullContent, mergedData);
            return { status: 'partial_proposal', missingFields };
        }

        // Send follow-up email in the same thread
        if (rfpVendor.emailThreadId && rfpVendor.emailMessageId) {
            const followUpBody = gmailService.generateMissingDetailsEmailBody(
                vendor.name,
                rfp.title,
                missingFields
            );

            const result = await gmailService.replyInThread({
                threadId: rfpVendor.emailThreadId,
                messageId: rfpVendor.emailMessageId,
                to: vendor.email,
                subject: `Re: [RFP-${rfp.id}] ${rfp.title}`,
                body: followUpBody,
            });

            if (result.success) {
                // Update RfpVendor with follow-up info, store merged data, mark as processed
                await prisma.rfpVendor.update({
                    where: { id: rfpVendor.id },
                    data: {
                        status: 'awaiting_details',
                        followUpCount: rfpVendor.followUpCount + 1,
                        lastFollowUpAt: new Date(),
                        missingFields: missingFields,
                        partialProposalData: mergedData, // Store merged data for next merge
                        lastProcessedMessageId: email.messageId,
                    },
                });

                console.log(`[Email Poller] Sent follow-up #${rfpVendor.followUpCount + 1} to ${vendor.name} for missing: ${missingFields.join(', ')}`);
                return { status: 'follow_up_sent', followUpCount: rfpVendor.followUpCount + 1 };
            } else {
                console.error(`[Email Poller] Failed to send follow-up to ${vendor.name}: ${result.error}`);
                // Still update status and store merged data
                await prisma.rfpVendor.update({
                    where: { id: rfpVendor.id },
                    data: {
                        status: 'awaiting_details',
                        missingFields: missingFields,
                        partialProposalData: mergedData,
                        lastProcessedMessageId: email.messageId,
                    },
                });
                return { status: 'follow_up_failed', error: result.error };
            }
        } else {
            console.log(`[Email Poller] No thread ID found for ${vendor.name}, cannot send follow-up in thread`);
            // Update status and store merged data
            await prisma.rfpVendor.update({
                where: { id: rfpVendor.id },
                data: {
                    status: 'awaiting_details',
                    missingFields: missingFields,
                    partialProposalData: mergedData,
                    lastProcessedMessageId: email.messageId,
                },
            });
            return { status: 'no_thread_id' };
        }
    }

    // COMPLETE RESPONSE - Create full proposal with merged data
    await proposalService.createFromEmail(email.rfpId, vendor.id, fullContent, mergedData);
    
    // Mark as processed and update status, clear partial data
    await prisma.rfpVendor.update({
        where: { id: rfpVendor.id },
        data: {
            status: 'responded',
            lastProcessedMessageId: email.messageId,
            partialProposalData: null, // Clear partial data
            missingFields: [],
        },
    });
    
    console.log(`[Email Poller] Created complete proposal from ${vendor.name} for RFP ${email.rfpId}`);
    return { status: 'proposal_created' };
}

/**
 * Email Poller Job
 * Polls Gmail for vendor responses every X minutes
 */
const startEmailPoller = () => {
    const intervalMinutes = config.emailPolling.intervalMinutes || 2;

    // Run every X minutes (recoverMissedExecutions: false suppresses warnings when system wakes from sleep)
    cron.schedule(`*/${intervalMinutes} * * * *`, async () => {
        if (isPolling) {
            console.log('[Email Poller] Already polling, skipping...');
            return;
        }

        isPolling = true;
        console.log(`[${new Date().toISOString()}] 📧 Polling Gmail for vendor responses...`);

        try {
            // Fetch unread RFP responses from Gmail
            const emails = await gmailService.fetchRfpResponses();

            if (emails.length === 0) {
                console.log('[Email Poller] No new emails found');
                lastPollTime = new Date();
                isPolling = false;
                return;
            }

            console.log(`[Email Poller] Found ${emails.length} new emails`);
            let proposalsCreated = 0;
            let followUpsSent = 0;

            for (const email of emails) {
                try {
                    const result = await processVendorEmail(email);
                    
                    if (result.status === 'proposal_created' || result.status === 'partial_proposal') {
                        proposalsCreated++;
                    } else if (result.status === 'follow_up_sent') {
                        followUpsSent++;
                    }
                } catch (error) {
                    console.error(`[Email Poller] Error processing email:`, error.message);
                }
            }

            console.log(`[Email Poller] Poll complete - ${proposalsCreated} proposals created, ${followUpsSent} follow-ups sent`);
            lastPollTime = new Date();
        } catch (error) {
            console.error('[Email Poller] Error:', error.message);
        } finally {
            isPolling = false;
        }
    }, {
        recoverMissedExecutions: false  // Don't warn about missed executions when system wakes from sleep
    });

    console.log(`[Email Poller] Scheduled to run every ${intervalMinutes} minutes`);
};

/**
 * Get polling status
 */
const getPollingStatus = () => ({
    enabled: config.emailPolling.enabled,
    intervalMinutes: config.emailPolling.intervalMinutes,
    lastPollAt: lastPollTime,
    isPolling,
});

/**
 * Manually trigger poll
 */
const triggerPoll = async () => {
    if (isPolling) {
        return { success: false, message: 'Polling already in progress' };
    }

    isPolling = true;

    try {
        const emails = await gmailService.fetchRfpResponses();
        let proposalsCreated = 0;
        let followUpsSent = 0;

        for (const email of emails) {
            try {
                const result = await processVendorEmail(email);
                
                if (result.status === 'proposal_created' || result.status === 'partial_proposal') {
                    proposalsCreated++;
                } else if (result.status === 'follow_up_sent') {
                    followUpsSent++;
                }
            } catch (error) {
                console.error('[Email Poller] Error:', error.message);
            }
        }

        lastPollTime = new Date();

        return {
            success: true,
            emailsProcessed: emails.length,
            proposalsCreated,
            followUpsSent,
        };
    } finally {
        isPolling = false;
    }
};

module.exports = startEmailPoller;
module.exports.getPollingStatus = getPollingStatus;
module.exports.triggerPoll = triggerPoll;
