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
