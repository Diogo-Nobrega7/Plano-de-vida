import type { ReactNode } from 'react'
import { cx } from './cx'

type Tom = 'brand' | 'ok' | 'bad' | 'fire' | 'neutro' | 'warn'
const tons: Record<Tom, string> = {
  brand: 'bg-brand-soft text-brand ring-brand/20', ok: 'bg-ok-soft text-ok ring-ok/20', bad: 'bg-bad-soft text-bad ring-bad/20',
  fire: 'bg-fire-soft text-fire ring-fire/20', neutro: 'bg-sunken text-muted ring-line', warn: 'bg-fire-soft text-warn ring-warn/20',
}
export function Badge({ tom = 'neutro', children, className }: { tom?: Tom; children: ReactNode; className?: string }) {
  return <span className={cx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-medium ring-1 ring-inset whitespace-nowrap [&_svg]:h-3 [&_svg]:w-3', tons[tom], className)}>{children}</span>
}
