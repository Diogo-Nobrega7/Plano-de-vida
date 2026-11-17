import { useEffect, useMemo, useState } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertTriangle, CheckCircle2, ChevronDown, Copy, PenLine, Plus, Save, Sparkles, Trash2 } from 'lucide-react'
import { Badge, Button, Cabecalho, Card, CardTitulo, Input, Segmented, Select, Textarea, Vazio, cx, toast } from '@/components/ui'
import { useTabela } from '@/data/hooks'
import { link } from '@/app/routes'
import { hojeISO } from '@/lib/datas'
import { dataBR, dataCurta, numero } from '@/lib/format'
import { COMPETENCIAS, MOTIVOS_ZERO, NIVEIS, NOTAS_1000, analisar, notaTotal, promptCorrecao, type ChaveC } from '@/lib/redacao'
import type { Redacao } from '@/data/tipos'

const CHAVES: ChaveC[] = ['c1', 'c2', 'c3', 'c4', 'c5']
const CORES = ['#1D4ED8', '#0EA5E9', '#16A34A', '#EA580C', '#7C3AED']
type Notas = Record<ChaveC, number>

function Correcao({ notas, onChange }: { notas: Notas; onChange: (n: Notas) => void }) {
  return (
    <div className="flex flex-col gap-4">
      {CHAVES.map((k) => (
        <div key={k} className="flex flex-col gap-2 pb-4 border-b border-line last:border-0 last:pb-0">
          <div className="flex items-baseline justify-between"><span className="text-sm font-extrabold">{COMPETENCIAS[k].nome}</span><span className="titulo text-brand num">{notas[k]}</span></div>
          <div role="group" aria-label={COMPETENCIAS[k].nome} className="grid grid-cols-6 gap-1">
            {NIVEIS.map((v) => (
              <button key={v} type="button" aria-pressed={notas[k] === v} onClick={() => onChange({ ...notas, [k]: v })}
                className={cx('h-9 rounded-md text-[13px] font-bold border transition-all', notas[k] === v ? 'bg-brand text-brand-ink border-brand shadow-sm' : 'border-line hover:border-brand/50 hover:bg-brand-soft')}>{v}</button>
            ))}
          </div>
          <p className="text-xs text-muted leading-relaxed">{COMPETENCIAS[k].niveis[notas[k]]}</p>
        </div>
      ))}
    </div>
  )
}

