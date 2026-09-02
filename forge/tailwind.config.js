/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#0B0C0A",
        primary: "#DFFF00",
        muted: "#E3E4DC",
        "muted-2": "#C7C8BF",
      },
    },
  },
  plugins: [],
};
