const mongoose = require('mongoose');
const Customer = require('../models/customer.model');
const Product = require('../models/product.model');

/**
 * @desc    Add product to user's wishlist
 * @route   POST /wishlist/:productId
 * @access  Private (Protected by JWT auth middleware)
 */
const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    // 1. Validate Product ID format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    // 2. Verify product existence in MongoDB
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // 3. Load user using authenticated context
    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not found'
      });
    }

    // 4. Prevent duplicate wishlist entries
    const alreadySaved = customer.wishlist.some(
      id => id.toString() === productId
    );

    if (alreadySaved) {
      return res.status(409).json({
        success: false,
        message: 'Product already saved in your wishlist'
      });
    }

    // 5. Add Product reference and persist
    customer.wishlist.push(productId);
    await customer.save();

    return res.status(201).json({
      success: true,
      message: 'Product added to wishlist successfully',
      wishlist: customer.wishlist
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to add product to wishlist: ' + error.message
    });
  }
};

/**
 * @desc    Get current authenticated user's wishlist
 * @route   GET /wishlist
 * @access  Private (Protected by JWT auth middleware)
 */
const getWishlist = async (req, res) => {
  try {
    // Identify user strictly through req.user._id from JWT middleware
    const customer = await Customer.findById(req.user._id).populate('wishlist');
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not found'
      });
    }

    // Filter out null references if any product was deleted from DB
    const validWishlist = (customer.wishlist || []).filter(item => item !== null);

    // Sync back if null references were pruned
    if (validWishlist.length !== (customer.wishlist || []).length) {
      customer.wishlist = validWishlist.map(p => p._id);
      await customer.save();
    }

    return res.status(200).json({
      success: true,
      count: validWishlist.length,
      wishlist: validWishlist
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve wishlist: ' + error.message
    });
  }
};

/**
 * @desc    Remove product from user's wishlist
 * @route   DELETE /wishlist/:productId
 * @access  Private (Protected by JWT auth middleware)
 */
const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    // 1. Validate Product ID format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    // 2. Load authenticated user
    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not found'
      });
    }

    // 3. Verify product is in user's wishlist
    const itemIndex = customer.wishlist.findIndex(
      id => id.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in your wishlist'
      });
    }

    // 4. Remove and persist
    customer.wishlist.splice(itemIndex, 1);
    await customer.save();

    return res.status(200).json({
      success: true,
      message: 'Product removed from wishlist successfully',
      wishlist: customer.wishlist
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to remove product from wishlist: ' + error.message
    });
  }
};

module.exports = {
  addToWishlist,
  getWishlist,
  removeFromWishlist
};
