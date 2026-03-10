const express = require('express');
const router = express.Router();
const carController = require('../controllers/carController');
const { authenticate, optionalAuth, isAdminOrManager } = require('../middleware/authMiddleware');

// Public - anyone can view cars
router.get('/', carController.getAllCarsAPI);
router.get('/stats', authenticate, isAdminOrManager, carController.getCarStats);
router.get('/:carNumber', carController.getCarByNumber);

// Protected - only authenticated admin/manager can modify cars
router.post('/', authenticate, isAdminOrManager, carController.createCar);
router.put('/:carNumber', authenticate, isAdminOrManager, carController.updateCar);
router.delete('/:carNumber', authenticate, isAdminOrManager, carController.deleteCar);

module.exports = router;
