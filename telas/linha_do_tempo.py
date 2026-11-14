"""Linha do tempo da vida: fases por idade e ano, com premissas editáveis."""

import altair as alt
import pandas as pd
import streamlit as st

from core.carreira import ano_da_idade
from core.formato import brl_curto
from core.servicos import parametros
from db import banco

st.title("🗺️ Linha do tempo")
p = parametros()

cenarios = banco.listar_cenarios()
nomes = cenarios["nome"].tolist()
escolhido = st.radio("Cenário", nomes, index=nomes.index("Moderado") if "Moderado" in nomes else 0,
                     horizontal=True)
cenario_id = int(cenarios.loc[cenarios["nome"] == escolhido, "id"].iloc[0])
fases = banco.listar_fases(cenario_id)

# Colunas calculadas: ano de início/fim e texto da renda.
vis = fases.copy()
vis["ano_inicio"] = vis["idade_inicio"].map(lambda i: ano_da_idade(i, p["idade_atual"]))
vis["ano_fim"] = vis["idade_fim"].map(lambda i: ano_da_idade(i, p["idade_atual"]))
vis["renda"] = vis.apply(lambda l: f"{brl_curto(l.renda_min)} – {brl_curto(l.renda_max)}", axis=1)
vis["aporte"] = vis["aporte_mensal"].map(brl_curto)

barras = alt.Chart(vis).mark_bar(cornerRadius=4, clip=True).encode(
    x=alt.X("idade_inicio:Q", title="Idade", scale=alt.Scale(domain=[p["idade_atual"], 70])),
    x2="idade_fim:Q",
    y=alt.Y("nome:N", sort=None, title=None),
    color=alt.Color("nome:N", legend=None),
    tooltip=[alt.Tooltip("nome:N", title="Fase"), alt.Tooltip("ano_inicio:Q", title="De"),
             alt.Tooltip("ano_fim:Q", title="Até"), alt.Tooltip("renda:N", title="Renda mensal"),
             alt.Tooltip("aporte:N", title="Aporte mensal")],
)
hoje = alt.Chart(pd.DataFrame({"x": [p["idade_atual"]]})).mark_rule(color="red", strokeDash=[4, 4]).encode(x="x:Q")
st.altair_chart(barras + hoje, width="stretch")

st.dataframe(
    vis[["nome", "idade_inicio", "idade_fim", "ano_inicio", "ano_fim", "renda", "aporte"]],
    hide_index=True,
    column_config={"nome": "Fase", "idade_inicio": "De (idade)", "idade_fim": "Até (idade)",
                   "ano_inicio": st.column_config.NumberColumn("De (ano)", format="%d"),
                   "ano_fim": st.column_config.NumberColumn("Até (ano)", format="%d"),
                   "renda": "Renda mensal esperada", "aporte": "Aporte mensal"},
)
st.caption("Valores em reais de hoje. Para editar as fases, rendas e aportes, use a tela "
           "**Liberdade financeira** (mesmos dados) — assim a simulação e a linha do tempo ficam sempre iguais.")

st.subheader("Riscos e imprevistos para revisar todo ano")
st.markdown("""
- Reprovação ou mais de uma tentativa no vestibular (atrasa tudo em 1 ano ou mais).
- Faculdade particular: pode custar centenas de milhares de reais.
- Gargalo na residência e concorrência crescente (médicos: 636 mil em 2025, projeção de 1,15 milhão em 2035).
- Mudança de especialidade, doença na família, crise econômica.
""")
