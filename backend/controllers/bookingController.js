const Booking = require('../models/bookingModel');
const Car = require('../models/carModel');
const { asyncHandler, AppError } = require('../middleware/errorMiddleware');

// Calculate number of rental days
const calculateDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

// Check for booking date overlap (excluding cancelled bookings)
const checkDateOverlap = async (carNumber, startDate, endDate, excludeBookingId = null) => {
    const query = {
        carNumber,
        status: { $nin: ['đã hủy', 'hoàn thành'] },
        $or: [
            {
                startDate: { $lte: new Date(endDate) },
                endDate: { $gte: new Date(startDate) }
            }
        ]
    };

    if (excludeBookingId) {
        query._id = { $ne: excludeBookingId };
    }

    const overlappingBooking = await Booking.findOne(query);
    return overlappingBooking;
};

// Server-side validation for booking data
const validateBookingData = (customerName, carNumber, startDate, endDate, isUpdate = false) => {
    const errors = [];

    // Validate customer name
    if (!customerName || !customerName.trim()) {
        errors.push('Tên khách hàng là bắt buộc');
    } else {
        if (customerName.trim().length < 3) {
            errors.push('Tên khách hàng phải có ít nhất 3 ký tự');
        }
        if (customerName.trim().length > 100) {
            errors.push('Tên khách hàng không được vượt quá 100 ký tự');
        }
    }

    // Validate car number
    if (!carNumber || !carNumber.trim()) {
        errors.push('Vui lòng chọn xe');
    }

    // Validate dates
    if (!startDate) {
        errors.push('Ngày bắt đầu là bắt buộc');
    }
    if (!endDate) {
        errors.push('Ngày kết thúc là bắt buộc');
    }

    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime())) {
            errors.push('Ngày bắt đầu không hợp lệ');
        }
        if (isNaN(end.getTime())) {
            errors.push('Ngày kết thúc không hợp lệ');
        }

        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
            // Only check past date for new bookings
            if (!isUpdate) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (start < today) {
                    errors.push('Ngày bắt đầu không được là quá khứ');
                }
            }

            if (end <= start) {
                errors.push('Ngày kết thúc phải sau ngày bắt đầu');
            }

            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays > 365) {
                errors.push('Thời gian cho thuê không được vượt quá 365 ngày');
            }
        }
    }

    return errors;
};

// GET /bookings API - Get all bookings as JSON with pagination and filtering
const getAllBookingsAPI = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        status,
        carNumber,
        customerName,
        startDateFrom,
        startDateTo,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        myBookings // filter by current user's bookings
    } = req.query;
    
    // Build query
    const query = {};
    
    if (status) {
        query.status = status;
    }
    
    if (carNumber) {
        query.carNumber = { $regex: carNumber, $options: 'i' };
    }
    
    if (customerName) {
        query.customerName = { $regex: customerName, $options: 'i' };
    }
    
    if (startDateFrom || startDateTo) {
        query.startDate = {};
        if (startDateFrom) query.startDate.$gte = new Date(startDateFrom);
        if (startDateTo) query.startDate.$lte = new Date(startDateTo);
    }
    
    // Filter by current user's bookings
    if (myBookings === 'true' && req.user) {
        query.createdBy = req.user.id;
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    
    // Execute queries in parallel
    const [bookings, total] = await Promise.all([
        Booking.find(query)
            .populate('createdBy', 'username fullName')
            .populate('updatedBy', 'username fullName')
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit)),
        Booking.countDocuments(query)
    ]);
    
    // Set pagination headers
    res.set('X-Total-Count', total);
    res.set('X-Page', page);
    res.set('X-Limit', limit);
    
    res.status(200).json({
        success: true,
        data: {
            bookings,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        }
    });
});

