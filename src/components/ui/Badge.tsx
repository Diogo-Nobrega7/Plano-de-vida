import type { ReactNode } from 'react'
import { cx } from './cx'

type Tom = 'brand' | 'ok' | 'bad' | 'fire' | 'neutro' | 'warn'
const tons: Record<Tom, string> = {
  brand: 'bg-brand-soft text-brand', ok: 'bg-ok-soft text-ok', bad: 'bg-bad-soft text-bad',
  fire: 'bg-fire-soft text-fire', neutro: 'bg-sunken text-muted', warn: 'bg-fire-soft text-warn',
}
export function Badge({ tom = 'neutro', children, className }: { tom?: Tom; children: ReactNode; className?: string }) {
  return <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap', tons[tom], className)}>{children}</span>
}
