/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        serif: ['Merriweather', 'serif'],
      },
      colors: {
        polishRed: '#DC143C',
        polishRedHover: '#B01030',
      },
      borderRadius: {
        DEFAULT: '0.25rem', // rounded
        md: '0.375rem',
        lg: '0.5rem',
      }
    },
  },
  plugins: [],
}
