import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch authenticated user's cart from backend
  const fetchCart = useCallback(async () => {
    if (!user) {
      setCartItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/cart', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCartItems(data.cart || []);
      } else {
        setError(data.message || 'Failed to load cart');
      }
    } catch (err) {
      setError(err.message || 'Could not connect to server');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Synchronize cart on initial load and when user login/logout state changes
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Add item to cart
  const addToCart = async (productId) => {
    if (!user) {
      return { success: false, requireAuth: true, message: 'Please log in to add items to your cart' };
    }

    try {
      const res = await fetch(`/cart/${productId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, message: data.message || 'Failed to add item to cart' };
      }

      setCartItems(data.cart || []);
      return { success: true, message: data.message || 'Added to cart' };
    } catch (err) {
      return { success: false, message: err.message || 'Connection error' };
    }
  };

  // Update item quantity
  const updateQuantity = async (productId, quantity) => {
    if (!user) return { success: false, requireAuth: true };

    try {
      const res = await fetch(`/cart/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
        credentials: 'include'
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, message: data.message || 'Failed to update quantity' };
      }

      setCartItems(data.cart || []);
      return { success: true, message: data.message };
    } catch (err) {
      return { success: false, message: err.message || 'Connection error' };
    }
  };

  // Remove item from cart
  const removeFromCart = async (productId) => {
    if (!user) return { success: false, requireAuth: true };

    try {
      const res = await fetch(`/cart/${productId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, message: data.message || 'Failed to remove item' };
      }

      setCartItems(data.cart || []);
      return { success: true, message: data.message };
    } catch (err) {
      return { success: false, message: err.message || 'Connection error' };
    }
  };

  // Clear cart after verified payment
  const clearCart = () => {
    setCartItems([]);
  };

  // Derived values
  const totalCartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const cartSubtotal = cartItems.reduce(
    (sum, item) => sum + (item.product?.price || 0) * (item.quantity || 0),
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loading,
        error,
        totalCartCount,
        cartSubtotal,
        fetchCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
