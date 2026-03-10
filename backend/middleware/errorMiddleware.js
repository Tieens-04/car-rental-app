/**
 * Custom error class for API errors
 */
class AppError extends Error {
    constructor(message, statusCode, code = 'ERROR') {
        super(message);
        
        this.statusCode = statusCode;
        this.code = code;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    
    // Development mode - send detailed error
    if (process.env.NODE_ENV === 'development') {
        return res.status(err.statusCode).json({
            success: false,
            status: err.status,
            message: err.message,
            code: err.code || 'INTERNAL_ERROR',
            stack: err.stack,
            error: err
        });
    }
    
    // Production mode - send clean error
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            success: false,
            status: err.status,
            message: err.message,
            code: err.code || 'ERROR'
        });
    }
    
    // Programming or unknown errors
    console.error('ERROR 💥:', err);
    return res.status(500).json({
        success: false,
        status: 'error',
        message: 'Đã xảy ra lỗi hệ thống',
        code: 'INTERNAL_ERROR'
    });
};

/**
 * Handle MongoDB CastError
 */
const handleCastError = (err) => {
    const message = `Giá trị không hợp lệ: ${err.value}`;
    return new AppError(message, 400, 'CAST_ERROR');
};

/**
 * Handle MongoDB Duplicate Key Error
 */
const handleDuplicateError = (err) => {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `${field}: '${value}' đã tồn tại`;
    return new AppError(message, 400, 'DUPLICATE_ERROR');
};

/**
 * Handle MongoDB Validation Error
 */
const handleValidationError = (err) => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = errors.join('. ');
    return new AppError(message, 400, 'VALIDATION_ERROR');
};

/**
 * Handle JWT Error
 */
const handleJWTError = () => {
    return new AppError('Token không hợp lệ. Vui lòng đăng nhập lại', 401, 'JWT_ERROR');
};

/**
 * Handle JWT Expired Error
 */
const handleJWTExpiredError = () => {
    return new AppError('Token đã hết hạn. Vui lòng đăng nhập lại', 401, 'JWT_EXPIRED');
};

/**
 * Production error handler wrapper
 */
const productionErrorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    
    // Handle specific MongoDB/JWT errors
    if (err.name === 'CastError') error = handleCastError(err);
    if (err.code === 11000) error = handleDuplicateError(err);
    if (err.name === 'ValidationError') error = handleValidationError(err);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
    
    errorHandler(error, req, res, next);
};

/**
 * Async handler wrapper - eliminates need for try-catch in async routes
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res, next) => {
    const error = new AppError(`Không tìm thấy đường dẫn: ${req.originalUrl}`, 404, 'NOT_FOUND');
    next(error);
};

module.exports = {
    AppError,
    errorHandler,
    productionErrorHandler,
    asyncHandler,
    notFoundHandler
};
