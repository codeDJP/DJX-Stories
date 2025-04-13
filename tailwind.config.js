/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'djx-yellow': '#FFCF00',
        'djx-dark': '#1a1a1a',
        'djx-darker': '#000000',
        'djx-gray': '#262626',
        'djx-light-gray': '#cccccc',
      },
    },
  },
  plugins: [],
}