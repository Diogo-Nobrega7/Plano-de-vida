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
  const texto = `${String(Math.floor(restante / 60)).padStart(2, '0')}:${String(restante % 60).padStart(2, '0')}`

  // Mostra o tempo na aba do navegador e toca um aviso curto ao terminar.
  useEffect(() => {
    if (!fimEm) return
    const original = document.title
    document.title = terminou ? '✅ Foco concluído · Rumo' : `⏱ ${texto} · Rumo`
    return () => { document.title = original }
  }, [fimEm, texto, terminou])
  useEffect(() => { if (terminou) tocarAviso() }, [terminou])

  return {
    restante, duracao, decorrido, rodando: !!fimEm && !terminou, terminou,
    iniciar: () => setFimEm(Date.now() + (restante > 0 ? restante : duracao) * 1000), // terminado: recomeça do início
    pausar: () => { setRestantePausado(restante); setFimEm(null) },
    zerar: (min?: number) => { const s = (min ?? duracao / 60) * 60; setDuracao(s); setRestantePausado(s); setFimEm(null) },
    texto,
  }
}

export function idYoutube(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/)
  return m ? m[1] : null
}

function tocarAviso() {
  try {
    const ctx = new AudioContext()
    ;[0, 0.25, 0.5].forEach((t) => {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.frequency.value = 880
      g.gain.setValueAtTime(0.0001, ctx.currentTime + t)
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.2)
      o.connect(g).connect(ctx.destination)
      o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.22)
    })
  } catch { /* navegador sem áudio: só o aviso visual */ }
}
