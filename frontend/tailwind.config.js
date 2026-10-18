const { fontFamily } = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', ...fontFamily.sans],
      },
      colors: {
        'notion-gray': {
          50: '#f7f6f3',
          100: '#edece9',
          200: '#e3e2e0',
          300: '#d8d7d3',
          400: '#b7b5b1',
          500: '#9a9893',
          600: '#7d7b76',
          700: '#605e5a',
          800: '#4a4845',
          900: '#3a3836',
        },
        'notion-blue': {
          50: '#e6f0f8',
          100: '#cce1f2',
          200: '#b3d1eb',
          300: '#99c2e5',
          400: '#66a3d4',
          500: '#3384c4',
          600: '#296a9d',
          700: '#205076',
          800: '#16364e',
          900: '#0d1c27',
        },
        'notion-purple': {
          50: '#f0e8f8',
          // ... (add other shades if needed)
          100: '#e1d2f0',
          600: '#8a4baf',
        },
        'notion-green': {
          500: '#3e8e41'
        },
        'notion-red': {
          50: '#fdecec',
          100: '#fbdada',
          500: '#e03e3e',
        },
        'notion-yellow': {
          50: '#fff9e6',
          100: '#fff2cc',
          500: '#f7b500',
        },
      },
      // Add prose styles for notion-like markdown
      typography: (theme) => ({
        notion: {
          css: {
            '--tw-prose-body': theme('colors.notion-gray[800]'),
            '--tw-prose-headings': theme('colors.notion-gray[900]'),
            '--tw-prose-lead': theme('colors.notion-gray[700]'),
            '--tw-prose-links': theme('colors.notion-blue[500]'),
            '--tw-prose-bold': theme('colors.notion-gray[900]'),
            '--tw-prose-counters': theme('colors.notion-gray[600]'),
            '--tw-prose-bullets': theme('colors.notion-gray[400]'),
            '--tw-prose-hr': theme('colors.notion-gray[200]'),
            '--tw-prose-quotes': theme('colors.notion-gray[900]'),
            '--tw-prose-quote-borders': theme('colors.notion-gray[200]'),
            '--tw-prose-captions': theme('colors.notion-gray[700]'),
            '--tw-prose-code': theme('colors.notion-purple[600]'),
            '--tw-prose-pre-code': theme('colors.notion-gray[100]'),
            '--tw-prose-pre-bg': theme('colors.notion-gray[800]'),
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
} 