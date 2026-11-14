"""Tela inicial: um resumo rápido de onde você está."""

import pandas as pd
import streamlit as st

from core.formato import brl, brl_curto
from core.servicos import meta_liberdade, parametros, simular_cenarios
from db import banco

p = parametros()
patrimonio = banco.patrimonio_total()
meta = meta_liberdade(p)

st.title(f"Plano de Vida — {p['nome']}")
st.caption("Todos os valores estão em reais de hoje (já descontada a inflação).")

c1, c2, c3 = st.columns(3)
c1.metric("Patrimônio atual", brl(patrimonio))
c2.metric(
    "Meta de liberdade financeira",
    brl_curto(meta),
    help=f"{brl(p['renda_desejada'])}/mês × 12 ÷ {p['taxa_saque']:.0%} de saque ao ano",
)
c3.metric("Progresso", f"{patrimonio / meta:.2%}".replace(".", ",") if meta else "—")

st.subheader("Quando cada cenário chega à meta")
cenarios = simular_cenarios(patrimonio)
colunas = st.columns(len(cenarios))
for col, c in zip(colunas, cenarios.itertuples()):
    idade = f"{c.idade_meta:.0f} anos" if pd.notna(c.idade_meta) else "Não chega"
    col.metric(c.nome, idade, help="Idade em que o patrimônio chega à meta (simulação até os 70).")

st.info(
    "Próximos passos do plano: conversar com pelo menos 2 médicos, montar o plano de "
    "estudos do 2º ano e lançar aqui suas receitas, despesas e investimentos."
)
