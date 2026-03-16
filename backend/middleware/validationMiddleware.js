const { validationResult } = require('express-validator');
const { AppError } = require('./errorMiddleware');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
        return next();
    }

    const messages = errors.array().map((error) => error.msg);
    throw new AppError(messages.join('. '), 400, 'VALIDATION_ERROR');
};

module.exports = {
    handleValidationErrors
};
