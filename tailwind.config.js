/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        hh: {
          bg: "#05080A",
          card: "#0C1017",
          border: "#1E2633",
          input: "#121720",
          orange: "#FF5027",
          pink: "#E71D73",
          purple: "#7000FF",
          yellow: "#FEE101",
          neon: "#00FF88",
          muted: "#8A99AD",
        },
      },
      fontFamily: {
        display: ["var(--font-syne)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      backgroundImage: {
        'sunrise-gradient': 'linear-gradient(135deg, #FF5027 0%, #E71D73 50%, #7000FF 100%)',
        'sunrise-gradient-radial': 'radial-gradient(circle at top right, rgba(255, 80, 39, 0.25), rgba(231, 29, 115, 0.15) 50%, transparent 80%)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.8', boxShadow: '0 0 15px rgba(255, 80, 39, 0.3)' },
          '50%': { opacity: '1', boxShadow: '0 0 30px rgba(231, 29, 115, 0.6)' },
        },
      },
    },
  },
  plugins: [],
};
