/** Estimativa de gastos por tópico. Base: POF/IBGE 2017-2018 (habitação 36,6%, transporte 18,1%,
 *  alimentação 17,5% das despesas de consumo). "Renda alta" é um ajuste para famílias de renda alta. */

export const PERFIS = ['Brasil médio (IBGE)', 'Renda alta'] as const
export type Perfil = (typeof PERFIS)[number]

export const TOPICOS: [string, number, number][] = [
  ['Moradia (aluguel, condomínio, IPTU)', 0.25, 0.22],
  ['Contas da casa (luz, água, internet)', 0.07, 0.04],
  ['Feira e supermercado', 0.12, 0.07],
  ['Restaurante e delivery', 0.06, 0.06],
  ['Transporte (carro, app, combustível)', 0.15, 0.1],
  ['Saúde (plano, remédios)', 0.08, 0.08],
  ['Educação (escola, cursos)', 0.05, 0.1],
  ['Lazer e cultura', 0.04, 0.06],
  ['Viagens', 0.02, 0.07],
  ['Roupas e calçados', 0.04, 0.04],
  ['Higiene e cuidados', 0.03, 0.03],
  ['Serviços (diarista, academia, pet)', 0.03, 0.06],
  ['Outros e imprevistos', 0.06, 0.07],
]

export function estimar(gastos: number, perfil: Perfil) {
  const i = PERFIS.indexOf(perfil) + 1
  return TOPICOS.map((t) => ({ topico: t[0], pct: t[i] as number, valor: gastos * (t[i] as number) }))
}

export function regra503020(renda: number) {
  return { necessidades: renda * 0.5, desejos: renda * 0.3, investir: renda * 0.2 }
}
