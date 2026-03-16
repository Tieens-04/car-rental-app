const Booking = require('../models/bookingModel');
const Car = require('../models/carModel');
const { asyncHandler, AppError } = require('../middleware/errorMiddleware');

const isAdminUser = (user) => user?.role === 'admin';
const normalizeStatus = (status) => {
    if (status === 'chờ xử lý') return 'chờ xác nhận';
    if (status === 'đã đón') return 'đã nhận xe';
    return status;
};

const isBookingOverdue = (booking) => {
    if (!booking) return false;
    const status = normalizeStatus(booking.status);
    if (status !== 'đã nhận xe' && status !== 'quá hạn trả xe') return false;
    return new Date() > new Date(booking.endDate);
};

const ensureBookingAccess = (booking, user, { adminOnly = false } = {}) => {
    if (!user) {
        throw new AppError('Vui lòng đăng nhập để truy cập', 401, 'NOT_AUTHENTICATED');
    }

    if (adminOnly && !isAdminUser(user)) {
        throw new AppError('Chỉ admin mới có quyền thực hiện thao tác này', 403, 'FORBIDDEN');
    }

    if (isAdminUser(user)) {
        return;
    }

    // If booking has createdBy set, require it to match current user
    if (booking.createdBy) {
        // booking.createdBy may be an ObjectId or a populated User object.
        const bookingOwnerId = booking.createdBy._id ? booking.createdBy._id.toString() : booking.createdBy.toString();
        if (bookingOwnerId !== user.id.toString()) {
            throw new AppError('Bạn không có quyền truy cập đơn đặt xe này', 403, 'FORBIDDEN');
        }
        return;
    }

    // If createdBy is missing (legacy data), allow access when booking.customerName
    // clearly matches the authenticated user's fullName or username (best-effort fallback).
    const normalizedCustomer = (booking.customerName || '').trim().toLowerCase();
    const userFull = (user.fullName || '').trim().toLowerCase();
    const userName = (user.username || '').trim().toLowerCase();

    if (normalizedCustomer && (normalizedCustomer === userFull || normalizedCustomer === userName)) {
        // best-effort allow access for legacy bookings
        return;
    }

    // Otherwise deny access
    throw new AppError('Bạn không có quyền truy cập đơn đặt xe này', 403, 'FORBIDDEN');
};

const enrichBookingMeta = (bookingDoc) => {
    if (!bookingDoc) return bookingDoc;
    const booking = bookingDoc.toObject ? bookingDoc.toObject() : bookingDoc;
    const overdue = isBookingOverdue(booking);
    return {
        ...booking,
        overdue,
        overdueMs: overdue ? (Date.now() - new Date(booking.endDate).getTime()) : 0
    };
};

