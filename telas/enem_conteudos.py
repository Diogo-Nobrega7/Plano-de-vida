"""Checklist de conteúdos do ENEM, separado por área e matéria."""

import pandas as pd
import streamlit as st

from core.enem import progresso
from db import banco_enem as be

st.title("✅ Conteúdos do ENEM")
st.caption("Marque o status de cada conteúdo. **Frequência** = o quanto costuma cair (levantamentos das provas "
           "2016-2025): comece pelos de frequência **Alta**. Você pode adicionar ou renomear conteúdos.")

conteudos = be.listar_conteudos()
materias = be.listar_materias()

c1, c2 = st.columns([2, 1])
so_alta = c1.toggle("Mostrar só frequência Alta")
pendentes = c2.toggle("Esconder dominados")

abas = st.tabs(be.AREAS)
for aba, area in zip(abas, be.AREAS):
    with aba:
        da_area = conteudos[conteudos["area"] == area]
        st.progress(progresso(da_area["status"]), text=f"{area}: {progresso(da_area['status']):.0%}")
        for m in materias[materias["area"] == area].itertuples():
            dados = da_area[da_area["materia_id"] == m.id]
            with st.expander(f"{m.nome} — {progresso(dados['status']):.0%}"):
                filtrar = so_alta or pendentes
                vis = dados
                if so_alta:
                    vis = vis[vis["frequencia"] == "Alta"]
                if pendentes:
                    vis = vis[vis["status"] != "dominado"]
                tabela = vis[["id", "nome", "frequencia", "status", "revisado_em"]]
                editada = st.data_editor(
                    tabela, hide_index=True, key=f"cont_{m.id}",
                    num_rows="fixed" if filtrar else "dynamic",
                    disabled=["revisado_em"],
                    column_config={
                        "id": None,
                        "nome": st.column_config.TextColumn("Conteúdo", required=True, width="large"),
                        "frequencia": st.column_config.SelectboxColumn("Frequência", options=["Alta", "Média", "Baixa"],
                                                                       default="Média"),
                        "status": st.column_config.SelectboxColumn("Status", options=be.STATUS,
                                                                   default="não estudado"),
                        "revisado_em": "Última revisão",
                    },
                )
                if st.button("Salvar", key=f"salvar_{m.id}", type="primary"):
                    if filtrar:  # junta as linhas filtradas editadas com as que estavam escondidas
                        escondidas = dados[~dados["id"].isin(vis["id"])][tabela.columns]
                        editada = pd.concat([editada, escondidas])
                    be.salvar_conteudos(m.id, editada)
                    st.rerun()
