const Joi = require('joi');

/**
 * Vendor validation schemas
 */
const vendorSchemas = {
    create: {
        body: Joi.object({
            name: Joi.string().required().max(255).messages({
                'string.empty': 'Vendor name is required',
                'any.required': 'Vendor name is required',
            }),
            email: Joi.string().email().required().max(255).messages({
                'string.email': 'Please provide a valid email address',
                'any.required': 'Email is required',
            }),
            company: Joi.string().max(255).allow('', null),
            phone: Joi.string().max(50).allow('', null),
            category: Joi.string().max(100).allow('', null),
            address: Joi.string().allow('', null),
            notes: Joi.string().allow('', null),
        }),
    },

    update: {
        params: Joi.object({
            id: Joi.number().integer().positive().required(),
        }),
        body: Joi.object({
            name: Joi.string().max(255),
            email: Joi.string().email().max(255),
            company: Joi.string().max(255).allow('', null),
            phone: Joi.string().max(50).allow('', null),
            category: Joi.string().max(100).allow('', null),
            address: Joi.string().allow('', null),
            notes: Joi.string().allow('', null),
        }).min(1).messages({
            'object.min': 'At least one field is required for update',
        }),
    },

    getById: {
        params: Joi.object({
            id: Joi.number().integer().positive().required(),
        }),
    },

    list: {
        query: Joi.object({
            category: Joi.string().max(100),
            search: Joi.string().max(255),
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(100).default(20),
        }),
    },
};

/**
 * RFP validation schemas
 */
const rfpSchemas = {
    create: {
        body: Joi.object({
            input: Joi.string().required().min(10).max(5000).messages({
                'string.empty': 'Please describe your procurement needs',
                'string.min': 'Please provide more details about your procurement needs',
                'any.required': 'Input is required',
            }),
        }),
    },

    getById: {
        params: Joi.object({
            id: Joi.number().integer().positive().required(),
        }),
    },

    send: {
        params: Joi.object({
            id: Joi.number().integer().positive().required(),
        }),
        body: Joi.object({
            vendorIds: Joi.array().items(Joi.number().integer().positive()).min(1).required().messages({
                'array.min': 'Please select at least one vendor',
                'any.required': 'Vendor IDs are required',
            }),
        }),
    },

    list: {
        query: Joi.object({
            status: Joi.string().valid('draft', 'sent', 'evaluating', 'awarded', 'closed'),
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(100).default(20),
        }),
    },
};

/**
 * Proposal validation schemas
 */
const proposalSchemas = {
    getById: {
        params: Joi.object({
            id: Joi.number().integer().positive().required(),
        }),
    },
};

module.exports = {
    vendorSchemas,
    rfpSchemas,
    proposalSchemas,
};
