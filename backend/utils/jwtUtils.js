const jwt = require('jsonwebtoken');
const config = require('../config/config');

/**
 * Generate access token
 * @param {Object} payload - User data to include in token
 * @returns {string} - JWT access token
 */
const generateAccessToken = (payload) => {
    return jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn
    });
};

/**
 * Generate refresh token
 * @param {Object} payload - User data to include in token
 * @returns {string} - JWT refresh token
 */
const generateRefreshToken = (payload) => {
    return jwt.sign(payload, config.jwt.refreshSecret, {
        expiresIn: config.jwt.refreshExpiresIn
    });
};

/**
 * Generate both access and refresh tokens
 * @param {Object} user - User object from database
 * @returns {Object} - Object containing accessToken and refreshToken
 */
const generateTokens = (user) => {
    const payload = {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
    };
    
    return {
        accessToken: generateAccessToken(payload),
        refreshToken: generateRefreshToken({ id: user._id })
    };
};

/**
 * Verify access token
 * @param {string} token - JWT access token
 * @returns {Object|null} - Decoded payload or null if invalid
 */
const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, config.jwt.secret);
    } catch (error) {
        return null;
    }
};

/**
 * Verify refresh token
 * @param {string} token - JWT refresh token
 * @returns {Object|null} - Decoded payload or null if invalid
 */
const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, config.jwt.refreshSecret);
    } catch (error) {
        return null;
    }
};

/**
 * Extract token from Authorization header or cookies
 * @param {Object} req - Express request object
 * @returns {string|null} - Token or null if not found
 */
const extractTokenFromHeader = (req) => {
    // First try Authorization header
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    
    // Then try cookies
    if (req.cookies && req.cookies.accessToken) {
        return req.cookies.accessToken;
    }
    
    return null;
};

/**
 * Decode token without verification (for debugging)
 * @param {string} token - JWT token
 * @returns {Object|null} - Decoded payload or null
 */
const decodeToken = (token) => {
    try {
        return jwt.decode(token);
    } catch (error) {
        return null;
    }
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    generateTokens,
    verifyAccessToken,
    verifyRefreshToken,
    extractTokenFromHeader,
    decodeToken
};
