"""Catálogo de investimentos e simulação com juros e IR.

As taxas abaixo são uma FOTO do mercado em novembro de 2026 e servem como
ponto de partida — no app você pode editar todas. Rentabilidade passada ou
projetada não é garantia de rentabilidade futura.

Referências de mercado (nov/2026):
- Selic 13,75% a.a. (Copom, 04/11/2026); CDI ~13,65% a.a.
- Focus 09/11/2026: IPCA 2026 5,22%, IPCA 2027 4,90%, IPCA 2028 4,00%;
  Selic fim de 2027 12,50%, 2028 11,00%, 2029 10,25%.
"""

from __future__ import annotations

from dataclasses import dataclass

from core.calculos import taxa_mensal
from core.impostos import aliquota_regressiva

SELIC = 0.1375
CDI = 0.1365
IPCA_12M = 0.0522
IPCA_LONGO_PRAZO = 0.04  # Focus para 2028-2029

# CDI médio esperado em cada ano a partir de agora (Focus 09/11/2026:
# Selic 13,75% -> 12,50% -> 11,00% -> 10,25%). Depois do último, repete.
CURVA_CDI = [0.131, 0.1175, 0.106, 0.1015]

# Como o IR é cobrado em cada tipo
IR_REGRESSIVO = "regressivo"   # 22,5% -> 15% conforme o prazo
IR_ISENTO = "isento"
IR_ACOES = "acoes_15"          # 15% sobre o ganho (vendas > R$ 20 mil/mês)


@dataclass
class Investimento:
    nome: str
    categoria: str
    taxa_anual: float          # rentabilidade nominal esperada ao ano (antes do IR)
    ir: str
    risco: str                 # Baixo / Médio / Alto
    liquidez: str
    garantia: str
    para_que: str
    observacao: str = ""
    pct_cdi: float | None = None  # se preenchido, rende X% do CDI (pós-fixado)


CATALOGO = [
    Investimento("Tesouro Selic", "Renda fixa pública", SELIC, IR_REGRESSIVO, "Baixo",
                 "Diária (D+1)", "Tesouro Nacional",
                 "Reserva de emergência e primeiro investimento.",
                 "O mais seguro do país. Acompanha a Selic; quase não oscila.", pct_cdi=1.007),
    Investimento("CDB liquidez diária 100% CDI", "Renda fixa bancária", CDI, IR_REGRESSIVO, "Baixo",
                 "Diária", "FGC até R$ 250 mil por banco",
                 "Reserva de emergência, alternativa ao Tesouro Selic.",
                 "Prefira bancos grandes ou fique dentro do limite do FGC.", pct_cdi=1.0),
    Investimento("CDB 110% CDI (2-3 anos)", "Renda fixa bancária", CDI * 1.10, IR_REGRESSIVO, "Baixo/Médio",
                 "No vencimento", "FGC até R$ 250 mil por banco",
                 "Objetivos de médio prazo (carro, intercâmbio, faculdade).",
                 "Rende mais porque você deixa o dinheiro preso até o vencimento.", pct_cdi=1.10),
    Investimento("LCI/LCA 92% CDI", "Renda fixa bancária", CDI * 0.92, IR_ISENTO, "Baixo",
                 "Carência de 9-12 meses", "FGC até R$ 250 mil por banco",
                 "Médio prazo. Isenta de IR, costuma vencer CDB de até ~108% do CDI.",
                 "Compare sempre pelo valor LÍQUIDO, não pela porcentagem.", pct_cdi=0.92),
    Investimento("Tesouro Prefixado", "Renda fixa pública", 0.135, IR_REGRESSIVO, "Médio",
                 "Diária, mas oscila antes do vencimento", "Tesouro Nacional",
                 "Travar uma taxa alta quando se espera queda dos juros.",
                 "Se vender antes do vencimento pode ganhar ou perder. Leve até o fim."),
    Investimento("Tesouro IPCA+ (longo)", "Renda fixa pública", (1 + IPCA_LONGO_PRAZO) * 1.073 - 1,
                 IR_REGRESSIVO, "Médio", "Diária, mas oscila bastante", "Tesouro Nacional",
                 "Longo prazo e aposentadoria: protege da inflação + juro real alto.",
                 "Taxas de IPCA + ~7% ao ano são historicamente muito altas. "
                 "Valor projetado aqui = IPCA de 4% + 7,3%."),
    Investimento("Poupança", "Renda fixa bancária", 0.0617 + 0.018, IR_ISENTO, "Baixo",
                 "Diária (rende no aniversário)", "FGC até R$ 250 mil por banco",
                 "Só como comparação: com Selic alta, perde para quase tudo.",
                 "0,5% ao mês + TR (TR ~1,8% a.a. com Selic de 13,75%)."),
    Investimento("Fundos imobiliários (FIIs)", "Renda variável", 0.04 + 0.075, IR_ISENTO, "Médio/Alto",
                 "Diária na bolsa (preço oscila)", "Nenhuma",
                 "Renda mensal com aluguéis de imóveis. Dividendos isentos para pessoa física.",
                 "Premissa: dividendos ~11-12% ao ano, contando valorização igual à inflação. "
                 "Ganho na venda paga 20%."),
    Investimento("Ações / ETF de Ibovespa (BOVA11)", "Renda variável", (1 + IPCA_LONGO_PRAZO) * 1.065 - 1,
                 IR_ACOES, "Alto", "Diária na bolsa (preço oscila muito)", "Nenhuma",
                 "Longo prazo (10+ anos), parte menor da carteira.",
                 "Premissa: IPCA + 6,5% ao ano no longo prazo — pode ser muito melhor ou pior. "
                 "ETFs pagam 15% sobre o ganho, sem a isenção dos R$ 20 mil."),
]


