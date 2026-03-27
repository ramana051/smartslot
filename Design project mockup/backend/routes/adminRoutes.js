const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getAllUsers,
  getAllBusinesses,
  toggleBusinessApproval,
  getAllBookings,
  getStats,
  getPendingOwners,
  approveOwner,
  rejectOwner,
} = require('../controllers/adminController');

const router = express.Router();

router.use(protect);
router.use(authorize('admin')); // STRICTLY Admin

router.get('/users', getAllUsers);
router.get('/businesses', getAllBusinesses);
router.put('/businesses/:id/approve', toggleBusinessApproval);
router.get('/bookings', getAllBookings);
router.get('/stats', getStats);
router.get('/pending-owners', getPendingOwners);
router.put('/approve-owner/:id', approveOwner);
router.put('/reject-owner/:id', rejectOwner);

module.exports = router;
