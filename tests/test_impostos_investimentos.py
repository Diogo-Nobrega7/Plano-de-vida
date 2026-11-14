"""Testes de impostos (2026), investimentos e orçamento."""

import pytest

from core.impostos import aliquota_regressiva, bruto_para_liquido_desejado, inss, irrf, salario_liquido
from core.investimentos import (CATALOGO, IR_ACOES, IR_ISENTO, IR_REGRESSIVO, por_nome,
                                simular_investimento, taxas_anuais, evolucao_mensal)
from core.calculos import valor_futuro
from core.orcamento import PERFIS, TOPICOS, estimar


# --- INSS -----------------------------------------------------------------
def test_inss_primeira_faixa():
    assert inss(1621.00) == pytest.approx(121.58, abs=0.011)


def test_inss_teto():
    assert inss(8475.55) == pytest.approx(988.09, abs=0.01)
    assert inss(50_000) == inss(8475.55)


# --- IR -------------------------------------------------------------------
def test_isento_ate_5_mil():
    assert irrf(2000) == 0
    assert irrf(5000) == 0


def test_redutor_gradual_entre_5_mil_e_7350():
    assert 0 < irrf(6000) < irrf(7350)


def test_acima_de_7350_sem_redutor():
    # 10 mil: base = 10000 - 988,09 = 9011,91 -> 27,5% - 908,73
    assert irrf(10_000) == pytest.approx(9011.91 * 0.275 - 908.73, abs=0.01)


def test_dependente_reduz_ir():
    assert irrf(10_000, 2) < irrf(10_000)


def test_liquido_e_bruto_menos_descontos():
    r = salario_liquido(10_000, outros_descontos=100)
    assert r["liquido"] == pytest.approx(10_000 - r["inss"] - r["ir"] - 100)


def test_bruto_para_liquido_e_inverso():
    bruto = bruto_para_liquido_desejado(20_000)
    assert salario_liquido(bruto)["liquido"] == pytest.approx(20_000, abs=0.05)


def test_tabela_regressiva():
    assert aliquota_regressiva(100) == 0.225
    assert aliquota_regressiva(200) == 0.20
    assert aliquota_regressiva(500) == 0.175
    assert aliquota_regressiva(1000) == 0.15


# --- Simulação de investimentos --------------------------------------------
def test_bruto_bate_com_juros_compostos():
    r = simular_investimento(1000, 100, 0.10, 60, IR_ISENTO)
    assert r["bruto"] == pytest.approx(valor_futuro(1000, 100, 0.10, 60))
    assert r["imposto"] == 0


def test_ir_regressivo_longo_prazo_15_por_cento():
    r = simular_investimento(1000, 0, 0.10, 36, IR_REGRESSIVO)
    assert r["imposto"] == pytest.approx((r["bruto"] - 1000) * 0.15)


def test_ir_acoes_15_por_cento():
    r = simular_investimento(1000, 0, 0.10, 12, IR_ACOES)
    assert r["imposto"] == pytest.approx((r["bruto"] - 1000) * 0.15)


def test_valor_real_desconta_inflacao():
    r = simular_investimento(1000, 0, 0.0, 12, IR_ISENTO, inflacao_anual=0.05)
    assert r["liquido_real"] == pytest.approx(1000 / 1.05)


def test_taxa_variavel_por_ano():
    r = simular_investimento(1000, 0, [0.10, 0.20], 24, IR_ISENTO)
    assert r["bruto"] == pytest.approx(1000 * 1.10 * 1.20)


def test_evolucao_termina_no_bruto():
    taxas = taxas_anuais(por_nome("Tesouro Selic"), 5)
    assert evolucao_mensal(500, 200, taxas, 60)[-1] == pytest.approx(
        simular_investimento(500, 200, taxas, 60, IR_ISENTO)["bruto"])


def test_pos_fixado_segue_curva_e_prefixado_nao():
    selic = taxas_anuais(por_nome("Tesouro Selic"), 5)
    assert selic[0] > selic[-1]
    pre = taxas_anuais(por_nome("Tesouro Prefixado"), 5)
    assert len(set(pre)) == 1


def test_catalogo_tem_ir_valido():
    assert all(i.ir in (IR_REGRESSIVO, IR_ISENTO, IR_ACOES) for i in CATALOGO)


# --- Orçamento --------------------------------------------------------------
@pytest.mark.parametrize("perfil", list(PERFIS))
def test_percentuais_somam_100(perfil):
    assert sum(p for _, p, _ in estimar(1000, perfil)) == pytest.approx(1.0)
    assert sum(v for _, _, v in estimar(1000, perfil)) == pytest.approx(1000)
