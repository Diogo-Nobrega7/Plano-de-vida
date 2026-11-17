import { useEffect, useState } from 'react'

export type Tema = 'sistema' | 'claro' | 'escuro'

/** Preferência visual (só isso fica no navegador). */
export function useTema() {
  const [tema, setTema] = useState<Tema>(() => (localStorage.getItem('rumo:tema') as Tema) || 'sistema')
  useEffect(() => {
    localStorage.setItem('rumo:tema', tema)
    const r = document.documentElement
    if (tema === 'sistema') r.removeAttribute('data-theme')
    else r.setAttribute('data-theme', tema === 'escuro' ? 'dark' : 'light')
  }, [tema])
  return { tema, setTema }
}
