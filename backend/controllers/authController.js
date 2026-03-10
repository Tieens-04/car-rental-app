const User = require('../models/userModel');
const { generateTokens, verifyRefreshToken } = require('../utils/jwtUtils');
const { asyncHandler, AppError } = require('../middleware/errorMiddleware');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res, next) => {
    const { username, email, password, fullName, phone } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({
        $or: [{ email: email?.toLowerCase() }, { username }]
    });
    
    if (existingUser) {
        if (existingUser.email === email?.toLowerCase()) {
            throw new AppError('Email đã được sử dụng', 400, 'EMAIL_EXISTS');
        }
        throw new AppError('Tên đăng nhập đã tồn tại', 400, 'USERNAME_EXISTS');
    }
    
    // Create user
    const user = await User.create({
        username,
        email,
        password,
        fullName,
        phone
    });
    
    // Generate tokens
    const tokens = generateTokens(user);
    
    // Save refresh token to database
    user.refreshToken = tokens.refreshToken;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    
    res.status(201).json({
        success: true,
        message: 'Đăng ký thành công',
        data: {
            user: user.toJSON(),
            ...tokens
        }
    });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res, next) => {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
        throw new AppError('Vui lòng nhập tên đăng nhập và mật khẩu', 400, 'MISSING_CREDENTIALS');
    }
    
    // Find user by username or email (select password explicitly)
    const user = await User.findOne({
        $or: [
            { username },
            { email: username.toLowerCase() }
        ]
    }).select('+password +refreshToken');
    
    if (!user) {
        throw new AppError('Tên đăng nhập hoặc mật khẩu không đúng', 401, 'INVALID_CREDENTIALS');
    }
    
    // Check if account is active
    if (!user.isActive) {
        throw new AppError('Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên', 401, 'ACCOUNT_INACTIVE');
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw new AppError('Tên đăng nhập hoặc mật khẩu không đúng', 401, 'INVALID_CREDENTIALS');
    }
    
    // Generate tokens
    const tokens = generateTokens(user);
    
    // Save refresh token and update last login
    user.refreshToken = tokens.refreshToken;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    
    res.status(200).json({
        success: true,
        message: 'Đăng nhập thành công',
        data: {
            user: user.toJSON(),
            ...tokens
        }
    });
});

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh
 * @access  Public
 */
const refreshToken = asyncHandler(async (req, res, next) => {
    const { refreshToken: token } = req.body;
    
    if (!token) {
        throw new AppError('Refresh token là bắt buộc', 400, 'MISSING_TOKEN');
    }
    
    // Verify refresh token
    const decoded = verifyRefreshToken(token);
    if (!decoded) {
        throw new AppError('Refresh token không hợp lệ hoặc đã hết hạn', 401, 'INVALID_REFRESH_TOKEN');
    }
    
    // Find user with matching refresh token
    const user = await User.findById(decoded.id).select('+refreshToken');
    
    if (!user || user.refreshToken !== token) {
        throw new AppError('Refresh token không hợp lệ', 401, 'INVALID_REFRESH_TOKEN');
    }
    
    if (!user.isActive) {
        throw new AppError('Tài khoản đã bị vô hiệu hóa', 401, 'ACCOUNT_INACTIVE');
    }
    
    // Generate new tokens
    const tokens = generateTokens(user);
    
    // Update refresh token
    user.refreshToken = tokens.refreshToken;
    await user.save({ validateBeforeSave: false });
    
    res.status(200).json({
        success: true,
        message: 'Token đã được làm mới',
        data: tokens
    });
});

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res, next) => {
    // Clear refresh token in database
    await User.findByIdAndUpdate(req.user.id, {
        refreshToken: null
    });
    
    res.status(200).json({
        success: true,
        message: 'Đăng xuất thành công'
    });
});

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    
    if (!user) {
        throw new AppError('Không tìm thấy người dùng', 404, 'USER_NOT_FOUND');
    }
    
    res.status(200).json({
        success: true,
        data: user
    });
});

