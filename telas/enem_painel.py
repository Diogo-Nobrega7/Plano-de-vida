"""Painel do ENEM: metas de nota, simulados e sessões de estudo."""

from datetime import date

import pandas as pd
import streamlit as st

from core.enem import AREAS_NOTA, grafico_linhas, distancia_meta, media_enem, minutos_por_semana, progresso_por
from db import banco, banco_enem as be

st.title("📊 Painel do ENEM")
dias = (date(2028, 11, 5) - date.today()).days
st.caption(f"ENEM previsto para novembro de 2028 — faltam cerca de **{dias} dias**.")

metas = be.metas_nota()
simulados = be.listar_simulados()
sessoes = be.listar_sessoes()
conteudos = be.listar_conteudos()

# --- resumo -----------------------------------------------------------------
c1, c2, c3, c4 = st.columns(4)
media_meta = sum(metas.values()) / len(metas)
ultima_media = media_enem(simulados.iloc[-1].to_dict()) if not simulados.empty else None
c1.metric("Meta (média)", f"{media_meta:.0f}")
c2.metric("Último simulado (média)", f"{ultima_media:.0f}" if ultima_media else "—",
          f"{ultima_media - media_meta:+.0f} da meta" if ultima_media else None)
c3.metric("Horas estudadas (total)", f"{sessoes['minutos'].sum() / 60:.1f} h" if not sessoes.empty else "0 h")
dominados = int(conteudos["status"].isin(["revisado", "dominado"]).sum())
c4.metric("Conteúdos revisados/dominados", f"{dominados} de {len(conteudos)}")

prog = progresso_por(conteudos, "area")
st.dataframe(prog, hide_index=True, column_config={
    "area": "Área", "progresso": st.column_config.ProgressColumn("Progresso no checklist", format="percent",
                                                                 min_value=0, max_value=1)})

aba_sim, aba_ses, aba_meta = st.tabs(["Simulados", "Sessões de estudo", "Metas de nota"])

with aba_sim:
    with st.form("simulado", clear_on_submit=True):
        st.subheader("Registrar simulado")
        c1, c2 = st.columns(2)
        data = c1.date_input("Data", value=date.today(), format="DD/MM/YYYY")
        nome = c2.text_input("Nome", placeholder="Ex.: ENEM 2024 (prova antiga), Simulado do cursinho")
        cols = st.columns(5)
        notas = {k: cols[i].number_input(nome_area, 0.0, 1000.0, value=None, step=10.0, placeholder="—")
                 for i, (k, nome_area) in enumerate(AREAS_NOTA.items())}
        st.caption("Pode deixar áreas em branco se o simulado não teve todas.")
        if st.form_submit_button("Salvar simulado", type="primary"):
            if not nome.strip():
                st.error("Dê um nome ao simulado.")
            else:
                be.adicionar_simulado(data.isoformat(), nome, notas)
                st.rerun()

    if simulados.empty:
        st.info("Nenhum simulado ainda. Dica: faça provas antigas do ENEM (estão no site do Inep) com tempo cronometrado.")
    else:
        grafico = simulados.set_index("data")[list(AREAS_NOTA)].rename(columns=AREAS_NOTA)
        st.subheader("Evolução das notas")
        st.altair_chart(grafico_linhas(grafico, "Nota"), width="stretch")
        st.subheader("Distância até a meta (último simulado)")
        st.dataframe(distancia_meta(simulados.iloc[-1].to_dict(), metas), hide_index=True)
        tabela = simulados.rename(columns={**AREAS_NOTA, "data": "Data", "nome": "Simulado"})
        st.dataframe(tabela.drop(columns="id"), hide_index=True)
        apagar = st.selectbox("Apagar simulado", [None] + simulados["id"].tolist(),
                              format_func=lambda i: "—" if i is None else
                              f"{simulados.set_index('id').loc[i, 'data']} · {simulados.set_index('id').loc[i, 'nome']}")
        if apagar and st.button("Apagar"):
            be.apagar_simulado(int(apagar))
            st.rerun()

with aba_ses:
    materias = be.nome_materias()
    with st.form("sessao", clear_on_submit=True):
        st.subheader("Registrar sessão de estudo")
        c1, c2, c3 = st.columns([1, 2, 1])
        data = c1.date_input("Data", value=date.today(), format="DD/MM/YYYY")
        materia = c2.selectbox("Matéria", list(materias), format_func=materias.get)
        minutos = c3.number_input("Minutos", 5, 600, 50, step=5)
        obs = st.text_input("Observações", placeholder="O que estudou, dificuldades, exercícios feitos...")
        if st.form_submit_button("Salvar sessão", type="primary"):
            be.adicionar_sessao(data.isoformat(), materia, int(minutos), obs)
            st.rerun()
    if not sessoes.empty:
        st.subheader("Horas por semana")
        st.bar_chart(minutos_por_semana(sessoes), y_label="Horas")
        st.subheader("Horas por matéria")
        st.bar_chart(sessoes.groupby("materia")["minutos"].sum().div(60).sort_values(), horizontal=True,
                     x_label="Horas")
        tabela = sessoes.assign(apagar=False)
        editada = st.data_editor(tabela[["id", "data", "area", "materia", "minutos", "observacoes", "apagar"]],
                                 hide_index=True, disabled=["id", "data", "area", "materia", "minutos", "observacoes"],
                                 column_config={"id": None, "data": "Data", "area": "Área", "materia": "Matéria",
                                                "minutos": "Minutos", "observacoes": "Observações",
                                                "apagar": st.column_config.CheckboxColumn("Apagar?")})
        marcados = editada.loc[editada["apagar"], "id"].tolist()
        if marcados and st.button(f"Apagar {len(marcados)} sessão(ões)"):
            be.apagar_sessoes(marcados)
            st.rerun()

with aba_meta:
    st.caption("Metas iniciais ≈ média 800, faixa competitiva para Medicina em muitas federais. "
               "Confira as notas de corte do SISU do curso e da universidade que você quer e ajuste aqui.")
    cols = st.columns(5)
    novas = {k: cols[i].number_input(nome_area, 0, 1000, int(metas[k]), step=10, key=f"meta_{k}")
             for i, (k, nome_area) in enumerate(AREAS_NOTA.items())}
    st.write(f"Média da meta: **{sum(novas.values()) / 5:.0f}**")
    if st.button("Salvar metas", type="primary"):
        for k, v in novas.items():
            banco.salvar_config(f"meta_{k}", v)
        st.success("Metas salvas!")
        st.rerun()
