export const AREAS = ['Linguagens', 'Humanas', 'Natureza', 'Matemática', 'Redação'] as const
export type Area = (typeof AREAS)[number]
export const STATUS = ['não estudado', 'estudando', 'revisado', 'dominado'] as const
export type StatusConteudo = (typeof STATUS)[number]
export const NOTAS: { chave: 'lc' | 'ch' | 'cn' | 'mt' | 'redacao'; nome: Area }[] = [
  { chave: 'lc', nome: 'Linguagens' }, { chave: 'ch', nome: 'Humanas' }, { chave: 'cn', nome: 'Natureza' },
  { chave: 'mt', nome: 'Matemática' }, { chave: 'redacao', nome: 'Redação' },
]
const PESO: Record<string, number> = { 'não estudado': 0, estudando: 0.33, revisado: 0.75, dominado: 1 }

/** Progresso 0-1: dominado 100%, revisado 75%, estudando 33%. */
export function progresso(status: string[]): number {
  return status.length ? status.reduce((s, x) => s + (PESO[x] ?? 0), 0) / status.length : 0
}

export function mediaEnem(n: Partial<Record<string, number | null>>): number | null {
  const v = NOTAS.map((a) => n[a.chave])
  return v.some((x) => x == null) ? null : (v as number[]).reduce((a, b) => a + b, 0) / 5
}
