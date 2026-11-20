/** Dados iniciais: entram no primeiro acesso (cada tabela só se estiver vazia). Tudo é editável depois. */
import { db } from './db'
import type { Novo, Perfil } from './tipos'
import type { Fase } from '@/lib/financas'

const A = 'Alta' as const, M = 'Média' as const, B = 'Baixa' as const

export const PERFIL_INICIAL: Novo<Perfil> = {
  nome: 'Davi', nascimento: null, data_enem: '2028-11-05', curso: 'Medicina', faculdade: '',
  metas_nota: { lc: 720, ch: 760, cn: 780, mt: 850, redacao: 940 },
  missoes: { questoes: 20, minutos: 120, aulas: 2, revisoes: 10 },
  renda_desejada: 50000, taxa_saque: 0.04, inflacao: 0.045, onboarding_ok: false,
  criterios: [
    { nome: 'Tempo até renda boa', peso: 2, descricao: '5 = ganha bem cedo; 1 = demora muitos anos' },
    { nome: 'Piso de renda', peso: 3, descricao: '5 = mesmo no pior caso a renda é boa' },
    { nome: 'Teto de renda', peso: 3, descricao: '5 = pode chegar muito alto' },
    { nome: 'Custo de entrada', peso: 2, descricao: '5 = barato e acessível' },
    { nome: 'Horas por semana', peso: 3, descricao: '5 = rotina leve, tempo com a família' },
    { nome: 'Risco', peso: 2, descricao: '5 = caminho seguro e previsível' },
    { nome: 'Afinidade', peso: 4, descricao: '5 = adoro e me vejo fazendo isso' },
  ],
}

const FASES_BASE: [string, number, number, number, number][] = [
  ['Ensino médio e ENEM', 16, 18, 0, 0], ['Faculdade de Medicina', 18, 24, 0, 2000], ['Residência + plantões', 24, 27, 10000, 20000],
  ['Especialista novo', 27, 32, 25000, 45000], ['Consolidação e clínica', 32, 40, 40000, 80000], ['Clínica como empresa', 40, 70, 80000, 120000],
]
const fases = (aportes: number[]): Fase[] => FASES_BASE.map(([nome, inicio, fim, rendaMin, rendaMax], i) => ({ nome, inicio, fim, rendaMin, rendaMax, aporte: aportes[i] }))

const CENARIOS = [
  { nome: 'Conservador', taxa_real: 0.05, descricao: 'Renda estável de ~R$ 30 mil, aporte de R$ 6 mil/mês a partir dos 27.', fases: fases([0, 0, 3000, 6000, 6000, 6000]), ordem: 1 },
  { nome: 'Moderado', taxa_real: 0.05, descricao: 'Dermatologia ou Neurologia + clínica própria.', fases: fases([0, 0, 3000, 10000, 18000, 30000]), ordem: 2 },
  { nome: 'Otimista', taxa_real: 0.05, descricao: 'Renda alta cedo, aportes chegando a R$ 50 mil/mês.', fases: fases([0, 0, 3000, 15000, 30000, 50000]), ordem: 3 },
]

const METAS = [
  ['Conversar com um dermatologista ou neurologista', 'Carreira', '2027-03-31'], ['Conversar com um cirurgião', 'Carreira', '2027-03-31'],
  ['Conhecer a rotina de um hospital', 'Carreira', '2027-06-30'], ['Montar o plano de estudos do 2º ano', 'Estudos', '2027-02-01'],
  ['Abrir conta de investimento (com os pais) e fazer o 1º aporte', 'Finanças', '2027-01-31'], ['Comparar Medicina com 2-3 alternativas', 'Carreira', '2027-06-30'],
] as const

const CARREIRAS: [string, number[], string][] = [
  ['Medicina (Dermato/Neuro + clínica)', [2, 5, 4, 2, 2, 4, 3], 'Piso alto e desemprego baixo; 6 anos de faculdade + 3 de residência.'],
  ['Tecnologia/dados + empreendedorismo', [4, 3, 5, 4, 3, 2, 3], 'Começa a ganhar cedo; teto alto se empreender; mercado oscila mais.'],
  ['Carreira pública de elite', [2, 5, 3, 3, 4, 3, 3], 'Estabilidade e qualidade de vida; concurso incerto.'],
  ['Finanças/negócios', [3, 3, 5, 4, 2, 3, 3], 'Teto alto; rotina puxada no início.'],
]

