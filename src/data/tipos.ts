/** Formato de cada tabela (iguais no Supabase e no modo local). Todo registro tem `id`. */
import type { Fase } from '@/lib/financas'
import type { Criterio } from '@/lib/carreira'

export interface Base { id: string; criado_em?: string }

export interface Perfil extends Base {
  nome: string
  nascimento: string | null // AAAA-MM-DD
  data_enem: string // AAAA-MM-DD
  curso: string
  faculdade: string
  metas_nota: { lc: number; ch: number; cn: number; mt: number; redacao: number }
  missoes: { questoes: number; minutos: number; aulas: number; revisoes: number }
  renda_desejada: number
  taxa_saque: number
  inflacao: number
  criterios: Criterio[]
  onboarding_ok: boolean
}

export interface Lancamento extends Base { mes: string; tipo: 'receita' | 'despesa' | 'aporte'; categoria: string; descricao: string | null; valor: number }
export interface Investimento extends Base { nome: string; tipo: string; valor_aplicado: number; saldo_atual: number; atualizado_em: string | null }
export interface Cenario extends Base { nome: string; taxa_real: number; descricao: string | null; fases: Fase[]; ordem: number }
export interface Meta extends Base { titulo: string; area: string; prazo: string | null; status: 'não iniciada' | 'em andamento' | 'concluída'; notas: string | null }
export interface Carreira extends Base { nome: string; notas: Record<string, number>; observacoes: string | null }
export interface Decisao extends Base { data: string; decisao: string; premissas: string | null; revisar_em: string | null; resultado: string | null }
export interface Materia extends Base { area: string; nome: string; ordem: number }
export interface Conteudo extends Base { materia_id: string; nome: string; frequencia: 'Alta' | 'Média' | 'Baixa'; status: string; revisado_em: string | null; ordem: number }
export interface Aula extends Base { materia_id: string; conteudo: string | null; titulo: string; url: string; canal: string | null; assistida: boolean; assistida_em: string | null; notas: string | null }
export interface Sessao extends Base { data: string; materia_id: string | null; minutos: number; questoes: number | null; acertos: number | null; observacoes: string | null }
export interface Simulado extends Base { data: string; nome: string; lc: number | null; ch: number | null; cn: number | null; mt: number | null; redacao: number | null }
export interface Tema extends Base { tema: string; ano: number | null; origem: 'ENEM' | 'Treino' }
export interface Redacao extends Base { data: string; tema: string; texto: string; c1: number | null; c2: number | null; c3: number | null; c4: number | null; c5: number | null; corretor: string | null; comentarios: string | null }
export interface Revisao extends Base { tipo: 'erro' | 'cartao'; materia_id: string | null; frente: string; verso: string | null; origem: string | null; caixa: number; proxima: string; feitas: number; ultima: string | null }

export interface Tabelas {
  perfil: Perfil; lancamentos: Lancamento; investimentos: Investimento; cenarios: Cenario; metas: Meta; carreiras: Carreira
  decisoes: Decisao; materias: Materia; conteudos: Conteudo; aulas: Aula; sessoes: Sessao; simulados: Simulado
  temas: Tema; redacoes: Redacao; revisoes: Revisao
}
export type NomeTabela = keyof Tabelas
export type Novo<T> = Omit<T, 'id' | 'criado_em'>
