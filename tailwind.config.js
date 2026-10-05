/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1C2333',
        paper: '#F5F6F8',
        muted: '#5B6472',
        line: '#DFE2E8',
        retain: '#2F6F4E',
        risk: '#B5482C',
        shift: '#B08A2E',
      },
      fontFamily: {
        serif: ['"Newsreader"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
