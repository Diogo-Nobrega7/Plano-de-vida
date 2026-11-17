import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from './cx'

export function Card({ className, ...p }: HTMLAttributes<HTMLElement>) {
  return <section {...p} className={cx('card p-5 md:p-6', className)} />
}

export function CardTitulo({ titulo, sub, acao, icone }: { titulo: ReactNode; sub?: ReactNode; acao?: ReactNode; icone?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="flex items-center gap-3 min-w-0">
        {icone && <span className="grid place-items-center h-9 w-9 shrink-0 rounded-md bg-brand-soft text-brand">{icone}</span>}
        <div className="min-w-0">
          <h2 className="titulo text-[17px] leading-tight">{titulo}</h2>
          {sub && <p className="text-[13px] text-muted mt-0.5">{sub}</p>}
        </div>
      </div>
      {acao}
    </div>
  )
}
