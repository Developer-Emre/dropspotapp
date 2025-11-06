// ============================================
// REUSABLE FEATURE CARD COMPONENT
// ============================================

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  className?: string
}

export default function FeatureCard({ 
  icon, 
  title, 
  description, 
  className = '' 
}: FeatureCardProps) {
  return (
    <div className={`bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all duration-200 ${className}`}>
      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-secondary-900 mb-3">{title}</h3>
      <p className="text-secondary-600 leading-relaxed">{description}</p>
    </div>
  )
}