/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        dark: {
          DEFAULT: '#000000',
          soft: '#0a0a0c',
          card: '#111114',
        },
        accent: {
          primary: '#fbbf24', // DebugAI Gold
          secondary: '#6366f1', // Indigo
        }
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 4s ease-in-out infinite alternate',
        'fade-in': 'fadeIn 1s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        fadeIn: {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          'from': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.2)' },
          'to': { boxShadow: '0 0 60px rgba(168, 85, 247, 0.4)' },
        }
      }
    },
  },
  plugins: [],
}
