/** Datas sempre como texto AAAA-MM-DD no fuso local. */

export function hojeISO(d = new Date()): string {
  const off = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - off).toISOString().slice(0, 10)
}

export function somarDias(iso: string, dias: number): string {
  const [a, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(a, m - 1, d + dias))
  return dt.toISOString().slice(0, 10)
}

export function diasEntre(de: string, ate: string): number {
  const p = (s: string) => { const [a, m, d] = s.split('-').map(Number); return Date.UTC(a, m - 1, d) }
  return Math.round((p(ate) - p(de)) / 86400000)
}

export function mesAtual(d = new Date()): string {
  return hojeISO(d).slice(0, 7)
}

/** Segunda-feira da semana de uma data. */
export function inicioSemana(iso: string): string {
  const [a, m, d] = iso.split('-').map(Number)
  const dia = new Date(Date.UTC(a, m - 1, d)).getUTCDay() // 0 = domingo
  return somarDias(iso, -((dia + 6) % 7))
}

export function saudacao(d = new Date()): string {
  const h = d.getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}

export function dataPorExtenso(d = new Date()): string {
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
}
