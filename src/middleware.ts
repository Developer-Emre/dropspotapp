// ============================================
// MIDDLEWARE FOR SECURITY & RATE LIMITING
// ============================================

import { NextRequest, NextResponse } from 'next/server'

// Rate limiting configuration
interface RateLimitEntry {
  count: number
  resetTime: number
}

class RateLimiter {
  private requests: Map<string, RateLimitEntry> = new Map()
  private readonly maxRequests: number
  private readonly windowMs: number

  constructor(maxRequests: number = 10, windowMs: number = 60000) { // 10 requests per minute
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now()
    const entry = this.requests.get(identifier)

    if (!entry || now > entry.resetTime) {
      // Reset or create new entry
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      })
      return true
    }

    if (entry.count >= this.maxRequests) {
      return false
    }

    entry.count++
    return true
  }

  cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.requests.entries()) {
      if (now > entry.resetTime) {
        this.requests.delete(key)
      }
    }
  }
}

// Rate limiters for different endpoints
const authRateLimiter = new RateLimiter(5, 60000) // 5 auth requests per minute
const apiRateLimiter = new RateLimiter(30, 60000) // 30 API requests per minute

// Cleanup rate limiters every 5 minutes
setInterval(() => {
  authRateLimiter.cleanup()
  apiRateLimiter.cleanup()
}, 5 * 60 * 1000)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous'
  
  // Security headers
  const response = NextResponse.next()
  
  // CSRF Protection for POST requests (simplified)
  if (request.method === 'POST' && !pathname.startsWith('/api/auth/')) {
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')
    
    // Simple origin check
    if (origin && host && !origin.includes(host)) {
      return new NextResponse('Forbidden', { status: 403 })
    }
  }

  // Rate limiting for auth endpoints
  if (pathname.startsWith('/api/auth/callback') || pathname.startsWith('/api/auth/signin')) {
    if (!authRateLimiter.isAllowed(ip)) {
      return new NextResponse('Too Many Requests', { 
        status: 429,
        headers: {
          'Retry-After': '60',
          'Content-Type': 'application/json'
        }
      })
    }
  }

  // Rate limiting for general API endpoints
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    if (!apiRateLimiter.isAllowed(ip)) {
      return new NextResponse('Too Many Requests', { 
        status: 429,
        headers: {
          'Retry-After': '60',
          'Content-Type': 'application/json'
        }
      })
    }
  }

  // Security headers
  response.headers.set('X-Request-ID', crypto.randomUUID())
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}