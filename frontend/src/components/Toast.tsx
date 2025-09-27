'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { Check, X, AlertCircle, Info } from 'lucide-react';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface ToastDisplayProps extends ToastProps {
  onClose: (id: string) => void;
}

export function ToastDisplay({ id, type, title, message, duration = 4000, onClose }: ToastDisplayProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(id), 150);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const icons = {
    success: Check,
    error: X,
    warning: AlertCircle,
    info: Info,
  };

  const styles = {
    success: { background: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534' },
    error: { background: '#fef2f2', borderColor: '#fecaca', color: '#991b1b' },
    warning: { background: '#fffbeb', borderColor: '#fed7aa', color: '#92400e' },
    info: { background: '#eff6ff', borderColor: '#bfdbfe', color: '#1e40af' },
  };

  const iconStyles = {
    success: { color: '#10b981' },
    error: { color: '#ef4444' },
    warning: { color: '#f59e0b' },
    info: { color: '#3b82f6' },
  };

  const Icon = icons[type];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '16px',
        border: '1px solid',
        borderRadius: '8px',
        marginBottom: '8px',
        transition: 'all 0.2s ease',
        transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
        opacity: isVisible ? 1 : 0,
        ...styles[type]
      }}
    >
      <Icon style={{ ...iconStyles[type], marginTop: '2px' }} size={16} />
      <div style={{ flex: 1 }}>
        <h4 style={{ fontWeight: '600', fontSize: '14px', margin: '0 0 4px 0' }}>{title}</h4>
        {message && <p style={{ fontSize: '13px', margin: 0, opacity: 0.8 }}>{message}</p>}
      </div>
      <button
        onClick={() => onClose(id)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '2px',
          opacity: 0.6,
          transition: 'opacity 0.2s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
      >
        <X size={14} />
      </button>
    </div>
  );
}

// Toast context
const ToastContext = createContext<{
  showToast: (toast: Omit<ToastProps, 'id'>) => void;
} | null>(null);

// Toast manager hook
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Toast Provider component
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const showToast = (toast: Omit<ToastProps, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 50,
        maxWidth: '24rem',
        width: '100%'
      }}>
        {toasts.map(toast => (
          <ToastDisplay key={toast.id} {...toast} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}