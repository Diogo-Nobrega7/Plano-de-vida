"""Conexão com o banco de dados: SQLite (no computador) ou Postgres (Supabase, online).

- Sem configuração nenhuma, usa SQLite: o arquivo dados/plano.db.
- Com a variável DATABASE_URL (ou o segredo DATABASE_URL no Streamlit Cloud),
  usa o Postgres do Supabase. O resto do código não precisa saber qual é:
  todo acesso passa por esta classe `Conexao`.

As consultas são escritas com `?` (estilo SQLite); para o Postgres a classe
troca por `%s` automaticamente.
"""

from __future__ import annotations

import os
import re
import sqlite3
from pathlib import Path

import pandas as pd

RAIZ = Path(__file__).resolve().parent.parent


def url_postgres() -> str | None:
    return os.environ.get("DATABASE_URL") or None


def _python(valor):
    """Converte números do numpy/pandas (ex.: numpy.int64) e NaN para tipos comuns do Python."""
    if valor is None:
        return None
    if hasattr(valor, "item"):
        valor = valor.item()
    if isinstance(valor, float) and valor != valor:  # NaN
        return None
    return valor


def _params(params) -> tuple:
    return tuple(_python(v) for v in (params or ()))


class Conexao:
    """Embrulha sqlite3 ou psycopg com a mesma interface."""

    def __init__(self, bruta, postgres: bool):
        self.bruta = bruta
        self.postgres = postgres

    # --- tradução de SQL ---------------------------------------------------
    def _sql(self, sql: str) -> str:
        return sql.replace("?", "%s") if self.postgres else sql

    # --- operações -----------------------------------------------------------
    def execute(self, sql: str, params=()):
        if self.postgres:
            cur = self.bruta.cursor()
            cur.execute(self._sql(sql), _params(params))
            return cur
        return self.bruta.execute(sql, _params(params))

    def executemany(self, sql: str, linhas) -> None:
        linhas = [_params(l) for l in linhas]
        if not linhas:
            return
        if self.postgres:
            with self.bruta.cursor() as cur:
                cur.executemany(self._sql(sql), linhas)
        else:
            self.bruta.executemany(sql, linhas)

    def inserir(self, sql: str, params=()) -> int:
        """INSERT que devolve o id da nova linha."""
        if self.postgres:
            return self.execute(sql + " RETURNING id", params).fetchone()[0]
        return self.execute(sql, params).lastrowid

    def df(self, sql: str, params=()) -> pd.DataFrame:
        """Roda um SELECT e devolve uma tabela do pandas."""
        cur = self.execute(sql, params)
        colunas = [c[0] for c in cur.description]
        return pd.DataFrame(cur.fetchall(), columns=colunas)

    def executescript(self, script: str) -> None:
        if not self.postgres:
            self.bruta.executescript(script)
            return
        script = script.replace("INTEGER PRIMARY KEY AUTOINCREMENT", "SERIAL PRIMARY KEY")
        script = re.sub(r"\bREAL\b", "DOUBLE PRECISION", script)
        with self.bruta.cursor() as cur:
            cur.execute(script)
            # Segurança no Supabase: liga o RLS em todas as tabelas, sem políticas.
            # Assim a API pública do Supabase não lê nem grava nada; só o app
            # (que conecta como dono das tabelas) acessa os dados.
            cur.execute("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
            for (tabela,) in cur.fetchall():
                cur.execute(f'ALTER TABLE public."{tabela}" ENABLE ROW LEVEL SECURITY')

    # --- "with conectar() as con:" -------------------------------------------
    def __enter__(self):
        return self

    def __exit__(self, tipo, *_):
        if tipo is None:
            self.bruta.commit()
        else:
            self.bruta.rollback()
        if not self.postgres:
            self.bruta.close()


_pg = None  # conexão Postgres reaproveitada (abrir uma nova a cada consulta é lento)


def conectar(caminho_sqlite: Path) -> Conexao:
    global _pg
    url = url_postgres()
    if url:
        import psycopg  # só é necessário na versão online

        if _pg is None or _pg.closed or _pg.broken:
            _pg = psycopg.connect(url, prepare_threshold=None)  # sem "prepared statements": compatível com o pooler do Supabase
        return Conexao(_pg, postgres=True)
    caminho_sqlite.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(caminho_sqlite)
    con.execute("PRAGMA foreign_keys = ON")
    return Conexao(con, postgres=False)
