const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticate, isAdmin } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/validationMiddleware');

const usernameRule = body('username')
    .trim()
    .notEmpty().withMessage('Tên đăng nhập là bắt buộc')
    .isLength({ min: 3, max: 30 }).withMessage('Tên đăng nhập phải có từ 3 đến 30 ký tự')
	.matches(/^[a-zA-Z0-9_]+$/).withMessage('Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới')
	.matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z0-9_]+$/).withMessage('Tên đăng nhập phải chứa cả chữ và số');

const emailRule = body('email')
	.trim()
	.notEmpty().withMessage('Email là bắt buộc')
	.isEmail().withMessage('Email không hợp lệ')
	.normalizeEmail();

const passwordRule = body('password')
	.notEmpty().withMessage('Mật khẩu là bắt buộc')
	.isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự')
	.matches(/^(?=.*[A-Za-z])(?=.*\d).+$/).withMessage('Mật khẩu phải bao gồm ít nhất 1 chữ cái và 1 chữ số');

const fullNameRule = body('fullName')
	.trim()
	.notEmpty().withMessage('Họ tên là bắt buộc')
	.isLength({ min: 2, max: 100 }).withMessage('Họ tên phải có từ 2 đến 100 ký tự')
	.matches(/^[A-Za-zÀ-ỹ\s]+$/u).withMessage('Họ và tên chỉ được chứa chữ cái (Tiếng Việt) và dấu cách');

const phoneRequiredRule = body('phone')
	.trim()
	.notEmpty().withMessage('Số điện thoại là bắt buộc')
	.matches(/^[0-9]{10,11}$/).withMessage('Số điện thoại không hợp lệ');

const phoneOptionalRule = body('phone')
	.optional({ values: 'falsy' })
	.trim()
	.matches(/^[0-9]{10,11}$/).withMessage('Số điện thoại không hợp lệ');

const userIdParamRule = param('userId').isMongoId().withMessage('userId không hợp lệ');

// Public routes
router.post(
	'/register',
	[usernameRule, emailRule, passwordRule, fullNameRule, phoneRequiredRule, handleValidationErrors],
	authController.register
);
router.post(
	'/login',
	[
		body('username').trim().notEmpty().withMessage('Vui lòng nhập tên đăng nhập hoặc email'),
		body('password').notEmpty().withMessage('Vui lòng nhập mật khẩu'),
		handleValidationErrors
	],
	authController.login
);
router.post(
	'/refresh',
	[body('refreshToken').notEmpty().withMessage('Refresh token là bắt buộc'), handleValidationErrors],
	authController.refreshToken
);

// Protected routes (require authentication)
router.use(authenticate);

router.post('/logout', authController.logout);
router.get('/me', authController.getMe);
router.put(
	'/me',
	[
		body('fullName')
			.optional()
			.trim()
			.isLength({ min: 2, max: 100 }).withMessage('Họ tên phải có từ 2 đến 100 ký tự')
			.matches(/^[A-Za-zÀ-ỹ\s]+$/u).withMessage('Họ và tên chỉ được chứa chữ cái (Tiếng Việt) và dấu cách'),
		body('email').optional().trim().isEmail().withMessage('Email không hợp lệ').normalizeEmail(),
		phoneOptionalRule,
		handleValidationErrors
	],
	authController.updateMe
);
router.put(
	'/password',
	[
		body('currentPassword').notEmpty().withMessage('Vui lòng nhập mật khẩu hiện tại'),
		body('newPassword')
			.notEmpty().withMessage('Vui lòng nhập mật khẩu mới')
			.isLength({ min: 6 }).withMessage('Mật khẩu mới phải có ít nhất 6 ký tự')
			.matches(/^(?=.*[A-Za-z])(?=.*\d).+$/).withMessage('Mật khẩu mới phải bao gồm ít nhất 1 chữ cái và 1 chữ số'),
		handleValidationErrors
	],
	authController.changePassword
);

// Admin only routes
router.get('/users', isAdmin, authController.getAllUsers);
router.put(
	'/users/:userId',
	isAdmin,
	[
		userIdParamRule,
		body('email').optional().trim().isEmail().withMessage('Email không hợp lệ').normalizeEmail(),
		body('fullName')
			.optional()
			.trim()
			.isLength({ min: 2, max: 100 }).withMessage('Họ tên phải có từ 2 đến 100 ký tự')
			.matches(/^[A-Za-zÀ-ỹ\s]+$/u).withMessage('Họ và tên chỉ được chứa chữ cái (Tiếng Việt) và dấu cách'),
		body('phone').optional({ values: 'falsy' }).trim().matches(/^[0-9]{10,11}$/).withMessage('Số điện thoại không hợp lệ'),
		body('role').optional().isIn(['user', 'admin', 'manager']).withMessage('Vai trò không hợp lệ'),
		body('isActive').optional().isBoolean().withMessage('isActive phải là kiểu boolean'),
		handleValidationErrors
	],
	authController.updateUser
);
router.delete('/users/:userId', isAdmin, [userIdParamRule, handleValidationErrors], authController.deleteUser);

module.exports = router;
