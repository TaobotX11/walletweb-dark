/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        nux: {
          50: '#f2fff0',
          100: '#e3fee0',
          200: '#c0fdba',
          300: '#88fc7d',
          400: '#38f838',
          500: '#0ee90e',
          600: '#09c702',
          700: '#03a103',
          800: '#0b8507',
          900: '#0f6e0c',
        },
        dark: {
          50: '#f8fcf8',
          100: '#f1f9f2',
          200: '#e2f0e2',
          300: '#cbe1cb',
          400: '#94b897',
          500: '#648b64',
          600: '#47694a',
          700: '#335533',
          800: '#1e3b1e',
          900: '#0f2a10',
          950: '#021702',
        },
      },
    },
  },
  plugins: [],
};
