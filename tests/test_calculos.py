"""Testes dos cálculos financeiros. Rode com:  python -m pytest"""

import pytest

from core.calculos import (
    Fase,
    aporte_na_idade,
    idade_que_atinge,
    lucro,
    nominal_para_real,
    patrimonio_liquido,
    patrimonio_necessario,
    real_para_nominal,
    simular_patrimonio,
    taxa_mensal,
    valor_futuro,
)


# --- Taxas e juros compostos ---------------------------------------------

def test_taxa_mensal_composta_volta_na_anual():
    i = taxa_mensal(0.05)
    assert (1 + i) ** 12 - 1 == pytest.approx(0.05)
    assert i < 0.05 / 12  # menor que a divisão simples


def test_valor_futuro_sem_aporte_e_juros_compostos_puros():
    # R$ 1.000 por 10 anos a 5% ao ano = 1000 * 1,05^10
    assert valor_futuro(1000, 0, 0.05, 120) == pytest.approx(1000 * 1.05 ** 10)


def test_valor_futuro_sem_juros_e_soma_simples():
    assert valor_futuro(0, 100, 0.0, 12) == pytest.approx(1200)


def test_valor_futuro_com_aporte_segue_formula_fechada():
    i = taxa_mensal(0.05)
    n = 36
    esperado = 3000 * ((1 + i) ** n - 1) / i
    assert valor_futuro(0, 3000, 0.05, n) == pytest.approx(esperado)


# --- Inflação ---------------------------------------------------------------

def test_inflacao_exemplo_do_plano():
    # R$ 50 mil hoje, 4,5% ao ano, 20 anos -> ~R$ 120 mil
    assert real_para_nominal(50_000, 0.045, 20) == pytest.approx(120_586, rel=1e-3)


def test_real_e_nominal_sao_inversos():
    v = real_para_nominal(1000, 0.045, 7)
    assert nominal_para_real(v, 0.045, 7) == pytest.approx(1000)


# --- Meta de liberdade financeira ------------------------------------------

def test_meta_de_liberdade_do_plano():
    assert patrimonio_necessario(50_000) == pytest.approx(15_000_000)
    assert patrimonio_necessario(100_000) == pytest.approx(30_000_000)


def test_meta_com_taxa_de_saque_diferente():
    assert patrimonio_necessario(10_000, 0.03) == pytest.approx(4_000_000)


def test_meta_rejeita_taxa_zero():
    with pytest.raises(ValueError):
        patrimonio_necessario(10_000, 0)


# --- Simulação por fases ----------------------------------------------------

FASES = [Fase(16, 24, 0), Fase(24, 27, 3000), Fase(27, 32, 10000)]


def test_aporte_na_idade():
    assert aporte_na_idade(FASES, 20) == 0
    assert aporte_na_idade(FASES, 24) == 3000
    assert aporte_na_idade(FASES, 31.9) == 10000
    assert aporte_na_idade(FASES, 50) == 10000  # depois da última, mantém


def test_simulacao_bate_com_valor_futuro_fase_a_fase():
    pontos = dict(simular_patrimonio(FASES, 0.05, 16, idade_final=32))
    aos_27 = valor_futuro(0, 3000, 0.05, 36)
    assert pontos[27] == pytest.approx(aos_27)
    assert pontos[32] == pytest.approx(valor_futuro(aos_27, 10000, 0.05, 60))


def test_idade_que_atinge():
    pontos = [(30, 100), (31, 200), (32, 300)]
    assert idade_que_atinge(pontos, 200) == 31
    assert idade_que_atinge(pontos, 1000) is None


# --- Conceitos ---------------------------------------------------------------

def test_lucro_e_patrimonio():
    assert lucro(200_000, 120_000, 20_000) == 60_000
    assert patrimonio_liquido(500_000, 150_000) == 350_000
