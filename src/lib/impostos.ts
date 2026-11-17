/** Impostos de 2026 sobre salário (CLT) e investimentos. Conferir todo ano.
 *  INSS: Portaria MPS/MF nº 13/2026 (teto R$ 8.475,55).
 *  IRRF: tabela mensal + redutor da Lei 15.270/2025 (isenção até R$ 5 mil, redução até R$ 7.350). */

export const FAIXAS_INSS: [number, number][] = [[1621.0, 0.075], [2902.84, 0.09], [4354.27, 0.12], [8475.55, 0.14]]
export const FAIXAS_IR: [number, number, number][] = [
  [2428.8, 0, 0], [2826.65, 0.075, 182.16], [3751.05, 0.15, 394.16], [4664.68, 0.225, 675.49], [Infinity, 0.275, 908.73],
]
export const DEDUCAO_DEPENDENTE = 189.59
export const DESCONTO_SIMPLIFICADO = 607.2

const r2 = (v: number) => Math.round(v * 100) / 100

export function inss(bruto: number): number {
  let total = 0, ant = 0
  for (const [lim, a] of FAIXAS_INSS) {
    if (bruto <= ant) break
    total += (Math.min(bruto, lim) - ant) * a
    ant = lim
  }
  return r2(total)
}

export function irTabela(base: number): number {
  const f = FAIXAS_IR.find(([lim]) => base <= lim)!
  return Math.max(0, base * f[1] - f[2])
}

export function redutor(bruto: number, imposto: number): number {
  const red = bruto <= 5000 ? 312.89 : bruto <= 7350 ? 978.62 - 0.133145 * bruto : 0
  return Math.min(imposto, Math.max(0, red))
}

export function irrf(bruto: number, dependentes = 0): number {
  const deducoes = Math.max(inss(bruto) + dependentes * DEDUCAO_DEPENDENTE, DESCONTO_SIMPLIFICADO)
  const imposto = irTabela(Math.max(0, bruto - deducoes))
  return r2(imposto - redutor(bruto, imposto))
}

export function salarioLiquido(bruto: number, dependentes = 0, outros = 0) {
  const vInss = inss(bruto), vIr = irrf(bruto, dependentes)
  return { bruto, inss: vInss, ir: vIr, outros, liquido: r2(bruto - vInss - vIr - outros), aliquotaEfetiva: bruto ? (vInss + vIr) / bruto : 0 }
}

/** Bruto necessário (CLT) para um líquido desejado. */
export function brutoParaLiquido(liquido: number, dependentes = 0): number {
  let lo = liquido, hi = liquido * 2 + 10000
  for (let k = 0; k < 100; k++) {
    const mid = (lo + hi) / 2
    if (salarioLiquido(mid, dependentes).liquido < liquido) lo = mid
    else hi = mid
  }
  return r2(hi)
}

/** Tabela regressiva da renda fixa. */
export function aliquotaRegressiva(dias: number): number {
  return dias <= 180 ? 0.225 : dias <= 360 ? 0.2 : dias <= 720 ? 0.175 : 0.15
}
