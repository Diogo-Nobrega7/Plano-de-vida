"""Acesso ao banco de dados (SQLite).

O banco é um único arquivo: dados/plano.db. Para fazer backup, basta
copiar esse arquivo (veja o README).
"""

from __future__ import annotations

import os
from pathlib import Path

import pandas as pd

from db.conexao import Conexao
from db.conexao import conectar as _conectar

from db.dados_iniciais import (CARREIRAS_INICIAIS, CENARIOS_INICIAIS, CONFIG_INICIAL, CRITERIOS_INICIAIS,
                               DECISOES_INICIAIS, METAS_INICIAIS, fases_do_cenario)

RAIZ = Path(__file__).resolve().parent.parent
# A variável de ambiente PLANO_DB permite usar outro arquivo (útil em testes).
CAMINHO_DB = Path(os.environ.get("PLANO_DB", RAIZ / "dados" / "plano.db"))


def conectar() -> Conexao:
    return _conectar(CAMINHO_DB)


def inicializar() -> None:
    """Cria as tabelas e, se o banco estiver vazio, carrega os dados iniciais."""
    esquema = (RAIZ / "db" / "esquema.sql").read_text(encoding="utf-8")
    with conectar() as con:
        con.executescript(esquema)
        for chave, valor in CONFIG_INICIAL.items():
            con.execute("INSERT INTO config (chave, valor) VALUES (?, ?) ON CONFLICT (chave) DO NOTHING", (chave, valor))
        ja_tem = con.execute("SELECT COUNT(*) FROM cenarios").fetchone()[0]
        if not ja_tem:
            for nome, taxa, descricao in CENARIOS_INICIAIS:
                cenario_id = con.inserir(
                    "INSERT INTO cenarios (nome, taxa_real, descricao) VALUES (?, ?, ?)",
                    (nome, taxa, descricao),
                )
                for fase in fases_do_cenario(nome):
                    con.execute(
                        "INSERT INTO fases (cenario_id, nome, idade_inicio, idade_fim,"
                        " renda_min, renda_max, aporte_mensal) VALUES (?, ?, ?, ?, ?, ?, ?)",
                        (cenario_id, *fase),
                    )
        _semear_modulo2(con)
        from db import banco_enem  # importado aqui para evitar import circular
        banco_enem.semear(con)


def _vazia(con: Conexao, tabela: str) -> bool:
    return con.execute(f"SELECT COUNT(*) FROM {tabela}").fetchone()[0] == 0


def _semear_modulo2(con: Conexao) -> None:
    """Dados iniciais do Módulo 2 (cada tabela só é preenchida se estiver vazia)."""
    if _vazia(con, "metas"):
        con.executemany("INSERT INTO metas (titulo, area, prazo, status) VALUES (?, ?, ?, ?)", METAS_INICIAIS)
    if _vazia(con, "criterios"):
        con.executemany("INSERT INTO criterios (nome, peso, descricao) VALUES (?, ?, ?)", CRITERIOS_INICIAIS)
    if _vazia(con, "carreiras"):
        ids_crit = [r[0] for r in con.execute("SELECT id FROM criterios ORDER BY id")]
        for nome, (notas, obs) in CARREIRAS_INICIAIS.items():
            cid = con.inserir("INSERT INTO carreiras (nome, notas) VALUES (?, ?)", (nome, obs))
            con.executemany("INSERT INTO notas_carreira VALUES (?, ?, ?)",
                            [(cid, crit, n) for crit, n in zip(ids_crit, notas)])
    if _vazia(con, "decisoes"):
        con.executemany("INSERT INTO decisoes (data, decisao, premissas, revisar_em) VALUES (?, ?, ?, ?)",
                        DECISOES_INICIAIS)


# --------------------------------------------------------------------------
# Configurações
# --------------------------------------------------------------------------

def ler_config() -> dict[str, str]:
    with conectar() as con:
        return dict(con.execute("SELECT chave, valor FROM config").fetchall())


