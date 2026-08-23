/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: 'var(--paper)',
        raised: 'var(--paper-raised)',
        sunk: 'var(--paper-sunk)',
        ink: 'var(--ink)',
        'ink-soft': 'var(--ink-soft)',
        'ink-faint': 'var(--ink-faint)',
        rule: 'var(--rule)',
        accent: 'var(--accent)',
        'accent-soft': 'var(--accent-soft)',
        pass: 'var(--pass)',
        warn: 'var(--warn)',
        block: 'var(--block)',
        'pass-bg': 'var(--pass-bg)',
        'warn-bg': 'var(--warn-bg)',
        'block-bg': 'var(--block-bg)',
        cite: 'var(--cite)',
      },
      fontFamily: {
        serif: ['Iowan Old Style', 'Palatino Linotype', 'Georgia', 'Cambria', 'serif'],
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Inter', 'Helvetica Neue', 'sans-serif'],
        mono: ['SFMono-Regular', 'Menlo', 'Consolas', 'Liberation Mono', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.04em' }],
      },
      boxShadow: {
        card: '0 1px 2px rgba(20, 22, 26, 0.04), 0 4px 12px rgba(20, 22, 26, 0.04)',
        lift: '0 2px 4px rgba(20, 22, 26, 0.05), 0 12px 28px rgba(20, 22, 26, 0.07)',
      },
      transitionTimingFunction: {
        editorial: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-rule': {
          '0%, 100%': { opacity: '0.35' },
          '50%': { opacity: '1' },
        },
        'draw-line': {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.32s cubic-bezier(0.22, 0.61, 0.36, 1) both',
        'pulse-rule': 'pulse-rule 1.4s ease-in-out infinite',
        'draw-line': 'draw-line 0.5s cubic-bezier(0.22, 0.61, 0.36, 1) both',
      },
    },
  },
  plugins: [],
};
