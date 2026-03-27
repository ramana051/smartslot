const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getMyBusinesses, createBusiness, updateBusiness, deleteBusiness, getMyBusinessBookings
} = require('../controllers/ownerController');

const router = express.Router();

router.use(protect);
router.use(authorize('owner', 'admin')); // Admin can do owner stuff optionally, but primarily owners

router.route('/businesses')
  .get(getMyBusinesses)
  .post(createBusiness);

router.route('/businesses/:id')
  .put(updateBusiness)
  .delete(deleteBusiness);

router.route('/bookings')
  .get(getMyBusinessBookings);

module.exports = router;
