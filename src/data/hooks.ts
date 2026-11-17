import { useCallback, useEffect, useState } from 'react'
import { avisar, db, ouvir, type Ordem } from './db'
import type { NomeTabela, Novo, Tabelas } from './tipos'
import { toast } from '@/components/ui/Toast'

/** Lê uma tabela e oferece inserir/atualizar/remover; recarrega sozinho quando ela muda. */
export function useTabela<K extends NomeTabela>(t: K, ordem?: Ordem[]) {
  const [dados, setDados] = useState<Tabelas[K][]>([])
  const [carregando, setCarregando] = useState(true)
  const chaveOrdem = JSON.stringify(ordem ?? [])

  const recarregar = useCallback(async () => {
    try {
      setDados(await db.listar(t, ordem))
    } catch (e) {
      toast((e as Error).message, 'erro')
    } finally {
      setCarregando(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, chaveOrdem])

  useEffect(() => {
    recarregar()
    return ouvir(t, recarregar)
  }, [t, recarregar])

  const acao = useCallback(async (fn: () => Promise<unknown>, ok?: string) => {
    try {
      await fn()
      avisar(t)
      if (ok) toast(ok)
      return true
    } catch (e) {
      toast((e as Error).message, 'erro')
      return false
    }
  }, [t])

  return {
    dados, carregando, recarregar,
    inserir: (linhas: Novo<Tabelas[K]> | Novo<Tabelas[K]>[], ok?: string) => acao(() => db.inserir(t, Array.isArray(linhas) ? linhas : [linhas]), ok),
    atualizar: (id: string, campos: Partial<Tabelas[K]>, ok?: string) => acao(() => db.atualizar(t, id, campos), ok),
    remover: (ids: string | string[], ok?: string) => acao(() => db.remover(t, Array.isArray(ids) ? ids : [ids]), ok),
  }
}
