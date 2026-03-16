const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Tên đăng nhập là bắt buộc'],
        unique: true,
        trim: true,
        minlength: [3, 'Tên đăng nhập phải có ít nhất 3 ký tự'],
        maxlength: [30, 'Tên đăng nhập không được quá 30 ký tự'],
        match: [/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z0-9_]+$/, 'Tên đăng nhập phải chứa cả chữ và số, chỉ gồm chữ, số và dấu gạch dưới']
    },
    email: {
        type: String,
        required: [true, 'Email là bắt buộc'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email không hợp lệ']
    },
    password: {
        type: String,
        required: [true, 'Mật khẩu là bắt buộc'],
        minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
        select: false // Don't include password in queries by default
    },
    fullName: {
        type: String,
        required: [true, 'Họ tên là bắt buộc'],
        trim: true,
        minlength: [2, 'Họ tên phải có ít nhất 2 ký tự'],
        maxlength: [100, 'Họ tên không được quá 100 ký tự'],
        match: [/^[A-Za-zÀ-ỹ\s]+$/u, 'Họ và tên chỉ được chứa chữ cái (Tiếng Việt) và dấu cách']
    },
    phone: {
        type: String,
        trim: true,
        match: [/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ']
    },
    role: {
        type: String,
        enum: {
            values: ['user', 'admin', 'manager'],
            message: 'Vai trò phải là user, admin hoặc manager'
        },
        default: 'user'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    refreshToken: {
        type: String,
        select: false
    },
    lastLogin: {
        type: Date
    },
    passwordChangedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Index for better query performance (email and username already indexed via unique: true)
UserSchema.index({ role: 1 });

// Hash password before saving
UserSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        
        // Set passwordChangedAt for password change (not for new users)
        if (!this.isNew) {
            this.passwordChangedAt = Date.now() - 1000; // Subtract 1 second to ensure token is created after
        }
        
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if password was changed after token was issued
UserSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

// Remove sensitive fields when converting to JSON
UserSchema.methods.toJSON = function() {
    const user = this.toObject();
    delete user.password;
    delete user.refreshToken;
    delete user.__v;
    return user;
};

const User = mongoose.model('User', UserSchema);

module.exports = User;
