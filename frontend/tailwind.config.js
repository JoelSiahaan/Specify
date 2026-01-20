/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    // Exclude test files to reduce memory usage
    "!./src/**/__tests__/**",
    "!./src/**/*.test.{js,ts,jsx,tsx}",
    "!./src/test/**",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0f6cbf',
          dark: '#0a5391',
          light: '#3d8fd1',
          lighter: '#e3f2fd',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
