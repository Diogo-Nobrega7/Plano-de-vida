import { useState } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ClipboardList, Plus, Trash2 } from 'lucide-react'
import { Badge, Button, Cabecalho, Campo, Card, CardTitulo, Input, Modal, NumberInput, Vazio } from '@/components/ui'
import { useTabela } from '@/data/hooks'
import { usePerfil } from '@/app/PerfilContext'
import { hojeISO } from '@/lib/datas'
import { dataBR, dataCurta, numero } from '@/lib/format'
import { NOTAS, mediaEnem } from '@/lib/enem'

const CORES = ['#1D4ED8', '#0EA5E9', '#16A34A', '#EA580C', '#7C3AED']

export function SimuladosPage() {
  const { perfil } = usePerfil()
  const simulados = useTabela('simulados', [{ coluna: 'data' }])
  const [modal, setModal] = useState(false)
  const vazio = { data: hojeISO(), nome: '', lc: null, ch: null, cn: null, mt: null, redacao: null } as Record<string, string | number | null>
  const [f, setF] = useState(vazio)

  const ultimo = simulados.dados.at(-1)
  const metaMedia = NOTAS.reduce((s, a) => s + perfil.metas_nota[a.chave], 0) / 5
  const dados = simulados.dados.map((s) => ({ nome: dataCurta(s.data), ...Object.fromEntries(NOTAS.map((a) => [a.nome, s[a.chave] == null ? null : Number(s[a.chave])])) }))

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    const ok = await simulados.inserir({ data: f.data as string, nome: (f.nome as string).trim() || 'Simulado', lc: f.lc as number | null, ch: f.ch as number | null, cn: f.cn as number | null, mt: f.mt as number | null, redacao: f.redacao as number | null }, 'Simulado salvo · +120 XP')
    if (ok) { setModal(false); setF(vazio) }
  }

  const ultimaMedia = ultimo ? mediaEnem(ultimo as never) : null

  return (
    <div className="flex flex-col gap-6">
      <Cabecalho etiqueta="Estudos" titulo="Simulados" sub="Registre cada prova (as antigas do ENEM estão no site do Inep) e acompanhe a distância até a meta."
        acao={<Button onClick={() => setModal(true)} icone={<Plus size={16} />}>Registrar simulado</Button>} />

      {!simulados.dados.length ? (
        <Card><Vazio icone={<ClipboardList size={22} />} titulo="Nenhum simulado ainda" texto="Faça uma prova antiga do ENEM cronometrada e lance as notas aqui." acao={<Button onClick={() => setModal(true)} icone={<Plus size={16} />}>Registrar</Button>} /></Card>
      ) : (
        <>
          <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
            <Card>
              <CardTitulo titulo="Evolução" sub={`${simulados.dados.length} simulados`} />
              <div className="h-72">
                <ResponsiveContainer>
                  <LineChart data={dados} margin={{ top: 6, right: 10, left: -18, bottom: 0 }}>
                    <CartesianGrid stroke="rgb(var(--line))" vertical={false} />
                    <XAxis dataKey="nome" tick={{ fontSize: 12, fill: 'rgb(var(--muted))' }} tickLine={false} axisLine={false} />
                    <YAxis domain={[300, 1000]} tick={{ fontSize: 12, fill: 'rgb(var(--muted))' }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid rgb(var(--line))', background: 'rgb(var(--surface))' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    {NOTAS.map((a, i) => <Line key={a.chave} dataKey={a.nome} stroke={CORES[i]} strokeWidth={2.5} dot={{ r: 3 }} connectNulls />)}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card>
              <CardTitulo titulo="Distância até a meta" sub={ultimo ? `Último: ${ultimo.nome}` : ''}
                acao={ultimaMedia != null && <Badge tom={ultimaMedia >= metaMedia ? 'ok' : 'brand'}>média {numero(ultimaMedia)}</Badge>} />
              <div className="flex flex-col gap-4">
                {NOTAS.map((a, i) => {
                  const nota = ultimo?.[a.chave] == null ? null : Number(ultimo[a.chave]), meta = perfil.metas_nota[a.chave]
                  return (
                    <div key={a.chave} className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-sm"><span className="font-bold">{a.nome}</span><span className="num text-muted"><b className="text-ink">{nota ?? '—'}</b> / {meta}{nota != null && nota < meta && <span className="text-bad font-bold"> · faltam {numero(meta - nota)}</span>}</span></div>
                      <div className="h-2 w-full rounded-full bg-sunken overflow-hidden"><div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.min(1, (nota ?? 0) / meta) * 100}%`, background: nota != null && nota >= meta ? 'rgb(var(--ok))' : CORES[i] }} /></div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
          <Card>
            <CardTitulo titulo="Todos os simulados" />
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-muted">{['Data', 'Simulado', ...NOTAS.map((a) => a.nome), 'Média', ''].map((h) => <th key={h} className="px-2 py-2 font-bold whitespace-nowrap">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-line">
                  {[...simulados.dados].reverse().map((s) => (
                    <tr key={s.id} className="group">
                      <td className="px-2 py-3 whitespace-nowrap text-muted">{dataBR(s.data)}</td>
                      <td className="px-2 py-3 font-semibold">{s.nome}</td>
                      {NOTAS.map((a) => <td key={a.chave} className="px-2 py-3 num">{s[a.chave] ?? '—'}</td>)}
                      <td className="px-2 py-3 num font-bold">{(() => { const m = mediaEnem(s as never); return m == null ? '—' : numero(m) })()}</td>
                      <td className="px-2 py-3 text-right"><button type="button" aria-label="Apagar" onClick={() => simulados.remover(s.id)} className="text-faint hover:text-bad"><Trash2 size={15} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      <Modal aberto={modal} titulo="Registrar simulado" onFechar={() => setModal(false)}>
        <form onSubmit={salvar} className="flex flex-col gap-4">
          <div className="grid gap-4 grid-cols-2">
            <Campo rotulo="Data">{(id) => <Input id={id} type="date" value={f.data as string} onChange={(e) => setF({ ...f, data: e.target.value })} />}</Campo>
            <Campo rotulo="Nome">{(id) => <Input id={id} placeholder="ENEM 2024 (prova antiga)" value={f.nome as string} onChange={(e) => setF({ ...f, nome: e.target.value })} />}</Campo>
            {NOTAS.map((a) => <Campo key={a.chave} rotulo={a.nome}>{(id) => <NumberInput id={id} min={0} max={1000} step={0.1} value={f[a.chave] as number | null} onValor={(v) => setF({ ...f, [a.chave]: v })} />}</Campo>)}
          </div>
          <p className="text-xs text-muted">Pode deixar áreas em branco se o simulado não teve todas.</p>
          <div className="flex justify-end"><Button type="submit">Salvar</Button></div>
        </form>
      </Modal>
    </div>
  )
}
