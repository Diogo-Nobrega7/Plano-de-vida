"""Cálculos do Módulo 2: pontuação de carreiras e datas da linha do tempo."""

from __future__ import annotations

from datetime import date

import pandas as pd


def pontuacao(notas: dict[str, float], pesos: dict[str, float]) -> float:
    """Média ponderada das notas (1 a 5). Critério com peso 0 é ignorado."""
    total_pesos = sum(p for c, p in pesos.items() if c in notas)
    if total_pesos == 0:
        return 0.0
    return sum(notas[c] * p for c, p in pesos.items() if c in notas) / total_pesos


def ranking(tabela: pd.DataFrame, pesos: dict[str, float]) -> pd.DataFrame:
    """Recebe a tabela de notas (uma linha por carreira) e devolve ordenada pela pontuação."""
    linhas = []
    for _, l in tabela.iterrows():
        notas = {c: float(l[c]) for c in pesos if c in l and pd.notna(l[c])}
        linhas.append({"Carreira": l["carreira"], "Pontuação": round(pontuacao(notas, pesos), 2)})
    return pd.DataFrame(linhas).sort_values("Pontuação", ascending=False).reset_index(drop=True)


def ano_da_idade(idade: float, idade_atual: float, ano_atual: int | None = None) -> int:
    """Em que ano você terá certa idade (aproximado)."""
    ano_atual = ano_atual or date.today().year
    return int(ano_atual + (idade - idade_atual))


def situacao_meta(prazo: str | None, status: str, hoje: date | None = None) -> str:
    """Classifica a meta: concluída, atrasada, vence em breve (30 dias) ou no prazo."""
    hoje = hoje or date.today()
    if status == "concluída":
        return "✅ concluída"
    if not prazo:
        return "sem prazo"
    dias = (date.fromisoformat(prazo) - hoje).days
    if dias < 0:
        return "🔴 atrasada"
    if dias <= 30:
        return "🟡 vence em breve"
    return "🟢 no prazo"
