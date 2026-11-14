"""Correção de redação do ENEM: critérios da Cartilha do Participante 2026 e
uma pré-análise automática do texto.

A pré-análise NÃO dá nota — o ENEM é corrigido por pessoas. Ela aponta sinais
(tamanho, parágrafos, conectivos, repertório, elementos da proposta de
intervenção, aderência ao tema) para você revisar antes da autocorreção ou de
mandar para um professor/IA.

Fonte dos critérios: "A Redação do Enem 2026 — Cartilha do Participante"
(Inep, set/2026), que manteve as 5 competências (0 a 200 cada, nota final =
média de dois corretores) e detalhou mais a Competência 5: proposta de
intervenção é uma AÇÃO capaz de transformar a situação, não só a constatação
do problema. Também alerta contra o "repertório de bolso".
"""

from __future__ import annotations

import re
import unicodedata

NIVEIS = [0, 40, 80, 120, 160, 200]

COMPETENCIAS = {
    "c1": {
        "nome": "C1 · Norma culta",
        "pergunta": "Demonstrar domínio da modalidade escrita formal da língua portuguesa.",
        "niveis": {
            200: "Excelente domínio. Desvios gramaticais só como exceção e sem reincidência.",
            160: "Bom domínio, com poucos desvios gramaticais e de convenções da escrita.",
            120: "Domínio mediano, com alguns desvios.",
            80: "Domínio insuficiente, com muitos desvios.",
            40: "Domínio precário, com desvios frequentes e diversificados.",
            0: "Desconhecimento da modalidade escrita formal.",
        },
    },
    "c2": {
        "nome": "C2 · Tema, tipo textual e repertório",
        "pergunta": "Compreender a proposta e aplicar conceitos das várias áreas do conhecimento, "
                    "dentro dos limites do texto dissertativo-argumentativo.",
        "niveis": {
            200: "Argumentação consistente com repertório sociocultural PRODUTIVO (legítimo, pertinente e "
                 "usado na discussão) e excelente domínio do texto dissertativo-argumentativo.",
            160: "Argumentação consistente e bom domínio do tipo textual (introdução, argumentação e conclusão).",
            120: "Argumentação previsível; repertório pouco produtivo ou só dos textos motivadores.",
            80: "Cópia dos textos motivadores ou domínio insuficiente do tipo textual.",
            40: "Tangencia o tema ou mistura outro tipo de texto (narrativo, por exemplo).",
            0: "Fuga ao tema ou não é dissertativo-argumentativo (redação recebe zero).",
        },
    },
    "c3": {
        "nome": "C3 · Projeto de texto e argumentação",
        "pergunta": "Selecionar, relacionar, organizar e interpretar informações, fatos, opiniões e "
                    "argumentos em defesa de um ponto de vista.",
        "niveis": {
            200: "Informações relacionadas ao tema, consistentes e organizadas, configurando AUTORIA "
                 "(projeto de texto estratégico, sem lacunas).",
            160: "Informações organizadas, com indícios de autoria.",
            120: "Informações limitadas aos motivadores e pouco organizadas.",
            80: "Informações desorganizadas ou contraditórias, limitadas aos motivadores.",
            40: "Informações pouco relacionadas ao tema ou incoerentes, sem defesa de ponto de vista.",
            0: "Informações não relacionadas ao tema e sem defesa de ponto de vista.",
        },
    },
    "c4": {
        "nome": "C4 · Coesão",
        "pergunta": "Demonstrar conhecimento dos mecanismos linguísticos necessários para a argumentação.",
        "niveis": {
            200: "Articula bem as partes do texto e tem repertório DIVERSIFICADO de recursos coesivos "
                 "(entre parágrafos e dentro deles).",
            160: "Articula as partes com poucas inadequações e repertório diversificado.",
            120: "Articulação mediana, com inadequações e repertório pouco diversificado.",
            80: "Articulação insuficiente, com muitas inadequações e repertório limitado.",
            40: "Articulação precária.",
            0: "Não articula as informações.",
        },
    },
    "c5": {
        "nome": "C5 · Proposta de intervenção",
        "pergunta": "Elaborar proposta de intervenção para o problema, respeitando os direitos humanos.",
        "niveis": {
            200: "Proposta muito bem elaborada, detalhada e articulada à discussão: AGENTE, AÇÃO, "
                 "MEIO/MODO, FINALIDADE e DETALHAMENTO (5 elementos).",
            160: "Proposta bem elaborada, articulada à discussão (4 elementos).",
            120: "Proposta mediana (3 elementos).",
            80: "Proposta insuficiente (2 elementos) ou não articulada à discussão.",
            40: "Proposta vaga ou precária (1 elemento), ou relacionada só ao assunto.",
            0: "Sem proposta, ou só constata o problema sem propor ação, ou não relacionada ao tema.",
        },
    },
}

