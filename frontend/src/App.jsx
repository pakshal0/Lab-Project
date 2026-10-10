import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useParams, Routes, Route } from 'react-router-dom';
import { Heart, ShoppingBag, Eye, RefreshCw, Star, Check, ShieldCheck, Lock, Package } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { useCart } from './context/CartContext';
import { WishlistPage } from './components/WishlistPage';
import { CartPage } from './components/CartPage';
import { CheckoutPage } from './components/CheckoutPage';
import { OrderSuccessPage } from './components/OrderSuccessPage';
import { MyOrdersPage } from './components/MyOrdersPage';
import { OrderDetailModal } from './components/OrderDetailModal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { PRODUCTS as FALLBACK_PRODUCTS, CATEGORIES } from './data/products';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Authentication Context
  const { user, loading: loadingAuth, checkAuth, register, login, logout } = useAuth();

  // Cart Context (Single shared source of truth for Lab 05)
  const {
    cartItems,
    addToCart,
    totalCartCount,
    fetchCart
  } = useCart();

  // Live products loaded from MongoDB catalog
  const [products, setProducts] = useState(FALLBACK_PRODUCTS);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Wishlist state for product cards (Lab 04)
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [wishlistLoadingMap, setWishlistLoadingMap] = useState({});
  const [wishlistCount, setWishlistCount] = useState(0);

  // Active view helpers
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProductForModal, setSelectedProductForModal] = useState(null);
  const [selectedOrderIdForModal, setSelectedOrderIdForModal] = useState(null);
  const [addedNotice, setAddedNotice] = useState({});
  const [globalToast, setGlobalToast] = useState(null);

  // Registration & Login Form states (Preserved from original Lab 1-3)
  const [registerForm, setRegisterForm] = useState({ fullName: '', email: '', password: '', phone: '' });
  const [registerStatus, setRegisterStatus] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginStatus, setLoginStatus] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Show toast notification
  const showToast = (message, type = 'info') => {
    setGlobalToast({ message, type });
    setTimeout(() => setGlobalToast(null), 3000);
  };

  // 1. Fetch live products from backend MongoDB catalog
  const fetchProducts = useCallback(async () => {
    try {
      setLoadingProducts(true);
      const res = await fetch('/products');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.products && data.products.length > 0) {
          setProducts(data.products);
        }
      }
    } catch (err) {
      console.log('Using local fallback catalog products:', err.message);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  // 2. Fetch authenticated user's wishlist IDs from backend
  const fetchWishlistIds = useCallback(async () => {
    if (!user) {
      setWishlistIds(new Set());
      setWishlistCount(0);
      return;
    }

    try {
      const res = await fetch('/wishlist', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.wishlist)) {
          const ids = new Set(data.wishlist.map(item => item._id));
          setWishlistIds(ids);
          setWishlistCount(ids.size);
        }
      }
    } catch (err) {
      console.log('Error fetching wishlist:', err.message);
    }
  }, [user]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts, location.pathname]);

  useEffect(() => {
    fetchWishlistIds();
  }, [fetchWishlistIds]);

  // Sync open product detail modal with latest catalog stock
  useEffect(() => {
    if (selectedProductForModal) {
      const updated = products.find(p => (p._id || p.id) === (selectedProductForModal._id || selectedProductForModal.id));
      if (updated && updated.stock !== selectedProductForModal.stock) {
        setSelectedProductForModal(updated);
      }
    }
  }, [products, selectedProductForModal]);

  // Handle URL matching and active tab
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.startsWith('/wishlist')) return 'wishlist';
    if (path.startsWith('/cart')) return 'cart';
    if (path.startsWith('/checkout')) return 'checkout';
    if (path.startsWith('/order-success')) return 'order-success';
    if (path.startsWith('/orders')) return 'orders';
    if (path.startsWith('/profile')) return 'profile';
    if (path.startsWith('/register')) return 'register';
    if (path.startsWith('/login')) return 'login';
    return 'products';
  };

  const activeTab = getActiveTab();

  const handleTabClick = (tab) => {
    if (tab === 'products') {
      fetchProducts();
      navigate('/');
    } else {
      navigate(`/${tab}`);
    }
  };

  // Toggle wishlist item for a product
  const handleToggleWishlist = async (productId) => {
    if (!user) {
      showToast('Please sign in to save items to your wishlist', 'error');
      navigate('/login');
      return;
    }

    if (wishlistLoadingMap[productId]) return;

    setWishlistLoadingMap(prev => ({ ...prev, [productId]: true }));
    const isCurrentlySaved = wishlistIds.has(productId);

    try {
      if (isCurrentlySaved) {
        // Remove from wishlist
        const res = await fetch(`/wishlist/${productId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setWishlistIds(prev => {
            const next = new Set(prev);
            next.delete(productId);
            setWishlistCount(next.size);
            return next;
          });
          showToast('Product removed from wishlist', 'info');
        } else {
          showToast(data.message || 'Failed to remove from wishlist', 'error');
        }
      } else {
        // Add to wishlist
        const res = await fetch(`/wishlist/${productId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setWishlistIds(prev => {
            const next = new Set(prev);
            next.add(productId);
            setWishlistCount(next.size);
            return next;
          });
          showToast('Product saved to wishlist!', 'success');
        } else if (res.status === 409) {
          // Already in wishlist
          setWishlistIds(prev => new Set(prev).add(productId));
          showToast('Product already in your wishlist', 'info');
        } else {
          showToast(data.message || 'Failed to add to wishlist', 'error');
        }
      }
    } catch (err) {
      showToast('Network error updating wishlist', 'error');
    } finally {
      setWishlistLoadingMap(prev => ({ ...prev, [productId]: false }));
    }
  };

  // Add to cart handler
  const handleAddToCart = async (product) => {
    if (!user) {
      showToast('Please sign in to add items to your cart', 'error');
      navigate('/login');
      return;
    }

    const productId = product._id || product.id;
    const res = await addToCart(productId);

    if (res.success) {
      setAddedNotice(prev => ({ ...prev, [productId]: true }));
      showToast(`Added "${product.name}" to cart!`, 'success');
      setTimeout(() => {
        setAddedNotice(prev => ({ ...prev, [productId]: false }));
      }, 1200);
    } else {
      showToast(res.message || 'Failed to add item to cart', 'error');
    }
  };

  // Handle Register (Preserved from Lab 1-3)
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterStatus(null);
    setIsRegistering(true);

    if (registerForm.password.length < 6) {
      setRegisterStatus({
        type: 'error',
        title: 'Validation Error',
        message: 'Password must be at least 6 characters long'
      });
      setIsRegistering(false);
      return;
    }

    const res = await register(registerForm);
    if (res.success) {
      setRegisterStatus({
        type: 'success',
        title: 'Registration Successful!',
        message: `Account created for "${registerForm.fullName}". Redirecting to login...`
      });

      setLoginForm({
        email: registerForm.email,
        password: registerForm.password
      });

      setTimeout(() => {
        navigate('/login');
      }, 1200);
    } else {
      setRegisterStatus({
        type: 'error',
        title: 'Registration Failed',
        message: res.message
      });
    }
    setIsRegistering(false);
  };

  // Handle Login (Preserved from Lab 1-3)
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginStatus(null);
    setIsLoggingIn(true);

    const res = await login(loginForm.email, loginForm.password);
    if (res.success) {
      setLoginStatus({
        type: 'success',
        title: 'Login Successful!',
        message: `Welcome back, ${res.customer?.fullName || 'Customer'}! Loading storefront...`
      });
      setLoginForm(prev => ({ ...prev, password: '' }));

      // Synchronize wishlist and cart on login
      fetchWishlistIds();
      fetchCart();

      setTimeout(() => {
        navigate('/');
      }, 800);
    } else {
      setLoginStatus({
        type: 'error',
        title: 'Authentication Failed',
        message: res.message
      });
    }
    setIsLoggingIn(false);
  };

  // Handle Logout (Preserved from Lab 1-3)
  const handleLogout = async () => {
    await logout();
    setWishlistIds(new Set());
    setWishlistCount(0);
    showToast('You have been logged out successfully', 'info');
    navigate('/login');
  };

  // Quick fill demo helpers
  const fillSampleRegister = () => {
    const num = Math.floor(100 + Math.random() * 900);
    setRegisterForm({
      fullName: 'Rahul Sharma',
      email: `rahul_${num}@gmail.com`,
      password: 'password123',
      phone: '9876543210'
    });
  };

  const fillSampleLogin = () => {
    setLoginForm({
      email: registerForm.email || 'rahul@gmail.com',
      password: registerForm.password || 'password123'
    });
  };

  const filteredProducts = products.filter(
    p => selectedCategory === 'All' || p.category === selectedCategory
  );

  // Extract orderId if on order-success page
  const orderSuccessMatch = location.pathname.match(/\/order-success\/([^/]+)/);
  const activeSuccessOrderId = orderSuccessMatch ? orderSuccessMatch[1] : null;

  return (
    <div className="app-wrapper">
      {/* Header */}
      <header className="app-header">
        <div className="header-top">
          <div className="brand-box" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <h1 className="brand-title">ShopKart</h1>
            <p className="brand-subtitle">Labs 04 (Wishlist) • 05 (Cart) • 06 (Checkout & Orders)</p>
          </div>

          <div className="header-user-status">
            {user ? (
              <>
                <span className="status-badge online">
                  👤 Logged in: {user.fullName}
                </span>
                <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <span className="status-badge offline">
                Status: Not Logged In
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Navigation Tabs Bar with Wishlist, Cart & Orders */}
      <nav className="nav-tabs-bar">
        <div className="nav-tabs-container">
          <button
            className={`nav-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => handleTabClick('products')}
          >
            Products / Store
          </button>

          <button
            className={`nav-tab-btn ${activeTab === 'wishlist' ? 'active' : ''}`}
            onClick={() => handleTabClick('wishlist')}
          >
            Wishlist
            {wishlistCount > 0 && <span className="nav-tab-badge wish-badge">{wishlistCount}</span>}
          </button>

          <button
            className={`nav-tab-btn ${activeTab === 'cart' ? 'active' : ''}`}
            onClick={() => handleTabClick('cart')}
          >
            Cart
            {totalCartCount > 0 && <span className="nav-tab-badge cart-badge">{totalCartCount}</span>}
          </button>

          {user && (
            <button
              className={`nav-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => handleTabClick('orders')}
            >
              My Orders
            </button>
          )}

          <button
            className={`nav-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => handleTabClick('profile')}
          >
            My Profile (Protected)
          </button>

          {!user && (
            <>
              <button
                className={`nav-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => handleTabClick('login')}
              >
                Login
              </button>
              <button
                className={`nav-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
                onClick={() => handleTabClick('register')}
              >
                Register
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Global Toast Notification */}
      {globalToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 1100,
            maxWidth: '380px',
            padding: '12px 18px',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            backgroundColor: globalToast.type === 'error' ? '#ef4444' : globalToast.type === 'success' ? '#10b981' : '#2563eb',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <span>{globalToast.message}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="main-container">
        {/* ==================== VIEW 1: PRODUCTS STOREFRONT ==================== */}
        {activeTab === 'products' && (
          <section className="content-card">
            <div className="filter-row">
              <div>
                <h2 className="card-title">Available Products</h2>
                <p className="card-description">
                  Browse products, save favorites to your Wishlist (Lab 04), and add items to your Shopping Cart (Lab 05).
                </p>
              </div>

              <div className="category-buttons">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {loadingProducts ? (
              <div style={{ textAlign: 'center', padding: '50px 0' }}>
                <RefreshCw size={28} className="spin-animate" style={{ color: '#2563eb', marginBottom: '10px' }} />
                <p style={{ color: '#64748b' }}>Loading products catalog...</p>
              </div>
            ) : (
              <div className="products-grid">
                {filteredProducts.map(prod => {
                  const prodId = prod._id || prod.id;
                  const isSavedInWishlist = wishlistIds.has(prodId);
                  const isWishlistLoading = wishlistLoadingMap[prodId];
                  const isOutOfStock = prod.stock !== undefined && prod.stock <= 0;

                  return (
                    <div key={prodId} className="product-item-card" style={{ position: 'relative' }}>
                      {/* Wishlist Heart Button on Card (Lab 04 requirement) */}
                      <button
                        className={`wishlist-btn-overlay ${isSavedInWishlist ? 'saved' : ''}`}
                        onClick={() => handleToggleWishlist(prodId)}
                        disabled={isWishlistLoading}
                        title={isSavedInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                        aria-label="Wishlist action"
                      >
                        {isWishlistLoading ? (
                          <RefreshCw size={15} className="spin-animate text-red" />
                        ) : (
                          <Heart
                            size={18}
                            fill={isSavedInWishlist ? '#ef4444' : 'none'}
                            color={isSavedInWishlist ? '#ef4444' : '#64748b'}
                          />
                        )}
                      </button>

                      <img src={prod.image} alt={prod.name} className="product-item-img" />

                      <div className="product-item-content">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span className="product-category-tag">{prod.category}</span>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              padding: '2px 6px',
                              borderRadius: '10px',
                              backgroundColor: isOutOfStock ? '#fee2e2' : '#f0fdf4',
                              color: isOutOfStock ? '#dc2626' : '#16a34a'
                            }}
                          >
                            {isOutOfStock ? 'Out of Stock' : `Stock: ${prod.stock}`}
                          </span>
                        </div>

                        <h3 className="product-item-title">{prod.name}</h3>
                        <p className="product-item-desc">{prod.description}</p>

                        <div className="product-item-footer">
                          <span className="product-item-price">${prod.price.toFixed(2)}</span>

                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => setSelectedProductForModal(prod)}
                              title="View Details"
                            >
                              <Eye size={14} />
                            </button>

                            <button
                              className="btn btn-primary btn-sm"
                              disabled={isOutOfStock}
                              onClick={() => handleAddToCart(prod)}
                            >
                              <ShoppingBag size={14} />
                              {addedNotice[prodId] ? 'Added!' : 'Add to Cart'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ==================== VIEW 2: WISHLIST (LAB 04) ==================== */}
        {activeTab === 'wishlist' && (
          <WishlistPage
            onNavigateToProducts={() => navigate('/')}
            onSelectProduct={prod => setSelectedProductForModal(prod)}
          />
        )}

        {/* ==================== VIEW 3: CART (LAB 05) ==================== */}
        {activeTab === 'cart' && (
          <CartPage
            onNavigateToProducts={() => navigate('/')}
            onNavigateToCheckout={() => navigate('/checkout')}
          />
        )}

        {/* ==================== VIEW 4: CHECKOUT (LAB 06) ==================== */}
        {activeTab === 'checkout' && (
          <CheckoutPage
            onNavigateToCart={() => navigate('/cart')}
            onOrderSuccess={(orderId) => {
              fetchProducts();
              navigate(`/order-success/${orderId}`);
            }}
          />
        )}

        {/* ==================== VIEW 5: ORDER SUCCESS (LAB 06) ==================== */}
        {activeTab === 'order-success' && (
          <OrderSuccessPage
            orderId={activeSuccessOrderId}
            onNavigateToOrders={() => navigate('/orders')}
            onNavigateToProducts={() => {
              fetchProducts();
              navigate('/');
            }}
          />
        )}

        {/* ==================== VIEW 6: MY ORDERS (LAB 06) ==================== */}
        {activeTab === 'orders' && (
          <MyOrdersPage
            onNavigateToProducts={() => navigate('/')}
            onSelectOrder={(orderId) => setSelectedOrderIdForModal(orderId)}
          />
        )}

        {/* ==================== VIEW 7: REGISTER (LAB 01-03 PRESERVED) ==================== */}
        {activeTab === 'register' && (
          <section className="content-card form-card">
            <div className="form-header-badge">
              📝 Customer Registration
            </div>
            <h2 className="card-title">Create Your Account</h2>
            <p className="card-description">
              Sign up as a new customer to access profile features, Wishlist, and Orders.
            </p>

            <div className="demo-helper">
              <span>Quickly test with sample data?</span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={fillSampleRegister}
              >
                Fill Sample Data
              </button>
            </div>

            {registerStatus && (
              <div className={`response-box ${registerStatus.type}`}>
                <span className="response-title">{registerStatus.title}</span>
                <span>{registerStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-fullname">Full Name</label>
                <input
                  id="reg-fullname"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Rahul Sharma"
                  value={registerForm.fullName}
                  onChange={e => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-email">Email Address</label>
                <input
                  id="reg-email"
                  type="email"
                  className="form-input"
                  placeholder="e.g. rahul@gmail.com"
                  value={registerForm.email}
                  onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-password">Password</label>
                <div className="input-password-wrapper">
                  <input
                    id="reg-password"
                    type={showRegisterPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Minimum 6 characters"
                    value={registerForm.password}
                    onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                  >
                    {showRegisterPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <span className="input-hint">Password must contain at least 6 characters.</span>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-phone">Phone Number</label>
                <input
                  id="reg-phone"
                  type="tel"
                  className="form-input"
                  placeholder="e.g. 9876543210"
                  value={registerForm.phone}
                  onChange={e => setRegisterForm({ ...registerForm, phone: e.target.value })}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={isRegistering}
              >
                {isRegistering ? 'Registering Account...' : 'Create Account'}
              </button>
            </form>

            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.86rem', color: '#475569' }}>
              Already have an account?{' '}
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: '600', textDecoration: 'underline' }}
                onClick={() => navigate('/login')}
              >
                Sign In
              </button>
            </div>
          </section>
        )}

        {/* ==================== VIEW 8: LOGIN (LAB 01-03 PRESERVED) ==================== */}
        {activeTab === 'login' && (
          <section className="content-card form-card">
            <div className="form-header-badge">
              🔐 Customer Login
            </div>
            <h2 className="card-title">Sign In to Your Account</h2>
            <p className="card-description">
              Enter your registered email and password to log in.
            </p>

            <div className="demo-helper">
              <span>Testing with sample credentials?</span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={fillSampleLogin}
              >
                Fill Credentials
              </button>
            </div>

            {loginStatus && (
              <div className={`response-box ${loginStatus.type}`}>
                <span className="response-title">{loginStatus.title}</span>
                <span>{loginStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="login-email">Email Address</label>
                <input
                  id="login-email"
                  type="email"
                  className="form-input"
                  placeholder="name@example.com"
                  value={loginForm.email}
                  onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="login-password">Password</label>
                <div className="input-password-wrapper">
                  <input
                    id="login-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Enter your password"
                    value={loginForm.password}
                    onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                  >
                    {showLoginPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.86rem', color: '#475569' }}>
              Don't have an account yet?{' '}
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: '600', textDecoration: 'underline' }}
                onClick={() => navigate('/register')}
              >
                Create Account
              </button>
            </div>
          </section>
        )}

        {/* ==================== VIEW 9: PROFILE (LAB 01-03 PRESERVED) ==================== */}
        {activeTab === 'profile' && (
          <section className="content-card">
            <h2 className="card-title">Customer Profile (Protected Route)</h2>
            <p className="card-description">
              Endpoint: <code>GET /customers/me</code> — Authenticated via HttpOnly JWT Cookie.
            </p>

            {user ? (
              <div>
                <div className="response-box success" style={{ marginBottom: '18px' }}>
                  <span className="response-title">✓ Authenticated Session Active</span>
                  <span>Welcome back, {user.fullName}! Your session is active and verified by MongoDB.</span>
                </div>

                <table className="profile-table">
                  <tbody>
                    <tr>
                      <th>Full Name</th>
                      <td><strong>{user.fullName}</strong></td>
                    </tr>
                    <tr>
                      <th>Email Address</th>
                      <td>{user.email}</td>
                    </tr>
                    <tr>
                      <th>Phone Number</th>
                      <td>{user.phone || 'N/A'}</td>
                    </tr>
                    <tr>
                      <th>Customer ID (_id)</th>
                      <td><span className="code-snippet">{user._id}</span></td>
                    </tr>
                    <tr>
                      <th>Wishlist Saved</th>
                      <td>{wishlistCount} items saved</td>
                    </tr>
                    <tr>
                      <th>Cart Total Units</th>
                      <td>{totalCartCount} units</td>
                    </tr>
                    <tr>
                      <th>Session Security</th>
                      <td>HttpOnly Cookie with JWT Token</td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button className="btn btn-secondary" onClick={checkAuth}>
                    Refresh Profile
                  </button>
                  <button className="btn btn-danger" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="response-box error">
                  <span className="response-title">401 Unauthorized: No Active Session</span>
                  <span>You are not currently logged in. Please sign in to view your customer profile.</span>
                </div>

                <button className="btn btn-primary" onClick={() => navigate('/login')}>
                  Go to Login Page
                </button>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Product Details Modal */}
      {selectedProductForModal && (
        <ProductDetailModal
          product={selectedProductForModal}
          isWishlisted={wishlistIds.has(selectedProductForModal._id || selectedProductForModal.id)}
          onToggleWishlist={handleToggleWishlist}
          onClose={() => setSelectedProductForModal(null)}
        />
      )}

      {/* Order Details Modal */}
      {selectedOrderIdForModal && (
        <OrderDetailModal
          orderId={selectedOrderIdForModal}
          onClose={() => setSelectedOrderIdForModal(null)}
        />
      )}

      {/* Footer */}
      <footer className="app-footer">
        <p>ShopKart Project — React & Express E-Commerce Architecture (Labs 04, 05, 06)</p>
      </footer>
    </div>
  );
}
