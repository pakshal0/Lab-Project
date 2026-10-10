import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  CreditCard,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  QrCode,
  Smartphone,
  Check,
  X,
  ExternalLink,
  Clock,
  Sparkles,
  Truck,
  FileCheck
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export const CheckoutPage = ({ onNavigateToCart, onOrderSuccess }) => {
  const { user } = useAuth();
  const { cartItems, cartSubtotal, totalCartCount, clearCart } = useCart();

  // Selected payment method: 'qr' | 'card'
  const [selectedMethod, setSelectedMethod] = useState('qr');

  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    addressLine: '',
    city: '',
    state: '',
    pincode: ''
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  // QR Payment Modal State
  const [qrModal, setQrModal] = useState(null);
  const [qrVerifying, setQrVerifying] = useState(false);
  const [countdown, setCountdown] = useState(600); // 10 minutes

  // Countdown timer for QR scanner
  useEffect(() => {
    let timer;
    if (qrModal && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [qrModal, countdown]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Field level validation
  const validateForm = () => {
    const newErrors = {};

    if (!form.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    const cleanPhone = form.phone.trim();
    if (!cleanPhone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(cleanPhone)) {
      newErrors.phone = 'Please enter a valid 10-digit mobile number';
    }

    if (!form.addressLine.trim()) {
      newErrors.addressLine = 'Street address line is required';
    }

    if (!form.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!form.state.trim()) {
      newErrors.state = 'State is required';
    }

    const cleanPincode = form.pincode.trim();
    if (!cleanPincode) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(cleanPincode)) {
      newErrors.pincode = 'Pincode must be exactly 6 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
    if (paymentError) setPaymentError(null);
  };

  // Quick fill sample shipping address for testing convenience
  const fillSampleAddress = () => {
    setForm({
      fullName: user?.fullName || 'John Doe',
      phone: '9876543210',
      addressLine: 'Flat 402, Sunshine Towers, MG Road',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001'
    });
    setErrors({});
  };

  // 1. Core Order Creation (Backend revalidates stock & calculates server total)
  const createBackendOrder = async () => {
    if (!validateForm()) return null;
    if (cartItems.length === 0) {
      setPaymentError('Your cart is empty. Add items before checking out.');
      return null;
    }

    setSubmitting(true);
    setPaymentError(null);

    try {
      const res = await fetch('/orders/create-payment-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingAddress: {
            fullName: form.fullName.trim(),
            phone: form.phone.trim(),
            addressLine: form.addressLine.trim(),
            city: form.city.trim(),
            state: form.state.trim(),
            pincode: form.pincode.trim()
          }
        }),
        credentials: 'include'
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setPaymentError(data.message || 'Failed to initialize payment order');
        setSubmitting(false);
        return null;
      }

      return data;
    } catch (err) {
      setPaymentError(err.message || 'Connection error creating order');
      setSubmitting(false);
      return null;
    }
  };

  // 2. Flow A: Pay via UPI QR Code Scanner
  const handlePayViaQr = async (e) => {
    e.preventDefault();
    const data = await createBackendOrder();
    if (!data) return;

    const { orderId, razorpayOrderId, amount, currency, keyId } = data;
    const orderAmountRupees = (amount / 100).toFixed(2);
    const upiUrl = `upi://pay?pa=shopkart@razorpay&pn=ShopKart&am=${orderAmountRupees}&cu=INR&tr=${razorpayOrderId}&tn=ShopKart_${orderId.slice(-6)}`;

    setQrModal({
      orderId,
      razorpayOrderId,
      amount: orderAmountRupees,
      amountInPaise: amount,
      currency: currency || 'INR',
      keyId,
      upiUrl,
      isClientCheckout: data.isClientCheckout
    });

    setCountdown(600);
    setSubmitting(false);
  };

  // 3. Flow B: Pay via Razorpay Native Card/Netbanking Popup
  const handlePayViaCard = async (e) => {
    e.preventDefault();
    const data = await createBackendOrder();
    if (!data) return;

    const { orderId, razorpayOrderId, amount, currency, keyId } = data;

    if (typeof window.Razorpay === 'undefined') {
      setPaymentError('Razorpay Checkout SDK is still loading. Please refresh and try again.');
      setSubmitting(false);
      return;
    }

    const options = {
      key: keyId,
      amount: amount,
      currency: currency || 'INR',
      name: 'ShopKart Store',
      description: `Order #${orderId.slice(-6).toUpperCase()}`,
      ...(data.isClientCheckout ? {} : { order_id: razorpayOrderId }),
      prefill: {
        name: form.fullName,
        contact: form.phone,
        email: user?.email || ''
      },
      theme: {
        color: '#2563eb'
      },
      handler: async function (response) {
        await verifyAndCompletePayment({
          orderId,
          razorpayOrderId: response.razorpay_order_id || razorpayOrderId,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature || 'test_mode_client_signature'
        });
      },
      modal: {
        ondismiss: function () {
          setSubmitting(false);
          setPaymentError('Payment window closed. Your items remain in your cart.');
        }
      }
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        setSubmitting(false);
        setPaymentError(`Payment failed: ${resp.error?.description || 'Declined'}. Cart remains intact.`);
      });
      rzp.open();
    } catch (err) {
      setPaymentError('Error opening Razorpay checkout: ' + err.message);
      setSubmitting(false);
    }
  };

  // 4. Server-Side Payment Verification (Common for both QR and Card)
  const verifyAndCompletePayment = async ({ orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
    setQrVerifying(true);
    setPaymentError(null);

    try {
      const res = await fetch('/orders/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature
        }),
        credentials: 'include'
      });

      const data = await res.json();
      if (res.ok && data.success) {
        clearCart();
        setQrModal(null);
        onOrderSuccess(orderId);
      } else {
        setPaymentError(data.message || 'Payment verification failed. Your cart has been retained.');
      }
    } catch (err) {
      setPaymentError('Network error while verifying payment: ' + err.message);
    } finally {
      setQrVerifying(false);
      setSubmitting(false);
    }
  };

  if (cartItems.length === 0 && !qrModal) {
    return (
      <div className="content-card text-center" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <h2 className="card-title">Checkout Unavailable</h2>
        <p className="card-description" style={{ maxWidth: '440px', margin: '0 auto 20px' }}>
          Your cart is currently empty. Please add items to your cart before proceeding to checkout.
        </p>
        <button className="btn btn-primary" onClick={onNavigateToCart}>
          <ArrowLeft size={16} /> Return to Cart
        </button>
      </div>
    );
  }

  return (
    <section className="content-card">
      {/* Top Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '24px' }}>
        <div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onNavigateToCart}
            style={{ marginBottom: '8px' }}
          >
            <ArrowLeft size={14} /> Back to Cart
          </button>
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Lock size={20} className="text-primary" />
            Secure Order Checkout
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontSize: '0.85rem', fontWeight: 600 }}>
          <ShieldCheck size={18} />
          <span>Razorpay Test Mode Active</span>
        </div>
      </div>

      {paymentError && (
        <div className="response-box error" style={{ marginBottom: '24px' }}>
          <span className="response-title"><AlertCircle size={16} /> Checkout Notice</span>
          <span>{paymentError}</span>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="checkout-layout-grid">
        {/* Left Column: Form & Payment Method Selection */}
        <div>
          {/* STEP 1: Delivery Details */}
          <div className="checkout-step-card">
            <div className="checkout-step-header">
              <div className="checkout-step-number">1</div>
              <h3 className="checkout-step-title">Shipping & Delivery Information</h3>
            </div>

            <div className="demo-helper" style={{ marginBottom: '16px' }}>
              <span>Quickly test with sample delivery details?</span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={fillSampleAddress}
              >
                Fill Sample Address
              </button>
            </div>

            <div>
              <div className="form-group">
                <label className="form-label" htmlFor="checkout-fullname">Full Name *</label>
                <input
                  id="checkout-fullname"
                  type="text"
                  className="form-input"
                  placeholder="e.g. John Doe"
                  value={form.fullName}
                  onChange={e => handleInputChange('fullName', e.target.value)}
                />
                {errors.fullName && <span style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{errors.fullName}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="checkout-phone">10-Digit Mobile Phone *</label>
                <input
                  id="checkout-phone"
                  type="tel"
                  maxLength={10}
                  className="form-input"
                  placeholder="e.g. 9876543210"
                  value={form.phone}
                  onChange={e => handleInputChange('phone', e.target.value)}
                />
                {errors.phone && <span style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{errors.phone}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="checkout-address">Street Address Line *</label>
                <input
                  id="checkout-address"
                  type="text"
                  className="form-input"
                  placeholder="House / Flat No., Street, Area"
                  value={form.addressLine}
                  onChange={e => handleInputChange('addressLine', e.target.value)}
                />
                {errors.addressLine && <span style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{errors.addressLine}</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="checkout-city">City *</label>
                  <input
                    id="checkout-city"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Bangalore"
                    value={form.city}
                    onChange={e => handleInputChange('city', e.target.value)}
                  />
                  {errors.city && <span style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{errors.city}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="checkout-state">State *</label>
                  <input
                    id="checkout-state"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Karnataka"
                    value={form.state}
                    onChange={e => handleInputChange('state', e.target.value)}
                  />
                  {errors.state && <span style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{errors.state}</span>}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="checkout-pincode">6-Digit Pincode *</label>
                <input
                  id="checkout-pincode"
                  type="text"
                  maxLength={6}
                  className="form-input"
                  placeholder="e.g. 560001"
                  value={form.pincode}
                  onChange={e => handleInputChange('pincode', e.target.value)}
                />
                {errors.pincode && <span style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{errors.pincode}</span>}
              </div>
            </div>
          </div>

          {/* STEP 2: Payment Method Selection */}
          <div className="checkout-step-card">
            <div className="checkout-step-header">
              <div className="checkout-step-number">2</div>
              <h3 className="checkout-step-title">Select Payment Method</h3>
            </div>

            <div className="payment-methods-group">
              {/* Option A: UPI QR Code Scanner */}
              <div
                className={`payment-method-card ${selectedMethod === 'qr' ? 'active' : ''}`}
                onClick={() => setSelectedMethod('qr')}
              >
                <div className="payment-method-radio">
                  {selectedMethod === 'qr' && <div className="payment-method-radio-dot"></div>}
                </div>

                <div className="payment-method-info">
                  <div className="payment-method-title-row">
                    <span className="payment-method-name">
                      <QrCode size={18} style={{ color: '#2563eb' }} />
                      UPI QR Code Scanner
                    </span>
                    <span className="payment-method-tag green">Recommended • Instant</span>
                  </div>
                  <p className="payment-method-desc">
                    Scan with any UPI app (Google Pay, PhonePe, Paytm, BHIM) on your mobile screen.
                  </p>
                </div>
              </div>

              {/* Option B: Credit / Debit Card & Netbanking */}
              <div
                className={`payment-method-card ${selectedMethod === 'card' ? 'active' : ''}`}
                onClick={() => setSelectedMethod('card')}
              >
                <div className="payment-method-radio">
                  {selectedMethod === 'card' && <div className="payment-method-radio-dot"></div>}
                </div>

                <div className="payment-method-info">
                  <div className="payment-method-title-row">
                    <span className="payment-method-name">
                      <CreditCard size={18} style={{ color: '#2563eb' }} />
                      Cards, Netbanking & Wallets
                    </span>
                    <span className="payment-method-tag blue">Razorpay Gateway</span>
                  </div>
                  <p className="payment-method-desc">
                    Visa, Mastercard, RuPay, Maestro & Netbanking across 50+ banks.
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Action Button */}
            {selectedMethod === 'qr' ? (
              <div>
                <button
                  type="button"
                  className="btn btn-primary btn-lg btn-block"
                  style={{ gap: '10px', backgroundColor: '#059669', borderColor: '#059669' }}
                  disabled={submitting}
                  onClick={handlePayViaQr}
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={18} className="spin-animate" />
                      <span>Generating QR Code...</span>
                    </>
                  ) : (
                    <>
                      <QrCode size={19} />
                      <span>Open UPI QR Code Scanner (₹{cartSubtotal.toFixed(2)})</span>
                    </>
                  )}
                </button>
                <span style={{ display: 'block', textAlign: 'center', fontSize: '0.78rem', color: '#64748b', marginTop: '8px' }}>
                  A live QR code with instant simulation options will open.
                </span>
              </div>
            ) : (
              <div>
                <button
                  type="button"
                  className="btn btn-primary btn-lg btn-block"
                  style={{ gap: '10px' }}
                  disabled={submitting}
                  onClick={handlePayViaCard}
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={18} className="spin-animate" />
                      <span>Connecting to Razorpay...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard size={19} />
                      <span>Pay with Razorpay Card Gateway (₹{cartSubtotal.toFixed(2)})</span>
                    </>
                  )}
                </button>
                <span style={{ display: 'block', textAlign: 'center', fontSize: '0.78rem', color: '#64748b', marginTop: '8px' }}>
                  Opens the official Razorpay test mode payment window.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sticky Order Summary */}
        <div>
          <div className="order-summary-sticky">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, borderBottom: '1px solid #cbd5e1', paddingBottom: '10px', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Order Summary</span>
              <span style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 600 }}>{totalCartCount} units</span>
            </h3>

            {/* Itemized list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '340px', overflowY: 'auto', marginBottom: '16px' }}>
              {cartItems.map(item => {
                const product = item.product || {};
                const lineTotal = (product.price || 0) * (item.quantity || 1);

                return (
                  <div key={product._id || item._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                    <img
                      src={product.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=80'}
                      alt={product.name}
                      style={{ width: '46px', height: '46px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {product.name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        Qty: {item.quantity} × ${(product.price || 0).toFixed(2)}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                      ${lineTotal.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Price Calculations */}
            <div style={{ borderTop: '2px solid #cbd5e1', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#475569' }}>
                <span>Subtotal</span>
                <span>${cartSubtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#059669', fontWeight: 600 }}>
                <span>Delivery Fee</span>
                <span>FREE (Promotional)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                <span>Total Amount:</span>
                <span style={{ color: '#2563eb' }}>${cartSubtotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Trust and Safety Badges */}
            <div style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#334155' }}>
                <ShieldCheck size={16} className="text-primary" />
                <span>256-Bit SSL Bank-Grade Encryption</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#334155' }}>
                <FileCheck size={16} style={{ color: '#059669' }} />
                <span>Purchase-Time Price & Name Freeze</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#334155' }}>
                <Truck size={16} style={{ color: '#d97706' }} />
                <span>Instant Order Confirmation Dispatch</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== RAZORPAY UPI QR CODE SCANNER MODAL ==================== */}
      {qrModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            padding: '16px',
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => {
            if (!qrVerifying) setQrModal(null);
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '460px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                backgroundColor: '#1e293b',
                color: '#ffffff',
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <QrCode size={20} style={{ color: '#38bdf8' }} />
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Razorpay Secure Checkout</h3>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>UPI QR Scanner • Test Mode</span>
                </div>
              </div>

              {!qrVerifying && (
                <button
                  onClick={() => setQrModal(null)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px 20px', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#ecfdf5', color: '#047857', padding: '4px 12px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '14px' }}>
                <Clock size={14} />
                <span>Expires in {formatTimer(countdown)}</span>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                  Amount to Pay
                </span>
                <span style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a' }}>
                  ₹{qrModal.amount}
                </span>
              </div>

              {/* QR Code Frame */}
              <div
                style={{
                  display: 'inline-block',
                  padding: '14px',
                  backgroundColor: '#ffffff',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  position: 'relative',
                  marginBottom: '14px'
                }}
              >
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrModal.upiUrl)}`}
                  alt="Razorpay UPI QR Code"
                  style={{ width: '200px', height: '200px', display: 'block', borderRadius: '6px' }}
                />

                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: '#ffffff',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    color: '#2563eb',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  SHOPKART
                </div>
              </div>

              <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '8px', fontWeight: 600 }}>
                Scan with any UPI app on your mobile phone
              </p>

              {/* UPI App Pills */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
                <span style={{ fontSize: '0.72rem', background: '#f1f5f9', color: '#334155', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>Google Pay</span>
                <span style={{ fontSize: '0.72rem', background: '#f1f5f9', color: '#334155', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>PhonePe</span>
                <span style={{ fontSize: '0.72rem', background: '#f1f5f9', color: '#334155', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>Paytm</span>
                <span style={{ fontSize: '0.72rem', background: '#f1f5f9', color: '#334155', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>BHIM UPI</span>
                <span style={{ fontSize: '0.72rem', background: '#f1f5f9', color: '#334155', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>Cred</span>
              </div>

              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '18px', backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '6px' }}>
                Order Ref: <strong style={{ color: '#0284c7' }}>#{qrModal.orderId.slice(-6).toUpperCase()}</strong> • Razorpay ID: <span style={{ fontFamily: 'monospace' }}>{qrModal.razorpayOrderId}</span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-block btn-lg"
                  style={{ gap: '8px', backgroundColor: '#059669', borderColor: '#059669' }}
                  disabled={qrVerifying}
                  onClick={() =>
                    verifyAndCompletePayment({
                      orderId: qrModal.orderId,
                      razorpayOrderId: qrModal.razorpayOrderId,
                      razorpayPaymentId: 'pay_' + Date.now().toString(36).toUpperCase(),
                      razorpaySignature: 'test_mode_client_signature'
                    })
                  }
                >
                  {qrVerifying ? (
                    <>
                      <RefreshCw size={18} className="spin-animate" />
                      <span>Verifying Payment with Razorpay...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      <span>I've Paid / Simulate Payment Success</span>
                    </>
                  )}
                </button>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, gap: '6px' }}
                    disabled={qrVerifying}
                    onClick={() => {
                      setQrModal(null);
                      setSelectedMethod('card');
                    }}
                  >
                    <CreditCard size={14} />
                    <span>Switch to Card Gateway</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                    disabled={qrVerifying}
                    onClick={() => setQrModal(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
