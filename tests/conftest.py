"""Se DATABASE_URL estiver definido, os testes rodam no Postgres (zerando o banco antes de cada teste)."""

import os

import pytest


@pytest.fixture(autouse=True)
def banco_limpo():
    if os.environ.get("DATABASE_URL"):
        from db.conexao import conectar
        with conectar(None) as con:
            con.execute("DROP SCHEMA public CASCADE")
            con.execute("CREATE SCHEMA public")
    yield
