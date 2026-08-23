/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#090a0f',
        surface: '#0f1117',
        'surface-raised': '#161922',
        'surface-hover': '#1c202c',
        'surface-active': '#222736',
        
        border: '#1f2430',
        'border-subtle': '#181c26',
        'border-focus': '#3b82f6',

        foreground: '#f1f5f9',
        'foreground-muted': '#94a3b8',
        'foreground-faint': '#64748b',

        brand: {
          DEFAULT: '#3b82f6',
          hover: '#2563eb',
          soft: '#1e293b',
          glow: 'rgba(59, 130, 246, 0.15)',
        },

        status: {
          pass: '#10b981',
          'pass-bg': 'rgba(16, 185, 129, 0.1)',
          'pass-border': 'rgba(16, 185, 129, 0.25)',
          
          warn: '#f59e0b',
          'warn-bg': 'rgba(245, 158, 11, 0.1)',
          'warn-border': 'rgba(245, 158, 11, 0.25)',
          
          block: '#ef4444',
          'block-bg': 'rgba(239, 68, 68, 0.1)',
          'block-border': 'rgba(239, 68, 68, 0.25)',

          info: '#06b6d4',
          'info-bg': 'rgba(6, 182, 212, 0.1)',
          'info-border': 'rgba(6, 182, 212, 0.25)',
        },

        // Backward compatibility tokens
        paper: '#090a0f',
        raised: '#0f1117',
        sunk: '#161922',
        ink: '#f1f5f9',
        'ink-soft': '#94a3b8',
        'ink-faint': '#64748b',
        rule: '#1f2430',
        accent: '#3b82f6',
        'accent-soft': '#1e293b',
        pass: '#10b981',
        warn: '#f59e0b',
        block: '#ef4444',
        'pass-bg': 'rgba(16, 185, 129, 0.1)',
        'warn-bg': 'rgba(245, 158, 11, 0.1)',
        'block-bg': 'rgba(239, 68, 68, 0.1)',
        cite: 'rgba(245, 158, 11, 0.25)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
        serif: ['Inter', 'serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.03em' }],
        '3xs': ['0.625rem', { lineHeight: '0.875rem', letterSpacing: '0.04em' }],
      },
      boxShadow: {
        panel: '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px -1px rgba(0, 0, 0, 0.3)',
        elevated: '0 4px 16px -2px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3)',
        lift: '0 10px 30px -4px rgba(0, 0, 0, 0.6), 0 4px 8px -2px rgba(0, 0, 0, 0.4)',
        glow: '0 0 15px -3px rgba(59, 130, 246, 0.3)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
};