// GET /bookings/:bookingId - Get single booking
const getBookingById = asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.bookingId)
        .populate('createdBy', 'username fullName')
        .populate('updatedBy', 'username fullName');
    
    if (!booking) {
        throw new AppError('Không tìm thấy booking', 404, 'BOOKING_NOT_FOUND');
    }
    
    // Get car details
    const car = await Car.findOne({ carNumber: booking.carNumber });
    
    res.status(200).json({
        success: true,
        data: {
            booking,
            car
        }
    });
});

// POST /bookings - Create a new booking
const createBooking = asyncHandler(async (req, res) => {
    const { customerName, carNumber, startDate, endDate, notes } = req.body;

    // Server-side validation
    const validationErrors = validateBookingData(customerName, carNumber, startDate, endDate, false);
    if (validationErrors.length > 0) {
        throw new AppError(validationErrors.join('. '), 400, 'VALIDATION_ERROR');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check if car exists
    const car = await Car.findOne({ carNumber });
    if (!car) {
        throw new AppError('Không tìm thấy xe', 404, 'CAR_NOT_FOUND');
    }

    // Check if car is available
    if (car.status === 'maintenance') {
        throw new AppError('Xe đang được bảo trì, không thể đặt', 400, 'CAR_IN_MAINTENANCE');
    }

    // Check for date overlap with existing bookings
    const overlappingBooking = await checkDateOverlap(carNumber, startDate, endDate);
    if (overlappingBooking) {
        throw new AppError(
            'Ngày đặt xe trùng với booking đã tồn tại (từ ' + 
            new Date(overlappingBooking.startDate).toLocaleDateString('vi-VN') + ' đến ' + 
            new Date(overlappingBooking.endDate).toLocaleDateString('vi-VN') + ')',
            400,
            'DATE_OVERLAP'
        );
    }

    // Calculate total amount
    const numberOfDays = calculateDays(startDate, endDate);
    const totalAmount = numberOfDays * car.pricePerDay;

    // Create booking with user tracking
    const booking = new Booking({
        customerName: customerName.trim(),
        carNumber,
        startDate: start,
        endDate: end,
        totalAmount,
        notes: notes?.trim(),
        createdBy: req.user?.id
    });

    const savedBooking = await booking.save();

    // Update car status to rented only if booking starts today or earlier
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start <= today) {
        await Car.findOneAndUpdate({ carNumber }, { status: 'rented' });
    }

    res.status(201).json({
        success: true,
        message: 'Tạo booking thành công',
        data: savedBooking
    });
});

