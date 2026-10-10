import React, { useState, useEffect, useCallback } from 'react';
import { Package, Calendar, Clock, MapPin, RefreshCw, AlertCircle, ArrowRight, Eye, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const MyOrdersPage = ({ onNavigateToProducts, onSelectOrder }) => {
  const { user, openLoginModal } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/orders', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setOrders(data.orders || []);
      } else {
        setError(data.message || 'Failed to retrieve orders');
      }
    } catch (err) {
      setError(err.message || 'Could not connect to server');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  if (!user) {
    return (
      <div className="content-card text-center" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <Package size={40} style={{ color: '#2563eb', marginBottom: '16px' }} />
        <h2 className="card-title">Sign In to View Orders</h2>
        <p className="card-description" style={{ maxWidth: '440px', margin: '0 auto 20px' }}>
          Please log in to your account to review your past purchases, order status, and delivery snapshots.
        </p>
        <button className="btn btn-primary" onClick={openLoginModal}>
          Sign In
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="content-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <RefreshCw size={32} className="spin-animate" style={{ color: '#2563eb', marginBottom: '12px' }} />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Loading your order history...</h3>
        <p style={{ color: '#64748b' }}>Querying MongoDB</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content-card" style={{ padding: '40px 20px', textAlign: 'center' }}>
        <div className="response-box error" style={{ maxWidth: '500px', margin: '0 auto 20px' }}>
          <span className="response-title"><AlertCircle size={16} /> Error loading orders</span>
          <span>{error}</span>
        </div>
        <button className="btn btn-primary" onClick={fetchOrders}>
          <RefreshCw size={15} /> Try Again
        </button>
      </div>
    );
  }

  return (
    <section className="content-card">
      <div className="filter-row" style={{ alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '24px' }}>
        <div>
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={22} className="text-primary" />
            My Order History
          </h2>
          <p className="card-description" style={{ marginBottom: 0 }}>
            {orders.length} {orders.length === 1 ? 'order' : 'orders'} placed with your account.
          </p>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={fetchOrders} title="Refresh order history">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
          <Package size={44} style={{ color: '#94a3b8', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>
            No orders found
          </h3>
          <p style={{ maxWidth: '420px', margin: '0 auto 24px', fontSize: '0.9rem' }}>
            You haven't placed any orders yet. Discover our latest tech collection and place your first order.
          </p>
          <button className="btn btn-primary" onClick={onNavigateToProducts}>
            Start Shopping <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {orders.map(order => {
            const isPaid = order.paymentStatus === 'PAID';
            const isPlaced = order.status === 'PLACED';

            return (
              <div
                key={order._id}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  overflow: 'hidden'
                }}
              >
                {/* Header banner */}
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    padding: '14px 18px',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Order ID</span>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#0284c7', fontWeight: 600 }}>{order._id}</span>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Date Placed</span>
                      <span style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 600 }}>{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Total Paid</span>
                      <span style={{ fontSize: '0.95rem', color: '#0f172a', fontWeight: 800 }}>${order.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Status badges */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '16px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        backgroundColor: isPaid ? '#ecfdf5' : '#fef2f2',
                        color: isPaid ? '#047857' : '#b91c1c'
                      }}
                    >
                      Payment: {order.paymentStatus}
                    </span>

                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '16px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        backgroundColor: isPlaced ? '#eff6ff' : '#f8fafc',
                        color: isPlaced ? '#1d4ed8' : '#475569'
                      }}
                    >
                      Order: {order.status}
                    </span>

                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onSelectOrder && onSelectOrder(order._id)}
                      title="View full order details"
                    >
                      <Eye size={13} /> Details
                    </button>
                  </div>
                </div>

                {/* Items in order */}
                <div style={{ padding: '16px 18px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {order.items?.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', borderBottom: idx < order.items.length - 1 ? '1px solid #f1f5f9' : 'none', paddingBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img
                            src={item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=80'}
                            alt={item.name}
                            style={{ width: '46px', height: '46px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                          />
                          <div>
                            <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a', display: 'block' }}>{item.name}</span>
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Quantity: {item.quantity} × ${item.price.toFixed(2)}</span>
                          </div>
                        </div>

                        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Delivery summary */}
                  <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px dashed #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: '#64748b' }}>
                    <div>
                      <MapPin size={13} style={{ display: 'inline', marginRight: '4px' }} />
                      Deliver to: <strong>{order.shippingAddress?.fullName}</strong> — {order.shippingAddress?.city}, {order.shippingAddress?.state} ({order.shippingAddress?.pincode})
                    </div>
                    {order.razorpayPaymentId && (
                      <div style={{ fontFamily: 'monospace' }}>
                        Pay ID: {order.razorpayPaymentId}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
