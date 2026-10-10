const express = require('express');
const router = express.Router();
const protectRoute = require('../middlewares/auth.middleware');
const {
  createPaymentOrder,
  verifyPayment,
  getOrders,
  getOrderById
} = require('../controllers/order.controller');

// All order endpoints are protected by JWT auth middleware
router.post('/create-payment-order', protectRoute, createPaymentOrder);
router.post('/verify-payment', protectRoute, verifyPayment);
router.get('/', protectRoute, getOrders);
router.get('/:id', protectRoute, getOrderById);

module.exports = router;
