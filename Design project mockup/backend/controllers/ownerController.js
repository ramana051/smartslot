const { Op } = require('sequelize');
const Turf = require('../models/Turf');
const Booking = require('../models/Booking');

const emitTurf = (req, turf) => {
  const io = req.app.get('io');
  if (io && turf) {
    io.emit('turf:update', { turfId: turf.id, reason: 'owner', discount: turf.discount, slots: turf.slots });
  }
};

const requireVerifiedOwner = (req, res) => {
  const isAdmin = req.user?.role === 'admin';
  if (isAdmin) return true;
  if (req.user?.role === 'owner' && !req.user?.isVerified) {
    res.status(403).json({ message: 'Your owner account is not verified yet. Please wait for admin approval.' });
    return false;
  }
  return true;
};

// GET /api/owner/businesses
const getMyBusinesses = async (req, res) => {
  try {
    const businesses = await Turf.findAll({ where: { ownerId: req.user.id } });
    res.json(businesses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/owner/businesses
const createBusiness = async (req, res) => {
  try {
    if (!requireVerifiedOwner(req, res)) return;
    const businessData = { ...req.body, ownerId: req.user.id, isApproved: false };
    const turf = await Turf.create(businessData);
    emitTurf(req, turf);
    res.status(201).json(turf);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PUT /api/owner/businesses/:id
const updateBusiness = async (req, res) => {
  try {
    if (!requireVerifiedOwner(req, res)) return;
    const isAdmin = req.user.role === 'admin';
    const turf = isAdmin
      ? await Turf.findByPk(req.params.id)
      : await Turf.findOne({ where: { id: req.params.id, ownerId: req.user.id } });

    if (!turf) return res.status(404).json({ message: 'Business not found' });

    const payload = { ...req.body };
    if (!isAdmin && payload.ownerId && payload.ownerId !== req.user.id) {
      delete payload.ownerId;
    }

    await turf.update(payload);
    await turf.reload();
    emitTurf(req, turf);
    res.json(turf);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE /api/owner/businesses/:id
const deleteBusiness = async (req, res) => {
  try {
    if (!requireVerifiedOwner(req, res)) return;
    const isAdmin = req.user.role === 'admin';
    const turf = isAdmin
      ? await Turf.findByPk(req.params.id)
      : await Turf.findOne({ where: { id: req.params.id, ownerId: req.user.id } });

    if (!turf) return res.status(404).json({ message: 'Business not found' });

    await turf.destroy();
    const io = req.app.get('io');
    if (io) io.emit('turf:update', { turfId: req.params.id, reason: 'deleted' });
    res.json({ message: 'Business deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/owner/bookings
const getMyBusinessBookings = async (req, res) => {
  try {
    const myTurfs = await Turf.findAll({
      where: { ownerId: req.user.id },
      attributes: ['id'],
    });
    const turfIds = myTurfs.map((t) => t.id);
    if (turfIds.length === 0) {
      return res.json([]);
    }

    const bookings = await Booking.findAll({
      where: { turfId: { [Op.in]: turfIds } },
      include: [{ model: Turf, as: 'turf', attributes: ['id', 'name', 'address'] }],
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getMyBusinesses,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  getMyBusinessBookings,
};
