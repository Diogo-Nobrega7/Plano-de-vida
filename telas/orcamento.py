"""Estimativa de gastos da família por tópico."""

import pandas as pd
import streamlit as st

from core.formato import brl
from core.impostos import salario_liquido
from core.orcamento import PERFIS, estimar, regra_50_30_20

st.title("🛒 Orçamento familiar")
st.caption("Estimativas com base na POF/IBGE (como as famílias brasileiras dividem os gastos). "
           "Ajuste para a realidade da sua casa.")

c1, c2 = st.columns(2)
modo = c1.radio("Partir de", ["Renda líquida da família", "Salário bruto (CLT)"], horizontal=True)
if modo == "Salário bruto (CLT)":
    bruto = c2.number_input("Salário bruto (R$)", 0.0, value=15_000.0, step=1000.0)
    renda = salario_liquido(bruto)["liquido"]
    c2.caption(f"Líquido após INSS e IR: {brl(renda)}")
else:
    renda = c2.number_input("Renda líquida mensal (R$)", 0.0, value=10_000.0, step=1000.0)

c3, c4 = st.columns(2)
perfil = c3.selectbox("Perfil de gastos", list(PERFIS))
poupar = c4.slider("Quanto investir todo mês (% da renda)", 0, 60, 20)
gastos_total = renda * (1 - poupar / 100)

base = pd.DataFrame(estimar(gastos_total, perfil), columns=["Tópico", "%", "Estimativa (R$)"])
base["%"] = (base["%"] * 100).round(1)
st.subheader(f"Gastos estimados: {brl(gastos_total)} / mês · Investimento: {brl(renda - gastos_total)} / mês")
editado = st.data_editor(
    base, hide_index=True, num_rows="dynamic",
    column_config={"%": st.column_config.NumberColumn("% dos gastos", format="%.1f%%"),
                   "Estimativa (R$)": st.column_config.NumberColumn(format="R$ %.0f")},
    disabled=["%"], key=f"orc_{perfil}_{round(gastos_total)}",
)
st.caption("Você pode trocar a estimativa pelos valores reais da sua casa direto na tabela.")
total = float(editado["Estimativa (R$)"].fillna(0).sum())
sobra = renda - total
m1, m2, m3 = st.columns(3)
m1.metric("Renda líquida", brl(renda))
m2.metric("Total de gastos", brl(total))
m3.metric("Sobra para investir", brl(sobra), f"{sobra / renda:.0%} da renda" if renda else None)
st.bar_chart(editado.set_index("Tópico")["Estimativa (R$)"], horizontal=True, x_label="R$")

st.subheader("Regra 50/30/20")
cols = st.columns(3)
for col, (nome, valor) in zip(cols, regra_50_30_20(renda).items()):
    col.metric(nome, brl(valor))
st.caption("Necessidades: moradia, contas, feira, transporte, saúde, educação. "
           "Desejos: lazer, viagens, restaurante. Investir: o que constrói a liberdade financeira.")
