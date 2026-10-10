const Product = require('../models/product.model');

const INITIAL_PRODUCTS = [
  {
    name: 'Wireless Bluetooth Headphones',
    category: 'Electronics',
    price: 49.99,
    rating: 4.5,
    description: 'Over-ear headphones with deep bass, microphone, and 20 hours battery life.',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60',
    stock: 15,
    badge: 'Best Seller'
  },
  {
    name: 'Smart Fitness Band',
    category: 'Electronics',
    price: 29.99,
    rating: 4.2,
    description: 'Activity tracker with heart rate monitor, step counter, and sleep tracker.',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60',
    stock: 20,
    badge: 'Popular'
  },
  {
    name: 'RGB Mechanical Keyboard',
    category: 'Computers',
    price: 39.99,
    rating: 4.6,
    description: 'Blue switch mechanical gaming keyboard with customizable backlit keys.',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60',
    stock: 12,
    badge: 'Top Rated'
  },
  {
    name: 'Optical Wireless Mouse',
    category: 'Computers',
    price: 15.99,
    rating: 4.4,
    description: '2.4GHz wireless mouse with ergonomic grip and silent click buttons.',
    image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&auto=format&fit=crop&q=60',
    stock: 25,
    badge: 'Value'
  },
  {
    name: 'College Laptop Backpack',
    category: 'Accessories',
    price: 34.99,
    rating: 4.7,
    description: 'Water-resistant travel backpack with USB charging port and 15.6 inch laptop sleeve.',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=60',
    stock: 18,
    badge: 'Featured'
  },
  {
    name: 'Insulated Water Bottle',
    category: 'Accessories',
    price: 14.50,
    rating: 4.3,
    description: 'Stainless steel double-wall vacuum insulated flask keeps drinks cold for 24 hrs.',
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&auto=format&fit=crop&q=60',
    stock: 30,
    badge: 'Trending'
  }
];

const seedProducts = async () => {
  try {
    const count = await Product.countDocuments();
    if (count === 0) {
      await Product.insertMany(INITIAL_PRODUCTS);
      console.log('Successfully seeded default products into MongoDB catalog.');
    }
  } catch (error) {
    console.error('Error seeding products:', error.message);
  }
};

module.exports = seedProducts;
