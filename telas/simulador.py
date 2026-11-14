"""Simulador de liberdade financeira: cenários, gráfico e fases editáveis."""

import pandas as pd
import streamlit as st

from core.calculos import real_para_nominal
from core.formato import brl, brl_curto, pct
from core.servicos import meta_liberdade, parametros, simular_cenarios
from db import banco

st.title("📈 Simulador de liberdade financeira")

p = parametros()

# ----------------------------------------------------------------------------
# Premissas gerais
# ----------------------------------------------------------------------------
with st.expander("Premissas gerais", expanded=False):
    c1, c2, c3, c4 = st.columns(4)
    idade = c1.number_input("Sua idade hoje", 10, 80, int(p["idade_atual"]))
    renda = c2.number_input("Renda mensal desejada (R$ de hoje)", 0, 1_000_000,
                            int(p["renda_desejada"]), step=5_000)
    saque = c3.number_input("Taxa de saque ao ano (%)", 1.0, 10.0, p["taxa_saque"] * 100, 0.5,
                            help="Quanto do patrimônio você retira por ano para viver. 4% é o padrão.")
    inflacao = c4.number_input("Inflação ao ano (%)", 0.0, 20.0, p["inflacao_anual"] * 100, 0.5,
                               help="Usada só para mostrar os valores nominais.")
    if st.button("Salvar premissas"):
        banco.salvar_config("idade_atual", idade)
        banco.salvar_config("renda_desejada", renda)
        banco.salvar_config("taxa_saque", saque / 100)
        banco.salvar_config("inflacao_anual", inflacao / 100)
        st.rerun()

p = parametros()
meta = meta_liberdade(p)

c1, c2 = st.columns([3, 1])
patrimonio_inicial = c1.number_input(
    "Patrimônio inicial da simulação (R$)", min_value=0.0,
    value=float(banco.patrimonio_total()), step=1000.0,
    help="Começa com o total da aba Investimentos.")
nominal = c2.toggle("Ver em valores nominais",
                    help="Nominal = o número que vai aparecer no extrato no futuro, "
                         "incluindo a inflação. Real = em poder de compra de hoje.")

st.markdown(
    f"**Meta:** {brl(p['renda_desejada'])}/mês × 12 ÷ {pct(p['taxa_saque'])} = "
    f"**{brl(meta)}** em reais de hoje."
)

# ----------------------------------------------------------------------------
# Resultado dos cenários
# ----------------------------------------------------------------------------
cenarios = simular_cenarios(patrimonio_inicial)


def ajustar(valor: float, idade_ponto: float) -> float:
    """Converte para nominal se o botão estiver ligado."""
    if not nominal:
        return valor
    return real_para_nominal(valor, p["inflacao_anual"], idade_ponto - p["idade_atual"])


colunas = st.columns(len(cenarios))
for col, c in zip(colunas, cenarios.itertuples()):
    with col:
        st.subheader(c.nome)
        serie = dict(c.serie)
        if pd.notna(c.idade_meta):
            st.metric("Atinge a meta aos", f"{c.idade_meta:.0f} anos")
        else:
            st.metric("Atinge a meta aos", "Não chega", help="Não atinge a meta até os 70 anos.")
        for marco in (40, 55):
            if marco in serie:
                st.write(f"Aos {marco}: **{brl_curto(ajustar(serie[marco], marco))}**")
        st.caption(c.descricao)

# Gráfico: uma linha por cenário + a linha da meta.
grafico = pd.DataFrame(
    {c.nome: {idade_p: ajustar(v, idade_p) for idade_p, v in c.serie} for c in cenarios.itertuples()}
)
grafico["Meta"] = [ajustar(meta, i) for i in grafico.index]
grafico.index.name = "Idade"
st.subheader("Patrimônio por idade" + (" (nominal)" if nominal else " (reais de hoje)"))
# Cores: uma por cenário, e cinza para a linha da meta.
cores = ["#1f6fb4", "#2a9d5c", "#e8892b", "#d62728", "#7b5cc4"][: len(cenarios)] + ["#8a8a8a"]
st.line_chart(grafico, x_label="Idade", y_label="R$", color=cores)
if nominal:
    st.caption("No modo nominal a meta também cresce com a inflação, por isso a idade em que "
               "cada cenário cruza a meta é a mesma do modo real.")

# ----------------------------------------------------------------------------
# Fases editáveis
# ----------------------------------------------------------------------------
st.subheader("Fases da vida de cada cenário")
st.caption("Edite as idades, rendas e aportes. A fase vale do início até o fim (sem incluir o fim). "
           "Depois da última fase, o último aporte continua valendo.")

abas = st.tabs(cenarios["nome"].tolist())
for aba, c in zip(abas, cenarios.itertuples()):
    with aba:
        taxa = st.number_input("Rendimento acima da inflação (% ao ano)", 0.0, 15.0,
                               c.taxa_real * 100, 0.5, key=f"taxa_{c.id}")
        fases = st.data_editor(
            banco.listar_fases(c.id),
            num_rows="dynamic",
            hide_index=True,
            key=f"fases_{c.id}",
            column_config={
                "nome": st.column_config.TextColumn("Fase", required=True),
                "idade_inicio": st.column_config.NumberColumn("Idade início", min_value=0, required=True),
                "idade_fim": st.column_config.NumberColumn("Idade fim", min_value=0, required=True),
                "renda_min": st.column_config.NumberColumn("Renda mín. (R$)", format="R$ %d"),
                "renda_max": st.column_config.NumberColumn("Renda máx. (R$)", format="R$ %d"),
                "aporte_mensal": st.column_config.NumberColumn("Aporte mensal (R$)", format="R$ %d"),
            },
        )
        if st.button("Salvar cenário", key=f"salvar_{c.id}", type="primary"):
            invalidas = fases[fases["idade_fim"] <= fases["idade_inicio"]]
            if not invalidas.empty:
                st.error("Em toda fase a idade de fim precisa ser maior que a de início.")
            else:
                banco.salvar_fases(c.id, fases)
                banco.atualizar_taxa_cenario(c.id, taxa / 100)
                st.rerun()