// PUT /bookings/:bookingId - Update a booking
const updateBooking = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const { customerName, carNumber, startDate, endDate, notes, status } = req.body;

    // Find existing booking
    const existingBooking = await Booking.findById(bookingId);
    if (!existingBooking) {
        throw new AppError('Không tìm thấy booking', 404, 'BOOKING_NOT_FOUND');
    }

    // Prevent editing completed or cancelled bookings
    if (existingBooking.status === 'hoàn thành') {
        throw new AppError('Không thể chỉnh sửa booking đã hoàn thành', 400, 'ALREADY_COMPLETED');
    }
    if (existingBooking.status === 'đã hủy') {
        throw new AppError('Không thể chỉnh sửa booking đã bị hủy', 400, 'ALREADY_CANCELLED');
    }

    // Server-side validation  
    const finalCustomerName = customerName || existingBooking.customerName;
    const finalCarNumber = carNumber || existingBooking.carNumber;
    const finalStartDate = startDate || existingBooking.startDate;
    const finalEndDate = endDate || existingBooking.endDate;

    const validationErrors = validateBookingData(finalCustomerName, finalCarNumber, finalStartDate, finalEndDate, true);
    if (validationErrors.length > 0) {
        throw new AppError(validationErrors.join('. '), 400, 'VALIDATION_ERROR');
    }

    // If dates are being updated, check for overlap
    if (startDate || endDate || carNumber) {
        const overlappingBooking = await checkDateOverlap(finalCarNumber, finalStartDate, finalEndDate, bookingId);
        if (overlappingBooking) {
            throw new AppError(
                'Ngày đặt xe trùng với booking đã tồn tại (từ ' +
                new Date(overlappingBooking.startDate).toLocaleDateString('vi-VN') + ' đến ' +
                new Date(overlappingBooking.endDate).toLocaleDateString('vi-VN') + ')',
                400,
                'DATE_OVERLAP'
            );
        }
    }

    // Recalculate total amount
    let totalAmount = existingBooking.totalAmount;
    if (startDate || endDate || carNumber) {
        const car = await Car.findOne({ carNumber: finalCarNumber });
        if (!car) {
            throw new AppError('Không tìm thấy xe', 404, 'CAR_NOT_FOUND');
        }
        if (car.status === 'maintenance') {
            throw new AppError('Xe đang được bảo trì, không thể đặt', 400, 'CAR_IN_MAINTENANCE');
        }
        const numberOfDays = calculateDays(finalStartDate, finalEndDate);
        totalAmount = numberOfDays * car.pricePerDay;
    }

    // If car changed, update old car status back
    if (carNumber && carNumber !== existingBooking.carNumber) {
        const otherBookingsForOldCar = await Booking.findOne({ 
            carNumber: existingBooking.carNumber, 
            _id: { $ne: bookingId },
            status: { $nin: ['đã hủy', 'hoàn thành'] }
        });
        if (!otherBookingsForOldCar) {
            await Car.findOneAndUpdate({ carNumber: existingBooking.carNumber }, { status: 'available' });
        }
        // Set new car to rented
        await Car.findOneAndUpdate({ carNumber }, { status: 'rented' });
    }

    // Update booking with user tracking
    const updatedBooking = await Booking.findByIdAndUpdate(
        bookingId,
        {
            customerName: finalCustomerName.trim ? finalCustomerName.trim() : finalCustomerName,
            carNumber: finalCarNumber,
            startDate: finalStartDate,
            endDate: finalEndDate,
            totalAmount,
            notes: notes?.trim(),
            status: status || existingBooking.status,
            updatedBy: req.user?.id
        },
        { new: true, runValidators: true }
    );

    res.status(200).json({
        success: true,
        message: 'Cập nhật booking thành công',
        data: updatedBooking
    });
});

// DELETE /bookings/:bookingId - Delete a booking
const deleteBooking = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
        throw new AppError('Không tìm thấy booking', 404, 'BOOKING_NOT_FOUND');
    }

    // Actually delete the booking
    await Booking.findByIdAndDelete(bookingId);

    // Check if there are other active bookings for this car
    const otherBookings = await Booking.findOne({ 
        carNumber: booking.carNumber,
        status: { $nin: ['đã hủy', 'hoàn thành'] }
    });
    
    if (!otherBookings) {
        // No other active bookings, set car status back to available
        await Car.findOneAndUpdate({ carNumber: booking.carNumber }, { status: 'available' });
    }

    res.status(200).json({
        success: true,
        message: 'Xóa booking thành công'
    });
});

// PATCH /bookings/:bookingId/pickup - Nhận xe
const pickupBooking = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
        throw new AppError('Không tìm thấy booking', 404, 'BOOKING_NOT_FOUND');
    }

    // Kiểm tra booking đã được nhận xe chưa
    if (booking.status === 'đã đón') {
        throw new AppError('Booking này đã được nhận xe rồi', 400, 'ALREADY_PICKED_UP');
    }
    if (booking.status === 'hoàn thành') {
        throw new AppError('Booking này đã hoàn thành', 400, 'ALREADY_COMPLETED');
    }
    if (booking.status === 'đã hủy') {
        throw new AppError('Booking này đã bị hủy', 400, 'ALREADY_CANCELLED');
    }

    // Kiểm tra ngày nhận xe phải >= ngày bắt đầu đặt xe
    const now = new Date();
    const startDate = new Date(booking.startDate);
    startDate.setHours(0, 0, 0, 0);

    if (now < startDate) {
        throw new AppError(
            'Chưa đến ngày đặt xe. Ngày bắt đầu: ' + startDate.toLocaleDateString('vi-VN'),
            400,
            'NOT_YET_START_DATE'
        );
    }

    // Cập nhật status và pickupAt
    const updatedBooking = await Booking.findByIdAndUpdate(
        bookingId,
        {
            status: 'đã đón',
            pickupAt: now,
            updatedBy: req.user?.id
        },
        { new: true, runValidators: true }
    );

    res.status(200).json({
        success: true,
        message: 'Nhận xe thành công',
        data: updatedBooking
    });
});

