import { useState } from 'react'
import { Cabecalho, Card, CardTitulo, Segmented, cx } from '@/components/ui'
import { useTabela } from '@/data/hooks'
import { usePerfil } from '@/app/PerfilContext'
import { diasEntre, hojeISO } from '@/lib/datas'
import { brlCurto } from '@/lib/format'
import { link } from '@/app/routes'

const CORES = ['#5482FF', '#38BDF8', '#14B8A6', '#34D399', '#EAB308', '#FB923C', '#F472B6', '#A78BFA']

export function LinhaPage() {
  const { perfil } = usePerfil()
  const cenarios = useTabela('cenarios', [{ coluna: 'ordem' }])
  const [id, setId] = useState<string>('')
  const c = cenarios.dados.find((x) => x.id === id) ?? cenarios.dados.find((x) => x.nome === 'Moderado') ?? cenarios.dados[0]
  const hoje = hojeISO()
  const idade = perfil.nascimento ? diasEntre(perfil.nascimento, hoje) / 365.25 : 16
  const anoDe = (i: number) => new Date().getFullYear() + Math.round(i - idade)
  const ini = Math.min(...(c?.fases.map((f) => f.inicio) ?? [16])), fim = Math.min(60, Math.max(...(c?.fases.map((f) => f.fim) ?? [60])))
  const pos = (i: number) => `${((Math.min(i, fim) - ini) / (fim - ini)) * 100}%`

  if (!c) return null
  return (
    <div className="flex flex-col gap-6">
      <Cabecalho etiqueta="Carreira" titulo="Linha do tempo" sub="As fases da vida com renda e aporte de cada uma. Edite em Finanças › Liberdade financeira."
        acao={<Segmented rotulo="Cenário" valor={c.id} onChange={setId} opcoes={cenarios.dados.map((x) => ({ valor: x.id, rotulo: x.nome }))} />} />
      <Card>
        <div className="relative h-14 mb-2">
          <div className="absolute inset-x-0 top-6 h-1.5 rounded-full bg-sunken" />
          <div className="absolute top-6 h-1.5 rounded-full bg-brand" style={{ left: 0, width: pos(idade) }} />
          <div className="absolute top-3 -translate-x-1/2 flex flex-col items-center" style={{ left: pos(idade) }}>
            <span className="h-7 w-7 rounded-full bg-brand ring-4 ring-brand/20 grid place-items-center text-[11px] font-semibold text-white">{Math.floor(idade)}</span>
          </div>
          {[ini, 20, 30, 40, 50, fim].filter((x, i, a) => a.indexOf(x) === i && x >= ini && x <= fim).map((x) => <span key={x} className="absolute top-10 text-xs font-medium text-faint -translate-x-1/2" style={{ left: pos(x) }}>{x}</span>)}
        </div>
        <div className="flex flex-col gap-2 mt-4">
          {c.fases.map((f, k) => (
            <div key={k} className="relative h-12">
              <div className="absolute inset-y-0 flex items-center rounded-lg px-3 text-white text-sm font-medium shadow-sm overflow-hidden whitespace-nowrap" style={{ left: pos(f.inicio), width: `calc(${pos(f.fim)} - ${pos(f.inicio)})`, background: CORES[k % CORES.length] }}>
                {f.nome}
              </div>
            </div>
          ))}
        </div>
      </Card>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {c.fases.map((f, k) => {
          const atual = idade >= f.inicio && idade < f.fim
          return (
            <Card key={k} className={cx('flex flex-col gap-3', atual && 'ring-2 ring-brand')}>
              <div className="flex items-center justify-between"><span className="h-2 w-10 rounded-full" style={{ background: CORES[k % CORES.length] }} />{atual && <span className="text-xs font-semibold text-brand">VOCÊ ESTÁ AQUI</span>}</div>
              <p className="titulo text-lg">{f.nome}</p>
              <p className="text-sm text-muted">{f.inicio} a {f.fim} anos · {anoDe(f.inicio)}–{anoDe(f.fim)}</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-sunken p-3"><p className="text-xs font-medium text-muted">Renda/mês</p><p className="font-semibold text-sm">{f.rendaMax ? `${brlCurto(f.rendaMin)}–${brlCurto(f.rendaMax)}` : '~0'}</p></div>
                <div className="rounded-lg bg-sunken p-3"><p className="text-xs font-medium text-muted">Aporte/mês</p><p className="font-semibold text-sm">{f.aporte ? brlCurto(f.aporte) : '—'}</p></div>
              </div>
            </Card>
          )
        })}
      </div>
      <Card>
        <CardTitulo titulo="Riscos para revisar todo ano" />
        <ul className="grid grid-cols-1 gap-2 md:grid-cols-2 text-sm">
          {['Mais de uma tentativa no vestibular atrasa tudo em 1 ano ou mais.', 'Faculdade particular pode custar centenas de milhares de reais.',
            'Gargalo na residência: médicos devem passar de 636 mil (2025) para 1,15 milhão (2035).', 'Mudança de especialidade, doença na família ou crise econômica.'].map((r) => (
            <li key={r} className="rounded-lg bg-fire-soft px-4 py-3">{r}</li>
          ))}
        </ul>
        <a href={link('carreira', 'diario')} className="mt-4 inline-block text-sm font-medium text-brand">Registrar uma decisão no diário →</a>
      </Card>
    </div>
  )
}
