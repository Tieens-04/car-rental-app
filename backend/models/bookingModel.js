const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    customerName: {
        type: String,
        required: [true, 'Tên khách hàng là bắt buộc'],
        trim: true,
        minlength: [3, 'Tên khách hàng phải có ít nhất 3 ký tự'],
        maxlength: [100, 'Tên khách hàng không được vượt quá 100 ký tự']
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
        enum: ['chờ xử lý', 'đã đón', 'hoàn thành', 'đã hủy'],
        default: 'chờ xử lý'
    },
    pickupAt: {
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

// Validate endDate > startDate
BookingSchema.pre('validate', function (next) {
    if (this.startDate && this.endDate && this.endDate <= this.startDate) {
        this.invalidate('endDate', 'Ngày kết thúc phải sau ngày bắt đầu');
    }
    next();
});

// Virtual for number of days
BookingSchema.virtual('numberOfDays').get(function() {
    if (this.startDate && this.endDate) {
        const diffTime = Math.abs(this.endDate - this.startDate);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    return 0;
});

// Enable virtuals in JSON
BookingSchema.set('toJSON', { virtuals: true });
BookingSchema.set('toObject', { virtuals: true });

const Booking = mongoose.model('Booking', BookingSchema);

module.exports = Booking;
