require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/userModel');
const Car = require('../models/carModel');
const config = require('../config/config');

const seedData = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(config.mongodbUri);
        console.log('✅ Connected to MongoDB');

        // Clear existing data (optional - comment out if you want to keep existing data)
        // await User.deleteMany({});
        // await Car.deleteMany({});
        // console.log('🗑️ Cleared existing data');

        // Check if admin user exists
        const existingAdmin = await User.findOne({ username: 'admin' });
        
        if (!existingAdmin) {
            // Create admin user
            const adminUser = await User.create({
                username: 'admin',
                email: 'admin@carrental.com',
                password: 'admin123',
                fullName: 'Administrator',
                phone: '0123456789',
                role: 'admin'
            });
            console.log('👤 Created admin user:', adminUser.username);
        } else {
            console.log('👤 Admin user already exists');
        }

        // Check if manager exists
        const existingManager = await User.findOne({ username: 'manager' });
        
        if (!existingManager) {
            const managerUser = await User.create({
                username: 'manager',
                email: 'manager@carrental.com',
                password: 'manager123',
                fullName: 'Manager User',
                phone: '0987654321',
                role: 'manager'
            });
            console.log('👤 Created manager user:', managerUser.username);
        } else {
            console.log('👤 Manager user already exists');
        }

        // Check if regular user exists
        const existingUser = await User.findOne({ username: 'user' });
        
        if (!existingUser) {
            const regularUser = await User.create({
                username: 'user',
                email: 'user@carrental.com',
                password: 'user123',
                fullName: 'Regular User',
                phone: '0111222333',
                role: 'user'
            });
            console.log('👤 Created regular user:', regularUser.username);
        } else {
            console.log('👤 Regular user already exists');
        }

        // Create sample cars if none exist
        const carCount = await Car.countDocuments();
        
        if (carCount === 0) {
            const sampleCars = [
                {
                    carNumber: '30A-12345',
                    capacity: 4,
                    status: 'available',
                    pricePerDay: 500000,
                    features: ['Điều hòa', 'GPS', 'Camera lùi'],
                    brand: 'Toyota',
                    model: 'Vios',
                    year: 2022,
                    fuelType: 'petrol',
                    transmission: 'automatic',
                    description: 'Xe Toyota Vios mới, tiết kiệm nhiên liệu'
                },
                {
                    carNumber: '30B-67890',
                    capacity: 7,
                    status: 'available',
                    pricePerDay: 800000,
                    features: ['Điều hòa', 'GPS', 'Camera 360', 'Cửa sổ trời'],
                    brand: 'Honda',
                    model: 'CR-V',
                    year: 2023,
                    fuelType: 'petrol',
                    transmission: 'automatic',
                    description: 'Xe Honda CR-V 7 chỗ rộng rãi'
                },
                {
                    carNumber: '30C-11111',
                    capacity: 5,
                    status: 'available',
                    pricePerDay: 600000,
                    features: ['Điều hòa', 'Bluetooth', 'USB'],
                    brand: 'Hyundai',
                    model: 'Accent',
                    year: 2021,
                    fuelType: 'petrol',
                    transmission: 'manual',
                    description: 'Xe Hyundai Accent số sàn tiết kiệm'
                },
                {
                    carNumber: '30D-22222',
                    capacity: 4,
                    status: 'maintenance',
                    pricePerDay: 1200000,
                    features: ['Điều hòa', 'GPS', 'Ghế da', 'Sạc không dây'],
                    brand: 'Mercedes',
                    model: 'C200',
                    year: 2023,
                    fuelType: 'petrol',
                    transmission: 'automatic',
                    description: 'Xe Mercedes C200 sang trọng'
                },
                {
                    carNumber: '30E-33333',
                    capacity: 16,
                    status: 'available',
                    pricePerDay: 1500000,
                    features: ['Điều hòa', 'Micro', 'TV'],
                    brand: 'Ford',
                    model: 'Transit',
                    year: 2022,
                    fuelType: 'diesel',
                    transmission: 'manual',
                    description: 'Xe Ford Transit 16 chỗ'
                }
            ];

            await Car.insertMany(sampleCars);
            console.log('🚗 Created', sampleCars.length, 'sample cars');
        } else {
            console.log('🚗 Cars already exist:', carCount);
        }

        console.log('\n✅ Seed data completed successfully!');
        console.log('\n📋 Test accounts:');
        console.log('   Admin: username=admin, password=admin123');
        console.log('   Manager: username=manager, password=manager123');
        console.log('   User: username=user, password=user123');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
