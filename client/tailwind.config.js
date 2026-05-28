/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 2px)',
        glass: '24px',
        glassInner: '16px',
        pill: '10px',
        control: '14px',
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        dashboard: {
          text: '#1e2939',
          muted: '#4a5565',
          placeholder: '#99a1af',
          statTotal: '#155dfc',
          statActive: '#f54900',
          statCompleted: '#00a63e',
        },
      },
      backgroundImage: {
        'page-gradient':
          'linear-gradient(153.94deg, #dbeafe 0%, #faf5ff 50%, #fce7f3 100%)',
        'page-gradient-dark':
          'linear-gradient(153.94deg, #0f172a 0%, #1e1b4b 50%, #2e1065 100%)',
        'cta-gradient': 'linear-gradient(90deg, #2b7fff 0%, #ad46ff 100%)',
        'icon-tile': 'linear-gradient(135deg, #2b7fff 0%, #ad46ff 100%)',
      },
      boxShadow: {
        glass: '0 25px 50px rgba(0, 0, 0, 0.25)',
        pillActive: '0 4px 12px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
