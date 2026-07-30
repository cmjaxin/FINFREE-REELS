/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#2DAEFF',
        'primary-dark': '#1F66F5',
        'accent': '#7A33F5',
        'accent-light': '#A05BFF',
        'text-light': '#F3F5F8',
        'bg-dark': '#05070B',
        'danger': '#FF2B2B',
        'white': '#FFFFFF',
        'gray-100': '#F3F5F8',
        'gray-200': '#E5E8ED',
        'gray-300': '#D5DADF',
        'gray-400': '#A0A8B0',
        'gray-500': '#7A8691',
        'gray-600': '#556273',
        'gray-700': '#374152',
        'gray-800': '#1F2937',
        'gray-900': '#111827',
        'gray-950': '#05070B',
      },
      fontFamily: {
        'barlow': ['Barlow', 'sans-serif'],
        'mono': ['IBM Plex Mono', 'monospace'],
      },
      fontSize: {
        'page-title': ['27px', { fontWeight: '600', letterSpacing: '-0.6px' }],
        'section-title': ['14px', { fontWeight: '600' }],
        'card-title': ['15.5px', { fontWeight: '600', letterSpacing: '-0.2px' }],
        'body': ['13px', { lineHeight: '1.62' }],
        'body-lg': ['14.5px', { lineHeight: '1.62' }],
      },
      animation: {
        'cd-fade': 'fade 120ms ease-out',
        'cd-rise': 'rise 160ms ease-out',
        'cd-slide': 'slide 180ms ease-out',
        'cd-pulse': 'pulse 1.1s ease-in-out infinite',
        'cd-spin': 'spin 700ms linear infinite',
      },
      keyframes: {
        fade: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        rise: {
          '0%': { opacity: '0', transform: 'translateY(9px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slide: {
          '0%': { opacity: '0', transform: 'translateX(28px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      spacing: {
        'chrome': '52px',
        'sidebar': '246px',
      },
    },
  },
  plugins: [],
}
