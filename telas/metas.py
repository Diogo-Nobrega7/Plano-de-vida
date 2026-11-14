"""Metas com prazo e status."""

import pandas as pd
import streamlit as st

from core.carreira import situacao_meta
from db import banco

st.title("🎯 Metas")

metas = banco.listar_metas()
metas["situacao"] = [situacao_meta(p, s) for p, s in zip(metas["prazo"], metas["status"])]
total = len(metas)
feitas = int((metas["status"] == "concluída").sum())

c1, c2, c3 = st.columns(3)
c1.metric("Metas", total)
c2.metric("Concluídas", feitas)
c3.metric("Atrasadas", int((metas["situacao"] == "🔴 atrasada").sum()))
if total:
    st.progress(feitas / total, text=f"{feitas / total:.0%} concluído")

areas = ["Carreira", "Estudos", "Finanças", "Família", "Saúde", "Pessoal"]
filtro = st.multiselect("Filtrar por área", areas)

tabela = metas.drop(columns="id")
tabela["prazo"] = pd.to_datetime(tabela["prazo"]).dt.date
if filtro:
    st.info("Com filtro ativo a tabela é só para leitura. Limpe o filtro para editar.")
    st.dataframe(tabela[tabela["area"].isin(filtro)], hide_index=True)
else:
    st.caption("Edite direto na tabela; use a última linha para adicionar. Depois clique em Salvar.")
    editada = st.data_editor(
        tabela, num_rows="dynamic", hide_index=True, disabled=["situacao"],
        column_order=["situacao", "titulo", "area", "prazo", "status", "notas"],
        column_config={
            "situacao": "Situação",
            "titulo": st.column_config.TextColumn("Meta", required=True, width="large"),
            "area": st.column_config.SelectboxColumn("Área", options=areas, default="Pessoal"),
            "prazo": st.column_config.DateColumn("Prazo", format="DD/MM/YYYY"),
            "status": st.column_config.SelectboxColumn(
                "Status", options=["não iniciada", "em andamento", "concluída"], default="não iniciada"),
            "notas": "Notas",
        },
    )
    if st.button("Salvar metas", type="primary"):
        banco.salvar_metas(editada)
        st.success("Metas salvas!")
        st.rerun()
