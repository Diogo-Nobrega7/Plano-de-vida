import { useMemo, useState } from 'react'
import { ChevronDown, Plus, Trash2 } from 'lucide-react'
import { Anel, Badge, Button, Cabecalho, Carregando, Input, Progress, Segmented, Select, cx } from '@/components/ui'
import { useTabela } from '@/data/hooks'
import { AREAS, STATUS, progresso } from '@/lib/enem'
import { hojeISO } from '@/lib/datas'
import type { Conteudo } from '@/data/tipos'

const COR_STATUS: Record<string, string> = { 'não estudado': 'bg-sunken text-muted', estudando: 'bg-fire-soft text-fire', revisado: 'bg-brand-soft text-brand', dominado: 'bg-ok-soft text-ok' }

export function DisciplinasPage() {
  const materias = useTabela('materias', [{ coluna: 'ordem' }])
  const conteudos = useTabela('conteudos', [{ coluna: 'ordem' }])
  const [area, setArea] = useState<string>('Todas')
  const [filtro, setFiltro] = useState<'todos' | 'alta' | 'pendentes'>('todos')
  const [aberta, setAberta] = useState<string | null>(null)
  const [novo, setNovo] = useState('')

  const porMateria = useMemo(() => {
    const m = new Map<string, Conteudo[]>()
    for (const c of conteudos.dados) m.set(c.materia_id, [...(m.get(c.materia_id) ?? []), c])
    return m
  }, [conteudos.dados])

  if (materias.carregando) return <Carregando />

  const mudarStatus = (c: Conteudo, status: string) =>
    conteudos.atualizar(c.id, { status, revisado_em: status === 'revisado' || status === 'dominado' ? hojeISO() : c.revisado_em })

  const visiveis = (lista: Conteudo[]) => lista.filter((c) => (filtro === 'alta' ? c.frequencia === 'Alta' : filtro === 'pendentes' ? c.status !== 'dominado' : true))

  return (
    <div className="flex flex-col gap-6">
      <Cabecalho etiqueta="Estudos" titulo="Disciplinas" sub="Todo o conteúdo do ENEM em checklist. Comece pelos de frequência Alta: são os que mais caem." />

      <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
        {AREAS.map((a) => {
          const lista = conteudos.dados.filter((c) => materias.dados.find((m) => m.id === c.materia_id)?.area === a)
          const v = progresso(lista.map((c) => c.status))
          return (
            <button key={a} type="button" onClick={() => setArea(area === a ? 'Todas' : a)}
              className={cx('card p-4 flex items-center gap-3 text-left transition hover:shadow-md', area === a && 'ring-2 ring-brand')}>
              <Anel valor={v} tamanho={48} espessura={6}><span className="text-[11px] font-semibold num">{Math.round(v * 100)}%</span></Anel>
              <span className="min-w-0"><span className="block font-semibold text-sm">{a}</span><span className="block text-xs text-muted">{lista.length} conteúdos</span></span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented rotulo="Filtro" valor={filtro} onChange={setFiltro} opcoes={[{ valor: 'todos', rotulo: 'Todos' }, { valor: 'alta', rotulo: 'Só frequência alta' }, { valor: 'pendentes', rotulo: 'Esconder dominados' }]} />
        {area !== 'Todas' && <Button variante="fantasma" tamanho="sm" onClick={() => setArea('Todas')}>Mostrar todas as áreas</Button>}
      </div>

      <div className="card overflow-hidden divide-y divide-line">
        {materias.dados.filter((m) => area === 'Todas' || m.area === area).map((m) => {
          const lista = porMateria.get(m.id) ?? []
          const v = progresso(lista.map((c) => c.status))
          const aberto = aberta === m.id
          return (
            <div key={m.id} className={cx(aberto && "bg-sunken/30")}>
              <button type="button" onClick={() => setAberta(aberto ? null : m.id)} aria-expanded={aberto}
                className="w-full flex items-center gap-4 px-5 py-3.5 text-left hover:bg-sunken/60 transition-colors">
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2"><span className="font-semibold">{m.nome}</span><Badge>{m.area}</Badge></span>
                  <Progress valor={v} className="mt-2 max-w-xs" />
                </span>
                <span className="text-sm font-semibold num text-brand">{Math.round(v * 100)}%</span>
                <ChevronDown size={18} className={cx('text-muted transition-transform', aberto && 'rotate-180')} />
              </button>
              {aberto && (
                <div className="border-t border-line">
                  <ul className="divide-y divide-line">
                    {visiveis(lista).map((c) => (
                      <li key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                        <span className="flex-1 min-w-[180px] text-sm font-semibold">{c.nome}</span>
                        <Badge tom={c.frequencia === 'Alta' ? 'fire' : c.frequencia === 'Média' ? 'brand' : 'neutro'}>{c.frequencia}</Badge>
                        <Select aria-label={`Status de ${c.nome}`} value={c.status} onChange={(e) => mudarStatus(c, e.target.value)}
                          className={cx('!h-9 !w-auto !border-0 text-[13px] font-medium', COR_STATUS[c.status])}>
                          {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </Select>
                        <button type="button" aria-label={`Apagar ${c.nome}`} onClick={() => conteudos.remover(c.id)} className="text-faint hover:text-bad p-1"><Trash2 size={15} /></button>
                      </li>
                    ))}
                  </ul>
                  <form className="flex gap-2 px-5 py-4 bg-sunken/50" onSubmit={async (e) => {
                    e.preventDefault()
                    if (!novo.trim()) return
                    await conteudos.inserir({ materia_id: m.id, nome: novo.trim(), frequencia: 'Média', status: 'não estudado', revisado_em: null, ordem: lista.length })
                    setNovo('')
                  }}>
                    <Input placeholder="Adicionar conteúdo" value={novo} onChange={(e) => setNovo(e.target.value)} aria-label="Novo conteúdo" />
                    <Button type="submit" variante="secundario" icone={<Plus size={16} />}>Adicionar</Button>
                  </form>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
