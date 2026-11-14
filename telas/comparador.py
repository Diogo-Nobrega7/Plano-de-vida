"""Comparador de carreiras com notas de 1 a 5 e pesos editáveis."""

import altair as alt
import streamlit as st

from core.carreira import ranking
from db import banco

st.title("⚖️ Comparador de carreiras")
st.caption("Compare carreiras com a mesma régua. **Nota 5 = melhor para você** em todos os critérios "
           "(ex.: em *Horas por semana*, 5 = poucas horas). As notas iniciais são um palpite: revise, "
           "principalmente **Afinidade**, que só você pode dar — de preferência depois de conversar com "
           "profissionais de cada área.")

criterios = banco.listar_criterios()

st.subheader("1. Pesos — o quanto cada critério importa para você")
pesos = {}
cols = st.columns(4)
for i, c in enumerate(criterios.itertuples()):
    pesos[c.nome] = cols[i % 4].slider(c.nome, 0, 5, int(c.peso), help=c.descricao, key=f"peso_{c.id}")

st.subheader("2. Notas de cada carreira (1 a 5)")
notas = banco.tabela_notas()
config = {"carreira": st.column_config.TextColumn("Carreira", required=True, width="medium"),
          "observacoes": st.column_config.TextColumn("Observações", width="large")}
for c in criterios.itertuples():
    config[c.nome] = st.column_config.NumberColumn(c.nome, min_value=1, max_value=5, step=1,
                                                   default=3, help=c.descricao)
editada = st.data_editor(notas, num_rows="dynamic", hide_index=True, column_config=config, key="notas")
st.caption("Para adicionar uma carreira, use a última linha da tabela.")

if st.button("Salvar pesos e notas", type="primary"):
    banco.salvar_pesos(pesos)
    banco.salvar_notas(editada)
    st.success("Salvo!")
    st.rerun()

st.subheader("3. Resultado")
res = ranking(editada.dropna(subset=["carreira"]), pesos)
if not res.empty:
    grafico = alt.Chart(res).mark_bar(cornerRadius=4).encode(
        x=alt.X("Pontuação:Q", scale=alt.Scale(domain=[0, 5]), title="Pontuação (1 a 5)"),
        y=alt.Y("Carreira:N", sort="-x", title=None, axis=alt.Axis(labelLimit=300)),
        tooltip=["Carreira", "Pontuação"],
    )
    st.altair_chart(grafico, width="stretch")
    st.dataframe(res, hide_index=True)
    if len(res) > 1 and res.iloc[0]["Pontuação"] - res.iloc[1]["Pontuação"] < 0.3:
        st.warning("As duas primeiras estão muito próximas: a escolha depende mais de você testar a prática "
                   "(conversas, visitas, cursos curtos) do que da planilha.")
    st.info("A pontuação organiza o pensamento, mas não decide por você. Registre a conclusão no "
            "**Diário de decisões** com as premissas e uma data para revisar.")
