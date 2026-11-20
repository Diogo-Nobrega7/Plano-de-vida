/** Mapa do site. Para criar uma tela nova: adicione aqui e em App.tsx (PAGINAS). */
import { BookOpen, Compass, Home, PenLine, Wallet, type LucideIcon } from 'lucide-react'

export interface Secao { id: string; nome: string; icone: LucideIcon; abas: { id: string; nome: string }[] }

export const SECOES: Secao[] = [
  { id: 'hoje', nome: 'Hoje', icone: Home, abas: [] },
  { id: 'estudos', nome: 'Estudos', icone: BookOpen, abas: [
    { id: 'disciplinas', nome: 'Disciplinas' }, { id: 'cronograma', nome: 'Cronograma' }, { id: 'aulas', nome: 'Aulas' }, { id: 'foco', nome: 'Foco' },
    { id: 'revisoes', nome: 'Revisões' }, { id: 'simulados', nome: 'Simulados' }, { id: 'sisu', nome: 'SISU' }] },
  { id: 'redacao', nome: 'Redação', icone: PenLine, abas: [
    { id: 'escrever', nome: 'Escrever' }, { id: 'minhas', nome: 'Minhas redações' }, { id: 'temas', nome: 'Temas' }, { id: 'guia', nome: 'Guia nota 1000' }] },
  { id: 'financas', nome: 'Finanças', icone: Wallet, abas: [
    { id: 'resumo', nome: 'Resumo' }, { id: 'liberdade', nome: 'Liberdade financeira' }, { id: 'investir', nome: 'Investimentos' },
    { id: 'salario', nome: 'Salário e impostos' }, { id: 'orcamento', nome: 'Orçamento' }] },
  { id: 'carreira', nome: 'Carreira', icone: Compass, abas: [
    { id: 'linha', nome: 'Linha do tempo' }, { id: 'metas', nome: 'Metas' }, { id: 'comparador', nome: 'Comparador' }, { id: 'diario', nome: 'Diário' }] },
]

export interface Rota { secao: string; aba: string }

export function lerRota(hash: string): Rota {
  const [secao = 'hoje', aba = ''] = hash.replace(/^#\/?/, '').split('/')
  const s = SECOES.find((x) => x.id === secao) ?? (secao === 'perfil' ? { id: 'perfil', abas: [] as Secao['abas'] } : SECOES[0])
  return { secao: s.id, aba: s.abas.find((a) => a.id === aba)?.id ?? s.abas[0]?.id ?? '' }
}

export const link = (secao: string, aba?: string) => `#/${secao}${aba ? `/${aba}` : ''}`