/**
 * @desc    Update current user profile
 * @route   PUT /api/auth/me
 * @access  Private
 */
const updateMe = asyncHandler(async (req, res, next) => {
    const { fullName, phone, email } = req.body;
    
    // Build update object
    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (phone) updateData.phone = phone;
    
    // Check if email is being changed
    if (email && email !== req.user.email) {
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            throw new AppError('Email đã được sử dụng', 400, 'EMAIL_EXISTS');
        }
        updateData.email = email.toLowerCase();
    }
    
    const user = await User.findByIdAndUpdate(req.user.id, updateData, {
        new: true,
        runValidators: true
    });
    
    res.status(200).json({
        success: true,
        message: 'Cập nhật thông tin thành công',
        data: user
    });
});

/**
 * @desc    Change password
 * @route   PUT /api/auth/password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
        throw new AppError('Vui lòng nhập mật khẩu hiện tại và mật khẩu mới', 400, 'MISSING_PASSWORDS');
    }
    
    if (newPassword.length < 6) {
        throw new AppError('Mật khẩu mới phải có ít nhất 6 ký tự', 400, 'WEAK_PASSWORD');
    }
    
    // Get user with password
    const user = await User.findById(req.user.id).select('+password');
    
    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
        throw new AppError('Mật khẩu hiện tại không đúng', 401, 'WRONG_PASSWORD');
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    // Generate new tokens
    const tokens = generateTokens(user);
    
    // Update refresh token
    user.refreshToken = tokens.refreshToken;
    await user.save({ validateBeforeSave: false });
    
    res.status(200).json({
        success: true,
        message: 'Đổi mật khẩu thành công',
        data: tokens
    });
});

/**
 * @desc    Get all users (Admin only)
 * @route   GET /api/auth/users
 * @access  Private/Admin
 */
const getAllUsers = asyncHandler(async (req, res, next) => {
    const { page = 1, limit = 10, role, search, isActive } = req.query;
    
    // Build query
    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
        query.$or = [
            { username: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { fullName: { $regex: search, $options: 'i' } }
        ];
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [users, total] = await Promise.all([
        User.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit)),
        User.countDocuments(query)
    ]);
    
    res.status(200).json({
        success: true,
        data: {
            users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        }
    });
});

/**
 * @desc    Update user (Admin only)
 * @route   PUT /api/auth/users/:userId
 * @access  Private/Admin
 */
const updateUser = asyncHandler(async (req, res, next) => {
    const { userId } = req.params;
    const { role, isActive } = req.body;
    
    const user = await User.findById(userId);
    
    if (!user) {
        throw new AppError('Không tìm thấy người dùng', 404, 'USER_NOT_FOUND');
    }
    
    // Prevent admin from modifying their own role/status
    if (user._id.toString() === req.user.id) {
        throw new AppError('Không thể thay đổi vai trò hoặc trạng thái của chính mình', 400, 'SELF_MODIFY_DENIED');
    }
    
    // Update fields
    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    
    await user.save({ validateBeforeSave: false });
    
    res.status(200).json({
        success: true,
        message: 'Cập nhật người dùng thành công',
        data: user
    });
});

/**
 * @desc    Delete user (Admin only)
 * @route   DELETE /api/auth/users/:userId
 * @access  Private/Admin
 */
const deleteUser = asyncHandler(async (req, res, next) => {
    const { userId } = req.params;
    
    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
        throw new AppError('Không thể xóa tài khoản của chính mình', 400, 'SELF_DELETE_DENIED');
    }
    
    const user = await User.findByIdAndDelete(userId);
    
    if (!user) {
        throw new AppError('Không tìm thấy người dùng', 404, 'USER_NOT_FOUND');
    }
    
    res.status(200).json({
        success: true,
        message: 'Xóa người dùng thành công'
    });
});

module.exports = {
    register,
    login,
    refreshToken,
    logout,
    getMe,
    updateMe,
    changePassword,
    getAllUsers,
    updateUser,
    deleteUser
};
