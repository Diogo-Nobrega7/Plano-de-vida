import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { IconButton } from './Button'

export function Modal({ aberto, titulo, onFechar, children, largura = 'max-w-lg' }: { aberto: boolean; titulo: string; onFechar: () => void; children: ReactNode; largura?: string }) {
  useEffect(() => {
    if (!aberto) return
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onFechar()
    document.addEventListener('keydown', esc)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', esc); document.body.style.overflow = overflow }
  }, [aberto, onFechar])
  if (!aberto) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6" role="dialog" aria-modal="true" aria-label={titulo}>
      <div className="entrar absolute inset-0 bg-night/60 backdrop-blur-sm" onClick={onFechar} />
      <div className={`surgir relative w-full ${largura} max-h-[92vh] overflow-auto rounded-t-2xl md:rounded-xl border border-line bg-surface shadow-lg`}>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-surface/90 backdrop-blur px-5 py-3.5">
          <h2 className="text-[15px] font-semibold">{titulo}</h2>
          <IconButton rotulo="Fechar" onClick={onFechar}><X size={16} /></IconButton>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

/** Coloca o conteúdo direto no <body> (camadas que cobrem a tela toda). */
export function Camada({ children }: { children: ReactNode }) {
  return createPortal(children, document.body)
}
