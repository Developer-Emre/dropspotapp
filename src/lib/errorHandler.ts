// Central error handling system based on FRONTEND_ERROR_GUIDE.md
'use client';

import { logger } from './logger';
import type {
  ApiError,
  ValidationError,
  ErrorToast,
  UIErrorState,
  ErrorContext,
  ErrorRecoveryAction,
  ErrorHandlerConfig
} from '@/types/errors';

// Error handler configuration with defaults
const DEFAULT_CONFIG: ErrorHandlerConfig = {
  showToasts: true,
  logErrors: true,
  autoRetry: false,
  maxRetries: 3,
  retryDelay: 1000
};

class ErrorHandlerManager {
  private config: ErrorHandlerConfig;
  private toastHandlers: Set<(toast: ErrorToast) => void> = new Set();
  private errorStateHandlers: Set<(state: Partial<UIErrorState>) => void> = new Set();
  private navigationHandler: ((url: string) => void) | null = null;
  private logoutHandler: (() => void) | null = null;
  private retryCount: Map<string, number> = new Map();

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // Update configuration
  updateConfig(newConfig: Partial<ErrorHandlerConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  // Register handlers for different error actions
  registerToastHandler(handler: (toast: ErrorToast) => void) {
    this.toastHandlers.add(handler);
    return () => this.toastHandlers.delete(handler);
  }

  registerErrorStateHandler(handler: (state: Partial<UIErrorState>) => void) {
    this.errorStateHandlers.add(handler);
    return () => this.errorStateHandlers.delete(handler);
  }

  registerNavigationHandler(handler: (url: string) => void) {
    this.navigationHandler = handler;
  }

  registerLogoutHandler(handler: () => void) {
    this.logoutHandler = handler;
  }

  // Core error handling method
  handleError(error: ApiError | Error, context: ErrorContext = 'general', errorId?: string): ErrorRecoveryAction[] {
    const actions: ErrorRecoveryAction[] = [];
    const id = errorId || `${context}-${Date.now()}`;
    
    // Convert Error to ApiError format
    const apiError: ApiError = error instanceof Error 
      ? { success: false, message: error.message, status: 500 }
      : error;

    // Enhanced debug logging
    if (this.config.logErrors) {
      logger.info('🚨 ErrorHandler.handleError called', { 
        error: apiError, 
        context,
        errorId: id,
        hasToastHandlers: this.toastHandlers.size,
        timestamp: new Date().toISOString()
      });
    }

    // Handle by status code and message
    const status = apiError.status || 500;

    // Log status routing
    logger.info(`🔀 Routing to handle${status}`, { status, message: apiError.message });

    // Check for auto-retry
    if (this.config.autoRetry && this.shouldRetry(id, status)) {
      this.scheduleRetry(id, () => {
        // Retry logic would be implemented by the calling component
        logger.info(`Auto-retrying error ${id}`);
      });
    }

    switch (status) {
      case 401:
        actions.push(...this.handle401(apiError, context));
        break;
      case 403:
        actions.push(...this.handle403(apiError, context));
        break;
      case 400:
        actions.push(...this.handle400(apiError, context));
        break;
      case 404:
        actions.push(...this.handle404(apiError, context));
        break;
      case 409:
        actions.push(...this.handle409(apiError, context));
        break;
      case 422:
        actions.push(...this.handle422(apiError, context));
        break;
      case 429:
        actions.push(...this.handle429(apiError, context));
        break;
      case 500:
      default:
        actions.push(...this.handle500(apiError, context));
        break;
    }

    logger.info(`✅ ErrorHandler generated ${actions.length} actions`, { actions: actions.map(a => a.type) });

    // Execute all recovery actions
    this.executeActions(actions);
    return actions;
  }

  // Handle 401 - Unauthorized
  private handle401(error: ApiError, context: ErrorContext): ErrorRecoveryAction[] {
    const actions: ErrorRecoveryAction[] = [];

    // Handle login context differently - don't logout/redirect, just show error
    if (context === 'auth_login') {
      actions.push({
        type: 'toast',
        toast: {
          type: 'error',
          title: 'Sign In Failed',
          message: 'Invalid email or password',
          duration: 5000
        }
      });
      return actions;
    }

    // For other contexts, clear auth state and redirect to login
    actions.push({ type: 'logout' });
    
    actions.push({
      type: 'toast',
      toast: {
        type: 'error',
        title: 'Authentication Required',
        message: 'Please sign in to continue',
        duration: 4000
      }
    });

    actions.push({ type: 'redirect', url: '/auth/signin' });
    
    return actions;
  }

  // Handle 403 - Forbidden
  private handle403(error: ApiError, context: ErrorContext): ErrorRecoveryAction[] {
    const actions: ErrorRecoveryAction[] = [];

    // Debug logging
    if (this.config.logErrors) {
      logger.debug('Handle 403 called', { 
        message: error.message, 
        includesWaitlist: error.message.includes('waitlist'),
        context 
      });
    }

    if (error.message.toLowerCase().includes('waitlist')) {
      // User must join waitlist first
      actions.push({
        type: 'toast',
        toast: {
          type: 'warning',
          title: 'Waitlist Required',
          message: 'Join the waitlist first to claim this drop',
          duration: 5000
        }
      });
    } else if (error.message.toLowerCase().includes('admin')) {
      // Admin privileges required
      actions.push({
        type: 'toast',
        toast: {
          type: 'error',
          title: 'Access Denied',
          message: 'This feature requires admin privileges',
          duration: 5000
        }
      });
      actions.push({ type: 'redirect', url: '/dashboard' });
    } else {
      // Generic forbidden error
      actions.push({
        type: 'toast',
        toast: {
          type: 'error',
          title: 'Access Denied',
          message: error.message || 'You do not have permission to perform this action',
          duration: 5000
        }
      });
    }

    return actions;
  }

  // Handle 400 - Bad Request / Validation
  private handle400(error: ApiError, context: ErrorContext): ErrorRecoveryAction[] {
    const actions: ErrorRecoveryAction[] = [];

    if (error.message.includes('not started yet')) {
      actions.push({
        type: 'toast',
        toast: {
          type: 'info',
          title: 'Coming Soon',
          message: 'Drop has not started yet',
          duration: 4000
        }
      });
    } else if (error.message.includes('has ended')) {
      actions.push({
        type: 'toast',
        toast: {
          type: 'warning',
          title: 'Drop Ended',
          message: 'This drop has ended',
          duration: 4000
        }
      });
    } else if (error.message.includes('claim window')) {
      actions.push({
        type: 'toast',
        toast: {
          type: 'info',
          title: 'Claim Window Closed',
          message: 'Claim window is not open yet',
          duration: 4000
        }
      });
    } else if (error.message.includes('Cannot leave waitlist')) {
      actions.push({
        type: 'toast',
        toast: {
          type: 'warning',
          title: 'Cannot Leave',
          message: 'Claim window is active',
          duration: 4000
        }
      });
    } else {
      // Generic validation error
      actions.push({
        type: 'toast',
        toast: {
          type: 'error',
          title: 'Invalid Request',
          message: error.message,
          duration: 4000
        }
      });

      // Handle validation errors for forms
      if (error.errors && error.errors.length > 0) {
        const validationErrors = new Map<string, string>();
        error.errors.forEach(err => {
          validationErrors.set(err.field, err.message);
        });
        
        this.updateErrorState({ validationErrors });
      }
    }

    return actions;
  }

  // Handle 404 - Not Found
  private handle404(error: ApiError, context: ErrorContext): ErrorRecoveryAction[] {
    const actions: ErrorRecoveryAction[] = [];

    if (context === 'drop_fetch') {
      actions.push({
        type: 'toast',
        toast: {
          type: 'error',
          title: 'Drop Not Found',
          message: 'This drop is no longer available',
          action: {
            label: 'Browse Drops',
            handler: () => this.navigateTo('/drops')
          },
          duration: 5000
        }
      });
      actions.push({ type: 'redirect', url: '/drops' });
    } else {
      actions.push({
        type: 'toast',
        toast: {
          type: 'error',
          title: 'Not Found',
          message: 'The requested resource was not found',
          duration: 5000
        }
      });
    }

    return actions;
  }

  // Handle 409 - Conflict
  private handle409(error: ApiError, context: ErrorContext): ErrorRecoveryAction[] {
    const actions: ErrorRecoveryAction[] = [];

    if (error.message.includes('already claimed')) {
      actions.push({
        type: 'toast',
        toast: {
          type: 'success',
          title: 'Already Claimed',
          message: 'You have already claimed this drop',
          duration: 4000
        }
      });
      actions.push({ type: 'refresh', target: 'claims' });
    } else if (error.message.includes('sold out')) {
      actions.push({
        type: 'toast',
        toast: {
          type: 'warning',
          title: 'Sold Out',
          message: 'This drop is sold out',
          duration: 4000
        }
      });
    } else if (error.message.includes('already in waitlist')) {
      actions.push({
        type: 'toast',
        toast: {
          type: 'info',
          title: 'Already in Waitlist',
          message: 'You are already in the waitlist',
          duration: 3000
        }
      });
    } else if (error.message.includes('already exists') || error.message.includes('email already')) {
      actions.push({
        type: 'toast',
        toast: {
          type: 'error',
          title: 'Email Already Registered',
          message: 'An account with this email already exists',
          duration: 5000
        }
      });
    } else {
      actions.push({
        type: 'toast',
        toast: {
          type: 'warning',
          title: 'Conflict',
          message: error.message,
          duration: 4000
        }
      });
    }

    return actions;
  }

  // Handle 422 - Unprocessable Entity (Validation)
  private handle422(error: ApiError, context: ErrorContext): ErrorRecoveryAction[] {
    return this.handle400(error, context); // Same as 400 for validation
  }

  // Handle 429 - Rate Limited
  private handle429(error: ApiError, context: ErrorContext): ErrorRecoveryAction[] {
    const actions: ErrorRecoveryAction[] = [];

    actions.push({
      type: 'toast',
      toast: {
        type: 'warning',
        title: 'Too Many Requests',
        message: '⚠️ Please slow down and try again in a moment',
        duration: 8000
      }
    });

    // Implement exponential backoff
    this.implementRateLimit();

    return actions;
  }

  // Handle 500+ - Server Errors
  private handle500(error: ApiError, context: ErrorContext): ErrorRecoveryAction[] {
    const actions: ErrorRecoveryAction[] = [];

    const isNetworkError = error.message.includes('Network') || error.message.includes('fetch');
    
    if (isNetworkError) {
      actions.push({
        type: 'toast',
        toast: {
          type: 'error',
          title: 'Connection Error',
          message: 'Check your internet connection',
          duration: 5000
        }
      });
      this.updateErrorState({ networkError: true });
    } else {
      actions.push({
        type: 'toast',
        toast: {
          type: 'error',
          title: 'Server Error',
          message: 'Something went wrong, please try again',
          duration: 4000
        }
      });
    }

    return actions;
  }

  // Execute recovery actions
  private executeActions(actions: ErrorRecoveryAction[]) {
    logger.info(`🔧 ExecuteActions called with ${actions.length} actions`, { actions: actions.map(a => a.type) });
    
    actions.forEach((action, index) => {
      logger.info(`🎬 Executing action ${index + 1}/${actions.length}: ${action.type}`);
      
      switch (action.type) {
        case 'toast':
          logger.info('📢 Showing toast', { toast: action.toast });
          this.showToast(action.toast);
          break;
        case 'redirect':
          logger.info('🔄 Redirecting', { url: action.url });
          this.navigateTo(action.url);
          break;
        case 'logout':
          logger.info('🚪 Logging out');
          this.logout();
          break;
        case 'retry':
          logger.info('🔁 Retrying');
          action.handler();
          break;
        case 'refresh':
          logger.info('🔃 Refreshing');
          window.location.reload();
          break;
        case 'modal':
          logger.info('🪟 Opening modal');
          // Handle modal opening
          break;
      }
    });
  }

  // Helper methods
  private shouldRetry(errorId: string, status: number): boolean {
    const currentRetries = this.retryCount.get(errorId) || 0;
    return currentRetries < this.config.maxRetries && [500, 502, 503, 504, 429].includes(status);
  }

  private scheduleRetry(errorId: string, retryHandler: () => void): void {
    const currentRetries = this.retryCount.get(errorId) || 0;
    this.retryCount.set(errorId, currentRetries + 1);
    
    setTimeout(() => {
      retryHandler();
    }, this.config.retryDelay * Math.pow(2, currentRetries)); // Exponential backoff
  }

  private showToast(toast: ErrorToast) {
    if (this.config.showToasts) {
      this.toastHandlers.forEach(handler => handler(toast));
    }
  }

  private updateErrorState(state: Partial<UIErrorState>) {
    this.errorStateHandlers.forEach(handler => handler(state));
  }

  private navigateTo(url: string) {
    if (this.navigationHandler) {
      this.navigationHandler(url);
    } else if (typeof window !== 'undefined') {
      window.location.href = url;
    }
  }

  private logout() {
    if (this.logoutHandler) {
      this.logoutHandler();
    }
  }

  private showJoinWaitlistModal() {
    // Implementation for showing join waitlist modal
    this.showToast({
      type: 'info',
      title: 'Join Waitlist',
      message: 'Navigate to drop page to join waitlist',
      duration: 3000
    });
  }

  private setDropReminder() {
    // Implementation for setting drop reminders
    this.showToast({
      type: 'success',
      title: 'Reminder Set',
      message: 'We will notify you when this drop starts!',
      duration: 3000
    });
  }

  private retryLastAction() {
    // Implementation for retrying last failed action
    window.location.reload();
  }

  private implementRateLimit() {
    // Implementation for rate limiting backoff
    this.updateErrorState({ isLoading: true });
    setTimeout(() => {
      this.updateErrorState({ isLoading: false });
    }, 5000);
  }

  // Utility method to check if an error is an API error
  isApiError(error: any): error is ApiError {
    return error && typeof error === 'object' && 'success' in error && error.success === false;
  }

  // Create user-friendly error message
  createUserFriendlyMessage(error: ApiError, context: ErrorContext): string {
    const { message } = error;

    // Map technical messages to user-friendly ones
    const friendlyMessages: Record<string, string> = {
      'You must be in the waitlist to claim this drop': '🎯 Join the waitlist first to claim this drop!',
      'Drop is not active': '⏰ This drop is not available right now',
      'Drop has not started yet': '🔮 Drop is coming soon - we\'ll let you know when it starts!',
      'Claim window has not started yet': '⏰ Claim window will open soon',
      'Claim window has ended': '⏰ Claim window has closed',
      'Drop has ended': '🏁 This drop has ended',
      'Drop is sold out': '📦 This drop is sold out',
      'You have already claimed this drop': '✅ You\'ve already claimed this drop!',
      'Cannot leave waitlist after claim window has started': '🚫 Cannot leave waitlist during claim window',
      'Too many requests': '⚠️ Please slow down and try again',
      'Internal server error': '⚠️ Something went wrong - please try again',
      'Network error': '🌐 Check your internet connection'
    };

    return friendlyMessages[message] || message || 'Something unexpected happened';
  }
}

// Create singleton instance
export const errorHandler = new ErrorHandlerManager();

// Convenience method for handling errors
export const handleApiError = (error: ApiError | Error, context: ErrorContext = 'general') => {
  return errorHandler.handleError(error, context);
};

export default errorHandler;