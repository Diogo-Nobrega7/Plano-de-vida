/** XP, nível, sequência de dias e missões — tudo calculado a partir dos seus registros. */
import { hojeISO, somarDias } from './datas'

export const XP = { porMinuto: 1, porQuestao: 2, aula: 15, redacao: 60, simulado: 120, revisao: 3, conteudoDominado: 25 }

export interface Atividade {
  sessoes: { data: string; minutos: number; questoes?: number | null }[]
  aulasAssistidas: number
  redacoes: number
  simulados: number
  revisoesFeitas: number
  conteudosDominados: number
}

export function xpTotal(a: Atividade): number {
  const ses = a.sessoes.reduce((s, x) => s + x.minutos * XP.porMinuto + (x.questoes ?? 0) * XP.porQuestao, 0)
  return Math.round(ses + a.aulasAssistidas * XP.aula + a.redacoes * XP.redacao + a.simulados * XP.simulado
    + a.revisoesFeitas * XP.revisao + a.conteudosDominados * XP.conteudoDominado)
}

export const TITULOS = ['Começando', 'Curioso', 'Disciplinado', 'Constante', 'Focado', 'Determinado', 'Obstinado', 'Imparável', 'Mestre', 'Lenda']

/** Nível n exige 150·n·(n+1)/2 XP acumulado (cada nível pede 150 XP a mais que o anterior). */
export function nivel(xp: number) {
  let n = 1
  while (xp >= 75 * n * (n + 1)) n++
  const base = 75 * (n - 1) * n, prox = 75 * n * (n + 1)
  return { nivel: n, titulo: TITULOS[Math.min(n - 1, TITULOS.length - 1)], xpNoNivel: xp - base, xpParaProximo: prox - base, progresso: (xp - base) / (prox - base) }
}

/** Dias seguidos com estudo, terminando hoje (ou ontem, se hoje ainda não estudou). */
export function sequencia(datas: string[], hoje = hojeISO()): { atual: number; recorde: number; estudouHoje: boolean } {
  const set = new Set(datas)
  const estudouHoje = set.has(hoje)
  let d = estudouHoje ? hoje : somarDias(hoje, -1), atual = 0
  while (set.has(d)) { atual++; d = somarDias(d, -1) }
  const ord = [...set].sort()
  let recorde = 0, run = 0, ant = ''
  for (const x of ord) { run = ant && somarDias(ant, 1) === x ? run + 1 : 1; recorde = Math.max(recorde, run); ant = x }
  return { atual, recorde, estudouHoje }
}

export interface Missao { chave: string; nome: string; feito: number; meta: number; unidade?: string }

export function missoesDoDia(sessoesHoje: { minutos: number; questoes?: number | null }[], aulasHoje: number, revisoesHoje: number, metas = { questoes: 20, minutos: 120, aulas: 2, revisoes: 10 }): Missao[] {
  const min = sessoesHoje.reduce((s, x) => s + x.minutos, 0)
  const q = sessoesHoje.reduce((s, x) => s + (x.questoes ?? 0), 0)
  return [
    { chave: 'questoes', nome: 'Questões', feito: q, meta: metas.questoes },
    { chave: 'aulas', nome: 'Aulas', feito: aulasHoje, meta: metas.aulas },
    { chave: 'foco', nome: 'Tempo de foco', feito: min, meta: metas.minutos, unidade: 'min' },
    { chave: 'revisoes', nome: 'Revisões', feito: revisoesHoje, meta: metas.revisoes },
  ]
}

export interface Conquista { nome: string; descricao: string; ganhou: boolean }

export function conquistas(a: Atividade & { recorde: number; totalQuestoes: number }): Conquista[] {
  const horas = a.sessoes.reduce((s, x) => s + x.minutos, 0) / 60
  return [
    { nome: 'Primeiro passo', descricao: 'Registrou a primeira sessão de estudo', ganhou: a.sessoes.length > 0 },
    { nome: '7 dias seguidos', descricao: 'Uma semana sem falhar', ganhou: a.recorde >= 7 },
    { nome: '30 dias seguidos', descricao: 'Um mês inteiro estudando', ganhou: a.recorde >= 30 },
    { nome: '10 horas', descricao: '10 horas de foco registradas', ganhou: horas >= 10 },
    { nome: '100 horas', descricao: '100 horas de foco registradas', ganhou: horas >= 100 },
    { nome: '500 questões', descricao: 'Meio milhar de questões resolvidas', ganhou: a.totalQuestoes >= 500 },
    { nome: 'Primeira redação', descricao: 'Escreveu e corrigiu uma redação', ganhou: a.redacoes >= 1 },
    { nome: '10 redações', descricao: 'Dez redações corrigidas', ganhou: a.redacoes >= 10 },
    { nome: 'Primeiro simulado', descricao: 'Fez um simulado completo', ganhou: a.simulados >= 1 },
    { nome: '20 conteúdos dominados', descricao: 'Marcou 20 conteúdos como dominados', ganhou: a.conteudosDominados >= 20 },
  ]
}
