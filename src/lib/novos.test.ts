import { describe, expect, it } from 'vitest'
import { conflita, diaDaSemana, fimDoBloco, sugerirSemana } from './cronograma'
import { PESOS_IGUAIS, faixa, notaSisu } from './sisu'

describe('cronograma', () => {
  it('horários e dia da semana', () => {
    expect(fimDoBloco('14:00', 50)).toBe('14:50')
    expect(fimDoBloco('23:30', 60)).toBe('00:30')
    expect(diaDaSemana('2026-11-16')).toBe(0) // segunda
    expect(diaDaSemana('2026-11-22')).toBe(6) // domingo
  })
  it('conflito de horários', () => {
    expect(conflita({ dia: 0, inicio: '14:00', minutos: 50 }, { dia: 0, inicio: '14:40', minutos: 30 })).toBe(true)
    expect(conflita({ dia: 0, inicio: '14:00', minutos: 50 }, { dia: 0, inicio: '14:50', minutos: 30 })).toBe(false)
    expect(conflita({ dia: 0, inicio: '14:00', minutos: 50 }, { dia: 1, inicio: '14:00', minutos: 50 })).toBe(false)
  })
  it('sugestão respeita as horas e os pesos', () => {
    const b = sugerirSemana([2, 2, 2, 2, 2, 0, 0], [{ materia_id: 'mat', peso: 3 }, { materia_id: 'bio', peso: 1 }])
    expect(b.filter((x) => x.dia === 0)).toHaveLength(2) // 2h = 2 blocos de 50 + pausa
    expect(b.filter((x) => x.dia >= 5)).toHaveLength(0)
    const mat = b.filter((x) => x.materia_id === 'mat').length
    expect(mat / b.length).toBeGreaterThan(0.6)
    expect(b[0].inicio).toBe('14:00'); expect(b[1].inicio).toBe('15:00')
    expect(sugerirSemana([2], [])).toEqual([])
  })
})

describe('sisu', () => {
  it('média ponderada', () => {
    const n = { lc: 700, ch: 700, cn: 800, mt: 800, redacao: 900 }
    expect(notaSisu(n, PESOS_IGUAIS)).toBe(780)
    expect(notaSisu(n, { lc: 1, ch: 1, cn: 2, mt: 2, redacao: 2 })).toBeCloseTo((700 + 700 + 1600 + 1600 + 1800) / 8)
    expect(notaSisu({ lc: 700 }, PESOS_IGUAIS)).toBeNull()
  })
  it('faixa até o corte', () => {
    expect(faixa(820, 818.5)).toBe('dentro')
    expect(faixa(800, 818.5)).toBe('perto')
    expect(faixa(700, 818.5)).toBe('longe')
    expect(faixa(null, 818.5)).toBe('sem-dados')
  })
})
