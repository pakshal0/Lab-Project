import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, CheckCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const CartDrawer = ({ isOpen, onClose, cartItems, onUpdateQuantity, onRemoveItem, onClearCart, onShowToast }) => {
  const { user, openLoginModal } = useAuth();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutCompleted, setCheckoutCompleted] = useState(false);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = user ? subtotal * 0.1 : 0; // 10% member discount
  const finalTotal = subtotal - discount;

  const handleCheckout = () => {
    setIsCheckingOut(true);
    setTimeout(() => {
      setIsCheckingOut(false);
      setCheckoutCompleted(true);
      onClearCart();
      onShowToast('Order simulated successfully! Thank you for shopping with ShopKart.', 'success');
    }, 1500);
  };

  const handleClose = () => {
    setCheckoutCompleted(false);
    onClose();
  };

  return (
    <div className="cart-drawer-backdrop" onClick={handleClose}>
      <div className="cart-drawer-panel" onClick={e => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="cart-drawer-header">
          <div className="cart-header-title">
            <ShoppingBag size={20} className="cart-header-icon" />
            <h3>Your Shopping Bag</h3>
            <span className="cart-item-count-tag">
              {cartItems.reduce((acc, it) => acc + it.quantity, 0)} items
            </span>
          </div>
          <button className="modal-close-btn" onClick={handleClose} aria-label="Close cart">
            <X size={20} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="cart-drawer-body">
          {checkoutCompleted ? (
            <div className="cart-checkout-success">
              <div className="success-icon-circle">
                <CheckCircle size={40} className="text-emerald" />
              </div>
              <h4 className="success-title">Order Confirmed!</h4>
              <p className="success-desc">
                Your order has been recorded. Since you are {user ? `authenticated as ${user.fullName}` : 'checking out as guest'}, confirmation details were processed.
              </p>
              <button className="btn btn-primary" onClick={handleClose}>
                Continue Shopping
              </button>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="cart-empty-state">
              <ShoppingBag size={48} className="empty-cart-icon" />
              <h4>Your bag is currently empty</h4>
              <p>Explore our premium hardware catalog and add items to your cart.</p>
              <button className="btn btn-primary btn-sm" onClick={handleClose}>
                Browse Catalog
              </button>
            </div>
          ) : (
            <div className="cart-items-list">
              {cartItems.map(item => (
                <div key={item.id} className="cart-item-row">
                  <img src={item.image} alt={item.name} className="cart-item-thumbnail" />
                  <div className="cart-item-details">
                    <h5 className="cart-item-title">{item.name}</h5>
                    <span className="cart-item-price">${item.price.toFixed(2)}</span>
                    <div className="cart-qty-controls">
                      <button
                        className="qty-btn"
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="qty-number">{item.quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        aria-label="Increase quantity"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                  <button
                    className="cart-item-remove-btn"
                    onClick={() => onRemoveItem(item.id)}
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {cartItems.length > 0 && !checkoutCompleted && (
          <div className="cart-drawer-footer">
            {!user && (
              <div className="cart-member-perk-banner" onClick={openLoginModal}>
                <ShieldCheck size={16} className="text-primary" />
                <span>Log in to apply 10% Member Discount</span>
              </div>
            )}

            <div className="cart-summary-line">
              <span className="summary-label">Subtotal</span>
              <span className="summary-val">${subtotal.toFixed(2)}</span>
            </div>

            {user && (
              <div className="cart-summary-line discount">
                <span className="summary-label">Member Discount (10%)</span>
                <span className="summary-val text-emerald">-${discount.toFixed(2)}</span>
              </div>
            )}

            <div className="cart-summary-line total">
              <span className="summary-label">Total</span>
              <span className="summary-val">${finalTotal.toFixed(2)}</span>
            </div>

            <button
              className="btn btn-primary btn-lg w-full checkout-action-btn"
              onClick={handleCheckout}
              disabled={isCheckingOut}
            >
              {isCheckingOut ? (
                <span className="loading-spinner"></span>
              ) : (
                <>
                  <span>Complete Checkout</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
