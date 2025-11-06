/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // DropSpot Brand Colors
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe', 
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9', // Main brand color
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        secondary: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a', // Secondary accent
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        },
        // Status Colors
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e', // Success state
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // Warning state
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444', // Error state
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        // Neutral grays
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'hard': '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounceSubtle 1s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    // Custom component classes
    function({ addComponents, theme }: { addComponents: any; theme: any }) {
      addComponents({
        // Button variants
        '.btn-primary': {
          backgroundColor: theme('colors.primary.500'),
          color: theme('colors.white'),
          padding: theme('spacing.3') + ' ' + theme('spacing.6'),
          borderRadius: theme('borderRadius.lg'),
          fontWeight: theme('fontWeight.medium'),
          fontSize: theme('fontSize.sm[0]'),
          lineHeight: theme('fontSize.sm[1].lineHeight'),
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: theme('colors.primary.600'),
            transform: 'translateY(-1px)',
            boxShadow: theme('boxShadow.medium'),
          },
          '&:active': {
            transform: 'translateY(0)',
          },
          '&:disabled': {
            backgroundColor: theme('colors.gray.300'),
            cursor: 'not-allowed',
            transform: 'none',
            boxShadow: 'none',
          },
        },
        '.btn-secondary': {
          backgroundColor: theme('colors.white'),
          color: theme('colors.secondary.700'),
          border: '1px solid ' + theme('colors.secondary.300'),
          padding: theme('spacing.3') + ' ' + theme('spacing.6'),
          borderRadius: theme('borderRadius.lg'),
          fontWeight: theme('fontWeight.medium'),
          fontSize: theme('fontSize.sm[0]'),
          lineHeight: theme('fontSize.sm[1].lineHeight'),
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: theme('colors.secondary.50'),
            borderColor: theme('colors.secondary.400'),
            transform: 'translateY(-1px)',
          },
        },
        '.btn-danger': {
          backgroundColor: theme('colors.danger.500'),
          color: theme('colors.white'),
          padding: theme('spacing.3') + ' ' + theme('spacing.6'),
          borderRadius: theme('borderRadius.lg'),
          fontWeight: theme('fontWeight.medium'),
          fontSize: theme('fontSize.sm[0]'),
          lineHeight: theme('fontSize.sm[1].lineHeight'),
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: theme('colors.danger.600'),
            transform: 'translateY(-1px)',
          },
        },
        // Card components
        '.card': {
          backgroundColor: theme('colors.white'),
          borderRadius: theme('borderRadius.xl'),
          boxShadow: theme('boxShadow.soft'),
          padding: theme('spacing.6'),
          border: '1px solid ' + theme('colors.gray.200'),
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: theme('boxShadow.medium'),
            transform: 'translateY(-2px)',
          },
        },
        '.card-interactive': {
          backgroundColor: theme('colors.white'),
          borderRadius: theme('borderRadius.xl'),
          boxShadow: theme('boxShadow.soft'),
          padding: theme('spacing.6'),
          border: '1px solid ' + theme('colors.gray.200'),
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: theme('boxShadow.hard'),
            transform: 'translateY(-4px)',
            borderColor: theme('colors.primary.300'),
          },
        },
        // Input variants
        '.input-field': {
          width: '100%',
          padding: theme('spacing.3') + ' ' + theme('spacing.4'),
          borderRadius: theme('borderRadius.lg'),
          border: '1px solid ' + theme('colors.gray.300'),
          fontSize: theme('fontSize.sm[0]'),
          lineHeight: theme('fontSize.sm[1].lineHeight'),
          transition: 'all 0.2s ease',
          '&:focus': {
            outline: 'none',
            borderColor: theme('colors.primary.500'),
            boxShadow: '0 0 0 3px ' + theme('colors.primary.100'),
          },
          '&:disabled': {
            backgroundColor: theme('colors.gray.50'),
            cursor: 'not-allowed',
          },
        },
        // Status badges
        '.badge-success': {
          backgroundColor: theme('colors.success.100'),
          color: theme('colors.success.800'),
          padding: theme('spacing.1') + ' ' + theme('spacing.3'),
          borderRadius: theme('borderRadius.full'),
          fontSize: theme('fontSize.xs[0]'),
          fontWeight: theme('fontWeight.medium'),
        },
        '.badge-warning': {
          backgroundColor: theme('colors.warning.100'),
          color: theme('colors.warning.800'),
          padding: theme('spacing.1') + ' ' + theme('spacing.3'),
          borderRadius: theme('borderRadius.full'),
          fontSize: theme('fontSize.xs[0]'),
          fontWeight: theme('fontWeight.medium'),
        },
        '.badge-danger': {
          backgroundColor: theme('colors.danger.100'),
          color: theme('colors.danger.800'),
          padding: theme('spacing.1') + ' ' + theme('spacing.3'),
          borderRadius: theme('borderRadius.full'),
          fontSize: theme('fontSize.xs[0]'),
          fontWeight: theme('fontWeight.medium'),
        },
      })
    }
  ],
}