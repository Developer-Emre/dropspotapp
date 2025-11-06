// ============================================
// REUSABLE SECTION HEADER COMPONENT
// ============================================

interface SectionHeaderProps {
  badge?: string
  title: string
  titleHighlight?: string
  subtitle: string
  centered?: boolean
  className?: string
}

export default function SectionHeader({ 
  badge,
  title, 
  titleHighlight,
  subtitle, 
  centered = true,
  className = '' 
}: SectionHeaderProps) {
  const textAlign = centered ? 'text-center' : 'text-left'
  
  return (
    <div className={`${textAlign} ${className}`}>
      {badge && (
        <div className="inline-flex items-center px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold mb-6">
          {badge}
        </div>
      )}
      
      <h2 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-6">
        {title}
        {titleHighlight && (
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-700">
            {' '}{titleHighlight}
          </span>
        )}
      </h2>
      
      <p className="text-xl text-secondary-600 max-w-3xl mx-auto leading-relaxed">
        {subtitle}
      </p>
    </div>
  )
}