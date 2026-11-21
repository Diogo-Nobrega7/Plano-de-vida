import { useMemo, useState } from 'react'
import { CheckCircle2, ExternalLink, Focus, PlayCircle, Plus, Trash2, X } from 'lucide-react'
import { Badge, Button, Cabecalho, Camada, Campo, Card, Carregando, Input, Modal, Select, Textarea, Vazio, cx } from '@/components/ui'
import { useTabela } from '@/data/hooks'
import { hojeISO } from '@/lib/datas'
import type { Aula } from '@/data/tipos'
import { idYoutube, useCronometro } from './useCronometro'

function Player({ aula }: { aula: Aula }) {
  const id = idYoutube(aula.url)
  if (id) return (
    <div className="aspect-video w-full overflow-hidden rounded-xl bg-night shadow-md">
      <iframe className="h-full w-full" src={`https://www.youtube-nocookie.com/embed/${id}?rel=0`} title={aula.titulo}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
    </div>
  )
  return (
    <a href={aula.url} target="_blank" rel="noreferrer" className="aspect-video w-full rounded-xl bg-night grid place-items-center text-white gap-2 hover:brightness-125 transition">
      <span className="flex flex-col items-center gap-2 font-medium"><ExternalLink size={28} />Abrir aula em nova aba</span>
    </a>
  )
}

