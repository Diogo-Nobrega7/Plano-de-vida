import { describe, expect, it } from 'vitest'
import { aporteNaIdade, idadeQueAtinge, patrimonioNecessario, realParaNominal, nominalParaReal, simularPatrimonio, taxaMensal, valorFuturo, type Fase } from './financas'
import { aliquotaRegressiva, brutoParaLiquido, inss, irrf, salarioLiquido } from './impostos'
import { CATALOGO, evolucao, simularInvestimento, taxasAnuais } from './investimentos'
import { estimar, PERFIS } from './orcamento'
import { pontuacao, situacaoMeta } from './carreira'
import { proximaRevisao, vencida } from './revisao'
import { mediaEnem, progresso } from './enem'
import { conquistas, missoesDoDia, nivel, sequencia, xpTotal } from './gamificacao'
import { diasEntre, inicioSemana, somarDias } from './datas'
import { brl, brlCurto, pct } from './format'

const F = (inicio: number, fim: number, aporte: number): Fase => ({ nome: '', inicio, fim, rendaMin: 0, rendaMax: 0, aporte })

describe('finanças', () => {
  it('taxa mensal composta', () => expect(Math.pow(1 + taxaMensal(0.05), 12) - 1).toBeCloseTo(0.05, 10))
  it('valor futuro', () => {
    expect(valorFuturo(1000, 0, 0.05, 120)).toBeCloseTo(1000 * 1.05 ** 10, 6)
    expect(valorFuturo(0, 100, 0, 12)).toBeCloseTo(1200)
    const i = taxaMensal(0.05)
    expect(valorFuturo(0, 3000, 0.05, 36)).toBeCloseTo((3000 * ((1 + i) ** 36 - 1)) / i, 4)
  })
  it('inflação', () => {
    expect(realParaNominal(50000, 0.045, 20)).toBeCloseTo(120586, -1)
    expect(nominalParaReal(realParaNominal(1000, 0.045, 7), 0.045, 7)).toBeCloseTo(1000)
  })
  it('meta de liberdade', () => {
    expect(patrimonioNecessario(50000)).toBe(15_000_000)
    expect(() => patrimonioNecessario(1, 0)).toThrow()
  })
  it('fases e simulação', () => {
    const fases = [F(16, 24, 0), F(24, 27, 3000), F(27, 32, 10000)]
    expect(aporteNaIdade(fases, 50)).toBe(10000)
    const p = new Map(simularPatrimonio(fases, 0.05, 16, 0, 32))
    const aos27 = valorFuturo(0, 3000, 0.05, 36)
    expect(p.get(27)).toBeCloseTo(aos27, 4)
    expect(p.get(32)).toBeCloseTo(valorFuturo(aos27, 10000, 0.05, 60), 2)
    expect(idadeQueAtinge([[30, 1], [31, 5]], 5)).toBe(31)
    expect(idadeQueAtinge([[30, 1]], 5)).toBeNull()
  })
  it('cenário moderado do plano chega à meta aos 56', () => {
    const fases = [F(16, 24, 0), F(24, 27, 3000), F(27, 32, 10000), F(32, 40, 18000), F(40, 70, 30000)]
    expect(idadeQueAtinge(simularPatrimonio(fases, 0.05, 16), 15e6)).toBe(56)
  })
})

describe('impostos 2026', () => {
  it('INSS', () => {
    expect(inss(1621)).toBeCloseTo(121.58, 1)
    expect(inss(8475.55)).toBeCloseTo(988.09, 2)
    expect(inss(50000)).toBe(inss(8475.55))
  })
  it('IR com isenção até 5 mil', () => {
    expect(irrf(2000)).toBe(0)
    expect(irrf(5000)).toBe(0)
    expect(irrf(6000)).toBeGreaterThan(0)
    expect(irrf(6000)).toBeLessThan(irrf(7350))
    expect(irrf(10000)).toBeCloseTo(9011.91 * 0.275 - 908.73, 2)
    expect(irrf(10000, 2)).toBeLessThan(irrf(10000))
  })
  it('líquido e inverso', () => {
    const r = salarioLiquido(10000, 0, 100)
    expect(r.liquido).toBeCloseTo(10000 - r.inss - r.ir - 100, 2)
    expect(salarioLiquido(brutoParaLiquido(20000)).liquido).toBeCloseTo(20000, 1)
  })
  it('tabela regressiva', () => {
    expect([100, 200, 500, 1000].map(aliquotaRegressiva)).toEqual([0.225, 0.2, 0.175, 0.15])
  })
})

describe('investimentos', () => {
  it('bruto = juros compostos; isento sem imposto', () => {
    const r = simularInvestimento(1000, 100, 0.1, 60, 'isento')
    expect(r.bruto).toBeCloseTo(valorFuturo(1000, 100, 0.1, 60), 6)
    expect(r.imposto).toBe(0)
  })
  it('IR regressivo de 15% no longo prazo e 15% em ações', () => {
    const a = simularInvestimento(1000, 0, 0.1, 36, 'regressivo')
    expect(a.imposto).toBeCloseTo((a.bruto - 1000) * 0.15, 6)
    const b = simularInvestimento(1000, 0, 0.1, 12, 'acoes')
    expect(b.imposto).toBeCloseTo((b.bruto - 1000) * 0.15, 6)
  })
  it('taxa variável por ano, inflação e evolução', () => {
    expect(simularInvestimento(1000, 0, [0.1, 0.2], 24, 'isento').bruto).toBeCloseTo(1320, 6)
    expect(simularInvestimento(1000, 0, 0, 12, 'isento', 0.05).liquidoReal).toBeCloseTo(1000 / 1.05, 6)
    const t = taxasAnuais(CATALOGO[0], 5)
    expect(t[0]).toBeGreaterThan(t[4])
    expect(evolucao(500, 200, t, 60).at(-1)).toBeCloseTo(simularInvestimento(500, 200, t, 60, 'isento').bruto, 4)
  })
})

