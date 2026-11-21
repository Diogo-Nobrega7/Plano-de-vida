import { useMemo, useState } from 'react'
import { Activity, ArrowRight, ArrowUpRight, BookMarked, CalendarDays, Check, Flame, Gauge, PenLine, Play, RotateCcw, Sparkles, Target, Timer, Trophy } from 'lucide-react'
import { Anel, Badge, Button, Card, CardTitulo, Carregando, Kpi, Progress, Segmented, cx } from '@/components/ui'
import { usePerfil } from '@/app/PerfilContext'
import { link } from '@/app/routes'
import { useProgresso } from '@/data/useProgresso'
import { useTabela } from '@/data/hooks'
import { dataPorExtenso, diasEntre, inicioSemana, saudacao, somarDias } from '@/lib/datas'
import { dataBR, brlCurto, minutos, numero } from '@/lib/format'
import { idadeQueAtinge, patrimonioNecessario, simularPatrimonio } from '@/lib/financas'
import { situacaoMeta } from '@/lib/carreira'
import { vencida } from '@/lib/revisao'
import { diaDaSemana } from '@/lib/cronograma'

function idade(nasc: string | null, hoje: string): number {
  if (!nasc) return 16
  return Math.floor(diasEntre(nasc, hoje) / 365.25)
}

