const express = require('express');
const router = express.Router();
const protectRoute = require('../middlewares/auth.middleware');
const {
  addToCart,
  getCart,
  updateCartItemQuantity,
  removeFromCart
} = require('../controllers/cart.controller');

// All cart endpoints are protected
router.post('/:productId', protectRoute, addToCart);
router.get('/', protectRoute, getCart);
router.patch('/:productId', protectRoute, updateCartItemQuantity);
router.delete('/:productId', protectRoute, removeFromCart);

module.exports = router;
