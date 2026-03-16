const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    customerName: {
        type: String,
        required: [true, 'Tên người đặt là bắt buộc'],
        trim: true,
        minlength: [3, 'Tên người đặt phải có ít nhất 3 ký tự'],
        maxlength: [100, 'Tên người đặt không được vượt quá 100 ký tự'],
        match: [/^[A-Za-zÀ-ỹ\s]+$/u, 'Tên người đặt chỉ được chứa chữ cái (Tiếng Việt) và dấu cách']
    },
    carNumber: {
        type: String,
        required: [true, 'Biển số xe là bắt buộc'],
        trim: true
    },
    startDate: {
        type: Date,
        required: [true, 'Ngày bắt đầu là bắt buộc']
    },
    endDate: {
        type: Date,
        required: [true, 'Ngày kết thúc là bắt buộc']
    },
    totalAmount: {
        type: Number,
        required: [true, 'Tổng tiền là bắt buộc'],
        min: [0, 'Tổng tiền không được âm']
    },
    status: {
        type: String,
        enum: ['chờ xác nhận', 'chờ nhận xe', 'đã nhận xe', 'quá hạn trả xe', 'hoàn thành', 'đã hủy'],
        default: 'chờ xác nhận'
    },
    confirmedAt: {
        type: Date,
        default: null
    },
    pickupAt: {
        type: Date,
        default: null
    },
    depositAmount: {
        type: Number,
        required: [true, 'Tiền cọc là bắt buộc'],
        min: [0, 'Tiền cọc không được âm']
    },
    remainingAmount: {
        type: Number,
        required: [true, 'Tiền còn lại là bắt buộc'],
        min: [0, 'Tiền còn lại không được âm']
    },
    depositPaidAt: {
        type: Date,
        default: null
    },
    remainingPaidAt: {
        type: Date,
        default: null
    },
    // User tracking
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    notes: {
        type: String,
        maxlength: [500, 'Ghi chú không được vượt quá 500 ký tự']
    }
}, {
    timestamps: true
});

// Indexes for better query performance
BookingSchema.index({ carNumber: 1 });
BookingSchema.index({ customerName: 1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ startDate: 1, endDate: 1 });
BookingSchema.index({ createdBy: 1 });
BookingSchema.index({ createdAt: -1 });

// Validate endDate >= startDate (same-day allowed, minimum 1-day charge)
BookingSchema.pre('validate', function (next) {
    if (this.startDate && this.endDate && this.endDate < this.startDate) {
        this.invalidate('endDate', 'Ngày kết thúc không được trước ngày bắt đầu');
    }
    next();
});

// Virtual for number of days (minimum 1 for same-day rentals)
BookingSchema.virtual('numberOfDays').get(function() {
    if (this.startDate && this.endDate) {
        const diffTime = Math.abs(this.endDate - this.startDate);
        return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }
    return 1;
});

// Enable virtuals in JSON
BookingSchema.set('toJSON', { virtuals: true });
BookingSchema.set('toObject', { virtuals: true });

const Booking = mongoose.model('Booking', BookingSchema);

module.exports = Booking;
