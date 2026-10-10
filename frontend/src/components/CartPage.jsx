import React, { useState } from 'react';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export const CartPage = ({ onNavigateToProducts, onNavigateToCheckout }) => {
  const { user, openLoginModal } = useAuth();
  const {
    cartItems,
    loading,
    error,
    fetchCart,
    updateQuantity,
    removeFromCart,
    cartSubtotal,
    totalCartCount
  } = useCart();

  const [updatingId, setUpdatingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [toastNotice, setToastNotice] = useState(null);

  const showToast = (msg, type = 'info') => {
    setToastNotice({ msg, type });
    setTimeout(() => setToastNotice(null), 3000);
  };

  const handleQtyChange = async (productId, currentQty, maxStock, delta) => {
    const newQty = currentQty + delta;
    if (newQty < 1) {
      showToast('Quantity cannot be less than 1', 'error');
      return;
    }
    if (newQty > maxStock) {
      showToast(`Cannot add more than available stock (${maxStock})`, 'error');
      return;
    }

    setUpdatingId(productId);
    const res = await updateQuantity(productId, newQty);
    if (!res.success) {
      showToast(res.message || 'Failed to update quantity', 'error');
    }
    setUpdatingId(null);
  };

  const handleRemove = async (productId) => {
    setRemovingId(productId);
    const res = await removeFromCart(productId);
    if (!res.success) {
      showToast(res.message || 'Failed to remove item', 'error');
    } else {
      showToast('Item removed from cart', 'success');
    }
    setRemovingId(null);
  };

  // 1. Not Authenticated
  if (!user) {
    return (
      <div className="content-card text-center" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', padding: '16px', background: '#eff6ff', borderRadius: '50%', color: '#2563eb', marginBottom: '16px' }}>
          <ShoppingBag size={36} />
        </div>
        <h2 className="card-title" style={{ fontSize: '1.4rem' }}>Sign In to View Your Cart</h2>
        <p className="card-description" style={{ maxWidth: '440px', margin: '0 auto 24px' }}>
          Your shopping cart is securely synchronized with your ShopKart account in MongoDB. Sign in to access your items or complete your checkout.
        </p>
        <button className="btn btn-primary btn-lg" onClick={openLoginModal}>
          Sign In Now
        </button>
      </div>
    );
  }

  // 2. Loading State
  if (loading && cartItems.length === 0) {
    return (
      <div className="content-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <RefreshCw size={32} className="spin-animate" style={{ color: '#2563eb', marginBottom: '12px' }} />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Loading your cart...</h3>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Retrieving live data from MongoDB</p>
      </div>
    );
  }

  // 3. Error State
  if (error && cartItems.length === 0) {
    return (
      <div className="content-card" style={{ padding: '40px 20px', textAlign: 'center' }}>
        <div className="response-box error" style={{ maxWidth: '500px', margin: '0 auto 20px' }}>
          <span className="response-title"><AlertCircle size={16} /> Error loading cart</span>
          <span>{error}</span>
        </div>
        <button className="btn btn-primary" onClick={fetchCart}>
          <RefreshCw size={15} /> Retry
        </button>
      </div>
    );
  }

  return (
    <section className="content-card">
      <div className="filter-row" style={{ alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '24px' }}>
        <div>
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={22} className="text-primary" />
            Shopping Cart
          </h2>
          <p className="card-description" style={{ marginBottom: 0 }}>
            {totalCartCount} {totalCartCount === 1 ? 'unit' : 'units'} across {cartItems.length} distinct {cartItems.length === 1 ? 'item' : 'items'} in your cart.
          </p>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={fetchCart} title="Refresh cart">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {toastNotice && (
        <div className={`response-box ${toastNotice.type}`} style={{ marginBottom: '20px' }}>
          <span>{toastNotice.msg}</span>
        </div>
      )}

      {/* 4. Empty Cart State */}
      {cartItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
          <div style={{ display: 'inline-flex', padding: '16px', background: '#f8fafc', borderRadius: '50%', color: '#94a3b8', marginBottom: '16px' }}>
            <ShoppingBag size={42} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>
            Your cart is empty
          </h3>
          <p style={{ maxWidth: '420px', margin: '0 auto 24px', fontSize: '0.9rem' }}>
            Explore our curated selection of high-performance gear and add items to your cart.
          </p>
          <button className="btn btn-primary" onClick={onNavigateToProducts}>
            Browse Storefront <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        /* 5. Cart Table and Summary */
        <div>
          <div style={{ overflowX: 'auto' }}>
            <table className="cart-table">
              <thead>
                <tr>
                  <th style={{ width: '45%' }}>Product</th>
                  <th style={{ width: '15%' }}>Unit Price</th>
                  <th style={{ width: '20%' }}>Quantity</th>
                  <th style={{ width: '12%' }}>Subtotal</th>
                  <th style={{ width: '8%', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map(item => {
                  const product = item.product || {};
                  const isUpdating = updatingId === product._id;
                  const isRemoving = removingId === product._id;
                  const maxStock = product.stock !== undefined ? product.stock : 99;
                  const lineTotal = (product.price || 0) * (item.quantity || 1);

                  return (
                    <tr key={product._id || item._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <img
                            src={product.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100'}
                            alt={product.name}
                            style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                          />
                          <div>
                            <strong style={{ fontSize: '0.95rem', color: '#0f172a', display: 'block' }}>
                              {product.name}
                            </strong>
                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                              Category: {product.category}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, marginTop: '2px' }}>
                              In Stock: {maxStock} units
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span style={{ fontWeight: 600 }}>${(product.price || 0).toFixed(2)}</span>
                      </td>

                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '2px 8px', height: '26px' }}
                            disabled={isUpdating || item.quantity <= 1}
                            onClick={() => handleQtyChange(product._id, item.quantity, maxStock, -1)}
                            title="Decrease quantity"
                          >
                            <Minus size={12} />
                          </button>

                          <span style={{ minWidth: '28px', textAlign: 'center', fontWeight: 700, fontSize: '0.92rem' }}>
                            {item.quantity}
                          </span>

                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '2px 8px', height: '26px' }}
                            disabled={isUpdating || item.quantity >= maxStock}
                            onClick={() => handleQtyChange(product._id, item.quantity, maxStock, 1)}
                            title="Increase quantity"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        {item.quantity >= maxStock && (
                          <div style={{ fontSize: '0.72rem', color: '#ea580c', marginTop: '4px' }}>
                            Max stock reached
                          </div>
                        )}
                      </td>

                      <td>
                        <strong style={{ fontSize: '1rem', color: '#0f172a' }}>
                          ${lineTotal.toFixed(2)}
                        </strong>
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="btn btn-danger btn-sm"
                          style={{ padding: '5px 10px' }}
                          disabled={isRemoving}
                          onClick={() => handleRemove(product._id)}
                          title="Remove item from cart"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Cart Summary Card */}
          <div
            style={{
              marginTop: '24px',
              padding: '24px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              maxWidth: '480px',
              marginLeft: 'auto'
            }}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid #cbd5e1', paddingBottom: '8px' }}>
              Order Summary
            </h3>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#475569' }}>
              <span>Total Items:</span>
              <strong>{totalCartCount} units</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
              <span>Subtotal:</span>
              <span style={{ color: '#2563eb' }}>${cartSubtotal.toFixed(2)}</span>
            </div>

            <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Taxes and shipping calculated at checkout. Real stock validated on server before order placement.
            </p>

            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%', gap: '10px' }}
              onClick={onNavigateToCheckout}
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
