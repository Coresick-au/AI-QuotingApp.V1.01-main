/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Roboto', 'Segoe UI', 'sans-serif'],
        heading: ['Inter', 'Roboto', 'sans-serif'],
      },
      colors: {
        // Industrial Dark Theme Colors
        'bg-primary': '#0a1628',
        'bg-secondary': '#0f172a',
        'bg-tertiary': '#1e293b',
        'accent-primary': '#0ea5e9',
        'accent-secondary': '#06b6d4',
        'accent-hover': '#38bdf8',
        'success': '#10b981',
        'warning': '#f59e0b',
        'danger': '#dc2626',
        'slate-200': '#e2e8f0',
        'slate-700': '#334155',
        
        // Keep existing primary for compatibility
        primary: {
          50: '#e6f3ff',
          100: '#b3d9ff',
          200: '#80bfff',
          300: '#4da5ff',
          400: '#1a8cff',
          500: '#0A84FF',
          600: '#0066cc',
          700: '#004d99',
          800: '#003366',
          900: '#001a33',
        },
      },
      boxShadow: {
        'teal-glow': '0 0 10px rgba(6, 182, 212, 0.3)',
        'blue-glow': '0 0 10px rgba(14, 165, 233, 0.3)',
      },
    },
  },
  plugins: [],
}
