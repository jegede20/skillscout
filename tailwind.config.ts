import type { Config } from 'tailwindcss';

// Theme colours are CSS variables (space-separated RGB) so light/dark switch with one class.
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: v('bg'),
        surface: v('surface'),
        fg: v('fg'),
        muted: v('muted'),
        line: v('line'),
        accent: v('accent-text'),
        orange: '#FF6B2B',
        cyan: '#00D4FF',
        yellow: '#FFD600',
        beginner: '#22C55E',
        intermediate: '#F59E0B',
        advanced: '#EF4444',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      maxWidth: { content: '1280px' },
      keyframes: {
        bounceDot: {
          '0%, 80%, 100%': { transform: 'translateY(0)', opacity: '0.4' },
          '40%': { transform: 'translateY(-6px)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        bounceDot: 'bounceDot 1.2s infinite ease-in-out',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
