const User = require('../models/userModel');
const { verifyAccessToken, extractTokenFromHeader } = require('../utils/jwtUtils');

/**
 * Authentication middleware - Verifies JWT token
 * Required for protected routes
 */
const authenticate = async (req, res, next) => {
    try {
        // Extract token from Authorization header
        const token = extractTokenFromHeader(req);
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Vui lòng đăng nhập để truy cập',
                code: 'NO_TOKEN'
            });
        }
        
        // Verify token
        const decoded = verifyAccessToken(token);
        
        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: 'Token không hợp lệ hoặc đã hết hạn',
                code: 'INVALID_TOKEN'
            });
        }
        
        // Find user and check if still exists and is active
        const user = await User.findById(decoded.id).select('+passwordChangedAt');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Tài khoản không tồn tại',
                code: 'USER_NOT_FOUND'
            });
        }
        
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Tài khoản đã bị vô hiệu hóa',
                code: 'USER_INACTIVE'
            });
        }
        
        // Check if password was changed after token was issued
        if (user.changedPasswordAfter(decoded.iat)) {
            return res.status(401).json({
                success: false,
                message: 'Mật khẩu đã thay đổi. Vui lòng đăng nhập lại',
                code: 'PASSWORD_CHANGED'
            });
        }
        
        // Attach user to request object
        req.user = {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            fullName: user.fullName
        };
        
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi xác thực',
            code: 'AUTH_ERROR'
        });
    }
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't block if no token
 */
const optionalAuth = async (req, res, next) => {
    try {
        const token = extractTokenFromHeader(req);
        
        if (token) {
            const decoded = verifyAccessToken(token);
            
            if (decoded) {
                const user = await User.findById(decoded.id);
                
                if (user && user.isActive) {
                    req.user = {
                        id: user._id,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        fullName: user.fullName
                    };
                }
            }
        }
        
        next();
    } catch (error) {
        // Continue without user - this is optional auth
        next();
    }
};

/**
 * Authorization middleware - Restricts access based on user roles
 * @param  {...string} roles - Allowed roles (e.g., 'admin', 'manager')
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Vui lòng đăng nhập để truy cập',
                code: 'NOT_AUTHENTICATED'
            });
        }
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền thực hiện hành động này',
                code: 'FORBIDDEN'
            });
        }
        
        next();
    };
};

/**
 * Check if user is admin
 */
const isAdmin = authorize('admin');

/**
 * Check if user is admin or manager
 */
const isAdminOrManager = authorize('admin', 'manager');

module.exports = {
    authenticate,
    optionalAuth,
    authorize,
    isAdmin,
    isAdminOrManager
};
