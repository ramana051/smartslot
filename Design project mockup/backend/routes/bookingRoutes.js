const express = require('express');
const router = express.Router();
const { getBookings, createBooking } = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getBookings).post(protect, createBooking);

module.exports = router;
