import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",

        // FitClub raw tokens
        surface: "var(--surface)",
        bg: "var(--bg)",
        fg: {
          DEFAULT: "var(--fg)",
          muted: "var(--fg-muted)",
          faint: "var(--fg-faint)",
        },
        amber: {
          DEFAULT: "var(--accent-amber)",
          soft: "var(--accent-soft)",
        },
        good: {
          DEFAULT: "var(--good)",
          soft: "var(--good-soft)",
        },
        warn: {
          DEFAULT: "var(--warn)",
          soft: "var(--warn-soft)",
        },
        bad: {
          DEFAULT: "var(--bad)",
          soft: "var(--bad-soft)",
        },
        info: {
          DEFAULT: "var(--info)",
          soft: "var(--info-soft)",
        },
        cat: {
          yoga: "var(--cat-yoga)",
          cross: "var(--cat-cross)",
          pilates: "var(--cat-pilates)",
          strength: "var(--cat-strength)",
          cardio: "var(--cat-cardio)",
          pt: "var(--cat-pt)",
        },
        "border-faint": "var(--border-faint)",
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        pill: "999px",
      },
      boxShadow: {
        "fc-1": "var(--sh-1)",
        "fc-2": "var(--sh-2)",
        "fc-3": "var(--sh-3)",
        "fc-float": "var(--sh-float)",
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "var(--font-mono)",
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
      },
      letterSpacing: {
        tightest: "-0.04em",
        tighter: "-0.025em",
        tightish: "-0.01em",
        wider2: "0.04em",
        widest2: "0.06em",
      },
      backgroundImage: {
        "warm-cream":
          "linear-gradient(180deg, #ece9e2 0%, #d8d4cc 100%)",
      },
    },
  },
  plugins: [],
} satisfies Config;
