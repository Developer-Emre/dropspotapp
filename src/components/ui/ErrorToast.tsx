// Error Toast Notification System
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ErrorToast, ToastWithId } from '@/types/errors';

// Toast context and provider
export const useToastSystem = () => {
  const [toasts, setToasts] = useState<ToastWithId[]>([]);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
    
    // Clear timeout if exists
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
  }, []);

  const addToast = useCallback((toast: ErrorToast) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastWithId = {
      ...toast,
      id,
      createdAt: Date.now(),
      dismissible: toast.dismissible ?? true,
      duration: toast.duration ?? 5000,
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-dismiss if duration is set
    if (newToast.duration && newToast.duration > 0) {
      const timeout = setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
      
      timeoutsRef.current.set(id, timeout);
    }
  }, [removeToast]);

  const clearAllToasts = useCallback(() => {
    // Clear all timeouts
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current.clear();
    setToasts([]);
  }, []);

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
  };
};

// Toast component
export function ToastNotification({ 
  toast, 
  onRemoveAction 
}: { 
  toast: ToastWithId; 
  onRemoveAction: (id: string) => void; 
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    if (isRemoving) return;
    
    setIsRemoving(true);
    setIsVisible(false);
    
    // Wait for exit animation to complete
    setTimeout(() => {
      onRemoveAction(toast.id);
    }, 300);
  };

  const getToastIcon = () => {
    switch (toast.type) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      case 'success':
        return '✅';
      default:
        return '📢';
    }
  };

  const getToastColors = () => {
    switch (toast.type) {
      case 'error':
        return 'border-l-4 border-red-500 bg-white';
      case 'warning':
        return 'border-l-4 border-yellow-500 bg-white';
      case 'info':
        return 'border-l-4 border-blue-500 bg-white';
      case 'success':
        return 'border-l-4 border-green-500 bg-white';
      default:
        return 'border-l-4 border-gray-500 bg-white';
    }
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out pointer-events-auto
        ${isVisible ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'}
        w-full max-w-sm bg-white shadow-xl rounded-xl border-0 overflow-hidden
        ${getToastColors()}
      `}
      style={{
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.06)'
      }}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <span className="text-xl">{getToastIcon()}</span>
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900">
              {toast.title}
            </h4>
            <p className="text-sm text-gray-600 mt-0.5">
              {toast.message}
            </p>
            
            {toast.action && (
              <div className="mt-2.5">
                <button
                  onClick={() => {
                    toast.action?.handler();
                    handleRemove();
                  }}
                  className={`
                    inline-flex items-center text-xs font-medium px-2.5 py-1.5 rounded-md
                    transition-colors duration-200
                    ${toast.type === 'error' 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                      : toast.type === 'warning'
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      : toast.type === 'success'
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }
                  `}
                >
                  {toast.action.label}
                </button>
              </div>
            )}
          </div>
          
          {toast.dismissible && (
            <div className="flex-shrink-0">
              <button
                onClick={handleRemove}
                className="inline-flex items-center justify-center w-6 h-6 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors duration-200"
                aria-label="Close notification"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Toast container component
export function ToastContainer({ 
  toasts, 
  onRemoveAction 
}: { 
  toasts: ToastWithId[]; 
  onRemoveAction: (id: string) => void; 
}) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <>
      {/* Toast Portal - Fixed positioning outside normal flow */}
      <div 
        className="fixed top-4 right-4 z-[9999] space-y-3 pointer-events-none
                   sm:top-4 sm:right-4 sm:max-w-sm
                   max-sm:top-2 max-sm:right-2 max-sm:left-2 max-sm:max-w-none"
        style={{ 
          maxHeight: '80vh', 
          overflowY: 'auto'
        }}
      >
        {toasts.map((toast) => (
          <ToastNotification
            key={toast.id}
            toast={toast}
            onRemoveAction={onRemoveAction}
          />
        ))}
      </div>
    </>
  );
}

// Hook for easy toast usage
export const useErrorToast = () => {
  const { addToast } = useToastSystem();

  const showError = (title: string, message: string, action?: { label: string; handler: () => void }) => {
    addToast({ type: 'error', title, message, action });
  };

  const showWarning = (title: string, message: string, action?: { label: string; handler: () => void }) => {
    addToast({ type: 'warning', title, message, action });
  };

  const showInfo = (title: string, message: string, action?: { label: string; handler: () => void }) => {
    addToast({ type: 'info', title, message, action });
  };

  const showSuccess = (title: string, message: string, action?: { label: string; handler: () => void }) => {
    addToast({ type: 'success', title, message, action });
  };

  return { showError, showWarning, showInfo, showSuccess, addToast };
};