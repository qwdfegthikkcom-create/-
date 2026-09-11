module.exports = {
  content: ["./app/**/*.{ts,tsx,js,jsx}", "./components/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        sand: {
          50: "#FBF6EC",
          100: "#F5EAD3",
          200: "#EBD9AF",
          300: "#DFC287",
          400: "#D1A55F",
        },
        dune: {
          500: "#C8873E",
          600: "#B06A2E",
          700: "#8F5124",
        },
        rust: {
          500: "#B5502C",
          600: "#963F21",
          700: "#732F19",
        },
        ink: {
          900: "#2B1B10",
          800: "#3A2717",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: 0, transform: "translateY(18px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        "pop": {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.18)" },
          "100%": { transform: "scale(1)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(.22,1,.36,1) both",
        "pop": "pop 0.35s ease-out",
        "shimmer": "shimmer 2.5s linear infinite",
        "float-slow": "float-slow 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
}