function Escrever() {
  const temas = useTabela('temas', [{ coluna: 'origem' }, { coluna: 'ano', asc: false }])
  const redacoes = useTabela('redacoes')
  const [tema, setTema] = useState(() => sessionStorage.getItem('rumo:tema') || '')
  const [texto, setTexto] = useState(() => localStorage.getItem('rumo:rascunho') || '')
  const [notas, setNotas] = useState<Notas>({ c1: 120, c2: 120, c3: 120, c4: 120, c5: 120 })
  const [corretor, setCorretor] = useState<'Eu' | 'IA' | 'Professor'>('Eu')
  const [comentarios, setComentarios] = useState('')

  useEffect(() => { localStorage.setItem('rumo:rascunho', texto) }, [texto])
  useEffect(() => { if (!tema && temas.dados[0]) setTema(temas.dados.find((t) => t.ano === 2026)?.tema ?? temas.dados[0].tema) }, [temas.dados, tema])

  const a = useMemo(() => analisar(texto, tema), [texto, tema])
  const total = notaTotal(notas)!

  async function salvar() {
    if (!texto.trim()) return toast('Escreva a redação antes de salvar.', 'erro')
    const ok = await redacoes.inserir({ data: hojeISO(), tema, texto, ...notas, corretor, comentarios: comentarios || null }, `Redação salva · ${total} pontos · +60 XP`)
    if (ok) { setTexto(''); setComentarios(''); location.hash = link('redacao', 'minhas') }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px] items-start">
      <div className="flex flex-col gap-4">
        <Card className="!p-4">
          <label htmlFor="tema" className="text-xs font-extrabold uppercase tracking-[0.1em] text-brand">Tema</label>
          <Select id="tema" value={tema} onChange={(e) => { setTema(e.target.value); sessionStorage.setItem('rumo:tema', e.target.value) }} className="mt-1.5 !h-auto py-2.5 font-bold">
            {temas.dados.map((t) => <option key={t.id} value={t.tema}>{t.ano ? `ENEM ${t.ano} · ` : 'Treino · '}{t.tema}</option>)}
          </Select>
        </Card>
        <Card className="!p-0 overflow-hidden">
          <Textarea aria-label="Sua redação" value={texto} onChange={(e) => setTexto(e.target.value)} rows={20}
            placeholder="Escreva ou cole aqui. Separe os parágrafos com uma linha em branco. O rascunho é salvo neste navegador."
            className="!rounded-none !border-0 !ring-0 font-serif !text-[17px] !leading-[1.85] px-6 py-5 bg-[linear-gradient(transparent_calc(1.85em-1px),rgb(var(--line)/.6)_1px)] bg-[length:100%_1.85em] [background-position-y:1.25rem]" />
          <div className="grid grid-cols-4 border-t border-line divide-x divide-line">
            {[['Palavras', a.palavras], ['Linhas (est.)', a.linhas], ['Parágrafos', a.paragrafos], ['Conectivos', a.conectivos.length]].map(([r, v]) => (
              <div key={r} className="px-4 py-3"><p className="text-[11px] font-bold text-muted">{r}</p><p className="titulo text-xl num">{v}</p></div>
            ))}
          </div>
        </Card>
        {texto.trim() && (
          <Card>
            <CardTitulo titulo="Pré-análise automática" sub="Sinais no texto, não a nota. Revise antes de corrigir." icone={<Sparkles size={18} />} />
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-[13px] font-bold text-muted mr-1 self-center">Proposta:</span>
              {Object.entries(a.elementos).map(([k, v]) => <Badge key={k} tom={v ? 'ok' : 'neutro'}>{v ? '✓' : '·'} {k}</Badge>)}
            </div>
            <ul className="flex flex-col gap-2">
              {a.fortes.map((x) => <li key={x} className="flex gap-2.5 text-sm rounded-md bg-ok-soft px-3 py-2.5"><CheckCircle2 size={17} className="text-ok shrink-0 mt-px" />{x}</li>)}
              {a.alertas.map((x) => <li key={x} className="flex gap-2.5 text-sm rounded-md bg-fire-soft px-3 py-2.5"><AlertTriangle size={17} className="text-fire shrink-0 mt-px" />{x}</li>)}
            </ul>
          </Card>
        )}
      </div>

      <div className="flex flex-col gap-4 lg:sticky lg:top-32">
        <section className="rounded-xl bg-night text-white p-5 shadow-md">
          <p className="text-[13px] font-bold text-white/60">Nota da correção</p>
          <p className="titulo text-6xl num">{total}</p>
          <p className="text-xs text-white/50">Cartilha do Participante 2026 (Inep)</p>
        </section>
        <Card className="!p-5">
          <Segmented rotulo="Quem corrigiu" valor={corretor} onChange={setCorretor} opcoes={[{ valor: 'Eu', rotulo: 'Eu' }, { valor: 'IA', rotulo: 'Claude' }, { valor: 'Professor', rotulo: 'Professor' }]} />
          {corretor === 'IA' && (
            <div className="mt-4 rounded-lg bg-brand-soft p-3 text-sm">
              <p>Copie o pedido de correção, cole numa conversa no claude.ai e depois lance aqui as notas.</p>
              <Button tamanho="sm" className="mt-2" icone={<Copy size={14} />} onClick={() => navigator.clipboard.writeText(promptCorrecao(tema, texto)).then(() => toast('Copiado! Cole no claude.ai'))}>Copiar pedido de correção</Button>
            </div>
          )}
          <div className="mt-5"><Correcao notas={notas} onChange={setNotas} /></div>
          <Textarea aria-label="Comentários" rows={2} placeholder="Comentários da correção (opcional)" value={comentarios} onChange={(e) => setComentarios(e.target.value)} className="mt-4" />
          <Button className="w-full mt-4" icone={<Save size={16} />} onClick={salvar}>Salvar redação</Button>
        </Card>
      </div>
    </div>
  )
}

