import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import { db, normalizar, ordenar, type Ordem } from './db'
import type { NomeTabela, Novo, Tabelas } from './tipos'
import { toast } from '@/components/ui/Toast'

/* Cache compartilhado: cada tabela é buscada UMA vez e todas as telas usam a mesma cópia.
   Depois de gravar, só aquela tabela é recarregada e todo mundo que a usa é avisado. */
interface Entrada { linhas: unknown[]; carregado: boolean; buscando: Promise<void> | null; ouvintes: Set<() => void> }
const cache = new Map<NomeTabela, Entrada>()

function entrada(t: NomeTabela): Entrada {
  if (!cache.has(t)) cache.set(t, { linhas: [], carregado: false, buscando: null, ouvintes: new Set() })
  return cache.get(t)!
}

export function recarregarTabela(t: NomeTabela, depoisDeGravar = false): Promise<void> {
  const e = entrada(t)
  // Uma busca que começou antes da gravação pode vir desatualizada: espera e busca de novo.
  if (e.buscando) return depoisDeGravar ? e.buscando.then(() => recarregarTabela(t)) : e.buscando
  e.buscando = db.listar(t)
    .then((linhas) => { e.linhas = linhas.map((l) => normalizar(t, l)); e.carregado = true })
    .catch((err) => { e.carregado = true; toast((err as Error).message, 'erro') })
    .finally(() => { e.buscando = null; e.ouvintes.forEach((f) => f()) })
  return e.buscando
}

/** Esvazia o cache (ao sair da conta). */
export function limparCache() {
  cache.clear()
}

/** Lê uma tabela e oferece inserir/atualizar/remover. Recarrega sozinho quando ela muda. */
export function useTabela<K extends NomeTabela>(t: K, ordem?: Ordem[]) {
  const e = entrada(t)
  const assinar = useCallback((f: () => void) => { e.ouvintes.add(f); return () => { e.ouvintes.delete(f) } }, [e])
  const versao = useSyncExternalStore(assinar, () => e.linhas)
  useEffect(() => { if (!e.carregado && !e.buscando) recarregarTabela(t) }, [t, e])

  const chave = JSON.stringify(ordem ?? [])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const dados = useMemo(() => ordenar(versao as Tabelas[K][], ordem), [versao, chave])

  const acao = useCallback(async (fn: () => Promise<unknown>, ok?: string) => {
    try {
      await fn()
      await recarregarTabela(t, true)
      if (ok) toast(ok)
      return true
    } catch (err) {
      toast((err as Error).message, 'erro')
      return false
    }
  }, [t])

  const ref = useRef(dados)
  ref.current = dados

  return {
    dados, carregando: !e.carregado,
    recarregar: () => recarregarTabela(t),
    inserir: (linhas: Novo<Tabelas[K]> | Novo<Tabelas[K]>[], ok?: string) => acao(() => db.inserir(t, Array.isArray(linhas) ? linhas : [linhas]), ok),
    atualizar: (id: string, campos: Partial<Tabelas[K]>, ok?: string) => acao(() => db.atualizar(t, id, campos), ok),
    /** Apaga e oferece "Desfazer" por alguns segundos (recria a linha). */
    remover: async (ids: string | string[], rotulo = 'Item apagado') => {
      const lista = Array.isArray(ids) ? ids : [ids]
      const copias = ref.current.filter((l) => lista.includes(l.id)).map(({ id: _i, criado_em: _c, ...resto }) => resto as Novo<Tabelas[K]>)
      const ok = await acao(() => db.remover(t, lista))
      if (ok && copias.length) toast(rotulo, 'ok', { rotulo: 'Desfazer', fn: () => { acao(() => db.inserir(t, copias), 'Restaurado') } })
      return ok
    },
  }
}

/** Grava com atraso (ex.: enquanto arrasta um controle), só o último valor. */
export function useAdiado<T>(salvar: (v: T) => void, ms = 500) {
  const t = useRef<ReturnType<typeof setTimeout>>()
  const fn = useRef(salvar)
  fn.current = salvar
  useEffect(() => () => clearTimeout(t.current), [])
  return useCallback((v: T) => { clearTimeout(t.current); t.current = setTimeout(() => fn.current(v), ms) }, [ms])
}
