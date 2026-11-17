import { createContext, useContext, type ReactNode } from 'react'
import { useTabela } from '@/data/hooks'
import type { Perfil } from '@/data/tipos'
import { PERFIL_INICIAL } from '@/data/seeds'

interface Ctx { perfil: Perfil; salvarPerfil: (c: Partial<Perfil>, ok?: string) => Promise<boolean> }
const C = createContext<Ctx | null>(null)

export function PerfilProvider({ children }: { children: ReactNode }) {
  const { dados, atualizar } = useTabela('perfil')
  const perfil: Perfil = dados[0] ?? { ...PERFIL_INICIAL, id: '' }
  const salvarPerfil = (c: Partial<Perfil>, ok?: string) => (perfil.id ? atualizar(perfil.id, c, ok) : Promise.resolve(false))
  return <C.Provider value={{ perfil, salvarPerfil }}>{children}</C.Provider>
}

export function usePerfil() {
  const c = useContext(C)
  if (!c) throw new Error('usePerfil fora do PerfilProvider')
  return c
}
