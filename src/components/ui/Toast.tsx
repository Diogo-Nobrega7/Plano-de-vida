import { useEffect, useState } from 'react'
import { CheckCircle2, AlertTriangle } from 'lucide-react'

type Aviso = { id: number; texto: string; tipo: 'ok' | 'erro' }
let emitir: ((a: Aviso) => void) | null = null
let seq = 0

/** Mostra um aviso rápido no canto da tela. */
export function toast(texto: string, tipo: 'ok' | 'erro' = 'ok') {
  emitir?.({ id: ++seq, texto, tipo })
}

export function Toaster() {
  const [avisos, setAvisos] = useState<Aviso[]>([])
  useEffect(() => {
    emitir = (a) => {
      setAvisos((x) => [...x, a])
      setTimeout(() => setAvisos((x) => x.filter((y) => y.id !== a.id)), a.tipo === 'erro' ? 6000 : 2600)
    }
    return () => { emitir = null }
  }, [])
  return (
    <div aria-live="polite" className="fixed bottom-24 md:bottom-6 right-4 left-4 md:left-auto z-50 flex flex-col gap-2 items-end pointer-events-none">
      {avisos.map((a) => (
        <div key={a.id} className="entrar pointer-events-auto flex items-center gap-2.5 rounded-lg bg-night text-white px-4 py-3 shadow-lg text-sm font-semibold max-w-sm">
          {a.tipo === 'ok' ? <CheckCircle2 size={18} className="text-[#4ADE80]" /> : <AlertTriangle size={18} className="text-[#FCA5A5]" />}
          {a.texto}
        </div>
      ))}
    </div>
  )
}
