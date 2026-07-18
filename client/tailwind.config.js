/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#22C55E',
          dark: '#16A34A',
          light: '#DCFCE7',
        },
        cardbg: '#F8FAFC',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        premium: '0 4px 20px -2px rgba(34, 197, 94, 0.12), 0 2px 8px -1px rgba(0, 0, 0, 0.04)',
        soft: '0 2px 12px rgba(0, 0, 0, 0.03)',
      },
    },
  },
  plugins: [],
}
