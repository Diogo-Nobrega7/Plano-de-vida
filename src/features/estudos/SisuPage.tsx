import { useMemo, useState } from 'react'
import { GraduationCap, Pencil, Plus, Trash2 } from 'lucide-react'
import { Badge, Button, Cabecalho, Campo, Card, Input, Modal, NumberInput, Segmented, Vazio, cx } from '@/components/ui'
import { useTabela } from '@/data/hooks'
import { NOTAS, mediaEnem } from '@/lib/enem'
import { PESOS_IGUAIS, faixa, notaSisu, type Faixa } from '@/lib/sisu'
import { dataBR, numero } from '@/lib/format'
import { link } from '@/app/routes'
import type { Faculdade } from '@/data/tipos'

const FAIXA: Record<Faixa, [string, 'ok' | 'fire' | 'bad' | 'neutro']> = {
  dentro: ['Dentro do corte', 'ok'], perto: ['Perto (até 30 pts)', 'fire'], longe: ['Longe', 'bad'], 'sem-dados': ['Sem simulado completo', 'neutro'],
}

/** Barra útil: começa 150 pontos abaixo do corte (de 0 a 1000 tudo pareceria quase cheio). */
const escala = (nota: number | null, corte: number) => (nota == null ? 0 : Math.max(0, Math.min(1, (nota - (corte - 150)) / 150)))

