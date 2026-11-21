import { useEffect, useMemo, useRef, useState } from 'react'
import { CornerDownLeft, Search, User } from 'lucide-react'
import { SECOES, link } from '@/app/routes'
import { cx } from '@/components/ui'

interface Item { titulo: string; secao: string; href: string; icone: typeof User }
const ITENS: Item[] = [
  ...SECOES.flatMap((s) => (s.abas.length ? s.abas.map((a) => ({ titulo: a.nome, secao: s.nome, href: link(s.id, a.id), icone: s.icone })) : [{ titulo: s.nome, secao: 'Início', href: link(s.id), icone: s.icone }])),
  { titulo: 'Perfil e metas', secao: 'Conta', href: link('perfil'), icone: User },
]
const norm = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Busca rápida (Ctrl/⌘ + K): vai para qualquer tela digitando o nome. */
export function Busca({ aberta, onFechar }: { aberta: boolean; onFechar: () => void }) {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const ref = useRef<HTMLInputElement>(null)
  const lista = useMemo(() => ITENS.filter((i) => !q || norm(`${i.titulo} ${i.secao}`).includes(norm(q))), [q])
  useEffect(() => { if (aberta) { setQ(''); setSel(0); setTimeout(() => ref.current?.focus(), 10) } }, [aberta])
  useEffect(() => setSel(0), [q])
  if (!aberta) return null
  const ir = (i?: Item) => { if (i) { location.hash = i.href; onFechar() } }
  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Buscar tela">
      <div className="entrar absolute inset-0 bg-night/60 backdrop-blur-sm" onClick={onFechar} />
      <div className="surgir relative w-full max-w-lg overflow-hidden rounded-xl border border-line bg-surface shadow-lg">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search size={17} className="text-faint" />
          <input ref={ref} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ir para… (ex.: cronograma, redação, salário)" aria-label="Buscar tela"
            onKeyDown={(e) => {
              if (e.key === 'Escape') onFechar()
              if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, lista.length - 1)) }
              if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)) }
              if (e.key === 'Enter') ir(lista[sel])
            }}
            className="h-12 flex-1 bg-transparent text-[15px] outline-none focus-visible:outline-none placeholder:text-faint" />
          <kbd className="rounded border border-line px-1.5 py-0.5 text-[11px] text-faint">Esc</kbd>
        </div>
        <ul className="max-h-[50vh] overflow-auto p-1.5">
          {lista.map((i, k) => (
            <li key={i.href}>
              <button type="button" onMouseEnter={() => setSel(k)} onClick={() => ir(i)}
                className={cx('flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm', k === sel ? 'bg-brand-soft text-ink' : 'text-muted')}>
                <i.icone size={16} className={k === sel ? 'text-brand' : 'text-faint'} />
                <span className="flex-1 font-medium">{i.titulo}</span>
                <span className="text-xs text-faint">{i.secao}</span>
                {k === sel && <CornerDownLeft size={14} className="text-faint" />}
              </button>
            </li>
          ))}
          {!lista.length && <li className="px-3 py-6 text-center text-sm text-muted">Nada encontrado.</li>}
        </ul>
      </div>
    </div>
  )
}
