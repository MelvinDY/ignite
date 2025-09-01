/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      rotate: {
        10: "10deg",
      },
      screens: {
        xs: "396px",
      },
    },
    fontFamily: {
      kaushan: ["var(--secondary-font)", "cursive"],
    },
  },
  plugins: [],
};
