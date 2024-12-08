/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Roboto', 'system-ui', 'sans-serif'],
      },
      colors: {
        spacex: {
          dark: '#0E1116',
          black: '#000',
          gray: '#2C3034',
          white: '#FFFFFF',
          blue: '#4B92DB'
        }
      },
      backgroundImage: {
        'spacex-gradient': 'linear-gradient(to right, rgba(0,0,0,0.8), rgba(0,0,0,0.2))',
      }
    },
  },
  plugins: [],
}