MOTIVOS_ZERO = [
    "Fuga total ao tema",
    "Não obedecer ao tipo dissertativo-argumentativo",
    "Texto com até 7 linhas",
    "Cópia integral dos textos motivadores",
    "Impropérios, desenhos ou parte deliberadamente desconectada do tema",
    "Assinatura ou identificação do participante fora do local",
    "Texto predominantemente em língua estrangeira ou folha em branco",
]

O_QUE_AS_NOTAS_1000_TEM = [
    "**4 parágrafos** bem definidos: introdução com tese, 2 de desenvolvimento, conclusão com proposta.",
    "**Tese clara já na introdução**, com os dois argumentos anunciados (projeto de texto).",
    "**Repertório legitimado e produtivo**: autor, lei, dado ou fato histórico *usado para provar o "
    "argumento*, não citado só para enfeitar (a Cartilha 2026 critica o 'repertório de bolso').",
    "**Cada argumento aprofundado**: causa → consequência → exemplo/dado → ligação com a tese.",
    "**Conectivos variados** no início de cada parágrafo e dentro dos parágrafos, sem repetir os mesmos.",
    "**Proposta completa e ligada aos problemas discutidos**: agente + ação + meio + finalidade + detalhamento.",
    "**Retomada da tese** na conclusão e uso das palavras-chave do tema ao longo do texto.",
    "**25 a 30 linhas**, letra legível, sem marcas de oralidade nem 1ª pessoa do singular.",
    "Raridade: só 10 redações tiraram 1000 no ENEM 2025 (12 em 2024) — o objetivo realista é 900+.",
]

# --- listas usadas na pré-análise -------------------------------------------------

CONECTIVOS = [
    "além disso", "ademais", "outrossim", "nesse sentido", "nesse contexto", "dessa forma", "desse modo",
    "assim", "portanto", "logo", "por conseguinte", "consequentemente", "em suma", "por fim",
    "entretanto", "contudo", "no entanto", "todavia", "porém", "embora", "apesar de", "conquanto",
    "visto que", "uma vez que", "já que", "porque", "pois", "haja vista", "devido a", "em virtude de",
    "primeiramente", "em primeiro lugar", "em segundo lugar", "inicialmente", "sob esse viés",
    "sob essa ótica", "nessa perspectiva", "à luz de", "por outro lado", "diante disso", "dessarte",
    "isto é", "ou seja", "por exemplo", "como", "a saber", "de fato", "com efeito", "posto isso",
]
AGENTES = [
    "governo", "estado", "ministério", "ministerio", "poder público", "poder publico", "congresso",
    "prefeitura", "secretaria", "escola", "escolas", "família", "familia", "mídia", "midia", "ong",
    "ongs", "sociedade civil", "empresas", "universidades", "legislativo", "judiciário", "sus",
    "instituições", "instituicoes", "veículos de comunicação", "influenciadores",
]
MEIOS = ["por meio de", "mediante", "através de", "atraves de", "por intermédio de", "com o auxílio de",
         "com o apoio de", "via", "a partir de", "com a criação de", "com o uso de"]
