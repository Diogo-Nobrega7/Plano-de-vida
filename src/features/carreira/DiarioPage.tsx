import { useState } from 'react'
import { BookOpenCheck, Clock, Plus, Trash2 } from 'lucide-react'
import { Badge, Button, Cabecalho, Campo, Card, Input, Modal, Textarea, Vazio } from '@/components/ui'
import { useTabela } from '@/data/hooks'
import { hojeISO, somarDias } from '@/lib/datas'
import { dataBR } from '@/lib/format'
import type { Decisao } from '@/data/tipos'

export function DiarioPage() {
  const decisoes = useTabela('decisoes', [{ coluna: 'data', asc: false }])
  const [nova, setNova] = useState<Partial<Decisao> | null>(null)
  const [revisando, setRevisando] = useState<Decisao | null>(null)
  const hoje = hojeISO()
  const pendentes = decisoes.dados.filter((d) => d.revisar_em && d.revisar_em <= hoje)

  return (
    <div className="flex flex-col gap-6">
      <Cabecalho etiqueta="Carreira" titulo="Diário de decisões" sub="Anote cada decisão com as premissas da época. Na revisão, compare com o que aconteceu: é assim que se aprende com acertos e erros."
        acao={<Button onClick={() => setNova({ data: hoje, revisar_em: somarDias(hoje, 365) })} icone={<Plus size={16} />}>Nova decisão</Button>} />
      {pendentes.length > 0 && <div className="rounded-lg bg-fire-soft px-4 py-3 text-sm font-semibold flex items-center gap-2"><Clock size={16} />{pendentes.length} decisão(ões) com revisão pendente.</div>}
      {!decisoes.dados.length ? <Card><Vazio icone={<BookOpenCheck size={22} />} titulo="Nenhuma decisão registrada" /></Card> : (
        <ol className="relative flex flex-col gap-4 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-line">
          {decisoes.dados.map((d) => {
            const pend = d.revisar_em && d.revisar_em <= hoje
            return (
              <li key={d.id} className="relative pl-10 group">
                <span className={`absolute left-0 top-5 h-6 w-6 rounded-full ring-4 ring-bg ${pend ? 'bg-fire' : d.resultado ? 'bg-ok' : 'bg-brand'}`} />
                <Card>
                  <div className="flex flex-wrap items-center gap-2 mb-2"><span className="text-sm font-medium text-muted">{dataBR(d.data)}</span>{pend ? <Badge tom="fire">revisar agora</Badge> : d.revisar_em && <Badge>revisar em {dataBR(d.revisar_em)}</Badge>}{d.resultado && <Badge tom="ok">revisada</Badge>}</div>
                  <p className="font-medium text-[16px]">{d.decisao}</p>
                  {d.premissas && <p className="mt-2 text-sm text-muted"><b className="text-ink">Premissas:</b> {d.premissas}</p>}
                  {d.resultado && <p className="mt-2 text-sm rounded-lg bg-ok-soft p-3"><b>O que aconteceu:</b> {d.resultado}</p>}
                  <div className="mt-4 flex gap-2">
                    <Button tamanho="sm" variante="secundario" onClick={() => setRevisando(d)}>Registrar revisão</Button>
                    <Button tamanho="sm" variante="perigo" onClick={() => decisoes.remover(d.id)} icone={<Trash2 size={14} />}>Apagar</Button>
                  </div>
                </Card>
              </li>
            )
          })}
        </ol>
      )}
      <Modal aberto={!!nova} titulo="Nova decisão" onFechar={() => setNova(null)}>
        {nova && (
          <form className="flex flex-col gap-4" onSubmit={async (e) => { e.preventDefault(); if (await decisoes.inserir({ data: nova.data!, decisao: nova.decisao!.trim(), premissas: nova.premissas || null, revisar_em: nova.revisar_em || null, resultado: null }, 'Decisão registrada')) setNova(null) }}>
            <div className="grid gap-4 grid-cols-2">
              <Campo rotulo="Data">{(id) => <Input id={id} type="date" value={nova.data} onChange={(e) => setNova({ ...nova, data: e.target.value })} />}</Campo>
              <Campo rotulo="Revisar em">{(id) => <Input id={id} type="date" value={nova.revisar_em ?? ''} onChange={(e) => setNova({ ...nova, revisar_em: e.target.value })} />}</Campo>
            </div>
            <Campo rotulo="Decisão">{(id) => <Textarea id={id} required rows={2} placeholder="Ex.: Vou focar em Medicina e prestar o ENEM em 2028." value={nova.decisao ?? ''} onChange={(e) => setNova({ ...nova, decisao: e.target.value })} />}</Campo>
            <Campo rotulo="Premissas (no que você se baseou)">{(id) => <Textarea id={id} rows={3} value={nova.premissas ?? ''} onChange={(e) => setNova({ ...nova, premissas: e.target.value })} />}</Campo>
            <div className="flex justify-end"><Button type="submit">Registrar</Button></div>
          </form>
        )}
      </Modal>
      <Modal aberto={!!revisando} titulo="Revisar decisão" onFechar={() => setRevisando(null)}>
        {revisando && <Revisar d={revisando} salvar={async (resultado, prox) => { if (await decisoes.atualizar(revisando.id, { resultado, revisar_em: prox }, 'Revisão salva')) setRevisando(null) }} />}
      </Modal>
    </div>
  )
}

function Revisar({ d, salvar }: { d: Decisao; salvar: (r: string, prox: string | null) => void }) {
  const [r, setR] = useState(d.resultado ?? '')
  const [prox, setProx] = useState(somarDias(hojeISO(), 365))
  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); salvar(r, prox || null) }}>
      <p className="text-sm text-muted">{d.decisao}</p>
      <Campo rotulo="O que aconteceu? As premissas se confirmaram?">{(id) => <Textarea id={id} rows={4} value={r} onChange={(e) => setR(e.target.value)} />}</Campo>
      <Campo rotulo="Próxima revisão">{(id) => <Input id={id} type="date" value={prox} onChange={(e) => setProx(e.target.value)} />}</Campo>
      <div className="flex justify-end"><Button type="submit">Salvar revisão</Button></div>
    </form>
  )
}
