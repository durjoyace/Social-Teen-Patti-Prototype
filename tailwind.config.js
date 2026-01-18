/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        // Primary palette
        brand: {
          red: '#8B0000',
          gold: '#D4AF37',
          coral: '#D4745E',
          cream: '#FFF8DC'
        },
        // Game colors
        felt: {
          light: '#2d5a27',
          DEFAULT: '#1a472a',
          dark: '#0d2818'
        },
        // Card colors
        card: {
          red: '#dc2626',
          black: '#1f2937'
        }
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
        hindi: ['Hind', 'sans-serif']
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'card-deal': 'cardDeal 0.5s ease-out forwards',
        'chip-stack': 'chipStack 0.3s ease-out forwards',
        'win-celebration': 'winCelebration 0.5s ease-out forwards'
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(212, 175, 55, 0.6)' }
        },
        cardDeal: {
          '0%': { transform: 'translateY(-100px) rotateY(180deg)', opacity: '0' },
          '100%': { transform: 'translateY(0) rotateY(0)', opacity: '1' }
        },
        chipStack: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        winCelebration: {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'shimmer': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)'
      },
      boxShadow: {
        'premium': '0 10px 40px -10px rgba(212, 175, 55, 0.3)',
        'premium-lg': '0 20px 60px -15px rgba(212, 175, 55, 0.4)',
        'card': '0 4px 15px -3px rgba(0, 0, 0, 0.3)',
        'inner-glow': 'inset 0 0 20px rgba(255, 255, 255, 0.1)'
      },
      backdropBlur: {
        xs: '2px'
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)'
      }
    }
  },
  plugins: []
}
