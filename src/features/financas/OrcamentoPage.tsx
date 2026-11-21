import { useState } from 'react'
import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from 'recharts'
import { Cabecalho, Campo, Card, CardTitulo, NumberInput, Segmented, Stat, StatRow, DicaGrafico } from '@/components/ui'
import { PERFIS, estimar, regra503020, type Perfil } from '@/lib/orcamento'
import { salarioLiquido } from '@/lib/impostos'
import { brl } from '@/lib/format'

const CORES = ['#5482FF', '#3B82F6', '#38BDF8', '#06B6D4', '#14B8A6', '#34D399', '#84CC16', '#EAB308', '#F59E0B', '#FB923C', '#F87171', '#F472B6', '#A78BFA']

export function OrcamentoPage() {
  const [base, setBase] = useState<'liquida' | 'bruto'>('liquida')
  const [valor, setValor] = useState<number | null>(10000)
  const [perfil, setPerfil] = useState<Perfil>(PERFIS[0])
  const [investir, setInvestir] = useState(20)
  const [ajustes, setAjustes] = useState<Record<string, number | null>>({})
  const renda = base === 'bruto' ? salarioLiquido(valor ?? 0).liquido : valor ?? 0
  const gastos = renda * (1 - investir / 100)
  const linhas = estimar(gastos, perfil).map((l) => ({ ...l, valor: ajustes[l.topico] ?? l.valor }))
  const total = linhas.reduce((s, l) => s + l.valor, 0)
  const r = regra503020(renda)

  return (
    <div className="flex flex-col gap-6">
      <Cabecalho etiqueta="Finanças" titulo="Orçamento familiar" sub="Estimativa de gastos por tópico com base na pesquisa de orçamentos do IBGE. Troque pelos valores reais da sua casa." />
      <Card>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4 items-end">
          <Segmented rotulo="Partir de" valor={base} onChange={setBase} opcoes={[{ valor: 'liquida', rotulo: 'Renda líquida' }, { valor: 'bruto', rotulo: 'Salário bruto' }]} />
          <Campo rotulo={base === 'bruto' ? 'Salário bruto (CLT)' : 'Renda líquida da família'}>{(id) => <NumberInput id={id} min={0} step={500} value={valor} onValor={setValor} />}</Campo>
          <Segmented rotulo="Perfil" valor={perfil} onChange={(v) => { setPerfil(v); setAjustes({}) }} opcoes={PERFIS.map((p) => ({ valor: p, rotulo: p }))} />
          <Campo rotulo={`Investir ${investir}% da renda`}>{(id) => <input id={id} type="range" min={0} max={60} value={investir} onChange={(e) => { setInvestir(Number(e.target.value)); setAjustes({}) }} className="h-11" />}</Campo>
        </div>
      </Card>
      <StatRow>
        <Stat rotulo="Renda líquida" valor={brl(renda)} sub={base === 'bruto' ? 'após INSS e IR' : undefined} />
        <Stat rotulo="Gastos" valor={brl(total)} />
        <Stat rotulo="Sobra para investir" valor={brl(renda - total)} sub={`${renda ? Math.round(((renda - total) / renda) * 100) : 0}% da renda`} tom={renda - total >= 0 ? 'ok' : 'bad'} />
        <Stat rotulo="Regra 50/30/20" valor={brl(r.investir)} sub="sugestão para investir" />
      </StatRow>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr] items-start">
        <Card>
          <CardTitulo titulo="Gastos por tópico" sub="Edite qualquer valor" />
          <ul className="flex flex-col divide-y divide-line">
            {linhas.map((l, k) => (
              <li key={l.topico} className="flex items-center gap-3 py-2">
                <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: CORES[k] }} />
                <span className="flex-1 text-sm font-semibold">{l.topico}</span>
                <span className="text-xs text-muted w-12 text-right num">{total ? Math.round((l.valor / total) * 100) : 0}%</span>
                <NumberInput aria-label={l.topico} className="!h-9 max-w-[120px] text-right num" min={0} step={50} value={Math.round(l.valor)} onValor={(v) => setAjustes({ ...ajustes, [l.topico]: v })} />
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={linhas} dataKey="valor" nameKey="topico" innerRadius="58%" outerRadius="92%" paddingAngle={2} stroke="none">
                  {linhas.map((l, k) => <Cell key={l.topico} fill={CORES[k]} />)}
                </Pie>
                <Tooltip content={<DicaGrafico formato={(v: number) => brl(v)} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            {[['Necessidades', r.necessidades, '50%'], ['Desejos', r.desejos, '30%'], ['Investir', r.investir, '20%']].map(([n, v, p]) => (
              <div key={n as string} className="rounded-lg bg-sunken p-3"><p className="text-xs font-medium text-muted">{n} · {p}</p><p className="font-semibold num text-sm">{brl(v as number)}</p></div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
