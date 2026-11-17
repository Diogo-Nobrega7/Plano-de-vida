import type { ReactNode } from 'react'
import { cx } from './cx'

export function Progress({ valor, className, cor = 'bg-brand', altura = 'h-2' }: { valor: number; className?: string; cor?: string; altura?: string }) {
  const v = Math.max(0, Math.min(1, valor || 0))
  return (
    <div className={cx('w-full rounded-full bg-sunken overflow-hidden', altura, className)} role="progressbar" aria-valuenow={Math.round(v * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cx('h-full rounded-full transition-[width] duration-500 ease-out', cor)} style={{ width: `${v * 100}%` }} />
    </div>
  )
}

export function Stat({ rotulo, valor, sub, tom }: { rotulo: ReactNode; valor: ReactNode; sub?: ReactNode; tom?: 'ok' | 'bad' | 'muted' }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="text-[13px] font-bold text-muted">{rotulo}</span>
      <span className="titulo text-[26px] leading-none num">{valor}</span>
      {sub && <span className={cx('text-[13px] font-semibold', tom === 'ok' ? 'text-ok' : tom === 'bad' ? 'text-bad' : 'text-muted')}>{sub}</span>}
    </div>
  )
}

/** Vários números numa faixa só, com divisórias (em vez de um cartão por número). */
export function StatRow({ children }: { children: ReactNode }) {
  return <section className="card grid grid-cols-2 lg:grid-cols-4 [&>*]:p-5 [&>*]:border-line [&>*:nth-child(odd)]:border-r lg:[&>*:not(:last-child)]:border-r [&>*:nth-child(-n+2)]:border-b lg:[&>*]:!border-b-0">{children}</section>
}

export function Vazio({ icone, titulo, texto, acao }: { icone?: ReactNode; titulo: string; texto?: string; acao?: ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center gap-3 py-10 px-4">
      {icone && <span className="grid place-items-center h-12 w-12 rounded-lg bg-brand-soft text-brand">{icone}</span>}
      <div>
        <p className="font-bold">{titulo}</p>
        {texto && <p className="text-sm text-muted mt-1 max-w-sm">{texto}</p>}
      </div>
      {acao}
    </div>
  )
}

export function Segmented<T extends string>({ opcoes, valor, onChange, rotulo }: { opcoes: { valor: T; rotulo: ReactNode }[]; valor: T; onChange: (v: T) => void; rotulo: string }) {
  return (
    <div role="group" aria-label={rotulo} className="inline-flex flex-wrap gap-1 rounded-md bg-sunken p-1">
      {opcoes.map((o) => (
        <button key={o.valor} type="button" onClick={() => onChange(o.valor)} aria-pressed={valor === o.valor}
          className={cx('h-9 rounded-[9px] px-3.5 text-[13px] font-bold transition-all', valor === o.valor ? 'bg-surface text-brand shadow-sm' : 'text-muted hover:text-ink')}>
          {o.rotulo}
        </button>
      ))}
    </div>
  )
}

export function Cabecalho({ titulo, sub, acao, etiqueta }: { titulo: ReactNode; sub?: ReactNode; acao?: ReactNode; etiqueta?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {etiqueta && <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-brand mb-1.5">{etiqueta}</p>}
        <h1 className="titulo text-[28px] md:text-[32px] leading-tight">{titulo}</h1>
        {sub && <p className="text-muted mt-1.5 max-w-2xl">{sub}</p>}
      </div>
      {acao && <div className="flex flex-wrap gap-2">{acao}</div>}
    </div>
  )
}

/** Anel de progresso (donut). */
export function Anel({ valor, tamanho = 120, espessura = 12, cor = 'rgb(var(--brand))', fundo = 'rgb(var(--sunken))', children }: { valor: number; tamanho?: number; espessura?: number; cor?: string; fundo?: string; children?: ReactNode }) {
  const r = (tamanho - espessura) / 2, c = 2 * Math.PI * r, v = Math.max(0, Math.min(1, valor || 0))
  return (
    <div className="relative shrink-0" style={{ width: tamanho, height: tamanho }}>
      <svg width={tamanho} height={tamanho} className="-rotate-90" aria-hidden="true">
        <circle cx={tamanho / 2} cy={tamanho / 2} r={r} fill="none" stroke={fundo} strokeWidth={espessura} />
        <circle cx={tamanho / 2} cy={tamanho / 2} r={r} fill="none" stroke={cor} strokeWidth={espessura} strokeLinecap="round"
          strokeDasharray={`${c * v} ${c}`} className="transition-[stroke-dasharray] duration-700 ease-out" />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  )
}

export function Carregando() {
  return (
    <div className="grid gap-4 md:grid-cols-3 animate-pulse">
      {[0, 1, 2].map((i) => <div key={i} className="h-40 rounded-xl bg-sunken" />)}
    </div>
  )
}
