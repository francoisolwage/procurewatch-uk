import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          navy: "#0f172a",
          blue: "#1e40af",
          slate: "#64748b",
          border: "#e2e8f0",
          surface: "#f8fafc",
        },
        risk: {
          high: "#dc2626",
          medium: "#d97706",
          low: "#16a34a",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;