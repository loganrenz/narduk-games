/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts,tsx,js}'],
  theme: {
    extend: {
      colors: {
        casino: {
          table: '#0b1626',
          neon: '#14f195',
          danger: '#ff5f70',
        },
      },
      boxShadow: {
        neon: '0 0 25px rgba(20, 241, 149, 0.4)',
      },
    },
  },
  plugins: [],
}
