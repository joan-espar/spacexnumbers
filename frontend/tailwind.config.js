/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Define your custom colors here, e.g.,
        'apple-blue': '#0070C9',
        'apple-gray': '#F7F7F7',
      },
    },
  },
  plugins: [],
}