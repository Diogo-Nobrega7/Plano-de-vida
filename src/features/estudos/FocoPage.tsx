import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Pause, Play, Plus, RotateCcw, Square, Trash2 } from 'lucide-react'
import { Anel, Badge, Button, Cabecalho, Campo, Card, CardTitulo, Input, Modal, NumberInput, Select, Segmented, Vazio, eixo, DicaGrafico } from '@/components/ui'
import { useTabela } from '@/data/hooks'
import { hojeISO, somarDias } from '@/lib/datas'
import { dataBR, dataCurta, minutos, numero } from '@/lib/format'
import { useCronometro } from './useCronometro'

export function FocoPage() {
  const materias = useTabela('materias', [{ coluna: 'ordem' }])
  const sessoes = useTabela('sessoes', [{ coluna: 'data', asc: false }, { coluna: 'criado_em', asc: false }])
  const [preset, setPreset] = useState<'25' | '50' | '90'>('25')
  const crono = useCronometro(25)
  const [materiaId, setMateriaId] = useState('')
  const [modal, setModal] = useState(false)
  const [f, setF] = useState({ data: hojeISO(), minutos: 25 as number | null, questoes: null as number | null, acertos: null as number | null, observacoes: '' })

  useEffect(() => { if (crono.terminou) abrirRegistro() }, [crono.terminou]) // eslint-disable-line react-hooks/exhaustive-deps

  function abrirRegistro(min?: number) {
    setF({ data: hojeISO(), minutos: min ?? Math.max(1, Math.round(crono.decorrido / 60)), questoes: null, acertos: null, observacoes: '' })
    setModal(true)
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (!f.minutos || f.minutos <= 0) return
    const ok = await sessoes.inserir({ ...f, minutos: f.minutos, materia_id: materiaId || null, acertos: f.questoes ? Math.min(f.acertos ?? 0, f.questoes) : null, observacoes: f.observacoes || null }, `Sessão salva · +${f.minutos + (f.questoes ?? 0) * 2} XP`)
    if (ok) { setModal(false); crono.zerar(Number(preset)) }
  }

  const nomeMat = new Map(materias.dados.map((m) => [m.id, m.nome]))
  const hoje = hojeISO()
  const dias = useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const d = somarDias(hoje, i - 13)
    return { dia: dataCurta(d), horas: sessoes.dados.filter((s) => s.data === d).reduce((a, s) => a + s.minutos, 0) / 60 }
  }), [sessoes.dados, hoje])
  const porMateria = useMemo(() => {
    const m = new Map<string, number>()
    for (const s of sessoes.dados) { const k = (s.materia_id && nomeMat.get(s.materia_id)) || 'Sem matéria'; m.set(k, (m.get(k) ?? 0) + s.minutos) }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [sessoes.dados, materias.dados]) // eslint-disable-line react-hooks/exhaustive-deps
  const maxMat = porMateria[0]?.[1] ?? 1
  const hojeMin = sessoes.dados.filter((s) => s.data === hoje).reduce((a, s) => a + s.minutos, 0)

  return (
    <div className="flex flex-col gap-6">
      <Cabecalho etiqueta="Estudos" titulo="Foco" sub="Cronômetro Pomodoro e registro das sessões. Cada minuto vale 1 XP, cada questão 2." acao={<Button variante="secundario" onClick={() => abrirRegistro(50)} icone={<Plus size={16} />}>Registrar sessão manual</Button>} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.1fr_1fr]">
        <section className="hero rounded-2xl p-6 md:p-8 text-white shadow-md flex flex-col items-center gap-6">
          <Segmented rotulo="Duração" valor={preset} onChange={(v) => { setPreset(v); crono.zerar(Number(v)) }}
            opcoes={[{ valor: '25', rotulo: '25 min' }, { valor: '50', rotulo: '50 min' }, { valor: '90', rotulo: '90 min' }]} />
          <Anel valor={crono.decorrido / crono.duracao} tamanho={240} espessura={14} cor="#fff" fundo="rgb(255 255 255 / .18)">
            <span>
              <span className="titulo text-6xl num block leading-none">{crono.texto}</span>
              <span className="text-sm font-medium text-white/70">{crono.rodando ? 'focando…' : crono.decorrido ? 'pausado' : 'pronto'}</span>
            </span>
          </Anel>
          <Select aria-label="Matéria da sessão" value={materiaId} onChange={(e) => setMateriaId(e.target.value)} className="max-w-xs !bg-white/10 !border-white/20 !text-white">
            <option value="" className="text-ink">Escolha a matéria</option>
            {materias.dados.map((m) => <option key={m.id} value={m.id} className="text-ink">{m.nome}</option>)}
          </Select>
          <div className="flex gap-2">
            {crono.rodando
              ? <Button variante="claro" onClick={crono.pausar} icone={<Pause size={16} />}>Pausar</Button>
              : <Button variante="claro" onClick={crono.iniciar} icone={<Play size={16} />}>{crono.decorrido ? 'Continuar' : 'Começar'}</Button>}
            <Button variante="fantasma" className="!text-white/80 hover:!bg-white/10" disabled={!crono.decorrido} onClick={() => abrirRegistro()} icone={<Square size={15} />}>Encerrar e salvar</Button>
            <Button variante="fantasma" className="!text-white/80 hover:!bg-white/10" onClick={() => crono.zerar(Number(preset))} icone={<RotateCcw size={15} />}>Zerar</Button>
          </div>
        </section>

        <Card>
          <CardTitulo titulo="Últimos 14 dias" sub={`Hoje: ${minutos(hojeMin)}`} />
          <div className="h-48">
            <ResponsiveContainer>
              <BarChart data={dias} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <XAxis dataKey="dia" {...eixo} interval={1} />
                <YAxis {...eixo} allowDecimals={false} />
                <Tooltip cursor={{ fill: 'rgb(var(--sunken))' }} content={<DicaGrafico formato={(v: number) => minutos(v * 60)} />} />
                <Bar dataKey="horas" name="Foco" fill="rgb(var(--brand))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-col gap-2.5">
            <p className="text-[13px] font-medium text-muted">Por matéria</p>
            {porMateria.map(([nome, min]) => (
              <div key={nome} className="flex items-center gap-3 text-sm">
                <span className="w-36 truncate font-semibold">{nome}</span>
                <span className="flex-1 h-2 rounded-full bg-sunken"><span className="block h-full rounded-full bg-brand" style={{ width: `${(min / maxMat) * 100}%` }} /></span>
                <span className="w-14 text-right text-muted num">{minutos(min)}</span>
              </div>
            ))}
            {!porMateria.length && <p className="text-sm text-muted">Nenhuma sessão ainda.</p>}
          </div>
        </Card>
      </div>

      <Card>
        <CardTitulo titulo="Histórico de sessões" sub={`${sessoes.dados.length} sessões · ${minutos(sessoes.dados.reduce((a, s) => a + s.minutos, 0))}`} />
        {sessoes.dados.length ? (
          <ul className="divide-y divide-line -my-2">
            {sessoes.dados.slice(0, 40).map((s) => (
              <li key={s.id} className="group flex flex-wrap items-center gap-3 py-3">
                <span className="w-24 text-sm font-medium text-muted">{dataBR(s.data)}</span>
                <span className="flex-1 min-w-[140px] text-sm font-semibold">{(s.materia_id && nomeMat.get(s.materia_id)) || 'Sem matéria'}{s.observacoes && <span className="font-normal text-muted"> · {s.observacoes}</span>}</span>
                {s.questoes ? <Badge tom="brand">{s.acertos ?? 0}/{s.questoes} questões</Badge> : null}
                <Badge>{minutos(s.minutos)}</Badge>
                <button type="button" aria-label="Apagar sessão" onClick={() => sessoes.remover(s.id)} className="text-faint hover:text-bad p-1 md:opacity-0 group-hover:opacity-100"><Trash2 size={15} /></button>
              </li>
            ))}
          </ul>
        ) : <Vazio titulo="Sem sessões ainda" texto="Comece um Pomodoro: ao terminar, a sessão aparece aqui e soma na sua sequência de dias." />}
      </Card>

      <Modal aberto={modal} titulo="Salvar sessão" onFechar={() => setModal(false)}>
        <form onSubmit={salvar} className="flex flex-col gap-4">
          <div className="grid gap-4 grid-cols-2">
            <Campo rotulo="Data">{(id) => <Input id={id} type="date" value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} />}</Campo>
            <Campo rotulo="Minutos">{(id) => <NumberInput id={id} min={1} required value={f.minutos} onValor={(v) => setF({ ...f, minutos: v })} />}</Campo>
            <Campo rotulo="Questões feitas">{(id) => <NumberInput id={id} min={0} value={f.questoes} onValor={(v) => setF({ ...f, questoes: v })} />}</Campo>
            <Campo rotulo="Acertos">{(id) => <NumberInput id={id} min={0} value={f.acertos} onValor={(v) => setF({ ...f, acertos: v })} />}</Campo>
          </div>
          <Campo rotulo="Matéria">{(id) => (
            <Select id={id} value={materiaId} onChange={(e) => setMateriaId(e.target.value)}>
              <option value="">Sem matéria</option>
              {materias.dados.map((m) => <option key={m.id} value={m.id}>{m.area} · {m.nome}</option>)}
            </Select>)}</Campo>
          <Campo rotulo="O que estudou (opcional)">{(id) => <Input id={id} value={f.observacoes} onChange={(e) => setF({ ...f, observacoes: e.target.value })} />}</Campo>
          <div className="flex items-center justify-between gap-2">
            <Badge tom="brand">+{numero((f.minutos ?? 0) + (f.questoes ?? 0) * 2)} XP</Badge>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
