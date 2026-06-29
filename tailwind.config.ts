const config = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './public/**/*.html',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#EDEBE3',
          card: '#F4F1EA',
        },
        brand: {
          dark: '#1C1915',
          secondary: '#6B6560',
          border: '#D5CFC3',
          accent: '#D5E06B',
        },
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'ui-monospace', 'monospace'],
        body: ['var(--font-body)', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
}

export default config
