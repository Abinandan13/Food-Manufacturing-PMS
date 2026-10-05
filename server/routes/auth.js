const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);

// Admin-only: User registration & management
router.post('/register', protect, authorize('Admin'), register);
router.get('/users', protect, authorize('Admin'), getUsers);
router.get('/users/:id', protect, authorize('Admin'), getUser);
router.put('/users/:id', protect, authorize('Admin'), updateUser);
router.delete('/users/:id', protect, authorize('Admin'), deleteUser);

module.exports = router;
