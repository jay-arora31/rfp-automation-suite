/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Sequelize validation errors
    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            message: err.errors.map((e) => e.message).join(', '),
            details: err.errors.map((e) => ({
                field: e.path,
                message: e.message,
            })),
        });
    }

    // Sequelize unique constraint errors
    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
            error: 'Conflict',
            message: 'A record with this value already exists',
            details: err.errors.map((e) => ({
                field: e.path,
                message: e.message,
            })),
        });
    }

    // Joi validation errors
    if (err.isJoi) {
        return res.status(400).json({
            error: 'Validation Error',
            message: err.details.map((d) => d.message).join(', '),
            details: err.details,
        });
    }

    // Custom application errors
    if (err.statusCode) {
        return res.status(err.statusCode).json({
            error: err.name || 'Error',
            message: err.message,
        });
    }

    // Default server error
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    });
};

/**
 * Not found handler
 */
const notFoundHandler = (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.originalUrl} not found`,
    });
};

module.exports = {
    errorHandler,
    notFoundHandler,
};
