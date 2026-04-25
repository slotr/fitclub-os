import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#fafaf9",
        foreground: "#1a1a1a",
        accent: "#f59e0b",
      },
      borderRadius: { sm: "8px", md: "12px", lg: "16px", xl: "24px" },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;
