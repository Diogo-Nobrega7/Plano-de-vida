import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, Trophy } from 'lucide-react'
import { Badge, Button, Cabecalho, Card, CardTitulo, Input, cx } from '@/components/ui'
import { useAdiado, useTabela } from '@/data/hooks'
import { usePerfil } from '@/app/PerfilContext'
import { pontuacao } from '@/lib/carreira'
import { numero } from '@/lib/format'

export function ComparadorPage() {
  const { perfil, salvarPerfil } = usePerfil()
  const carreiras = useTabela('carreiras', [{ coluna: 'criado_em' }])
  const [nova, setNova] = useState('')
  // Pesos mudam na hora na tela e são gravados só quando você para de arrastar.
  const [crit, setCrit] = useState(perfil.criterios)
  useEffect(() => setCrit(perfil.criterios), [perfil.criterios])
  const gravarPesos = useAdiado((c: typeof crit) => salvarPerfil({ criterios: c }))
  const ranking = useMemo(() => carreiras.dados.map((c) => ({ c, p: pontuacao(c.notas, crit) })).sort((a, b) => b.p - a.p), [carreiras.dados, crit])

  const setPeso = (nome: string, peso: number) => { const c = crit.map((x) => (x.nome === nome ? { ...x, peso } : x)); setCrit(c); gravarPesos(c) }
  const setNota = (id: string, nome: string, nota: number) => { const c = carreiras.dados.find((x) => x.id === id)!; carreiras.atualizar(id, { notas: { ...c.notas, [nome]: nota } }) }

  return (
    <div className="flex flex-col gap-6">
      <Cabecalho etiqueta="Carreira" titulo="Comparador de carreiras" sub="A mesma régua para todas. Nota 5 = melhor para você em todos os critérios (ex.: em Horas por semana, 5 = poucas horas). As notas iniciais são um palpite: revise, principalmente Afinidade." />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px] items-start">
        <Card className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="bg-sunken/60">
                  <th className="px-4 py-3 text-left font-bold text-muted">Carreira</th>
                  {crit.map((c) => <th key={c.nome} className="px-2 py-3 font-bold text-muted text-center" title={c.descricao}>{c.nome}</th>)}
                  <th className="px-3 py-3 font-bold text-muted text-center">Nota</th><th />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {carreiras.dados.map((c) => (
                  <tr key={c.id} className="group">
                    <td className="px-4 py-3"><p className="font-bold">{c.nome}</p>{c.observacoes && <p className="text-xs text-muted max-w-[220px]">{c.observacoes}</p>}</td>
                    {crit.map((k) => (
                      <td key={k.nome} className="px-1 py-2 text-center">
                        <div className="inline-flex rounded-md bg-sunken p-0.5" role="group" aria-label={`${k.nome} em ${c.nome}`}>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button key={n} type="button" aria-pressed={c.notas[k.nome] === n} onClick={() => setNota(c.id, k.nome, n)}
                              className={cx('h-7 w-6 rounded-[6px] text-xs font-bold', c.notas[k.nome] === n ? 'bg-brand text-brand-ink' : 'text-muted hover:text-ink')}>{n}</button>
                          ))}
                        </div>
                      </td>
                    ))}
                    <td className="px-3 text-center"><span className="titulo text-lg text-brand num">{numero(pontuacao(c.notas, crit), 2)}</span></td>
                    <td className="pr-3"><button type="button" aria-label={`Apagar ${c.nome}`} onClick={() => carreiras.remover(c.id)} className="text-faint hover:text-bad md:opacity-0 group-hover:opacity-100"><Trash2 size={15} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <form className="flex gap-2 border-t border-line p-4" onSubmit={async (e) => { e.preventDefault(); if (!nova.trim()) return; if (await carreiras.inserir({ nome: nova.trim(), observacoes: null, notas: Object.fromEntries(crit.map((c) => [c.nome, 3])) })) setNova('') }}>
            <Input aria-label="Nova carreira" placeholder="Adicionar carreira (ex.: Engenharia)" value={nova} onChange={(e) => setNova(e.target.value)} />
            <Button type="submit" variante="secundario" icone={<Plus size={16} />}>Adicionar</Button>
          </form>
        </Card>

        <div className="flex flex-col gap-5">
          <Card>
            <CardTitulo titulo="Ranking" icone={<Trophy size={18} />} />
            <ol className="flex flex-col gap-3">
              {ranking.map(({ c, p }, k) => (
                <li key={c.id} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-sm gap-2"><span className="font-bold">{k + 1}. {c.nome}</span><span className="font-extrabold num">{numero(p, 2)}</span></div>
                  <div className="h-2.5 rounded-full bg-sunken"><div className={cx('h-full rounded-full', k === 0 ? 'bg-brand' : 'bg-brand/45')} style={{ width: `${(p / 5) * 100}%` }} /></div>
                </li>
              ))}
            </ol>
            {ranking.length > 1 && ranking[0].p - ranking[1].p < 0.3 && <p className="mt-4 rounded-lg bg-fire-soft p-3 text-sm">As primeiras estão muito próximas: decida testando a prática (conversas, visitas, cursos curtos), não só pela planilha.</p>}
          </Card>
          <Card>
            <CardTitulo titulo="Pesos" sub="O quanto cada critério importa para você" />
            <div className="flex flex-col gap-3">
              {crit.map((c) => (
                <label key={c.nome} className="flex flex-col gap-1">
                  <span className="flex justify-between text-sm"><span className="font-semibold">{c.nome}</span><Badge tom="brand">{c.peso}</Badge></span>
                  <input type="range" min={0} max={5} value={c.peso} onChange={(e) => setPeso(c.nome, Number(e.target.value))} />
                </label>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
