/** Único lugar que fala com o banco. Mesma interface para Supabase e modo local,
 *  então as telas não precisam saber onde os dados ficam. */
import { supabase } from './supabase'
import type { NomeTabela, Novo, Tabelas } from './tipos'

export interface Ordem { coluna: string; asc?: boolean }

export interface Banco {
  listar<K extends NomeTabela>(t: K, ordem?: Ordem[]): Promise<Tabelas[K][]>
  inserir<K extends NomeTabela>(t: K, linhas: Novo<Tabelas[K]>[]): Promise<Tabelas[K][]>
  atualizar<K extends NomeTabela>(t: K, id: string, campos: Partial<Tabelas[K]>): Promise<void>
  remover(t: NomeTabela, ids: string[]): Promise<void>
}

function ordenar<T>(linhas: T[], ordem: Ordem[] = []): T[] {
  return [...linhas].sort((a, b) => {
    for (const o of ordem) {
      const va = (a as Record<string, unknown>)[o.coluna] as string | number | null
      const vb = (b as Record<string, unknown>)[o.coluna] as string | number | null
      if (va === vb) continue
      if (va == null) return 1
      if (vb == null) return -1
      return (va < vb ? -1 : 1) * (o.asc === false ? -1 : 1)
    }
    return 0
  })
}

const PREFIXO = 'rumo:'
const novoId = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36))

/** Modo local: tudo em localStorage (útil para testar sem Supabase). */
export const bancoLocal: Banco = {
  async listar(t, ordem) {
    return ordenar(JSON.parse(localStorage.getItem(PREFIXO + t) || '[]'), ordem)
  },
  async inserir(t, linhas) {
    const atuais = JSON.parse(localStorage.getItem(PREFIXO + t) || '[]')
    const novas = linhas.map((l) => ({ ...l, id: novoId(), criado_em: new Date().toISOString() }))
    localStorage.setItem(PREFIXO + t, JSON.stringify([...atuais, ...novas]))
    return novas as never
  },
  async atualizar(t, id, campos) {
    const atuais = JSON.parse(localStorage.getItem(PREFIXO + t) || '[]') as { id: string }[]
    localStorage.setItem(PREFIXO + t, JSON.stringify(atuais.map((l) => (l.id === id ? { ...l, ...campos, id } : l))))
  },
  async remover(t, ids) {
    const atuais = JSON.parse(localStorage.getItem(PREFIXO + t) || '[]') as { id: string }[]
    localStorage.setItem(PREFIXO + t, JSON.stringify(atuais.filter((l) => !ids.includes(l.id))))
  },
}

function erro(e: { message: string } | null) {
  if (e) throw new Error(e.message)
}

export const bancoSupabase: Banco = {
  async listar(t, ordem = []) {
    let q = supabase!.from(t).select('*')
    for (const o of ordem) q = q.order(o.coluna, { ascending: o.asc !== false, nullsFirst: false })
    const { data, error } = await q
    erro(error)
    return (data ?? []) as never
  },
  async inserir(t, linhas) {
    if (!linhas.length) return []
    const { data, error } = await supabase!.from(t).insert(linhas as never).select('*')
    erro(error)
    return (data ?? []) as never
  },
  async atualizar(t, id, campos) {
    const { id: _ignorar, criado_em: _c, ...resto } = campos as Record<string, unknown>
    const { error } = await supabase!.from(t).update(resto as never).eq('id', id)
    erro(error)
  },
  async remover(t, ids) {
    if (!ids.length) return
    const { error } = await supabase!.from(t).delete().in('id', ids)
    erro(error)
  },
}

export const db: Banco = supabase ? bancoSupabase : bancoLocal

/* Avisos de mudança: quando uma tabela muda, as telas que a usam recarregam. */
const ouvintes = new Map<NomeTabela, Set<() => void>>()
export function ouvir(t: NomeTabela, fn: () => void) {
  if (!ouvintes.has(t)) ouvintes.set(t, new Set())
  ouvintes.get(t)!.add(fn)
  return () => { ouvintes.get(t)!.delete(fn) }
}
export function avisar(t: NomeTabela) {
  ouvintes.get(t)?.forEach((fn) => fn())
}
