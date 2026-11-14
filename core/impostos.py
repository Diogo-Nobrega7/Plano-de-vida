"""Impostos sobre salário (CLT) e sobre investimentos — regras de 2026.

Fontes (conferir todo ano, os valores mudam):
- INSS 2026: Portaria Interministerial MPS/MF nº 13/2026 (teto R$ 8.475,55).
- IRRF 2026: tabela progressiva mensal + redutor da Lei 15.270/2025
  (isenção até R$ 5 mil e redução gradual até R$ 7.350).
"""

from __future__ import annotations

# ---------------------------------------------------------------------------
# INSS (empregado CLT) — progressivo: cada faixa paga só sobre a sua parte
# ---------------------------------------------------------------------------
# (limite superior da faixa, alíquota)
FAIXAS_INSS_2026 = [
    (1621.00, 0.075),
    (2902.84, 0.09),
    (4354.27, 0.12),
    (8475.55, 0.14),  # teto
]


def inss(salario_bruto: float) -> float:
    desconto, anterior = 0.0, 0.0
    for limite, aliquota in FAIXAS_INSS_2026:
        if salario_bruto <= anterior:
            break
        desconto += (min(salario_bruto, limite) - anterior) * aliquota
        anterior = limite
    return round(desconto, 2)


# ---------------------------------------------------------------------------
# IRRF mensal 2026
# ---------------------------------------------------------------------------
# (limite superior da base, alíquota, parcela a deduzir)
FAIXAS_IR_2026 = [
    (2428.80, 0.0, 0.0),
    (2826.65, 0.075, 182.16),
    (3751.05, 0.15, 394.16),
    (4664.68, 0.225, 675.49),
    (float("inf"), 0.275, 908.73),
]
DEDUCAO_DEPENDENTE = 189.59
DESCONTO_SIMPLIFICADO = 607.20


def ir_tabela(base: float) -> float:
    """Imposto pela tabela progressiva (antes do redutor)."""
    for limite, aliquota, deduzir in FAIXAS_IR_2026:
        if base <= limite:
            return max(0.0, base * aliquota - deduzir)
    return 0.0  # inalcançável


def redutor_lei_15270(rendimento_bruto: float, imposto: float) -> float:
    """Redução da Lei 15.270/2025: zera o IR até R$ 5 mil e diminui até R$ 7.350."""
    if rendimento_bruto <= 5000:
        reducao = 312.89
    elif rendimento_bruto <= 7350:
        reducao = 978.62 - 0.133145 * rendimento_bruto
    else:
        reducao = 0.0
    return min(imposto, max(0.0, reducao))


def irrf(salario_bruto: float, dependentes: int = 0) -> float:
    """IR retido na fonte sobre o salário mensal.

    A base usa o que for mais vantajoso: INSS + dependentes OU o desconto
    simplificado (R$ 607,20)."""
    deducoes = max(inss(salario_bruto) + dependentes * DEDUCAO_DEPENDENTE, DESCONTO_SIMPLIFICADO)
    base = max(0.0, salario_bruto - deducoes)
    imposto = ir_tabela(base)
    return round(imposto - redutor_lei_15270(salario_bruto, imposto), 2)


def salario_liquido(salario_bruto: float, dependentes: int = 0, outros_descontos: float = 0.0) -> dict:
    """Quebra completa do salário: bruto, INSS, IR, líquido e alíquota efetiva."""
    v_inss = inss(salario_bruto)
    v_ir = irrf(salario_bruto, dependentes)
    liquido = salario_bruto - v_inss - v_ir - outros_descontos
    return {
        "bruto": salario_bruto,
        "inss": v_inss,
        "ir": v_ir,
        "outros": outros_descontos,
        "liquido": round(liquido, 2),
        "aliquota_efetiva": (v_inss + v_ir) / salario_bruto if salario_bruto else 0.0,
    }


def bruto_para_liquido_desejado(liquido_desejado: float, dependentes: int = 0) -> float:
    """Quanto precisa ganhar bruto (CLT) para receber um líquido. Busca binária."""
    baixo, alto = liquido_desejado, liquido_desejado * 2 + 10_000
    for _ in range(100):
        meio = (baixo + alto) / 2
        if salario_liquido(meio, dependentes)["liquido"] < liquido_desejado:
            baixo = meio
        else:
            alto = meio
    return round(alto, 2)


# ---------------------------------------------------------------------------
# IR sobre investimentos
# ---------------------------------------------------------------------------

def aliquota_regressiva(dias: int) -> float:
    """Tabela regressiva da renda fixa (CDB, Tesouro, fundos de RF)."""
    if dias <= 180:
        return 0.225
    if dias <= 360:
        return 0.20
    if dias <= 720:
        return 0.175
    return 0.15
