/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}", // <-- Esta linha é a mais importante de todo o projeto!
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}