const express = require('express');
const router = express.Router();
const { getTurfs, getTurfById, getTurfSlots } = require('../controllers/turfController');

router.get('/', getTurfs);
router.get('/:id', getTurfById);
router.get('/:id/slots', getTurfSlots);

module.exports = router;
