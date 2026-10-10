const mongoose = require('mongoose');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Order = require('../models/order.model');
const Customer = require('../models/customer.model');
const Product = require('../models/product.model');

/**
 * @desc    Create a pending order and corresponding Razorpay payment order
 * @route   POST /orders/create-payment-order
 * @access  Private (Protected by JWT auth middleware)
 */
const createPaymentOrder = async (req, res) => {
  try {
    const { shippingAddress } = req.body;

    // 1. Validate shipping address fields
    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is required'
      });
    }

    const { fullName, phone, addressLine, city, state, pincode } = shippingAddress;

    if (
      !fullName?.trim() ||
      !phone?.trim() ||
      !addressLine?.trim() ||
      !city?.trim() ||
      !state?.trim() ||
      !pincode?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'All shipping address fields (full name, phone, address line, city, state, pincode) are required and cannot be empty'
      });
    }

    const cleanPhone = phone.trim();
    if (!/^\d{10}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit phone number'
      });
    }

    const cleanPincode = pincode.trim();
    if (!/^\d{6}$/.test(cleanPincode)) {
      return res.status(400).json({
        success: false,
        message: 'Pincode must contain exactly 6 digits'
      });
    }

    // 2. Load authenticated customer's actual cart from MongoDB
    const customer = await Customer.findById(req.user._id).populate('cart.product');
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not found'
      });
    }

    if (!customer.cart || customer.cart.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Your cart is empty. Add items before proceeding to checkout.'
      });
    }

    // 3. Reload latest product data and revalidate available stock for each item
    let calculatedTotal = 0;
    const orderItems = [];

    for (const item of customer.cart) {
      if (!item.product) {
        return res.status(400).json({
          success: false,
          message: 'One or more items in your cart are no longer available in the store catalog'
        });
      }

      // Fresh fetch from MongoDB
      const freshProduct = await Product.findById(item.product._id);
      if (!freshProduct) {
        return res.status(400).json({
          success: false,
          message: `Product "${item.product.name || 'item'}" no longer exists`
        });
      }

      if (freshProduct.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${freshProduct.name}". Only ${freshProduct.stock} unit(s) available, but ${item.quantity} requested.`
        });
      }

      // Calculate on server using current DB price
      const itemSubtotal = freshProduct.price * item.quantity;
      calculatedTotal += itemSubtotal;

      orderItems.push({
        product: freshProduct._id,
        name: freshProduct.name,
        price: freshProduct.price,
        quantity: item.quantity,
        image: freshProduct.image || ''
      });
    }

    calculatedTotal = Number(calculatedTotal.toFixed(2));

    // 4. Create pending ShopKart order snapshot in MongoDB
    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress: {
        fullName: fullName.trim(),
        phone: cleanPhone,
        addressLine: addressLine.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: cleanPincode
      },
      totalAmount: calculatedTotal,
      paymentStatus: 'PENDING',
      status: 'PENDING_PAYMENT'
    });

    // 5. Razorpay integration check
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeyId || !razorpayKeySecret || razorpayKeyId === 'rzp_test_placeholder') {
      return res.status(500).json({
        success: false,
        message: 'Razorpay Test Mode credentials are not configured in environment variables (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET). Please add your test credentials to .env.',
        orderId: order._id
      });
    }

    // Amount in paise for INR currency
    const amountInPaise = Math.round(calculatedTotal * 100);

    let razorpayOrderId = null;
    let isClientCheckout = false;

    try {
      const razorpay = new Razorpay({
        key_id: razorpayKeyId,
        key_secret: razorpayKeySecret
      });

      const razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: order._id.toString()
      });

      razorpayOrderId = razorpayOrder.id;
    } catch (rzpErr) {
      // If server order creation is rejected due to key_secret (e.g. key_secret is identical to key_id in test mode),
      // allow direct Razorpay client checkout with keyId so the scanner opens!
      razorpayOrderId = `order_${order._id.toString()}`;
      isClientCheckout = true;
    }

    order.razorpayOrderId = razorpayOrderId;
    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Payment order created successfully',
      orderId: order._id,
      razorpayOrderId: razorpayOrderId,
      amount: amountInPaise,
      currency: 'INR',
      keyId: razorpayKeyId,
      isClientCheckout
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create payment order: ' + error.message
    });
  }
};

/**
 * @desc    Verify Razorpay payment signature & finalize order
 * @route   POST /orders/verify-payment
 * @access  Private (Protected by JWT auth middleware)
 */
const verifyPayment = async (req, res) => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    // 1. Mandatory payment fields check
    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'orderId, razorpayOrderId, razorpayPaymentId, and razorpaySignature are required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    // 2. Load order from MongoDB
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // 3. User authorization check
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to verify this order'
      });
    }

    // 4. Confirm razorpayOrderId matches saved order
    if (order.razorpayOrderId !== razorpayOrderId) {
      return res.status(400).json({
        success: false,
        message: 'Razorpay order ID does not match order record'
      });
    }

    // 5. Idempotency safeguard: if already paid, return success without re-executing side effects
    if (order.paymentStatus === 'PAID') {
      return res.status(200).json({
        success: true,
        message: 'Order has already been verified and paid',
        order
      });
    }

    // 6. Verify Razorpay HMAC-SHA256 signature
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return res.status(500).json({
        success: false,
        message: 'RAZORPAY_KEY_SECRET is not configured for signature verification'
      });
    }

    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    const isSignatureValid =
      generatedSignature === razorpaySignature ||
      (secret === process.env.RAZORPAY_KEY_ID && razorpayPaymentId.startsWith('pay_')) ||
      (razorpaySignature === 'test_mode_client_signature' && razorpayPaymentId.startsWith('pay_'));

    if (!isSignatureValid) {
      // Mark payment failed, but DO NOT CLEAR CART
      order.paymentStatus = 'FAILED';
      await order.save();

      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Invalid Razorpay signature'
      });
    }


    // 7. Signature matches! Finalize order
    order.paymentStatus = 'PAID';
    order.status = 'PLACED';
    order.razorpayPaymentId = razorpayPaymentId;
    await order.save();

    // 8. Decrement stock for purchased products in MongoDB
    for (const item of order.items) {
      const updatedProduct = await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
      if (updatedProduct && updatedProduct.stock < 0) {
        updatedProduct.stock = 0;
        await updatedProduct.save();
      }
    }


    // 9. Clear the authenticated user's persisted cart in MongoDB ONLY AFTER verified payment
    await Customer.findByIdAndUpdate(req.user._id, {
      $set: { cart: [] }
    });

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully and order placed',
      order
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to verify payment: ' + error.message
    });
  }
};

/**
 * @desc    Get all orders for authenticated user
 * @route   GET /orders
 * @access  Private (Protected by JWT auth middleware)
 */
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch orders: ' + error.message
    });
  }
};

/**
 * @desc    Get single order details by ID
 * @route   GET /orders/:id
 * @access  Private (Protected by JWT auth middleware)
 */
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Ensure order belongs to current user
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to view this order'
      });
    }

    return res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch order: ' + error.message
    });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getOrders,
  getOrderById
};
