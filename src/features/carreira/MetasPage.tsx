import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Anel, Badge, Button, Cabecalho, Campo, Card, Input, Modal, Segmented, Select, Textarea, cx } from '@/components/ui'
import { useTabela } from '@/data/hooks'
import { situacaoMeta } from '@/lib/carreira'
import { dataBR } from '@/lib/format'
import type { Meta } from '@/data/tipos'

const AREAS = ['Carreira', 'Estudos', 'Finanças', 'Família', 'Saúde', 'Pessoal']
const ROT = { concluida: ['Concluída', 'ok'], atrasada: ['Atrasada', 'bad'], 'em-breve': ['Vence em breve', 'fire'], 'no-prazo': ['No prazo', 'brand'], 'sem-prazo': ['Sem prazo', 'neutro'] } as const

export function MetasPage() {
  const metas = useTabela('metas', [{ coluna: 'prazo' }])
  const [filtro, setFiltro] = useState('Todas')
  const [edit, setEdit] = useState<Partial<Meta> | null>(null)
  const lista = metas.dados.filter((m) => filtro === 'Todas' || m.area === filtro)
  const feitas = metas.dados.filter((m) => m.status === 'concluída').length

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    const d = { titulo: edit!.titulo!.trim(), area: edit!.area ?? 'Pessoal', prazo: edit!.prazo || null, status: edit!.status ?? 'não iniciada', notas: edit!.notas || null }
    const ok = edit!.id ? await metas.atualizar(edit!.id, d, 'Meta salva') : await metas.inserir(d, 'Meta criada')
    if (ok) setEdit(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <Cabecalho etiqueta="Carreira" titulo="Metas" sub="O que você quer conquistar, com prazo. O painel Hoje mostra as próximas."
        acao={<Button onClick={() => setEdit({ area: 'Carreira', status: 'não iniciada' })} icone={<Plus size={16} />}>Nova meta</Button>} />
      <Card className="flex flex-wrap items-center gap-6">
        <Anel valor={metas.dados.length ? feitas / metas.dados.length : 0} tamanho={84} espessura={9}><span className="titulo num">{metas.dados.length ? Math.round((feitas / metas.dados.length) * 100) : 0}%</span></Anel>
        <div className="flex gap-8">
          {[['Metas', metas.dados.length], ['Concluídas', feitas], ['Atrasadas', metas.dados.filter((m) => situacaoMeta(m.prazo, m.status) === 'atrasada').length]].map(([r, v]) => <div key={r as string}><p className="text-[13px] font-bold text-muted">{r}</p><p className="titulo text-3xl num">{v}</p></div>)}
        </div>
        <div className="ml-auto"><Segmented rotulo="Área" valor={filtro} onChange={setFiltro} opcoes={['Todas', ...AREAS].map((a) => ({ valor: a, rotulo: a }))} /></div>
      </Card>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {lista.map((m) => {
          const s = situacaoMeta(m.prazo, m.status)
          return (
            <Card key={m.id} className="!p-4 flex items-start gap-3 group">
              <input type="checkbox" aria-label={`Concluir ${m.titulo}`} checked={m.status === 'concluída'} className="mt-1 h-5 w-5 shrink-0"
                onChange={() => metas.atualizar(m.id, { status: m.status === 'concluída' ? 'em andamento' : 'concluída' }, m.status === 'concluída' ? undefined : 'Meta concluída! 🎉')} />
              <button type="button" className="flex-1 text-left min-w-0" onClick={() => setEdit(m)}>
                <p className={cx('font-bold', m.status === 'concluída' && 'line-through text-muted')}>{m.titulo}</p>
                <div className="mt-2 flex flex-wrap gap-1.5"><Badge>{m.area}</Badge><Badge tom={ROT[s][1]}>{ROT[s][0]}</Badge>{m.prazo && <Badge>até {dataBR(m.prazo)}</Badge>}{m.status === 'em andamento' && <Badge tom="brand">em andamento</Badge>}</div>
                {m.notas && <p className="mt-2 text-sm text-muted line-clamp-2">{m.notas}</p>}
              </button>
              <button type="button" aria-label="Apagar meta" onClick={() => metas.remover(m.id)} className="text-faint hover:text-bad md:opacity-0 group-hover:opacity-100"><Trash2 size={15} /></button>
            </Card>
          )
        })}
      </div>
      <Modal aberto={!!edit} titulo={edit?.id ? 'Editar meta' : 'Nova meta'} onFechar={() => setEdit(null)}>
        {edit && (
          <form onSubmit={salvar} className="flex flex-col gap-4">
            <Campo rotulo="Meta">{(id) => <Input id={id} required value={edit.titulo ?? ''} onChange={(e) => setEdit({ ...edit, titulo: e.target.value })} />}</Campo>
            <div className="grid gap-4 sm:grid-cols-3">
              <Campo rotulo="Área">{(id) => <Select id={id} value={edit.area} onChange={(e) => setEdit({ ...edit, area: e.target.value })}>{AREAS.map((a) => <option key={a}>{a}</option>)}</Select>}</Campo>
              <Campo rotulo="Prazo">{(id) => <Input id={id} type="date" value={edit.prazo ?? ''} onChange={(e) => setEdit({ ...edit, prazo: e.target.value })} />}</Campo>
              <Campo rotulo="Status">{(id) => <Select id={id} value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value as Meta['status'] })}>{['não iniciada', 'em andamento', 'concluída'].map((s) => <option key={s}>{s}</option>)}</Select>}</Campo>
            </div>
            <Campo rotulo="Notas">{(id) => <Textarea id={id} rows={3} value={edit.notas ?? ''} onChange={(e) => setEdit({ ...edit, notas: e.target.value })} />}</Campo>
            <div className="flex justify-end"><Button type="submit">Salvar</Button></div>
          </form>
        )}
      </Modal>
    </div>
  )
}
