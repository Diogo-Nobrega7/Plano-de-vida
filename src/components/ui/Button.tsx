import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from './cx'

type Variante = 'primario' | 'secundario' | 'fantasma' | 'perigo' | 'claro'
const estilos: Record<Variante, string> = {
  primario: 'bg-brand text-brand-ink shadow-[0_1px_0_rgb(255_255_255/.18)_inset,0_1px_2px_rgb(0_0_0/.2)] hover:brightness-110 hover:shadow-[var(--brilho)]',
  secundario: 'bg-raised text-ink border border-line hover:border-line-strong hover:bg-sunken shadow-sm',
  fantasma: 'text-muted hover:text-ink hover:bg-sunken',
  perigo: 'text-bad hover:bg-bad-soft',
  claro: 'bg-white text-[#0B1020] hover:bg-white/90 shadow-sm',
}

export function Button({ variante = 'primario', icone, tamanho = 'md', className, children, ...p }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; icone?: ReactNode; tamanho?: 'sm' | 'md' }) {
  return (
    <button type="button" {...p}
      className={cx('inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-all duration-150 select-none active:scale-[.98] disabled:opacity-50 disabled:pointer-events-none [&_svg]:shrink-0',
        tamanho === 'sm' ? 'h-8 px-3 text-[13px]' : 'h-10 px-4 text-sm', estilos[variante], className)}>
      {icone}{children}
    </button>
  )
}

export function IconButton({ rotulo, className, children, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { rotulo: string }) {
  return (
    <button type="button" aria-label={rotulo} title={rotulo} {...p}
      className={cx('inline-flex h-8 w-8 items-center justify-center rounded-md text-muted hover:text-ink hover:bg-sunken transition-colors', className)}>
      {children}
    </button>
  )
}
