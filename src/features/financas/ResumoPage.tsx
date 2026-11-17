import { useMemo, useState } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowDownRight, ArrowUpRight, PiggyBank, Plus, Trash2, Wallet } from 'lucide-react'
import { Badge, Button, Cabecalho, Campo, Card, CardTitulo, Input, Modal, NumberInput, Segmented, Select, Stat, StatRow, Vazio } from '@/components/ui'
import { useTabela } from '@/data/hooks'
import { hojeISO, mesAtual } from '@/lib/datas'
import { brl, dataBR } from '@/lib/format'
import type { Investimento, Lancamento } from '@/data/tipos'

const TIPOS_INV = ['Tesouro Direto', 'CDB', 'LCI/LCA', 'Poupança', 'Fundo', 'Ações/ETF', 'FII', 'Previdência', 'Outro']
const nomeMes = (m: string) => new Date(`${m}-15`).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })

export function ResumoPage() {
  const lanc = useTabela('lancamentos', [{ coluna: 'mes', asc: false }, { coluna: 'criado_em', asc: false }])
  const inv = useTabela('investimentos', [{ coluna: 'nome' }])
  const [modal, setModal] = useState<'lanc' | 'inv' | null>(null)
  const [editInv, setEditInv] = useState<Investimento | null>(null)
  const [fl, setFl] = useState({ mes: mesAtual(), tipo: 'despesa' as Lancamento['tipo'], categoria: '', descricao: '', valor: null as number | null })
  const [fi, setFi] = useState({ nome: '', tipo: 'Tesouro Direto', valor_aplicado: null as number | null, saldo_atual: null as number | null })

  const mes = mesAtual()
  const doMes = lanc.dados.filter((l) => l.mes === mes)
  const soma = (t: string, lista = doMes) => lista.filter((l) => l.tipo === t).reduce((s, l) => s + Number(l.valor), 0)
  const patrimonio = inv.dados.reduce((s, i) => s + Number(i.saldo_atual), 0)
  const aplicado = inv.dados.reduce((s, i) => s + Number(i.valor_aplicado), 0)
  const categorias = [...new Set(lanc.dados.map((l) => l.categoria))]

  const meses = useMemo(() => {
    const ms = [...new Set(lanc.dados.map((l) => l.mes))].sort().slice(-6)
    return ms.map((m) => { const l = lanc.dados.filter((x) => x.mes === m); return { mes: nomeMes(m), Receitas: soma('receita', l), Despesas: soma('despesa', l), Aportes: soma('aporte', l) } })
  }, [lanc.dados]) // eslint-disable-line react-hooks/exhaustive-deps

  const porCategoria = useMemo(() => {
    const m = new Map<string, number>()
    for (const l of doMes.filter((x) => x.tipo === 'despesa')) m.set(l.categoria, (m.get(l.categoria) ?? 0) + Number(l.valor))
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [doMes])

  async function salvarLanc(e: React.FormEvent) {
    e.preventDefault()
    if (!fl.valor || !fl.categoria.trim()) return
    const ok = await lanc.inserir({ ...fl, categoria: fl.categoria.trim(), descricao: fl.descricao.trim() || null, valor: fl.valor }, 'Lançamento salvo')
    if (ok) setFl({ ...fl, categoria: '', descricao: '', valor: null })
  }
  async function salvarInv(e: React.FormEvent) {
    e.preventDefault()
    const dados = { nome: fi.nome.trim(), tipo: fi.tipo, valor_aplicado: fi.valor_aplicado ?? 0, saldo_atual: fi.saldo_atual ?? fi.valor_aplicado ?? 0, atualizado_em: hojeISO() }
    const ok = editInv ? await inv.atualizar(editInv.id, dados, 'Investimento atualizado') : await inv.inserir(dados, 'Investimento salvo')
    if (ok) { setModal(null); setEditInv(null) }
  }

  const sobra = soma('receita') - soma('despesa') - soma('aporte')

  return (
    <div className="flex flex-col gap-6">
      <Cabecalho etiqueta="Finanças" titulo="Resumo" sub="Quanto entrou, saiu e foi investido, e quanto você já tem."
        acao={<><Button variante="secundario" onClick={() => { setEditInv(null); setFi({ nome: '', tipo: 'Tesouro Direto', valor_aplicado: null, saldo_atual: null }); setModal('inv') }} icone={<PiggyBank size={16} />}>Investimento</Button><Button onClick={() => setModal('lanc')} icone={<Plus size={16} />}>Lançamento</Button></>} />

      <StatRow>
        <Stat rotulo="Patrimônio" valor={brl(patrimonio)} sub={aplicado ? `${patrimonio >= aplicado ? '+' : ''}${(((patrimonio / aplicado) - 1) * 100).toFixed(1).replace('.', ',')}% de rendimento` : 'cadastre seus investimentos'} tom={patrimonio >= aplicado ? 'ok' : 'bad'} />
        <Stat rotulo="Entrou no mês" valor={brl(soma('receita'))} sub={nomeMes(mes)} />
        <Stat rotulo="Gastou no mês" valor={brl(soma('despesa'))} sub={`${porCategoria.length} categorias`} />
        <Stat rotulo="Sobrou" valor={brl(sobra)} sub={`investiu ${brl(soma('aporte'))}`} tom={sobra >= 0 ? 'ok' : 'bad'} />
      </StatRow>

      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardTitulo titulo="Últimos meses" />
          {meses.length ? (
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={meses} margin={{ top: 6, right: 6, left: -6, bottom: 0 }}>
                  <XAxis dataKey="mes" tick={{ fontSize: 12, fill: 'rgb(var(--muted))' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: 'rgb(var(--muted))' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip cursor={{ fill: 'rgb(var(--sunken))' }} formatter={(v: number) => brl(v)} contentStyle={{ borderRadius: 12, border: '1px solid rgb(var(--line))', background: 'rgb(var(--surface))' }} />
                  <Bar dataKey="Receitas" fill="#1D4ED8" radius={[5, 5, 0, 0]} />
                  <Bar dataKey="Despesas" fill="#F59E0B" radius={[5, 5, 0, 0]} />
                  <Bar dataKey="Aportes" fill="#16A34A" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <Vazio icone={<Wallet size={22} />} titulo="Sem lançamentos" texto="Comece pela mesada e pelos gastos da semana." />}
        </Card>
        <Card>
          <CardTitulo titulo="Gastos do mês por categoria" />
          <div className="flex flex-col gap-3">
            {porCategoria.map(([c, v]) => (
              <div key={c} className="flex flex-col gap-1">
                <div className="flex justify-between text-sm"><span className="font-semibold">{c}</span><span className="num">{brl(v)}</span></div>
                <div className="h-2 rounded-full bg-sunken"><div className="h-full rounded-full bg-[#F59E0B]" style={{ width: `${(v / porCategoria[0][1]) * 100}%` }} /></div>
              </div>
            ))}
            {!porCategoria.length && <p className="text-sm text-muted">Nenhum gasto neste mês.</p>}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 items-start">
        <Card>
          <CardTitulo titulo="Investimentos" sub={`${inv.dados.length} aplicações`} />
          <ul className="flex flex-col gap-2">
            {inv.dados.map((i) => (
              <li key={i.id} className="group flex items-center gap-3 rounded-lg bg-sunken px-4 py-3">
                <button type="button" className="flex-1 min-w-0 text-left" onClick={() => { setEditInv(i); setFi({ nome: i.nome, tipo: i.tipo, valor_aplicado: Number(i.valor_aplicado), saldo_atual: Number(i.saldo_atual) }); setModal('inv') }}>
                  <span className="block font-bold truncate">{i.nome}</span>
                  <span className="block text-xs text-muted">{i.tipo} · atualizado {dataBR(i.atualizado_em)}</span>
                </button>
                <span className="text-right"><span className="block font-extrabold num">{brl(Number(i.saldo_atual))}</span><span className="block text-xs text-muted num">aplicou {brl(Number(i.valor_aplicado))}</span></span>
                <button type="button" aria-label={`Apagar ${i.nome}`} onClick={() => inv.remover(i.id)} className="text-faint hover:text-bad md:opacity-0 group-hover:opacity-100"><Trash2 size={15} /></button>
              </li>
            ))}
            {!inv.dados.length && <p className="text-sm text-muted">Nenhum investimento cadastrado. Para menores de 18 anos, a conta é aberta com os pais.</p>}
          </ul>
        </Card>
        <Card>
          <CardTitulo titulo="Lançamentos" sub="Mais recentes" />
          <ul className="divide-y divide-line -my-2">
            {lanc.dados.slice(0, 15).map((l) => (
              <li key={l.id} className="group flex items-center gap-3 py-2.5">
                <span className={`grid h-8 w-8 place-items-center rounded-md ${l.tipo === 'receita' ? 'bg-brand-soft text-brand' : l.tipo === 'aporte' ? 'bg-ok-soft text-ok' : 'bg-fire-soft text-fire'}`}>
                  {l.tipo === 'despesa' ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                </span>
                <span className="flex-1 min-w-0"><span className="block text-sm font-semibold truncate">{l.categoria}{l.descricao ? ` · ${l.descricao}` : ''}</span><span className="block text-xs text-muted">{nomeMes(l.mes)} · {l.tipo}</span></span>
                <span className="font-bold num">{l.tipo === 'despesa' ? '−' : '+'}{brl(Number(l.valor), 2)}</span>
                <button type="button" aria-label="Apagar lançamento" onClick={() => lanc.remover(l.id)} className="text-faint hover:text-bad md:opacity-0 group-hover:opacity-100"><Trash2 size={15} /></button>
              </li>
            ))}
            {!lanc.dados.length && <p className="py-2 text-sm text-muted">Nada lançado ainda.</p>}
          </ul>
        </Card>
      </div>

      <Card>
        <CardTitulo titulo="Quatro números que não são a mesma coisa" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[['Faturamento', 'Tudo o que entra numa empresa, antes de custos.'], ['Lucro', 'Faturamento − custos − salários − impostos da empresa.'], ['Renda pessoal', 'O que sobra para você depois dos impostos.'], ['Patrimônio', 'Tudo o que você tem menos as dívidas.']].map(([t, d]) => (
            <div key={t} className="rounded-lg bg-sunken p-4"><p className="font-extrabold">{t}</p><p className="text-sm text-muted mt-1">{d}</p></div>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted">Renda alta e liberdade financeira são metas diferentes: a primeira depende do seu trabalho; a segunda, do patrimônio.</p>
      </Card>

      <Modal aberto={modal === 'lanc'} titulo="Novo lançamento" onFechar={() => setModal(null)}>
        <form onSubmit={salvarLanc} className="flex flex-col gap-4">
          <Segmented rotulo="Tipo" valor={fl.tipo} onChange={(v) => setFl({ ...fl, tipo: v })} opcoes={[{ valor: 'receita', rotulo: 'Receita' }, { valor: 'despesa', rotulo: 'Despesa' }, { valor: 'aporte', rotulo: 'Aporte' }]} />
          <div className="grid gap-4 grid-cols-2">
            <Campo rotulo="Mês">{(id) => <Input id={id} type="month" required value={fl.mes} onChange={(e) => setFl({ ...fl, mes: e.target.value })} />}</Campo>
            <Campo rotulo="Valor (R$)">{(id) => <NumberInput id={id} min={0.01} step={0.01} required value={fl.valor} onValor={(v) => setFl({ ...fl, valor: v })} />}</Campo>
          </div>
          <Campo rotulo="Categoria">{(id) => <><Input id={id} list="cats" required placeholder="Mesada, Lanche, Transporte…" value={fl.categoria} onChange={(e) => setFl({ ...fl, categoria: e.target.value })} /><datalist id="cats">{categorias.map((c) => <option key={c} value={c} />)}</datalist></>}</Campo>
          <Campo rotulo="Descrição (opcional)">{(id) => <Input id={id} value={fl.descricao} onChange={(e) => setFl({ ...fl, descricao: e.target.value })} />}</Campo>
          <div className="flex justify-between items-center"><Badge>Aporte = dinheiro que foi para investimentos</Badge><Button type="submit">Salvar</Button></div>
        </form>
      </Modal>

      <Modal aberto={modal === 'inv'} titulo={editInv ? 'Atualizar investimento' : 'Novo investimento'} onFechar={() => setModal(null)}>
        <form onSubmit={salvarInv} className="flex flex-col gap-4">
          <Campo rotulo="Nome">{(id) => <Input id={id} required placeholder="Tesouro Selic 2029" value={fi.nome} onChange={(e) => setFi({ ...fi, nome: e.target.value })} />}</Campo>
          <Campo rotulo="Tipo">{(id) => <Select id={id} value={fi.tipo} onChange={(e) => setFi({ ...fi, tipo: e.target.value })}>{TIPOS_INV.map((t) => <option key={t}>{t}</option>)}</Select>}</Campo>
          <div className="grid gap-4 grid-cols-2">
            <Campo rotulo="Valor aplicado">{(id) => <NumberInput id={id} min={0} step={0.01} value={fi.valor_aplicado} onValor={(v) => setFi({ ...fi, valor_aplicado: v })} />}</Campo>
            <Campo rotulo="Saldo atual">{(id) => <NumberInput id={id} min={0} step={0.01} value={fi.saldo_atual} onValor={(v) => setFi({ ...fi, saldo_atual: v })} />}</Campo>
          </div>
          <div className="flex justify-end"><Button type="submit">Salvar</Button></div>
        </form>
      </Modal>
    </div>
  )
}
