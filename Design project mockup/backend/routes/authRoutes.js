const express = require('express');
const router = express.Router();
const {
  registerUser,
  registerOwner,
  registerOwnerWithVerification,
  loginUser,
  loginOwner,
  loginAdmin,
  getUserProfile,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/register/user', registerUser);
router.post('/register/owner', registerOwner);
router.post('/register-owner', registerOwnerWithVerification);

router.post('/login', loginUser);
router.post('/login/user', loginUser);
router.post('/login/owner', loginOwner);
router.post('/login/admin', loginAdmin);

router.get('/me', protect, getUserProfile);

module.exports = router;
