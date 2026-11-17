/** Revisão espaçada (sistema de caixas): acertou, sobe de caixa e espera mais; errou, volta para a 1. */
import { somarDias } from './datas'

export const INTERVALOS = [1, 3, 7, 15, 30, 60] // dias por caixa (1 a 6)

export function proximaRevisao(caixa: number, acertou: boolean, hoje: string): { caixa: number; proxima: string } {
  const nova = acertou ? Math.min(caixa + 1, INTERVALOS.length) : 1
  return { caixa: nova, proxima: somarDias(hoje, INTERVALOS[nova - 1]) }
}

export function vencida(proxima: string | null | undefined, hoje: string): boolean {
  return !proxima || proxima <= hoje
}
