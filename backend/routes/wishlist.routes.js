const express = require('express');
const router = express.Router();
const protectRoute = require('../middlewares/auth.middleware');
const {
  addToWishlist,
  getWishlist,
  removeFromWishlist
} = require('../controllers/wishlist.controller');

// All wishlist endpoints are protected
router.post('/:productId', protectRoute, addToWishlist);
router.get('/', protectRoute, getWishlist);
router.delete('/:productId', protectRoute, removeFromWishlist);

module.exports = router;
