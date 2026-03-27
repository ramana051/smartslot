const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const User = require('../models/User');
const Turf = require('../models/Turf');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
const phoneRegex = /^[0-9+\-()\s]{8,}$/;

const normalizeEmail = (email) => String(email).trim().toLowerCase();

const validateEmail = (email) => {
  if (!email) return 'Email is required';
  if (!emailRegex.test(email)) return 'Invalid email format';
  return null;
};

const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (!passRegex.test(password)) {
    return 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character';
  }
  return null;
};

const validatePhone = (phone) => {
  if (phone === undefined) return null;
  if (phone === null || phone === '') return null; // allow clearing
  if (!phoneRegex.test(String(phone))) return 'Invalid phone number';
  return null;
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const {
      name,
      email,
      phone,
      password,
      businessName,
      businessAddress,
      businessType,
    } = req.body || {};

    // Validate fields only if the client sent them
    if (name !== undefined) {
      if (!name || String(name).trim().length < 2) {
        return res.status(400).json({ message: 'Name must be at least 2 characters' });
      }
    }

    if (email !== undefined) {
      const emailErr = validateEmail(String(email));
      if (emailErr) return res.status(400).json({ message: emailErr });
      const normalized = normalizeEmail(email);

      // Prevent duplicates (excluding self)
      const emailExists = await User.findOne({
        where: {
          email: normalized,
          id: { [Op.ne]: user.id },
        },
      });
      if (emailExists) return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const phoneErr = validatePhone(phone);
    if (phoneErr) return res.status(400).json({ message: phoneErr });

    if (password !== undefined) {
      if (!password) return res.status(400).json({ message: 'Password is required' });
      const passErr = validatePassword(String(password));
      if (passErr) return res.status(400).json({ message: passErr });
    }

    const updatePayload = {};
    if (name !== undefined) updatePayload.name = String(name).trim();
    if (email !== undefined) updatePayload.email = normalizeEmail(email);
    if (phone !== undefined) updatePayload.phone = phone === '' ? null : phone;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updatePayload.password = await bcrypt.hash(password, salt);
    }

    // Owner business/profile fields
    const isOwner = user.role === 'owner';
    if (isOwner) {
      if (businessName !== undefined) {
        if (!businessName || String(businessName).trim().length < 2) {
          return res.status(400).json({ message: 'Business name must be at least 2 characters' });
        }
        updatePayload.businessName = businessName;
      }
      if (businessAddress !== undefined) {
        if (!businessAddress || String(businessAddress).trim().length < 5) {
          return res.status(400).json({ message: 'Business address must be at least 5 characters' });
        }
        updatePayload.businessAddress = businessAddress;
      }
      if (businessType !== undefined) {
        if (!businessType || String(businessType).trim().length < 2) {
          return res.status(400).json({ message: 'Business type must be at least 2 characters' });
        }
        updatePayload.businessType = businessType;
      }
    }

    await user.update(updatePayload);
    await user.reload();

    // Keep Turf in sync with owner profile for the primary business
    if (isOwner && user.primaryTurfId) {
      const turf = await Turf.findByPk(user.primaryTurfId);
      if (turf && turf.ownerId === user.id) {
        await turf.update({
          name: user.businessName ?? turf.name,
          address: user.businessAddress ?? turf.address,
          category: user.businessType ?? turf.category,
        });
      }
    }

    const updated = await User.findByPk(user.id, { attributes: { exclude: ['password'] } });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getProfile, updateProfile };

