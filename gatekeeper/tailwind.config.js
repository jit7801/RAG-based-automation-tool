/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0B0D10',
        sidebar: '#0F1115',
        surface: '#14171C',
        'surface-raised': '#191D23',
        'surface-hover': '#1E232B',
        'surface-active': '#242A34',

        border: 'rgba(255, 255, 255, 0.08)',
        'border-subtle': 'rgba(255, 255, 255, 0.04)',
        'border-strong': 'rgba(255, 255, 255, 0.14)',

        primary: '#F5F7FA',
        secondary: '#A7AFBC',
        muted: '#7D8795',

        brand: {
          DEFAULT: '#3B82F6',
          hover: '#2563EB',
          subtle: 'rgba(59, 130, 246, 0.12)',
        },

        status: {
          pass: '#10B981',
          'pass-subtle': 'rgba(16, 185, 129, 0.12)',
          'pass-border': 'rgba(16, 185, 129, 0.25)',

          warn: '#F59E0B',
          'warn-subtle': 'rgba(245, 158, 11, 0.12)',
          'warn-border': 'rgba(245, 158, 11, 0.25)',

          block: '#EF4444',
          'block-subtle': 'rgba(239, 68, 68, 0.12)',
          'block-border': 'rgba(239, 68, 68, 0.25)',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      fontSize: {
        'page-title': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'section-heading': ['17px', { lineHeight: '24px', fontWeight: '600' }],
        'card-title': ['14px', { lineHeight: '20px', fontWeight: '600' }],
        body: ['14px', { lineHeight: '22px', fontWeight: '400' }],
        secondary: ['13px', { lineHeight: '20px', fontWeight: '400' }],
        metadata: ['12px', { lineHeight: '16px', fontWeight: '400' }],
      },
    },
  },
  plugins: [],
};
