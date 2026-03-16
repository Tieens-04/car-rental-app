const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticate, isAdminOrManager } = require('../middleware/authMiddleware');

// All booking operations require authentication
router.get('/', authenticate, bookingController.getAllBookingsAPI);
router.get('/stats', authenticate, isAdminOrManager, bookingController.getBookingStats);
router.get('/:bookingId', authenticate, bookingController.getBookingById);
router.post('/', authenticate, bookingController.createBooking);
router.put('/:bookingId', authenticate, bookingController.updateBooking);
router.patch('/:bookingId/confirm', authenticate, bookingController.confirmBooking);
router.patch('/:bookingId/pay-deposit', authenticate, bookingController.payDeposit);
router.patch('/:bookingId/pay-remaining', authenticate, bookingController.payRemaining);
router.patch('/:bookingId/pickup', authenticate, bookingController.pickupBooking);
router.patch('/:bookingId/mark-overdue', authenticate, bookingController.markOverdueBooking);
router.patch('/:bookingId/complete', authenticate, bookingController.completeBooking);
router.patch('/:bookingId/cancel', authenticate, bookingController.cancelBooking);
router.delete('/:bookingId', authenticate, bookingController.deleteBooking);

module.exports = router;
