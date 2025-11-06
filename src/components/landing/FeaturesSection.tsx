// ============================================
// FEATURES SECTION COMPONENT
// ============================================

import FeatureCard from '@/components/ui/FeatureCard'
import Icon from '@/components/ui/Icon'

// Feature data - centralized for easier maintenance
const featuresData = [
  {
    iconPath: "M13 10V3L4 14h7v7l9-11h-7z",
    title: "Lightning Fast Claims",
    description: "Claim your spot instantly with our optimized claiming system. No delays, no hassles."
  },
  {
    iconPath: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
    title: "Secure & Reliable",
    description: "Your data and claims are protected with enterprise-grade security and redundancy."
  },
  {
    iconPath: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    title: "Community Driven",
    description: "Join a vibrant community of users sharing the latest drops and opportunities."
  },
  {
    iconPath: "M15 17h5l-5 5v-5zM9 7H4l5-5v5zm0 10v-5h6v5H9z",
    title: "Real-time Updates",
    description: "Get instant notifications about new drops, status changes, and opportunities."
  },
  {
    iconPath: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    title: "Analytics & Insights",
    description: "Track your participation history and success rates with detailed analytics."
  },
  {
    iconPath: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
    title: "Favorite Drops",
    description: "Save and track your favorite drops to never miss out on opportunities you care about."
  }
]

export default function FeaturesSection() {

  return (
    <section className="py-32 px-4 bg-gradient-to-b from-white to-gray-50/50">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold mb-6">
            ✨ Platform Features
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-6">
            Why Choose 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-700">
              {' '}DropSpot?
            </span>
          </h2>
          <p className="text-xl text-secondary-600 max-w-3xl mx-auto leading-relaxed">
            Discover the features that make DropSpot the best platform for finding and claiming exclusive opportunities.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuresData.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={<Icon path={feature.iconPath} />}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  )
}