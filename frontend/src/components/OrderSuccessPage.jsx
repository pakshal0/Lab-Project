import React, { useState, useEffect } from 'react';
import { CheckCircle, ShoppingBag, ArrowRight, Package, Calendar, MapPin, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const OrderSuccessPage = ({ orderId, onNavigateToOrders, onNavigateToProducts }) => {
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrderDetails = async () => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/orders/${orderId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setOrder(data.order);
      } else {
        setError(data.message || 'Failed to retrieve order details');
      }
    } catch (err) {
      setError(err.message || 'Network error fetching order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  if (loading) {
    return (
      <div className="content-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <RefreshCw size={32} className="spin-animate" style={{ color: '#059669', marginBottom: '12px' }} />
        <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Loading Order Confirmation...</h3>
        <p style={{ color: '#64748b' }}>Retrieving verified order snapshot from MongoDB</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="content-card" style={{ padding: '40px 20px', textAlign: 'center' }}>
        <div className="response-box error" style={{ maxWidth: '500px', margin: '0 auto 20px' }}>
          <span className="response-title"><AlertCircle size={16} /> Error Retrieving Order</span>
          <span>{error || 'Order record not found'}</span>
        </div>
        <button className="btn btn-primary" onClick={onNavigateToOrders}>
          Go to My Orders
        </button>
      </div>
    );
  }

  return (
    <section className="content-card" style={{ maxWidth: '780px', margin: '20px auto' }}>
      <div style={{ textAlign: 'center', padding: '20px 0 30px', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'inline-flex', padding: '16px', background: '#ecfdf5', borderRadius: '50%', color: '#059669', marginBottom: '16px' }}>
          <CheckCircle size={48} />
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
          Payment Confirmed & Order Placed!
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
          Thank you for shopping with ShopKart. Your payment was verified and processed via Razorpay Test Mode.
        </p>

        <div style={{ display: 'inline-flex', gap: '10px', marginTop: '16px' }}>
          <span style={{ padding: '4px 12px', borderRadius: '20px', background: '#ecfdf5', color: '#047857', fontWeight: 700, fontSize: '0.85rem' }}>
            Payment: {order.paymentStatus}
          </span>
          <span style={{ padding: '4px 12px', borderRadius: '20px', background: '#eff6ff', color: '#1d4ed8', fontWeight: 700, fontSize: '0.85rem' }}>
            Status: {order.status}
          </span>
        </div>
      </div>

      <div style={{ padding: '24px 0', borderBottom: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '18px' }}>
        <div>
          <span style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Order ID</span>
          <span style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: '#0284c7', fontWeight: 600 }}>{order._id}</span>
        </div>

        <div>
          <span style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Order Date</span>
          <span style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: 600 }}>{new Date(order.createdAt).toLocaleString()}</span>
        </div>

        <div>
          <span style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Total Amount</span>
          <span style={{ fontSize: '1.2rem', color: '#059669', fontWeight: 800 }}>${order.totalAmount.toFixed(2)}</span>
        </div>

        <div>
          <span style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Razorpay Payment ID</span>
          <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#475569' }}>{order.razorpayPaymentId || 'N/A'}</span>
        </div>
      </div>

      {/* Shipping details */}
      <div style={{ padding: '20px 0', borderBottom: '1px solid #e2e8f0' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MapPin size={16} className="text-primary" /> Delivery Address
        </h4>
        <div style={{ fontSize: '0.88rem', color: '#334155', lineHeight: '1.6' }}>
          <strong>{order.shippingAddress?.fullName}</strong> ({order.shippingAddress?.phone})<br />
          {order.shippingAddress?.addressLine}, {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
        </div>
      </div>

      {/* Items List */}
      <div style={{ padding: '20px 0' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Package size={16} className="text-primary" /> Items in this Order ({order.items?.length})
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {order.items?.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                  src={item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=80'}
                  alt={item.name}
                  style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '4px' }}
                />
                <div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a', display: 'block' }}>{item.name}</span>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Qty: {item.quantity} × ${item.price.toFixed(2)}</span>
                </div>
              </div>
              <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
                ${(item.price * item.quantity).toFixed(2)}
              </strong>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', marginTop: '20px', flexWrap: 'wrap' }}>
        <button className="btn btn-secondary" onClick={onNavigateToProducts}>
          <ShoppingBag size={16} /> Continue Shopping
        </button>

        <button className="btn btn-primary" onClick={onNavigateToOrders}>
          <span>View All Orders</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </section>
  );
};
