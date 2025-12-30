const OpenAI = require('openai');
const config = require('./index');

/**
 * OpenAI client instance
 */
const openai = new OpenAI({
    apiKey: config.openai.apiKey,
});

/**
 * Default model to use
 */
const DEFAULT_MODEL = 'gpt-4.1';

/**
 * Call OpenAI with structured output (JSON mode)
 * @param {string} systemPrompt - System instructions
 * @param {string} userPrompt - User input
 * @param {object} options - Additional options
 * @returns {object} Parsed JSON response
 */
const callOpenAI = async (systemPrompt, userPrompt, options = {}) => {
    const { model = DEFAULT_MODEL, maxTokens = 2000 } = options;

    try {
        const response = await openai.chat.completions.create({
            model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            response_format: { type: 'json_object' },
            max_tokens: maxTokens,
            temperature: 0.7,
        });

        const content = response.choices[0]?.message?.content;

        if (!content) {
            throw new Error('Empty response from OpenAI');
        }

        return JSON.parse(content);
    } catch (error) {
        console.error('OpenAI API error:', error.message);
        throw error;
    }
};

module.exports = {
    openai,
    callOpenAI,
    DEFAULT_MODEL,
};
