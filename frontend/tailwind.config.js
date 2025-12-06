/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sidebar: {
          DEFAULT: "#111111",
          hover: "#1e1e1e",
          active: "#2a2a2a",
        },
      },
      boxShadow: {
        tab: "0 10px 30px -12px rgba(15, 23, 42, 0.25)",
        panel: "0 20px 45px -15px rgba(15, 23, 42, 0.18)",
      },
    },
  },
  plugins: [],
}
