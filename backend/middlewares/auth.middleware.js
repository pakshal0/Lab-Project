const jwt = require('jsonwebtoken');
const Customer = require('../models/customer.model');

/**
 * Middleware to protect routes by verifying JWT from cookie
 */
const protectRoute = async (req, res, next) => {
  try {
    // 1. Read JWT from HttpOnly cookie
    const token = req.cookies.token;

    // 2. If cookie does not exist, return 401 Unauthorized
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Access denied, no token provided"
      });
    }

    // 3. Verify JWT using secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4 & 5. Find customer in MongoDB using extracted ID (exclude password)
    const customer = await Customer.findById(decoded.id).select('-password');

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Customer not found"
      });
    }

    // 6. Attach customer object to req.user
    req.user = customer;

    // 7. Call next() to move to the next middleware or controller
    next();
  } catch (error) {
    // If token verification fails (e.g. expired or tampered token)
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Invalid or expired token"
    });
  }
};

module.exports = protectRoute;
