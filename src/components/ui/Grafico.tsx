/** Estilo único dos gráficos (Recharts), usando os tokens de cor: claro e escuro iguais em todo o site. */
import type { ReactNode } from 'react'

export const eixo = { tick: { fontSize: 12, fill: 'rgb(var(--muted))' }, tickLine: false, axisLine: false } as const
export const grade = { stroke: 'rgb(var(--line))', vertical: false, strokeDasharray: '3 4' } as const
export const legenda = { iconType: 'circle' as const, iconSize: 8, wrapperStyle: { fontSize: 12, paddingTop: 8 } }

/** Paleta das séries (azuis + contrastes que se distinguem também pela claridade). */
export const SERIES = ['#1D4ED8', '#0EA5E9', '#16A34A', '#EA580C', '#7C3AED', '#DB2777', '#64748B', '#CA8A04', '#0F766E']

interface ItemTooltip { name?: string | number; value?: number | string; color?: string; dataKey?: string | number }

/** Caixa de detalhe ao passar o mouse/dedo. `formato` formata o valor; `titulo` o rótulo do eixo X. */
export function DicaGrafico({ active, payload, label, formato = (v) => String(v), titulo = (l) => String(l) }: {
  active?: boolean; payload?: ItemTooltip[]; label?: string | number
  formato?: (v: number) => ReactNode; titulo?: (l: string | number) => ReactNode
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-line bg-surface/95 backdrop-blur px-3 py-2.5 shadow-lg text-[13px] min-w-[140px]">
      {label != null && <p className="font-extrabold mb-1.5">{titulo(label)}</p>}
      <ul className="flex flex-col gap-1">
        {payload.filter((p) => p.value != null).map((p) => (
          <li key={String(p.dataKey ?? p.name)} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
            <span className="text-muted flex-1">{p.name}</span>
            <span className="font-bold num">{formato(Number(p.value))}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
