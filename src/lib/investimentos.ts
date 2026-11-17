/** Catálogo de investimentos (foto de nov/2026) e simulação com juros e IR.
 *  Selic 13,75% (Copom 04/11/2026); Focus 09/11/2026: Selic 12,5% (2027), 11% (2028), 10,25% (2029); IPCA longo prazo ~4%. */
import { taxaMensal } from './financas'
import { aliquotaRegressiva } from './impostos'

export const SELIC = 0.1375
export const CDI = 0.1365
export const IPCA_12M = 0.0522
export const IPCA_LONGO = 0.04
/** CDI médio esperado em cada ano a partir de agora (depois do último, repete). */
export const CURVA_CDI = [0.131, 0.1175, 0.106, 0.1015]

export type TipoIR = 'regressivo' | 'isento' | 'acoes'

export interface Investimento {
  nome: string
  categoria: string
  taxa: number // nominal ao ano, antes do IR
  pctCdi?: number // se pós-fixado
  ir: TipoIR
  risco: 'Baixo' | 'Médio' | 'Alto'
  liquidez: string
  garantia: string
  paraQue: string
  atencao: string
}

export const CATALOGO: Investimento[] = [
  { nome: 'Tesouro Selic', categoria: 'Renda fixa pública', taxa: SELIC, pctCdi: 1.007, ir: 'regressivo', risco: 'Baixo', liquidez: 'Diária', garantia: 'Tesouro Nacional', paraQue: 'Reserva de emergência e primeiro investimento.', atencao: 'O mais seguro do país; quase não oscila.' },
  { nome: 'CDB 100% CDI (liquidez diária)', categoria: 'Renda fixa bancária', taxa: CDI, pctCdi: 1, ir: 'regressivo', risco: 'Baixo', liquidez: 'Diária', garantia: 'FGC até R$ 250 mil', paraQue: 'Reserva de emergência, alternativa ao Tesouro Selic.', atencao: 'Prefira bancos sólidos e respeite o limite do FGC.' },
  { nome: 'CDB 110% CDI', categoria: 'Renda fixa bancária', taxa: CDI * 1.1, pctCdi: 1.1, ir: 'regressivo', risco: 'Baixo', liquidez: 'No vencimento', garantia: 'FGC até R$ 250 mil', paraQue: 'Objetivos de 1 a 5 anos.', atencao: 'Rende mais porque o dinheiro fica preso até o vencimento.' },
  { nome: 'LCI/LCA 92% CDI', categoria: 'Renda fixa bancária', taxa: CDI * 0.92, pctCdi: 0.92, ir: 'isento', risco: 'Baixo', liquidez: 'Carência de 9-12 meses', garantia: 'FGC até R$ 250 mil', paraQue: 'Médio prazo; isenta de IR.', atencao: 'Compare pelo valor líquido, não pela porcentagem.' },
  { nome: 'Tesouro Prefixado', categoria: 'Renda fixa pública', taxa: 0.135, ir: 'regressivo', risco: 'Médio', liquidez: 'Diária, mas oscila', garantia: 'Tesouro Nacional', paraQue: 'Travar taxa alta quando se espera queda dos juros.', atencao: 'Vender antes do vencimento pode dar prejuízo.' },
  { nome: 'Tesouro IPCA+', categoria: 'Renda fixa pública', taxa: (1 + IPCA_LONGO) * 1.073 - 1, ir: 'regressivo', risco: 'Médio', liquidez: 'Diária, mas oscila bastante', garantia: 'Tesouro Nacional', paraQue: 'Longo prazo e aposentadoria: protege da inflação.', atencao: 'IPCA + ~7% ao ano é historicamente muito alto.' },
  { nome: 'Poupança', categoria: 'Renda fixa bancária', taxa: 0.0617 + 0.018, ir: 'isento', risco: 'Baixo', liquidez: 'Diária', garantia: 'FGC até R$ 250 mil', paraQue: 'Só como comparação.', atencao: 'Com Selic alta, perde para quase tudo.' },
  { nome: 'Fundos imobiliários (FIIs)', categoria: 'Renda variável', taxa: 0.04 + 0.075, ir: 'isento', risco: 'Alto', liquidez: 'Diária na bolsa', garantia: 'Nenhuma', paraQue: 'Renda mensal de aluguéis; dividendos isentos.', atencao: 'Premissa de dividendos de 11-12% ao ano; preço oscila.' },
  { nome: 'ETF de Ibovespa (ações)', categoria: 'Renda variável', taxa: (1 + IPCA_LONGO) * 1.065 - 1, ir: 'acoes', risco: 'Alto', liquidez: 'Diária na bolsa', garantia: 'Nenhuma', paraQue: 'Longo prazo (10+ anos), parte menor da carteira.', atencao: 'Premissa de IPCA + 6,5%; pode ser bem melhor ou pior.' },
]

export function taxasAnuais(inv: Investimento, anos: number, jurosCaem = true): number[] {
  if (inv.pctCdi == null || !jurosCaem) return Array(anos).fill(inv.taxa)
  return Array.from({ length: anos }, (_, a) => inv.pctCdi! * CURVA_CDI[Math.min(a, CURVA_CDI.length - 1)])
}

function fatores(taxas: number[] | number, meses: number): number[] {
  const t = Array.isArray(taxas) ? taxas : [taxas]
  const g = [1]
  for (let m = 0; m < meses; m++) g.push(g[m] * (1 + taxaMensal(t[Math.min(Math.floor(m / 12), t.length - 1)])))
  return g
}

/** Simula aporte inicial + mensal; IR cobrado no resgate (cada aporte com sua idade na tabela regressiva). */
export function simularInvestimento(inicial: number, aporte: number, taxas: number[] | number, meses: number, ir: TipoIR, inflacao = IPCA_LONGO) {
  const g = fatores(taxas, meses)
  let bruto = 0, investido = 0, imposto = 0
  const depositos: [number, number][] = [[0, inicial], ...Array.from({ length: meses }, (_, k) => [k + 1, aporte] as [number, number])]
  for (const [mes, valor] of depositos) {
    if (valor <= 0) continue
    const final = (valor * g[meses]) / g[mes]
    const ganho = final - valor
    bruto += final
    investido += valor
    if (ir === 'regressivo') imposto += ganho * aliquotaRegressiva((meses - mes) * 30)
    else if (ir === 'acoes') imposto += ganho * 0.15
  }
  const liquido = bruto - imposto
  return { investido, bruto, imposto, liquido, liquidoReal: liquido / Math.pow(1 + inflacao, meses / 12), ganho: liquido - investido }
}

export function evolucao(inicial: number, aporte: number, taxas: number[] | number, meses: number): number[] {
  const g = fatores(taxas, meses)
  const out: number[] = []
  for (let m = 0; m <= meses; m++) {
    let s = inicial * g[m]
    for (let k = 1; k <= m; k++) s += (aporte * g[m]) / g[k]
    out.push(s)
  }
  return out
}
