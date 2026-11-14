"""Junta o banco de dados com os cálculos. As telas usam estas funções."""

from __future__ import annotations

import pandas as pd

from core.calculos import Fase, idade_que_atinge, patrimonio_necessario, simular_patrimonio
from db import banco


def parametros() -> dict:
    """Configurações gerais já convertidas para número."""
    c = banco.ler_config()
    return {
        "nome": c.get("nome", ""),
        "idade_atual": float(c["idade_atual"]),
        "inflacao_anual": float(c["inflacao_anual"]),
        "taxa_saque": float(c["taxa_saque"]),
        "renda_desejada": float(c["renda_desejada"]),
    }


def meta_liberdade(p: dict | None = None) -> float:
    p = p or parametros()
    return patrimonio_necessario(p["renda_desejada"], p["taxa_saque"])


def simular_cenarios(patrimonio_inicial: float, idade_final: int = 70) -> pd.DataFrame:
    """Simula todos os cenários. Devolve uma tabela com uma linha por cenário:
    nome, descrição, taxa e a série (lista de (idade, patrimônio))."""
    p = parametros()
    linhas = []
    for _, c in banco.listar_cenarios().iterrows():
        fases_df = banco.listar_fases(int(c["id"]))
        fases = [
            Fase(f.idade_inicio, f.idade_fim, f.aporte_mensal)
            for f in fases_df.itertuples()
        ]
        serie = simular_patrimonio(
            fases, c["taxa_real"], p["idade_atual"], patrimonio_inicial, idade_final
        )
        linhas.append(
            {
                "id": int(c["id"]),
                "nome": c["nome"],
                "descricao": c["descricao"],
                "taxa_real": c["taxa_real"],
                "serie": serie,
                "idade_meta": idade_que_atinge(serie, meta_liberdade(p)),
            }
        )
    return pd.DataFrame(linhas)
