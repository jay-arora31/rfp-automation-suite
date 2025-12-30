const { google } = require('googleapis');
const config = require('./index');

/**
 * Create OAuth2 client for Google APIs
 */
const createOAuth2Client = () => {
    return new google.auth.OAuth2(
        config.google.clientId,
        config.google.clientSecret,
        config.google.redirectUri
    );
};

/**
 * Get authorization URL for Google OAuth
 */
const getAuthUrl = (oauth2Client) => {
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: config.google.scopes,
        prompt: 'consent', // Force consent to get refresh token
    });
};

/**
 * Create Gmail API client with authenticated OAuth2 client
 */
const createGmailClient = (oauth2Client) => {
    return google.gmail({ version: 'v1', auth: oauth2Client });
};

module.exports = {
    createOAuth2Client,
    getAuthUrl,
    createGmailClient,
    scopes: config.google.scopes,
};