describe('orçamento, carreira, revisão, ENEM', () => {
  it('percentuais somam 100%', () => {
    for (const p of PERFIS) expect(estimar(1000, p).reduce((s, x) => s + x.valor, 0)).toBeCloseTo(1000)
  })
  it('pontuação ponderada', () => {
    const c = [{ nome: 'a', peso: 3, descricao: '' }, { nome: 'b', peso: 1, descricao: '' }]
    expect(pontuacao({ a: 5, b: 1 }, c)).toBe(4)
    expect(pontuacao({ a: 5 }, [{ nome: 'a', peso: 0, descricao: '' }])).toBe(0)
  })
  it('situação da meta', () => {
    const h = '2026-11-14'
    expect(situacaoMeta('2026-12-31', 'concluída', h)).toBe('concluida')
    expect(situacaoMeta('2026-01-01', 'em andamento', h)).toBe('atrasada')
    expect(situacaoMeta('2026-11-20', 'não iniciada', h)).toBe('em-breve')
    expect(situacaoMeta('2027-06-30', 'não iniciada', h)).toBe('no-prazo')
    expect(situacaoMeta(null, 'não iniciada', h)).toBe('sem-prazo')
  })
  it('revisão espaçada', () => {
    expect(proximaRevisao(1, true, '2026-11-17')).toEqual({ caixa: 2, proxima: '2026-11-20' })
    expect(proximaRevisao(4, false, '2026-11-17')).toEqual({ caixa: 1, proxima: '2026-11-18' })
    expect(proximaRevisao(6, true, '2026-11-17').caixa).toBe(6)
    expect(vencida('2026-11-17', '2026-11-17')).toBe(true)
    expect(vencida('2026-11-18', '2026-11-17')).toBe(false)
  })
  it('progresso e média', () => {
    expect(progresso(['dominado', 'não estudado'])).toBe(0.5)
    expect(progresso([])).toBe(0)
    expect(mediaEnem({ lc: 700, ch: 700, cn: 700, mt: 900, redacao: 1000 })).toBe(800)
    expect(mediaEnem({ lc: 700 })).toBeNull()
  })
})

describe('gamificação', () => {
  it('nível', () => {
    expect(nivel(0).nivel).toBe(1)
    expect(nivel(150).nivel).toBe(2)
    expect(nivel(449).nivel).toBe(2)
    expect(nivel(450).nivel).toBe(3)
    expect(nivel(300).progresso).toBeCloseTo(0.5)
  })
  it('sequência', () => {
    const h = '2026-11-17'
    expect(sequencia(['2026-11-15', '2026-11-16', '2026-11-17'], h)).toEqual({ atual: 3, recorde: 3, estudouHoje: true })
    expect(sequencia(['2026-11-15', '2026-11-16'], h).atual).toBe(2) // ainda pode estudar hoje
    expect(sequencia(['2026-11-10', '2026-11-11', '2026-11-12', '2026-11-16'], h)).toEqual({ atual: 1, recorde: 3, estudouHoje: false })
    expect(sequencia([], h).atual).toBe(0)
  })
  it('xp, missões e conquistas', () => {
    const a = { sessoes: [{ data: '2026-11-17', minutos: 50, questoes: 10 }], aulasAssistidas: 1, redacoes: 1, simulados: 0, revisoesFeitas: 0, conteudosDominados: 0 }
    expect(xpTotal(a)).toBe(50 + 20 + 15 + 60)
    const m = missoesDoDia([{ minutos: 30, questoes: 5 }, { minutos: 20 }], 1, 3)
    expect(m.find((x) => x.chave === 'foco')!.feito).toBe(50)
    expect(m.find((x) => x.chave === 'questoes')!.feito).toBe(5)
    const c = conquistas({ ...a, recorde: 7, totalQuestoes: 10 })
    expect(c.find((x) => x.nome === '7 dias seguidos')!.ganhou).toBe(true)
    expect(c.find((x) => x.nome === '10 redações')!.ganhou).toBe(false)
  })
})

describe('datas e formato', () => {
  it('datas', () => {
    expect(somarDias('2026-12-30', 3)).toBe('2027-01-02')
    expect(diasEntre('2026-11-17', '2028-11-05')).toBe(719)
    expect(inicioSemana('2026-11-19')).toBe('2026-11-16')
  })
  it('formato', () => {
    expect(brlCurto(15_000_000)).toBe('R$ 15 mi')
    expect(brlCurto(820_000)).toBe('R$ 820 mil')
    expect(pct(0.1375)).toBe('13,75%')
    expect(brl(1234).replace(/\s/g, ' ')).toBe('R$ 1.234')
  })
})