def salvar_config(chave: str, valor) -> None:
    with conectar() as con:
        con.execute(
            "INSERT INTO config (chave, valor) VALUES (?, ?)"
            " ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor",
            (chave, str(valor)),
        )


# --------------------------------------------------------------------------
# Lançamentos (receitas, despesas, aportes)
# --------------------------------------------------------------------------

def adicionar_lancamento(mes: str, tipo: str, categoria: str, descricao: str, valor: float) -> None:
    with conectar() as con:
        con.execute(
            "INSERT INTO lancamentos (mes, tipo, categoria, descricao, valor) VALUES (?, ?, ?, ?, ?)",
            (mes, tipo, categoria.strip(), descricao.strip(), valor),
        )


def listar_lancamentos() -> pd.DataFrame:
    with conectar() as con:
        return con.df("SELECT * FROM lancamentos ORDER BY mes DESC, id DESC")


def apagar_lancamentos(ids: list[int]) -> None:
    with conectar() as con:
        con.executemany("DELETE FROM lancamentos WHERE id = ?", [(i,) for i in ids])


def categorias_usadas() -> list[str]:
    with conectar() as con:
        linhas = con.execute("SELECT DISTINCT categoria FROM lancamentos ORDER BY categoria").fetchall()
    return [l[0] for l in linhas]


# --------------------------------------------------------------------------
# Investimentos
# --------------------------------------------------------------------------

def listar_investimentos() -> pd.DataFrame:
    with conectar() as con:
        return con.df("SELECT * FROM investimentos ORDER BY id")


def salvar_investimentos(df: pd.DataFrame) -> None:
    """Substitui todos os investimentos pelo conteúdo da tabela editada."""
    with conectar() as con:
        con.execute("DELETE FROM investimentos")
        for _, linha in df.dropna(subset=["nome"]).iterrows():
            con.execute(
                "INSERT INTO investimentos (nome, tipo, valor_aplicado, saldo_atual, atualizado_em)"
                " VALUES (?, ?, ?, ?, ?)",
                (
                    linha["nome"],
                    linha.get("tipo") or "Outro",
                    float(linha.get("valor_aplicado") or 0),
                    float(linha.get("saldo_atual") or 0),
                    linha.get("atualizado_em"),
                ),
            )


def patrimonio_total() -> float:
    with conectar() as con:
        return con.execute("SELECT COALESCE(SUM(saldo_atual), 0) FROM investimentos").fetchone()[0]


# --------------------------------------------------------------------------
# Cenários e fases
# --------------------------------------------------------------------------

def listar_cenarios() -> pd.DataFrame:
    with conectar() as con:
        return con.df("SELECT * FROM cenarios ORDER BY id")


def atualizar_taxa_cenario(cenario_id: int, taxa_real: float) -> None:
    with conectar() as con:
        con.execute("UPDATE cenarios SET taxa_real = ? WHERE id = ?", (taxa_real, cenario_id))


def listar_fases(cenario_id: int) -> pd.DataFrame:
    with conectar() as con:
        return con.df(
            "SELECT nome, idade_inicio, idade_fim, renda_min, renda_max, aporte_mensal"
            " FROM fases WHERE cenario_id = ? ORDER BY idade_inicio", (cenario_id,),
        )


def salvar_fases(cenario_id: int, df: pd.DataFrame) -> None:
    """Substitui as fases do cenário pelo conteúdo da tabela editada."""
    with conectar() as con:
        con.execute("DELETE FROM fases WHERE cenario_id = ?", (cenario_id,))
        for _, l in df.dropna(subset=["nome", "idade_inicio", "idade_fim"]).iterrows():
            con.execute(
                "INSERT INTO fases (cenario_id, nome, idade_inicio, idade_fim,"
                " renda_min, renda_max, aporte_mensal) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (
                    cenario_id,
                    l["nome"],
                    float(l["idade_inicio"]),
                    float(l["idade_fim"]),
                    float(l.get("renda_min") or 0),
                    float(l.get("renda_max") or 0),
                    float(l.get("aporte_mensal") or 0),
                ),
            )


# --------------------------------------------------------------------------
# Módulo 2: metas
# --------------------------------------------------------------------------

