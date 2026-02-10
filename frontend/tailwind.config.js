/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // SemRank Happy Hues #17 Palette
        background: '#fef6e4',
        ink: '#001858',
        body: '#172c66',
        bubble: '#f3d2c1',
        bubbleSecondary: '#8bd3dd',
        accent: '#f582ae',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'bubble': '2rem',
        'bubble-lg': '3rem',
      },
      boxShadow: {
        'bubble': '0 8px 24px rgba(0, 24, 88, 0.1)',
        'bubble-hover': '0 12px 32px rgba(0, 24, 88, 0.15)',
        'bubble-active': '0 4px 12px rgba(0, 24, 88, 0.08)',
      },
    },
  },
  plugins: [],
}
