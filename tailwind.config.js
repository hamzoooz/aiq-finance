/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './App.tsx', './index.tsx', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Cairo', 'sans-serif'],
      },
      colors: {
        aiq: {
          blue: '#00d2ff',
          purple: '#9d00ff',
          dark: '#0f172a',
          light: '#f8fafc',
        },
      },
    },
  },
  plugins: [],
};
