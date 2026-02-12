/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // SemRank Dark Universe Theme
        background: '#0a0a0f',
        ink: '#ffffff',
        body: '#b4b8c5',
        bubble: '#1a1a2e',
        bubbleSecondary: '#16213e',
        accent: '#f582ae',
      },
      fontFamily: {
        display: ['Slackey', 'cursive'],
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'bubble': '2rem',
        'bubble-lg': '3rem',
      },
      boxShadow: {
        'bubble': '0 8px 24px rgba(245, 130, 174, 0.15)',
        'bubble-hover': '0 12px 32px rgba(245, 130, 174, 0.25)',
        'bubble-active': '0 4px 12px rgba(245, 130, 174, 0.1)',
      },
    },
  },
  plugins: [],
}
