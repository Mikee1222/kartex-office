import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", ...defaultTheme.fontFamily.sans],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        navy: {
          950: "#020818",
          900: "#0A1628",
          800: "#0d1f3c",
          700: "#1a2f4a",
        },
        gold: {
          500: "#D4AF37",
          400: "#E8C547",
          300: "#F0D060",
        },
        gray: {
          50: "#F8F9FC",
          100: "#F1F4F9",
          200: "#E2E8F0",
          400: "#94A3B8",
          600: "#475569",
        },
        kartex: {
          navy: "#0A1628",
          "navy-deep": "#020818",
          "navy-mid": "#1a2f4a",
          "navy-soft": "#0d1f3c",
          gold: "#D4AF37",
          "gold-mid": "#E8C547",
          "gold-light": "#F0D060",
          bg: "#F8F9FC",
          card: "#FFFFFF",
          border: "#E2E8F0",
          muted: "#475569",
        },
        surface: "#F8F9FC",
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        info: "#3B82F6",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
        card: "1rem",
        "2xl": "1rem",
        button: "0.5rem",
        input: "0.375rem",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        "card-hover": "0 10px 25px rgba(0,0,0,0.1)",
        gold: "0 0 20px rgba(212,175,55,0.15)",
        "gold-button": "0 4px 15px rgba(212,175,55,0.4)",
        "gold-button-hover": "0 8px 24px rgba(212,175,55,0.45)",
      },
      transitionDuration: {
        DEFAULT: "150ms",
        lift: "200ms",
      },
      transitionTimingFunction: {
        DEFAULT: "ease",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.35s ease-out both",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
