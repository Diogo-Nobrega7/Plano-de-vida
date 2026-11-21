import { useEffect, useState, type ReactNode } from 'react'
import { ChevronRight, Flame, LogOut, Monitor, Moon, Search, Sun, User } from 'lucide-react'
import { SECOES, link, type Rota } from '@/app/routes'
import { Marca } from './Marca'
import { Busca } from './Busca'
import { Camada, Progress, cx } from '@/components/ui'
import { useTema, type Tema } from '@/app/useTema'
import { usePerfil } from '@/app/PerfilContext'
import { useProgresso } from '@/data/useProgresso'
import { supabase, modoLocal } from '@/data/supabase'

const TEMAS: { v: Tema; i: ReactNode; n: string }[] = [
  { v: 'claro', i: <Sun size={14} />, n: 'Claro' }, { v: 'escuro', i: <Moon size={14} />, n: 'Escuro' }, { v: 'sistema', i: <Monitor size={14} />, n: 'Auto' }]

/** Menu da conta: perfil, tema e sair. `acima` abre para cima (rodapé da barra lateral). */
function MenuConta({ acima = false, children }: { acima?: boolean; children: ReactNode }) {
  const [aberto, setAberto] = useState(false)
  const { tema, setTema } = useTema()
  const { perfil } = usePerfil()
  return (
    <div className="relative">
      <button type="button" onClick={() => setAberto(!aberto)} aria-label="Menu da conta" aria-expanded={aberto} className="w-full">{children}</button>
      {aberto && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setAberto(false)} />
          <div className={cx('surgir absolute z-40 w-60 card p-1.5 shadow-lg', acima ? 'bottom-full mb-2 left-0' : 'top-full mt-2 right-0')}>
            <div className="px-2.5 py-2 border-b border-line mb-1">
              <p className="text-sm font-semibold">{perfil.nome || 'Você'}</p>
              <p className="text-xs text-faint">{modoLocal ? 'Modo local · dados neste navegador' : 'Conectado ao Supabase'}</p>
            </div>
            <a href={link('perfil')} onClick={() => setAberto(false)} className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted hover:text-ink hover:bg-sunken"><User size={15} />Perfil e metas</a>
            <p className="px-2.5 pt-2 pb-1.5 rotulo">Tema</p>
            <div className="grid grid-cols-3 gap-1 px-1 pb-1">
              {TEMAS.map((t) => (
                <button key={t.v} type="button" onClick={() => setTema(t.v)} aria-pressed={tema === t.v}
                  className={cx('flex flex-col items-center gap-1 rounded-md py-2 text-[11.5px] font-medium transition-colors', tema === t.v ? 'bg-brand-soft text-brand' : 'text-muted hover:bg-sunken')}>{t.i}{t.n}</button>
              ))}
            </div>
            {supabase && <button type="button" onClick={() => supabase!.auth.signOut()} className="mt-1 flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-bad hover:bg-bad-soft"><LogOut size={15} />Sair</button>}
          </div>
        </>
      )}
    </div>
  )
}

function Avatar({ tamanho = 'h-8 w-8' }: { tamanho?: string }) {
  const { perfil } = usePerfil()
  return <span className={cx('grid place-items-center rounded-full bg-gradient-to-br from-[#6A93FF] to-[#1D3FC2] text-[13px] font-semibold text-white ring-2 ring-surface', tamanho)}>{(perfil.nome || 'R').slice(0, 1).toUpperCase()}</span>
}

