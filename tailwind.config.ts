/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        bg: '#050505',
        panel: '#0B0B0C',
        card: '#141416',
        border: '#2A2A2E',
        primary: '#F7F7F2',
        secondary: '#A2A2A8',
        accent: '#F8C741',
        danger: '#FF6B6B',
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
