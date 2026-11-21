import { useMemo, useState } from 'react'
import { CalendarDays, Check, Clock, Plus, Sparkles, Trash2, Wand2 } from 'lucide-react'
import { Badge, Button, Cabecalho, Campo, Card, CardTitulo, Input, Modal, NumberInput, Progress, Select, Stat, StatRow, Vazio, cx } from '@/components/ui'
import { useTabela } from '@/data/hooks'
import { hojeISO, inicioSemana, somarDias } from '@/lib/datas'
import { minutos as fmtMin } from '@/lib/format'
import { DIAS, DIAS_CURTOS, conflita, diaDaSemana, fimDoBloco, sugerirSemana } from '@/lib/cronograma'
import type { Bloco } from '@/data/tipos'

const COR_AREA: Record<string, string> = { Linguagens: '#38BDF8', Humanas: '#FB923C', Natureza: '#34D399', 'Matemática': '#5482FF', 'Redação': '#A78BFA' }
const PESO_FREQ: Record<string, number> = { Alta: 3, 'Média': 2, Baixa: 1 }

export function CronogramaPage() {
  const blocos = useTabela('cronograma', [{ coluna: 'dia' }, { coluna: 'inicio' }])
  const materias = useTabela('materias', [{ coluna: 'ordem' }])
  const conteudos = useTabela('conteudos')
  const sessoes = useTabela('sessoes')
  const hoje = hojeISO()
  const diaHoje = diaDaSemana(hoje)
  const [diaMovel, setDiaMovel] = useState(String(diaHoje))
  const [edit, setEdit] = useState<Partial<Bloco> | null>(null)
  const [sugerir, setSugerir] = useState(false)
  const [cfg, setCfg] = useState({ util: 3 as number | null, sab: 3 as number | null, dom: 1 as number | null, inicio: '14:00', bloco: 50 as number | null, substituir: true })

  const mat = useMemo(() => new Map(materias.dados.map((m) => [m.id, m])), [materias.dados])
  const segunda = inicioSemana(hoje)
  const feitosSemana = useMemo(() => new Set(sessoes.dados.filter((s) => s.cronograma_id && s.data >= segunda).map((s) => `${s.cronograma_id}|${s.data}`)), [sessoes.dados, segunda])
  const feito = (b: Bloco, dia = b.dia) => feitosSemana.has(`${b.id}|${somarDias(segunda, dia)}`)
  const porDia = (d: number) => blocos.dados.filter((b) => b.dia === d)

  const totalMin = blocos.dados.reduce((s, b) => s + b.minutos, 0)
  // Blocos que já deviam ter acontecido nesta semana (ignora dias antes de o bloco ser criado).
  const passados = blocos.dados.filter((b) => {
    if (b.dia > diaHoje) return false
    const criado = b.criado_em?.slice(0, 10)
    return !criado || criado < segunda || b.dia >= diaDaSemana(criado)
  })
  const cumpridos = passados.filter((b) => feito(b)).length
  const deHoje = porDia(diaHoje)

  async function concluir(b: Bloco) {
    if (feito(b)) return
    await sessoes.inserir({ data: hoje, materia_id: b.materia_id, minutos: b.minutos, questoes: null, acertos: null, observacoes: b.titulo || 'Bloco do cronograma', cronograma_id: b.id }, `Bloco concluído · +${b.minutos} XP`)
  }

  async function salvarBloco(e: React.FormEvent) {
    e.preventDefault()
    const d = { dia: Number(edit!.dia ?? 0), inicio: edit!.inicio || '14:00', minutos: Number(edit!.minutos || 50), materia_id: edit!.materia_id || null, titulo: edit!.titulo?.trim() || null }
    const ok = edit!.id ? await blocos.atualizar(edit!.id, d, 'Bloco salvo') : await blocos.inserir(d, 'Bloco criado')
    if (ok) setEdit(null)
  }

  async function gerar() {
    // Peso de cada matéria = conteúdos ainda não dominados, valendo mais os que caem muito.
    const prioridades = materias.dados.map((m) => ({
      materia_id: m.id,
      peso: conteudos.dados.filter((c) => c.materia_id === m.id && c.status !== 'dominado').reduce((s, c) => s + (PESO_FREQ[c.frequencia] ?? 1), 0),
    }))
    const u = cfg.util ?? 0
    const novos = sugerirSemana([u, u, u, u, u, cfg.sab ?? 0, cfg.dom ?? 0], prioridades, cfg.inicio, cfg.bloco || 50)
    if (!novos.length) return
    if (cfg.substituir && blocos.dados.length) await blocos.remover(blocos.dados.map((b) => b.id), 'Cronograma anterior apagado')
    if (await blocos.inserir(novos, `${novos.length} blocos criados`)) setSugerir(false)
  }

  const conflitos = edit ? blocos.dados.filter((b) => b.id !== edit.id && conflita({ dia: Number(edit.dia ?? 0), inicio: edit.inicio || '00:00', minutos: Number(edit.minutos || 0) }, b)) : []

  const CartaoBloco = ({ b, dia }: { b: Bloco; dia: number }) => {
    const m = b.materia_id ? mat.get(b.materia_id) : undefined
    const ok = feito(b, dia)
    return (
      <button type="button" onClick={() => setEdit(b)}
        className={cx('group w-full text-left rounded-lg border-l-[3px] bg-surface px-3 py-2.5 shadow-sm ring-1 ring-line transition hover:shadow-md', ok && 'opacity-60')}
        style={{ borderLeftColor: COR_AREA[m?.area ?? ''] ?? 'rgb(var(--faint))' }}>
        <span className="flex items-center justify-between gap-1 text-[11px] font-medium text-muted num">{b.inicio}–{fimDoBloco(b.inicio, b.minutos)}{ok && <Check size={13} className="text-ok" strokeWidth={3} />}</span>
        <span className={cx('block text-[13px] font-medium leading-snug mt-0.5', ok && 'line-through')}>{b.titulo || m?.nome || 'Estudo livre'}</span>
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Cabecalho etiqueta="Estudos" titulo="Cronograma" sub="Sua semana de estudos em blocos. Concluir um bloco registra a sessão e soma XP."
        acao={<><Button variante="secundario" icone={<Wand2 size={16} />} onClick={() => setSugerir(true)}>Sugerir semana</Button><Button icone={<Plus size={16} />} onClick={() => setEdit({ dia: diaHoje, inicio: '14:00', minutos: 50 })}>Novo bloco</Button></>} />

      {!blocos.dados.length ? (
        <Card><Vazio icone={<CalendarDays size={22} />} titulo="Nenhum bloco ainda" texto="Diga quantas horas você tem por dia e o Rumo monta a semana, dando mais tempo às matérias com mais conteúdo pendente e que mais caem."
          acao={<Button icone={<Sparkles size={16} />} onClick={() => setSugerir(true)}>Montar minha semana</Button>} /></Card>
      ) : (
        <>
          <StatRow>
            <Stat rotulo="Planejado na semana" valor={fmtMin(totalMin)} sub={`${blocos.dados.length} blocos`} />
            <Stat rotulo="Hoje" valor={`${deHoje.filter((b) => feito(b)).length}/${deHoje.length}`} sub="blocos concluídos" />
            <Stat rotulo="Cumprido até hoje" valor={passados.length ? `${Math.round((cumpridos / passados.length) * 100)}%` : '—'} sub={`${cumpridos} de ${passados.length} blocos`} tom={passados.length && cumpridos / passados.length >= 0.7 ? 'ok' : 'muted'} />
            <Stat rotulo="Média por dia" valor={fmtMin(Math.round(totalMin / 7))} />
          </StatRow>

          <Card>
            <CardTitulo titulo={`Hoje · ${DIAS[diaHoje]}`} sub={deHoje.length ? 'Toque em concluir quando terminar cada bloco' : 'Dia livre no cronograma'} icone={<Clock size={18} />} />
            {deHoje.length > 0 && (
              <>
                <Progress valor={deHoje.filter((b) => feito(b)).length / deHoje.length} className="mb-4" />
                <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {deHoje.map((b) => {
                    const m = b.materia_id ? mat.get(b.materia_id) : undefined, ok = feito(b)
                    return (
                      <li key={b.id} className={cx('flex items-center gap-3 rounded-lg p-3', ok ? 'bg-ok-soft' : 'bg-sunken')}>
                        <span className="h-9 w-1.5 rounded-full shrink-0" style={{ background: COR_AREA[m?.area ?? ''] ?? 'rgb(var(--faint))' }} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium truncate">{b.titulo || m?.nome || 'Estudo livre'}</span>
                          <span className="block text-xs text-muted num">{b.inicio}–{fimDoBloco(b.inicio, b.minutos)} · {fmtMin(b.minutos)}</span>
                        </span>
                        {ok ? <Badge tom="ok"><Check size={12} />feito</Badge> : <Button tamanho="sm" onClick={() => concluir(b)}>Concluir</Button>}
                      </li>
                    )
                  })}
                </ul>
              </>
            )}
          </Card>

          <div className="md:hidden">
            <div role="group" aria-label="Dia" className="grid grid-cols-7 gap-1 rounded-md bg-sunken p-1">
              {DIAS_CURTOS.map((d, i) => (
                <button key={d} type="button" aria-pressed={diaMovel === String(i)} onClick={() => setDiaMovel(String(i))}
                  className={cx('h-9 rounded-[9px] text-[13px] font-medium transition-all', diaMovel === String(i) ? 'bg-surface text-brand shadow-sm' : 'text-muted', i === diaHoje && diaMovel !== String(i) && 'text-brand')}>{d}</button>
              ))}
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {porDia(Number(diaMovel)).map((b) => <CartaoBloco key={b.id} b={b} dia={Number(diaMovel)} />)}
              {!porDia(Number(diaMovel)).length && <p className="text-sm text-muted py-4 text-center">Dia livre.</p>}
            </div>
          </div>

          <div className="hidden md:grid grid-cols-7 gap-2.5">
            {DIAS_CURTOS.map((d, i) => {
              const lista = porDia(i)
              return (
                <div key={d} className={cx('rounded-xl p-2.5 flex flex-col gap-2 min-h-[220px]', i === diaHoje ? 'bg-brand-soft ring-1 ring-brand/30' : 'bg-sunken/70')}>
                  <div className="flex items-baseline justify-between px-1">
                    <span className={cx('text-sm font-semibold', i === diaHoje && 'text-brand')}>{d}</span>
                    <span className="text-[11px] font-medium text-muted">{lista.length ? fmtMin(lista.reduce((s, b) => s + b.minutos, 0)) : ''}</span>
                  </div>
                  {lista.map((b) => <CartaoBloco key={b.id} b={b} dia={i} />)}
                  <button type="button" onClick={() => setEdit({ dia: i, inicio: lista.length ? fimDoBloco(lista[lista.length - 1].inicio, lista[lista.length - 1].minutos + 10) : '14:00', minutos: 50 })}
                    className="mt-auto rounded-lg border border-dashed border-line py-2 text-xs font-medium text-muted hover:text-brand hover:border-brand/40 transition" aria-label={`Adicionar bloco na ${DIAS[i]}`}>+ bloco</button>
                </div>
              )
            })}
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-muted">{Object.entries(COR_AREA).map(([a, c]) => <span key={a} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: c }} />{a}</span>)}</div>
        </>
      )}

      <Modal aberto={!!edit} titulo={edit?.id ? 'Editar bloco' : 'Novo bloco'} onFechar={() => setEdit(null)}>
        {edit && (
          <form onSubmit={salvarBloco} className="flex flex-col gap-4">
            <div className="grid gap-4 grid-cols-3">
              <Campo rotulo="Dia">{(id) => <Select id={id} value={edit.dia ?? 0} onChange={(e) => setEdit({ ...edit, dia: Number(e.target.value) })}>{DIAS.map((d, i) => <option key={d} value={i}>{d}</option>)}</Select>}</Campo>
              <Campo rotulo="Início">{(id) => <Input id={id} type="time" required value={edit.inicio ?? ''} onChange={(e) => setEdit({ ...edit, inicio: e.target.value })} />}</Campo>
              <Campo rotulo="Minutos">{(id) => <NumberInput id={id} min={5} max={600} step={5} required value={edit.minutos ?? null} onValor={(v) => setEdit({ ...edit, minutos: v ?? 0 })} />}</Campo>
            </div>
            <Campo rotulo="Matéria">{(id) => (
              <Select id={id} value={edit.materia_id ?? ''} onChange={(e) => setEdit({ ...edit, materia_id: e.target.value || null })}>
                <option value="">Estudo livre</option>{materias.dados.map((m) => <option key={m.id} value={m.id}>{m.area} · {m.nome}</option>)}
              </Select>)}</Campo>
            <Campo rotulo="O que estudar (opcional)">{(id) => <Input id={id} placeholder="Ex.: lista de Estequiometria" value={edit.titulo ?? ''} onChange={(e) => setEdit({ ...edit, titulo: e.target.value })} />}</Campo>
            {conflitos.length > 0 && <p className="rounded-lg bg-fire-soft px-3 py-2.5 text-sm font-semibold text-fire">Esse horário bate com outro bloco ({conflitos.map((c) => c.inicio).join(', ')}).</p>}
            <div className="flex justify-between gap-2">
              {edit.id ? <Button variante="perigo" icone={<Trash2 size={15} />} onClick={async () => { if (await blocos.remover(edit.id!, 'Bloco apagado')) setEdit(null) }}>Apagar</Button> : <span />}
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal aberto={sugerir} titulo="Montar minha semana" onFechar={() => setSugerir(false)}>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">Quanto tempo você tem para estudar? O Rumo divide em blocos de foco com 10 min de pausa e dá mais blocos às matérias com mais conteúdo pendente e de alta frequência no ENEM.</p>
          <div className="grid gap-4 grid-cols-3">
            <Campo rotulo="Seg a sex (h/dia)">{(id) => <NumberInput id={id} min={0} max={12} step={0.5} value={cfg.util} onValor={(v) => setCfg({ ...cfg, util: v })} />}</Campo>
            <Campo rotulo="Sábado (h)">{(id) => <NumberInput id={id} min={0} max={12} step={0.5} value={cfg.sab} onValor={(v) => setCfg({ ...cfg, sab: v })} />}</Campo>
            <Campo rotulo="Domingo (h)">{(id) => <NumberInput id={id} min={0} max={12} step={0.5} value={cfg.dom} onValor={(v) => setCfg({ ...cfg, dom: v })} />}</Campo>
            <Campo rotulo="Começa às">{(id) => <Input id={id} type="time" value={cfg.inicio} onChange={(e) => setCfg({ ...cfg, inicio: e.target.value })} />}</Campo>
            <Campo rotulo="Bloco (min)">{(id) => <NumberInput id={id} min={20} max={120} step={5} value={cfg.bloco} onValor={(v) => setCfg({ ...cfg, bloco: v })} />}</Campo>
          </div>
          {blocos.dados.length > 0 && <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="h-4 w-4" checked={cfg.substituir} onChange={(e) => setCfg({ ...cfg, substituir: e.target.checked })} />Substituir o cronograma atual ({blocos.dados.length} blocos)</label>}
          <div className="flex justify-end"><Button icone={<Sparkles size={16} />} onClick={gerar}>Gerar semana</Button></div>
        </div>
      </Modal>
    </div>
  )
}
