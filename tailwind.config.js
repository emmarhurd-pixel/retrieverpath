/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        umbc: {
          black: '#000000',
          gold: '#FFD200',
          'gold-dark': '#C8A800',
          'gold-light': '#FFE566',
          gray: '#1a1a1a',
          'gray-mid': '#2d2d2d',
          'gray-light': '#3d3d3d',
        },
      },
    },
  },
  plugins: [],
}
