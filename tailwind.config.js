/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#FAFAF7',
        ink: {
          DEFAULT: '#091B2E',
          muted: '#4B5563',
          faint: '#6B7280',
        },
        line: '#E5E7EB',
        line2: '#D1D5DB',
        card: '#FFFFFF',
        teal: {
          50: '#EAFDFC',
          100: '#C6F8F6',
          200: '#91F8F3',
          400: '#52E4DE',
          500: '#1EC3C0',
          600: '#17B1AE',
          700: '#0F8A88',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        display: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Consolas',
          'Liberation Mono',
          'monospace',
        ],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(9, 27, 46, 0.04), 0 1px 3px 0 rgba(9, 27, 46, 0.06)',
        pop: '0 12px 32px -12px rgba(9, 27, 46, 0.18), 0 4px 12px -4px rgba(9, 27, 46, 0.08)',
        inset: 'inset 0 -1px 0 0 rgba(9, 27, 46, 0.06)',
      },
      borderRadius: {
        xl2: '14px',
      },
    },
  },
  plugins: [],
};
