import type { Config } from 'tailwindcss';

/**
 * MaoBible Design Tokens
 * Source: docs/product-plan.md §6 视觉方向
 *
 * - Paper / Ink / Secondary / Moss / Cinnabar / DarkPaper
 * - Body 17–18px, line-height ~1.8
 * - Rounded 12–18px
 * - Animations 180–260ms
 * - Light + dark mode
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: '#F4F1EA',
        ink: '#22221F',
        secondary: '#77766F',
        moss: '#6F7868',
        cinnabar: '#A44A42',
        'dark-paper': '#191918',
        'dark-ink': '#EFEDE6',
        'dark-secondary': '#9B9A93',
        'dark-line': '#2A2A28',
      },
      fontFamily: {
        // System first; web fonts loaded via @import in CSS
        sans: ['"Inter"', '"Noto Sans SC"', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Source Serif 4"', '"Source Han Serif SC"', 'Georgia', 'serif'],
        // Chinese titles use a modern 宋体
        'serif-cn': [
          '"Source Han Serif SC"',
          '"Noto Serif SC"',
          'Songti SC',
          'STSong',
          'SimSun',
          'serif',
        ],
      },
      fontSize: {
        // Body default 17–18px
        body: ['17px', { lineHeight: '1.8' }],
        'body-lg': ['18px', { lineHeight: '1.8' }],
      },
      borderRadius: {
        card: '12px',
        'card-lg': '18px',
      },
      maxWidth: {
        reader: '680px', // optimal reading width
      },
      transitionDuration: {
        180: '180ms',
        220: '220ms',
        260: '260ms',
      },
    },
  },
  plugins: [],
};

export default config;
