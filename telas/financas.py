"""Tela de Finanças: lançamentos do mês, investimentos e conceitos."""

from datetime import date

import pandas as pd
import streamlit as st

from core.formato import brl
from db import banco

st.title("💰 Finanças")

aba_mes, aba_inv, aba_conceitos = st.tabs(["Lançamentos do mês", "Investimentos", "Conceitos"])

# ----------------------------------------------------------------------------
# Lançamentos
# ----------------------------------------------------------------------------
with aba_mes:
    with st.form("novo_lancamento", clear_on_submit=True):
        st.subheader("Novo lançamento")
        c1, c2, c3 = st.columns(3)
        mes = c1.text_input("Mês (AAAA-MM)", value=date.today().strftime("%Y-%m"))
        tipo = c2.selectbox("Tipo", ["receita", "despesa", "aporte"],
                            help="Aporte = dinheiro que você colocou nos investimentos.")
        valor = c3.number_input("Valor (R$)", min_value=0.0, step=10.0, format="%.2f")
        sugestoes = ", ".join(banco.categorias_usadas()) or "Mesada, Lazer, Transporte, Estudos..."
        categoria = st.text_input("Categoria", placeholder=sugestoes)
        descricao = st.text_input("Descrição (opcional)")
        if st.form_submit_button("Adicionar", type="primary"):
            if len(mes) != 7 or mes[4] != "-":
                st.error("Use o formato AAAA-MM, por exemplo 2026-11.")
            elif not categoria.strip() or valor <= 0:
                st.error("Preencha a categoria e um valor maior que zero.")
            else:
                banco.adicionar_lancamento(mes, tipo, categoria, descricao, valor)
                st.success("Lançamento salvo!")

    df = banco.listar_lancamentos()
    if df.empty:
        st.info("Nenhum lançamento ainda. Comece adicionando sua mesada ou um gasto.")
    else:
        st.subheader("Resumo por mês")
        resumo = df.pivot_table(index="mes", columns="tipo", values="valor",
                                aggfunc="sum", fill_value=0)
        for t in ["receita", "despesa", "aporte"]:
            if t not in resumo:
                resumo[t] = 0.0
        resumo["sobra"] = resumo["receita"] - resumo["despesa"] - resumo["aporte"]
        resumo = resumo[["receita", "despesa", "aporte", "sobra"]].sort_index(ascending=False)
        resumo.index.name = "Mês"
        st.dataframe(
            resumo.rename(columns=str.capitalize),
            column_config={c: st.column_config.NumberColumn(format="R$ %.2f")
                           for c in ["Receita", "Despesa", "Aporte", "Sobra"]},
        )
        st.caption("Sobra = receitas − despesas − aportes. Se ficar negativa, você gastou mais do que entrou.")

        mes_escolhido = st.selectbox("Ver gastos por categoria do mês", resumo.index)
        do_mes = df[(df["mes"] == mes_escolhido) & (df["tipo"] == "despesa")]
        if not do_mes.empty:
            st.bar_chart(do_mes.groupby("categoria")["valor"].sum(), y_label="R$")

        st.subheader("Todos os lançamentos")
        tabela = df.assign(apagar=False)
        editada = st.data_editor(
            tabela,
            hide_index=True,
            disabled=["id", "mes", "tipo", "categoria", "descricao", "valor"],
            column_config={"id": None, "mes": "Mês", "tipo": "Tipo", "categoria": "Categoria",
                           "descricao": "Descrição",
                           "valor": st.column_config.NumberColumn("Valor", format="R$ %.2f"),
                           "apagar": st.column_config.CheckboxColumn("Apagar?")},
        )
        marcados = editada.loc[editada["apagar"], "id"].tolist()
        if marcados and st.button(f"Apagar {len(marcados)} lançamento(s)"):
            banco.apagar_lancamentos(marcados)
            st.rerun()

# ----------------------------------------------------------------------------
# Investimentos
# ----------------------------------------------------------------------------
with aba_inv:
    st.subheader("Meus investimentos")
    st.caption("Edite direto na tabela. Use a última linha para adicionar; "
               "selecione uma linha e aperte Delete para remover. Depois clique em Salvar.")
    inv = banco.listar_investimentos().drop(columns="id")
    inv["atualizado_em"] = pd.to_datetime(inv["atualizado_em"]).dt.date
    editado = st.data_editor(
        inv,
        num_rows="dynamic",
        hide_index=True,
        column_config={
            "nome": st.column_config.TextColumn("Nome", required=True),
            "tipo": st.column_config.SelectboxColumn(
                "Tipo", options=["Tesouro Direto", "CDB", "Poupança", "Fundo", "Ações",
                                 "FII", "Previdência", "Outro"], default="Outro"),
            "valor_aplicado": st.column_config.NumberColumn("Valor aplicado", format="R$ %.2f", min_value=0),
            "saldo_atual": st.column_config.NumberColumn("Saldo atual", format="R$ %.2f", min_value=0),
            "atualizado_em": st.column_config.DateColumn("Atualizado em", format="DD/MM/YYYY"),
        },
    )
    if st.button("Salvar investimentos", type="primary"):
        editado["atualizado_em"] = editado["atualizado_em"].astype(str).replace({"None": None, "NaT": None})
        banco.salvar_investimentos(editado)
        st.success("Investimentos salvos!")
        st.rerun()

    aplicado = float(inv["valor_aplicado"].sum())
    saldo = float(inv["saldo_atual"].sum())
    c1, c2, c3 = st.columns(3)
    c1.metric("Total aplicado", brl(aplicado))
    c2.metric("Patrimônio total", brl(saldo))
    c3.metric("Rendimento acumulado", brl(saldo - aplicado),
              f"{(saldo / aplicado - 1):.1%}" if aplicado else None)

# ----------------------------------------------------------------------------
# Conceitos
# ----------------------------------------------------------------------------
with aba_conceitos:
    st.subheader("Quatro números que não são a mesma coisa")
    st.markdown(
        """
| Conceito | O que é | Exemplo numa clínica |
|---|---|---|
| **Faturamento** | Tudo o que entra, antes de qualquer custo | R$ 200 mil em consultas no mês |
| **Lucro** | Faturamento − custos − salários − impostos da empresa | R$ 200 mil − R$ 120 mil − R$ 20 mil = R$ 60 mil |
| **Renda pessoal** | O que sobra para **você** depois de impostos (pró-labore, dividendos, salário) | Parte do lucro que vai para sua conta |
| **Patrimônio** | Tudo o que você possui menos dívidas | Investimentos + imóveis + participação na clínica − financiamentos |
"""
    )
    st.info("Renda alta e liberdade financeira são metas diferentes: a primeira depende do "
            "seu trabalho; a segunda, do patrimônio que você acumula.")

    st.subheader("Calculadora rápida")
    c1, c2, c3 = st.columns(3)
    fat = c1.number_input("Faturamento mensal", value=200_000.0, step=10_000.0)
    custos = c2.number_input("Custos + salários", value=120_000.0, step=10_000.0)
    imp = c3.number_input("Impostos da empresa", value=20_000.0, step=1_000.0)
    lucro = fat - custos - imp
    st.metric("Lucro da empresa", brl(lucro), f"margem de {lucro / fat:.0%}" if fat else None)
