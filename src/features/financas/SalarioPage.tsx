import { useState } from 'react'
import { Badge, Cabecalho, Campo, Card, CardTitulo, NumberInput, Stat, StatRow } from '@/components/ui'
import { FAIXAS_INSS, brutoParaLiquido, salarioLiquido } from '@/lib/impostos'
import { brl, pct } from '@/lib/format'

export function SalarioPage() {
  const [bruto, setBruto] = useState<number | null>(10000)
  const [dep, setDep] = useState<number | null>(0)
  const [alvo, setAlvo] = useState<number | null>(50000)
  const r = salarioLiquido(bruto ?? 0, dep ?? 0)
  const partes = [{ n: 'Líquido', v: r.liquido, c: '#1D4ED8' }, { n: 'INSS', v: r.inss, c: '#F59E0B' }, { n: 'IR', v: r.ir, c: '#DC2626' }]
  const faixas = [1621, 3000, 5000, 7350, 10000, 15000, 20000, 30000, 50000, 100000]

  return (
    <div className="flex flex-col gap-6">
      <Cabecalho etiqueta="Finanças" titulo="Salário e impostos" sub="Carteira assinada (CLT) com as regras de 2026: INSS progressivo e IR com isenção até R$ 5 mil (Lei 15.270/2025)." />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.2fr] items-start">
        <Card className="flex flex-col gap-4">
          <Campo rotulo="Salário bruto mensal">{(id) => <NumberInput id={id} min={0} step={500} value={bruto} onValor={setBruto} />}</Campo>
          <input aria-label="Ajustar salário" type="range" min={1621} max={60000} step={100} value={bruto ?? 0} onChange={(e) => setBruto(Number(e.target.value))} />
          <Campo rotulo="Dependentes no IR">{(id) => <NumberInput id={id} min={0} max={10} value={dep} onValor={setDep} />}</Campo>
          <div className="flex h-4 w-full overflow-hidden rounded-full" role="img" aria-label="Divisão do salário">
            {partes.map((p) => <span key={p.n} style={{ width: `${(p.v / (bruto || 1)) * 100}%`, background: p.c }} />)}
          </div>
          <div className="flex flex-wrap gap-3 text-sm">{partes.map((p) => <span key={p.n} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: p.c }} />{p.n} {brl(p.v)}</span>)}</div>
        </Card>
        <div className="flex flex-col gap-5">
          <StatRow>
            <Stat rotulo="INSS" valor={brl(r.inss, 2)} />
            <Stat rotulo="Imposto de Renda" valor={brl(r.ir, 2)} />
            <Stat rotulo="Líquido" valor={brl(r.liquido, 2)} />
            <Stat rotulo="Alíquota efetiva" valor={pct(r.aliquotaEfetiva, 1)} sub="INSS + IR" />
          </StatRow>
          <Card>
            <CardTitulo titulo="Quanto preciso ganhar?" />
            <div className="flex flex-wrap items-end gap-4">
              <Campo rotulo="Líquido desejado" className="max-w-[200px]">{(id) => <NumberInput id={id} min={0} step={1000} value={alvo} onValor={setAlvo} />}</Campo>
              <p className="pb-2">Bruto necessário: <b className="titulo text-2xl text-brand num">{brl(brutoParaLiquido(alvo ?? 0, dep ?? 0))}</b></p>
            </div>
            <p className="mt-3 text-xs text-muted">Médicos muitas vezes recebem como PJ, com outros impostos (Simples, Lucro Presumido). Isso entra no planejamento da clínica.</p>
          </Card>
        </div>
      </div>
      <Card>
        <CardTitulo titulo="Quanto sobra em cada faixa" />
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm min-w-[560px]">
            <thead><tr className="text-left text-muted">{['Bruto', 'INSS', 'IR', 'Líquido', 'Alíquota efetiva'].map((h) => <th key={h} className="px-2 py-2 font-bold">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-line">
              {faixas.map((b) => { const x = salarioLiquido(b, dep ?? 0); return (
                <tr key={b}><td className="px-2 py-2.5 font-bold num">{brl(b)}</td><td className="px-2 num">{brl(x.inss)}</td><td className="px-2 num">{brl(x.ir)}</td><td className="px-2 num font-semibold">{brl(x.liquido)}</td><td className="px-2"><Badge tom={x.aliquotaEfetiva < 0.12 ? 'ok' : x.aliquotaEfetiva < 0.22 ? 'brand' : 'fire'}>{pct(x.aliquotaEfetiva, 1)}</Badge></td></tr>
              ) })}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-muted">INSS 2026: {FAIXAS_INSS.map(([l, a], k) => `${pct(a, 1)} até ${brl(l, 2)}${k < 3 ? '' : ' (teto)'}`).join(' · ')}. IR: base = bruto − (INSS + R$ 189,59 por dependente) ou − R$ 607,20, o que for melhor; depois o redutor da Lei 15.270.</p>
      </Card>
    </div>
  )
}
