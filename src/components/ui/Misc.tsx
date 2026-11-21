import { Children, type ReactNode } from 'react'
import { cx } from './cx'

export function Progress({ valor, className, cor = 'bg-brand', altura = 'h-1.5' }: { valor: number; className?: string; cor?: string; altura?: string }) {
  const v = Math.max(0, Math.min(1, valor || 0))
  return (
    <div className={cx('w-full rounded-full bg-sunken ring-1 ring-inset ring-line/60 overflow-hidden', altura, className)} role="progressbar" aria-valuenow={Math.round(v * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cx('h-full rounded-full transition-[width] duration-700 ease-out', cor)} style={{ width: `${v * 100}%` }} />
    </div>
  )
}

export function Stat({ rotulo, valor, sub, tom }: { rotulo: ReactNode; valor: ReactNode; sub?: ReactNode; tom?: 'ok' | 'bad' | 'muted' }) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <span className="text-[12.5px] font-medium text-muted">{rotulo}</span>
      <span className="titulo text-[24px] leading-none num">{valor}</span>
      {sub && <span className={cx('text-[12.5px] font-medium', tom === 'ok' ? 'text-ok' : tom === 'bad' ? 'text-bad' : 'text-faint')}>{sub}</span>}
    </div>
  )
}

/** Vários indicadores numa faixa só, com divisórias (em vez de um cartão por número). */
export function StatRow({ children }: { children: ReactNode }) {
  const itens = Children.toArray(children)
  return (
    <section className="card grid grid-cols-2 lg:grid-cols-4 overflow-hidden">
      {itens.map((c, i) => (
        <div key={i} className={cx('p-5 border-line', i % 2 === 0 && 'border-r', i < 2 && 'border-b lg:border-b-0', i < itens.length - 1 ? 'lg:border-r' : 'lg:border-r-0')}>{c}</div>
      ))}
    </section>
  )
}

export function Vazio({ icone, titulo, texto, acao }: { icone?: ReactNode; titulo: string; texto?: string; acao?: ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center gap-3 py-12 px-4">
      {icone && <span className="grid place-items-center h-11 w-11 rounded-xl bg-brand-soft text-brand ring-1 ring-inset ring-brand/20">{icone}</span>}
      <div>
        <p className="font-semibold">{titulo}</p>
        {texto && <p className="text-sm text-muted mt-1 max-w-sm">{texto}</p>}
      </div>
      {acao}
    </div>
  )
}

export function Segmented<T extends string>({ opcoes, valor, onChange, rotulo }: { opcoes: { valor: T; rotulo: ReactNode }[]; valor: T; onChange: (v: T) => void; rotulo: string }) {
  return (
    <div role="group" aria-label={rotulo} className="inline-flex flex-wrap gap-0.5 rounded-lg border border-line bg-sunken p-0.5">
      {opcoes.map((o) => (
        <button key={o.valor} type="button" onClick={() => onChange(o.valor)} aria-pressed={valor === o.valor}
          className={cx('h-8 rounded-md px-3 text-[13px] font-medium transition-all duration-150', valor === o.valor ? 'bg-surface text-ink shadow-sm ring-1 ring-line' : 'text-muted hover:text-ink')}>
          {o.rotulo}
        </button>
      ))}
    </div>
  )
}

/** Cabeçalho padrão de toda tela: etiqueta da seção, título, descrição e ações. */
export function Cabecalho({ titulo, sub, acao, etiqueta }: { titulo: ReactNode; sub?: ReactNode; acao?: ReactNode; etiqueta?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {etiqueta && <p className="rotulo mb-1.5 !text-brand">{etiqueta}</p>}
        <h1 className="titulo text-[26px] md:text-[28px] leading-tight">{titulo}</h1>
        {sub && <p className="text-muted mt-1 max-w-2xl text-[14px]">{sub}</p>}
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
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Carregando">
      <div className="h-8 w-56 rounded-md bg-sunken animate-pulse" />
      <div className="grid gap-4 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-24 rounded-xl bg-sunken animate-pulse" />)}</div>
      <div className="grid gap-4 md:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="h-52 rounded-xl bg-sunken animate-pulse" />)}</div>
    </div>
  )
}

/** Cartão de indicador (KPI): rótulo, valor grande, detalhe e ícone opcional. */
export function Kpi({ rotulo, valor, sub, icone, tom, href, children }: { rotulo: ReactNode; valor: ReactNode; sub?: ReactNode; icone?: ReactNode; tom?: 'ok' | 'bad' | 'fire' | 'brand'; href?: string; children?: ReactNode }) {
  const corIcone = { ok: 'bg-ok-soft text-ok', bad: 'bg-bad-soft text-bad', fire: 'bg-fire-soft text-fire', brand: 'bg-brand-soft text-brand' }[tom ?? 'brand']
  const corpo = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12.5px] font-medium text-muted">{rotulo}</span>
        {icone && <span className={cx('grid h-7 w-7 place-items-center rounded-md [&_svg]:h-[15px] [&_svg]:w-[15px]', corIcone)}>{icone}</span>}
      </div>
      <div className="titulo text-[26px] leading-none num">{valor}</div>
      {sub && <div className="text-[12.5px] text-faint">{sub}</div>}
      {children}
    </>
  )
  const classe = 'card p-4 md:p-5 flex flex-col gap-2.5 min-w-0'
  return href ? <a href={href} className={classe}>{corpo}</a> : <section className={classe}>{corpo}</section>
}
