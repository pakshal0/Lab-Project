import React from 'react';
import { X, User, Mail, Phone, ShieldCheck, Key, LogOut, CheckCircle, Database } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ProfileModal = ({ onShowToast }) => {
  const { user, profileModalOpen, setProfileModalOpen, logout } = useAuth();

  if (!profileModalOpen || !user) return null;

  const handleLogout = () => {
    logout();
    onShowToast('Successfully logged out', 'info');
  };

  return (
    <div className="modal-overlay" onClick={() => setProfileModalOpen(false)}>
      <div className="modal-container profile-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="profile-header-title">
            <ShieldCheck className="text-emerald" size={22} />
            <h3 className="modal-title">Customer Profile Dashboard</h3>
          </div>
          <button
            className="modal-close-btn"
            onClick={() => setProfileModalOpen(false)}
            aria-label="Close profile modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Avatar Hero Card */}
          <div className="profile-hero-card">
            <div className="profile-avatar-large">
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'C'}
            </div>
            <div className="profile-hero-details">
              <h2 className="profile-hero-name">{user.fullName}</h2>
              <p className="profile-hero-email">{user.email}</p>
              <div className="profile-badge-row">
                <span className="badge badge-emerald">
                  <CheckCircle size={12} />
                  Active JWT Session
                </span>
                <span className="badge badge-cyan">
                  <Database size={12} />
                  MongoDB Synchronized
                </span>
              </div>
            </div>
          </div>

          {/* Details List */}
          <div className="profile-details-grid">
            <div className="profile-detail-card">
              <div className="detail-icon-box">
                <User size={17} />
              </div>
              <div className="detail-text-box">
                <span className="detail-label">Registered Name</span>
                <span className="detail-value">{user.fullName}</span>
              </div>
            </div>

            <div className="profile-detail-card">
              <div className="detail-icon-box">
                <Mail size={17} />
              </div>
              <div className="detail-text-box">
                <span className="detail-label">Primary Email</span>
                <span className="detail-value">{user.email}</span>
              </div>
            </div>

            <div className="profile-detail-card">
              <div className="detail-icon-box">
                <Phone size={17} />
              </div>
              <div className="detail-text-box">
                <span className="detail-label">Phone Contact</span>
                <span className="detail-value">{user.phone || 'Not specified'}</span>
              </div>
            </div>

            <div className="profile-detail-card">
              <div className="detail-icon-box">
                <Key size={17} />
              </div>
              <div className="detail-text-box">
                <span className="detail-label">Customer ID (MongoDB _id)</span>
                <span className="detail-value code-font">{user._id}</span>
              </div>
            </div>
          </div>

          {/* Security Banner */}
          <div className="security-notice-card">
            <ShieldCheck size={20} className="security-icon" />
            <div>
              <h5 className="security-title">End-to-End Cookie Security</h5>
              <p className="security-desc">
                Your credentials are encrypted using bcrypt hashing (salt rounds: 10) and your active session is anchored to an HttpOnly cookie inaccessible to browser scripts.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="profile-modal-actions">
            <button className="btn btn-secondary w-full" onClick={() => setProfileModalOpen(false)}>
              Back to Store
            </button>
            <button className="btn btn-danger w-full" onClick={handleLogout}>
              <LogOut size={16} />
              Log Out of Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