function Sidebar({ rota, abrirBusca }: { rota: Rota; abrirBusca: () => void }) {
  const { perfil } = usePerfil()
  const { seq, nivel } = useProgresso()
  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-[248px] flex-col border-r border-line bg-surface/70 backdrop-blur-xl">
      <div className="flex h-14 items-center px-4"><a href={link('hoje')} aria-label="Início"><Marca /></a></div>
      <div className="px-3">
        <button type="button" onClick={abrirBusca} className="flex h-9 w-full items-center gap-2 rounded-md border border-line bg-sunken/60 px-2.5 text-[13px] text-faint hover:text-muted hover:border-line-strong transition-colors">
          <Search size={14} /><span className="flex-1 text-left">Buscar</span><kbd className="rounded border border-line px-1 text-[10.5px]">Ctrl K</kbd>
        </button>
      </div>
      <nav aria-label="Principal" className="mt-4 flex-1 overflow-y-auto px-3 pb-4">
        <p className="rotulo px-2 mb-1.5">Menu</p>
        <ul className="flex flex-col gap-0.5">
          {SECOES.map((s) => {
            const ativa = rota.secao === s.id
            return (
              <li key={s.id}>
                <a href={link(s.id)} aria-current={ativa && !s.abas.length ? 'page' : undefined}
                  className={cx('group flex h-9 items-center gap-2.5 rounded-md px-2.5 text-[13.5px] font-medium transition-colors',
                    ativa ? 'bg-brand-soft text-ink' : 'text-muted hover:text-ink hover:bg-sunken')}>
                  <s.icone size={16} className={ativa ? 'text-brand' : 'text-faint group-hover:text-muted'} />
                  <span className="flex-1">{s.nome}</span>
                  {s.abas.length > 0 && <ChevronRight size={14} className={cx('text-faint transition-transform', ativa && 'rotate-90')} />}
                </a>
                {ativa && s.abas.length > 0 && (
                  <ul className="entrar ml-[19px] mt-0.5 mb-1 flex flex-col border-l border-line pl-2.5">
                    {s.abas.map((a) => (
                      <li key={a.id}>
                        <a href={link(s.id, a.id)} aria-current={rota.aba === a.id ? 'page' : undefined}
                          className={cx('relative flex h-8 items-center rounded-md px-2.5 text-[13px] transition-colors',
                            rota.aba === a.id ? 'text-ink font-medium bg-sunken before:absolute before:-left-[11px] before:top-1.5 before:bottom-1.5 before:w-0.5 before:rounded-full before:bg-brand' : 'text-muted hover:text-ink')}>
                          {a.nome}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </nav>
      <div className="border-t border-line p-3 flex flex-col gap-2">
        <div className="rounded-lg border border-line bg-sunken/60 p-3">
          <div className="flex items-center justify-between text-[12.5px]">
            <span className="font-medium">Nível {nivel.nivel} <span className="text-faint">· {nivel.titulo}</span></span>
            <span className={cx('flex items-center gap-1 font-semibold num', seq.atual ? 'text-fire' : 'text-faint')} title="Dias seguidos estudando"><Flame size={13} />{seq.atual}</span>
          </div>
          <Progress valor={nivel.progresso} className="mt-2" />
          <p className="mt-1.5 text-[11px] text-faint num">{nivel.xpNoNivel} / {nivel.xpParaProximo} XP</p>
        </div>
        <MenuConta acima>
          <span className="flex items-center gap-2.5 rounded-md px-1.5 py-1.5 hover:bg-sunken transition-colors">
            <Avatar />
            <span className="min-w-0 flex-1 text-left"><span className="block text-[13px] font-medium truncate">{perfil.nome || 'Você'}</span><span className="block text-[11.5px] text-faint truncate">{perfil.curso || 'Rumo'}</span></span>
          </span>
        </MenuConta>
      </div>
    </aside>
  )
}

export function AppShell({ rota, children }: { rota: Rota; children: ReactNode }) {
  const secao = SECOES.find((s) => s.id === rota.secao)
  const aba = secao?.abas.find((a) => a.id === rota.aba)
  const { seq } = useProgresso()
  const [busca, setBusca] = useState(false)

  useEffect(() => {
    const f = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setBusca((b) => !b) } }
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [])

  return (
    <div className="min-h-screen">
      <Sidebar rota={rota} abrirBusca={() => setBusca(true)} />

      <div className="lg:pl-[248px] pb-24 lg:pb-0">
        <header className="sticky top-0 z-20 border-b border-line bg-bg/75 backdrop-blur-xl">
          <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-3 px-4 md:px-8">
            <a href={link('hoje')} aria-label="Início" className="lg:hidden"><Marca /></a>
            <nav aria-label="Você está em" className="hidden lg:flex items-center gap-1.5 text-[13px] text-faint">
              <span>{secao?.nome ?? (rota.secao === 'perfil' ? 'Perfil' : 'Hoje')}</span>
              {aba && <><ChevronRight size={13} /><span className="text-ink font-medium">{aba.nome}</span></>}
            </nav>
            <div className="ml-auto flex items-center gap-2">
              {modoLocal && <span title="Os dados ficam só neste navegador. Para salvar online, configure o Supabase." className="hidden sm:inline-flex rounded-full border border-line px-2.5 py-0.5 text-[11.5px] text-faint">Modo local</span>}
              <button type="button" onClick={() => setBusca(true)} aria-label="Buscar tela" className="lg:hidden grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-sunken"><Search size={16} /></button>
              <span title="Dias seguidos estudando" className={cx('lg:hidden flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-semibold num', seq.atual ? 'bg-fire-soft text-fire' : 'bg-sunken text-faint')}><Flame size={14} />{seq.atual}</span>
              <div className="lg:hidden"><MenuConta><Avatar /></MenuConta></div>
            </div>
          </div>
          {secao && secao.abas.length > 0 && (
            <div className="lg:hidden border-t border-line/60">
              <nav aria-label={secao.nome} className="flex gap-1 overflow-x-auto px-4 py-2 [scrollbar-width:none]">
                {secao.abas.map((a) => (
                  <a key={a.id} href={link(secao.id, a.id)} aria-current={rota.aba === a.id ? 'page' : undefined}
                    className={cx('whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors',
                      rota.aba === a.id ? 'bg-brand text-brand-ink' : 'text-muted bg-sunken hover:text-ink')}>{a.nome}</a>
                ))}
              </nav>
            </div>
          )}
        </header>

        <main key={rota.secao + rota.aba} className="entrar mx-auto max-w-[1200px] px-4 md:px-8 py-6 md:py-8">{children}</main>
      </div>

      <nav aria-label="Principal" className="lg:hidden fixed bottom-0 inset-x-0 z-20 border-t border-line bg-surface/90 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5">
          {SECOES.map((s) => {
            const ativa = rota.secao === s.id
            return (
              <a key={s.id} href={link(s.id)} aria-current={ativa ? 'page' : undefined} className={cx('relative flex flex-col items-center gap-1 pt-2.5 pb-2 text-[11px] font-medium transition-colors', ativa ? 'text-brand' : 'text-faint')}>
                {ativa && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-brand" />}
                <s.icone size={20} strokeWidth={ativa ? 2.4 : 1.9} />{s.nome}
              </a>
            )
          })}
        </div>
      </nav>

      <Camada><Busca aberta={busca} onFechar={() => setBusca(false)} /></Camada>
    </div>
  )
}
