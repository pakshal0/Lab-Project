import React from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export const Toast = ({ toast, onClose }) => {
  if (!toast) return null;

  const icons = {
    success: <CheckCircle size={18} className="text-emerald" />,
    error: <AlertCircle size={18} className="text-rose" />,
    info: <Info size={18} className="text-cyan" />
  };

  return (
    <div className={`toast-notification toast-${toast.type || 'info'}`}>
      <div className="toast-icon-box">
        {icons[toast.type] || icons.info}
      </div>
      <div className="toast-content">
        <span className="toast-text">{toast.message}</span>
      </div>
      <button className="toast-close-btn" onClick={onClose} aria-label="Close notification">
        <X size={15} />
      </button>
    </div>
  );
};
