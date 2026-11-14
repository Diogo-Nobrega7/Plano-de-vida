"""Testes do Módulo 2: comparador, datas, metas e banco de dados."""

from datetime import date

import pandas as pd
import pytest

from core.carreira import ano_da_idade, pontuacao, ranking, situacao_meta


def test_pontuacao_media_ponderada():
    assert pontuacao({"a": 5, "b": 1}, {"a": 3, "b": 1}) == pytest.approx(4.0)


def test_peso_zero_ignora_criterio():
    assert pontuacao({"a": 5, "b": 1}, {"a": 1, "b": 0}) == 5


def test_sem_pesos_da_zero():
    assert pontuacao({"a": 5}, {"a": 0}) == 0


def test_ranking_ordena():
    tabela = pd.DataFrame([{"carreira": "X", "a": 2}, {"carreira": "Y", "a": 4}])
    assert ranking(tabela, {"a": 1})["Carreira"].tolist() == ["Y", "X"]


def test_ano_da_idade():
    assert ano_da_idade(18, 16, 2026) == 2028
    assert ano_da_idade(27, 16, 2026) == 2037


@pytest.mark.parametrize("prazo,status,esperado", [
    ("2026-12-31", "concluída", "✅ concluída"),
    ("2026-01-01", "em andamento", "🔴 atrasada"),
    ("2026-11-20", "não iniciada", "🟡 vence em breve"),
    ("2027-06-30", "não iniciada", "🟢 no prazo"),
    (None, "não iniciada", "sem prazo"),
])
def test_situacao_meta(prazo, status, esperado):
    assert situacao_meta(prazo, status, hoje=date(2026, 11, 14)) == esperado


# --- Banco de dados (arquivo temporário) -------------------------------------
@pytest.fixture
def banco(tmp_path, monkeypatch):
    from db import banco as b
    monkeypatch.setattr(b, "CAMINHO_DB", tmp_path / "teste.db")
    b.inicializar()
    return b


def test_dados_iniciais_do_modulo2(banco):
    assert len(banco.listar_metas()) == 7
    assert len(banco.listar_criterios()) == 7
    notas = banco.tabela_notas()
    assert "Medicina (Dermato/Neuro + clínica)" in notas["carreira"].tolist()
    assert len(banco.listar_decisoes()) == 1


def test_inicializar_duas_vezes_nao_duplica(banco):
    banco.inicializar()
    assert len(banco.listar_metas()) == 7


def test_salvar_notas_com_nova_carreira(banco):
    notas = banco.tabela_notas()
    nova = {c: 4 for c in notas.columns}
    nova.update(carreira="Engenharia", observacoes="teste")
    nova["Risco"] = None  # nota vazia vira 3
    banco.salvar_notas(pd.concat([notas, pd.DataFrame([nova])], ignore_index=True))
    salvo = banco.tabela_notas().set_index("carreira").loc["Engenharia"]
    assert salvo["Afinidade"] == 4 and salvo["Risco"] == 3


def test_metas_ida_e_volta(banco):
    metas = banco.listar_metas().drop(columns="id")
    metas.loc[0, "status"] = "concluída"
    banco.salvar_metas(metas)
    assert (banco.listar_metas()["status"] == "concluída").sum() == 1


def test_revisao_de_decisao(banco):
    d = banco.listar_decisoes().iloc[0]
    banco.registrar_revisao(int(d["id"]), "Confirmado", "2028-11-11")
    d2 = banco.listar_decisoes().iloc[0]
    assert d2["resultado"] == "Confirmado" and d2["revisar_em"] == "2028-11-11"
