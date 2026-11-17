/** Redação do ENEM: critérios da Cartilha do Participante 2026 (Inep) e pré-análise automática.
 *  A pré-análise NÃO dá nota: aponta sinais para revisar antes da correção. */

export const NIVEIS = [0, 40, 80, 120, 160, 200] as const
export type ChaveC = 'c1' | 'c2' | 'c3' | 'c4' | 'c5'

export const COMPETENCIAS: Record<ChaveC, { nome: string; curto: string; pergunta: string; niveis: Record<number, string> }> = {
  c1: { nome: 'C1 · Norma culta', curto: 'Norma culta', pergunta: 'Domínio da modalidade escrita formal da língua portuguesa.', niveis: {
    200: 'Excelente domínio. Desvios só como exceção, sem reincidência.', 160: 'Bom domínio, poucos desvios.', 120: 'Domínio mediano, alguns desvios.',
    80: 'Domínio insuficiente, muitos desvios.', 40: 'Domínio precário, desvios frequentes.', 0: 'Desconhecimento da escrita formal.' } },
  c2: { nome: 'C2 · Tema e repertório', curto: 'Tema', pergunta: 'Compreender a proposta e aplicar conceitos de várias áreas no texto dissertativo-argumentativo.', niveis: {
    200: 'Argumentação consistente com repertório PRODUTIVO (legítimo, pertinente e usado na discussão).', 160: 'Argumentação consistente e bom domínio do tipo textual.',
    120: 'Argumentação previsível; repertório pouco produtivo ou só dos textos motivadores.', 80: 'Cópia dos motivadores ou domínio insuficiente do tipo textual.',
    40: 'Tangencia o tema ou mistura outro tipo de texto.', 0: 'Fuga ao tema ou não dissertativo (redação zerada).' } },
  c3: { nome: 'C3 · Argumentação', curto: 'Argumentos', pergunta: 'Selecionar, relacionar, organizar e interpretar informações em defesa de um ponto de vista.', niveis: {
    200: 'Informações consistentes e organizadas, com AUTORIA (projeto de texto estratégico).', 160: 'Informações organizadas, com indícios de autoria.',
    120: 'Limitadas aos motivadores e pouco organizadas.', 80: 'Desorganizadas ou contraditórias.', 40: 'Pouco relacionadas ao tema, sem ponto de vista.', 0: 'Não relacionadas ao tema.' } },
  c4: { nome: 'C4 · Coesão', curto: 'Coesão', pergunta: 'Mecanismos linguísticos necessários para a argumentação.', niveis: {
    200: 'Articula bem as partes, com repertório DIVERSIFICADO de recursos coesivos.', 160: 'Poucas inadequações, repertório diversificado.',
    120: 'Articulação mediana, repertório pouco diversificado.', 80: 'Articulação insuficiente, muitas inadequações.', 40: 'Articulação precária.', 0: 'Não articula as informações.' } },
  c5: { nome: 'C5 · Proposta de intervenção', curto: 'Proposta', pergunta: 'Proposta de intervenção para o problema, respeitando os direitos humanos.', niveis: {
    200: 'Muito bem elaborada e articulada: agente, ação, meio, finalidade e detalhamento.', 160: 'Bem elaborada (4 elementos).', 120: 'Mediana (3 elementos).',
    80: 'Insuficiente (2 elementos) ou não articulada.', 40: 'Vaga ou precária (1 elemento).', 0: 'Ausente, ou só constata o problema sem propor ação.' } },
}

export const MOTIVOS_ZERO = [
  'Fuga total ao tema', 'Não obedecer ao tipo dissertativo-argumentativo', 'Texto com até 7 linhas',
  'Cópia integral dos textos motivadores', 'Impropérios, desenhos ou parte desconectada do tema',
  'Assinatura ou identificação fora do local', 'Texto em língua estrangeira ou folha em branco',
]

export const NOTAS_1000 = [
  ['4 parágrafos', 'Introdução com tese, 2 de desenvolvimento e conclusão com proposta.'],
  ['Tese já na introdução', 'Com os dois argumentos anunciados: o corretor sabe para onde o texto vai.'],
  ['Repertório produtivo', 'Autor, lei, dado ou fato histórico usado para PROVAR o argumento, não para enfeitar.'],
  ['Argumento aprofundado', 'Causa → consequência → exemplo → ligação com a tese.'],
  ['Conectivos variados', 'No início e dentro dos parágrafos, sem repetir os mesmos.'],
  ['Proposta completa', 'Agente + ação + meio + finalidade + detalhamento, ligada aos problemas discutidos.'],
  ['25 a 30 linhas', 'Sem marcas de oralidade nem 1ª pessoa do singular.'],
  ['Meta realista: 900+', 'Só 10 redações tiraram 1000 no ENEM 2025 (12 em 2024).'],
] as const

