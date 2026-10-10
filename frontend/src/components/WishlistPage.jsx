import React, { useState, useEffect, useCallback } from 'react';
import { Heart, Trash2, ShoppingBag, Eye, RefreshCw, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export const WishlistPage = ({ onNavigateToProducts, onSelectProduct }) => {
  const { user, openLoginModal } = useAuth();
  const { addToCart } = useCart();

  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [addingToCartId, setAddingToCartId] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  // Fetch real wishlist data from backend
  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlistItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/wishlist', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setWishlistItems(data.wishlist || []);
      } else {
        setError(data.message || 'Failed to load wishlist');
      }
    } catch (err) {
      setError(err.message || 'Could not connect to backend server');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  // Remove product from wishlist
  const handleRemove = async (productId) => {
    try {
      setRemovingId(productId);
      const res = await fetch(`/wishlist/${productId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setWishlistItems(prev => prev.filter(item => item._id !== productId));
        setFeedbackMessage({ type: 'success', text: 'Product removed from wishlist' });
        setTimeout(() => setFeedbackMessage(null), 2500);
      } else {
        setFeedbackMessage({ type: 'error', text: data.message || 'Failed to remove from wishlist' });
      }
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Connection error' });
    } finally {
      setRemovingId(null);
    }
  };

  // Add to cart from wishlist
  const handleAddToCart = async (product) => {
    setAddingToCartId(product._id);
    const res = await addToCart(product._id);
    if (res.success) {
      setFeedbackMessage({ type: 'success', text: `Added "${product.name}" to cart!` });
    } else {
      setFeedbackMessage({ type: 'error', text: res.message || 'Failed to add to cart' });
    }
    setTimeout(() => setFeedbackMessage(null), 3000);
    setAddingToCartId(null);
  };

  // 1. Not Logged In State
  if (!user) {
    return (
      <div className="content-card text-center" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', padding: '16px', background: '#eff6ff', borderRadius: '50%', color: '#2563eb', marginBottom: '16px' }}>
          <Heart size={36} />
        </div>
        <h2 className="card-title" style={{ fontSize: '1.4rem' }}>Your Wishlist is Waiting</h2>
        <p className="card-description" style={{ maxWidth: '440px', margin: '0 auto 24px' }}>
          Please sign in to view your saved wishlist items, track favorites, and move them to your cart across devices.
        </p>
        <button className="btn btn-primary btn-lg" onClick={openLoginModal}>
          Sign In to Access Wishlist
        </button>
      </div>
    );
  }

  // 2. Loading State
  if (loading) {
    return (
      <div className="content-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', padding: '16px', color: '#2563eb', marginBottom: '12px' }}>
          <RefreshCw size={32} className="spin-animate" />
        </div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Loading your saved wishlist...</h3>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Connecting to MongoDB</p>
      </div>
    );
  }

  // 3. Error State with Retry
  if (error) {
    return (
      <div className="content-card" style={{ padding: '40px 20px', textAlign: 'center' }}>
        <div className="response-box error" style={{ maxWidth: '500px', margin: '0 auto 20px' }}>
          <span className="response-title"><AlertCircle size={16} /> Error Loading Wishlist</span>
          <span>{error}</span>
        </div>
        <button className="btn btn-primary" onClick={fetchWishlist}>
          <RefreshCw size={15} /> Try Again
        </button>
      </div>
    );
  }

  return (
    <section className="content-card">
      <div className="filter-row" style={{ alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '24px' }}>
        <div>
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Heart size={22} className="text-red" fill="#ef4444" color="#ef4444" />
            My Saved Wishlist
          </h2>
          <p className="card-description" style={{ marginBottom: 0 }}>
            {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved in your account.
          </p>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={fetchWishlist} title="Refresh wishlist">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {feedbackMessage && (
        <div className={`response-box ${feedbackMessage.type}`} style={{ marginBottom: '20px' }}>
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* 4. Empty State */}
      {wishlistItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
          <div style={{ display: 'inline-flex', padding: '16px', background: '#f8fafc', borderRadius: '50%', color: '#94a3b8', marginBottom: '16px' }}>
            <Heart size={40} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>
            Your wishlist is empty
          </h3>
          <p style={{ maxWidth: '420px', margin: '0 auto 24px', fontSize: '0.9rem' }}>
            Browse the product store and click the heart icon on any product to save it here for later.
          </p>
          <button className="btn btn-primary" onClick={onNavigateToProducts}>
            Browse Storefront <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        /* 5. Wishlist Grid */
        <div className="products-grid">
          {wishlistItems.map(item => {
            const isOutOfStock = item.stock !== undefined && item.stock <= 0;
            const isRemoving = removingId === item._id;
            const isAddingCart = addingToCartId === item._id;

            return (
              <div key={item._id} className="product-item-card" style={{ position: 'relative' }}>
                <img
                  src={item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'}
                  alt={item.name}
                  className="product-item-img"
                />

                <div className="product-item-content">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span className="product-category-tag">{item.category}</span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '12px',
                        backgroundColor: isOutOfStock ? '#fee2e2' : '#ecfdf5',
                        color: isOutOfStock ? '#b91c1c' : '#047857'
                      }}
                    >
                      {isOutOfStock ? 'Out of Stock' : `In Stock (${item.stock})`}
                    </span>
                  </div>

                  <h3 className="product-item-title">{item.name}</h3>
                  <p className="product-item-desc">{item.description}</p>

                  <div className="product-item-footer">
                    <span className="product-item-price">${(item.price || 0).toFixed(2)}</span>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => onSelectProduct && onSelectProduct(item)}
                        title="View Details"
                      >
                        <Eye size={14} />
                      </button>

                      <button
                        className="btn btn-primary btn-sm"
                        disabled={isOutOfStock || isAddingCart}
                        onClick={() => handleAddToCart(item)}
                        title="Move to cart"
                      >
                        <ShoppingBag size={14} />
                        {isAddingCart ? 'Adding...' : 'Add to Cart'}
                      </button>

                      <button
                        className="btn btn-danger btn-sm"
                        disabled={isRemoving}
                        onClick={() => handleRemove(item._id)}
                        title="Remove from wishlist"
                      >
                        <Trash2 size={14} />
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
  );
};