def listar_metas() -> pd.DataFrame:
    with conectar() as con:
        return con.df("SELECT * FROM metas ORDER BY status = 'concluída', prazo")


def salvar_metas(df: pd.DataFrame) -> None:
    """Substitui todas as metas pelo conteúdo da tabela editada."""
    with conectar() as con:
        con.execute("DELETE FROM metas")
        for _, l in df.dropna(subset=["titulo"]).iterrows():
            con.execute(
                "INSERT INTO metas (titulo, area, prazo, status, notas) VALUES (?, ?, ?, ?, ?)",
                (l["titulo"], l.get("area") or "Pessoal", _data_texto(l.get("prazo")),
                 l.get("status") or "não iniciada", l.get("notas")),
            )


def _data_texto(valor) -> str | None:
    """Converte data (ou vazio) para texto AAAA-MM-DD."""
    if valor is None or pd.isna(valor):
        return None
    return str(pd.Timestamp(valor).date())


# --------------------------------------------------------------------------
# Módulo 2: comparador de carreiras
# --------------------------------------------------------------------------

def listar_criterios() -> pd.DataFrame:
    with conectar() as con:
        return con.df("SELECT * FROM criterios ORDER BY id")


def salvar_pesos(pesos: dict[str, float]) -> None:
    with conectar() as con:
        con.executemany("UPDATE criterios SET peso = ? WHERE nome = ?", [(p, n) for n, p in pesos.items()])


def tabela_notas() -> pd.DataFrame:
    """Uma linha por carreira, uma coluna por critério (nota 1-5) + observações."""
    with conectar() as con:
        longo = con.df(
            "SELECT ca.nome AS carreira, cr.nome AS criterio, n.nota FROM notas_carreira n"
            " JOIN carreiras ca ON ca.id = n.carreira_id JOIN criterios cr ON cr.id = n.criterio_id")
        carreiras = con.df("SELECT nome AS carreira, notas AS observacoes FROM carreiras ORDER BY id")
        criterios = listar_criterios()["nome"].tolist()
    largo = longo.pivot(index="carreira", columns="criterio", values="nota") if not longo.empty else pd.DataFrame()
    largo = largo.reindex(index=carreiras["carreira"], columns=criterios)
    largo = largo.reset_index().merge(carreiras, on="carreira", how="left")
    return largo


def salvar_notas(df: pd.DataFrame) -> None:
    """Substitui carreiras e notas pelo conteúdo da tabela editada (notas vazias viram 3)."""
    criterios = listar_criterios()
    with conectar() as con:
        con.execute("DELETE FROM carreiras")
        for _, l in df.dropna(subset=["carreira"]).iterrows():
            cid = con.inserir("INSERT INTO carreiras (nome, notas) VALUES (?, ?)",
                              (l["carreira"], l.get("observacoes")))
            for crit in criterios.itertuples():
                nota = l.get(crit.nome)
                nota = 3 if nota is None or pd.isna(nota) else min(5, max(1, float(nota)))
                con.execute("INSERT INTO notas_carreira VALUES (?, ?, ?)", (cid, crit.id, nota))


# --------------------------------------------------------------------------
# Módulo 2: diário de decisões
# --------------------------------------------------------------------------

def listar_decisoes() -> pd.DataFrame:
    with conectar() as con:
        return con.df("SELECT * FROM decisoes ORDER BY data DESC, id DESC")


def adicionar_decisao(data: str, decisao: str, premissas: str, revisar_em: str | None) -> None:
    with conectar() as con:
        con.execute("INSERT INTO decisoes (data, decisao, premissas, revisar_em) VALUES (?, ?, ?, ?)",
                    (data, decisao.strip(), premissas.strip(), revisar_em))


def registrar_revisao(decisao_id: int, resultado: str, nova_revisao: str | None) -> None:
    with conectar() as con:
        con.execute("UPDATE decisoes SET resultado = ?, revisar_em = ? WHERE id = ?",
                    (resultado.strip(), nova_revisao, decisao_id))
