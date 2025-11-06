// ============================================
// REUSABLE ICON COMPONENT
// ============================================

interface IconProps {
  path: string
  className?: string
  size?: number
}

export default function Icon({ path, className = "w-8 h-8", size }: IconProps) {
  return (
    <svg 
      className={className}
      width={size} 
      height={size}
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d={path} 
      />
    </svg>
  )
}