const Turf = require('../models/Turf');

const getTurfs = async (req, res) => {
  try {
    const turfs = await Turf.findAll({
      where: { isApproved: true },
      order: [['name', 'ASC']],
    });
    res.json(turfs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTurfById = async (req, res) => {
  try {
    const turf = await Turf.findByPk(req.params.id);
    if (!turf) {
      return res.status(404).json({ message: 'Turf not found' });
    }
    if (!turf.isApproved) {
      return res.status(404).json({ message: 'Turf not found' });
    }
    res.json(turf);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTurfSlots = async (req, res) => {
  try {
    const turf = await Turf.findByPk(req.params.id);
    if (!turf) {
      return res.status(404).json({ message: 'Turf not found' });
    }
    if (!turf.isApproved) {
      return res.status(404).json({ message: 'Turf not found' });
    }
    res.json(turf.slots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getTurfs, getTurfById, getTurfSlots };
