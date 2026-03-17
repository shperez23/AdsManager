/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        brand: {
          500: '#6366f1',
          600: '#4f46e5',
        },
      },
      boxShadow: {
        glow: '0 0 0 1px rgb(99 102 241 / 0.3), 0 20px 45px -20px rgb(79 70 229 / 0.8)',
      },
    },
  },
  plugins: [],
};
