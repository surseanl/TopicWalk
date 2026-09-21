const path = require("node:path");
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    path.join(__dirname, "app/**/*.{js,jsx,ts,tsx}"),
    path.join(__dirname, "components/**/*.{js,jsx,ts,tsx}"),
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#f59e0b",
        background: "#fafaf9",
        foreground: "#1c1917",
        card: "#ffffff",
        border: "#e7e5e4",
        muted: "#f5f5f4",
        "muted-foreground": "#78716c",
        destructive: "#ef4444",
      },
    },
  },
  plugins: [],
};
