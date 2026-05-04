/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        bg: '#070A0F',
        panel: '#111827',
        card: '#161E2E',
        border: '#273244',
        primary: '#F9FAFB',
        secondary: '#9CA3AF',
        accent: '#7C3AED',
        'accent-blue': '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        btn: '14px',
      },
    },
  },
  plugins: [],
};