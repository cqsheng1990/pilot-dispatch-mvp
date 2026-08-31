import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/pages/**/*.{js,ts,jsx,tsx,mdx}', './src/components/**/*.{js,ts,jsx,tsx,mdx}', './src/app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#16202a',
        harbor: '#0d5962',
        signal: '#d8703f',
        canvas: '#f4f7f7',
      },
      boxShadow: { quiet: '0 10px 30px rgba(22, 32, 42, 0.07)' },
    },
  },
  plugins: [],
};

export default config;
