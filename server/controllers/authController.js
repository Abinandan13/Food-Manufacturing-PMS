const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
};

// @desc   Register / Create a new user (Admin only — NOT public)
// @route  POST /api/auth/register
// @access Protected — Admin only
exports.register = async (req, res, next) => {
  try {
    const { name, username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide username, email and password' });
    }

    if (username.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Username must be at least 3 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
    }

    const userExists = await User.findOne({
      $or: [
        { email: email.trim().toLowerCase() },
        { username: username.trim() }
      ]
    });

    if (userExists) {
      if (userExists.username.toLowerCase() === username.trim().toLowerCase()) {
        return res.status(400).json({ success: false, message: 'Username is already taken' });
      }
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    // Only allow Production Manager or Inventory Manager roles to be created.
    // Non-admin users cannot create Admin accounts.
    const allowedRoles = ['Production Manager', 'Inventory Manager'];
    const assignedRole = allowedRoles.includes(role) ? role : 'Production Manager';

    const user = await User.create({
      name: name?.trim() || '',
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: assignedRole,
      status: 'Active',
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Login user
// @route  POST /api/auth/login
// @access Public
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Please provide username and password' });
    }

    const user = await User.findOne({
      $or: [{ username: username.trim() }, { email: username.trim().toLowerCase() }],
    }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if account is active
    if (user.status === 'Inactive') {
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive. Please contact the administrator.',
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Get current user
// @route  GET /api/auth/me
// @access Protected
exports.getMe = async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
      status: req.user.status,
    },
  });
};

// ─── USER MANAGEMENT (Admin Only) ──────────────────────────────

// @desc   Get all users
// @route  GET /api/auth/users
// @access Protected — Admin only
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

// @desc   Get single user by ID
// @route  GET /api/auth/users/:id
// @access Protected — Admin only
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc   Update user
// @route  PUT /api/auth/users/:id
// @access Protected — Admin only
exports.updateUser = async (req, res, next) => {
  try {
    const { name, email, role, status, password } = req.body;

    const user = await User.findById(req.params.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent non-Admin roles from being assigned 'Admin'
    if (role && role === 'Admin' && user.role !== 'Admin') {
      return res.status(400).json({ success: false, message: 'Cannot promote users to Admin role' });
    }

    // Prevent demoting the last Admin
    if (user.role === 'Admin' && role && role !== 'Admin') {
      const adminCount = await User.countDocuments({ role: 'Admin', status: 'Active' });
      if (adminCount <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot change role of the last active Admin' });
      }
    }

    // Prevent deactivating the last Admin
    if (user.role === 'Admin' && status === 'Inactive') {
      const adminCount = await User.countDocuments({ role: 'Admin', status: 'Active' });
      if (adminCount <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot deactivate the last active Admin' });
      }
    }

    if (name !== undefined) user.name = name.trim();
    if (email) {
      // Check email uniqueness
      const emailExists = await User.findOne({ email: email.trim().toLowerCase(), _id: { $ne: user._id } });
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'Email is already in use by another user' });
      }
      user.email = email.trim().toLowerCase();
    }
    if (role && ['Production Manager', 'Inventory Manager'].includes(role)) {
      user.role = role;
    }
    if (status && ['Active', 'Inactive'].includes(status)) {
      user.status = status;
    }
    if (password && password.length >= 6) {
      user.password = password; // Triggers pre-save bcrypt hash
    }

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Delete user
// @route  DELETE /api/auth/users/:id
// @access Protected — Admin only
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent deleting an Admin account
    if (user.role === 'Admin') {
      return res.status(400).json({ success: false, message: 'Cannot delete Admin accounts. Deactivate instead.' });
    }

    // Prevent self-deletion
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};
