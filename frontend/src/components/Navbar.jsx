import React, { useState } from 'react';
import { ShoppingBag, User, LogOut, Search, Sparkles, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar = ({ cartCount, onOpenCart, searchTerm, onSearchChange }) => {
  const { user, openLoginModal, openRegisterModal, logout, setProfileModalOpen } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="navbar-wrapper">
      <div className="navbar-container">
        {/* Brand Logo */}
        <div className="navbar-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="brand-icon-box">
            <ShoppingBag className="brand-icon" size={20} />
          </div>
          <div className="brand-text-group">
            <span className="brand-name">Shop<span className="brand-accent">Kart</span></span>
            <span className="brand-subtext">Auth & Storefront</span>
          </div>
        </div>

        {/* Global Product Search */}
        <div className="navbar-search">
          <Search size={17} className="search-icon" />
          <input
            type="text"
            placeholder="Search high-performance gear, wearables, audio..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button className="search-clear-btn" onClick={() => onSearchChange('')}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="navbar-actions">
          {/* Cart Trigger */}
          <button className="cart-trigger-btn" onClick={onOpenCart} aria-label="View Shopping Cart">
            <ShoppingBag size={19} />
            <span className="cart-label">Cart</span>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>

          {/* User Authentication Status */}
          {user ? (
            <div className="user-profile-menu">
              <button
                className="user-pill-btn"
                onClick={() => setProfileModalOpen(true)}
                title="View Customer Profile"
              >
                <div className="user-avatar-circle">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="user-name-box">
                  <span className="user-display-name">{user.fullName}</span>
                  <span className="user-status-tag">Verified Customer</span>
                </div>
              </button>

              <button
                className="btn btn-secondary btn-sm logout-nav-btn"
                onClick={logout}
                title="Sign out of account"
              >
                <LogOut size={15} />
                <span className="logout-text">Logout</span>
              </button>
            </div>
          ) : (
            <div className="auth-action-buttons">
              <button className="btn btn-secondary btn-sm" onClick={openLoginModal}>
                Sign In
              </button>
              <button className="btn btn-primary btn-sm" onClick={openRegisterModal}>
                <Sparkles size={14} />
                Register
              </button>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="mobile-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-menu-drawer">
          <div className="mobile-search-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="mobile-menu-actions">
            {user ? (
              <>
                <button
                  className="btn btn-secondary w-full"
                  onClick={() => {
                    setProfileModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                >
                  <User size={16} /> My Account ({user.fullName})
                </button>
                <button
                  className="btn btn-danger w-full"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn btn-secondary w-full"
                  onClick={() => {
                    openLoginModal();
                    setMobileMenuOpen(false);
                  }}
                >
                  Sign In
                </button>
                <button
                  className="btn btn-primary w-full"
                  onClick={() => {
                    openRegisterModal();
                    setMobileMenuOpen(false);
                  }}
                >
                  <Sparkles size={15} /> Create Account
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
