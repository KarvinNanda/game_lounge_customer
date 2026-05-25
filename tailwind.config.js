/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'q-bg':         '#080810',
        'q-card':       '#11111E',
        'q-card2':      '#181828',
        'q-border':     '#252540',
        'q-primary':    '#7C3AED',
        'q-primary-l':  '#A78BFA',
        'q-primary-d':  '#5B21B6',
        'q-gold':       '#F59E0B',
        'q-green':      '#10B981',
        'q-red':        '#EF4444',
        'q-text':       '#FFFFFF',
        'q-text-2':     '#9CA3AF',
        'q-text-3':     '#6B7280',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-purple': 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
        'gradient-card':   'linear-gradient(180deg, #181828 0%, #11111E 100%)',
        'gradient-hero':   'linear-gradient(180deg, rgba(8,8,16,0) 0%, #080810 100%)',
      },
      boxShadow: {
        'purple':    '0 0 24px rgba(124,58,237,0.3)',
        'purple-sm': '0 0 12px rgba(124,58,237,0.2)',
        'card':      '0 4px 24px rgba(0,0,0,0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
