import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'

interface Acao { rotulo: string; fn: () => void }
type Aviso = { id: number; texto: string; tipo: 'ok' | 'erro'; acao?: Acao }
let emitir: ((a: Aviso) => void) | null = null
let seq = 0

/** Mostra um aviso rápido no canto da tela (opcionalmente com um botão, ex.: Desfazer). */
export function toast(texto: string, tipo: 'ok' | 'erro' = 'ok', acao?: Acao) {
  emitir?.({ id: ++seq, texto, tipo, acao })
}

export function Toaster() {
  const [avisos, setAvisos] = useState<Aviso[]>([])
  useEffect(() => {
    emitir = (a) => {
      setAvisos((x) => [...x.slice(-2), a])
      setTimeout(() => setAvisos((x) => x.filter((y) => y.id !== a.id)), a.acao ? 6000 : a.tipo === 'erro' ? 6000 : 2600)
    }
    return () => { emitir = null }
  }, [])
  const fechar = (id: number) => setAvisos((x) => x.filter((y) => y.id !== id))
  return (
    <div aria-live="polite" className="fixed bottom-24 md:bottom-6 right-4 left-4 md:left-auto z-[60] flex flex-col gap-2 items-end pointer-events-none">
      {avisos.map((a) => (
        <div key={a.id} className="entrar pointer-events-auto flex items-center gap-3 rounded-lg bg-night text-white pl-4 pr-2 py-2.5 shadow-lg text-sm font-semibold max-w-sm ring-1 ring-white/10">
          {a.tipo === 'ok' ? <CheckCircle2 size={18} className="text-[#4ADE80] shrink-0" /> : <AlertTriangle size={18} className="text-[#FCA5A5] shrink-0" />}
          <span className="py-1">{a.texto}</span>
          {a.acao && (
            <button type="button" onClick={() => { a.acao!.fn(); fechar(a.id) }} className="ml-1 rounded-md px-2.5 py-1.5 font-extrabold text-[#93C5FD] hover:bg-white/10">{a.acao.rotulo}</button>
          )}
        </div>
      ))}
    </div>
  )
}
