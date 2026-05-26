import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ── Colours ────────────────────────────────────────────────────────────
      colors: {
        // Main brand: Indigo-blue (professional, modern edu-tech feel)
        primary: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        // Secondary: Emerald (for success states, active indicators)
        secondary: {
          50:  '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        // Accent: Amber (warnings, highlights)
        accent: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
      },

      // ── Typography ─────────────────────────────────────────────────────────
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
      },

      // ── Spacing ────────────────────────────────────────────────────────────
      spacing: {
        '4.5': '1.125rem',
        '13':  '3.25rem',
        '18':  '4.5rem',
      },

      // ── Border Radius ──────────────────────────────────────────────────────
      borderRadius: {
        '4xl': '2rem',
      },

      // ── Box Shadows ────────────────────────────────────────────────────────
      boxShadow: {
        'sm':   '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        'DEFAULT': '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'md':   '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        'lg':   '0 10px 15px -3px rgb(0 0 0 / 0.07), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
        'xl':   '0 20px 25px -5px rgb(0 0 0 / 0.07), 0 8px 10px -6px rgb(0 0 0 / 0.05)',
        'card': '0 0 0 1px rgb(0 0 0 / 0.05), 0 2px 8px rgb(0 0 0 / 0.06)',
        'card-hover': '0 0 0 1px rgb(79 70 229 / 0.2), 0 4px 16px rgb(79 70 229 / 0.08)',
        'inset': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
        'glow-primary': '0 0 20px rgb(99 102 241 / 0.25)',
      },

      // ── Animations ─────────────────────────────────────────────────────────
      animation: {
        'fade-in':       'fade-in 0.2s ease-out',
        'slide-in-left': 'slide-in-left 0.25s ease-out',
        'slide-up':      'slide-up 0.2s ease-out',
        'bounce-sm':     'bounce-sm 0.4s ease-in-out',
        'spin-slow':     'spin 3s linear infinite',
        'pulse-slow':    'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)'   },
        },
        'slide-in-left': {
          '0%':   { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)'     },
        },
        'slide-up': {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)'    },
        },
        'bounce-sm': {
          '0%, 100%': { transform: 'translateY(0)'    },
          '50%':      { transform: 'translateY(-4px)' },
        },
      },

      // ── Transitions ────────────────────────────────────────────────────────
      transitionDuration: {
        '0':   '0ms',
        '250': '250ms',
      },

      // ── Screens ────────────────────────────────────────────────────────────
      screens: {
        'xs': '480px',
      },

      // ── Background ─────────────────────────────────────────────────────────
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':  'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'dots': 'radial-gradient(circle, #e2e8f0 1px, transparent 1px)',
      },
      backgroundSize: {
        'dots': '24px 24px',
      },
    },
  },
  plugins: [],
}

export default config
