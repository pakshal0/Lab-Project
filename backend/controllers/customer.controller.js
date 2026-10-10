const Customer = require('../models/customer.model');
const bcrypt = require('bcrypt');
const generateToken = require('../utils/generateToken');

/**
 * @desc    Register a new customer
 * @route   POST /customers/register
 * @access  Public
 */
const registerCustomer = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;

    // 1. Mandatory fields check
    if (!fullName || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: "All fields (fullName, email, password, phone) are required"
      });
    }

    // 2. Password length check (at least 6 characters)
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long"
      });
    }

    // 3. Email uniqueness check
    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message: "Email already exists"
      });
    }

    // 4. Hash password using bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 5. Create new customer record in MongoDB
    const newCustomer = await Customer.create({
      fullName,
      email,
      password: hashedPassword,
      phone
    });

    // 6. Return response without password
    return res.status(201).json({
      success: true,
      message: "Customer registered successfully",
      customer: {
        _id: newCustomer._id,
        fullName: newCustomer.fullName,
        email: newCustomer.email,
        phone: newCustomer.phone
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message
    });
  }
};

/**
 * @desc    Authenticate customer & get token
 * @route   POST /customers/login
 * @access  Public
 */
const loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check missing credentials
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // 2. Find customer by email
    const customer = await Customer.findOne({ email });

    // Generic error message for security (don't reveal whether email or password was wrong)
    const genericAuthError = {
      success: false,
      message: "Invalid email or password"
    };

    if (!customer) {
      return res.status(401).json(genericAuthError);
    }

    // 3. Compare password using bcrypt
    const isPasswordMatched = await bcrypt.compare(password, customer.password);
    if (!isPasswordMatched) {
      return res.status(401).json(genericAuthError);
    }

    // 4. Generate JWT & store in HttpOnly cookie
    generateToken(res, customer._id);

    // 5. Success response with customer details
    return res.status(200).json({
      success: true,
      message: "Login successful",
      customer: {
        _id: customer._id,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message
    });
  }
};

/**
 * @desc    Get current customer profile
 * @route   GET /customers/me
 * @access  Private (Protected by auth middleware)
 */
const getMyProfile = async (req, res) => {
  try {
    // req.user is attached by auth middleware and does not contain password
    return res.status(200).json({
      success: true,
      _id: req.user._id,
      fullName: req.user.fullName,
      email: req.user.email,
      phone: req.user.phone,
      customer: {
        _id: req.user._id,
        fullName: req.user.fullName,
        email: req.user.email,
        phone: req.user.phone
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message
    });
  }
};

/**
 * @desc    Logout customer (clear HttpOnly cookie)
 * @route   POST /customers/logout
 * @access  Private / Public
 */
const logoutCustomer = async (req, res) => {
  try {
    // Clear the authentication cookie by expiring it immediately
    res.cookie('token', '', {
      httpOnly: true,
      expires: new Date(0)
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message
    });
  }
};

module.exports = {
  registerCustomer,
  loginCustomer,
  getMyProfile,
  logoutCustomer
};