export function HojePage() {
  const { perfil } = usePerfil()
  const p = useProgresso()
  const materias = useTabela('materias')
  const metas = useTabela('metas', [{ coluna: 'prazo' }])
  const cenarios = useTabela('cenarios', [{ coluna: 'ordem' }])
  const investimentos = useTabela('investimentos')
  const cronograma = useTabela('cronograma', [{ coluna: 'inicio' }])

  const nomeMateria = useMemo(() => new Map(materias.dados.map((m) => [m.id, m.nome])), [materias.dados])
  const hoje = p.hoje
  const diasEnem = diasEntre(hoje, perfil.data_enem)
  const vencidas = p.revisoes.filter((r) => vencida(r.proxima, hoje)).sort((a, b) => a.proxima.localeCompare(b.proxima))
  const proximoConteudo = p.conteudos.filter((c) => c.frequencia === 'Alta' && c.status === 'não estudado').sort((a, b) => a.ordem - b.ordem)[0]
  const redacaoSemana = p.redacoes.some((r) => r.data >= somarDias(hoje, -6))
  const estudouHoje = p.seq.estudouHoje

  // Se há cronograma para hoje, ele vira a 1ª tarefa; senão, uma sessão de foco livre.
  const blocosHoje = cronograma.dados.filter((b) => b.dia === diaDaSemana(hoje))
  const blocosFeitos = blocosHoje.filter((b) => p.sessoes.some((s) => s.cronograma_id === b.id && s.data === hoje)).length
  const proximoBloco = blocosHoje.find((b) => !p.sessoes.some((s) => s.cronograma_id === b.id && s.data === hoje))
  const tarefas = [
    blocosHoje.length
      ? { feito: blocosFeitos === blocosHoje.length, texto: `Cronograma: ${blocosFeitos} de ${blocosHoje.length} blocos`, detalhe: proximoBloco ? `Próximo às ${proximoBloco.inicio}${proximoBloco.materia_id && nomeMateria.get(proximoBloco.materia_id) ? ` · ${nomeMateria.get(proximoBloco.materia_id)}` : ''}` : 'Tudo concluído', href: link('estudos', 'cronograma'), icone: <CalendarDays size={16} /> }
      : { feito: estudouHoje, texto: 'Fazer uma sessão de foco', detalhe: 'Pomodoro de 25 min', href: link('estudos', 'foco'), icone: <Timer size={16} /> },
    vencidas.length
      ? { feito: false, texto: `Revisar ${vencidas.length} ${vencidas.length === 1 ? 'cartão vencido' : 'cartões vencidos'}`, detalhe: 'Erros e flashcards', href: link('estudos', 'revisoes'), icone: <RotateCcw size={16} /> }
      : { feito: p.revisoes.length > 0, texto: 'Revisões em dia', detalhe: 'Cadastre os erros das questões', href: link('estudos', 'revisoes'), icone: <RotateCcw size={16} /> },
    proximoConteudo
      ? { feito: false, texto: `Estudar ${proximoConteudo.nome}`, detalhe: `${nomeMateria.get(proximoConteudo.materia_id) ?? ''} · cai muito`, href: link('estudos', 'disciplinas'), icone: <BookMarked size={16} /> }
      : { feito: true, texto: 'Conteúdos de alta frequência iniciados', detalhe: 'Siga para os de média', href: link('estudos', 'disciplinas'), icone: <BookMarked size={16} /> },
    { feito: redacaoSemana, texto: 'Redação da semana', detalhe: redacaoSemana ? 'Feita nos últimos 7 dias' : 'Uma por semana é a meta', href: link('redacao', 'escrever'), icone: <PenLine size={16} /> },
  ]
  const feitas = tarefas.filter((t) => t.feito).length

  const dica = vencidas.length
    ? `Comece ${vencidas.length === 1 ? 'pela revisão vencida' : `pelas ${vencidas.length} revisões vencidas`}: é o que mais segura o que você já aprendeu.`
    : proximoConteudo ? `Que tal começar por ${proximoConteudo.nome}? Está entre os assuntos que mais caem.` : 'Tudo em dia. Bora manter a sequência.'

  // Constância: últimas 12 semanas
  const porDia = useMemo(() => {
    const m = new Map<string, number>()
    for (const s of p.sessoes) m.set(s.data, (m.get(s.data) ?? 0) + s.minutos)
    return m
  }, [p.sessoes])
  const inicio = somarDias(inicioSemana(hoje), -7 * 11)
  const semanas = Array.from({ length: 12 }, (_, w) => Array.from({ length: 7 }, (_, d) => somarDias(inicio, w * 7 + d)))
  const tom = (min: number) => (min >= 120 ? 'bg-brand' : min >= 60 ? 'bg-brand/70' : min > 0 ? 'bg-brand/35' : 'bg-sunken')

  const diasEstudo = useMemo(() => new Set(p.datas), [p.datas])
  const semanaAtual = Array.from({ length: 7 }, (_, i) => somarDias(inicioSemana(hoje), i))
  const letras = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']

  const ini7 = inicioSemana(hoje), iniAnt = somarDias(ini7, -7)
  const daSemana = p.sessoes.filter((s) => s.data >= ini7)
  const minSemana = daSemana.reduce((a, s) => a + s.minutos, 0)
  const minAnterior = p.sessoes.filter((s) => s.data >= iniAnt && s.data < ini7).reduce((a, s) => a + s.minutos, 0)
  const qSemana = daSemana.reduce((a, s) => a + (s.questoes ?? 0), 0)
  const aSemana = daSemana.reduce((a, s) => a + (s.acertos ?? 0), 0)
  const acertoPct = p.totalQuestoes ? p.totalAcertos / p.totalQuestoes : 0
  const patrimonio = investimentos.dados.reduce((s, i) => s + Number(i.saldo_atual), 0)
  const moderado = cenarios.dados.find((c) => c.nome === 'Moderado') ?? cenarios.dados[0]
  const meta = patrimonioNecessario(perfil.renda_desejada, perfil.taxa_saque)
  const idadeMeta = moderado ? idadeQueAtinge(simularPatrimonio(moderado.fases, moderado.taxa_real, idade(perfil.nascimento, hoje), patrimonio), meta) : null
  const proximasMetas = metas.dados.filter((m) => m.status !== 'concluída').slice(0, 3)
  const ganhas = p.conquistas.filter((c) => c.ganhou)
  const proxima = p.conquistas.find((c) => !c.ganhou)
  const [visao, setVisao] = useState<'14' | '12s'>('14')
  const ultimos14 = Array.from({ length: 14 }, (_, i) => somarDias(hoje, i - 13))
  const max14 = Math.max(60, ...ultimos14.map((d) => porDia.get(d) ?? 0))
  const missoesOk = p.missoes.filter((m) => m.feito >= m.meta).length

  if (p.carregando) return <Carregando />

  return (
    <div className="flex flex-col gap-5 md:gap-6">
      {/* Cabeçalho: saudação, dica do dia e contagem para o ENEM */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="rotulo first-letter:uppercase">{dataPorExtenso()}</p>
          <h1 className="titulo text-[28px] md:text-[32px] leading-tight mt-1">{saudacao()}, {perfil.nome || 'tudo certo'}</h1>
          <p className="text-muted mt-1 max-w-xl flex items-start gap-1.5"><Sparkles size={15} className="text-brand mt-0.5 shrink-0" />{dica}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="card px-4 py-2.5 flex items-center gap-3">
            <span className="titulo text-2xl num text-brand">{numero(Math.max(0, diasEnem))}</span>
            <span className="text-[12px] leading-tight text-muted">dias para<br />o ENEM</span>
          </div>
          <a href={link('estudos', 'foco')}><Button icone={<Play size={15} />}>Focar agora</Button></a>
        </div>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Kpi rotulo="Nível" valor={<span>{p.nivel.nivel}<span className="text-[15px] font-medium text-muted"> · {p.nivel.titulo}</span></span>} icone={<Trophy />} sub={`${numero(p.nivel.xpNoNivel)} / ${numero(p.nivel.xpParaProximo)} XP`}>
          <Progress valor={p.nivel.progresso} />
        </Kpi>
        <Kpi rotulo="Sequência" valor={`${p.seq.atual} ${p.seq.atual === 1 ? 'dia' : 'dias'}`} icone={<Flame />} tom="fire" sub={`Recorde de ${p.seq.recorde}`}>
          <div className="flex gap-1">
            {semanaAtual.map((d, i) => {
              const ok = diasEstudo.has(d)
              return <span key={d} title={letras[i]} className={cx('h-1.5 flex-1 rounded-full', ok ? 'bg-fire' : d > hoje ? 'bg-sunken/50' : 'bg-sunken', d === hoje && !ok && 'ring-1 ring-fire/50')} />
            })}
          </div>
        </Kpi>
        <Kpi rotulo="Foco na semana" valor={minutos(minSemana)} icone={<Timer />} tom="ok"
          sub={minAnterior ? <span className={minSemana >= minAnterior ? 'text-ok' : 'text-muted'}>{minSemana >= minAnterior ? '▲' : '▼'} vs {minutos(minAnterior)} na anterior</span> : 'Primeira semana registrada'} />
        <Kpi rotulo="Acerto em questões" valor={p.totalQuestoes ? `${Math.round(acertoPct * 100)}%` : '—'} icone={<Gauge />}
          sub={qSemana ? `${numero(qSemana)} nesta semana · ${Math.round((aSemana / qSemana) * 100)}%` : `${numero(p.totalQuestoes)} questões no total`} />
      </div>

      {/* Plano + missões */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.55fr_1fr] items-start">
        <section className="hero rounded-xl p-5 md:p-6 text-white">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/50">Plano de hoje</p>
              <p className="text-[17px] font-semibold mt-0.5">{feitas === tarefas.length ? 'Dia completo. Excelente.' : `${tarefas.length - feitas} ${tarefas.length - feitas === 1 ? 'passo' : 'passos'} para fechar o dia`}</p>
            </div>
            <Anel valor={feitas / tarefas.length} tamanho={48} espessura={5} cor="#8FB0FF" fundo="rgb(255 255 255 / .12)"><span className="text-[12px] font-semibold num">{feitas}/{tarefas.length}</span></Anel>
          </div>
          <ul className="flex flex-col gap-1.5">
            {tarefas.map((t) => (
              <li key={t.texto} className="min-w-0">
                <a href={t.href} className={cx('group flex items-center gap-3 rounded-lg px-3 py-2.5 ring-1 ring-inset transition-all',
                  t.feito ? 'bg-white/[.04] ring-white/[.06]' : 'bg-white/[.07] ring-white/10 hover:bg-white/[.11] hover:ring-white/20')}>
                  <span className={cx('grid h-7 w-7 shrink-0 place-items-center rounded-full', t.feito ? 'bg-[#34D399] text-[#052E1F]' : 'bg-white/10 text-white [&_svg]:h-[15px] [&_svg]:w-[15px]')}>
                    {t.feito ? <Check size={14} strokeWidth={3} /> : t.icone}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cx('block text-[13.5px] font-medium truncate', t.feito && 'text-white/50 line-through decoration-white/30')}>{t.texto}</span>
                    <span className="block text-[12px] text-white/50 truncate">{t.detalhe}</span>
                  </span>
                  {!t.feito && <ArrowRight size={15} className="text-white/40 transition-transform group-hover:translate-x-0.5 group-hover:text-white" />}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <Card>
          <CardTitulo titulo="Missões do dia" sub="Ajuste as metas em Perfil" icone={<Target />} acao={<Badge tom={missoesOk === p.missoes.length ? 'ok' : 'neutro'}>{missoesOk}/{p.missoes.length}</Badge>} />
          <ul className="flex flex-col gap-4">
            {p.missoes.map((m) => {
              const ok = m.feito >= m.meta
              const fmt = (v: number) => (m.unidade === 'min' ? minutos(v) : numero(v))
              return (
                <li key={m.chave} className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between text-[13px]">
                    <span className="font-medium flex items-center gap-1.5">{ok && <Check size={13} className="text-ok" strokeWidth={3} />}{m.nome}</span>
                    <span className="num text-muted"><span className="text-ink font-medium">{fmt(m.feito)}</span> / {fmt(m.meta)}</span>
                  </div>
                  <Progress valor={m.feito / m.meta} cor={ok ? 'bg-ok' : 'bg-brand'} />
                </li>
              )
            })}
          </ul>
          <div className="mt-5 flex items-center gap-2.5 rounded-lg bg-sunken px-3 py-2.5 text-[12.5px]">
            <Trophy size={15} className="text-brand shrink-0" />
            <span className="min-w-0 truncate"><span className="font-medium">{ganhas.length}/{p.conquistas.length} conquistas</span><span className="text-muted">{proxima ? ` · próxima: ${proxima.nome}` : ' · todas liberadas'}</span></span>
          </div>
        </Card>
      </div>

      {/* Atividade + revisões */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.55fr_1fr] items-start">
        <Card>
          <CardTitulo titulo="Atividade" sub={`${minutos(p.minutosTotal)} de foco no total`} icone={<Activity />}
            acao={<Segmented rotulo="Período" valor={visao} onChange={setVisao} opcoes={[{ valor: '14', rotulo: '14 dias' }, { valor: '12s', rotulo: '12 semanas' }]} />} />
          {visao === '14' ? (
            <div className="flex h-40 items-end gap-1.5 sm:gap-2" role="img" aria-label="Minutos de foco por dia nos últimos 14 dias">
              {ultimos14.map((d) => {
                const v = porDia.get(d) ?? 0
                return (
                  <div key={d} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5" title={`${dataBR(d)}: ${minutos(v)}`}>
                    <span className="text-[10px] text-faint num opacity-0 group-hover:opacity-100 transition-opacity">{v ? minutos(v) : ''}</span>
                    <span className={cx('w-full rounded-t-[5px] transition-all duration-500', v ? 'bg-gradient-to-t from-brand/70 to-brand-2' : 'bg-sunken', d === hoje && 'ring-1 ring-brand/60')}
                      style={{ height: `${v ? Math.max(8, (v / max14) * 100) : 4}%` }} />
                    <span className={cx('text-[10px] num', d === hoje ? 'text-brand font-semibold' : 'text-faint')}>{Number(d.slice(8))}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex justify-between gap-1 max-w-[480px]" role="img" aria-label="Mapa de dias estudados nas últimas 12 semanas">
              {semanas.map((sem, w) => (
                <div key={w} className="flex flex-col gap-1">
                  {sem.map((d) => <span key={d} title={`${dataBR(d)}: ${minutos(porDia.get(d) ?? 0)}`} className={cx('block h-[15px] w-[15px] sm:h-[19px] sm:w-[19px] rounded-[4px]', d > hoje ? 'bg-transparent' : tom(porDia.get(d) ?? (diasEstudo.has(d) ? 1 : 0)))} />)}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardTitulo titulo="Revisões de hoje" sub={vencidas.length ? `${vencidas.length} para revisar` : 'Nada vencido'} icone={<RotateCcw />}
            acao={<a href={link('estudos', 'revisoes')} className="font-medium text-brand hover:underline">Abrir</a>} />
          {vencidas.length ? (
            <ul className="-my-1 divide-y divide-line">
              {vencidas.slice(0, 5).map((r) => (
                <li key={r.id} className="flex items-center gap-3 py-2.5">
                  <span className={cx('h-1.5 w-1.5 rounded-full shrink-0', r.proxima < hoje ? 'bg-bad' : 'bg-brand')} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-medium truncate">{r.frente}</span>
                    <span className="block text-[12px] text-faint">{(r.materia_id && nomeMateria.get(r.materia_id)) || (r.tipo === 'erro' ? 'Erro' : 'Cartão')}</span>
                  </span>
                  <Badge tom={r.proxima < hoje ? 'bad' : 'neutro'}>{r.proxima < hoje ? 'atrasada' : 'hoje'}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-lg border border-dashed border-line p-4 text-[13px] text-muted">
              Cadastre cada questão que errar: o Rumo avisa o dia certo de revisar.
              <a href={link('estudos', 'revisoes')} className="mt-2 flex items-center gap-1 font-medium text-brand">Cadastrar um erro <ArrowUpRight size={14} /></a>
            </div>
          )}
        </Card>
      </div>

      {/* Dinheiro + metas */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 items-start">
        <a href={link('financas', 'liberdade')} className="card p-5 group block">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[12.5px] font-medium text-muted">Liberdade financeira · cenário {moderado?.nome.toLowerCase() ?? '—'}</p>
              <p className="titulo text-[30px] leading-tight mt-1">{idadeMeta ? `aos ${idadeMeta} anos` : 'ainda não chega'}</p>
            </div>
            <ArrowUpRight size={18} className="text-faint transition-all group-hover:text-brand group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-[13px]">
            <div><p className="text-faint">Patrimônio</p><p className="font-semibold num text-[15px]">{brlCurto(patrimonio)}</p></div>
            <div><p className="text-faint">Meta</p><p className="font-semibold num text-[15px]">{brlCurto(meta)}</p></div>
          </div>
          <Progress valor={patrimonio / meta} className="mt-3" />
        </a>
        <Card>
          <CardTitulo titulo="Próximas metas" icone={<BookMarked />} acao={<a href={link('carreira', 'metas')} className="font-medium text-brand hover:underline">Todas</a>} />
          <ul className="-my-1 divide-y divide-line">
            {proximasMetas.map((m) => {
              const s = situacaoMeta(m.prazo, m.status, hoje)
              return (
                <li key={m.id} className="flex items-center gap-3 py-2.5">
                  <span className={cx('h-1.5 w-1.5 rounded-full shrink-0', s === 'atrasada' ? 'bg-bad' : s === 'em-breve' ? 'bg-fire' : 'bg-ok')} />
                  <span className="flex-1 text-[13.5px] font-medium min-w-0 truncate">{m.titulo}</span>
                  <span className="text-[12px] text-faint num whitespace-nowrap">{dataBR(m.prazo)}</span>
                </li>
              )
            })}
            {!proximasMetas.length && <p className="text-sm text-muted py-2">Nenhuma meta aberta.</p>}
          </ul>
        </Card>
      </div>
    </div>
  )
}