/** Frequência = quanto costuma cair (levantamentos de cursinhos sobre 2016-2025). */
export const CONTEUDOS: Record<string, Record<string, [string, 'Alta' | 'Média' | 'Baixa'][]>> = {
  Linguagens: {
    'Interpretação de texto': [['Leitura de textos verbais e não verbais', A], ['Gêneros textuais', A], ['Funções da linguagem', A], ['Variação linguística', A], ['Intertextualidade', M], ['Figuras de linguagem', M], ['Charges, tirinhas e publicidade', A]],
    'Gramática': [['Coesão e coerência', A], ['Classes de palavras', M], ['Sintaxe', B], ['Concordância e regência', B], ['Pontuação e sentido', M], ['Semântica', M]],
    'Literatura': [['Modernismo', A], ['Literatura contemporânea', M], ['Romantismo', M], ['Realismo e Naturalismo', M], ['Barroco e Arcadismo', B], ['Parnasianismo e Simbolismo', B]],
    'Inglês / Espanhol': [['Estratégias de leitura', A], ['Vocabulário e falsos cognatos', M], ['Gêneros: notícias, músicas, cartuns', M]],
    'Artes': [['Vanguardas e Semana de 22', M], ['Arte contemporânea', M], ['Cultura popular brasileira', M]],
    'Educação Física e Tecnologia': [['Corpo, saúde e práticas corporais', M], ['Tecnologias da informação', M]],
  },
  Humanas: {
    'História do Brasil': [['Brasil Colônia', A], ['Brasil Império', M], ['Era Vargas', A], ['Ditadura Militar', A], ['República Velha', M], ['Constituição de 1988', M], ['Povos indígenas e cultura afro-brasileira', A]],
    'História Geral': [['Grécia e Roma', M], ['Idade Média', M], ['Revoluções Industriais', A], ['Iluminismo e Revolução Francesa', M], ['Guerras Mundiais e Guerra Fria', M], ['Imperialismo e descolonização', M]],
    'Geografia': [['Questões ambientais', A], ['Urbanização', A], ['Globalização e geopolítica', A], ['Agropecuária e questão agrária', M], ['Clima e biomas', M], ['Cartografia', M], ['Demografia e migrações', M], ['Energia', M], ['Relevo e solos', B]],
    'Filosofia': [['Filosofia antiga', A], ['Ética e moral', A], ['Contratualistas', A], ['Filosofia moderna', M], ['Filosofia contemporânea', M]],
    'Sociologia': [['Durkheim, Weber e Marx', A], ['Cidadania e movimentos sociais', A], ['Racismo, gênero e diversidade', A], ['Indústria cultural', M], ['Trabalho e desigualdade', M]],
  },
  Natureza: {
    'Biologia': [['Ecologia', A], ['Fisiologia humana', A], ['Doenças, vírus e vacinas', A], ['Citologia', M], ['Genética', M], ['Evolução', M], ['Fotossíntese e respiração', M], ['Biotecnologia', M], ['Zoologia', M], ['Botânica', B]],
    'Química': [['Estequiometria', A], ['Química orgânica', A], ['Soluções', A], ['Ligações e propriedades', A], ['Química ambiental', A], ['Eletroquímica', M], ['Termoquímica', M], ['Equilíbrio e pH', M], ['Separação de misturas', M], ['Cinética', B], ['Radioatividade', B]],
    'Física': [['Eletrodinâmica', A], ['Cinemática e leis de Newton', A], ['Energia, trabalho e potência', A], ['Ondulatória', A], ['Calorimetria', M], ['Óptica', M], ['Hidrostática', M], ['Eletromagnetismo', B]],
  },
  'Matemática': {
    'Matemática': [['Razão, proporção e porcentagem', A], ['Gráficos e tabelas', A], ['Estatística', A], ['Geometria espacial', A], ['Funções', A], ['Geometria plana', A], ['Probabilidade', A], ['Escalas e unidades', A], ['Análise combinatória', M], ['Juros', M], ['Progressões', M], ['Trigonometria', B], ['Geometria analítica', B]],
  },
  'Redação': {
    'Redação': [['Estrutura do texto', A], ['Tese e projeto de texto', A], ['Repertório produtivo', A], ['Conectivos e coesão', A], ['Proposta de intervenção', A], ['Norma culta', A], ['Eixos temáticos', A]],
  },
}

