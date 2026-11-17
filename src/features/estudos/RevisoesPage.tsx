import { useMemo, useState } from 'react'
import { Check, Eye, Plus, RotateCcw, Trash2, X } from 'lucide-react'
import { Badge, Button, Cabecalho, Campo, Card, CardTitulo, Modal, Segmented, Select, Textarea, Vazio, cx } from '@/components/ui'
import { useTabela } from '@/data/hooks'
import { hojeISO } from '@/lib/datas'
import { dataBR } from '@/lib/format'
import { INTERVALOS, proximaRevisao, vencida } from '@/lib/revisao'
import type { Revisao } from '@/data/tipos'

const MOTIVOS = ['Não sabia o conteúdo', 'Interpretei errado', 'Errei conta', 'Faltou tempo', 'Chutei']

export function RevisoesPage() {
  const materias = useTabela('materias', [{ coluna: 'ordem' }])
  const revisoes = useTabela('revisoes', [{ coluna: 'proxima' }])
  const [modo, setModo] = useState<'revisar' | 'todos'>('revisar')
  const [mostrar, setMostrar] = useState(false)
  const [modal, setModal] = useState(false)
  const [f, setF] = useState({ tipo: 'erro' as Revisao['tipo'], materia_id: '', frente: '', verso: '', origem: MOTIVOS[0] })
  const hoje = hojeISO()
  const nomeMat = useMemo(() => new Map(materias.dados.map((m) => [m.id, m.nome])), [materias.dados])

  const fila = revisoes.dados.filter((r) => vencida(r.proxima, hoje))
  const atual = fila[0]

  async function responder(r: Revisao, acertou: boolean) {
    const { caixa, proxima } = proximaRevisao(r.caixa, acertou, hoje)
    await revisoes.atualizar(r.id, { caixa, proxima, feitas: r.feitas + 1, ultima: hoje }, acertou ? `Boa! Próxima em ${INTERVALOS[caixa - 1]} dia(s)` : 'Volta amanhã')
    setMostrar(false)
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    const ok = await revisoes.inserir({ tipo: f.tipo, materia_id: f.materia_id || null, frente: f.frente.trim(), verso: f.verso.trim() || null, origem: f.tipo === 'erro' ? f.origem : null, caixa: 1, proxima: hoje, feitas: 0, ultima: null }, 'Adicionado à revisão')
    if (ok) setF({ ...f, frente: '', verso: '' })
  }

  return (
    <div className="flex flex-col gap-6">
      <Cabecalho etiqueta="Estudos" titulo="Revisões" sub="Banco de erros e flashcards com revisão espaçada: acertou, o intervalo aumenta (1, 3, 7, 15, 30, 60 dias); errou, volta para amanhã."
        acao={<Button onClick={() => setModal(true)} icone={<Plus size={16} />}>Novo erro ou cartão</Button>} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented rotulo="Modo" valor={modo} onChange={setModo} opcoes={[{ valor: 'revisar', rotulo: `Revisar agora (${fila.length})` }, { valor: 'todos', rotulo: `Todos (${revisoes.dados.length})` }]} />
        <div className="flex gap-1.5">{INTERVALOS.map((d, i) => <Badge key={d} tom={i < 2 ? 'fire' : i < 4 ? 'brand' : 'ok'}>Caixa {i + 1}: {revisoes.dados.filter((r) => r.caixa === i + 1).length}</Badge>)}</div>
      </div>

      {modo === 'revisar' ? (
        atual ? (
          <div className="mx-auto w-full max-w-2xl">
            <Card className="!p-0 overflow-hidden shadow-md">
              <div className="flex items-center justify-between border-b border-line px-6 py-3 text-sm">
                <span className="font-bold text-muted">{(atual.materia_id && nomeMat.get(atual.materia_id)) || 'Geral'}</span>
                <span className="flex gap-2"><Badge tom={atual.tipo === 'erro' ? 'bad' : 'brand'}>{atual.tipo === 'erro' ? 'Erro' : 'Cartão'}</Badge><Badge>Caixa {atual.caixa}</Badge></span>
              </div>
              <div className="px-6 py-10 text-center">
                <p className="text-xl font-bold leading-relaxed whitespace-pre-line">{atual.frente}</p>
                {atual.origem && <p className="mt-2 text-sm text-muted">Motivo do erro: {atual.origem}</p>}
                {mostrar && <div className="entrar mt-6 rounded-lg bg-sunken p-5 text-left whitespace-pre-line">{atual.verso || 'Sem resposta cadastrada.'}</div>}
              </div>
              <div className="flex flex-wrap justify-center gap-2 border-t border-line bg-sunken/50 px-6 py-4">
                {!mostrar ? <Button onClick={() => setMostrar(true)} icone={<Eye size={16} />}>Mostrar resposta</Button> : (
                  <>
                    <Button variante="secundario" className="!text-bad" onClick={() => responder(atual, false)} icone={<X size={16} />}>Errei</Button>
                    <Button onClick={() => responder(atual, true)} icone={<Check size={16} />}>Acertei</Button>
                  </>
                )}
              </div>
            </Card>
            <p className="mt-3 text-center text-sm text-muted">{fila.length - 1} restantes hoje · +3 XP por revisão</p>
          </div>
        ) : <Card><Vazio icone={<RotateCcw size={22} />} titulo="Tudo revisado por hoje 🎉" texto="Volte amanhã ou adicione as questões que errou nos simulados e listas." acao={<Button variante="secundario" onClick={() => setModal(true)} icone={<Plus size={16} />}>Adicionar</Button>} /></Card>
      ) : (
        <Card>
          <CardTitulo titulo="Todos os itens" />
          {revisoes.dados.length ? (
            <ul className="divide-y divide-line -my-2">
              {revisoes.dados.map((r) => (
                <li key={r.id} className="group flex flex-wrap items-center gap-3 py-3">
                  <Badge tom={r.tipo === 'erro' ? 'bad' : 'brand'}>{r.tipo === 'erro' ? 'Erro' : 'Cartão'}</Badge>
                  <span className="flex-1 min-w-[180px] text-sm font-semibold truncate">{r.frente}</span>
                  <span className="text-xs text-muted">{(r.materia_id && nomeMat.get(r.materia_id)) || '—'}</span>
                  <span className={cx('text-xs font-bold', vencida(r.proxima, hoje) ? 'text-bad' : 'text-muted')}>{vencida(r.proxima, hoje) ? 'hoje' : dataBR(r.proxima)}</span>
                  <button type="button" aria-label="Apagar" onClick={() => revisoes.remover(r.id)} className="text-faint hover:text-bad p-1 md:opacity-0 group-hover:opacity-100"><Trash2 size={15} /></button>
                </li>
              ))}
            </ul>
          ) : <Vazio titulo="Nada cadastrado ainda" />}
        </Card>
      )}

      <Modal aberto={modal} titulo="Novo item de revisão" onFechar={() => setModal(false)}>
        <form onSubmit={salvar} className="flex flex-col gap-4">
          <Segmented rotulo="Tipo" valor={f.tipo} onChange={(v) => setF({ ...f, tipo: v })} opcoes={[{ valor: 'erro', rotulo: 'Questão que errei' }, { valor: 'cartao', rotulo: 'Flashcard' }]} />
          <Campo rotulo="Matéria">{(id) => (
            <Select id={id} value={f.materia_id} onChange={(e) => setF({ ...f, materia_id: e.target.value })}>
              <option value="">—</option>{materias.dados.map((m) => <option key={m.id} value={m.id}>{m.area} · {m.nome}</option>)}
            </Select>)}</Campo>
          <Campo rotulo={f.tipo === 'erro' ? 'Questão (resumo ou fonte, ex.: ENEM 2023 Q.112)' : 'Pergunta (frente)'}>{(id) => <Textarea id={id} rows={3} required value={f.frente} onChange={(e) => setF({ ...f, frente: e.target.value })} />}</Campo>
          <Campo rotulo={f.tipo === 'erro' ? 'Resolução certa / o que aprendi' : 'Resposta (verso)'}>{(id) => <Textarea id={id} rows={3} value={f.verso} onChange={(e) => setF({ ...f, verso: e.target.value })} />}</Campo>
          {f.tipo === 'erro' && <Campo rotulo="Por que errei?">{(id) => <Select id={id} value={f.origem} onChange={(e) => setF({ ...f, origem: e.target.value })}>{MOTIVOS.map((m) => <option key={m}>{m}</option>)}</Select>}</Campo>}
          <div className="flex justify-end gap-2"><Button variante="secundario" onClick={() => setModal(false)}>Fechar</Button><Button type="submit">Salvar e adicionar outro</Button></div>
        </form>
      </Modal>
    </div>
  )
}
