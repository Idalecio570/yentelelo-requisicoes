/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ['"Geist Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        /* ── shadcn tokens (mantidos para compatibilidade) ── */
        border:     "hsl(var(--border))",
        input:      "hsl(var(--input))",
        ring:       "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        /* ── Yentelelo Brand tokens ── */
        brand: {
          navy:      "#002C62",
          "navy-700":"#003A7A",
          "navy-600":"#00498F",
          red:       "#EF2627",
          gold:      "#FCC631",
        },

        /* ── Neutrals ── */
        "app-bg":       "#FAFAFA",
        "app-surface":  "#FFFFFF",
        "app-surface2": "#F5F6F8",
        "app-border":   "#E6E8EC",
        "app-border-s": "#D5D9E0",
        "app-text":     "#0F172A",
        "app-text2":    "#475569",
        "app-text3":    "#94A3B8",
      },

      borderRadius: {
        none:    "0px",
        sm:      "4px",
        DEFAULT: "6px",
        md:      "10px",
        lg:      "16px",    /* cards */
        xl:      "18px",
        "2xl":   "28px",
        "3xl":   "36px",
        full:    "9999px",
      },

      boxShadow: {
        "1": "0 1px 2px rgba(15,23,42,.04), 0 0 0 1px rgba(15,23,42,.04)",
        "2": "0 4px 16px -4px rgba(15,23,42,.08), 0 0 0 1px rgba(15,23,42,.05)",
      },

      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
}
