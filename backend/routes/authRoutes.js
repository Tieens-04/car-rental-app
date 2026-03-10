const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, isAdmin } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);

// Protected routes (require authentication)
router.use(authenticate);

router.post('/logout', authController.logout);
router.get('/me', authController.getMe);
router.put('/me', authController.updateMe);
router.put('/password', authController.changePassword);

// Admin only routes
router.get('/users', isAdmin, authController.getAllUsers);
router.put('/users/:userId', isAdmin, authController.updateUser);
router.delete('/users/:userId', isAdmin, authController.deleteUser);

module.exports = router;
