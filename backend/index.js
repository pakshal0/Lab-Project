const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const customerRoutes = require('./routes/customer.routes');
const productRoutes = require('./routes/product.routes');
const wishlistRoutes = require('./routes/wishlist.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const seedProducts = require('./utils/seedProducts');

const app = express();
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shopkart';

// Middlewares

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'https://lab-project-frontend-psi.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Connect to MongoDB Database (with In-Memory Fallback if local MongoDB is not running)
const connectDatabase = async () => {
  try {
    // Attempt standard MongoDB connection with 2-second timeout
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 2000 });
    console.log('Successfully connected to MongoDB database at:', MONGO_URI);
  } catch (error) {
    console.log('Local MongoDB instance not detected. Initializing In-Memory MongoDB Server for lab testing...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const inMemoryUri = mongoServer.getUri();
      await mongoose.connect(inMemoryUri);
      console.log('Successfully connected to In-Memory MongoDB at:', inMemoryUri);
    } catch (memError) {
      console.error('Failed to connect to MongoDB:', memError.message);
    }
  }

  // Auto-seed initial catalog products if empty
  await seedProducts();
};

connectDatabase();

// Mount Routes
app.use('/customers', customerRoutes);
app.use('/products', productRoutes);
app.use('/wishlist', wishlistRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', orderRoutes);

// Base route health check
app.get('/', (req, res) => {
  res.json({
    service: 'ShopKart API Service',
    status: 'Running',
    version: '1.0.0',
    endpoints: [
      '/customers',
      '/products',
      '/wishlist',
      '/cart',
      '/orders'
    ]
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
