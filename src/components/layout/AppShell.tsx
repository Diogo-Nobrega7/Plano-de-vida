import { useState, type ReactNode } from 'react'
import { Flame, LogOut, Monitor, Moon, Sparkles, Sun, User } from 'lucide-react'
import { SECOES, link, type Rota } from '@/app/routes'
import { Marca } from './Marca'
import { cx } from '@/components/ui'
import { useTema, type Tema } from '@/app/useTema'
import { usePerfil } from '@/app/PerfilContext'
import { useProgresso } from '@/data/useProgresso'
import { supabase, modoLocal } from '@/data/supabase'

function MenuUsuario() {
  const [aberto, setAberto] = useState(false)
  const { tema, setTema } = useTema()
  const { perfil } = usePerfil()
  const temas: { v: Tema; i: ReactNode; n: string }[] = [
    { v: 'sistema', i: <Monitor size={15} />, n: 'Sistema' }, { v: 'claro', i: <Sun size={15} />, n: 'Claro' }, { v: 'escuro', i: <Moon size={15} />, n: 'Escuro' }]
  return (
    <div className="relative">
      <button type="button" onClick={() => setAberto(!aberto)} aria-label="Menu da conta" aria-expanded={aberto}
        className="grid h-10 w-10 place-items-center rounded-full bg-night text-white font-bold hover:ring-4 hover:ring-brand/20 transition">
        {(perfil.nome || 'R').slice(0, 1).toUpperCase()}
      </button>
      {aberto && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setAberto(false)} />
          <div className="entrar absolute right-0 top-12 z-40 w-64 card p-2 shadow-lg">
            <div className="px-3 py-2">
              <p className="font-bold">{perfil.nome || 'Você'}</p>
              <p className="text-xs text-muted">{modoLocal ? 'Modo local (dados neste navegador)' : 'Conectado'}</p>
            </div>
            <a href={link('perfil')} onClick={() => setAberto(false)} className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-semibold hover:bg-sunken"><User size={16} />Perfil e metas</a>
            <div className="px-3 pt-2 pb-1 text-xs font-bold text-muted">Tema</div>
            <div className="grid grid-cols-3 gap-1 px-1 pb-1">
              {temas.map((t) => (
                <button key={t.v} type="button" onClick={() => setTema(t.v)} aria-pressed={tema === t.v}
                  className={cx('flex flex-col items-center gap-1 rounded-md py-2 text-xs font-bold', tema === t.v ? 'bg-brand-soft text-brand' : 'text-muted hover:bg-sunken')}>{t.i}{t.n}</button>
              ))}
            </div>
            {supabase && (
              <button type="button" onClick={() => supabase!.auth.signOut()} className="mt-1 flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-semibold text-bad hover:bg-bad-soft"><LogOut size={16} />Sair</button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export function AppShell({ rota, children }: { rota: Rota; children: ReactNode }) {
  const secao = SECOES.find((s) => s.id === rota.secao)
  const { seq, nivel } = useProgresso()
  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <header className="sticky top-0 z-20 border-b border-line bg-surface/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1240px] items-center gap-6 px-4 md:px-6 h-16">
          <a href={link('hoje')} aria-label="Início"><Marca /></a>
          <nav aria-label="Principal" className="hidden md:flex items-center gap-1 flex-1">
            {SECOES.map((s) => (
              <a key={s.id} href={link(s.id)} aria-current={rota.secao === s.id ? 'page' : undefined}
                className={cx('flex items-center gap-2 rounded-md px-3.5 py-2 text-[14px] font-bold transition-colors',
                  rota.secao === s.id ? 'bg-brand-soft text-brand' : 'text-muted hover:text-ink hover:bg-sunken')}>
                <s.icone size={16} strokeWidth={2.4} />{s.nome}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {modoLocal && <span title="Os dados ficam só neste navegador. Para salvar online, configure o Supabase." className="hidden sm:inline-flex rounded-full border border-line px-2.5 py-1 text-xs font-bold text-muted">Modo local</span>}
            <span title={`Nível ${nivel.nivel} · ${nivel.titulo}`} className="hidden sm:flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1.5 text-sm font-extrabold text-brand num">
              <Sparkles size={15} strokeWidth={2.6} />Nv {nivel.nivel}
            </span>
            <span title="Dias seguidos estudando" className={cx('flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-extrabold num', seq.atual ? 'bg-fire-soft text-fire' : 'bg-sunken text-muted')}>
              <Flame size={16} strokeWidth={2.6} />{seq.atual}
            </span>
            <MenuUsuario />
          </div>
        </div>
        {secao && secao.abas.length > 0 && (
          <div className="mx-auto max-w-[1240px] px-4 md:px-6">
            <nav aria-label={secao.nome} className="flex gap-1 overflow-x-auto -mb-px [scrollbar-width:none]">
              {secao.abas.map((a) => (
                <a key={a.id} href={link(secao.id, a.id)} aria-current={rota.aba === a.id ? 'page' : undefined}
                  className={cx('whitespace-nowrap border-b-2 px-3 py-3 text-[14px] font-bold transition-colors',
                    rota.aba === a.id ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink')}>
                  {a.nome}
                </a>
              ))}
            </nav>
          </div>
        )}
      </header>

      <main key={rota.secao + rota.aba} className="entrar mx-auto max-w-[1240px] px-4 md:px-6 py-6 md:py-9">{children}</main>

      <nav aria-label="Principal" className="md:hidden fixed bottom-0 inset-x-0 z-20 border-t border-line bg-surface/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5">
          {SECOES.map((s) => (
            <a key={s.id} href={link(s.id)} aria-current={rota.secao === s.id ? 'page' : undefined}
              className={cx('flex flex-col items-center gap-1 py-2.5 text-[11px] font-bold', rota.secao === s.id ? 'text-brand' : 'text-muted')}>
              <s.icone size={21} strokeWidth={rota.secao === s.id ? 2.6 : 2} />{s.nome}
            </a>
          ))}
        </div>
      </nav>
    </div>
  )
}