FINALIDADES = ["a fim de", "com o intuito de", "com o objetivo de", "para que", "com a finalidade de",
               "de modo a", "de forma a", "visando", "objetivando", "para garantir", "para assegurar",
               "para mitigar", "para reduzir", "para combater"]
DETALHAMENTO = ["ou seja", "isto é", "como", "tal como", "a exemplo de", "que", "por exemplo", "o qual",
                "a qual", "os quais", "as quais"]
ACOES = re.compile(r"\b(deve|devem|cabe|caberia|é necessário|é preciso|é fundamental|urge|compete)\b")
REPERTORIO = re.compile(
    r"(segundo|de acordo com|conforme|consoante|para o filósofo|para a filósofa|para o sociólogo|"
    r"constituição|artigo \d+|lei|estatuto|ibge|oms|onu|pesquisa|dados|filme|livro|obra|"
    r"\b1[5-9]\d{2}\b|\b20[0-2]\d\b)"
)
ORALIDADE = re.compile(r"\b(eu|a gente|tipo|né|vc|pra|tá|aí|meio que|enfim|beleza)\b")
STOPWORDS = {"para", "como", "pela", "pelo", "pelos", "pelas", "sobre", "entre", "acerca", "desafios",
             "caminhos", "brasil", "brasileira", "brasileiro", "sociedade", "perspectivas", "valorização",
             "garantia", "acesso", "enfrentamento", "combate", "impactos", "desafio", "questão"}


