import { useEffect, useState } from 'react'

/** Cronômetro regressivo baseado no relógio (não atrasa se a aba ficar em segundo plano). */
export function useCronometro(minutosPadrao = 25) {
  const [duracao, setDuracao] = useState(minutosPadrao * 60)
  const [fimEm, setFimEm] = useState<number | null>(null)
  const [restantePausado, setRestantePausado] = useState(minutosPadrao * 60)
  const [, tique] = useState(0)

  useEffect(() => {
    if (!fimEm) return
    const t = setInterval(() => tique((x) => x + 1), 500)
    return () => clearInterval(t)
  }, [fimEm])

  const restante = fimEm ? Math.max(0, Math.round((fimEm - Date.now()) / 1000)) : restantePausado
  const terminou = fimEm != null && restante === 0
  const decorrido = duracao - restante

  return {
    restante, duracao, decorrido, rodando: !!fimEm && !terminou, terminou,
    iniciar: () => setFimEm(Date.now() + restante * 1000),
    pausar: () => { setRestantePausado(restante); setFimEm(null) },
    zerar: (min?: number) => { const s = (min ?? duracao / 60) * 60; setDuracao(s); setRestantePausado(s); setFimEm(null) },
    texto: `${String(Math.floor(restante / 60)).padStart(2, '0')}:${String(restante % 60).padStart(2, '0')}`,
  }
}

export function idYoutube(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/)
  return m ? m[1] : null
}
