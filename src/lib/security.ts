// ============================================
// SECURITY UTILITIES FOR INPUT SANITIZATION
// ============================================

// Simple HTML sanitization without external dependency
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

// ============================================
// INPUT SANITIZATION
// ============================================

/**
 * Sanitize HTML input to prevent XSS attacks
 * @param input - Raw HTML string
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(input: string): string {
  return escapeHtml(input.trim())
}

/**
 * Sanitize general text input
 * @param input - Raw text input
 * @returns Sanitized text
 */
export function sanitizeText(input: string): string {
  return input
    .trim()
    .replace(/[<>\"']/g, '') // Remove potentially dangerous characters
    .slice(0, 1000) // Limit length
}

/**
 * Sanitize email input
 * @param email - Raw email input
 * @returns Sanitized email
 */
export function sanitizeEmail(email: string): string {
  return email
    .trim()
    .toLowerCase()
    .replace(/[^\w@.-]/g, '') // Only allow word characters, @, ., -
    .slice(0, 254) // RFC limit for email length
}

/**
 * Sanitize name input (supports Turkish characters)
 * @param name - Raw name input
 * @returns Sanitized name
 */
export function sanitizeName(name: string): string {
  return name
    .trim()
    .replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ\s]/g, '') // Only letters and spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .slice(0, 50) // Reasonable name length
}

// ============================================
// RATE LIMITING UTILITIES
// ============================================

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  skipSuccessfulRequests?: boolean
}

class InMemoryRateLimit {
  private requests: Map<string, { count: number; resetTime: number }> = new Map()
  private readonly config: Required<RateLimitConfig>

  constructor(config: RateLimitConfig) {
    this.config = {
      skipSuccessfulRequests: false,
      ...config
    }
  }

  check(identifier: string): { success: boolean; remainingRequests?: number; resetTime?: number } {
    const now = Date.now()
    const entry = this.requests.get(identifier)

    if (!entry || now > entry.resetTime) {
      // Reset or create new entry
      const newEntry = {
        count: 1,
        resetTime: now + this.config.windowMs
      }
      this.requests.set(identifier, newEntry)
      
      return {
        success: true,
        remainingRequests: this.config.maxRequests - 1,
        resetTime: newEntry.resetTime
      }
    }

    if (entry.count >= this.config.maxRequests) {
      return {
        success: false,
        remainingRequests: 0,
        resetTime: entry.resetTime
      }
    }

    entry.count++
    return {
      success: true,
      remainingRequests: this.config.maxRequests - entry.count,
      resetTime: entry.resetTime
    }
  }

  reset(identifier: string): void {
    this.requests.delete(identifier)
  }

  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.requests.entries()) {
      if (now > entry.resetTime) {
        this.requests.delete(key)
      }
    }
  }
}

// ============================================
// COMMON RATE LIMITERS
// ============================================

export const authRateLimit = new InMemoryRateLimit({
  maxRequests: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
})

export const apiRateLimit = new InMemoryRateLimit({
  maxRequests: 100,
  windowMs: 15 * 60 * 1000, // 15 minutes
})

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Check if password meets security requirements
 * @param password - Password to validate
 * @returns Validation result with detailed feedback
 */
export function validatePasswordSecurity(password: string): {
  isValid: boolean
  errors: string[]
  strength: 'weak' | 'medium' | 'strong'
} {
  const errors: string[] = []
  let strength: 'weak' | 'medium' | 'strong' = 'weak'

  // Basic requirements
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  // Additional security checks
  if (password.length >= 12 && /[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    strength = 'strong'
  } else if (password.length >= 10 && errors.length === 0) {
    strength = 'medium'
  }

  // Common password patterns
  const commonPatterns = [
    /^(.)\1+$/, // All same character
    /^123456/, // Sequential numbers
    /^qwerty/i, // Qwerty pattern
    /^password/i, // Contains "password"
  ]

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      errors.push('Password is too common or predictable')
      strength = 'weak'
      break
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength
  }
}

/**
 * Generate a secure random token
 * @param length - Token length
 * @returns Secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  
  return result
}

// ============================================
// CLEANUP INTERVALS
// ============================================

// Cleanup rate limiters every 5 minutes
if (typeof window === 'undefined') { // Server-side only
  setInterval(() => {
    authRateLimit.cleanup()
    apiRateLimit.cleanup()
  }, 5 * 60 * 1000)
}