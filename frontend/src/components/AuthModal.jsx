import React, { useState } from 'react';
import { X, Lock, Mail, User, Phone, CheckCircle, AlertCircle, ArrowRight, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthModal = ({ onShowToast }) => {
  const { authModalOpen, setAuthModalOpen, authModalTab, setAuthModalTab, login, register } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: ''
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!authModalOpen) return null;

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (errorMessage) setErrorMessage('');
  };

  const handleTabSwitch = (tab) => {
    setAuthModalTab(tab);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleFillDemo = (type) => {
    const timestamp = Date.now().toString().slice(-4);
    if (type === 'register') {
      setFormData({
        fullName: 'Alex Morgan',
        email: `alex_${timestamp}@shopkart.io`,
        password: 'securePassword123',
        phone: '9876543210'
      });
    } else {
      setFormData(prev => ({
        ...prev,
        email: 'alex_demo@shopkart.io',
        password: 'securePassword123'
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Frontend validation
    if (authModalTab === 'register') {
      if (!formData.fullName.trim()) {
        setErrorMessage('Full name is required');
        return;
      }
      if (!formData.email.trim()) {
        setErrorMessage('Email address is required');
        return;
      }
      if (!formData.password || formData.password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long');
        return;
      }
      if (!formData.phone.trim()) {
        setErrorMessage('Phone number is required');
        return;
      }

      setIsSubmitting(true);
      const res = await register(formData);
      setIsSubmitting(false);

      if (res.success) {
        setSuccessMessage('Registration successful! Logging you into your new account...');
        onShowToast('Account registered successfully! Welcome to ShopKart.', 'success');
        // Automatically sign in with the newly registered credentials
        setTimeout(async () => {
          await login(formData.email, formData.password);
        }, 1200);
      } else {
        setErrorMessage(res.message);
      }
    } else {
      // Login validation
      if (!formData.email.trim() || !formData.password) {
        setErrorMessage('Please enter both email and password');
        return;
      }

      setIsSubmitting(true);
      const res = await login(formData.email, formData.password);
      setIsSubmitting(false);

      if (res.success) {
        onShowToast(`Welcome back, ${res.customer.fullName}!`, 'success');
      } else {
        setErrorMessage(res.message);
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setAuthModalOpen(false)}>
      <div className="modal-container auth-modal" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="auth-tab-switch">
            <button
              className={`auth-tab-btn ${authModalTab === 'login' ? 'active' : ''}`}
              onClick={() => handleTabSwitch('login')}
            >
              Sign In
            </button>
            <button
              className={`auth-tab-btn ${authModalTab === 'register' ? 'active' : ''}`}
              onClick={() => handleTabSwitch('register')}
            >
              Create Account
            </button>
          </div>

          <button
            className="modal-close-btn"
            onClick={() => setAuthModalOpen(false)}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          <div className="auth-intro">
            <h3 className="auth-headline">
              {authModalTab === 'login' ? 'Welcome Back to ShopKart' : 'Create Your Customer Account'}
            </h3>
            <p className="auth-subhead">
              {authModalTab === 'login'
                ? 'Enter your credentials to access your profile, orders, and rewards.'
                : 'Join ShopKart to unlock encrypted profile sessions and priority orders.'}
            </p>
          </div>

          {/* Quick Demo Fill Helper */}
          <div className="demo-fill-card">
            <div className="demo-fill-text">
              <KeyRound size={15} className="demo-key-icon" />
              <span>Testing the lab evaluation?</span>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => handleFillDemo(authModalTab)}
            >
              Auto-fill sample data
            </button>
          </div>

          {/* Notifications */}
          {errorMessage && (
            <div className="alert-box alert-error">
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="alert-box alert-success">
              <CheckCircle size={18} />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {authModalTab === 'register' && (
              <>
                <div className="form-group">
                  <label className="form-label" htmlFor="fullName">Full Name</label>
                  <div className="input-with-icon">
                    <User size={18} className="input-icon" />
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      placeholder="e.g. John Doe"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="phone">Phone Number</label>
                  <div className="input-with-icon">
                    <Phone size={18} className="input-icon" />
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={formData.phone}
                      onChange={handleChange}
                      className="form-input"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@domain.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder={authModalTab === 'register' ? 'Minimum 6 characters' : 'Enter password'}
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              {authModalTab === 'register' && (
                <span className="input-help-text">Password must contain at least 6 characters.</span>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg w-full submit-auth-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="loading-spinner"></span>
              ) : (
                <>
                  {authModalTab === 'login' ? 'Sign In to Account' : 'Register Customer'}
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          {/* Switch Prompt */}
          <div className="auth-footer-prompt">
            {authModalTab === 'login' ? (
              <span>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  className="link-button"
                  onClick={() => handleTabSwitch('register')}
                >
                  Create one now
                </button>
              </span>
            ) : (
              <span>
                Already registered?{' '}
                <button
                  type="button"
                  className="link-button"
                  onClick={() => handleTabSwitch('login')}
                >
                  Sign in
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
