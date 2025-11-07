// Error handling related TypeScript interfaces and types
export interface ApiError {
  success: false;
  message: string;
  error?: string;
  errors?: ValidationError[];
  status?: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ErrorToast {
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  action?: {
    label: string;
    handler: () => void;
  };
  duration?: number;
  dismissible?: boolean;
}

export interface UIErrorState {
  waitlistError?: string;
  claimError?: string;
  authError?: string;
  networkError?: boolean;
  validationErrors?: Map<string, string>;
  isLoading: boolean;
}

// Error handling context
export type ErrorContext = 
  | 'waitlist_join'
  | 'waitlist_leave' 
  | 'claim_drop'
  | 'auth_login'
  | 'auth_register'
  | 'drop_fetch'
  | 'profile_update'
  | 'general';

// Error recovery actions
export type ErrorRecoveryAction = 
  | { type: 'redirect'; url: string }
  | { type: 'retry'; handler: () => void }
  | { type: 'modal'; component: string; props?: any }
  | { type: 'toast'; toast: ErrorToast }
  | { type: 'refresh'; target?: string }
  | { type: 'logout' }
  | { type: 'nothing' };

// Extended toast interface with ID for tracking
export interface ToastWithId extends ErrorToast {
  id: string;
  createdAt: number;
}

// Error toast context interface
export interface ErrorToastContextType {
  showError: (title: string, message: string, action?: { label: string; handler: () => void }) => void;
  showWarning: (title: string, message: string, action?: { label: string; handler: () => void }) => void;
  showInfo: (title: string, message: string, action?: { label: string; handler: () => void }) => void;
  showSuccess: (title: string, message: string, action?: { label: string; handler: () => void }) => void;
}

// Response format interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: ValidationError[];
}

export interface ErrorResponse extends ApiResponse {
  success: false;
  message: string;
  error?: string;
  errors?: ValidationError[];
}

// Error handler configuration
export interface ErrorHandlerConfig {
  showToasts: boolean;
  logErrors: boolean;
  autoRetry: boolean;
  maxRetries: number;
  retryDelay: number;
}