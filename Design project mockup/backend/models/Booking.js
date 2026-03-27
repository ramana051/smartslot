const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');
const Turf = require('./Turf');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  serviceName: { type: DataTypes.STRING, allowNull: false },
  category: { type: DataTypes.STRING, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  time: { type: DataTypes.STRING, allowNull: false },
  status: { 
    type: DataTypes.ENUM('pending', 'confirmed', 'completed', 'cancelled'),
    defaultValue: 'confirmed' 
  },
  tokenNumber: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  price: { type: DataTypes.FLOAT, allowNull: false },
  address: { type: DataTypes.STRING, allowNull: false },
}, {
  timestamps: true,
});

// Relationships
User.hasMany(Booking, { foreignKey: 'userId', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Turf.hasMany(Booking, { foreignKey: 'turfId', as: 'bookings' });
Booking.belongsTo(Turf, { foreignKey: 'turfId', as: 'turf' });

module.exports = Booking;
