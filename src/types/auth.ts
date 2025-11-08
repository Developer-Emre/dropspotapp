// ============================================
// AUTHENTICATION TYPE DEFINITIONS
// ============================================
// src/types/auth.ts

// NextAuth 4.x base types - we'll extend these
export interface NextAuthSession {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
  expires: string
}

export interface NextAuthJWT {
  name?: string | null
  email?: string | null
  picture?: string | null
  sub?: string
}

// ============================================
// BACKEND API TYPES
// ============================================

export interface BackendUser {
  id: string
  email: string
  name: string
  surname?: string
  role: 'USER' | 'ADMIN'
  createdAt: string
  updatedAt?: string
}

export interface BackendAuthResponse {
  success: boolean
  message: string
  data: {
    user: BackendUser
    token: string
  }
}

export interface LoginRequest {
  email: string
  password: string
}

export interface SignInFormData {
  email: string
  password: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupCredentials extends LoginCredentials {
  name: string
  surname: string
}

export interface RegisterFormData extends SignupCredentials {
  confirmPassword: string
}

export interface RegisterRequest {
  name: string
  surname: string
  email: string
  password: string
}

export interface RegisterResponse {
  success: boolean
  message: string
  data?: {
    user: {
      id: string
      email: string
      name: string
      surname: string
      role: string
      createdAt: string
    }
    token: string
  }
  error?: string
  status?: number
}

// ============================================
// NEXTAUTH EXTENDED TYPES
// ============================================

declare module "next-auth" {
  interface Session {
    accessToken?: string
    user: {
      id?: string
      email?: string
      name?: string
      role?: 'USER' | 'ADMIN'
    }
    expires: string
  }

  interface User {
    id: string
    email: string
    name?: string
    role?: 'USER' | 'ADMIN'
    accessToken?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    role?: 'USER' | 'ADMIN'
    accessToken?: string
  }
}

// ============================================
// AUTH CALLBACK TYPES
// ============================================

export interface JWTCallbackParams {
  token: any
  user?: any
}

export interface SessionCallbackParams {
  session: any
  token: any
}

// ============================================
// AUTH HELPER TYPES
// ============================================

export interface AuthenticatedRequest extends RequestInit {
  headers?: Record<string, string>
}

export interface AuthSession {
  user: {
    id: string
    email: string
    name?: string
    role: 'USER' | 'ADMIN'
  }
  accessToken: string
}

// ============================================
// AUTH ERROR TYPES
// ============================================

export type AuthError = 
  | 'INVALID_CREDENTIALS'
  | 'USER_NOT_FOUND'
  | 'ACCOUNT_DISABLED'
  | 'NETWORK_ERROR'
  | 'INVALID_TOKEN'
  | 'TOKEN_EXPIRED'

export interface AuthErrorDetails {
  code: AuthError
  message: string
  details?: Record<string, unknown>
}

// ============================================
// TYPE GUARDS
// ============================================

export const isBackendAuthResponse = (data: unknown): data is BackendAuthResponse => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'success' in data &&
    'data' in data &&
    typeof (data as any).success === 'boolean'
  )
}

export const isAuthenticatedSession = (session: unknown): session is AuthSession => {
  return (
    typeof session === 'object' &&
    session !== null &&
    'user' in session &&
    'accessToken' in session &&
    typeof (session as any).accessToken === 'string'
  )
}

// ============================================
// UTILITY TYPES
// ============================================

export type AuthProvider = 'credentials' | 'google' | 'github'

export type UserRole = 'USER' | 'ADMIN'

export interface AuthState {
  isAuthenticated: boolean
  user: BackendUser | null
  accessToken: string | null
  loading: boolean
  error: AuthErrorDetails | null
}