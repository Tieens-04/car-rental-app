require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../config/config');
const Booking = require('../models/bookingModel');
const User = require('../models/userModel');

// Attempt to backfill createdBy for bookings missing it by matching customerName -> user.fullName or username
const run = async () => {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to MongoDB');

    const bookings = await Booking.find({ createdBy: { $exists: false } });
    console.log(`Found ${bookings.length} bookings missing createdBy`);

    let updated = 0;
    for (const b of bookings) {
      const name = (b.customerName || '').trim();
      if (!name) continue;

      // Try exact fullName match (case-insensitive)
      const user = await User.findOne({ fullName: { $regex: `^${name}$`, $options: 'i' } })
        || await User.findOne({ username: { $regex: `^${name}$`, $options: 'i' } });

      if (user) {
        await Booking.updateOne({ _id: b._id }, { $set: { createdBy: user._id } });
        console.log(`Patched booking ${b._id} -> createdBy ${user.username}`);
        updated += 1;
      } else {
        console.log(`No matching user for booking ${b._id} (customerName='${name}')`);
      }
    }

    console.log(`Backfill complete. Updated ${updated} bookings.`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

run();
