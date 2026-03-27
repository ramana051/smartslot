const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Turf = require('../models/Turf');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
const phoneRegex = /^[0-9+\-()\s]{8,}$/;

const validateEmailPassword = (email, password) => {
  if (!email || !password) {
    return 'Email and password are required';
  }
  if (!emailRegex.test(email)) {
    return 'Invalid email format';
  }
  if (!passRegex.test(password)) {
    return 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character';
  }
  return null;
};

const registerWithRole = async (req, res, forcedRole) => {
  try {
    const { name, email, password, role: bodyRole } = req.body;
    const role = forcedRole || bodyRole;

    if (!name || String(name).trim().length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters' });
    }

    const validation = validateEmailPassword(email, password);
    if (validation) {
      return res.status(400).json({ message: validation });
    }

    if (role === 'admin') {
      return res.status(403).json({ message: 'Admin accounts cannot be registered publicly' });
    }

    const validRole = role === 'owner' ? 'owner' : 'user';
    if (forcedRole && role !== forcedRole) {
      return res.status(400).json({ message: 'Invalid registration type' });
    }

    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      password: hashedPassword,
      role: validRole,
    });

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user.id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const registerUser = (req, res) => registerWithRole(req, res, 'user');
const registerOwner = (req, res) => registerWithRole(req, res, 'owner');

// Enhanced Owner Registration with admin verification + initial business listing
// POST /api/auth/register-owner
const registerOwnerWithVerification = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      businessName,
      businessType,
      address,
      businessLocation,
      description,
      proof,
    } = req.body || {};

    if (!name || String(name).trim().length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters' });
    }

    const validation = validateEmailPassword(email, password);
    if (validation) return res.status(400).json({ message: validation });

    if (!phone || !phoneRegex.test(String(phone))) {
      return res.status(400).json({ message: 'Phone number is required and must be valid' });
    }

    if (!businessName || String(businessName).trim().length < 2) {
      return res.status(400).json({ message: 'Business name is required' });
    }
    if (!businessType || String(businessType).trim().length < 2) {
      return res.status(400).json({ message: 'Business type is required' });
    }
    if (!address || String(address).trim().length < 5) {
      return res.status(400).json({ message: 'Business address is required' });
    }

    // Prevent duplicates
    const normalizedEmail = String(email).trim().toLowerCase();
    const userExists = await User.findOne({ where: { email: normalizedEmail } });
    if (userExists) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const owner = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      phone: String(phone).trim(),
      password: hashedPassword,
      role: 'owner',
      isVerified: false,
      verificationStatus: 'pending',
      businessName: String(businessName).trim(),
      businessAddress: String(address).trim(),
      businessType: String(businessType).trim(),
      businessDescription: description ? String(description) : null,
      businessProof: proof ? String(proof) : null,
    });

    // Create an initial business listing pending admin approval.
    // Turf requires price + open/close hours, so we set safe defaults.
    const turf = await Turf.create({
      ownerId: owner.id,
      name: String(businessName).trim(),
      category: String(businessType).trim(),
      location: businessLocation ? String(businessLocation).trim() : String(address).trim(),
      address: String(address).trim(),
      price: 1000,
      openTime: '06:00',
      closeTime: '23:00',
      discount: 0,
      services: [],
      slots: [],
      isApproved: false,
    });

    owner.primaryTurfId = turf.id;
    await owner.save();

    res.status(201).json({
      id: owner.id,
      name: owner.name,
      email: owner.email,
      phone: owner.phone,
      role: owner.role,
      isVerified: owner.isVerified,
      verificationStatus: owner.verificationStatus,
      businessName: owner.businessName,
      businessAddress: owner.businessAddress,
      businessType: owner.businessType,
      token: generateToken(owner.id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ where: { email: String(email).trim().toLowerCase() } });
    if (user && (await bcrypt.compare(password, user.password))) {
      if (user.role !== 'user') {
        return res.status(403).json({ message: 'Use the business owner login for this account' });
      }
      return res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user.id),
      });
    }
    res.status(401).json({ message: 'Invalid email or password' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const loginOwner = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ where: { email: String(email).trim().toLowerCase() } });
    if (user && (await bcrypt.compare(password, user.password))) {
      if (user.role !== 'owner' && user.role !== 'admin') {
        return res.status(403).json({ message: 'This login is for business owners only' });
      }
      const payload = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        verificationStatus: user.verificationStatus,
        token: generateToken(user.id),
      };
      if (user.role === 'owner') {
        payload.phone = user.phone;
        payload.businessName = user.businessName;
        payload.businessAddress = user.businessAddress;
        payload.businessType = user.businessType;
      }
      return res.json({
        ...payload,
      });
    }
    res.status(401).json({ message: 'Invalid email or password' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ where: { email: String(email).trim().toLowerCase() } });
    if (user && (await (password, user.password))) {
      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Administrator access only' });
      }
      return res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user.id),
      });
    }
    res.status(401).json({ message: 'Invalid email or password' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  registerUser,
  registerOwner,
  registerOwnerWithVerification,
  loginUser,
  loginOwner,
  loginAdmin,
  getUserProfile,
};