def _sem_acento(texto: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", texto) if unicodedata.category(c) != "Mn")


def _conta(texto: str, termos: list[str]) -> list[str]:
    """Quais termos da lista aparecem no texto (como palavra/expressão inteira)."""
    return [t for t in termos if re.search(rf"(?<!\w){re.escape(t)}(?!\w)", texto)]


def paragrafos(texto: str) -> list[str]:
    return [p.strip() for p in re.split(r"\n\s*\n|\n", texto) if p.strip()]


def palavras_chave_tema(tema: str) -> list[str]:
    palavras = re.findall(r"\w+", tema.lower())
    return [p for p in palavras if len(p) > 3 and p not in STOPWORDS]


def analisar(texto: str, tema: str = "") -> dict:
    """Pré-análise automática. Devolve números e uma lista de alertas/dicas."""
    t = texto.lower()
    pars = paragrafos(texto)
    n_palavras = len(re.findall(r"\w+", texto))
    linhas_est = round(n_palavras / 10)  # ~10 palavras por linha manuscrita na folha do ENEM

    conectivos = _conta(t, CONECTIVOS)
    conclusao = pars[-1].lower() if pars else ""
    elementos = {
        "Agente": bool(_conta(conclusao, AGENTES)),
        "Ação": bool(ACOES.search(conclusao)),
        "Meio/modo": bool(_conta(conclusao, MEIOS)),
        "Finalidade": bool(_conta(conclusao, FINALIDADES)),
        "Detalhamento": bool(_conta(conclusao, DETALHAMENTO)) and len(re.findall(r"\w+", conclusao)) > 60,
    }
    repertorios = len(REPERTORIO.findall(t))
    oralidade = sorted(set(ORALIDADE.findall(t)))
    chaves = palavras_chave_tema(tema)
    t_sem = _sem_acento(t)
    presentes = [c for c in chaves if _sem_acento(c)[:6] in t_sem]
    intro = _sem_acento(pars[0].lower()) if pars else ""
    tema_na_intro = [c for c in chaves if _sem_acento(c)[:6] in intro]

    alertas, ok = [], []
    if linhas_est <= 7:
        alertas.append("⛔ Texto muito curto: até 7 linhas recebe nota ZERO.")
    elif linhas_est < 20:
        alertas.append(f"Texto curto (~{linhas_est} linhas). As notas altas costumam ter 25-30 linhas.")
    elif linhas_est > 32:
        alertas.append(f"Texto longo (~{linhas_est} linhas). O limite da folha é 30 linhas.")
    else:
        ok.append(f"Tamanho adequado (~{linhas_est} linhas).")

    if len(pars) == 4:
        ok.append("Estrutura em 4 parágrafos.")
    elif len(pars) < 3:
        alertas.append(f"Só {len(pars)} parágrafo(s). Separe introdução, desenvolvimento e conclusão.")
    else:
        alertas.append(f"{len(pars)} parágrafos. O padrão das notas altas é 4 (5 também funciona).")

    if len(conectivos) >= 8:
        ok.append(f"Boa variedade de conectivos ({len(conectivos)} diferentes).")
    else:
        alertas.append(f"Poucos conectivos diferentes ({len(conectivos)}). Varie entre e dentro dos parágrafos (C4).")

    faltam = [e for e, v in elementos.items() if not v]
    if not faltam:
        ok.append("Proposta de intervenção parece ter os 5 elementos.")
    else:
        alertas.append("Na conclusão, não identifiquei: " + ", ".join(faltam)
                       + ". Confira a C5 (agente, ação, meio, finalidade e detalhamento).")

    if repertorios == 0:
        alertas.append("Não encontrei sinais de repertório (autor, lei, dado, obra). Use pelo menos 1 por argumento.")
    else:
        ok.append(f"Sinais de repertório encontrados ({repertorios}). Confira se são PRODUTIVOS, não 'de bolso'.")

    if oralidade:
        alertas.append("Possíveis marcas de oralidade/1ª pessoa: " + ", ".join(oralidade) + " (C1).")

    if chaves:
        if len(presentes) < len(chaves):
            alertas.append("Palavras-chave do tema ausentes: " + ", ".join(set(chaves) - set(presentes))
                           + ". Risco de tangenciar o tema (C2/C3).")
        else:
            ok.append("Todas as palavras-chave do tema aparecem no texto.")
        if len(tema_na_intro) < max(1, len(chaves) // 2):
            alertas.append("A introdução cita pouco o tema. Apresente o tema e a tese logo no 1º parágrafo.")

    return {
        "palavras": n_palavras, "linhas_estimadas": linhas_est, "paragrafos": len(pars),
        "conectivos": conectivos, "elementos_c5": elementos, "repertorios": repertorios,
        "oralidade": oralidade, "alertas": alertas, "pontos_fortes": ok,
    }


def nota_total(notas: dict[str, int | None]) -> int | None:
    valores = [notas.get(c) for c in COMPETENCIAS]
    return None if any(v is None for v in valores) else int(sum(valores))


def prompt_correcao(tema: str, texto: str) -> str:
    """Texto pronto para colar no Claude (claude.ai) e receber uma correção detalhada."""
    criterios = "\n".join(
        f"- {c['nome']}: {c['pergunta']} Níveis: "
        + "; ".join(f"{n} = {d}" for n, d in c["niveis"].items())
        for c in COMPETENCIAS.values()
    )
    return f"""Você é um corretor experiente da redação do ENEM. Corrija a redação abaixo seguindo a
Cartilha do Participante 2026 do Inep.

Critérios (cada competência vale 0, 40, 80, 120, 160 ou 200):
{criterios}

Atenção às orientações da Cartilha 2026: a proposta de intervenção precisa ser uma AÇÃO capaz de
transformar a situação (não só constatar o problema) e deve respeitar os direitos humanos;
repertório "de bolso" (genérico, sem ligação real com a discussão) não é produtivo; motivos de
nota zero: {", ".join(MOTIVOS_ZERO).lower()}.

Responda em português, nesta ordem:
1. Nota de cada competência com justificativa citando trechos do texto.
2. Nota total.
3. Os 3 ajustes que mais aumentariam a nota, com exemplo de reescrita.
4. Comparação com o que costuma aparecer nas redações nota 1000.

TEMA: {tema}

REDAÇÃO:
{texto}
"""