const CONECTIVOS = ['além disso', 'ademais', 'outrossim', 'nesse sentido', 'nesse contexto', 'dessa forma', 'desse modo', 'assim',
  'portanto', 'logo', 'por conseguinte', 'consequentemente', 'em suma', 'por fim', 'entretanto', 'contudo', 'no entanto', 'todavia',
  'porém', 'embora', 'apesar de', 'visto que', 'uma vez que', 'já que', 'pois', 'haja vista', 'em virtude de', 'primeiramente',
  'em primeiro lugar', 'em segundo lugar', 'inicialmente', 'sob esse viés', 'sob essa ótica', 'nessa perspectiva', 'por outro lado',
  'diante disso', 'isto é', 'ou seja', 'por exemplo', 'de fato', 'com efeito', 'posto isso']
const AGENTES = /(governo|estado|ministério|poder público|congresso|prefeitura|secretaria|escolas?|família|mídia|ongs?|sociedade civil|empresas|universidades|legislativo|judiciário|instituições|veículos de comunicação)/
const MEIOS = /(por meio de|mediante|através de|por intermédio de|com o auxílio de|com o apoio de|a partir de|com a criação de|com o uso de)/
const FINS = /(a fim de|com o intuito de|com o objetivo de|para que|com a finalidade de|de modo a|de forma a|visando|para garantir|para assegurar|para mitigar|para reduzir|para combater)/
const DETALHE = /(ou seja|isto é|\bcomo\b|tal como|a exemplo de|por exemplo|o qual|a qual|os quais|as quais)/
const ACAO = /\b(deve|devem|cabe|caberia|é necessário|é preciso|é fundamental|urge|compete)\b/
const REPERTORIO = /(segundo|de acordo com|conforme|consoante|filósof|sociólog|constituição|artigo \d+|\blei\b|estatuto|ibge|\boms\b|\bonu\b|pesquisa|dados|filme|livro|obra|\b1[5-9]\d{2}\b|\b20[0-2]\d\b)/g
const ORALIDADE = /\b(eu|a gente|tipo|né|vc|pra|tá|aí|meio que|enfim)\b/g
const GENERICAS = new Set(['para', 'como', 'pela', 'pelo', 'sobre', 'entre', 'acerca', 'desafios', 'caminhos', 'brasil', 'brasileira', 'brasileiro',
  'sociedade', 'perspectivas', 'valorização', 'garantia', 'acesso', 'enfrentamento', 'combate', 'impactos', 'desafio', 'questão'])

const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')

export const paragrafos = (t: string) => t.split(/\n\s*\n|\n/).map((p) => p.trim()).filter(Boolean)

export function palavrasChave(tema: string): string[] {
  return (tema.toLowerCase().match(/[\p{L}]+/gu) || []).filter((p) => p.length > 3 && !GENERICAS.has(p))
}

export interface Analise {
  palavras: number; linhas: number; paragrafos: number; conectivos: string[]
  elementos: Record<'Agente' | 'Ação' | 'Meio' | 'Finalidade' | 'Detalhamento', boolean>
  repertorios: number; oralidade: string[]; alertas: string[]; fortes: string[]
}

