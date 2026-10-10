const mongoose = require('mongoose');
const Customer = require('../models/customer.model');
const Product = require('../models/product.model');

/**
 * @desc    Add item to cart or increment quantity
 * @route   POST /cart/:productId
 * @access  Private (Protected by JWT auth middleware)
 */
const addToCart = async (req, res) => {
  try {
    const { productId } = req.params;

    // 1. Validate Product ID format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    // 2. Verify product existence and stock in MongoDB
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.stock < 1) {
      return res.status(400).json({
        success: false,
        message: 'Product is currently out of stock'
      });
    }

    // 3. Load authenticated customer
    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not found'
      });
    }

    // 4. Check if item already exists in cart
    const existingItem = customer.cart.find(
      item => item.product && item.product.toString() === productId
    );

    if (existingItem) {
      // Reject if incrementing would exceed available stock
      if (existingItem.quantity + 1 > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more. Available stock is ${product.stock}`
        });
      }
      existingItem.quantity += 1;
    } else {
      // Add new item with initial quantity 1
      customer.cart.push({
        product: productId,
        quantity: 1
      });
    }

    await customer.save();

    // 5. Return updated populated cart
    const updatedCustomer = await Customer.findById(req.user._id).populate('cart.product');
    const validCart = (updatedCustomer.cart || []).filter(item => item.product !== null);

    return res.status(200).json({
      success: true,
      message: 'Product added to cart successfully',
      cart: validCart
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to add item to cart: ' + error.message
    });
  }
};

/**
 * @desc    Get current user's cart
 * @route   GET /cart
 * @access  Private (Protected by JWT auth middleware)
 */
const getCart = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id).populate('cart.product');
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not found'
      });
    }

    // Prune items whose products no longer exist
    const validCart = (customer.cart || []).filter(item => item.product !== null);

    if (validCart.length !== (customer.cart || []).length) {
      customer.cart = validCart.map(item => ({
        product: item.product._id,
        quantity: item.quantity
      }));
      await customer.save();
    }

    return res.status(200).json({
      success: true,
      count: validCart.reduce((sum, item) => sum + item.quantity, 0),
      cart: validCart
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve cart: ' + error.message
    });
  }
};

/**
 * @desc    Update item quantity in cart
 * @route   PATCH /cart/:productId
 * @access  Private (Protected by JWT auth middleware)
 */
const updateCartItemQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    // 1. Validate Product ID format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    // 2. Validate quantity is an integer >= 1
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a valid integer of at least 1'
      });
    }

    // 3. Check product stock
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product does not exist'
      });
    }

    if (qty > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Requested quantity (${qty}) exceeds available stock (${product.stock})`
      });
    }

    // 4. Load user and find cart item
    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not found'
      });
    }

    const cartItem = customer.cart.find(
      item => item.product && item.product.toString() === productId
    );

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in your cart'
      });
    }

    // 5. Update quantity and save
    cartItem.quantity = qty;
    await customer.save();

    // 6. Return populated cart
    const updatedCustomer = await Customer.findById(req.user._id).populate('cart.product');
    const validCart = (updatedCustomer.cart || []).filter(item => item.product !== null);

    return res.status(200).json({
      success: true,
      message: 'Cart quantity updated successfully',
      cart: validCart
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update cart item: ' + error.message
    });
  }
};

/**
 * @desc    Remove item from cart
 * @route   DELETE /cart/:productId
 * @access  Private (Protected by JWT auth middleware)
 */
const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    // 1. Validate Product ID format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    // 2. Load user
    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not found'
      });
    }

    // 3. Find and remove item
    const initialLength = customer.cart.length;
    customer.cart = customer.cart.filter(
      item => item.product && item.product.toString() !== productId
    );

    if (customer.cart.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in your cart'
      });
    }

    await customer.save();

    // 4. Return populated updated cart
    const updatedCustomer = await Customer.findById(req.user._id).populate('cart.product');
    const validCart = (updatedCustomer.cart || []).filter(item => item.product !== null);

    return res.status(200).json({
      success: true,
      message: 'Product removed from cart successfully',
      cart: validCart
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to remove cart item: ' + error.message
    });
  }
};

module.exports = {
  addToCart,
  getCart,
  updateCartItemQuantity,
  removeFromCart
};
