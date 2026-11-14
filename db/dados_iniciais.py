"""Dados carregados na primeira vez que o app abre.

Vêm do documento "Plano de Vida, Carreira e Finanças" (valores de hoje,
rendimento real de 5% ao ano). Tudo pode ser editado depois no app.
"""

CONFIG_INICIAL = {
    "nome": "Davi",
    "idade_atual": "16",
    "inflacao_anual": "0.045",
    "taxa_saque": "0.04",
    "renda_desejada": "50000",
}

# (nome, idade_inicio, idade_fim, renda_min, renda_max)
_FASES_BASE = [
    ("Ensino médio e ENEM", 16, 18, 0, 0),
    ("Faculdade de Medicina", 18, 24, 0, 2000),
    ("Residência + plantões", 24, 27, 10000, 20000),
    ("Especialista novo", 27, 32, 25000, 45000),
    ("Consolidação e abertura da clínica", 32, 40, 40000, 80000),
    ("Clínica como empresa", 40, 70, 80000, 120000),
]

# Aporte mensal de cada fase, por cenário (mesma ordem de _FASES_BASE).
_APORTES = {
    "Conservador": [0, 0, 3000, 6000, 6000, 6000],
    "Moderado": [0, 0, 3000, 10000, 18000, 30000],
    "Otimista": [0, 0, 3000, 15000, 30000, 50000],
}

CENARIOS_INICIAIS = [
    ("Conservador", 0.05, "Renda estável de ~R$ 30 mil, aporte de R$ 6 mil/mês a partir dos 27."),
    ("Moderado", 0.05, "Caminho da tabela do plano (Dermatologia ou Neurologia + clínica)."),
    ("Otimista", 0.05, "Renda alta cedo, aportes chegando a R$ 50 mil/mês."),
]


def fases_do_cenario(nome_cenario: str) -> list[tuple]:
    """Devolve (nome, inicio, fim, renda_min, renda_max, aporte) para o cenário."""
    return [
        (*base, aporte)
        for base, aporte in zip(_FASES_BASE, _APORTES[nome_cenario])
    ]


# ===================== Módulo 2: Carreira =====================

# (título, área, prazo, status)
METAS_INICIAIS = [
    ("Conversar com um dermatologista ou neurologista", "Carreira", "2027-03-31", "não iniciada"),
    ("Conversar com um cirurgião", "Carreira", "2027-03-31", "não iniciada"),
    ("Conhecer a rotina de um hospital (visita ou acompanhamento)", "Carreira", "2027-06-30", "não iniciada"),
    ("Montar o plano de estudos do 2º ano para o ENEM", "Estudos", "2027-02-01", "não iniciada"),
    ("Criar o sistema de acompanhamento e lançar as premissas", "Finanças", "2026-11-30", "em andamento"),
    ("Abrir conta de investimento (com os pais) e fazer o 1º aporte", "Finanças", "2027-01-31", "não iniciada"),
    ("Comparar Medicina com 2-3 alternativas no comparador", "Carreira", "2027-06-30", "não iniciada"),
]

# (nome, peso, descrição) — nota 5 = melhor PARA VOCÊ em todos os critérios
CRITERIOS_INICIAIS = [
    ("Tempo até renda boa", 2, "5 = ganha bem cedo; 1 = demora muitos anos"),
    ("Piso de renda", 3, "5 = mesmo no pior caso a renda é boa; 1 = pode ganhar pouco"),
    ("Teto de renda", 3, "5 = pode chegar muito alto; 1 = limitado"),
    ("Custo de entrada", 2, "5 = barato/acessível; 1 = caro (faculdade, cursos, anos sem renda)"),
    ("Horas por semana", 3, "5 = rotina leve e tempo com a família; 1 = muitas horas/plantões"),
    ("Risco", 2, "5 = caminho seguro e previsível; 1 = muita incerteza"),
    ("Afinidade", 4, "5 = adoro e me vejo fazendo isso; 1 = não tenho interesse"),
]

# Notas iniciais (mesma ordem dos critérios). São um PALPITE para começar a
# conversa — revise, principalmente "Afinidade", que só você pode dar.
CARREIRAS_INICIAIS = {
    "Medicina (Dermato/Neuro + clínica)": (
        [2, 5, 4, 2, 2, 4, 3],
        "Piso alto e desemprego baixo; 6 anos de faculdade + 3 de residência; vestibular concorrido.",
    ),
    "Tecnologia/dados + empreendedorismo": (
        [4, 3, 5, 4, 3, 2, 3],
        "Começa a ganhar cedo; teto alto se empreender; mercado oscila mais.",
    ),
    "Carreira pública de elite (juiz, auditor, diplomata)": (
        [2, 5, 3, 3, 4, 3, 3],
        "Estabilidade e boa qualidade de vida; anos de estudo para concurso, aprovação incerta.",
    ),
    "Finanças/negócios": (
        [3, 3, 5, 4, 2, 3, 3],
        "Teto alto em mercado financeiro; rotina puxada no início de carreira.",
    ),
}

# (data, decisão, premissas, revisar em)
DECISOES_INICIAIS = [
    ("2026-11-11", "Plano v1: Medicina (Dermatologia ou Neurologia + clínica própria) como carreira principal EM ANÁLISE.",
     "Meta de R$ 50 mil/mês; liberdade financeira = R$ 15 mi; rendimento real de 5% a.a.; "
     "cenário moderado atinge a meta por volta dos 55 anos. Medicina ainda será comparada com alternativas.",
     "2027-11-11"),
]
