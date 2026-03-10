const mongoose = require('mongoose');

const CarSchema = new mongoose.Schema({
    carNumber: {
        type: String,
        required: [true, 'Biển số xe là bắt buộc'],
        unique: true,
        trim: true,
        minlength: [3, 'Biển số xe phải có ít nhất 3 ký tự'],
        maxlength: [20, 'Biển số xe không được quá 20 ký tự']
    },
    capacity: {
        type: Number,
        required: [true, 'Số chỗ ngồi là bắt buộc'],
        min: [1, 'Số chỗ ngồi phải ít nhất là 1'],
        max: [100, 'Số chỗ ngồi không được vượt quá 100']
    },
    status: {
        type: String,
        enum: {
            values: ['available', 'rented', 'maintenance'],
            message: 'Trạng thái phải là available, rented hoặc maintenance'
        },
        default: 'available'
    },
    pricePerDay: {
        type: Number,
        required: [true, 'Giá thuê mỗi ngày là bắt buộc'],
        min: [0, 'Giá thuê không được âm']
    },
    features: {
        type: [String],
        default: []
    },
    brand: {
        type: String,
        trim: true,
        maxlength: [50, 'Hãng xe không được quá 50 ký tự']
    },
    model: {
        type: String,
        trim: true,
        maxlength: [50, 'Model xe không được quá 50 ký tự']
    },
    year: {
        type: Number,
        min: [1900, 'Năm sản xuất không hợp lệ'],
        max: [new Date().getFullYear() + 1, 'Năm sản xuất không được lớn hơn năm hiện tại']
    },
    fuelType: {
        type: String,
        enum: ['petrol', 'diesel', 'electric', 'hybrid'],
        default: 'petrol'
    },
    transmission: {
        type: String,
        enum: ['manual', 'automatic'],
        default: 'manual'
    },
    imageUrl: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        maxlength: [500, 'Mô tả không được quá 500 ký tự']
    }
}, {
    timestamps: true
});

// Indexes for better query performance
CarSchema.index({ status: 1 });
CarSchema.index({ pricePerDay: 1 });
CarSchema.index({ capacity: 1 });
CarSchema.index({ brand: 1, model: 1 });
CarSchema.index({ createdAt: -1 });

// Virtual for formatted price
CarSchema.virtual('formattedPrice').get(function() {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(this.pricePerDay);
});

// Enable virtuals in JSON
CarSchema.set('toJSON', { virtuals: true });
CarSchema.set('toObject', { virtuals: true });

const Car = mongoose.model('Car', CarSchema);

module.exports = Car;
