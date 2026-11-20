/** SISU: nota ponderada pelos pesos de cada curso e distância até a nota de corte. */
import type { Pesos } from './sisuTipos'
export type { Pesos } from './sisuTipos'

export const PESOS_IGUAIS: Pesos = { lc: 1, ch: 1, cn: 1, mt: 1, redacao: 1 }

/** Média ponderada: Σ(nota × peso) ÷ Σ(pesos). Devolve null se faltar alguma nota com peso. */
export function notaSisu(notas: Partial<Record<keyof Pesos, number | null>>, pesos: Pesos): number | null {
  let soma = 0, somaPesos = 0
  for (const k of Object.keys(pesos) as (keyof Pesos)[]) {
    if (!pesos[k]) continue
    const n = notas[k]
    if (n == null || Number.isNaN(n)) return null
    soma += n * pesos[k]; somaPesos += pesos[k]
  }
  return somaPesos ? soma / somaPesos : null
}

export type Faixa = 'dentro' | 'perto' | 'longe' | 'sem-dados'

/** dentro: já passa o corte · perto: até 30 pontos abaixo · longe: mais que isso. */
export function faixa(nota: number | null, corte: number | null): Faixa {
  if (nota == null || corte == null) return 'sem-dados'
  const d = nota - corte
  return d >= 0 ? 'dentro' : d >= -30 ? 'perto' : 'longe'
}
