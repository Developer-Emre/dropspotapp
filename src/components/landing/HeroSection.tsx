// ============================================
// DYNAMIC HERO SECTION COMPONENT  
// ============================================

'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import StatCard from '@/components/ui/StatCard'

// Hero data - centralized for easier maintenance
const heroData = {
  badge: "🚀 Platform Launch",
  title: "Discover & Claim Exclusive",
  titleHighlight: "Drops",
  subtitle: "Join the ultimate platform for discovering and claiming limited-time opportunities, exclusive releases, and premium content drops.",
  features: [
    "⚡ Instant Claims",
    "🔒 Secure Platform", 
    "🎯 Real-time Notifications"
  ],
  stats: [
    { number: '1K+', label: 'Active Users' },
    { number: '5K+', label: 'Drops Claimed' },
    { number: '98%', label: 'Satisfaction Rate' }
  ],
  buttons: {
    authenticated: [
      {
        text: "Explore Drops",
        href: "/drops",
        className: "shadow-md hover:shadow-lg"
      },
      {
        text: "My Profile",
        href: "/profile",
        variant: "outline" as const,
        className: "bg-white/80 backdrop-blur-sm"
      }
    ],
    unauthenticated: [
      {
        text: "Get Started Now",
        href: "/auth/signin",
        className: "shadow-md hover:shadow-lg"
      },
      {
        text: "Browse Drops",
        href: "/drops",
        variant: "outline" as const,
        className: "bg-white/80 backdrop-blur-sm"
      }
    ]
  }
}

export default function HeroSection() {
  const { data: session } = useSession()

  return (
    <section className="relative bg-gradient-to-br from-primary-50 via-white to-secondary-50 pt-24 pb-20 px-3 sm:px-4 w-full overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-20 left-10 sm:left-20 w-48 sm:w-64 h-48 sm:h-64 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
        <div className="absolute bottom-20 right-10 sm:right-20 w-64 sm:w-80 h-64 sm:h-80 bg-secondary-200 rounded-full mix-blend-multiply filter blur-xl opacity-60"></div>
      </div>
      
      <div className="w-full max-w-6xl mx-auto relative z-10">
        <div className="text-center">
          {/* Main Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-secondary-900 mb-6 leading-tight px-2">
            {heroData.title}
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-700">
              {heroData.titleHighlight}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl md:text-2xl text-secondary-600 mb-12 max-w-4xl mx-auto leading-relaxed px-2">
            {heroData.subtitle}
          </p>

          {/* Feature Highlights */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {heroData.features.map((feature, index) => (
              <div 
                key={index}
                className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-primary-200 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <span className="text-sm font-medium text-secondary-700">{feature}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-12 sm:mb-16 px-2">
            {session ? (
              <>
                <Link href="/drops">
                  <Button size="lg" className="w-full sm:w-auto shadow-md hover:shadow-lg">
                    Explore Drops
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto bg-white/80 backdrop-blur-sm">
                    My Profile
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/signin">
                  <Button size="lg" className="w-full sm:w-auto shadow-md hover:shadow-lg">
                    Get Started Now
                  </Button>
                </Link>
                <Link href="/drops">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto bg-white/80 backdrop-blur-sm">
                    Browse Drops
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Stats or Social Proof */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { number: '1000+', label: 'Active Users' },
              { number: '250+', label: 'Successful Drops' },
              { number: '98%', label: 'Satisfaction Rate' }
            ].map((stat) => (
              <div key={stat.label} className="text-center bg-white/60 backdrop-blur-sm p-6 rounded-xl border border-white/50 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl font-bold text-primary-600 mb-2">{stat.number}</div>
                <div className="text-secondary-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}