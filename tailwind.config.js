/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        ui: ['var(--theme-font-ui)', 'sans-serif'],
        logs: ['var(--theme-font-logs)', 'monospace'],
        poppins: ['var(--font-poppins)', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
        inter: ['var(--font-inter)', 'sans-serif'],
        // Landing page only — Satoshi (headings) / Geist (UI labels).
        // Named `satoshi` rather than overriding the default `sans` key,
        // since `font-sans` is already relied on elsewhere (e.g. Control.tsx).
        satoshi: ['var(--font-satoshi)', 'sans-serif'],
        geist: ['var(--font-geist)', 'sans-serif'],
        'share-tech': ['var(--font-share-tech)', 'monospace'],
        'roboto-flex': ['var(--font-roboto-flex)', 'sans-serif'],
        'space-grotesk': ['var(--font-space-grotesk)', 'sans-serif'],
        'space-mono': ['var(--font-space-mono)', 'monospace'],
        'plus-jakarta': ['var(--font-plus-jakarta)', 'sans-serif'],
        'ibm-plex': ['var(--font-ibm-plex)', 'monospace'],
        'dm-sans': ['var(--font-dm-sans)', 'sans-serif'],
        'geist-mono': ['var(--font-geist-mono)', 'monospace'],
        rajdhani: ['var(--font-rajdhani)', 'sans-serif'],
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
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        'theme-accent': 'hsl(var(--theme-accent))',
        'theme-ai': 'hsl(var(--theme-ai))',
        'theme-alert': 'hsl(var(--theme-alert))',
        // Landing page only — see the "Landing page only" block in globals.css.
        bg: '#0a0a0a',
        panel: '#0c0c0c',
        blue: {
          DEFAULT: '#007dfc',
          light: '#60a5fa',
        },
        btn: '#282828',
        'btn-hover': '#343434',
        't-primary': '#f5f5f5',
        't-bright': '#ffffff',
        't-muted': '#9a9a9a',
        't-dim': '#707070',
      },
      maxWidth: {
        // Landing page only — mirrors the `.wrap` container / `--maxw` var.
        wrap: 'var(--maxw, 80vw)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'active-glow': {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.6, transform: 'scale(1.02)' },
        },
        // 'border-spin': {
        //   '100%': { transform: 'rotate(360deg)' },
        // },
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
        fadeIn: {
          from: { opacity: 0, transform: 'translateY(20px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        slideIn: {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        scaleIn: {
          from: { opacity: 0, transform: 'scale(0.9)' },
          to: { opacity: 1, transform: 'scale(1)' },
        },
      },
      animation: {
        'active-glow': 'active-glow 2s ease-in-out infinite',
        // 'border-spin': 'border-spin 3s linear infinite',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        fadeIn: 'fadeIn 0.6s ease-out forwards',
        slideIn: 'slideIn 0.3s ease-out',
        scaleIn: 'scaleIn 0.3s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
