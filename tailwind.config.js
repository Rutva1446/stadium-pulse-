/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#020814',
          900: '#040d1a',
          800: '#071426',
          700: '#0a1e36',
          600: '#0f2a4a',
        },
        brand: {
          blue:   '#3b82f6',
          gold:   '#f59e0b',
          green:  '#10b981',
          red:    '#ef4444',
          purple: '#8b5cf6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow':  'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float':       'float 4s ease-in-out infinite',
        'glow-red':    'glowRed 2s ease-in-out infinite',
        'slide-in':    'slideIn 0.4s ease-out',
        'fade-up':     'fadeUp 0.5s ease-out',
        'spin-slow':   'spin 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        glowRed: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(239,68,68,0.3)' },
          '50%':      { boxShadow: '0 0 40px rgba(239,68,68,0.8)' },
        },
        slideIn: {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to:   { transform: 'translateX(0)',    opacity: '1' },
        },
        fadeUp: {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
