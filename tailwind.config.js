/** Cores vêm de variáveis CSS (src/index.css): tema claro/escuro sem duplicar classes. */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`
export default {
  darkMode: ['variant', [
    '@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) & }',
    ':root[data-theme="dark"] &',
  ]],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: v('bg'), surface: v('surface'), raised: v('raised'), sunken: v('sunken'), line: v('line'), 'line-strong': v('line-strong'),
        ink: v('ink'), muted: v('muted'), faint: v('faint'),
        brand: v('brand'), 'brand-2': v('brand-2'), 'brand-soft': v('brand-soft'), 'brand-ink': v('brand-ink'),
        night: v('night'), fire: v('fire'), 'fire-soft': v('fire-soft'),
        ok: v('ok'), 'ok-soft': v('ok-soft'), warn: v('warn'), bad: v('bad'), 'bad-soft': v('bad-soft'),
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Literata', 'Georgia', 'serif'],
      },
      borderRadius: { sm: '6px', md: '10px', lg: '12px', xl: '16px', '2xl': '22px' },
      boxShadow: { sm: 'var(--shadow-sm)', md: 'var(--shadow-md)', lg: 'var(--shadow-lg)' },
      transitionTimingFunction: { out: 'cubic-bezier(.2,.7,.2,1)' },
    },
  },
  plugins: [],
}