def por_nome(nome: str) -> Investimento:
    return next(i for i in CATALOGO if i.nome == nome)


def taxas_anuais(inv: Investimento, anos: int, juros_caem: bool = True) -> list[float]:
    """Taxa de cada ano. Pós-fixados seguem a curva do CDI se `juros_caem`;
    prefixados, IPCA+ e renda variável usam a taxa fixa do catálogo."""
    if inv.pct_cdi is None or not juros_caem:
        return [inv.taxa_anual] * anos
    return [inv.pct_cdi * CURVA_CDI[min(a, len(CURVA_CDI) - 1)] for a in range(anos)]


def _fatores(taxas: list[float] | float, meses: int) -> list[float]:
    """Fator acumulado G[m]: R$ 1 aplicado no mês 0 vale G[m] no mês m."""
    if isinstance(taxas, (int, float)):
        taxas = [taxas]
    g = [1.0]
    for m in range(meses):
        i = taxa_mensal(taxas[min(m // 12, len(taxas) - 1)])
        g.append(g[-1] * (1 + i))
    return g


def simular_investimento(
    inicial: float,
    aporte_mensal: float,
    taxa_anual: float | list[float],
    meses: int,
    tipo_ir: str,
    inflacao_anual: float = IPCA_LONGO_PRAZO,
) -> dict:
    """Simula um investimento e calcula o IR no resgate final.

    `taxa_anual` pode ser um número ou uma lista com a taxa de cada ano.
    Na tabela regressiva cada aporte tem a sua idade: o aporte do 1º mês fica
    mais tempo (paga 15%) que o do último mês (pode pagar 22,5%).
    """
    g = _fatores(taxa_anual, meses)
    depositos = [(0, inicial)] + [(m, aporte_mensal) for m in range(1, meses + 1)]
    bruto = investido = imposto = 0.0
    for mes, valor in depositos:
        if valor <= 0:
            continue
        final = valor * g[meses] / g[mes]
        ganho = final - valor
        bruto += final
        investido += valor
        if tipo_ir == IR_REGRESSIVO:
            imposto += ganho * aliquota_regressiva((meses - mes) * 30)
        elif tipo_ir == IR_ACOES:
            imposto += ganho * 0.15
    liquido = bruto - imposto
    fator_inflacao = (1 + inflacao_anual) ** (meses / 12)
    return {
        "investido": investido,
        "bruto": bruto,
        "imposto": imposto,
        "liquido": liquido,
        "liquido_real": liquido / fator_inflacao,
        "ganho_liquido": liquido - investido,
    }


def evolucao_mensal(inicial: float, aporte_mensal: float, taxa_anual: float | list[float], meses: int) -> list[float]:
    """Saldo bruto mês a mês (para o gráfico)."""
    g = _fatores(taxa_anual, meses)
    return [inicial * g[m] + sum(aporte_mensal * g[m] / g[k] for k in range(1, m + 1)) for m in range(meses + 1)]
