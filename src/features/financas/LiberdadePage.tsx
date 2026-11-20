import { useEffect, useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Plus, Save, Trash2 } from 'lucide-react'
import { Badge, Button, Cabecalho, Campo, Card, CardTitulo, NumberInput, Segmented, cx, eixo, grade, legenda, DicaGrafico } from '@/components/ui'
import { useAdiado, useTabela } from '@/data/hooks'
import { usePerfil } from '@/app/PerfilContext'
import { diasEntre, hojeISO } from '@/lib/datas'
import { brl, brlCurto } from '@/lib/format'
import { idadeQueAtinge, patrimonioNecessario, realParaNominal, simularPatrimonio, type Fase } from '@/lib/financas'

const CORES = ['#94A3B8', '#1D4ED8', '#0EA5E9', '#7C3AED', '#16A34A']

export function LiberdadePage() {
  const { perfil: salvo, salvarPerfil } = usePerfil()
  // Premissas: a tela recalcula na hora; o banco grava quando você para de digitar.
  const [prem, setPrem] = useState({ renda_desejada: salvo.renda_desejada, taxa_saque: salvo.taxa_saque, inflacao: salvo.inflacao })
  useEffect(() => setPrem({ renda_desejada: salvo.renda_desejada, taxa_saque: salvo.taxa_saque, inflacao: salvo.inflacao }), [salvo.renda_desejada, salvo.taxa_saque, salvo.inflacao])
  const gravar = useAdiado((p: typeof prem) => salvarPerfil(p), 700)
  const mudarPrem = (c: Partial<typeof prem>) => { const p = { ...prem, ...c }; setPrem(p); gravar(p) }
  const perfil = { ...salvo, ...prem }
  const cenarios = useTabela('cenarios', [{ coluna: 'ordem' }])
  const investimentos = useTabela('investimentos')
  const [nominal, setNominal] = useState<'real' | 'nominal'>('real')
  const [editando, setEditando] = useState<string | null>(null)
  const [fases, setFases] = useState<Fase[]>([])
  const [taxa, setTaxa] = useState(5)

  const hoje = hojeISO()
  const idade = perfil.nascimento ? Math.floor(diasEntre(perfil.nascimento, hoje) / 365.25) : 16
  const inicial = investimentos.dados.reduce((s, i) => s + Number(i.saldo_atual), 0)
  const meta = patrimonioNecessario(perfil.renda_desejada, perfil.taxa_saque)
  const ajustar = (v: number, aos: number) => (nominal === 'nominal' ? realParaNominal(v, perfil.inflacao, aos - idade) : v)

  const series = useMemo(() => cenarios.dados.map((c) => ({ c, pts: simularPatrimonio(c.fases, c.taxa_real, idade, inicial) })), [cenarios.dados, idade, inicial])
  const dados = useMemo(() => {
    const idades = series[0]?.pts.map((p) => p[0]) ?? []
    return idades.map((ida, k) => ({ idade: Math.round(ida), Meta: ajustar(meta, ida), ...Object.fromEntries(series.map((s) => [s.c.nome, ajustar(s.pts[k][1], ida)])) }))
  }, [series, nominal, meta]) // eslint-disable-line react-hooks/exhaustive-deps

  const abrir = (id: string) => { const c = cenarios.dados.find((x) => x.id === id)!; setEditando(id); setFases(c.fases.map((f) => ({ ...f }))); setTaxa(Math.round(c.taxa_real * 1000) / 10) }
  const muda = (i: number, k: keyof Fase, v: string | number | null) => setFases(fases.map((f, j) => (j === i ? { ...f, [k]: v ?? 0 } : f)))

  return (
    <div className="flex flex-col gap-6">
      <Cabecalho etiqueta="Finanças" titulo="Liberdade financeira" sub="Quando o seu patrimônio passa a pagar a vida sozinho, em três cenários. Valores em reais de hoje." />

      <section className="hero rounded-2xl p-6 md:p-8 text-white grid gap-6 md:grid-cols-[1fr_auto] items-center">
        <div>
          <p className="text-[13px] font-bold text-white/70">Sua meta</p>
          <p className="titulo text-5xl mt-1">{brlCurto(meta)}</p>
          <p className="text-white/80 mt-2">{brl(perfil.renda_desejada)}/mês × 12 ÷ {Math.round(perfil.taxa_saque * 100)}% de saque ao ano. Hoje você tem {brl(inicial)}.</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {series.map(({ c, pts }) => {
            const ida = idadeQueAtinge(pts, meta)
            return (
              <div key={c.id} className="rounded-xl bg-white/10 ring-1 ring-white/15 px-4 py-3 text-center min-w-[104px]">
                <p className="text-xs font-bold text-white/70">{c.nome}</p>
                <p className="titulo text-3xl num">{ida ?? '—'}</p>
                <p className="text-[11px] text-white/60">{ida ? 'anos' : 'não chega'}</p>
              </div>
            )
          })}
        </div>
      </section>

      <Card>
        <CardTitulo titulo="Patrimônio por idade" acao={<Segmented rotulo="Valores" valor={nominal} onChange={setNominal} opcoes={[{ valor: 'real', rotulo: 'Reais de hoje' }, { valor: 'nominal', rotulo: 'Com inflação' }]} />} />
        <div className="h-80">
          <ResponsiveContainer>
            <AreaChart data={dados} margin={{ top: 10, right: 10, left: 6, bottom: 0 }}>
              <defs>{series.map((s, i) => <linearGradient key={s.c.id} id={`g${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={CORES[i % CORES.length]} stopOpacity={0.25} /><stop offset="100%" stopColor={CORES[i % CORES.length]} stopOpacity={0} /></linearGradient>)}</defs>
              <CartesianGrid {...grade} />
              <XAxis dataKey="idade" {...eixo} interval={4} />
              <YAxis tickFormatter={(v) => brlCurto(v).replace('R$ ', '')} {...eixo} width={58} />
              <Tooltip content={<DicaGrafico formato={(v: number) => brlCurto(v)} titulo={(l) => `${l} anos`} />} />
              <Legend {...legenda} />
              {nominal === 'real' && <ReferenceLine y={meta} stroke="rgb(var(--faint))" strokeDasharray="6 6" label={{ value: 'meta', position: 'insideTopLeft', fill: 'rgb(var(--muted))', fontSize: 12 }} />}
              {series.map((s, i) => <Area key={s.c.id} dataKey={s.c.nome} stroke={CORES[i % CORES.length]} strokeWidth={s.c.nome === 'Moderado' ? 3 : 2} fill={`url(#g${i})`} />)}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px] items-start">
        <Card>
          <CardTitulo titulo="Fases da vida" sub="Escolha um cenário para editar renda e aportes de cada fase" />
          <div className="flex flex-wrap gap-2 mb-4">
            {cenarios.dados.map((c) => <Button key={c.id} tamanho="sm" variante={editando === c.id ? 'primario' : 'secundario'} onClick={() => abrir(c.id)}>{c.nome}</Button>)}
          </div>
          {editando ? (
            <div className="flex flex-col gap-3">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead><tr className="text-left text-muted">{['Fase', 'De', 'Até', 'Renda mín.', 'Renda máx.', 'Aporte/mês', ''].map((h) => <th key={h} className="px-1.5 py-2 font-bold">{h}</th>)}</tr></thead>
                  <tbody>
                    {fases.map((f, i) => (
                      <tr key={i}>
                        <td className="p-1.5"><input aria-label="Fase" className="w-full rounded-md border border-line bg-surface px-2 h-9" value={f.nome} onChange={(e) => muda(i, 'nome', e.target.value)} /></td>
                        {(['inicio', 'fim', 'rendaMin', 'rendaMax', 'aporte'] as const).map((k) => (
                          <td key={k} className="p-1.5"><input aria-label={k} type="number" className={cx('w-full rounded-md border border-line bg-surface px-2 h-9 num', k === 'inicio' || k === 'fim' ? 'max-w-[64px]' : 'max-w-[110px]')} value={f[k]} onChange={(e) => muda(i, k, Number(e.target.value))} /></td>
                        ))}
                        <td className="p-1.5"><button type="button" aria-label="Apagar fase" onClick={() => setFases(fases.filter((_, j) => j !== i))} className="text-faint hover:text-bad"><Trash2 size={15} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="flex items-end gap-3">
                  <Button variante="secundario" tamanho="sm" icone={<Plus size={14} />} onClick={() => { const u = fases.at(-1); setFases([...fases, { nome: 'Nova fase', inicio: u?.fim ?? 18, fim: (u?.fim ?? 18) + 5, rendaMin: 0, rendaMax: 0, aporte: u?.aporte ?? 0 }]) }}>Fase</Button>
                  <Campo rotulo="Rendimento real (% a.a.)">{(id) => <NumberInput id={id} className="!h-9 max-w-[110px]" step={0.5} value={taxa} onValor={(v) => setTaxa(v ?? 0)} />}</Campo>
                </div>
                <Button icone={<Save size={16} />} onClick={async () => {
                  if (fases.some((f) => f.fim <= f.inicio)) return
                  await cenarios.atualizar(editando, { fases, taxa_real: taxa / 100 }, 'Cenário salvo')
                }}>Salvar cenário</Button>
              </div>
              {fases.some((f) => f.fim <= f.inicio) && <p className="text-sm text-bad font-semibold">Em toda fase, "Até" precisa ser maior que "De".</p>}
            </div>
          ) : <p className="text-sm text-muted">Depois da última fase, o último aporte continua valendo.</p>}
        </Card>
        <Card>
          <CardTitulo titulo="Premissas" />
          <div className="flex flex-col gap-4">
            <Campo rotulo="Renda mensal desejada">{(id) => <NumberInput id={id} step={1000} value={perfil.renda_desejada} onValor={(v) => mudarPrem({ renda_desejada: v ?? 0 })} />}</Campo>
            <Campo rotulo="Taxa de saque (% ao ano)" dica="Quanto do patrimônio você retira por ano. 4% é o padrão.">{(id) => <NumberInput id={id} step={0.5} value={Math.round(perfil.taxa_saque * 1000) / 10} onValor={(v) => v && v > 0 && mudarPrem({ taxa_saque: v / 100 })} />}</Campo>
            <Campo rotulo="Inflação (% ao ano)" dica="Só para a visão com inflação.">{(id) => <NumberInput id={id} step={0.5} value={Math.round(perfil.inflacao * 1000) / 10} onValor={(v) => mudarPrem({ inflacao: (v ?? 0) / 100 })} />}</Campo>
            <Badge tom="brand">Patrimônio inicial = seus investimentos</Badge>
          </div>
        </Card>
      </div>
    </div>
  )
}
