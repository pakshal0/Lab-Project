import React, { useState } from 'react';
import { X, Star, ShoppingBag, Heart, ShieldCheck, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export const ProductDetailModal = ({ product, isWishlisted, onToggleWishlist, onClose }) => {
  const { addToCart } = useCart();
  const { user, openLoginModal } = useAuth();
  const [added, setAdded] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  if (!product) return null;

  const handleAddToCart = async () => {
    if (!user) {
      openLoginModal();
      return;
    }
    const res = await addToCart(product._id);
    if (res.success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  const handleWishlistClick = async () => {
    if (!user) {
      openLoginModal();
      return;
    }
    setWishlistLoading(true);
    await onToggleWishlist(product._id);
    setWishlistLoading(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          maxWidth: '680px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
          padding: '24px',
          position: 'relative'
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
          aria-label="Close"
        >
          <X size={22} />
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)', gap: '24px' }}>
          <div>
            <img
              src={product.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'}
              alt={product.name}
              style={{ width: '100%', height: '260px', objectFit: 'cover', borderRadius: '8px' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="product-category-tag">{product.category}</span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
              {product.name}
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', color: '#f59e0b' }}>
                <Star size={16} fill="#f59e0b" color="#f59e0b" />
                <span style={{ fontWeight: 700, marginLeft: '4px', fontSize: '0.9rem' }}>{product.rating || 4.5}</span>
              </div>
              <span style={{ color: '#94a3b8' }}>•</span>
              <span style={{ fontSize: '0.85rem', color: (product.stock > 0) ? '#059669' : '#dc2626', fontWeight: 600 }}>
                {product.stock > 0 ? `In Stock (${product.stock} units)` : 'Out of Stock'}
              </span>
            </div>

            <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: '1.5', marginBottom: '20px', flex: 1 }}>
              {product.description}
            </p>

            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>
              ${(product.price || 0).toFixed(2)}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className={`btn ${added ? 'btn-secondary' : 'btn-primary'}`}
                style={{ flex: 1, gap: '8px' }}
                disabled={product.stock <= 0 || added}
                onClick={handleAddToCart}
              >
                {added ? (
                  <>
                    <Check size={16} className="text-emerald" />
                    <span>Added to Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={16} />
                    <span>Add to Cart</span>
                  </>
                )}
              </button>

              <button
                className={`btn ${isWishlisted ? 'btn-danger' : 'btn-secondary'}`}
                disabled={wishlistLoading}
                onClick={handleWishlistClick}
                title={isWishlisted ? 'Remove from Wishlist' : 'Save to Wishlist'}
              >
                <Heart size={18} fill={isWishlisted ? '#ffffff' : 'none'} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
