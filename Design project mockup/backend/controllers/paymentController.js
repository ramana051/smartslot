const Payment = require('../models/Payment');
const Booking = require('../models/Booking');

const processPayment = async (req, res) => {
  const { bookingId, amount, method } = req.body;

  try {
    if (!bookingId) {
      return res.status(400).json({ message: 'bookingId is required' });
    }

    const booking = await Booking.findByPk(bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.userId.toString() !== req.user.id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const payment = await Payment.create({
      bookingId,
      userId: req.user.id,
      amount,
      method: method || 'card',
      status: 'completed',
      transactionId: `TXN${Date.now()}`,
    });

    booking.status = 'confirmed';
    await booking.save();

    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { processPayment };