export function SisuPage() {
  const faculdades = useTabela('faculdades', [{ coluna: 'prioridade' }, { coluna: 'nome' }])
  const simulados = useTabela('simulados', [{ coluna: 'data' }])
  const [base, setBase] = useState<'ultimo' | 'melhor'>('ultimo')
  const [edit, setEdit] = useState<Partial<Faculdade> | null>(null)

  const completos = simulados.dados.filter((s) => mediaEnem(s as never) != null)
  const ref = base === 'ultimo' ? completos.at(-1) : [...completos].sort((a, b) => mediaEnem(b as never)! - mediaEnem(a as never)!)[0]
  const linhas = useMemo(() => faculdades.dados.map((f) => {
    const nota = ref ? notaSisu(ref, f.pesos ?? PESOS_IGUAIS) : null
    return { f, nota, fx: faixa(nota, f.nota_corte) }
  }), [faculdades.dados, ref])
  const dentro = linhas.filter((l) => l.fx === 'dentro').length

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    const d = { nome: edit!.nome!.trim(), curso: edit!.curso?.trim() || 'Medicina', nota_corte: edit!.nota_corte ?? null, ano_ref: edit!.ano_ref ?? null, pesos: edit!.pesos ?? PESOS_IGUAIS, fonte: edit!.fonte?.trim() || null, prioridade: edit!.prioridade ?? faculdades.dados.length }
    const ok = edit!.id ? await faculdades.atualizar(edit!.id, d, 'Faculdade salva') : await faculdades.inserir(d, 'Faculdade adicionada')
    if (ok) setEdit(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <Cabecalho etiqueta="Estudos" titulo="SISU" sub="Suas faculdades-alvo: a nota dos seus simulados com os pesos de cada curso, comparada à nota de corte."
        acao={<Button icone={<Plus size={16} />} onClick={() => setEdit({ curso: 'Medicina', ano_ref: 2026, pesos: { ...PESOS_IGUAIS } })}>Faculdade</Button>} />

      <section className="hero rounded-2xl p-6 md:p-8 text-white grid gap-6 md:grid-cols-[1fr_auto] items-center">
        <div>
          <p className="text-[13px] font-medium text-white/70">{ref ? `${base === 'ultimo' ? 'Último' : 'Melhor'} simulado completo · ${ref.nome} (${dataBR(ref.data)})` : 'Nenhum simulado completo ainda'}</p>
          <p className="titulo text-5xl mt-1 num">{ref ? numero(mediaEnem(ref as never)!, 1) : '—'}<span className="text-lg font-semibold text-white/70"> média simples</span></p>
          <p className="text-white/80 mt-2">{ref ? `Hoje você estaria dentro do corte de ${dentro} de ${linhas.length} faculdades da sua lista.` : 'Registre um simulado com as 5 notas para ver suas chances.'}</p>
        </div>
        <Segmented rotulo="Usar" valor={base} onChange={setBase} opcoes={[{ valor: 'ultimo', rotulo: 'Último' }, { valor: 'melhor', rotulo: 'Melhor' }]} />
      </section>

      {!ref && <Card className="!p-4 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted">Precisa de um simulado com Linguagens, Humanas, Natureza, Matemática e Redação.</p><a href={link('estudos', 'simulados')}><Button tamanho="sm" variante="secundario">Registrar simulado</Button></a></Card>}

      {!faculdades.dados.length ? <Card><Vazio icone={<GraduationCap size={22} />} titulo="Nenhuma faculdade na lista" /></Card> : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {linhas.map(({ f, nota, fx }) => {
            const d = nota != null && f.nota_corte != null ? nota - f.nota_corte : null
            return (
              <Card key={f.id} className="flex flex-col gap-4 group">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="titulo text-lg leading-tight">{f.nome}</p>
                    <p className="text-[13px] text-muted">{f.curso}{f.ano_ref ? ` · corte ${f.ano_ref}` : ''}</p>
                  </div>
                  <Badge tom={FAIXA[fx][1]}>{FAIXA[fx][0]}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-sunken p-3"><p className="text-xs font-medium text-muted">Nota de corte</p><p className="titulo text-2xl num">{f.nota_corte != null ? numero(f.nota_corte, 2) : '—'}</p></div>
                  <div className="rounded-lg bg-sunken p-3"><p className="text-xs font-medium text-muted">Sua nota (pesos)</p><p className={cx('titulo text-2xl num', fx === 'dentro' && 'text-ok')}>{nota != null ? numero(nota, 1) : '—'}</p></div>
                </div>
                {f.nota_corte != null && (
                  <div>
                    <div className="relative h-2.5 rounded-full bg-sunken">
                      <div className={cx('h-full rounded-full transition-[width] duration-500', fx === 'dentro' ? 'bg-ok' : fx === 'perto' ? 'bg-fire' : 'bg-brand')} style={{ width: `${escala(nota, f.nota_corte) * 100}%` }} />
                    </div>
                    <p className="mt-1.5 text-xs font-medium text-muted">{d == null ? 'Sem nota para comparar' : d >= 0 ? `${numero(d, 1)} pontos acima do corte` : `Faltam ${numero(-d, 1)} pontos`}</p>
                  </div>
                )}
                <div className="flex items-center justify-between gap-2 border-t border-line pt-3 mt-auto">
                  <span className="text-xs text-faint truncate">Pesos {NOTAS.map((a) => f.pesos?.[a.chave] ?? 1).join(' · ')}{f.fonte ? ` · ${f.fonte}` : ''}</span>
                  <span className="flex gap-1 shrink-0">
                    <button type="button" aria-label={`Editar ${f.nome}`} onClick={() => setEdit(f)} className="p-1.5 text-faint hover:text-brand"><Pencil size={15} /></button>
                    <button type="button" aria-label={`Apagar ${f.nome}`} onClick={() => faculdades.remover(f.id, 'Faculdade removida')} className="p-1.5 text-faint hover:text-bad"><Trash2 size={15} /></button>
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <p className="text-xs text-muted">Cortes de Medicina na ampla concorrência do SISU 2026, segundo sites que acompanham o SISU; as fontes às vezes divergem e os cortes mudam todo ano. Confira no portal do SISU e no edital de cada universidade, que também traz os pesos certos. Cotas têm cortes próprios.</p>

      <Modal aberto={!!edit} titulo={edit?.id ? 'Editar faculdade' : 'Nova faculdade'} onFechar={() => setEdit(null)}>
        {edit && (
          <form onSubmit={salvar} className="flex flex-col gap-4">
            <div className="grid gap-4 grid-cols-2">
              <Campo rotulo="Universidade (e campus)" className="col-span-2">{(id) => <Input id={id} required placeholder="UFRN — Natal" value={edit.nome ?? ''} onChange={(e) => setEdit({ ...edit, nome: e.target.value })} />}</Campo>
              <Campo rotulo="Curso">{(id) => <Input id={id} value={edit.curso ?? ''} onChange={(e) => setEdit({ ...edit, curso: e.target.value })} />}</Campo>
              <Campo rotulo="Nota de corte">{(id) => <NumberInput id={id} min={0} max={1000} step={0.01} value={edit.nota_corte ?? null} onValor={(v) => setEdit({ ...edit, nota_corte: v })} />}</Campo>
              <Campo rotulo="Ano do corte">{(id) => <NumberInput id={id} min={2015} max={2035} value={edit.ano_ref ?? null} onValor={(v) => setEdit({ ...edit, ano_ref: v })} />}</Campo>
              <Campo rotulo="Fonte">{(id) => <Input id={id} placeholder="Portal do SISU" value={edit.fonte ?? ''} onChange={(e) => setEdit({ ...edit, fonte: e.target.value })} />}</Campo>
            </div>
            <div>
              <p className="text-[13px] font-medium text-muted mb-2">Pesos do curso (edital)</p>
              <div className="grid grid-cols-5 gap-2">
                {NOTAS.map((a) => (
                  <Campo key={a.chave} rotulo={a.nome.slice(0, 4) + '.'}>{(id) => <NumberInput id={id} aria-label={`Peso de ${a.nome}`} min={0} max={10} step={0.5} value={edit.pesos?.[a.chave] ?? 1} onValor={(v) => setEdit({ ...edit, pesos: { ...(edit.pesos ?? PESOS_IGUAIS), [a.chave]: v ?? 0 } })} />}</Campo>
                ))}
              </div>
            </div>
            <div className="flex justify-end"><Button type="submit">Salvar</Button></div>
          </form>
        )}
      </Modal>
    </div>
  )
}
