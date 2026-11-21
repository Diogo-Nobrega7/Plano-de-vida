import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from './cx'

export function Card({ className, ...p }: HTMLAttributes<HTMLElement>) {
  return <section {...p} className={cx('card p-5', className)} />
}

export function CardTitulo({ titulo, sub, acao, icone }: { titulo: ReactNode; sub?: ReactNode; acao?: ReactNode; icone?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="flex items-center gap-2.5 min-w-0">
        {icone && <span className="grid place-items-center h-7 w-7 shrink-0 rounded-md bg-brand-soft text-brand [&_svg]:h-4 [&_svg]:w-4">{icone}</span>}
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] leading-tight">{titulo}</h2>
          {sub && <p className="text-[12.5px] text-muted mt-0.5">{sub}</p>}
        </div>
      </div>
      {acao && <div className="shrink-0 text-[13px]">{acao}</div>}
    </div>
  )
}
