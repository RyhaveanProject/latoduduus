import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: '#06070d', soft: '#0b0e18', card: '#10131f' },
        gold: { 50: '#fdf8e9', 100: '#f8eac0', 300: '#edcd6b', 500: '#d9a536', 600: '#b9852a', 700: '#8f6620' },
        emerald: { 400: '#34d399', 500: '#10b981', 600: '#059669' },
        ruby: { 400: '#fb7185', 500: '#f43f5e', 600: '#e11d48' },
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        sans: ['var(--font-sans)', 'sans-serif'],
      },
      backgroundImage: {
        'radial-fade': 'radial-gradient(circle at 50% 0%, rgba(217,165,54,0.12), transparent 60%)',
        'felt': 'linear-gradient(160deg, #0b0e18 0%, #06070d 60%)',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0,0,0,0.45)',
        gold: '0 0 24px rgba(217,165,54,0.35)',
      },
      keyframes: {
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'pop': { '0%': { transform: 'scale(0.85)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        'pulse-glow': { '0%,100%': { boxShadow: '0 0 0px rgba(217,165,54,0.0)' }, '50%': { boxShadow: '0 0 20px rgba(217,165,54,0.45)' } },
        'shimmer': { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out both',
        'pop': 'pop 0.25s ease-out both',
        'pulse-glow': 'pulse-glow 2.4s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
      },
    },
  },
  plugins: [],
};
export default config;
