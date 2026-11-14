"""Estimativa de gastos de uma família por tópico.

Base: POF/IBGE 2017-2018 (pesquisa mais recente publicada). Nas despesas de
consumo: habitação 36,6%, transporte 18,1%, alimentação 17,5%, saúde ~8%,
educação ~4,7%, vestuário ~4%, lazer/cultura ~2,6%, higiene ~2%. Cerca de 1/3
da alimentação é fora de casa.

O perfil "Renda alta" é um ajuste para famílias de renda alta (gastam
proporcionalmente menos com feira e mais com educação, lazer e viagens).
São estimativas: o melhor é substituir pelos seus gastos reais.
"""

from __future__ import annotations

# tópico -> (descrição, % no perfil Brasil médio, % no perfil Renda alta)
TOPICOS = {
    "Moradia (aluguel/financiamento, condomínio, IPTU)": (0.25, 0.22),
    "Contas da casa (luz, água, gás, internet, celular)": (0.07, 0.04),
    "Feira e supermercado": (0.12, 0.07),
    "Alimentação fora (restaurante, delivery)": (0.06, 0.06),
    "Transporte (combustível, carro, app, ônibus)": (0.15, 0.10),
    "Saúde (plano, remédios, dentista)": (0.08, 0.08),
    "Educação (escola, cursos, material)": (0.05, 0.10),
    "Lazer e cultura (passeios, streaming, hobbies)": (0.04, 0.06),
    "Viagens": (0.02, 0.07),
    "Vestuário e calçados": (0.04, 0.04),
    "Higiene e cuidados pessoais": (0.03, 0.03),
    "Serviços (diarista, academia, pet)": (0.03, 0.06),
    "Outros e imprevistos": (0.06, 0.07),
}

PERFIS = {"Brasil médio (POF/IBGE)": 0, "Renda alta": 1}


def estimar(orcamento_mensal: float, perfil: str) -> list[tuple[str, float, float]]:
    """Devolve (tópico, percentual, valor em R$) para o orçamento informado."""
    idx = PERFIS[perfil]
    return [(t, p[idx], orcamento_mensal * p[idx]) for t, p in TOPICOS.items()]


def regra_50_30_20(renda_liquida: float) -> dict:
    """Regra simples: 50% necessidades, 30% desejos, 20% investir."""
    return {
        "Necessidades (50%)": renda_liquida * 0.5,
        "Desejos (30%)": renda_liquida * 0.3,
        "Investir (20%)": renda_liquida * 0.2,
    }
