const Car = require('../models/carModel');
const Booking = require('../models/bookingModel');
const { asyncHandler, AppError } = require('../middleware/errorMiddleware');

// Get all cars as JSON (API) - with pagination and filtering
const getAllCarsAPI = asyncHandler(async (req, res) => {
    const { 
        page = 1, 
        limit = 10, 
        status, 
        minPrice, 
        maxPrice,
        minCapacity,
        maxCapacity,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = req.query;
    
    // Build query
    const query = {};
    
    if (status) {
        query.status = status;
    }
    
    if (minPrice || maxPrice) {
        query.pricePerDay = {};
        if (minPrice) query.pricePerDay.$gte = parseFloat(minPrice);
        if (maxPrice) query.pricePerDay.$lte = parseFloat(maxPrice);
    }
    
    if (minCapacity || maxCapacity) {
        query.capacity = {};
        if (minCapacity) query.capacity.$gte = parseInt(minCapacity);
        if (maxCapacity) query.capacity.$lte = parseInt(maxCapacity);
    }
    
    if (search) {
        query.$or = [
            { carNumber: { $regex: search, $options: 'i' } },
            { features: { $in: [new RegExp(search, 'i')] } }
        ];
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    
    // Execute queries in parallel
    const [cars, total] = await Promise.all([
        Car.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit)),
        Car.countDocuments(query)
    ]);

    const carNumbers = cars.map((car) => car.carNumber);
    const activeBookings = await Booking.find({
        carNumber: { $in: carNumbers },
        status: { $in: ['chờ xác nhận', 'chờ nhận xe', 'đã nhận xe'] },
        endDate: { $gte: new Date() }
    }).select('carNumber endDate status');

    const rentedUntilByCar = {};
    for (const booking of activeBookings) {
        const key = booking.carNumber;
        const endTime = new Date(booking.endDate).getTime();
        if (!rentedUntilByCar[key] || endTime > rentedUntilByCar[key]) {
            rentedUntilByCar[key] = endTime;
        }
    }

    const enrichedCars = cars.map((car) => {
        const carObject = car.toObject();
        const rentedUntil = rentedUntilByCar[car.carNumber];
        if (rentedUntil) {
            carObject.rentedUntil = new Date(rentedUntil);
        }
            // Nếu không có booking đang thuê, hoặc booking đã hoàn thành, set status là 'available'
            const hasActiveBooking = activeBookings.some(b => b.carNumber === car.carNumber);
            if (!hasActiveBooking && carObject.status === 'rented') {
                carObject.status = 'available';
            }
            return carObject;
    });
    
    // Set pagination headers
    res.set('X-Total-Count', total);
    res.set('X-Page', page);
    res.set('X-Limit', limit);
    
    res.status(200).json({
        success: true,
        data: {
            cars: enrichedCars,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        }
    });
});

// Get single car by carNumber
const getCarByNumber = asyncHandler(async (req, res) => {
    const car = await Car.findOne({ carNumber: req.params.carNumber });
    
    if (!car) {
        throw new AppError('Không tìm thấy xe', 404, 'CAR_NOT_FOUND');
    }
    
    // Get booking info for this car
    const activeBookings = await Booking.find({
        carNumber: car.carNumber,
        endDate: { $gte: new Date() },
        status: { $nin: ['đã hủy', 'hoàn thành'] }
    })
        .select('customerName startDate endDate status')
        .sort({ startDate: 1 });
    
    res.status(200).json({
        success: true,
        data: {
            car,
            activeBookings
        }
    });
});

// Create a new car
const createCar = asyncHandler(async (req, res) => {
    const { carNumber, capacity, status, pricePerDay, features, brand, model, year, fuelType, transmission, imageUrl, description } = req.body;

    // Server-side validation
    if (!carNumber || !carNumber.trim()) {
        throw new AppError('Biển số xe là bắt buộc', 400, 'VALIDATION_ERROR');
    }
    if (!capacity || isNaN(capacity) || parseInt(capacity) < 1) {
        throw new AppError('Số chỗ ngồi phải là số nguyên dương (>= 1)', 400, 'VALIDATION_ERROR');
    }
    if (parseInt(capacity) > 100) {
        throw new AppError('Số chỗ ngồi không được vượt quá 100', 400, 'VALIDATION_ERROR');
    }
    if (!pricePerDay || isNaN(pricePerDay) || parseFloat(pricePerDay) < 0) {
        throw new AppError('Giá thuê phải là số không âm', 400, 'VALIDATION_ERROR');
    }

    // Check if car already exists
    const existingCar = await Car.findOne({ carNumber: carNumber.trim() });
    if (existingCar) {
        throw new AppError('Xe với biển số này đã tồn tại', 400, 'DUPLICATE_CAR');
    }

    // Process features
    let processedFeatures = [];
    if (features) {
        if (Array.isArray(features)) {
            processedFeatures = features.map(f => f.trim()).filter(f => f);
        } else if (typeof features === 'string') {
            processedFeatures = features.split(',').map(f => f.trim()).filter(f => f);
        }
    }

    const carData = {
        carNumber: carNumber.trim(),
        capacity: parseInt(capacity),
        status: status || 'available',
        pricePerDay: parseFloat(pricePerDay),
        features: processedFeatures
    };

    // Persist optional fields
    if (brand !== undefined) carData.brand = brand.trim();
    if (model !== undefined) carData.model = model.trim();
    if (year !== undefined) carData.year = parseInt(year);
    if (fuelType !== undefined) carData.fuelType = fuelType;
    if (transmission !== undefined) carData.transmission = transmission;
    if (imageUrl !== undefined) carData.imageUrl = imageUrl.trim();
    if (description !== undefined) carData.description = description.trim();

    const car = new Car(carData);

    const savedCar = await car.save();
    
    res.status(201).json({
        success: true,
        message: 'Thêm xe thành công',
        data: savedCar
    });
});

