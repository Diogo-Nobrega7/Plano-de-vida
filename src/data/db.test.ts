import { beforeEach, describe, expect, it } from 'vitest'

// localStorage mínimo para testar o modo local no Node
const mem = new Map<string, string>()
globalThis.localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v), removeItem: (k: string) => void mem.delete(k), clear: () => mem.clear(), key: () => null, length: 0 } as Storage

const { bancoLocal, normalizar, ordenar } = await import('./db')

describe('banco', () => {
  beforeEach(() => mem.clear())

  it('converte numeric em número', () => {
    const l = normalizar('perfil', { renda_desejada: '50000.00', taxa_saque: '0.0400', nome: 'Davi' } as never) as Record<string, unknown>
    expect(l.renda_desejada).toBe(50000)
    expect(l.taxa_saque).toBe(0.04)
    expect(l.nome).toBe('Davi')
    expect((normalizar('simulados', { lc: null } as never) as Record<string, unknown>).lc).toBeNull()
  })

  it('ordena com vazios no fim e decrescente', () => {
    const o = ordenar([{ p: '2027' }, { p: null }, { p: '2026' }], [{ coluna: 'p' }])
    expect(o.map((x) => x.p)).toEqual(['2026', '2027', null])
    expect(ordenar([{ n: 1 }, { n: 3 }, { n: 2 }], [{ coluna: 'n', asc: false }]).map((x) => x.n)).toEqual([3, 2, 1])
  })

  it('modo local: inserir, atualizar, remover', async () => {
    const [m] = await bancoLocal.inserir('metas', [{ titulo: 'A', area: 'Estudos', prazo: null, status: 'não iniciada', notas: null }])
    expect(m.id).toBeTruthy()
    await bancoLocal.atualizar('metas', m.id, { status: 'concluída' })
    expect((await bancoLocal.listar('metas'))[0].status).toBe('concluída')
    await bancoLocal.remover('metas', [m.id])
    expect(await bancoLocal.listar('metas')).toHaveLength(0)
  })
})

describe('dados iniciais', () => {
  beforeEach(() => mem.clear())
  it('rodar duas vezes ao mesmo tempo não duplica', async () => {
    const { garantirDadosIniciais, CONTEUDOS } = await import('./seeds')
    await Promise.all([garantirDadosIniciais(), garantirDadosIniciais()])
    await garantirDadosIniciais()
    const total = Object.values(CONTEUDOS).reduce((s, m) => s + Object.keys(m).length, 0)
    expect(await bancoLocal.listar('materias')).toHaveLength(total)
    expect(await bancoLocal.listar('perfil')).toHaveLength(1)
    expect(await bancoLocal.listar('cenarios')).toHaveLength(3)
  })
})
