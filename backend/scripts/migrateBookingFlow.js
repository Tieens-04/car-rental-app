require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../config/config');
const Booking = require('../models/bookingModel');

const mapLegacyStatus = (status) => {
    if (status === 'chờ xử lý') return 'chờ xác nhận';
    if (status === 'đã đón') return 'đã nhận xe';
    return status;
};

const migrate = async () => {
    try {
        await mongoose.connect(config.mongodbUri);
        console.log('Connected to MongoDB');

        const bookings = await Booking.find({});
        let updatedCount = 0;

        for (const booking of bookings) {
            let changed = false;
            const updates = {};

            const normalizedStatus = mapLegacyStatus(booking.status);
            if (normalizedStatus !== booking.status) {
                updates.status = normalizedStatus;
                changed = true;
            }

            if (booking.depositAmount === undefined || booking.depositAmount === null) {
                updates.depositAmount = Math.round((booking.totalAmount || 0) * 0.1);
                changed = true;
            }

            const targetDeposit = updates.depositAmount ?? booking.depositAmount ?? 0;
            if (booking.remainingAmount === undefined || booking.remainingAmount === null) {
                updates.remainingAmount = Math.max((booking.totalAmount || 0) - targetDeposit, 0);
                changed = true;
            }

            if (normalizedStatus === 'chờ nhận xe' && !booking.confirmedAt) {
                updates.confirmedAt = booking.updatedAt || booking.createdAt;
                changed = true;
            }

            if ((normalizedStatus === 'đã nhận xe' || normalizedStatus === 'hoàn thành') && !booking.depositPaidAt) {
                updates.depositPaidAt = booking.createdAt;
                changed = true;
            }

            if ((normalizedStatus === 'đã nhận xe' || normalizedStatus === 'hoàn thành') && !booking.remainingPaidAt) {
                updates.remainingPaidAt = booking.pickupAt || booking.updatedAt || booking.createdAt;
                changed = true;
            }

            if (normalizedStatus === 'hoàn thành' && !booking.pickupAt) {
                updates.pickupAt = booking.updatedAt || booking.createdAt;
                changed = true;
            }

            if (changed) {
                await Booking.updateOne({ _id: booking._id }, { $set: updates });
                updatedCount += 1;
            }
        }

        console.log(`Migration finished. Updated ${updatedCount}/${bookings.length} bookings.`);
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrate();