// Calculate number of rental days (minimum 1 for same-day rentals)
const calculateDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
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
    const fullNameRegex = /^[A-Za-zÀ-ỹ\s]+$/u;
    if (!customerName || !customerName.trim()) {
        errors.push('Tên người đặt là bắt buộc');
    } else {
        if (customerName.trim().length < 3) {
            errors.push('Tên người đặt phải có ít nhất 3 ký tự');
        }
        if (customerName.trim().length > 100) {
            errors.push('Tên người đặt không được vượt quá 100 ký tự');
        }
        if (!fullNameRegex.test(customerName.trim())) {
            errors.push('Tên người đặt chỉ được chứa chữ cái (Tiếng Việt) và dấu cách');
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

            if (end < start) {
                errors.push('Ngày kết thúc không được trước ngày bắt đầu');
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
    
    // Non-admin users can only see their own bookings
    if (!isAdminUser(req.user)) {
        query.createdBy = req.user.id;
    } else if (myBookings === 'true' && req.user) {
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

    const bookingsWithMeta = bookings.map(enrichBookingMeta);
    
    // Set pagination headers
    res.set('X-Total-Count', total);
    res.set('X-Page', page);
    res.set('X-Limit', limit);
    
    res.status(200).json({
        success: true,
        data: {
            bookings: bookingsWithMeta,
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

    ensureBookingAccess(booking, req.user);
    
    // Get car details
    const car = await Car.findOne({ carNumber: booking.carNumber });
    
    res.status(200).json({
        success: true,
        data: {
            booking: enrichBookingMeta(booking),
            car
        }
    });
});

// POST /bookings - Create a new booking
const createBooking = asyncHandler(async (req, res) => {
    if (isAdminUser(req.user)) {
        throw new AppError('Admin không thể đặt xe. Chỉ khách hàng mới có quyền này.', 403, 'FORBIDDEN');
    }

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
    if (car.status === 'rented') {
        throw new AppError('Xe đang được thuê, vui lòng chọn xe khác', 400, 'CAR_ALREADY_RENTED');
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

    const depositAmount = Math.round(totalAmount * 0.1);
    const remainingAmount = totalAmount - depositAmount;

    // Create booking with user tracking
    const booking = new Booking({
        customerName: customerName.trim(),
        carNumber,
        startDate: start,
        endDate: end,
        totalAmount,
        depositAmount,
        remainingAmount,
        status: 'chờ xác nhận',
        notes: notes?.trim(),
        createdBy: req.user?.id
    });

    const savedBooking = await booking.save();

    // Chỉ cập nhật trạng thái xe sang 'rented' nếu ngày bắt đầu thuê là hôm nay hoặc trước đó
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookingStart = new Date(start);
    bookingStart.setHours(0, 0, 0, 0);
    if (bookingStart <= today) {
        car.status = 'rented';
        await car.save();
    }

    res.status(201).json({
        success: true,
        message: 'Tạo booking thành công. Vui lòng thanh toán cọc 10%',
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

    ensureBookingAccess(existingBooking, req.user);
    const existingStatus = normalizeStatus(existingBooking.status);

    // Prevent editing completed or cancelled bookings
    if (existingStatus === 'hoàn thành') {
        throw new AppError('Không thể chỉnh sửa booking đã hoàn thành', 400, 'ALREADY_COMPLETED');
    }
    if (existingStatus === 'đã hủy') {
        throw new AppError('Không thể chỉnh sửa booking đã bị hủy', 400, 'ALREADY_CANCELLED');
    }
    if (existingStatus === 'đã nhận xe') {
        throw new AppError('Không thể chỉnh sửa booking đã nhận xe', 400, 'ALREADY_PICKED_UP');
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
        if (car.status === 'rented' && finalCarNumber !== existingBooking.carNumber) {
            throw new AppError('Xe đang được thuê, vui lòng chọn xe khác', 400, 'CAR_ALREADY_RENTED');
        }
        const numberOfDays = calculateDays(finalStartDate, finalEndDate);
        totalAmount = numberOfDays * car.pricePerDay;
    }

    const depositAmount = Math.round(totalAmount * 0.1);
    const remainingAmount = totalAmount - depositAmount;

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

    const nextStatus = normalizeStatus(isAdminUser(req.user) && status ? status : existingStatus);

    // Build update data, preserving notes if not provided
    const updateData = {
        customerName: finalCustomerName.trim ? finalCustomerName.trim() : finalCustomerName,
        carNumber: finalCarNumber,
        startDate: finalStartDate,
        endDate: finalEndDate,
        totalAmount,
        depositAmount,
        remainingAmount,
        status: nextStatus,
        updatedBy: req.user?.id
    };
    // Chỉ update notes khi nó được gửi trong request body (bảo toàn notes cũ)
    if (notes !== undefined) {
        updateData.notes = notes?.trim();
    }

    // Update booking with user tracking
    const updatedBooking = await Booking.findByIdAndUpdate(
        bookingId,
        updateData,
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

    ensureBookingAccess(booking, req.user, { adminOnly: true });

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

    ensureBookingAccess(booking, req.user);
    const bookingStatus = normalizeStatus(booking.status);

    // Kiểm tra booking đã được nhận xe chưa
    if (bookingStatus === 'đã nhận xe') {
        throw new AppError('Booking này đã được nhận xe rồi', 400, 'ALREADY_PICKED_UP');
    }
    if (bookingStatus === 'hoàn thành') {
        throw new AppError('Booking này đã hoàn thành', 400, 'ALREADY_COMPLETED');
    }
    if (bookingStatus === 'đã hủy') {
        throw new AppError('Booking này đã bị hủy', 400, 'ALREADY_CANCELLED');
    }
    if (bookingStatus !== 'chờ nhận xe') {
        throw new AppError('Booking chưa được admin xác nhận', 400, 'NOT_CONFIRMED');
    }
    if (!booking.depositPaidAt) {
        throw new AppError('Vui lòng thanh toán tiền cọc trước khi nhận xe', 400, 'DEPOSIT_NOT_PAID');
    }
    if (!booking.remainingPaidAt) {
        throw new AppError('Vui lòng thanh toán số tiền còn lại trước khi nhận xe', 400, 'REMAINING_NOT_PAID');
    }
    if (isBookingOverdue(booking)) {
        throw new AppError('Booking đã quá hạn trả xe, vui lòng xử lý trả xe', 400, 'BOOKING_OVERDUE');
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
            status: 'đã nhận xe',
            pickupAt: now,
            updatedBy: req.user?.id
        },
        { new: true, runValidators: true }
    );

    await Car.findOneAndUpdate({ carNumber: booking.carNumber }, { status: 'rented' });

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

    ensureBookingAccess(booking, req.user, { adminOnly: true });
    const bookingStatus = normalizeStatus(booking.status);

    if (bookingStatus !== 'đã nhận xe') {
        if (bookingStatus !== 'quá hạn trả xe') {
            throw new AppError('Chỉ có thể hoàn thành booking đã nhận xe', 400, 'INVALID_STATUS');
        }
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

// PATCH /bookings/:bookingId/mark-overdue - Đánh dấu quá hạn trả xe
const markOverdueBooking = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
        throw new AppError('Không tìm thấy booking', 404, 'BOOKING_NOT_FOUND');
    }

    ensureBookingAccess(booking, req.user, { adminOnly: true });
    const bookingStatus = normalizeStatus(booking.status);

    if (bookingStatus !== 'đã nhận xe' && bookingStatus !== 'quá hạn trả xe') {
        throw new AppError('Chỉ có thể đánh dấu quá hạn cho booking đã nhận xe', 400, 'INVALID_STATUS');
    }

    if (!isBookingOverdue(booking)) {
        throw new AppError('Booking này chưa quá hạn trả xe', 400, 'NOT_OVERDUE_YET');
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
        bookingId,
        {
            status: 'quá hạn trả xe',
            updatedBy: req.user?.id
        },
        { new: true, runValidators: true }
    );

    res.status(200).json({
        success: true,
        message: 'Đã đánh dấu quá hạn trả xe',
        data: enrichBookingMeta(updatedBooking)
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

    ensureBookingAccess(booking, req.user);
    const bookingStatus = normalizeStatus(booking.status);

    if (bookingStatus === 'hoàn thành') {
        throw new AppError('Không thể hủy booking đã hoàn thành', 400, 'ALREADY_COMPLETED');
    }
    if (bookingStatus === 'đã hủy') {
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

// PATCH /bookings/:bookingId/confirm - Admin xác nhận đơn
const confirmBooking = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
        throw new AppError('Không tìm thấy booking', 404, 'BOOKING_NOT_FOUND');
    }

    ensureBookingAccess(booking, req.user, { adminOnly: true });
    const bookingStatus = normalizeStatus(booking.status);

    if (bookingStatus !== 'chờ xác nhận') {
        throw new AppError('Chỉ có thể xác nhận đơn đang chờ xác nhận', 400, 'INVALID_STATUS');
    }
    if (!booking.depositPaidAt) {
        throw new AppError('Khách hàng chưa thanh toán tiền cọc 10%', 400, 'DEPOSIT_NOT_PAID');
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
        bookingId,
        {
            status: 'chờ nhận xe',
            confirmedAt: new Date(),
            updatedBy: req.user?.id
        },
        { new: true, runValidators: true }
    );

    res.status(200).json({
        success: true,
        message: 'Xác nhận booking thành công',
        data: updatedBooking
    });
});

// PATCH /bookings/:bookingId/pay-deposit - Thanh toán cọc 10%
const payDeposit = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
        throw new AppError('Không tìm thấy booking', 404, 'BOOKING_NOT_FOUND');
    }

    ensureBookingAccess(booking, req.user);
    const bookingStatus = normalizeStatus(booking.status);

    if (bookingStatus === 'đã hủy' || bookingStatus === 'hoàn thành') {
        throw new AppError('Không thể thanh toán cho booking này', 400, 'INVALID_STATUS');
    }
    if (booking.depositPaidAt) {
        throw new AppError('Tiền cọc đã được thanh toán trước đó', 400, 'DEPOSIT_ALREADY_PAID');
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
        bookingId,
        {
            depositPaidAt: new Date(),
            updatedBy: req.user?.id
        },
        { new: true, runValidators: true }
    );

    res.status(200).json({
        success: true,
        message: 'Thanh toán cọc thành công',
        data: updatedBooking
    });
});

// PATCH /bookings/:bookingId/pay-remaining - Thanh toán số tiền còn lại
const payRemaining = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
        throw new AppError('Không tìm thấy booking', 404, 'BOOKING_NOT_FOUND');
    }

    ensureBookingAccess(booking, req.user);
    const bookingStatus = normalizeStatus(booking.status);

    if (!booking.depositPaidAt) {
        throw new AppError('Vui lòng thanh toán tiền cọc trước', 400, 'DEPOSIT_NOT_PAID');
    }
    if (bookingStatus !== 'chờ nhận xe') {
        throw new AppError('Chỉ được thanh toán phần còn lại sau khi admin xác nhận', 400, 'INVALID_STATUS');
    }
    if (booking.remainingPaidAt) {
        throw new AppError('Số tiền còn lại đã được thanh toán trước đó', 400, 'REMAINING_ALREADY_PAID');
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
        bookingId,
        {
            remainingPaidAt: new Date(),
            updatedBy: req.user?.id
        },
        { new: true, runValidators: true }
    );

    res.status(200).json({
        success: true,
        message: 'Thanh toán số tiền còn lại thành công',
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
    confirmBooking,
    payDeposit,
    payRemaining,
    pickupBooking,
    markOverdueBooking,
    completeBooking,
    cancelBooking,
    getBookingStats
};
