import axios, { AxiosInstance, AxiosError } from 'axios'
import { getSession } from 'next-auth/react'
import { RegisterRequest, RegisterResponse, LoginCredentials } from '@/types/auth'
import { validateLoginRequest, validateRegisterRequest } from './validators'

export interface BackendApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
  error?: {
    code: string
    message: string
  }
}

// Backend User Response (from actual API response)
export interface BackendUser {
  id: string
  email: string
  name: string
  surname: string
  role: 'USER' | 'ADMIN'
  createdAt: string
}

export interface BackendAuthResponse {
  user: BackendUser
  token: string
}

class ApiClient {
  private readonly instance: AxiosInstance

  constructor() {
    this.instance = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    this.instance.interceptors.request.use(
      async (config) => {
        try {
          const session = await getSession()
          if (session?.user) {
            const token = (session as any).accessToken
            if (token) {
              config.headers.Authorization = `Bearer ${token}`
            }
          }
        } catch (error) {
          console.warn('Failed to get session:', error)
        }
        return config
      },
      (error) => Promise.reject(error)
    )
  }

  async post<T>(url: string, data?: unknown): Promise<BackendApiResponse<T>> {
    try {
      const response = await this.instance.post<BackendApiResponse<T>>(url, data)
      return response.data
    } catch (error) {
      return this.handleError(error)
    }
  }

  private handleError<T>(error: unknown): BackendApiResponse<T> {
    if (error instanceof AxiosError && error.response?.data) {
      const errorData = error.response.data
      if (errorData.success === false) {
        return errorData
      }
    }

    return {
      success: false,
      message: 'Network error occurred',
      error: {
        code: 'NETWORK_ERROR',
        message: 'Unable to connect to server'
      }
    }
  }

  // Auth endpoints (matching backend implementation)
  async signin(credentials: LoginCredentials): Promise<BackendApiResponse<BackendAuthResponse>> {
    return this.post('/auth/login', credentials)
  }

  async signup(userData: RegisterRequest): Promise<BackendApiResponse<BackendAuthResponse>> {
    return this.post('/auth/signup', userData)
  }
}

export const apiClient = new ApiClient()

export const loginUser = async (credentials: LoginCredentials): Promise<RegisterResponse> => {
  const validation = validateLoginRequest(credentials)
  if (!validation.isValid) {
    return {
      success: false,
      error: validation.errors.map(err => err.message).join(', '),
      message: 'Validation failed'
    }
  }

  const response = await apiClient.signin(credentials)
  
  if (response.success && response.data) {
    return {
      success: true,
      message: response.message,
      data: {
        user: {
          id: response.data.user.id,
          email: response.data.user.email,
          name: response.data.user.name || '',
          surname: response.data.user.surname || '',
          role: response.data.user.role,
          createdAt: response.data.user.createdAt || new Date().toISOString()
        },
        token: response.data.token
      }
    }
  }

  return {
    success: false,
    error: response.error?.message || response.message || 'Login failed',
    message: response.message
  }
}

export const registerUser = async (userData: RegisterRequest): Promise<RegisterResponse> => {
  const validation = validateRegisterRequest(userData)
  if (!validation.isValid) {
    return {
      success: false,
      error: validation.errors.map(err => err.message).join(', '),
      message: 'Validation failed'
    }
  }

  const response = await apiClient.signup(userData)
  
  if (response.success && response.data) {
    return {
      success: true,
      message: response.message,
      data: {
        user: {
          id: response.data.user.id,
          email: response.data.user.email,
          name: response.data.user.name,
          surname: response.data.user.surname,
          role: response.data.user.role,
          createdAt: response.data.user.createdAt
        },
        token: response.data.token
      }
    }
  }

  return {
    success: false,
    error: response.error?.message || response.message || 'Registration failed',
    message: response.message
  }
}
