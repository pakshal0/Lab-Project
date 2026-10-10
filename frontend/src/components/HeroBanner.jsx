import React from 'react';
import { ShieldCheck, Zap, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const HeroBanner = ({ onShopNow }) => {
  const { user, openRegisterModal, setProfileModalOpen } = useAuth();

  return (
    <div className="hero-section glass-card">
      <div className="hero-glow-blob"></div>
      
      <div className="hero-content">
        <div className="hero-badge-row">
          <span className="badge badge-primary">
            <Sparkles size={13} />
            E-Commerce Architecture 2026
          </span>
          <span className="badge badge-emerald">
            <ShieldCheck size={13} />
            JWT HttpOnly Cookie Auth Active
          </span>
        </div>

        <h1 className="hero-title">
          Engineered for Performance. <br />
          <span className="hero-title-gradient">Secured for Modern Commerce.</span>
        </h1>

        <p className="hero-description">
          ShopKart combines a robust Express & MongoDB authentication backend with an ultra-fluid React storefront. Experience seamless customer sessions, protected endpoints, and instant cart management.
        </p>

        <div className="hero-actions">
          <button className="btn btn-primary btn-lg" onClick={onShopNow}>
            Explore Products
            <ArrowRight size={18} />
          </button>

          {user ? (
            <button className="btn btn-secondary btn-lg" onClick={() => setProfileModalOpen(true)}>
              View Customer Profile
            </button>
          ) : (
            <button className="btn btn-secondary btn-lg" onClick={openRegisterModal}>
              <Lock size={16} />
              Join ShopKart Rewards
            </button>
          )}
        </div>

        {/* System Tech Highlights */}
        <div className="hero-features-grid">
          <div className="hero-feature-item">
            <div className="feature-icon-wrapper cyan">
              <Zap size={16} />
            </div>
            <div>
              <h4 className="feature-title">Fast Rest APIs</h4>
              <p className="feature-desc">Express + In-Memory Mongo DB fallback</p>
            </div>
          </div>

          <div className="hero-feature-item">
            <div className="feature-icon-wrapper purple">
              <Lock size={16} />
            </div>
            <div>
              <h4 className="feature-title">HttpOnly Cookies</h4>
              <p className="feature-desc">Secure JWT session without XSS exposure</p>
            </div>
          </div>

          <div className="hero-feature-item">
            <div className="feature-icon-wrapper emerald">
              <ShieldCheck size={16} />
            </div>
            <div>
              <h4 className="feature-title">Protected Routes</h4>
              <p className="feature-desc">Verified customer profile via /customers/me</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
