/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './App.tsx',
    './index.tsx',
    './components/**/*.{js,ts,jsx,tsx}',
    './core/**/*.{js,ts,jsx,tsx}',
    './features/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
    './platform/**/*.{js,ts,jsx,tsx}',
    './stores/**/*.{js,ts,jsx,tsx}',
    './workspace/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        ide: {
          bg: 'var(--ide-bg)',
          sidebar: 'var(--ide-sidebar)',
          activity: 'var(--ide-activity)',
          panel: 'var(--ide-panel)',
          accent: 'var(--ide-accent)',
          secondary: 'var(--ide-secondary)',
          text: 'var(--ide-text)',
          muted: 'var(--ide-muted)',
          border: 'var(--ide-border)',
          'border-strong': 'var(--ide-border-strong)',
          input: 'var(--ide-input)',
          overlay: 'rgba(0,0,0,0.6)',
          hover: 'var(--ide-hover)',
          card: 'var(--ide-card)'
        }
      },
      borderRadius: {
        'capy-sm': '4px',
        'capy-md': '8px',
        'capy-lg': '12px'
      },
      animation: {
        'pulse-slow': 'pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      }
    }
  },
  plugins: []
};
