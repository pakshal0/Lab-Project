# 🛒 ShopKart — E-Commerce Web Application

A full-stack e-commerce store and customer portal built using **React**, **Node.js**, **Express**, and **MongoDB**. 

This project covers end-to-end shopping features: from user sign-up and browsing products, to managing a wishlist, shopping cart, and checking out with **Razorpay** payment integration.

---

## 📌 Project Overview

ShopKart is divided into clear milestones across university lab assignments:

- **Labs 1, 2 & 3: User Accounts & Authentication**
  - New customer registration and secure login.
  - Passwords are securely hashed with `bcrypt`.
  - Logged-in sessions are stored safely using JWT tokens in `HttpOnly` cookies.
  - Profile view to see account details.

- **Lab 4: Wishlist System**
  - Customers can save their favorite items by clicking the heart icon.
  - Prevents adding duplicates.
  - Each customer has their own private wishlist.

- **Lab 5: Shopping Cart System**
  - Add products to the cart directly from the store.
  - Adding the same product again increases its quantity in the same row.
  - Adjust quantity (`+` / `-`) or remove items anytime.
  - Automatic inventory check so users cannot order more items than currently in stock.
  - Real-time price and total calculation.

- **Lab 6: Checkout, Payment & Orders**
  - Delivery address form with validation (phone number and pincode checks).
  - Server verifies prices and stock before placing an order (tamper-proof).
  - Online payment integration using **Razorpay** (supports card, UPI, or simulated test mode).
  - Once payment is successful, stock is deducted and the cart is emptied.
  - **"My Orders"** page showing order history, status tracking, and printable receipts.

---

## 🛠️ Technologies Used

| Layer | Tools |
|---|---|
| **Frontend** | React 18, Vite, React Router, Lucide Icons, Custom CSS |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB & Mongoose *(includes auto in-memory database fallback)* |
| **Security** | JSON Web Tokens (JWT), Bcrypt, Cookie-Parser |
| **Payments** | Razorpay Payment Gateway |

> 💡 **Zero-Setup Database**: If you do not have MongoDB running on your computer, the backend will automatically start an in-memory database and add sample products for you.

---

## 🚀 How to Run the Project

Running the project takes just a few simple steps:

### 1. Start the Backend
Open a terminal in the project folder:
```bash
cd backend
npm install
npm run dev
```
The backend server will run at: **`http://localhost:5001`**

---

### 2. Start the Frontend
Open a **second** terminal window:
```bash
cd frontend
npm install
npm run dev
```
The frontend website will run at: **`http://localhost:5173`**

---

### 3. Open in Your Browser
Open [http://localhost:5173](http://localhost:5173) in any browser. You can now:
1. Register a new account or log in.
2. Browse products and add items to your Wishlist or Cart.
3. Open the Cart and click **Proceed to Checkout**.
4. Fill in shipping details, complete test payment, and view your order receipt!

---

## 🧭 Project Structure at a Glance

```text
Lab 1 project/
├── backend/                  # Server-side code
│   ├── controllers/          # Business logic (auth, cart, wishlist, orders)
│   ├── models/               # MongoDB database schemas
│   ├── routes/               # API endpoints
│   ├── middlewares/          # JWT authentication middleware
│   ├── utils/                # Token generator & sample product data
│   ├── test_labs_04_05_06.js # Automated test file
│   └── index.js              # Server entry point
│
├── frontend/                 # Client-side React code
│   ├── src/
│   │   ├── components/       # Pages & UI components (Cart, Checkout, Orders, etc.)
│   │   ├── context/          # User login state & Shopping cart state
│   │   ├── App.jsx           # Main navigation and store view
│   │   └── index.css         # Styling and design
│   └── vite.config.js        # Vite setup with proxy to backend
│
└── README.md                 # Project guide
```

---

## 🔗 Main API Routes

Here is a quick summary of the backend routes:

- **Customer Auth** (`/customers`)
  - `POST /customers/register` — Create a new account
  - `POST /customers/login` — Log in
  - `GET /customers/me` — View logged-in profile
  - `POST /customers/logout` — Log out

- **Products** (`/products`)
  - `GET /products` — Get all products in the catalog
  - `GET /products/:id` — View details of a single product

- **Wishlist** (`/wishlist`)
  - `GET /wishlist` — View saved items
  - `POST /wishlist/:productId` — Add item to wishlist
  - `DELETE /wishlist/:productId` — Remove item from wishlist

- **Cart** (`/cart`)
  - `GET /cart` — View current cart & total
  - `POST /cart/:productId` — Add item to cart
  - `PATCH /cart/:productId` — Update item quantity
  - `DELETE /cart/:productId` — Remove item from cart

- **Orders & Payments** (`/orders`)
  - `POST /orders/create-payment-order` — Create order & Razorpay payment request
  - `POST /orders/verify-payment` — Confirm payment, reduce stock & clear cart
  - `GET /orders` — View past orders list
  - `GET /orders/:id` — View single order receipt details

---

## 🧪 Testing the Project

An automated test suite is included to verify that everything works properly.

To run all tests:
```bash
cd backend
npm test
```
This tests user registration, login, adding to cart, updating stock, wishlist actions, checkout validation, and order creation.

---

## 📄 License
Created for academic lab coursework under the **ISC License**.