export function AulasPage() {
  const materias = useTabela('materias', [{ coluna: 'ordem' }])
  const conteudos = useTabela('conteudos', [{ coluna: 'ordem' }])
  const aulas = useTabela('aulas', [{ coluna: 'criado_em' }])
  const sessoes = useTabela('sessoes')
  const [selId, setSelId] = useState<string | null>(null)
  const [materiaFiltro, setMateriaFiltro] = useState('')
  const [modal, setModal] = useState(false)
  const [foco, setFoco] = useState(false)
  const [form, setForm] = useState({ materia_id: '', titulo: '', url: '', conteudo: '', canal: '' })
  const crono = useCronometro(25)

  const nomeMat = useMemo(() => new Map(materias.dados.map((m) => [m.id, m])), [materias.dados])
  const lista = aulas.dados.filter((a) => !materiaFiltro || a.materia_id === materiaFiltro)
  const sel = aulas.dados.find((a) => a.id === selId) ?? lista[0]

  if (aulas.carregando) return <Carregando />

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (!/^https?:\/\//.test(form.url)) return
    const ok = await aulas.inserir({ ...form, materia_id: form.materia_id || materias.dados[0].id, conteudo: form.conteudo || null, canal: form.canal || null, assistida: false, assistida_em: null, notas: null }, 'Aula salva')
    if (ok) { setModal(false); setForm({ materia_id: form.materia_id, titulo: '', url: '', conteudo: '', canal: '' }) }
  }

  async function registrarFoco() {
    const min = Math.round(crono.decorrido / 60)
    if (min > 0) await sessoes.inserir({ data: hojeISO(), materia_id: sel?.materia_id ?? null, minutos: min, questoes: null, acertos: null, observacoes: sel ? `Aula: ${sel.titulo}` : null }, `${min} min registrados`)
    crono.zerar(25)
  }

  const mat = sel ? nomeMat.get(sel.materia_id) : undefined

  const painel = sel && (
    <div className={cx('flex flex-col gap-4', foco && 'max-w-5xl mx-auto w-full')}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Caminho" className={cx('flex flex-wrap items-center gap-1.5 text-sm font-semibold', foco ? 'text-white/60' : 'text-muted')}>
          <span>{mat?.area}</span><span aria-hidden>›</span><span>{mat?.nome}</span>{sel.conteudo && <><span aria-hidden>›</span><span className={foco ? 'text-white' : 'text-ink'}>{sel.conteudo}</span></>}
        </nav>
        <Button variante={foco ? 'claro' : 'secundario'} tamanho="sm" onClick={() => setFoco(!foco)} icone={foco ? <X size={15} /> : <Focus size={15} />}>{foco ? 'Sair do Modo Foco' : 'Modo Foco'}</Button>
      </div>
      <Player aula={sel} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className={cx('titulo text-2xl', foco && 'text-white')}>{sel.titulo}</h2>
          {sel.canal && <p className={cx('text-sm', foco ? 'text-white/60' : 'text-muted')}>{sel.canal}</p>}
        </div>
        <Button variante={sel.assistida ? 'secundario' : 'primario'} icone={<CheckCircle2 size={16} />}
          onClick={() => aulas.atualizar(sel.id, { assistida: !sel.assistida, assistida_em: !sel.assistida ? hojeISO() : null }, !sel.assistida ? '+15 XP · aula assistida' : undefined)}>
          {sel.assistida ? 'Assistida' : 'Marcar como assistida'}
        </Button>
      </div>
      <div className={cx('grid gap-4', foco ? 'md:grid-cols-[1fr_280px]' : '')}>
        <Card className={foco ? '!bg-white/5 !border-white/10' : ''}>
          <label htmlFor="notas" className={cx('text-[13px] font-medium', foco ? 'text-white/70' : 'text-muted')}>Anotações da aula</label>
          <Textarea id="notas" rows={5} key={sel.id} defaultValue={sel.notas ?? ''} placeholder="Fórmulas, resumo, dúvidas…"
            onBlur={(e) => e.target.value !== (sel.notas ?? '') && aulas.atualizar(sel.id, { notas: e.target.value }, 'Anotações salvas')}
            className={cx('mt-2', foco && '!bg-white/5 !border-white/10 !text-white')} />
        </Card>
        {foco && (
          <Card className="!bg-white/5 !border-white/10 text-white flex flex-col items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.1em] text-white/60">Pomodoro</span>
            <span className="titulo text-5xl num">{crono.texto}</span>
            <div className="flex gap-2">
              {crono.rodando ? <Button variante="claro" onClick={crono.pausar}>Pausar</Button> : <Button variante="claro" onClick={crono.iniciar}>Iniciar</Button>}
              <Button variante="fantasma" className="!text-white/70" onClick={registrarFoco}>Encerrar</Button>
            </div>
            <span className="text-xs text-white/50 text-center">Ao encerrar, o tempo vira uma sessão e soma XP.</span>
          </Card>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <Cabecalho etiqueta="Estudos" titulo="Aulas" sub="Seus vídeos organizados por matéria, com player, anotações e Modo Foco."
        acao={<Button onClick={() => setModal(true)} icone={<Plus size={16} />}>Adicionar aula</Button>} />

      {!aulas.dados.length ? (
        <Card><Vazio icone={<PlayCircle size={24} />} titulo="Nenhuma aula ainda" texto="Cole o link de uma videoaula do YouTube e escolha a matéria. Comece pelos conteúdos de frequência alta." acao={<Button onClick={() => setModal(true)} icone={<Plus size={16} />}>Adicionar aula</Button>} /></Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px] items-start">
          <div>{painel}</div>
          <Card className="!p-2">
            <div className="p-2">
              <Select aria-label="Filtrar por matéria" value={materiaFiltro} onChange={(e) => setMateriaFiltro(e.target.value)}>
                <option value="">Todas as matérias</option>
                {materias.dados.filter((m) => aulas.dados.some((a) => a.materia_id === m.id)).map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </Select>
            </div>
            <p className="px-3 pt-1 pb-2 text-xs font-medium text-muted">{lista.filter((a) => a.assistida).length} de {lista.length} assistidas</p>
            <ul className="flex flex-col gap-1">
              {lista.map((a, i) => (
                <li key={a.id} className="group flex items-center">
                  <button type="button" onClick={() => setSelId(a.id)}
                    className={cx('flex flex-1 items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors min-w-0', sel?.id === a.id ? 'bg-brand-soft' : 'hover:bg-sunken')}>
                    <span className={cx('grid h-7 w-7 shrink-0 place-items-center rounded-md text-xs font-semibold', a.assistida ? 'bg-ok text-white' : sel?.id === a.id ? 'bg-brand text-white' : 'bg-sunken text-muted')}>
                      {a.assistida ? <CheckCircle2 size={15} /> : i + 1}
                    </span>
                    <span className="min-w-0"><span className="block text-sm font-medium truncate">{a.titulo}</span><span className="block text-xs text-muted truncate">{nomeMat.get(a.materia_id)?.nome}{a.conteudo ? ` · ${a.conteudo}` : ''}</span></span>
                  </button>
                  <button type="button" aria-label={`Apagar ${a.titulo}`} onClick={() => aulas.remover(a.id)} className="p-2 text-faint opacity-0 group-hover:opacity-100 hover:text-bad"><Trash2 size={15} /></button>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {foco && sel && (
        <Camada><div className="fixed inset-0 z-40 overflow-auto bg-night p-4 md:p-10">{painel}</div></Camada>
      )}

      <Modal aberto={modal} titulo="Adicionar aula" onFechar={() => setModal(false)}>
        <form onSubmit={salvar} className="flex flex-col gap-4">
          <Campo rotulo="Matéria">{(id) => (
            <Select id={id} value={form.materia_id} onChange={(e) => setForm({ ...form, materia_id: e.target.value, conteudo: '' })}>
              {materias.dados.map((m) => <option key={m.id} value={m.id}>{m.area} · {m.nome}</option>)}
            </Select>)}</Campo>
          <Campo rotulo="Título">{(id) => <Input id={id} required value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />}</Campo>
          <Campo rotulo="Link" dica="YouTube abre aqui dentro; outros sites abrem em nova aba.">{(id) => <Input id={id} required type="url" placeholder="https://www.youtube.com/watch?v=…" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />}</Campo>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="Conteúdo (opcional)">{(id) => (
              <Select id={id} value={form.conteudo} onChange={(e) => setForm({ ...form, conteudo: e.target.value })}>
                <option value="">—</option>
                {conteudos.dados.filter((c) => c.materia_id === (form.materia_id || materias.dados[0]?.id)).map((c) => <option key={c.id}>{c.nome}</option>)}
              </Select>)}</Campo>
            <Campo rotulo="Canal (opcional)">{(id) => <Input id={id} value={form.canal} onChange={(e) => setForm({ ...form, canal: e.target.value })} />}</Campo>
          </div>
          <div className="flex justify-end gap-2"><Badge tom="brand">+15 XP ao assistir</Badge><Button type="submit">Salvar aula</Button></div>
        </form>
      </Modal>
    </div>
  )
}
