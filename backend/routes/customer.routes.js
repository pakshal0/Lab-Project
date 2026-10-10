const express = require('express');
const router = express.Router();

const {
  registerCustomer,
  loginCustomer,
  getMyProfile,
  logoutCustomer
} = require('../controllers/customer.controller');

const protectRoute = require('../middlewares/auth.middleware');

// Public Routes
router.post('/register', registerCustomer);
router.post('/login', loginCustomer);

// Protected Routes
router.get('/me', protectRoute, getMyProfile);
router.post('/logout', protectRoute, logoutCustomer);

module.exports = router;
