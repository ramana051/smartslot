const { Op } = require('sequelize');
const Booking = require('../models/Booking');
const Turf = require('../models/Turf');

const getBookings = async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      where: { userId: req.user.id },
      include: [{ model: Turf, as: 'turf', attributes: ['id', 'name', 'category', 'address', 'discount'] }],
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createBooking = async (req, res) => {
  const { turfId, serviceName, category, date, time, price, address } = req.body;

  try {
    if (!turfId) {
      return res.status(400).json({ message: 'turfId is required' });
    }

    const turf = await Turf.findByPk(turfId);
    if (!turf) {
      return res.status(404).json({ message: 'Service not found' });
    }
    if (!turf.isApproved) {
      return res.status(403).json({ message: 'This listing is not yet available for booking' });
    }

    const bookingDate = date || new Date().toISOString().split('T')[0];
    const bookingTime = time || 'Queue Token';
    const slots = Array.isArray(turf.slots) ? [...turf.slots] : [];

    if (bookingTime !== 'Queue Token') {
      const idx = slots.findIndex((s) => s.time === bookingTime);
      if (idx === -1) {
        return res.status(400).json({ message: 'Selected time is not a valid slot for this venue' });
      }
      if (!slots[idx].available) {
        return res.status(400).json({ message: 'This slot is no longer available' });
      }
      slots[idx] = {
        ...slots[idx],
        available: false,
        currentCount: (slots[idx].currentCount || 0) + 1,
      };
      const nextAvailable = Math.max(0, (turf.availableSlots || 0) - 1);
      await turf.update({ slots, availableSlots: nextAvailable });
    }

    const computedPrice =
      typeof price === 'number'
        ? price
        : turf.price * (1 - (turf.discount || 0) / 100) + 20;

    const booking = await Booking.create({
      userId: req.user.id,
      turfId,
      serviceName: serviceName || turf.name,
      category: category || turf.category,
      date: bookingDate,
      time: bookingTime,
      price: computedPrice,
      address: address || turf.address,
      tokenNumber: `T-${Math.floor(Math.random() * 9000) + 1000}`,
      status: 'confirmed',
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('turf:update', { turfId: turf.id, reason: 'booking' });
    }

    const withTurf = await Booking.findByPk(booking.id, {
      include: [{ model: Turf, as: 'turf', attributes: ['id', 'name', 'category', 'address', 'discount'] }],
    });
    res.status(201).json(withTurf);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getBookings, createBooking };
