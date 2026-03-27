const User = require('../models/User');
const Turf = require('../models/Turf');
const Booking = require('../models/Booking');

// GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({ attributes: { exclude: ['password'] } });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/admin/businesses
const getAllBusinesses = async (req, res) => {
  try {
    const turfs = await Turf.findAll({ include: [{ model: User, as: 'owner', attributes: ['name', 'email'] }] });
    res.json(turfs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PUT /api/admin/businesses/:id/approve
const toggleBusinessApproval = async (req, res) => {
  try {
    const turf = await Turf.findByPk(req.params.id);
    if (!turf) return res.status(404).json({ message: 'Business not found' });

    turf.isApproved = !turf.isApproved;
    await turf.save();
    res.json({ message: `Business ${turf.isApproved ? 'approved' : 'rejected'}`, turf });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/admin/bookings
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: Turf, as: 'turf', attributes: ['id', 'name', 'ownerId'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/admin/stats
const getStats = async (req, res) => {
  try {
    const usersCount = await User.count();
    const businessesCount = await Turf.count();
    const bookingsCount = await Booking.count();
    res.json({ usersCount, businessesCount, bookingsCount });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/admin/pending-owners
const getPendingOwners = async (req, res) => {
  try {
    const owners = await User.findAll({
      where: { role: 'owner', verificationStatus: 'pending' },
      attributes: {
        exclude: ['password'],
      },
      order: [['createdAt', 'DESC']],
    });
    res.json(owners);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PUT /api/admin/approve-owner/:id
const approveOwner = async (req, res) => {
  try {
    const owner = await User.findByPk(req.params.id);
    if (!owner || owner.role !== 'owner') return res.status(404).json({ message: 'Owner not found' });

    owner.isVerified = true;
    owner.verificationStatus = 'verified';
    await owner.save();

    res.json({ message: 'Owner verified successfully', owner });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PUT /api/admin/reject-owner/:id
const rejectOwner = async (req, res) => {
  try {
    const owner = await User.findByPk(req.params.id);
    if (!owner || owner.role !== 'owner') return res.status(404).json({ message: 'Owner not found' });

    owner.isVerified = false;
    owner.verificationStatus = 'rejected';
    await owner.save();

    res.json({ message: 'Owner rejected successfully', owner });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllUsers,
  getAllBusinesses,
  toggleBusinessApproval,
  getAllBookings,
  getStats,
  getPendingOwners,
  approveOwner,
  rejectOwner,
};
