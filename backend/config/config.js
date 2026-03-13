require('dotenv').config();

module.exports = {
    // Server
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    
    // MongoDB
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/carRental',
    
    // JWT
    jwt: {
        secret: process.env.JWT_SECRET || 'default_jwt_secret_change_me',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret_change_me',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
    },
    
    // CORS
    cors: {
        origin: (() => {
            const base = ['http://localhost:3000', 'http://localhost:5173', 'https://car-rental-app-t3ws.onrender.com'];
            if (process.env.CORS_ORIGIN) {
                return [...new Set([...base, ...process.env.CORS_ORIGIN.split(',')])];
            }
            return base;
        })(),
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    },
    
    // Rate Limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
    }
};