export const TEMAS_ENEM: [number, string][] = [
  [2016, 'Caminhos para combater a intolerância religiosa no Brasil'], [2017, 'Desafios para a formação educacional de surdos no Brasil'],
  [2018, 'Manipulação do comportamento do usuário pelo controle de dados na internet'], [2019, 'Democratização do acesso ao cinema no Brasil'],
  [2020, 'O estigma associado às doenças mentais na sociedade brasileira'], [2021, 'Invisibilidade e registro civil: garantia de acesso à cidadania no Brasil'],
  [2022, 'Desafios para a valorização de comunidades e povos tradicionais no Brasil'], [2023, 'Desafios para o enfrentamento da invisibilidade do trabalho de cuidado realizado pela mulher no Brasil'],
  [2024, 'Desafios para a valorização da herança africana no Brasil'], [2025, 'Perspectivas acerca do envelhecimento na sociedade brasileira'],
  [2026, 'A valorização do Sistema Único de Saúde (SUS) como direito universal'],
]
const TEMAS_TREINO = ['Desafios para o combate à desinformação nas redes sociais', 'Os impactos da inteligência artificial no mercado de trabalho',
  'Caminhos para enfrentar a crise de saúde mental entre jovens', 'Desafios para a garantia da segurança alimentar no Brasil',
  'O combate ao racismo ambiental no Brasil', 'Os desafios da evasão escolar no ensino médio', 'Caminhos para ampliar o acesso à leitura no Brasil',
  'O uso excessivo de telas por crianças e adolescentes', 'O enfrentamento das apostas online e seus impactos sociais', 'Desafios para a doação de órgãos no Brasil']

let emAndamento: Promise<void> | null = null

/** Cortes de Medicina, ampla concorrência, SISU 2026 (1ª edição), segundo sites que acompanham o SISU
 *  (enemhub.com.br, vemmed.com.br). Fontes às vezes divergem: confira no portal oficial e ajuste.
 *  Pesos começam iguais (1): troque pelos do edital de cada universidade. */
const FACULDADES: [string, number, string][] = [
  ['UFRN — Caicó', 788.59, 'enemhub.com.br'], ['UFSM', 805.14, 'vemmed.com.br'], ['UFG — Goiânia', 811.7, 'vemmed.com.br'],
  ['UFMG', 818.5, 'vemmed.com.br'], ['UFRJ — Rio de Janeiro', 833.86, 'agregadores (outra fonte cita 823,79)'], ['UFU', 842.57, 'agregadores'],
]

/** Preenche o que estiver vazio. Seguro para rodar várias vezes: chamadas ao mesmo tempo
 *  esperam a mesma execução (evita criar as matérias em dobro). */
export function garantirDadosIniciais(): Promise<void> {
  if (!emAndamento) emAndamento = semear().finally(() => { emAndamento = null })
  return emAndamento
}

async function semear(): Promise<void> {
  const vazia = async (t: Parameters<typeof db.listar>[0]) => (await db.listar(t)).length === 0
  if (await vazia('perfil')) await db.inserir('perfil', [PERFIL_INICIAL])
  if (await vazia('cenarios')) await db.inserir('cenarios', CENARIOS)
  if (await vazia('metas')) await db.inserir('metas', METAS.map(([titulo, area, prazo]) => ({ titulo, area, prazo, status: 'não iniciada' as const, notas: null })))
  if (await vazia('carreiras')) {
    const nomes = PERFIL_INICIAL.criterios.map((c) => c.nome)
    await db.inserir('carreiras', CARREIRAS.map(([nome, notas, observacoes]) => ({ nome, observacoes, notas: Object.fromEntries(nomes.map((n, i) => [n, notas[i]])) })))
  }
  if (await vazia('decisoes')) await db.inserir('decisoes', [{ data: '2026-11-11', decisao: 'Plano v1: Medicina (Dermatologia ou Neurologia + clínica) como carreira principal em análise.', premissas: 'Meta de R$ 50 mil/mês; liberdade = R$ 15 mi; rendimento real de 5% a.a.; cenário moderado chega à meta por volta dos 56. Ainda será comparada com alternativas.', revisar_em: '2027-11-11', resultado: null }])
  if (await vazia('temas')) await db.inserir('temas', [...TEMAS_ENEM.map(([ano, tema]) => ({ tema, ano, origem: 'ENEM' as const })), ...TEMAS_TREINO.map((tema) => ({ tema, ano: null, origem: 'Treino' as const }))])
  // Tabelas da migração 0002: se ainda não existirem no Supabase, só pula (o app avisa).
  try {
    if (await vazia('faculdades')) await db.inserir('faculdades', FACULDADES.map(([nome, nota_corte, fonte], i) => ({ nome, curso: 'Medicina', nota_corte, ano_ref: 2026, pesos: { lc: 1, ch: 1, cn: 1, mt: 1, redacao: 1 }, fonte, prioridade: i })))
  } catch { /* migração 0002 pendente */ }
  if (await vazia('materias')) {
    let ordem = 0
    for (const [area, materias] of Object.entries(CONTEUDOS)) {
      for (const [nome, conts] of Object.entries(materias)) {
        const [m] = await db.inserir('materias', [{ area, nome, ordem: ordem++ }])
        await db.inserir('conteudos', conts.map(([n, f], i) => ({ materia_id: m.id, nome: n, frequencia: f, status: 'não estudado', revisado_em: null, ordem: i })))
      }
    }
  }
}
