/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        amenly: {
          darkest: '#0A2647',
          dark: '#144272',
          medium: '#205295',
          light: '#2C74B3',
        },
        silver: '#C0C0C0',
      },
    },
  },
  plugins: [],
}
