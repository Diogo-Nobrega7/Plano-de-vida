"""Diário de decisões: data, decisão, premissas e data para revisar."""

from datetime import date, timedelta

import streamlit as st

from db import banco

st.title("📓 Diário de decisões")
st.caption("Anote cada decisão importante com as premissas da época. Na revisão, compare com o que aconteceu: "
           "assim você aprende com os acertos e erros, em vez de só lembrar do resultado.")

decisoes = banco.listar_decisoes()
hoje = date.today().isoformat()
vencidas = decisoes[decisoes["revisar_em"].notna() & (decisoes["revisar_em"] <= hoje)]
if not vencidas.empty:
    st.warning(f"{len(vencidas)} decisão(ões) com revisão pendente.")

with st.form("nova_decisao", clear_on_submit=True):
    st.subheader("Nova decisão")
    c1, c2 = st.columns(2)
    data = c1.date_input("Data", value=date.today(), format="DD/MM/YYYY")
    revisar = c2.date_input("Revisar em", value=date.today() + timedelta(days=365), format="DD/MM/YYYY")
    decisao = st.text_area("Decisão", placeholder="Ex.: Vou focar em Medicina e prestar ENEM em 2028.")
    premissas = st.text_area("Premissas (no que você se baseou)",
                             placeholder="Ex.: conversei com 2 médicos; nota de corte X; renda esperada Y...")
    if st.form_submit_button("Registrar", type="primary"):
        if not decisao.strip():
            st.error("Escreva a decisão.")
        else:
            banco.adicionar_decisao(data.isoformat(), decisao, premissas, revisar.isoformat())
            st.success("Decisão registrada!")
            st.rerun()

st.subheader("Histórico")
for d in decisoes.itertuples():
    pendente = d.revisar_em is not None and d.revisar_em <= hoje
    titulo = f"{'⏰ ' if pendente else ''}{date.fromisoformat(d.data):%d/%m/%Y} — {d.decisao[:80]}"
    with st.expander(titulo, expanded=pendente):
        st.markdown(f"**Decisão:** {d.decisao}\n\n**Premissas:** {d.premissas or '—'}")
        if d.revisar_em:
            st.markdown(f"**Revisar em:** {date.fromisoformat(d.revisar_em):%d/%m/%Y}")
        if d.resultado:
            st.markdown(f"**Resultado da revisão:** {d.resultado}")
        with st.form(f"revisao_{d.id}"):
            resultado = st.text_area("O que aconteceu? As premissas se confirmaram?", value=d.resultado or "")
            nova = st.date_input("Próxima revisão", value=date.today() + timedelta(days=365), format="DD/MM/YYYY")
            if st.form_submit_button("Salvar revisão"):
                banco.registrar_revisao(d.id, resultado, nova.isoformat())
                st.rerun()
