/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#e6f7f1',
          100: '#b3e8d4',
          200: '#80d9b7',
          300: '#4dcb9a',
          400: '#26bf85',
          500: '#00b371',
          600: '#00956a', // main brand
          700: '#007a55',
          800: '#005f41',
          900: '#00452e',
        },
        surface: '#f7faf9',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}