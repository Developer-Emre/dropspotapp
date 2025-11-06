// ============================================
// DYNAMIC CTA SECTION COMPONENT
// ============================================

'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import StatCard from '@/components/ui/StatCard'

// CTA data - centralized for easier maintenance
const ctaData = {
  title: "Ready to Join the",
  titleHighlight: "Drop Revolution",
  subtitle: "Don't miss out on exclusive opportunities. Join thousands of users who are already claiming their spots.",
  buttons: {
    authenticated: [
      {
        text: "Explore All Drops",
        href: "/drops",
        className: "bg-white text-primary-600 hover:bg-gray-100 shadow-lg hover:shadow-xl"
      },
      {
        text: "View My Claims",
        href: "/profile",
        variant: "outline" as const,
        className: "border border-white/50 text-white hover:bg-white hover:text-primary-600 bg-white/10 backdrop-blur-sm"
      }
    ],
    unauthenticated: [
      {
        text: "Start Claiming Now",
        href: "/auth/signin",
        variant: "outline" as const,
        className: "border border-white/50 text-white hover:bg-white hover:text-primary-600 bg-white/10 backdrop-blur-sm"
      },
      {
        text: "Browse Drops",
        href: "/drops",
        variant: "outline" as const,
        className: "border border-white/50 text-white hover:bg-white hover:text-primary-600 bg-white/10 backdrop-blur-sm"
      }
    ]
  }
}

export default function CTASection() {
  const { data: session } = useSession()

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-primary-600 to-primary-700 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-48 -translate-y-48 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-48 translate-y-48 blur-3xl"></div>
      </div>
      
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
          {ctaData.title} <span className="bg-gradient-to-r from-white to-primary-100 bg-clip-text text-transparent">{ctaData.titleHighlight}</span>?
        </h2>
        <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto leading-relaxed">
          {ctaData.subtitle}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {session 
            ? ctaData.buttons.authenticated.map((button, index) => (
                <Link key={index} href={button.href}>
                  <Button 
                    size="lg" 
                    variant={button.variant}
                    className={`w-full sm:w-auto ${button.className}`}
                  >
                    {button.text}
                  </Button>
                </Link>
              ))
            : ctaData.buttons.unauthenticated.map((button, index) => (
                <Link key={index} href={button.href}>
                  <Button 
                    size="lg" 
                    variant={button.variant}
                    className={`w-full sm:w-auto ${button.className}`}
                  >
                    {button.text}
                  </Button>
                </Link>
              ))
          }
        </div>


      </div>
    </section>
  )
}