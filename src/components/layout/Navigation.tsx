// ============================================
// NAVIGATION COMPONENT
// ============================================

'use client'

import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'

export default function Navigation() {
  const { data: session, status } = useSession()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isScrolled 
          ? 'bg-white shadow-sm border-b border-gray-200' 
          : 'bg-white/95'
      }`}>
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16 w-full">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-primary-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-base sm:text-lg">D</span>
              </div>
              <span className="text-lg sm:text-xl font-bold text-secondary-900 whitespace-nowrap">
                DropSpot
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6 flex-shrink-0">
            {[
              { href: '/', label: 'Home', active: true },
              { href: '/drops', label: 'Drops', active: false },
              { href: '/waitlist', label: 'My Waitlist', active: false, authRequired: true },
              { href: '/about', label: 'About', active: false },
              { href: '/contact', label: 'Contact', active: false }
            ].filter(link => !link.authRequired || session?.user).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`font-medium transition-colors duration-150 whitespace-nowrap ${
                  link.active
                    ? 'text-primary-600'
                    : 'text-secondary-600 hover:text-primary-600'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Authentication Section - Desktop */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-3 flex-shrink-0">
            {status === 'loading' ? (
              <div className="flex items-center space-x-2 flex-shrink-0">
                <div className="w-7 h-7 lg:w-8 lg:h-8 animate-pulse bg-primary-200 rounded-full flex-shrink-0" />
                <div className="w-16 lg:w-20 h-3 lg:h-4 animate-pulse bg-primary-200 rounded flex-shrink-0" />
              </div>
            ) : session ? (
              <div className="flex items-center space-x-2 lg:space-x-4 flex-shrink-0">
                <div className="flex items-center space-x-2 lg:space-x-3 flex-shrink-0">
                  <div className="w-7 h-7 lg:w-8 lg:h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs lg:text-sm font-medium">
                      {(session.user?.name || session.user?.email)?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden lg:flex flex-col min-w-0 max-w-32">
                    <span className="text-sm font-medium text-secondary-900 truncate">
                      {session.user?.name || 'User'}
                    </span>
                    <span className="text-xs text-secondary-500 truncate">
                      {session.user?.email}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut()}
                  className="flex-shrink-0"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-1 lg:space-x-2 flex-shrink-0">
                <Link href="/auth/signin" className="hidden lg:block flex-shrink-0">
                  <Button variant="ghost" size="sm" className="whitespace-nowrap">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register" className="flex-shrink-0">
                  <Button variant="primary" size="sm" className="text-xs lg:text-sm px-3 lg:px-4 whitespace-nowrap">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
            
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-1.5 sm:p-2 rounded-lg text-secondary-600 hover:bg-primary-50 hover:text-primary-600 transition-colors"
            aria-label="Toggle mobile menu"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-3 sm:py-4 border-t border-gray-200/50 bg-white shadow-lg w-full overflow-hidden">
            {/* Navigation Links */}
            <div className="space-y-1 sm:space-y-2 mb-3 sm:mb-4">
              {[
                { href: '/', label: 'Home' },
                { href: '/drops', label: 'Drops' },
                { href: '/about', label: 'About' },
                { href: '/contact', label: 'Contact' }
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base text-secondary-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Mobile Authentication Section */}
            <div className="border-t border-gray-200/50 pt-3 sm:pt-4">
              {status === 'loading' ? (
                <div className="px-3 sm:px-4 py-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 animate-pulse bg-primary-200 rounded-full" />
                    <div className="flex-1">
                      <div className="w-20 sm:w-24 h-3 sm:h-4 animate-pulse bg-primary-200 rounded mb-1" />
                      <div className="w-28 sm:w-32 h-2 sm:h-3 animate-pulse bg-primary-200 rounded" />
                    </div>
                  </div>
                </div>
              ) : session ? (
                <div className="px-3 sm:px-4 space-y-3">
                  {/* User Info */}
                  <div className="flex items-center space-x-3 py-1.5 sm:py-2">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {(session.user?.name || session.user?.email)?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-sm font-medium text-secondary-900 truncate">
                        {session.user?.name || 'User'}
                      </span>
                      <span className="text-xs text-secondary-500 truncate">
                        {session.user?.email}
                      </span>
                    </div>
                  </div>
                  
                  {/* Sign Out Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => signOut()}
                    className="w-full"
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="px-3 sm:px-4 space-y-2 sm:space-y-3">
                  <Link href="/auth/signin" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full justify-center text-sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/register" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="primary" size="sm" className="w-full justify-center text-sm">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
    </>
  )
}