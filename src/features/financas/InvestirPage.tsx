import { useMemo, useState } from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import { ShieldCheck, TrendingUp } from 'lucide-react'
import { Badge, Cabecalho, Campo, Card, CardTitulo, NumberInput, Segmented, cx } from '@/components/ui'
import { CATALOGO, CDI, CURVA_CDI, IPCA_12M, IPCA_LONGO, SELIC, evolucao, simularInvestimento, taxasAnuais } from '@/lib/investimentos'
import { brl, brlCurto, pct } from '@/lib/format'

const CORES = ['#1D4ED8', '#0EA5E9', '#16A34A', '#EA580C', '#7C3AED', '#DB2777', '#64748B', '#CA8A04', '#0F766E']
const IR = { regressivo: '22,5% → 15%', isento: 'Isento', acoes: '15% do lucro' }

export function InvestirPage() {
  const [aba, setAba] = useState<'comparar' | 'tipos' | 'comecar'>('comparar')
  const [inicial, setInicial] = useState<number | null>(1000)
  const [aporte, setAporte] = useState<number | null>(500)
  const [anos, setAnos] = useState(10)
  const [caem, setCaem] = useState(true)
  const [sel, setSel] = useState<string[]>(['Tesouro Selic', 'LCI/LCA 92% CDI', 'Tesouro IPCA+', 'ETF de Ibovespa (ações)', 'Poupança'])

  const res = useMemo(() => CATALOGO.filter((i) => sel.includes(i.nome)).map((i) => {
    const t = taxasAnuais(i, anos, caem)
    return { i, r: simularInvestimento(inicial ?? 0, aporte ?? 0, t, anos * 12, i.ir), ev: evolucao(inicial ?? 0, aporte ?? 0, t, anos * 12).filter((_, k) => k % 12 === 0) }
  }).sort((a, b) => b.r.liquido - a.r.liquido), [sel, inicial, aporte, anos, caem])
  const dados = Array.from({ length: anos + 1 }, (_, k) => ({ ano: k, ...Object.fromEntries(res.map((x) => [x.i.nome, x.ev[k]])) }))
  const max = res[0]?.r.liquido ?? 1

  return (
    <div className="flex flex-col gap-6">
      <Cabecalho etiqueta="Finanças" titulo="Investimentos" sub={`Foto de nov/2026: Selic ${pct(SELIC)}, CDI ${pct(CDI)}, IPCA 2026 ${pct(IPCA_12M)} (Focus). Material de estudo, não recomendação.`}
        acao={<Segmented rotulo="Seção" valor={aba} onChange={setAba} opcoes={[{ valor: 'comparar', rotulo: 'Simular' }, { valor: 'tipos', rotulo: 'Tipos' }, { valor: 'comecar', rotulo: 'Por onde começar' }]} />} />

      {aba === 'comparar' && (
        <>
          <Card>
            <div className="grid gap-4 md:grid-cols-4">
              <Campo rotulo="Valor inicial">{(id) => <NumberInput id={id} min={0} step={100} value={inicial} onValor={setInicial} />}</Campo>
              <Campo rotulo="Aporte mensal">{(id) => <NumberInput id={id} min={0} step={50} value={aporte} onValor={setAporte} />}</Campo>
              <Campo rotulo={`Prazo: ${anos} anos`}>{(id) => <input id={id} type="range" min={1} max={40} value={anos} onChange={(e) => setAnos(Number(e.target.value))} className="h-11" />}</Campo>
              <label className="flex items-center gap-2.5 text-sm font-semibold self-end h-11"><input type="checkbox" checked={caem} onChange={(e) => setCaem(e.target.checked)} className="h-4 w-4" />Juros caem como prevê o Focus</label>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {CATALOGO.map((i, k) => (
                <button key={i.nome} type="button" aria-pressed={sel.includes(i.nome)} onClick={() => setSel(sel.includes(i.nome) ? sel.filter((x) => x !== i.nome) : [...sel, i.nome])}
                  className={cx('flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] font-bold transition', sel.includes(i.nome) ? 'border-brand bg-brand-soft text-brand' : 'border-line text-muted hover:text-ink')}>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: CORES[k] }} />{i.nome}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted">CDI médio por ano: {CURVA_CDI.map((c) => pct(c, 1)).join(' → ')}. Prefixado e IPCA+ travam a taxa.</p>
          </Card>
          <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
            <Card>
              <CardTitulo titulo={`Resultado em ${anos} anos`} sub="Já descontado o IR no resgate" icone={<TrendingUp size={18} />} />
              <ul className="flex flex-col gap-3.5">
                {res.map(({ i, r }, k) => (
                  <li key={i.nome} className="flex flex-col gap-1.5">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-bold flex items-center gap-2">{k === 0 && <Badge tom="ok">melhor</Badge>}{i.nome}</span>
                      <span className="font-extrabold num">{brl(r.liquido)}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-sunken"><div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${(r.liquido / max) * 100}%`, background: CORES[CATALOGO.indexOf(i)] }} /></div>
                    <span className="text-xs text-muted">investiu {brlCurto(r.investido)} · IR {brlCurto(r.imposto)} · {brlCurto(r.liquidoReal)} em reais de hoje</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <CardTitulo titulo="Saldo bruto ano a ano" />
              <div className="h-80">
                <ResponsiveContainer>
                  <LineChart data={dados} margin={{ top: 6, right: 10, left: 6, bottom: 0 }}>
                    <CartesianGrid stroke="rgb(var(--line))" vertical={false} />
                    <XAxis dataKey="ano" tick={{ fontSize: 12, fill: 'rgb(var(--muted))' }} tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={(v) => brlCurto(v).replace('R$ ', '')} width={56} tick={{ fontSize: 12, fill: 'rgb(var(--muted))' }} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(v: number) => brl(v)} labelFormatter={(l) => `Ano ${l}`} contentStyle={{ borderRadius: 12, border: '1px solid rgb(var(--line))', background: 'rgb(var(--surface))' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                    {res.map(({ i }) => <Line key={i.nome} dataKey={i.nome} stroke={CORES[CATALOGO.indexOf(i)]} strokeWidth={2.2} dot={false} />)}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </>
      )}

      {aba === 'tipos' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CATALOGO.map((i, k) => (
            <Card key={i.nome} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div><p className="text-xs font-bold text-muted">{i.categoria}</p><p className="titulo text-lg">{i.nome}</p></div>
                <span className="h-3 w-3 rounded-full mt-1.5" style={{ background: CORES[k] }} />
              </div>
              <p className="titulo text-3xl num">{pct(i.taxa, 1)}<span className="text-sm font-semibold text-muted"> ao ano hoje</span></p>
              <div className="flex flex-wrap gap-1.5">
                <Badge tom={i.risco === 'Baixo' ? 'ok' : i.risco === 'Médio' ? 'brand' : 'fire'}>Risco {i.risco.toLowerCase()}</Badge>
                <Badge>IR: {IR[i.ir]}</Badge><Badge>{i.liquidez}</Badge>
              </div>
              <p className="text-sm"><b>Serve para:</b> {i.paraQue}</p>
              <p className="text-sm text-muted">{i.atencao}</p>
              <p className="text-xs text-muted flex items-center gap-1.5 mt-auto"><ShieldCheck size={14} />{i.garantia}</p>
            </Card>
          ))}
        </div>
      )}

      {aba === 'comecar' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardTitulo titulo="Uma ordem sensata" />
            <ol className="flex flex-col gap-4">
              {[['Reserva de emergência', '6 meses de gastos em Tesouro Selic ou CDB de liquidez diária ≥ 100% do CDI. Para estudante, qualquer valor: o hábito vale mais.'],
                ['Objetivos de 1 a 5 anos', 'LCI/LCA ou CDB com vencimento perto da data, ou Tesouro Prefixado vencendo no objetivo.'],
                ['Longo prazo', `Tesouro IPCA+ como base (protege da inflação de ~${pct(IPCA_LONGO, 0)}) e uma parte menor em ETF de ações e FIIs.`],
                ['Diversifique', 'Por tipo e por emissor, respeitando o limite do FGC (R$ 250 mil por banco).']].map(([t, d], k) => (
                <li key={t} className="flex gap-4"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand text-brand-ink font-extrabold">{k + 1}</span><span><b>{t}</b><br /><span className="text-sm text-muted">{d}</span></span></li>
              ))}
            </ol>
          </Card>
          <div className="flex flex-col gap-5">
            <Card><CardTitulo titulo="Menor de 18 anos" /><p className="text-sm text-muted">A conta na corretora é aberta com os pais (conta de menor). Tesouro Direto começa com uns R$ 30.</p></Card>
            <Card><CardTitulo titulo="Imposto novo (Lei 15.270/2025)" /><p className="text-sm text-muted">Desde 2026, dividendos acima de R$ 50 mil/mês da mesma empresa têm 10% retido, e há imposto mínimo para renda acima de R$ 600 mil/ano. Importa quando a clínica distribuir lucro.</p></Card>
            <Card><CardTitulo titulo="Armadilhas" /><ul className="text-sm text-muted list-disc pl-5 flex flex-col gap-1"><li>Comparar % do CDI sem olhar o IR.</li><li>Vender Prefixado/IPCA+ antes do vencimento quando os juros sobem.</li><li>Taxas de administração altas e promessas de retorno garantido.</li></ul></Card>
          </div>
        </div>
      )}
    </div>
  )
}
