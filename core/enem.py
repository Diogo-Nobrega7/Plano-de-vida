"""Cálculos do Módulo 3: progresso no checklist, médias e metas de nota."""

from __future__ import annotations

import pandas as pd

PESO_STATUS = {"não estudado": 0.0, "estudando": 0.33, "revisado": 0.75, "dominado": 1.0}
AREAS_NOTA = {"lc": "Linguagens", "ch": "Humanas", "cn": "Natureza", "mt": "Matemática", "redacao": "Redação"}


def progresso(status: pd.Series) -> float:
    """Progresso de 0 a 1: dominado conta 100%, revisado 75%, estudando 33%."""
    if status.empty:
        return 0.0
    return float(status.map(PESO_STATUS).fillna(0).mean())


def progresso_por(conteudos: pd.DataFrame, coluna: str) -> pd.DataFrame:
    """Progresso agrupado por 'area' ou 'materia'."""
    return (conteudos.groupby(coluna, sort=False)["status"].apply(progresso)
            .rename("progresso").reset_index())


def media_enem(notas: dict[str, float | None]) -> float | None:
    """Média simples das 5 notas (o SISU de muitos cursos usa pesos diferentes)."""
    valores = [notas.get(k) for k in AREAS_NOTA]
    if any(v is None or pd.isna(v) for v in valores):
        return None
    return sum(valores) / len(valores)


def media_ponderada(notas: dict[str, float], pesos: dict[str, float]) -> float:
    total = sum(pesos.values())
    return sum(notas[k] * pesos[k] for k in pesos) / total if total else 0.0


def distancia_meta(ultimo: dict[str, float | None], metas: dict[str, float]) -> pd.DataFrame:
    """Quanto falta (ou sobra) para a meta em cada área."""
    linhas = []
    for k, nome in AREAS_NOTA.items():
        nota = ultimo.get(k)
        nota = None if nota is None or pd.isna(nota) else float(nota)
        linhas.append({"Área": nome, "Última nota": nota, "Meta": metas[k],
                       "Falta": None if nota is None else max(0.0, metas[k] - nota)})
    return pd.DataFrame(linhas)


def minutos_por_semana(sessoes: pd.DataFrame) -> pd.DataFrame:
    """Total de horas estudadas por semana e área."""
    if sessoes.empty:
        return pd.DataFrame()
    s = sessoes.assign(semana=pd.to_datetime(sessoes["data"]).dt.to_period("W").dt.start_time)
    return s.pivot_table(index="semana", columns="area", values="minutos", aggfunc="sum", fill_value=0) / 60


def grafico_linhas(df, titulo_y: str):
    """Gráfico de linhas com pontos (aparece mesmo com um único registro)."""
    import altair as alt
    longo = df.reset_index().melt(id_vars=df.index.name or "index", var_name="Série", value_name="Valor").dropna()
    x = df.index.name or "index"
    return alt.Chart(longo).mark_line(point=True).encode(
        x=alt.X(f"{x}:T", title=None), y=alt.Y("Valor:Q", title=titulo_y),
        color=alt.Color("Série:N", title=None), tooltip=[x, "Série", "Valor"])
