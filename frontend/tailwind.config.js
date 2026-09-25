/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FFF8F1',
        surface: '#FFFFFF',
        ink: '#2B1B12',
        muted: '#8A7768',
        border: '#F0E4D8',
        primary: {
          DEFAULT: '#E1481F',
          dark: '#B8380F',
          light: '#FCE3D8'
        },
        gold: {
          DEFAULT: '#C98A2C',
          light: '#F6E7CC'
        },
        success: '#3F7D4E',
        warn: '#B8860F',
        danger: '#C23B22'
      },
      fontFamily: {
        display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        sans: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        xl2: '1.25rem'
      },
      boxShadow: {
        warm: '0 8px 24px -8px rgba(43, 27, 18, 0.18)'
      }
    }
  },
  plugins: []
}
