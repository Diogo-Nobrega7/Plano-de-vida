"""Tipos de investimento e simulação comparando juros e IR."""

import pandas as pd
import streamlit as st

from core.formato import brl, pct
from core.investimentos import (CATALOGO, CDI, CURVA_CDI, IPCA_12M, IPCA_LONGO_PRAZO, IR_ACOES,
                                IR_ISENTO, SELIC, simular_investimento, taxas_anuais, evolucao_mensal)

st.title("🏦 Investimentos")
st.caption(f"Foto do mercado em nov/2026: Selic {pct(SELIC)}, CDI {pct(CDI)}, IPCA 2026 (Focus) "
           f"{pct(IPCA_12M)}. Não é recomendação — é material de estudo. Confira as taxas antes de investir.")

aba_tipos, aba_sim, aba_ordem = st.tabs(["Tipos de investimento", "Simulador comparativo", "Por onde começar"])

NOME_IR = {"regressivo": "22,5% → 15% (quanto mais tempo, menos IR)", IR_ISENTO: "Isento",
           IR_ACOES: "15% sobre o lucro"}

with aba_tipos:
    tabela = pd.DataFrame([{
        "Investimento": i.nome, "Categoria": i.categoria,
        "Rende hoje (a.a.)": pct(i.taxa_anual), "IR": NOME_IR[i.ir], "Risco": i.risco,
        "Liquidez": i.liquidez, "Garantia": i.garantia, "Serve para": i.para_que,
    } for i in CATALOGO])
    st.dataframe(tabela, hide_index=True)
    for i in CATALOGO:
        with st.expander(i.nome):
            st.markdown(f"**Serve para:** {i.para_que}\n\n**Atenção:** {i.observacao}\n\n"
                        f"**Risco:** {i.risco} · **Liquidez:** {i.liquidez} · **Garantia:** {i.garantia}")
    st.info("**FGC** (Fundo Garantidor de Créditos) devolve até R$ 250 mil por CPF por banco se o banco "
            "quebrar (limite total de R$ 1 milhão a cada 4 anos). Tesouro Direto é garantido pelo governo.")

with aba_sim:
    c1, c2, c3, c4 = st.columns(4)
    inicial = c1.number_input("Valor inicial (R$)", 0.0, value=1000.0, step=500.0)
    aporte = c2.number_input("Aporte mensal (R$)", 0.0, value=500.0, step=100.0)
    anos = c3.slider("Prazo (anos)", 1, 40, 10)
    inflacao = c4.number_input("Inflação média (% a.a.)", 0.0, 20.0, IPCA_LONGO_PRAZO * 100, 0.25) / 100
    juros_caem = st.toggle("Pós-fixados seguem a queda de juros prevista (Focus)", value=True,
                           help="CDI médio por ano: " + " → ".join(pct(c) for c in CURVA_CDI) +
                                ". Desligado: o CDI de hoje fica igual o prazo todo.")

    escolhidos = st.multiselect("Comparar", [i.nome for i in CATALOGO],
                                default=["Tesouro Selic", "LCI/LCA 92% CDI", "Tesouro IPCA+ (longo)",
                                         "Ações / ETF de Ibovespa (BOVA11)", "Poupança"])
    with st.expander("Editar taxas usadas (opcional)"):
        taxas_custom = {}
        for nome in escolhidos:
            inv = next(i for i in CATALOGO if i.nome == nome)
            if inv.pct_cdi is not None:
                taxas_custom[nome] = ("cdi", st.number_input(f"{nome} — % do CDI", 0.0, 200.0,
                                                             inv.pct_cdi * 100, 1.0) / 100)
            else:
                taxas_custom[nome] = ("fixa", st.number_input(f"{nome} — % ao ano", 0.0, 50.0,
                                                              round(inv.taxa_anual * 100, 2), 0.25) / 100)

    meses = anos * 12
    linhas, grafico = [], {}
    for nome in escolhidos:
        inv = next(i for i in CATALOGO if i.nome == nome)
        modo, valor = taxas_custom.get(nome, (None, None))
        if modo == "cdi":
            inv = type(inv)(**{**inv.__dict__, "pct_cdi": valor, "taxa_anual": valor * CDI})
        elif modo == "fixa":
            inv = type(inv)(**{**inv.__dict__, "taxa_anual": valor})
        taxas = taxas_anuais(inv, anos, juros_caem)
        r = simular_investimento(inicial, aporte, taxas, meses, inv.ir, inflacao)
        linhas.append({"Investimento": nome, "Total investido": r["investido"], "Saldo bruto": r["bruto"],
                       "IR no resgate": r["imposto"], "Saldo líquido": r["liquido"],
                       "Líquido em R$ de hoje": r["liquido_real"], "Ganho líquido": r["ganho_liquido"]})
        grafico[nome] = evolucao_mensal(inicial, aporte, taxas, meses)[::12]

    if linhas:
        res = pd.DataFrame(linhas).sort_values("Saldo líquido", ascending=False)
        melhor = res.iloc[0]
        st.success(f"Em {anos} anos, o melhor resultado líquido foi **{melhor['Investimento']}**: "
                   f"{brl(melhor['Saldo líquido'])} (≈ {brl(melhor['Líquido em R$ de hoje'])} em poder de compra de hoje).")
        moeda = st.column_config.NumberColumn(format="R$ %.0f")
        st.dataframe(res, hide_index=True, column_config={c: moeda for c in res.columns[1:]})
        df_g = pd.DataFrame(grafico)
        df_g.index.name = "Ano"
        st.subheader("Saldo bruto ano a ano")
        st.line_chart(df_g, x_label="Ano", y_label="R$")
        st.caption("O IR é descontado só no resgate (tabela regressiva aplicada a cada aporte pela idade dele). "
                   "Renda variável usa uma média: na prática oscila muito, ano a ano.")

with aba_ordem:
    st.markdown("""
### Uma ordem sensata para começar
1. **Reserva de emergência** — 6 meses de gastos em **Tesouro Selic** ou **CDB de liquidez diária ≥ 100% CDI**.
   Para um estudante, comece com qualquer valor: o hábito vale mais que o montante.
2. **Objetivos de 1 a 5 anos** (faculdade, carro, intercâmbio) — **LCI/LCA** ou **CDB** com vencimento perto da data,
   ou **Tesouro Prefixado** com vencimento na data do objetivo.
3. **Longo prazo / liberdade financeira** — **Tesouro IPCA+** como base (protege da inflação) e uma parte menor em
   **ações (ETF)** e **FIIs**, aumentando conforme você aprende e tolera oscilação.
4. **Diversifique por emissor** e respeite o limite do FGC.

### Para quem tem menos de 18 anos
- A conta na corretora precisa ser aberta **com os pais/responsáveis** (conta de menor).
- Tesouro Direto e CDB podem ser comprados com poucos reais (Tesouro a partir de ~R$ 30).

### Impostos que mudaram (Lei 15.270/2025)
- A partir de 2026, **dividendos acima de R$ 50 mil/mês da mesma empresa** têm retenção de 10% na fonte, e há um
  imposto mínimo para quem ganha mais de R$ 600 mil/ano. Isso importa no futuro, quando a clínica distribuir lucros.

### Armadilhas comuns
- Comparar pela porcentagem do CDI sem olhar IR (LCI 92% ≈ CDB ~110% em prazos curtos).
- Vender Tesouro Prefixado/IPCA+ antes do vencimento em momento de alta de juros (pode dar prejuízo).
- Produtos com taxa de administração alta, previdência cara, "dicas" de redes sociais e promessas de retorno garantido.
""")
