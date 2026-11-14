"""Cálculos financeiros do Plano de Vida.

Tudo aqui é "puro": recebe números, devolve números, sem tela e sem banco.
Isso deixa fácil testar (veja tests/test_calculos.py).

Convenção: os valores são REAIS (em reais de hoje), ou seja, a inflação já
foi descontada. Por isso a taxa de rendimento usada é a taxa ACIMA da inflação
(ex.: 5% ao ano).
"""

from __future__ import annotations

from dataclasses import dataclass


# ---------------------------------------------------------------------------
# Taxas
# ---------------------------------------------------------------------------

def taxa_mensal(taxa_anual: float) -> float:
    """Converte uma taxa anual em mensal equivalente.

    Ex.: 5% ao ano NÃO é 5/12 = 0,4167% ao mês. O certo é
    (1 + 0,05) ** (1/12) - 1 = 0,4074% ao mês, porque os juros se acumulam.
    """
    return (1 + taxa_anual) ** (1 / 12) - 1


# ---------------------------------------------------------------------------
# Juros compostos
# ---------------------------------------------------------------------------

def valor_futuro(inicial: float, aporte_mensal: float, taxa_anual: float, meses: int) -> float:
    """Quanto você terá depois de `meses`, começando com `inicial` e
    investindo `aporte_mensal` no fim de cada mês."""
    i = taxa_mensal(taxa_anual)
    saldo = inicial
    for _ in range(meses):
        saldo = saldo * (1 + i) + aporte_mensal
    return saldo


# ---------------------------------------------------------------------------
# Inflação: real <-> nominal
# ---------------------------------------------------------------------------

def real_para_nominal(valor_real: float, inflacao_anual: float, anos: float) -> float:
    """Converte reais de hoje para reais do futuro (o número que vai aparecer
    no extrato). Ex.: R$ 50 mil hoje, 4,5% ao ano, 20 anos -> ~R$ 120 mil."""
    return valor_real * (1 + inflacao_anual) ** anos


def nominal_para_real(valor_nominal: float, inflacao_anual: float, anos: float) -> float:
    """O contrário: quanto um valor do futuro vale em reais de hoje."""
    return valor_nominal / (1 + inflacao_anual) ** anos


# ---------------------------------------------------------------------------
# Liberdade financeira
# ---------------------------------------------------------------------------

def patrimonio_necessario(renda_mensal_desejada: float, taxa_saque: float = 0.04) -> float:
    """Patrimônio que paga a vida sozinho.

    Regra: patrimônio = renda mensal x 12 / taxa de saque.
    Ex.: R$ 50 mil/mês com saque de 4% ao ano -> R$ 15 milhões.
    """
    if taxa_saque <= 0:
        raise ValueError("A taxa de saque precisa ser maior que zero.")
    return renda_mensal_desejada * 12 / taxa_saque


# ---------------------------------------------------------------------------
# Simulação por fases da vida
# ---------------------------------------------------------------------------

@dataclass
class Fase:
    """Um trecho da vida com um aporte mensal fixo.

    A fase vale de `idade_inicio` (inclusive) até `idade_fim` (exclusive).
    Ex.: Fase(24, 27, 3000) = aportar R$ 3 mil/mês dos 24 aos 27 anos.
    """
    idade_inicio: float
    idade_fim: float
    aporte_mensal: float


def aporte_na_idade(fases: list[Fase], idade: float) -> float:
    """Aporte mensal em vigor numa idade. Depois da última fase, continua
    valendo o aporte da última fase (ex.: "40+")."""
    fases_ordenadas = sorted(fases, key=lambda f: f.idade_inicio)
    for fase in fases_ordenadas:
        if fase.idade_inicio <= idade < fase.idade_fim:
            return fase.aporte_mensal
    if fases_ordenadas and idade >= fases_ordenadas[-1].idade_fim:
        return fases_ordenadas[-1].aporte_mensal
    return 0.0


def simular_patrimonio(
    fases: list[Fase],
    taxa_real_anual: float,
    idade_atual: float,
    patrimonio_inicial: float = 0.0,
    idade_final: int = 70,
) -> list[tuple[float, float]]:
    """Simula mês a mês e devolve uma lista de (idade, patrimônio), um ponto
    por ano, começando na idade atual."""
    i = taxa_mensal(taxa_real_anual)
    saldo = patrimonio_inicial
    pontos = [(idade_atual, saldo)]
    meses_totais = round((idade_final - idade_atual) * 12)
    for mes in range(1, meses_totais + 1):
        idade = idade_atual + (mes - 1) / 12  # idade no começo do mês
        saldo = saldo * (1 + i) + aporte_na_idade(fases, idade)
        if mes % 12 == 0:
            pontos.append((round(idade_atual + mes / 12, 2), saldo))
    return pontos


def idade_que_atinge(pontos: list[tuple[float, float]], meta: float) -> float | None:
    """Primeira idade em que o patrimônio chega à meta (ou None se não chega)."""
    for idade, saldo in pontos:
        if saldo >= meta:
            return idade
    return None


# ---------------------------------------------------------------------------
# Conceitos: faturamento, lucro, renda pessoal, patrimônio
# ---------------------------------------------------------------------------

def lucro(faturamento: float, custos: float, impostos_empresa: float) -> float:
    """Lucro = faturamento - custos (inclui salários) - impostos da empresa."""
    return faturamento - custos - impostos_empresa


def patrimonio_liquido(bens: float, dividas: float) -> float:
    """Patrimônio = tudo o que você possui - dívidas."""
    return bens - dividas
