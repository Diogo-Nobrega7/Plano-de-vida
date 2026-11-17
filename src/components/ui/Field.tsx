import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { useId } from 'react'
import { cx } from './cx'

const base = 'w-full rounded-md border border-line bg-surface px-3 text-[15px] text-ink placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition'

export function Campo({ rotulo, dica, children, className }: { rotulo: string; dica?: ReactNode; children: (id: string) => ReactNode; className?: string }) {
  const id = useId()
  return (
    <div className={cx('flex flex-col gap-1.5 min-w-0', className)}>
      <label htmlFor={id} className="text-[13px] font-bold text-muted">{rotulo}</label>
      {children(id)}
      {dica && <span className="text-xs text-faint">{dica}</span>}
    </div>
  )
}

export function Input({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...p} className={cx(base, 'h-11', className)} />
}
export function Select({ className, children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...p} className={cx(base, 'h-11 pr-8', className)}>{children}</select>
}
export function Textarea({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...p} className={cx(base, 'py-2.5 leading-relaxed', className)} />
}

/** Número que aceita vazio (devolve null). */
export function NumberInput({ value, onValor, ...p }: Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & { value: number | null | undefined; onValor: (v: number | null) => void }) {
  return <Input type="number" inputMode="decimal" {...p} value={value ?? ''} onChange={(e) => onValor(e.target.value === '' ? null : Number(e.target.value))} />
}
