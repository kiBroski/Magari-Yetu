import type { Config } from 'tailwindcss'

// Design direction: Magariyetu's visual anchor is the paperwork every
// Kenyan car buyer already knows — the logbook, the KRA duty assessment,
// the customs clearance stamp — rendered clean rather than bureaucratic.
// Deep customs-ledger navy carries the UI; a mustard clearance-stamp amber
// marks anything actionable (CTAs, featured badges); a stamped-ink red is
// reserved only for "sold" / urgent states. This is deliberately not the
// cream+terracotta+serif or near-black+acid-green combinations that read as
// templated AI defaults.

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#10233F', // customs-ledger navy — primary UI color
          50: '#EEF1F6',
          100: '#D4DBE7',
          400: '#3A527A',
          700: '#152B4D',
          900: '#0B1830',
        },
        paper: {
          DEFAULT: '#F6F4EE', // logbook paper — page background
          dim: '#EDEAE0',
        },
        stamp: {
          DEFAULT: '#C98A2B', // clearance-stamp amber — CTAs, featured badges
          light: '#E3B368',
          dark: '#9C6A1D',
        },
        alert: {
          DEFAULT: '#A8402F', // reserved: sold / urgent states only
        },
        matatu: {
          DEFAULT: '#2F6B4F', // verified / success states
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'], // condensed grotesque — Archivo/Barlow Condensed
        body: ['var(--font-body)', 'sans-serif'], // Inter/IBM Plex Sans
        mono: ['var(--font-mono)', 'monospace'], // IBM Plex Mono — VIN, price, spec sheets
      },
      borderRadius: {
        sm: '2px',
        DEFAULT: '4px',
        lg: '8px',
      },
    },
  },
  plugins: [],
} satisfies Config
