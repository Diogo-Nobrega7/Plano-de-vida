/** Marca do Rumo: seta subindo dentro de um quadrado azul com brilho (direção + progresso). */
export function Simbolo({ tamanho = 30 }: { tamanho?: number }) {
  return (
    <span className="relative grid place-items-center rounded-[9px] shadow-[0_1px_0_rgb(255_255_255/.25)_inset,0_6px_16px_-6px_rgb(84_130_255/.7)]"
      style={{ width: tamanho, height: tamanho, background: 'linear-gradient(145deg, #6A93FF 0%, #2F5BEA 55%, #1D3FC2 100%)' }}>
      <svg width={tamanho * 0.52} height={tamanho * 0.52} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 19L19 5" /><path d="M9 5h10v10" /></svg>
    </span>
  )
}

export function Marca({ claro = false }: { claro?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <Simbolo />
      <span className={`text-[19px] font-semibold tracking-[-0.04em] ${claro ? 'text-white' : 'text-ink'}`}>rumo</span>
    </span>
  )
}
