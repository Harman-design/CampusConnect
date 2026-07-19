/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Premium UI Redesign colors
        'primary-bg': '#0B1220',
        'secondary-surface': '#111827',
        'card-bg': '#1E293B',
        'brand-primary': '#4F8CFF',
        'brand-secondary': '#7C3AED',
        'brand-success': '#22C55E',
        'brand-warning': '#F59E0B',
        'brand-danger': '#EF4444',
        'text-main': '#F8FAFC',
        'text-muted': '#94A3B8',
        brand: {
          50: 'rgba(79, 140, 255, 0.08)',
          100: '#101827',
          200: 'rgba(255,255,255,0.08)',
          300: '#4F8CFF',
          400: '#4F8CFF',
          500: '#4F8CFF',
          600: '#4F8CFF',
          700: '#7B61FF',
          800: '#7B61FF',
          900: '#7B61FF',
        },
        slate: {
          50: '#070B14',
          100: '#101827',
          200: 'rgba(255,255,255,0.08)',
          300: '#64748B',
          400: '#64748B',
          500: '#94A3B8',
          600: '#94A3B8',
          700: '#E2E8F0',
          800: '#F8FAFC',
          900: '#F8FAFC',
        },
        gray: {
          50: '#070B14',
          100: '#101827',
          200: 'rgba(255,255,255,0.08)',
          300: '#64748B',
          400: '#64748B',
          500: '#94A3B8',
          600: '#94A3B8',
          700: '#E2E8F0',
          800: '#F8FAFC',
          900: '#F8FAFC',
        },
        zinc: {
          50: '#070B14',
          100: '#101827',
          200: 'rgba(255,255,255,0.08)',
          300: '#64748B',
          400: '#64748B',
          500: '#94A3B8',
          600: '#94A3B8',
          700: '#E2E8F0',
          800: '#F8FAFC',
          900: '#F8FAFC',
        },
        blue: {
          50: 'rgba(79, 140, 255, 0.08)',
          600: '#4F8CFF',
          700: '#7B61FF',
        },
        indigo: {
          50: 'rgba(79, 140, 255, 0.08)',
          600: '#4F8CFF',
          700: '#7B61FF',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 8px 30px rgba(0, 0, 0, 0.4)',
        'premium-hover': '0 12px 40px rgba(0, 0, 0, 0.6)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
};
