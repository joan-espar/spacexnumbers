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
    screens: {
      'sm': '600px',
      // => @media (min-width: 640px) { ... }

      'md': '800px',
      // => @media (min-width: 768px) { ... }

      'lg': '1024px',
      // => @media (min-width: 1024px) { ... }

      'xl': '1280px',
      // => @media (min-width: 1280px) { ... }

      '2xl': '1536px',
      // => @media (min-width: 1536px) { ... }
    }
  },
  plugins: [],
  variants: {
    extend: {}
  },
  // Adding the custom flex utilities
  extend: {
    flex: {
      'grow': '1 0 0',
      'shrink-0': '0 0 auto',
      'basis-0': '0 1 0%',
    }
  }
}