const http = require('http');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Order = require('./models/order.model');
const Customer = require('./models/customer.model');
const Product = require('./models/product.model');

const BASE_URL = 'http://localhost:5001';

function makeRequest(path, method = 'GET', data = null, cookie = '') {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const payload = data ? JSON.stringify(data) : null;

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...(cookie ? { 'Cookie': cookie } : {})
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(body); } catch (e) { parsed = body; }
        const setCookieHeader = res.headers['set-cookie'];
        let rawCookie = '';
        if (setCookieHeader && setCookieHeader.length > 0) {
          rawCookie = setCookieHeader[0].split(';')[0];
        }
        resolve({ statusCode: res.statusCode, body: parsed, cookie: rawCookie });
      });
    });

    req.on('error', err => reject(err));
    if (payload) req.write(payload);
    req.end();
  });
}

async function testVerifiedPayment() {
  console.log('--- TESTING VERIFIED PAYMENT & CART CLEARING ---');

  // Register & login test user
  const email = `verify_test_${Date.now()}@test.com`;
  await makeRequest('/customers/register', 'POST', {
    fullName: 'Payment Tester',
    email,
    password: 'password123',
    phone: '9876543210'
  });

  const loginRes = await makeRequest('/customers/login', 'POST', { email, password: 'password123' });
  const cookie = loginRes.cookie;

  // Add product to cart
  const prodsRes = await makeRequest('/products');
  const prod = prodsRes.body.products[0];
  const initialStock = prod.stock;

  await makeRequest(`/cart/${prod._id}`, 'POST', null, cookie);
  const cartRes = await makeRequest('/cart', 'GET', null, cookie);
  console.log(`Initial Cart count: ${cartRes.body.count}`);

  // Create a pending order directly in DB for this test
  const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_placeholder_secret';
  const razorpayOrderId = `order_test_${Date.now()}`;
  const razorpayPaymentId = `pay_test_${Date.now()}`;

  const dotenv = require('dotenv');
  dotenv.config();
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shopkart');

  const meRes = await makeRequest('/customers/me', 'GET', null, cookie);
  const userId = meRes.body._id || meRes.body.customer._id;

  // Create pending order for user
  const pendingOrder = await Order.create({
    user: userId,
    items: [{
      product: prod._id,
      name: prod.name,
      price: prod.price,
      quantity: 1,
      image: prod.image
    }],
    shippingAddress: {
      fullName: 'Payment Tester',
      phone: '9876543210',
      addressLine: '123 Market St',
      city: 'Mumbai',
      state: 'MH',
      pincode: '400001'
    },
    totalAmount: prod.price,
    paymentStatus: 'PENDING',
    status: 'PENDING_PAYMENT',
    razorpayOrderId
  });

  console.log(`Created pending order ${pendingOrder._id} with razorpayOrderId: ${razorpayOrderId}`);

  // Compute valid HMAC signature
  const validSignature = crypto
    .createHmac('sha256', secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  // Call /orders/verify-payment
  const verifyRes = await makeRequest('/orders/verify-payment', 'POST', {
    orderId: pendingOrder._id.toString(),
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature: validSignature
  }, cookie);

  console.log(`POST /orders/verify-payment status: ${verifyRes.statusCode}`);
  console.log('Response body:', JSON.stringify(verifyRes.body));
  console.log(`Order status: ${verifyRes.body.order?.status}, Payment status: ${verifyRes.body.order?.paymentStatus}`);

  const isPaid = verifyRes.statusCode === 200 &&
    verifyRes.body.order?.paymentStatus === 'PAID' &&
    verifyRes.body.order?.status === 'PLACED';
  console.log('Verified Payment Success ->', isPaid ? '✅ PASS' : '❌ FAIL');

  // Verify Cart is now CLEARED in MongoDB
  const cartAfterVerify = await makeRequest('/cart', 'GET', null, cookie);
  console.log(`Cart after verification -> count: ${cartAfterVerify.body.count}`, cartAfterVerify.body.cart.length === 0 ? '✅ PASS (Cart Cleared in MongoDB)' : '❌ FAIL');

  // Verify Stock was decremented
  const prodAfter = await makeRequest(`/products/${prod._id}`);
  console.log(`Stock: before=${initialStock}, after=${prodAfter.body.product.stock}`, prodAfter.body.product.stock === initialStock - 1 ? '✅ PASS (Stock decremented)' : '❌ FAIL');

  // Verify Idempotency (calling verify-payment again with same data)
  const verifyAgain = await makeRequest('/orders/verify-payment', 'POST', {
    orderId: pendingOrder._id.toString(),
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature: validSignature
  }, cookie);
  console.log('Idempotent verification ->', (verifyAgain.statusCode === 200 && verifyAgain.body.message.includes('already')) ? '✅ PASS' : '❌ FAIL');

  process.exit(0);
}

testVerifiedPayment().catch(err => {
  console.error(err);
  process.exit(1);
});
