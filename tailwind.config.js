/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        paper: 'var(--paper)',
        sheet: 'var(--sheet)',
        ink: 'var(--ink)',
        mute: 'var(--mute)',
        pen: 'var(--pen)',
        stamp: 'var(--stamp)',
        warn: 'var(--warn)',
      },
      borderRadius: {
        DEFAULT: '8px',
        md: '8px',
        lg: '8px',
      },
    },
  },
  plugins: [],
}
