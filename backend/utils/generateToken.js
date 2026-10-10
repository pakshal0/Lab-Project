const jwt = require('jsonwebtoken');

/**
 * Generates a JSON Web Token (JWT) and sets it in an HttpOnly cookie.
 * @param {Object} res - Express response object
 * @param {String} customerId - MongoDB _id of the customer
 */
const generateToken = (res, customerId) => {
  // Generate JWT containing customer ID payload
  const token = jwt.sign({ id: customerId }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });

  // Store the token inside an HttpOnly cookie
  res.cookie('token', token, {
    httpOnly: true, // Client-side JS cannot read this cookie (prevents XSS attacks)
    secure: false,  // Set to true if using HTTPS in production
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // Cookie expires in 7 days (in milliseconds)
  });

  return token;
};

module.exports = generateToken;
