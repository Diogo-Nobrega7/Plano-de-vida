/** Formatação no jeito brasileiro. */

export function brl(valor: number, casas = 0): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: casas, maximumFractionDigits: casas })
}

/** 15000000 -> "R$ 15 mi"; 820000 -> "R$ 820 mil" */
export function brlCurto(valor: number): string {
  const a = Math.abs(valor)
  if (a >= 1_000_000) return `R$ ${(valor / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`
  if (a >= 1_000) return `R$ ${Math.round(valor / 1_000).toLocaleString('pt-BR')} mil`
  return brl(valor)
}

/** 0.1375 -> "13,75%" */
export function pct(taxa: number, casas = 2): string {
  return `${(taxa * 100).toLocaleString('pt-BR', { maximumFractionDigits: casas })}%`
}

export function numero(v: number, casas = 0): string {
  return v.toLocaleString('pt-BR', { maximumFractionDigits: casas })
}

/** "2026-11-17" -> "17/11/2026" */
export function dataBR(iso?: string | null): string {
  if (!iso) return '—'
  const [a, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${a}`
}

/** "2026-11-17" -> "17 nov" */
export function dataCurta(iso: string): string {
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  const [, m, d] = iso.slice(0, 10).split('-')
  return `${Number(d)} ${meses[Number(m) - 1]}`
}

export function minutos(min: number): string {
  const h = Math.floor(min / 60), m = Math.round(min % 60)
  if (!h) return `${m}min`
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`
}
