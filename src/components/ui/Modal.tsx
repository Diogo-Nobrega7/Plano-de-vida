import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { IconButton } from './Button'

export function Modal({ aberto, titulo, onFechar, children, largura = 'max-w-lg' }: { aberto: boolean; titulo: string; onFechar: () => void; children: ReactNode; largura?: string }) {
  useEffect(() => {
    if (!aberto) return
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onFechar()
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [aberto, onFechar])
  if (!aberto) return null
  return createPortal(
    <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center p-0 md:p-6" role="dialog" aria-modal="true" aria-label={titulo}>
      <div className="absolute inset-0 bg-night/50 backdrop-blur-[2px]" onClick={onFechar} />
      <div className={`entrar relative w-full ${largura} max-h-[92vh] overflow-auto rounded-t-2xl md:rounded-xl bg-surface shadow-lg`}>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-surface px-5 py-4">
          <h2 className="titulo text-lg">{titulo}</h2>
          <IconButton rotulo="Fechar" onClick={onFechar}><X size={18} /></IconButton>
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
