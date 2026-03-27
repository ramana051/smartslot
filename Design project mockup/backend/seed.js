require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize } = require('./config/db');
require('./models/User');
require('./models/Turf');
require('./models/Booking');
require('./models/Payment');
const Turf = require('./models/Turf');
const User = require('./models/User');

const seedTurfs = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB for seeding. Wait for model sync...');
    await sequelize.sync({ alter: true });

    const count = await Turf.count();
    if (count === 0) {
      const turfsData = [
        {
          name: 'Amanora Arena Turf',
          category: 'Turf',
          location: 'Kharadi, Pune',
          address: '123 Sports Complex, Road 1',
          rating: 4.8,
          reviews: 320,
          waitTime: 15,
          availableSlots: 6,
          discount: 20,
          price: 1500,
          image: 'turf',
          services: ['Football 5v5', 'Cricket Net', 'Floodlights'],
          openTime: '06:00',
          closeTime: '23:00',
          isApproved: true,
          slots: [
            { time: '17:00', available: true, maxCapacity: 1, currentCount: 0 },
            { time: '18:00', available: true, maxCapacity: 1, currentCount: 0 },
            { time: '19:00', available: false, maxCapacity: 1, currentCount: 1 },
          ],
        },
        {
          name: 'Golds Gym',
          category: 'Gym',
          location: 'Viman Nagar, Pune',
          address: 'Phoenix Mall, 2nd Floor',
          rating: 4.5,
          reviews: 215,
          waitTime: 0,
          availableSlots: 45,
          discount: 10,
          price: 800,
          image: 'gym',
          services: ['Cardio', 'Weightlifting', 'Yoga'],
          openTime: '05:00',
          closeTime: '22:00',
          isApproved: true,
          slots: [
            { time: '18:00', available: true, maxCapacity: 50, currentCount: 10 },
            { time: '19:00', available: true, maxCapacity: 50, currentCount: 20 },
          ],
        },
        {
          name: 'LookWell Salon',
          category: 'Salon',
          location: 'Koregaon Park',
          address: 'Lane 5',
          rating: 4.9,
          reviews: 180,
          waitTime: 30,
          availableSlots: 2,
          discount: 0,
          price: 500,
          image: 'salon',
          services: ['Haircut', 'Spa', 'Massage'],
          openTime: '10:00',
          closeTime: '20:00',
          isApproved: true,
          slots: [
            { time: '12:00', available: true, maxCapacity: 1, currentCount: 0 },
            { time: '14:00', available: true, maxCapacity: 1, currentCount: 0 },
          ],
        },
      ];

      await Turf.bulkCreate(turfsData);
      console.log('Seeded initial turfs successfully!');
    } else {
      console.log('Database already has turfs; skipping turf seed.');
    }

    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@smartslot.dev').toLowerCase();
    const adminPass = process.env.ADMIN_PASSWORD || 'Admin@123';
    const adminExists = await User.findOne({ where: { email: adminEmail } });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(adminPass, 10);
      await User.create({
        name: 'System Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
      });
      console.log(`Seeded admin user: ${adminEmail}`);
    } else {
      console.log('Admin user already exists; skipping admin seed.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedTurfs();
