// Global Error Toast Provider
'use client';

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { ToastContainer, useToastSystem } from '@/components/ui/ErrorToast';
import { errorHandler } from '@/lib/errorHandler';
import type { ErrorToastContextType } from '@/types/errors';

const ErrorToastContext = createContext<ErrorToastContextType | null>(null);

export function ErrorToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts, addToast, removeToast } = useToastSystem();
  const router = useRouter();
  const lastToastRef = useRef<string>('');

  // Deduplicated addToast to prevent duplicate toasts
  const addToastSafe = (type: 'error' | 'warning' | 'info' | 'success', title: string, message: string, action?: any) => {
    const toastKey = `${type}-${title}-${message}`;
    
    // Prevent duplicate toasts within 1 second
    if (lastToastRef.current === toastKey) {
      return;
    }
    
    lastToastRef.current = toastKey;
    addToast({ type, title, message, action });
    
    // Clear the duplicate prevention after 1 second
    setTimeout(() => {
      if (lastToastRef.current === toastKey) {
        lastToastRef.current = '';
      }
    }, 1000);
  };

  // Register handlers with error manager
  useEffect(() => {
    // Register toast handler
    const unregisterToast = errorHandler.registerToastHandler((toast) => {
      addToast(toast);
    });
    
    // Register navigation handler
    errorHandler.registerNavigationHandler((url: string) => {
      router.push(url);
    });

    // Register logout handler
    errorHandler.registerLogoutHandler(() => {
      signOut({ callbackUrl: '/auth/signin' });
    });

    return () => {
      unregisterToast();
    };
  }, [router]); // Remove addToast from dependencies to prevent infinite loop

  const contextValue: ErrorToastContextType = {
    showError: (title, message, action) => {
      addToastSafe('error', title, message, action);
    },
    showWarning: (title, message, action) => {
      addToastSafe('warning', title, message, action);
    },
    showInfo: (title, message, action) => {
      addToastSafe('info', title, message, action);
    },
    showSuccess: (title, message, action) => {
      addToastSafe('success', title, message, action);
    },
  };

  return (
    <ErrorToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onRemoveAction={removeToast} />
    </ErrorToastContext.Provider>
  );
}

export function useErrorToast() {
  const context = useContext(ErrorToastContext);
  if (!context) {
    throw new Error('useErrorToast must be used within an ErrorToastProvider');
  }
  return context;
}