function Minhas() {
  const redacoes = useTabela('redacoes', [{ coluna: 'data' }, { coluna: 'criado_em' }])
  const [aberta, setAberta] = useState<string | null>(null)
  const corrigidas = redacoes.dados.filter((r) => notaTotal(r) != null)
  if (!redacoes.dados.length) return <Card><Vazio icone={<PenLine size={22} />} titulo="Nenhuma redação ainda" texto="Meta: uma por semana. Escolha um tema e comece." acao={<a href={link('redacao', 'escrever')}><Button icone={<Plus size={16} />}>Escrever</Button></a>} /></Card>

  const medias = Object.fromEntries(CHAVES.map((k) => [k, corrigidas.reduce((s, r) => s + (r[k] ?? 0), 0) / (corrigidas.length || 1)])) as Record<ChaveC, number>
  const fraca = CHAVES.reduce((m, k) => (medias[k] < medias[m] ? k : m), 'c1' as ChaveC)
  const dados = corrigidas.map((r) => ({ nome: dataCurta(r.data), ...Object.fromEntries(CHAVES.map((k) => [COMPETENCIAS[k].curto, r[k]])) }))
  const totais = corrigidas.map((r) => notaTotal(r)!)

  return (
    <div className="flex flex-col gap-5">
      <section className="card grid grid-cols-3 divide-x divide-line">
        {[['Redações', redacoes.dados.length], ['Média', totais.length ? numero(totais.reduce((a, b) => a + b, 0) / totais.length) : '—'], ['Melhor', totais.length ? Math.max(...totais) : '—']].map(([r, v]) => (
          <div key={r as string} className="p-5"><p className="text-[13px] font-bold text-muted">{r}</p><p className="titulo text-3xl num">{v}</p></div>
        ))}
      </section>
      {corrigidas.length > 0 && (
        <Card>
          <CardTitulo titulo="Evolução por competência" sub={`Ponto fraco em média: ${COMPETENCIAS[fraca].nome} (${numero(medias[fraca])})`} />
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={dados} margin={{ top: 6, right: 10, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="rgb(var(--line))" vertical={false} />
                <XAxis dataKey="nome" tick={{ fontSize: 12, fill: 'rgb(var(--muted))' }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 200]} ticks={[0, 40, 80, 120, 160, 200]} tick={{ fontSize: 12, fill: 'rgb(var(--muted))' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid rgb(var(--line))', background: 'rgb(var(--surface))' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                {CHAVES.map((k, i) => <Line key={k} dataKey={COMPETENCIAS[k].curto} stroke={CORES[i]} strokeWidth={2.5} dot={{ r: 3 }} />)}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
      <div className="flex flex-col gap-3">
        {[...redacoes.dados].reverse().map((r) => <ItemRedacao key={r.id} r={r} aberta={aberta === r.id} alternar={() => setAberta(aberta === r.id ? null : r.id)} atualizar={redacoes.atualizar} remover={redacoes.remover} />)}
      </div>
    </div>
  )
}

function ItemRedacao({ r, aberta, alternar, atualizar, remover }: { r: Redacao; aberta: boolean; alternar: () => void; atualizar: (id: string, c: Partial<Redacao>, ok?: string) => Promise<boolean>; remover: (id: string) => Promise<boolean> }) {
  const [notas, setNotas] = useState<Notas>({ c1: r.c1 ?? 120, c2: r.c2 ?? 120, c3: r.c3 ?? 120, c4: r.c4 ?? 120, c5: r.c5 ?? 120 })
  const total = notaTotal(r)
  return (
    <Card className="!p-0 overflow-hidden">
      <button type="button" onClick={alternar} aria-expanded={aberta} className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-sunken/60">
        <span className={cx('grid h-12 w-14 shrink-0 place-items-center rounded-lg titulo num', total == null ? 'bg-sunken text-muted' : total >= 900 ? 'bg-ok-soft text-ok' : total >= 700 ? 'bg-brand-soft text-brand' : 'bg-fire-soft text-fire')}>{total ?? '—'}</span>
        <span className="min-w-0 flex-1"><span className="block font-bold truncate">{r.tema}</span><span className="block text-xs text-muted">{dataBR(r.data)} · corrigida por {r.corretor || '—'}</span></span>
        <ChevronDown size={18} className={cx('text-muted transition-transform', aberta && 'rotate-180')} />
      </button>
      {aberta && (
        <div className="border-t border-line grid gap-6 p-5 lg:grid-cols-[1fr_340px]">
          <div className="font-serif text-[16px] leading-[1.8] whitespace-pre-line">{r.texto}{r.comentarios && <p className="mt-4 font-sans text-sm rounded-lg bg-sunken p-3"><b>Comentários:</b> {r.comentarios}</p>}</div>
          <div className="flex flex-col gap-3">
            <Correcao notas={notas} onChange={setNotas} />
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => atualizar(r.id, notas, 'Notas atualizadas')}>Atualizar notas</Button>
              <Button variante="perigo" onClick={() => remover(r.id)} icone={<Trash2 size={15} />}>Apagar</Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

function Temas() {
  const temas = useTabela('temas', [{ coluna: 'ano', asc: false }])
  const redacoes = useTabela('redacoes')
  const [novo, setNovo] = useState('')
  const feitos = new Set(redacoes.dados.map((r) => r.tema))
  const escrever = (t: string) => { sessionStorage.setItem('rumo:tema', t); location.hash = link('redacao', 'escrever') }
  const lista = (origem: 'ENEM' | 'Treino') => temas.dados.filter((t) => t.origem === origem)
  return (
    <div className="grid gap-5 lg:grid-cols-2 items-start">
      {(['ENEM', 'Treino'] as const).map((o) => (
        <Card key={o}>
          <CardTitulo titulo={o === 'ENEM' ? 'Temas das provas do ENEM' : 'Temas para treinar'} sub={o === 'ENEM' ? '2016 a 2026' : 'Eixos que mais caem: saúde, educação, tecnologia, cidadania, meio ambiente'} />
          <ul className="flex flex-col gap-2">
            {lista(o).map((t) => (
              <li key={t.id} className="group flex items-center gap-3 rounded-lg bg-sunken px-3.5 py-3">
                {t.ano && <span className="titulo text-sm text-brand num">{t.ano}</span>}
                <span className="flex-1 text-sm font-semibold">{t.tema}</span>
                {feitos.has(t.tema) && <Badge tom="ok">feito</Badge>}
                <Button tamanho="sm" variante="secundario" onClick={() => escrever(t.tema)}>Escrever</Button>
                {o === 'Treino' && <button type="button" aria-label="Apagar tema" onClick={() => temas.remover(t.id)} className="text-faint hover:text-bad md:opacity-0 group-hover:opacity-100"><Trash2 size={15} /></button>}
              </li>
            ))}
          </ul>
          {o === 'Treino' && (
            <form className="mt-4 flex gap-2" onSubmit={async (e) => { e.preventDefault(); if (novo.trim() && (await temas.inserir({ tema: novo.trim(), ano: null, origem: 'Treino' }))) setNovo('') }}>
              <Input aria-label="Novo tema" placeholder="Adicionar tema" value={novo} onChange={(e) => setNovo(e.target.value)} />
              <Button type="submit" variante="secundario" icone={<Plus size={16} />}>Adicionar</Button>
            </form>
          )}
        </Card>
      ))}
    </div>
  )
}

function Guia() {
  return (
    <div className="flex flex-col gap-5">
      <section className="hero rounded-2xl p-6 md:p-8 text-white">
        <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-white/70">Guia</p>
        <h2 className="titulo text-3xl mt-1">O que as redações nota 1000 têm em comum</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {NOTAS_1000.map(([t, d], i) => (
            <div key={t} className="rounded-xl bg-white/10 ring-1 ring-white/15 p-4">
              <span className="titulo text-white/50 num">{String(i + 1).padStart(2, '0')}</span>
              <p className="font-extrabold mt-1">{t}</p>
              <p className="text-sm text-white/80 mt-1">{d}</p>
            </div>
          ))}
        </div>
      </section>
      <div className="grid gap-5 lg:grid-cols-[1fr_340px] items-start">
        <Card>
          <CardTitulo titulo="As 5 competências" sub="Cartilha do Participante 2026" />
          <div className="flex flex-col gap-5">
            {CHAVES.map((k) => (
              <div key={k}>
                <p className="font-extrabold">{COMPETENCIAS[k].nome}</p>
                <p className="text-sm text-muted">{COMPETENCIAS[k].pergunta}</p>
                <ul className="mt-2 grid gap-1">
                  {NIVEIS.slice().reverse().map((n) => <li key={n} className="flex gap-3 text-sm"><span className="w-9 shrink-0 font-bold text-brand num">{n}</span><span className="text-muted">{COMPETENCIAS[k].niveis[n]}</span></li>)}
                </ul>
              </div>
            ))}
          </div>
        </Card>
        <div className="flex flex-col gap-5">
          <Card>
            <CardTitulo titulo="Estrutura modelo" />
            <ol className="flex flex-col gap-3 text-sm">
              <li><b>1. Introdução:</b> repertório + tema + <b>tese</b> + anúncio dos 2 argumentos.</li>
              <li><b>2. Desenvolvimento 1:</b> conectivo + argumento + repertório produtivo + análise.</li>
              <li><b>3. Desenvolvimento 2:</b> mesma estrutura, argumento 2.</li>
              <li><b>4. Conclusão:</b> retoma a tese + proposta: <i>agente, ação, meio, finalidade e detalhamento</i>.</li>
            </ol>
          </Card>
          <Card>
            <CardTitulo titulo="O que zera a redação" />
            <ul className="flex flex-col gap-1.5 text-sm">{MOTIVOS_ZERO.map((m) => <li key={m} className="flex gap-2"><span className="text-bad">✕</span>{m}</li>)}</ul>
          </Card>
        </div>
      </div>
    </div>
  )
}

export function RedacaoPage({ aba }: { aba: string }) {
  const sub: Record<string, string> = {
    escrever: 'Escreva, veja a pré-análise e corrija pelas 5 competências.', minhas: 'Seu histórico e a evolução de cada competência.',
    temas: 'Temas oficiais e de treino. Escolha um e comece.', guia: 'Critérios oficiais e o padrão das notas máximas.',
  }
  return (
    <div className="flex flex-col gap-6">
      <Cabecalho etiqueta="Redação" titulo={{ escrever: 'Escrever e corrigir', minhas: 'Minhas redações', temas: 'Temas', guia: 'Guia nota 1000' }[aba] ?? 'Redação'} sub={sub[aba]} />
      {aba === 'minhas' ? <Minhas /> : aba === 'temas' ? <Temas /> : aba === 'guia' ? <Guia /> : <Escrever />}
    </div>
  )
}