export function analisar(texto: string, tema = ''): Analise {
  const t = texto.toLowerCase()
  const pars = paragrafos(texto)
  const palavras = (texto.match(/[\p{L}\d]+/gu) || []).length
  const linhas = Math.round(palavras / 10)
  const conectivos = CONECTIVOS.filter((c) => new RegExp(`(^|[^\\p{L}])${c}([^\\p{L}]|$)`, 'u').test(t))
  const fim = (pars[pars.length - 1] || '').toLowerCase()
  const palavrasFim = (fim.match(/[\p{L}]+/gu) || []).length
  const elementos = { Agente: AGENTES.test(fim), 'Ação': ACAO.test(fim), Meio: MEIOS.test(fim), Finalidade: FINS.test(fim), Detalhamento: DETALHE.test(fim) && palavrasFim > 60 }
  const repertorios = (t.match(REPERTORIO) || []).length
  const oralidade = [...new Set(t.match(ORALIDADE) || [])].sort()
  const chaves = palavrasChave(tema)
  const ts = semAcento(t), intro = semAcento((pars[0] || '').toLowerCase())
  const presentes = chaves.filter((c) => ts.includes(semAcento(c).slice(0, 6)))
  const naIntro = chaves.filter((c) => intro.includes(semAcento(c).slice(0, 6)))

  const alertas: string[] = [], fortes: string[] = []
  if (linhas <= 7) alertas.push('Texto muito curto: até 7 linhas recebe nota zero.')
  else if (linhas < 20) alertas.push(`Texto curto (~${linhas} linhas). Notas altas costumam ter 25 a 30.`)
  else if (linhas > 32) alertas.push(`Texto longo (~${linhas} linhas). A folha tem 30 linhas.`)
  else fortes.push(`Tamanho adequado (~${linhas} linhas).`)
  if (pars.length === 4) fortes.push('Estrutura em 4 parágrafos.')
  else if (pars.length < 3) alertas.push(`Só ${pars.length} parágrafo(s). Separe introdução, desenvolvimento e conclusão.`)
  else alertas.push(`${pars.length} parágrafos. O padrão das notas altas é 4.`)
  if (conectivos.length >= 8) fortes.push(`Boa variedade de conectivos (${conectivos.length}).`)
  else alertas.push(`Poucos conectivos diferentes (${conectivos.length}). Varie entre e dentro dos parágrafos.`)
  const faltam = Object.entries(elementos).filter(([, v]) => !v).map(([k]) => k)
  if (!faltam.length) fortes.push('A proposta parece ter os 5 elementos.')
  else alertas.push(`Na conclusão, não identifiquei: ${faltam.join(', ')}.`)
  if (!repertorios) alertas.push('Não encontrei repertório (autor, lei, dado, obra). Use pelo menos 1 por argumento.')
  else fortes.push(`Sinais de repertório (${repertorios}). Confira se são produtivos.`)
  if (oralidade.length) alertas.push(`Possíveis marcas de oralidade: ${oralidade.join(', ')}.`)
  if (chaves.length) {
    if (presentes.length < chaves.length) alertas.push(`Palavras do tema ausentes: ${chaves.filter((c) => !presentes.includes(c)).join(', ')}. Risco de tangenciar.`)
    else fortes.push('Todas as palavras-chave do tema aparecem.')
    if (naIntro.length < Math.max(1, Math.floor(chaves.length / 2))) alertas.push('A introdução cita pouco o tema. Apresente tema e tese logo no início.')
  }
  return { palavras, linhas, paragrafos: pars.length, conectivos, elementos, repertorios, oralidade, alertas, fortes }
}

export function notaTotal(n: Partial<Record<ChaveC, number | null>>): number | null {
  const v = (['c1', 'c2', 'c3', 'c4', 'c5'] as ChaveC[]).map((k) => n[k])
  return v.some((x) => x == null) ? null : (v as number[]).reduce((a, b) => a + b, 0)
}

/** Texto pronto para colar no claude.ai e receber correção detalhada. */
export function promptCorrecao(tema: string, texto: string): string {
  const crit = Object.values(COMPETENCIAS).map((c) => `- ${c.nome}: ${c.pergunta} Níveis: ${Object.entries(c.niveis).reverse().map(([n, d]) => `${n} = ${d}`).join('; ')}`).join('\n')
  return `Você é um corretor experiente da redação do ENEM. Corrija a redação abaixo seguindo a Cartilha do Participante 2026 do Inep.

Critérios (cada competência vale 0, 40, 80, 120, 160 ou 200):
${crit}

Atenção à Cartilha 2026: a proposta precisa ser uma AÇÃO capaz de transformar a situação (não só constatar o problema) e respeitar os direitos humanos; repertório "de bolso" não é produtivo; motivos de nota zero: ${MOTIVOS_ZERO.join(', ').toLowerCase()}.

Responda em português:
1. Nota de cada competência com justificativa citando trechos.
2. Nota total.
3. Os 3 ajustes que mais aumentariam a nota, com exemplo de reescrita.
4. Comparação com o que costuma aparecer nas redações nota 1000.

TEMA: ${tema}

REDAÇÃO:
${texto}`
}
