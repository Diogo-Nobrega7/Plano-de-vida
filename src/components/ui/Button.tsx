import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from './cx'

type Variante = 'primario' | 'secundario' | 'fantasma' | 'perigo' | 'claro'
const estilos: Record<Variante, string> = {
  primario: 'bg-brand text-brand-ink hover:brightness-110 shadow-sm',
  secundario: 'bg-surface text-ink border border-line hover:bg-sunken',
  fantasma: 'text-muted hover:text-ink hover:bg-sunken',
  perigo: 'text-bad hover:bg-bad-soft',
  claro: 'bg-white text-[#1D4ED8] hover:bg-white/90 shadow-sm',
}

export function Button({ variante = 'primario', icone, tamanho = 'md', className, children, ...p }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; icone?: ReactNode; tamanho?: 'sm' | 'md' }) {
  return (
    <button type="button" {...p}
      className={cx('inline-flex items-center justify-center gap-2 rounded-md font-bold transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
        tamanho === 'sm' ? 'h-9 px-3 text-[13px]' : 'h-11 px-4 text-sm', estilos[variante], className)}>
      {icone}{children}
    </button>
  )
}

export function IconButton({ rotulo, className, children, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { rotulo: string }) {
  return (
    <button type="button" aria-label={rotulo} title={rotulo} {...p}
      className={cx('inline-flex h-9 w-9 items-center justify-center rounded-md text-muted hover:text-ink hover:bg-sunken transition-colors', className)}>
      {children}
    </button>
  )
}