// Update a car
const updateCar = asyncHandler(async (req, res) => {
    const { carNumber } = req.params;
    const { capacity, status, pricePerDay, features, brand, model, year, fuelType, transmission, imageUrl, description } = req.body;

    // Server-side validation
    if (capacity !== undefined) {
        if (isNaN(capacity) || parseInt(capacity) < 1) {
            throw new AppError('Số chỗ ngồi phải là số nguyên dương (>= 1)', 400, 'VALIDATION_ERROR');
        }
        if (parseInt(capacity) > 100) {
            throw new AppError('Số chỗ ngồi không được vượt quá 100', 400, 'VALIDATION_ERROR');
        }
    }
    if (pricePerDay !== undefined) {
        if (isNaN(pricePerDay) || parseFloat(pricePerDay) < 0) {
            throw new AppError('Giá thuê phải là số không âm', 400, 'VALIDATION_ERROR');
        }
    }

    // Build update data
    const updateData = {};
    if (capacity !== undefined) updateData.capacity = parseInt(capacity);
    if (status) updateData.status = status;
    if (pricePerDay !== undefined) updateData.pricePerDay = parseFloat(pricePerDay);
    if (features !== undefined) {
        if (Array.isArray(features)) {
            updateData.features = features.map(f => f.trim()).filter(f => f);
        } else if (typeof features === 'string') {
            updateData.features = features.split(',').map(f => f.trim()).filter(f => f);
        }
    }
    // Update optional fields
    if (brand !== undefined) updateData.brand = brand.trim();
    if (model !== undefined) updateData.model = model.trim();
    if (year !== undefined) updateData.year = parseInt(year);
    if (fuelType !== undefined) updateData.fuelType = fuelType;
    if (transmission !== undefined) updateData.transmission = transmission;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl.trim();
    if (description !== undefined) updateData.description = description.trim();

    const car = await Car.findOneAndUpdate(
        { carNumber },
        updateData,
        { new: true, runValidators: true }
    );

    if (!car) {
        throw new AppError('Không tìm thấy xe', 404, 'CAR_NOT_FOUND');
    }

    res.status(200).json({
        success: true,
        message: 'Cập nhật xe thành công',
        data: car
    });
});

// Delete a car
const deleteCar = asyncHandler(async (req, res) => {
    const { carNumber } = req.params;

    // Check if car has active bookings
    const activeBooking = await Booking.findOne({ 
        carNumber,
        endDate: { $gte: new Date() },
        status: { $nin: ['hoàn thành', 'đã hủy'] }
    });
    
    if (activeBooking) {
        throw new AppError(
            'Không thể xóa xe đang có booking hoạt động. Hãy hoàn thành hoặc hủy các booking liên quan trước.',
            400,
            'CAR_HAS_ACTIVE_BOOKING'
        );
    }

    const car = await Car.findOneAndDelete({ carNumber });

    if (!car) {
        throw new AppError('Không tìm thấy xe', 404, 'CAR_NOT_FOUND');
    }

    // Also delete past bookings for this car
    const deletedBookings = await Booking.deleteMany({ carNumber });

    res.status(200).json({
        success: true,
        message: 'Xóa xe thành công',
        data: {
            deletedCar: car,
            deletedBookingsCount: deletedBookings.deletedCount
        }
    });
});

// Get car statistics
const getCarStats = asyncHandler(async (req, res) => {
    const [totalCars, stats, topBookedCars] = await Promise.all([
        Car.countDocuments(),
        Car.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    avgPrice: { $avg: '$pricePerDay' }
                }
            }
        ]),
        Booking.aggregate([
            {
                $match: {
                    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
                }
            },
            {
                $group: {
                    _id: '$carNumber',
                    bookingCount: { $sum: 1 },
                    totalRevenue: { $sum: '$totalAmount' }
                }
            },
            { $sort: { bookingCount: -1 } },
            { $limit: 5 }
        ])
    ]);
    
    res.status(200).json({
        success: true,
        data: {
            totalCars,
            statusDistribution: stats,
            topBookedCars
        }
    });
});

module.exports = {
    getAllCarsAPI,
    getCarByNumber,
    createCar,
    updateCar,
    deleteCar,
    getCarStats
};
