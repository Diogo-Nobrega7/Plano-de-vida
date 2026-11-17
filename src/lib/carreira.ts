import { diasEntre, hojeISO } from './datas'

export interface Criterio { nome: string; peso: number; descricao: string }

/** Média ponderada das notas (1 a 5). Critério com peso 0 é ignorado. */
export function pontuacao(notas: Record<string, number>, criterios: Criterio[]): number {
  const usados = criterios.filter((c) => c.nome in notas && c.peso > 0)
  const soma = usados.reduce((s, c) => s + c.peso, 0)
  return soma ? usados.reduce((s, c) => s + notas[c.nome] * c.peso, 0) / soma : 0
}

export type Situacao = 'concluida' | 'atrasada' | 'em-breve' | 'no-prazo' | 'sem-prazo'

export function situacaoMeta(prazo: string | null | undefined, status: string, hoje = hojeISO()): Situacao {
  if (status === 'concluída') return 'concluida'
  if (!prazo) return 'sem-prazo'
  const d = diasEntre(hoje, prazo)
  return d < 0 ? 'atrasada' : d <= 30 ? 'em-breve' : 'no-prazo'
}
