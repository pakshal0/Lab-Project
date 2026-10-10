import React, { useState, useEffect } from 'react';
import { X, Package, MapPin, Calendar, CreditCard, RefreshCw, AlertCircle } from 'lucide-react';

export const OrderDetailModal = ({ orderId, onClose }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
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
          setError(data.message || 'Failed to fetch order details');
        }
      } catch (err) {
        setError(err.message || 'Network error');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (!orderId) return null;

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
          borderRadius: '10px',
          maxWidth: '620px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          padding: '24px'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={18} className="text-primary" />
            Order Details Snapshot
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <RefreshCw size={28} className="spin-animate" style={{ color: '#2563eb', marginBottom: '10px' }} />
            <p style={{ color: '#64748b' }}>Loading verified order snapshot...</p>
          </div>
        ) : error ? (
          <div className="response-box error">
            <span className="response-title">Error</span>
            <span>{error}</span>
          </div>
        ) : order ? (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', backgroundColor: '#f8fafc', padding: '14px', borderRadius: '6px', marginBottom: '18px', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: '#64748b', display: 'block' }}>Order ID:</span>
                <span style={{ fontFamily: 'monospace', color: '#0284c7', fontWeight: 600 }}>{order._id}</span>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block' }}>Date:</span>
                <span style={{ fontWeight: 600 }}>{new Date(order.createdAt).toLocaleString()}</span>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block' }}>Payment Status:</span>
                <span style={{ fontWeight: 700, color: order.paymentStatus === 'PAID' ? '#059669' : '#dc2626' }}>
                  {order.paymentStatus}
                </span>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block' }}>Order Status:</span>
                <span style={{ fontWeight: 700, color: '#2563eb' }}>{order.status}</span>
              </div>
            </div>

            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '8px' }}>Delivery Address</h4>
            <div style={{ fontSize: '0.86rem', color: '#334155', backgroundColor: '#f1f5f9', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px' }}>
              <strong>{order.shippingAddress?.fullName}</strong> ({order.shippingAddress?.phone})<br />
              {order.shippingAddress?.addressLine}, {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
            </div>

            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '8px' }}>Purchased Items</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {order.items?.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={item.image} alt={item.name} style={{ width: '38px', height: '38px', objectFit: 'cover', borderRadius: '4px' }} />
                    <div>
                      <span style={{ fontSize: '0.88rem', fontWeight: 600, display: 'block' }}>{item.name}</span>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Qty: {item.quantity} × ${item.price.toFixed(2)}</span>
                    </div>
                  </div>
                  <strong style={{ fontSize: '0.9rem' }}>${(item.price * item.quantity).toFixed(2)}</strong>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1rem', fontWeight: 700 }}>Total Paid:</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563eb' }}>${order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
