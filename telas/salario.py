"""Salário bruto x líquido (CLT) com INSS e IR de 2026."""

import pandas as pd
import streamlit as st

from core.formato import brl
from core.impostos import FAIXAS_INSS_2026, bruto_para_liquido_desejado, salario_liquido

st.title("🧾 Impostos no salário")
st.caption("Regras de 2026 para carteira assinada (CLT): INSS progressivo (teto R$ 8.475,55) e IR com a "
           "isenção até R$ 5 mil da Lei 15.270/2025.")

c1, c2, c3 = st.columns(3)
bruto = c1.number_input("Salário bruto mensal (R$)", 0.0, value=10_000.0, step=500.0)
dependentes = c2.number_input("Dependentes no IR", 0, 10, 0)
outros = c3.number_input("Outros descontos (plano de saúde, VT...)", 0.0, value=0.0, step=50.0)

r = salario_liquido(bruto, dependentes, outros)
m1, m2, m3, m4 = st.columns(4)
m1.metric("INSS", brl(r["inss"], 2))
m2.metric("Imposto de Renda", brl(r["ir"], 2))
m3.metric("Salário líquido", brl(r["liquido"], 2))
m4.metric("Alíquota efetiva (INSS+IR)", f"{r['aliquota_efetiva']:.1%}".replace(".", ","))

st.subheader("Quanto sobra em cada faixa de salário")
faixas = [1621, 3000, 5000, 7350, 10_000, 15_000, 20_000, 30_000, 50_000, 100_000]
tabela = pd.DataFrame([{**salario_liquido(s, dependentes)} for s in faixas])
tabela["aliquota_efetiva"] = tabela["aliquota_efetiva"].map(lambda x: f"{x:.1%}".replace(".", ","))
moeda = st.column_config.NumberColumn(format="R$ %.0f")
st.dataframe(tabela.drop(columns="outros"), hide_index=True, column_config={
    "bruto": st.column_config.NumberColumn("Bruto", format="R$ %.0f"),
    "inss": st.column_config.NumberColumn("INSS", format="R$ %.0f"),
    "ir": st.column_config.NumberColumn("IR", format="R$ %.0f"),
    "liquido": st.column_config.NumberColumn("Líquido", format="R$ %.0f"),
    "aliquota_efetiva": "Alíquota efetiva"})

st.subheader("Quanto preciso ganhar bruto?")
alvo = st.number_input("Líquido desejado por mês (R$)", 0.0, value=50_000.0, step=5_000.0)
st.write(f"Como CLT, para receber **{brl(alvo)}** líquidos é preciso ganhar cerca de "
         f"**{brl(bruto_para_liquido_desejado(alvo, dependentes))}** brutos.")

with st.expander("Como o cálculo funciona"):
    st.markdown("**INSS** é progressivo — cada pedaço do salário paga a alíquota da sua faixa:")
    ant = 0.0
    for lim, aliq in FAIXAS_INSS_2026:
        st.markdown(f"- de {brl(ant, 2)} até {brl(lim, 2)}: {aliq:.1%}".replace(".", ",", 1))
        ant = lim
    st.markdown("""
**IR**: base = bruto − (INSS + R$ 189,59 por dependente), ou bruto − R$ 607,20 (desconto simplificado), o que for
melhor. Aplica-se a tabela (0% até R$ 2.428,80; 7,5%; 15%; 22,5%; 27,5% acima de R$ 4.664,68) e depois o
**redutor da Lei 15.270**: quem ganha até R$ 5.000 fica isento; de R$ 5.000 a R$ 7.350 o desconto diminui aos poucos.

**Médicos** muitas vezes recebem como **PJ** (empresa própria) ou autônomos, com outros impostos (Simples Nacional,
Lucro Presumido, carnê-leão). Esse caso será tratado no módulo de empreendedorismo/clínica.
""")
