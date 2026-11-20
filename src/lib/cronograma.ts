/** Cronograma semanal: horários, conflitos e sugestão automática de semana. */

export const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
export const DIAS_CURTOS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

export const paraMinutos = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m }
export const paraHora = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
export const fimDoBloco = (inicio: string, minutos: number) => paraHora(paraMinutos(inicio) + minutos)

/** Dia da semana no formato do cronograma (0 = segunda … 6 = domingo) a partir de AAAA-MM-DD. */
export function diaDaSemana(iso: string): number {
  const [a, m, d] = iso.split('-').map(Number)
  return (new Date(Date.UTC(a, m - 1, d)).getUTCDay() + 6) % 7
}

/** Dois blocos do mesmo dia se sobrepõem? */
export function conflita(a: { dia: number; inicio: string; minutos: number }, b: { dia: number; inicio: string; minutos: number }): boolean {
  if (a.dia !== b.dia) return false
  const ai = paraMinutos(a.inicio), bi = paraMinutos(b.inicio)
  return ai < bi + b.minutos && bi < ai + a.minutos
}

export interface Prioridade { materia_id: string; peso: number }

/**
 * Monta uma semana: em cada dia, blocos de `bloco` minutos (com `pausa` entre eles) a partir de `inicio`,
 * até completar as horas do dia. As matérias se revezam proporcionalmente ao peso (mais conteúdo pendente
 * e de alta frequência = mais blocos), evitando repetir a mesma matéria em blocos seguidos.
 */
export function sugerirSemana(horasPorDia: number[], prioridades: Prioridade[], inicio = '14:00', bloco = 50, pausa = 10) {
  const lista = prioridades.filter((p) => p.peso > 0)
  if (!lista.length) return []
  const credito = new Map(lista.map((p) => [p.materia_id, 0]))
  const total = lista.reduce((s, p) => s + p.peso, 0)
  const blocos: { dia: number; inicio: string; minutos: number; materia_id: string; titulo: null }[] = []
  let anterior = ''
  horasPorDia.forEach((horas, dia) => {
    const n = Math.floor((horas * 60 + pausa) / (bloco + pausa))
    for (let k = 0; k < n; k++) {
      // método do "maior crédito" (distribuição proporcional e estável)
      for (const p of lista) credito.set(p.materia_id, credito.get(p.materia_id)! + p.peso / total)
      const ord = [...lista].sort((a, b) => credito.get(b.materia_id)! - credito.get(a.materia_id)!)
      // evita a mesma matéria duas vezes seguidas, a não ser que ela esteja bem à frente na fila
      const [a, b] = ord
      const escolha = a.materia_id === anterior && b && credito.get(a.materia_id)! - credito.get(b.materia_id)! < 0.5 ? b : a
      credito.set(escolha.materia_id, credito.get(escolha.materia_id)! - 1)
      anterior = escolha.materia_id
      blocos.push({ dia, inicio: paraHora(paraMinutos(inicio) + k * (bloco + pausa)), minutos: bloco, materia_id: escolha.materia_id, titulo: null })
    }
  })
  return blocos
}
