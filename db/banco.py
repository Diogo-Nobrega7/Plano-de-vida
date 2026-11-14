"""Acesso ao banco de dados (SQLite).

O banco é um único arquivo: dados/plano.db. Para fazer backup, basta
copiar esse arquivo (veja o README).
"""

from __future__ import annotations

import os
import sqlite3
from pathlib import Path

import pandas as pd

from db.dados_iniciais import CENARIOS_INICIAIS, CONFIG_INICIAL, fases_do_cenario

RAIZ = Path(__file__).resolve().parent.parent
# A variável de ambiente PLANO_DB permite usar outro arquivo (útil em testes).
CAMINHO_DB = Path(os.environ.get("PLANO_DB", RAIZ / "dados" / "plano.db"))


def conectar() -> sqlite3.Connection:
    CAMINHO_DB.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(CAMINHO_DB)
    con.execute("PRAGMA foreign_keys = ON")
    return con


def inicializar() -> None:
    """Cria as tabelas e, se o banco estiver vazio, carrega os dados iniciais."""
    esquema = (RAIZ / "db" / "esquema.sql").read_text(encoding="utf-8")
    with conectar() as con:
        con.executescript(esquema)
        for chave, valor in CONFIG_INICIAL.items():
            con.execute("INSERT OR IGNORE INTO config (chave, valor) VALUES (?, ?)", (chave, valor))
        ja_tem = con.execute("SELECT COUNT(*) FROM cenarios").fetchone()[0]
        if not ja_tem:
            for nome, taxa, descricao in CENARIOS_INICIAIS:
                cur = con.execute(
                    "INSERT INTO cenarios (nome, taxa_real, descricao) VALUES (?, ?, ?)",
                    (nome, taxa, descricao),
                )
                for fase in fases_do_cenario(nome):
                    con.execute(
                        "INSERT INTO fases (cenario_id, nome, idade_inicio, idade_fim,"
                        " renda_min, renda_max, aporte_mensal) VALUES (?, ?, ?, ?, ?, ?, ?)",
                        (cur.lastrowid, *fase),
                    )


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
        return pd.read_sql("SELECT * FROM lancamentos ORDER BY mes DESC, id DESC", con)


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
        return pd.read_sql("SELECT * FROM investimentos ORDER BY id", con)


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
        return pd.read_sql("SELECT * FROM cenarios ORDER BY id", con)


def atualizar_taxa_cenario(cenario_id: int, taxa_real: float) -> None:
    with conectar() as con:
        con.execute("UPDATE cenarios SET taxa_real = ? WHERE id = ?", (taxa_real, cenario_id))


def listar_fases(cenario_id: int) -> pd.DataFrame:
    with conectar() as con:
        return pd.read_sql(
            "SELECT nome, idade_inicio, idade_fim, renda_min, renda_max, aporte_mensal"
            " FROM fases WHERE cenario_id = ? ORDER BY idade_inicio",
            con,
            params=(cenario_id,),
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
