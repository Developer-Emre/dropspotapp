// ============================================
// REUSABLE STAT CARD COMPONENT
// ============================================

interface StatCardProps {
  number: string
  label: string
  variant?: 'default' | 'glass' | 'hero'
  className?: string
}

export default function StatCard({ 
  number, 
  label, 
  variant = 'default',
  className = '' 
}: StatCardProps) {
  const baseClasses = "text-center transition-all"
  
  const variantClasses = {
    default: "bg-white p-6 rounded-xl border border-gray-100 hover:shadow-md",
    glass: "bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20",
    hero: "bg-white/60 backdrop-blur-sm p-6 rounded-xl border border-white/50 shadow-sm hover:shadow-md transition-shadow"
  }

  const numberClasses = {
    default: "text-3xl font-bold text-primary-600 mb-2",
    glass: "text-2xl font-bold text-white mb-1",
    hero: "text-3xl font-bold text-primary-600 mb-2"
  }

  const labelClasses = {
    default: "text-secondary-600 font-medium",
    glass: "text-primary-100 text-sm font-medium",
    hero: "text-secondary-600 font-medium"
  }

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      <div className={numberClasses[variant]}>{number}</div>
      <div className={labelClasses[variant]}>{label}</div>
    </div>
  )
}