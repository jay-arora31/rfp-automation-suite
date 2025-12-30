/**
 * Validation middleware factory
 * Creates a middleware that validates request body/params/query against a Joi schema
 * 
 * @param {object} schema - Joi schema object with optional body, params, query keys
 * @returns {function} Express middleware
 */
const validateRequest = (schema) => {
    return (req, res, next) => {
        const validationErrors = [];

        // Validate request body
        if (schema.body) {
            const { error, value } = schema.body.validate(req.body, { abortEarly: false });
            if (error) {
                validationErrors.push(...error.details);
            } else {
                req.body = value;
            }
        }

        // Validate request params
        if (schema.params) {
            const { error, value } = schema.params.validate(req.params, { abortEarly: false });
            if (error) {
                validationErrors.push(...error.details);
            } else {
                req.params = value;
            }
        }

        // Validate request query
        if (schema.query) {
            const { error, value } = schema.query.validate(req.query, { abortEarly: false });
            if (error) {
                validationErrors.push(...error.details);
            } else {
                req.query = value;
            }
        }

        if (validationErrors.length > 0) {
            return res.status(400).json({
                error: 'Validation Error',
                message: validationErrors.map((d) => d.message).join(', '),
                details: validationErrors,
            });
        }

        next();
    };
};

module.exports = validateRequest;
