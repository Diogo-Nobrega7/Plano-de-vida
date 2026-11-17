export function Marca({ claro = false }: { claro?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#1D4ED8] shadow-sm">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 19L19 5" /><path d="M9 5h10v10" /></svg>
      </span>
      <span className={`text-[22px] font-extrabold tracking-[-0.04em] ${claro ? 'text-white' : 'text-ink'}`}>rumo</span>
    </span>
  )
}
