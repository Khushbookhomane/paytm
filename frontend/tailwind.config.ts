import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      colors: {
        paytm: {
          blue: "#00BAF2",
          "blue-dark": "#0099cc",
          "blue-light": "#33c8f5",
          dark: "#002E6E",
          navy: "#042B62",
          "navy-light": "#003d8f",
          teal: "#00E0D6",
          light: "#E8F8FE",
          gray: "#F4F6F9",
          "gray-dark": "#E8EBF0",
        },
      },
      backgroundImage: {
        "paytm-header": "linear-gradient(135deg, #002E6E 0%, #003d8f 60%, #00519e 100%)",
        "paytm-splash": "linear-gradient(160deg, #002E6E 0%, #003d8f 50%, #042B62 100%)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        "paytm": "0 2px 8px -2px rgba(0, 46, 110, 0.12), 0 1px 4px -1px rgba(0, 0, 0, 0.06)",
        "paytm-lg": "0 8px 24px -4px rgba(0, 46, 110, 0.18), 0 2px 8px -2px rgba(0, 0, 0, 0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