// PATCH /bookings/:bookingId/complete - Hoàn thành booking
const completeBooking = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
        throw new AppError('Không tìm thấy booking', 404, 'BOOKING_NOT_FOUND');
    }

    if (booking.status !== 'đã đón') {
        throw new AppError('Chỉ có thể hoàn thành booking đã nhận xe', 400, 'INVALID_STATUS');
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
        bookingId,
        {
            status: 'hoàn thành',
            updatedBy: req.user?.id
        },
        { new: true, runValidators: true }
    );

    // Check if there are other active bookings for this car
    const otherActiveBookings = await Booking.findOne({
        carNumber: booking.carNumber,
        _id: { $ne: bookingId },
        status: { $nin: ['đã hủy', 'hoàn thành'] }
    });

    if (!otherActiveBookings) {
        await Car.findOneAndUpdate({ carNumber: booking.carNumber }, { status: 'available' });
    }

    res.status(200).json({
        success: true,
        message: 'Hoàn thành booking thành công',
        data: updatedBooking
    });
});

// PATCH /bookings/:bookingId/cancel - Hủy booking
const cancelBooking = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const { reason } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
        throw new AppError('Không tìm thấy booking', 404, 'BOOKING_NOT_FOUND');
    }

    if (booking.status === 'hoàn thành') {
        throw new AppError('Không thể hủy booking đã hoàn thành', 400, 'ALREADY_COMPLETED');
    }
    if (booking.status === 'đã hủy') {
        throw new AppError('Booking này đã bị hủy', 400, 'ALREADY_CANCELLED');
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
        bookingId,
        {
            status: 'đã hủy',
            notes: reason ? (booking.notes ? `${booking.notes}. Lý do hủy: ${reason}` : `Lý do hủy: ${reason}`) : booking.notes,
            updatedBy: req.user?.id
        },
        { new: true, runValidators: true }
    );

    // Check if there are other active bookings for this car
    const otherActiveBookings = await Booking.findOne({
        carNumber: booking.carNumber,
        _id: { $ne: bookingId },
        status: { $nin: ['đã hủy', 'hoàn thành'] }
    });

    if (!otherActiveBookings) {
        await Car.findOneAndUpdate({ carNumber: booking.carNumber }, { status: 'available' });
    }

    res.status(200).json({
        success: true,
        message: 'Hủy booking thành công',
        data: updatedBooking
    });
});

// Get booking statistics
const getBookingStats = asyncHandler(async (req, res) => {
    const [totalBookings, statusStats, revenueStats, monthlyStats] = await Promise.all([
        Booking.countDocuments(),
        Booking.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalRevenue: { $sum: '$totalAmount' }
                }
            }
        ]),
        Booking.aggregate([
            {
                $match: { status: { $nin: ['đã hủy'] } }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$totalAmount' },
                    avgRevenue: { $avg: '$totalAmount' }
                }
            }
        ]),
        Booking.aggregate([
            {
                $match: {
                    createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 },
                    revenue: { $sum: '$totalAmount' }
                }
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } },
            { $limit: 12 }
        ])
    ]);

    res.status(200).json({
        success: true,
        data: {
            totalBookings,
            statusDistribution: statusStats,
            revenue: revenueStats[0] || { totalRevenue: 0, avgRevenue: 0 },
            monthlyTrend: monthlyStats
        }
    });
});

module.exports = {
    getAllBookingsAPI,
    getBookingById,
    createBooking,
    updateBooking,
    deleteBooking,
    pickupBooking,
    completeBooking,
    cancelBooking,
    getBookingStats
};
