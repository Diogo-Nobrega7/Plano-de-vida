import { useMemo } from 'react'
import { ArrowRight, BarChart3, BookMarked, CalendarDays, Check, Circle, Flame, PenLine, RotateCcw, Target, Timer, Trophy, Zap } from 'lucide-react'
import { Anel, Badge, Card, CardTitulo, Carregando, Progress, cx } from '@/components/ui'
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

  if (p.carregando) return <Carregando />

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <section className="hero lg:col-span-2 rounded-2xl p-6 md:p-8 text-white shadow-md flex flex-col gap-6 overflow-hidden relative">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-white/70 first-letter:uppercase">{dataPorExtenso()}</p>
              <h1 className="titulo text-[34px] md:text-[40px] leading-tight mt-1">{saudacao()}, {perfil.nome || 'tudo certo'}.</h1>
              <p className="text-white/85 mt-2 max-w-xl text-[15px]">{dica}</p>
            </div>
            <div className="rounded-xl bg-white/10 ring-1 ring-white/20 px-4 py-3 text-center backdrop-blur">
              <p className="titulo text-4xl num leading-none">{numero(Math.max(0, diasEnem))}</p>
              <p className="text-xs font-bold text-white/75 mt-1">dias para o ENEM</p>
            </div>
          </div>
          <div className="rounded-xl bg-surface text-ink p-4 md:p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <p className="font-extrabold">Plano de hoje</p>
              <Badge tom="brand">{feitas} de {tarefas.length}</Badge>
            </div>
            <ul className="grid gap-2 grid-cols-1 sm:grid-cols-2">
              {tarefas.map((t) => (
                <li key={t.texto} className="min-w-0">
                  <a href={t.href} className={cx('group flex items-center gap-3 rounded-lg px-3 py-3 transition-colors', t.feito ? 'bg-ok-soft' : 'bg-sunken hover:bg-brand-soft')}>
                    <span className={cx('grid h-7 w-7 shrink-0 place-items-center rounded-full', t.feito ? 'bg-ok text-white' : 'bg-surface text-brand ring-1 ring-line')}>
                      {t.feito ? <Check size={15} strokeWidth={3} /> : t.icone}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cx('block text-sm font-bold truncate', t.feito && 'text-ok')}>{t.texto}</span>
                      <span className="block text-xs text-muted truncate">{t.detalhe}</span>
                    </span>
                    {!t.feito && <ArrowRight size={16} className="text-faint group-hover:text-brand transition" />}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <Card className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <Anel valor={p.nivel.progresso} tamanho={76} espessura={8}>
              <span className="titulo text-2xl num">{p.nivel.nivel}</span>
            </Anel>
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-brand">Nível {p.nivel.nivel}</p>
              <p className="titulo text-xl">{p.nivel.titulo}</p>
              <p className="text-[13px] text-muted num">{numero(p.nivel.xpNoNivel)} / {numero(p.nivel.xpParaProximo)} XP · total {numero(p.xp)}</p>
            </div>
          </div>
          <div className="rounded-lg bg-fire-soft p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-extrabold text-fire"><Flame size={18} strokeWidth={2.6} />{p.seq.atual} {p.seq.atual === 1 ? 'dia seguido' : 'dias seguidos'}</span>
              <span className="text-xs font-bold text-fire/80">recorde {p.seq.recorde}</span>
            </div>
            <div className="mt-3 grid grid-cols-7 gap-1.5">
              {semanaAtual.map((d, i) => {
                const ok = diasEstudo.has(d), futuro = d > hoje
                return (
                  <div key={d} className="flex flex-col items-center gap-1">
                    <span className={cx('grid h-8 w-full max-w-[34px] place-items-center rounded-md', ok ? 'bg-fire text-white' : futuro ? 'bg-surface/60' : 'bg-surface', d === hoje && !ok && 'ring-2 ring-fire/40')}>
                      {ok && <Flame size={14} strokeWidth={2.6} />}
                    </span>
                    <span className="text-[11px] font-bold text-fire/70">{letras[i]}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-sunken px-4 py-3">
            <Trophy size={18} className="text-brand shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">{ganhas.length} de {p.conquistas.length} conquistas</p>
              <p className="text-xs text-muted truncate">{proxima ? `Próxima: ${proxima.nome} · ${proxima.descricao.toLowerCase()}` : 'Você liberou todas 🏆'}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardTitulo titulo="Missões do dia" sub="Metas diárias ajustáveis em Perfil" icone={<Target size={18} />}
          acao={<Badge tom={p.missoes.every((m) => m.feito >= m.meta) ? 'ok' : 'neutro'}><Zap size={12} />{p.missoes.filter((m) => m.feito >= m.meta).length}/{p.missoes.length}</Badge>} />
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {p.missoes.map((m) => {
            const ok = m.feito >= m.meta
            const fmt = (v: number) => (m.unidade === 'min' ? minutos(v) : numero(v))
            return (
              <div key={m.chave} className={cx('rounded-lg border p-4 flex flex-col gap-2.5 transition-colors', ok ? 'border-ok/30 bg-ok-soft' : 'border-line')}>
                <span className="flex items-center justify-between text-[13px] font-bold text-muted">{m.nome}{ok ? <Check size={16} className="text-ok" strokeWidth={3} /> : <Circle size={14} className="text-faint" />}</span>
                <span className="titulo text-[26px] num leading-none">{fmt(m.feito)}<span className="text-[15px] font-semibold text-faint"> / {fmt(m.meta)}</span></span>
                <Progress valor={m.feito / m.meta} cor={ok ? 'bg-ok' : 'bg-brand'} />
              </div>
            )
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_1fr] items-start">
        <Card>
          <CardTitulo titulo="Sua semana" sub="Tempo de foco, questões e constância" icone={<BarChart3 size={18} />} />
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="rounded-lg bg-sunken p-3.5">
              <p className="text-xs font-bold text-muted">Foco</p>
              <p className="titulo text-2xl num">{minutos(minSemana)}</p>
              <p className={cx('text-xs font-bold', minSemana >= minAnterior ? 'text-ok' : 'text-muted')}>{minAnterior ? `${minSemana >= minAnterior ? '▲' : '▼'} vs ${minutos(minAnterior)}` : 'semana anterior: 0'}</p>
            </div>
            <div className="rounded-lg bg-sunken p-3.5">
              <p className="text-xs font-bold text-muted">Questões</p>
              <p className="titulo text-2xl num">{numero(qSemana)}</p>
              <p className="text-xs font-bold text-muted">{qSemana ? `${Math.round((aSemana / qSemana) * 100)}% de acerto` : 'nenhuma ainda'}</p>
            </div>
            <div className="rounded-lg bg-sunken p-3.5">
              <p className="text-xs font-bold text-muted">Acerto geral</p>
              <p className="titulo text-2xl num">{p.totalQuestoes ? `${Math.round(acertoPct * 100)}%` : '—'}</p>
              <p className="text-xs font-bold text-muted">{numero(p.totalQuestoes)} questões</p>
            </div>
          </div>
          <div className="flex justify-between gap-1 max-w-[440px]" role="img" aria-label="Mapa de dias estudados nas últimas 12 semanas">
            {semanas.map((sem, w) => (
              <div key={w} className="flex flex-col gap-1">
                {sem.map((d) => <span key={d} title={`${dataBR(d)}: ${minutos(porDia.get(d) ?? 0)}`} className={cx('block h-[15px] w-[15px] sm:h-[18px] sm:w-[18px] rounded-[4px]', d > hoje ? 'bg-transparent' : tom(porDia.get(d) ?? (diasEstudo.has(d) ? 1 : 0)))} />)}
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
            <span>Últimas 12 semanas · {minutos(p.minutosTotal)} no total</span>
            <span className="flex items-center gap-1">menos <span className="h-2.5 w-2.5 rounded-sm bg-sunken" /><span className="h-2.5 w-2.5 rounded-sm bg-brand/35" /><span className="h-2.5 w-2.5 rounded-sm bg-brand/70" /><span className="h-2.5 w-2.5 rounded-sm bg-brand" /> mais</span>
          </div>
        </Card>

        <Card>
          <CardTitulo titulo="Revisões de hoje" sub={vencidas.length ? `${vencidas.length} para revisar` : 'Nada vencido'} icone={<RotateCcw size={18} />}
            acao={<a href={link('estudos', 'revisoes')} className="text-sm font-bold text-brand">Abrir</a>} />
          {vencidas.length ? (
            <ul className="divide-y divide-line -my-2">
              {vencidas.slice(0, 6).map((r) => (
                <li key={r.id} className="flex items-center gap-3 py-2.5">
                  <span className={cx('h-2 w-2 rounded-full shrink-0', r.proxima < hoje ? 'bg-bad' : 'bg-brand')} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold truncate">{r.frente}</span>
                    <span className="block text-xs text-muted">{(r.materia_id && nomeMateria.get(r.materia_id)) || (r.tipo === 'erro' ? 'Erro' : 'Cartão')}</span>
                  </span>
                  <span className={cx('text-xs font-bold', r.proxima < hoje ? 'text-bad' : 'text-muted')}>{r.proxima < hoje ? 'atrasada' : 'hoje'}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-start gap-3 rounded-lg bg-sunken p-4">
              <p className="text-sm text-muted">Cadastre cada questão que errar: o Rumo avisa o dia certo de revisar (1, 3, 7, 15, 30 e 60 dias).</p>
              <a href={link('estudos', 'revisoes')} className="text-sm font-bold text-brand">Cadastrar um erro →</a>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="flex flex-col gap-4">
          <CardTitulo titulo="Seu rumo financeiro" sub={`Cenário ${moderado?.nome.toLowerCase() ?? '—'} · valores de hoje`} acao={<a href={link('financas', 'liberdade')} className="text-sm font-bold text-brand">Ver</a>} />
          <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
            <div><p className="text-[13px] font-bold text-muted">Liberdade financeira</p><p className="titulo text-3xl">{idadeMeta ? `aos ${idadeMeta} anos` : 'não chega até os 70'}</p></div>
            <div><p className="text-[13px] font-bold text-muted">Patrimônio</p><p className="titulo text-3xl num">{brlCurto(patrimonio)}</p></div>
          </div>
          <Progress valor={patrimonio / meta} altura="h-2.5" />
          <p className="text-[13px] text-muted">Meta de {brlCurto(meta)}: {brlCurto(perfil.renda_desejada)}/mês sacando {Math.round(perfil.taxa_saque * 100)}% ao ano.</p>
        </Card>
        <Card>
          <CardTitulo titulo="Próximas metas" acao={<a href={link('carreira', 'metas')} className="text-sm font-bold text-brand">Todas</a>} />
          <ul className="flex flex-col gap-2">
            {proximasMetas.map((m) => {
              const s = situacaoMeta(m.prazo, m.status, hoje)
              return (
                <li key={m.id} className="flex items-center gap-3 rounded-lg bg-sunken px-3.5 py-3">
                  <span className={cx('h-2.5 w-2.5 rounded-full shrink-0', s === 'atrasada' ? 'bg-bad' : s === 'em-breve' ? 'bg-fire' : 'bg-ok')} />
                  <span className="flex-1 text-sm font-semibold">{m.titulo}</span>
                  <span className="text-xs font-bold text-muted whitespace-nowrap">{dataBR(m.prazo)}</span>
                </li>
              )
            })}
            {!proximasMetas.length && <p className="text-sm text-muted">Nenhuma meta aberta.</p>}
          </ul>
        </Card>
      </div>
    </div>
  )
}
