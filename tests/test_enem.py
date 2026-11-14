"""Testes do Módulo 3 (ENEM): progresso, notas, redação e banco."""

import pandas as pd
import pytest

from core.enem import distancia_meta, media_enem, media_ponderada, minutos_por_semana, progresso
from core.redacao import analisar, nota_total, palavras_chave_tema, prompt_correcao

REDACAO_BOA = """Segundo a Constituição Federal de 1988, a saúde é direito de todos e dever do Estado. Nesse sentido, a valorização do Sistema Único de Saúde como direito universal ainda enfrenta desafios no Brasil, seja pelo subfinanciamento, seja pela desinformação da população. Dessa forma, é fundamental discutir esses entraves.

Em primeiro lugar, o subfinanciamento compromete o atendimento. De acordo com dados do IBGE, milhões de brasileiros dependem exclusivamente do sistema público. Contudo, a falta de recursos gera filas e precariza o serviço, o que reduz a confiança da sociedade. Assim, a universalidade torna-se apenas formal.

Além disso, a desinformação contribui para a desvalorização do sistema. Conforme o sociólogo Zygmunt Bauman, as relações líquidas enfraquecem vínculos coletivos, uma vez que o individualismo afasta o cidadão do que é público. Por conseguinte, muitos ignoram que vacinas e transplantes são garantidos pelo sistema público.

Portanto, o Ministério da Saúde deve ampliar campanhas informativas sobre os serviços oferecidos, por meio de propagandas em redes sociais e na televisão, como vídeos com histórias reais de pacientes atendidos, isto é, relatos que aproximem a população do sistema, a fim de que a sociedade reconheça a importância da saúde pública universal. Além disso, o Congresso precisa garantir financiamento estável, para que a universalidade deixe de ser apenas formal e se torne realidade em todo o país, com atendimento de qualidade e ágil para todos os cidadãos brasileiros."""

TEMA = "A valorização do Sistema Único de Saúde (SUS) como direito universal"


# --- progresso e notas --------------------------------------------------------
def test_progresso():
    assert progresso(pd.Series(["dominado", "não estudado"])) == pytest.approx(0.5)
    assert progresso(pd.Series([], dtype=str)) == 0


def test_media_enem():
    assert media_enem({"lc": 700, "ch": 700, "cn": 700, "mt": 900, "redacao": 1000}) == 800
    assert media_enem({"lc": 700}) is None


def test_media_ponderada():
    assert media_ponderada({"a": 600, "b": 800}, {"a": 1, "b": 3}) == 750


def test_distancia_meta_nao_negativa():
    d = distancia_meta({"lc": 800, "ch": 600, "cn": None, "mt": 900, "redacao": 960},
                       {"lc": 720, "ch": 760, "cn": 780, "mt": 850, "redacao": 940}).set_index("Área")
    assert d.loc["Linguagens", "Falta"] == 0
    assert d.loc["Humanas", "Falta"] == 160
    assert pd.isna(d.loc["Natureza", "Falta"])


def test_minutos_por_semana():
    s = pd.DataFrame({"data": ["2026-11-10", "2026-11-11"], "area": ["Matemática"] * 2, "minutos": [60, 30]})
    assert minutos_por_semana(s).iloc[0]["Matemática"] == pytest.approx(1.5)


# --- redação -------------------------------------------------------------------
def test_redacao_bem_estruturada():
    a = analisar(REDACAO_BOA, TEMA)
    assert a["paragrafos"] == 4
    assert a["repertorios"] >= 2
    assert len(a["conectivos"]) >= 8
    assert all(a["elementos_c5"].values()), a["elementos_c5"]
    assert not any("ZERO" in x for x in a["alertas"])


def test_texto_curto_alerta_zero():
    a = analisar("Eu acho que o SUS é bom. A gente usa muito.", TEMA)
    assert any("ZERO" in x for x in a["alertas"])
    assert "eu" in a["oralidade"] and "a gente" in a["oralidade"]


def test_tema_ausente_alerta():
    a = analisar(REDACAO_BOA, "Desafios para a preservação da Amazônia")
    assert any("tangenciar" in x for x in a["alertas"])


def test_palavras_chave_ignoram_genericas():
    assert "desafios" not in palavras_chave_tema("Desafios para a valorização da herança africana no Brasil")
    assert "herança" in palavras_chave_tema("Desafios para a valorização da herança africana no Brasil")


def test_nota_total():
    assert nota_total({"c1": 200, "c2": 160, "c3": 160, "c4": 200, "c5": 200}) == 920
    assert nota_total({"c1": 200}) is None


def test_prompt_contem_tema_texto_e_criterios():
    p = prompt_correcao(TEMA, "meu texto")
    assert TEMA in p and "meu texto" in p and "C5" in p and "2026" in p


# --- banco -------------------------------------------------------------------
@pytest.fixture
def be(tmp_path, monkeypatch):
    from db import banco, banco_enem
    monkeypatch.setattr(banco, "CAMINHO_DB", tmp_path / "t.db")
    banco.inicializar()
    return banco_enem


def test_dados_iniciais(be):
    assert set(be.listar_materias()["area"]) == set(be.AREAS)
    assert len(be.listar_conteudos()) > 100
    temas = be.listar_temas()
    assert (temas["origem"] == "ENEM").sum() == 11
    assert be.metas_nota()["mt"] == 850


def test_salvar_conteudos_marca_data_e_apaga(be):
    m = int(be.listar_materias().iloc[0]["id"])
    c = be.listar_conteudos(m)[["id", "nome", "frequencia", "status", "revisado_em"]]
    c.loc[c.index[0], "status"] = "dominado"
    c = c.iloc[:-1]  # apaga o último
    novo = pd.DataFrame([{"id": None, "nome": "Novo conteúdo", "frequencia": "Alta", "status": "estudando"}])
    be.salvar_conteudos(m, pd.concat([c, novo], ignore_index=True))
    depois = be.listar_conteudos(m)
    assert len(depois) == len(c) + 1
    assert depois.iloc[0]["revisado_em"] is not None
    assert "Novo conteúdo" in depois["nome"].tolist()


def test_video_sessao_simulado_redacao(be):
    m = int(be.listar_materias().iloc[0]["id"])
    be.adicionar_video(m, "Aula", "https://youtu.be/x")
    v = be.listar_videos().iloc[0]
    be.atualizar_video(int(v["id"]), True, "ok")
    assert be.listar_videos().iloc[0]["assistido"] == 1
    be.adicionar_sessao("2026-11-14", m, 50)
    assert be.listar_sessoes()["minutos"].sum() == 50
    be.adicionar_simulado("2026-11-14", "Teste", {"lc": 600, "mt": 700})
    assert be.listar_simulados().iloc[0]["mt"] == 700
    rid = be.salvar_redacao("2026-11-14", TEMA, "texto", {"c1": 160, "c2": 160, "c3": 120, "c4": 160, "c5": 200})
    assert be.listar_redacoes().iloc[0]["total"] == 800
    be.salvar_redacao("2026-11-14", TEMA, "texto", {"c1": 200, "c2": 200, "c3": 200, "c4": 200, "c5": 200},
                      redacao_id=rid)
    assert be.listar_redacoes().iloc[0]["total"] == 1000
