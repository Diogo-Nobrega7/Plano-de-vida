/** Juros compostos, inflação, meta de liberdade e simulação por fases da vida.
 *  Convenção: valores REAIS (reais de hoje) e taxa de rendimento acima da inflação. */

export function taxaMensal(taxaAnual: number): number {
  return Math.pow(1 + taxaAnual, 1 / 12) - 1
}

/** Saldo após `meses`, com aporte no fim de cada mês. */
export function valorFuturo(inicial: number, aporteMensal: number, taxaAnual: number, meses: number): number {
  const i = taxaMensal(taxaAnual)
  let s = inicial
  for (let k = 0; k < meses; k++) s = s * (1 + i) + aporteMensal
  return s
}

export const realParaNominal = (v: number, inflacao: number, anos: number) => v * Math.pow(1 + inflacao, anos)
export const nominalParaReal = (v: number, inflacao: number, anos: number) => v / Math.pow(1 + inflacao, anos)

/** Patrimônio que paga a vida: renda mensal × 12 ÷ taxa de saque. */
export function patrimonioNecessario(rendaMensal: number, taxaSaque = 0.04): number {
  if (taxaSaque <= 0) throw new Error('A taxa de saque precisa ser maior que zero.')
  return (rendaMensal * 12) / taxaSaque
}

export interface Fase {
  nome: string
  inicio: number // idade (inclusive)
  fim: number // idade (exclusive)
  rendaMin: number
  rendaMax: number
  aporte: number // aporte mensal
}

/** Aporte em vigor numa idade; depois da última fase continua valendo o último. */
export function aporteNaIdade(fases: Fase[], idade: number): number {
  const ord = [...fases].sort((a, b) => a.inicio - b.inicio)
  const f = ord.find((x) => idade >= x.inicio && idade < x.fim)
  if (f) return f.aporte
  const ultima = ord[ord.length - 1]
  return ultima && idade >= ultima.fim ? ultima.aporte : 0
}

/** Simula mês a mês; devolve um ponto por ano: [idade, patrimônio]. */
export function simularPatrimonio(fases: Fase[], taxaReal: number, idadeAtual: number, inicial = 0, idadeFinal = 70): [number, number][] {
  const i = taxaMensal(taxaReal)
  let s = inicial
  const pts: [number, number][] = [[idadeAtual, s]]
  const total = Math.round((idadeFinal - idadeAtual) * 12)
  for (let m = 1; m <= total; m++) {
    const idade = idadeAtual + (m - 1) / 12
    s = s * (1 + i) + aporteNaIdade(fases, idade)
    if (m % 12 === 0) pts.push([Math.round((idadeAtual + m / 12) * 100) / 100, s])
  }
  return pts
}

export function idadeQueAtinge(pts: [number, number][], meta: number): number | null {
  const p = pts.find(([, v]) => v >= meta)
  return p ? p[0] : null
}
