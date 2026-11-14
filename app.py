"""Ponto de entrada do app. Rode com:  streamlit run app.py

Este arquivo só monta o menu lateral. Cada tela fica em telas/.
"""

import streamlit as st

from db import banco

st.set_page_config(page_title="Plano de Vida", page_icon="🧭", layout="wide")

# Cria as tabelas e carrega os dados iniciais (só na primeira vez).
banco.inicializar()

menu = st.navigation(
    {
        "": [st.Page("telas/inicio.py", title="Início", icon="🏠", default=True)],
        "Módulo 1 — Finanças": [
            st.Page("telas/financas.py", title="Finanças", icon="💰"),
            st.Page("telas/simulador.py", title="Liberdade financeira", icon="📈"),
            st.Page("telas/investimentos.py", title="Investimentos", icon="🏦"),
            st.Page("telas/salario.py", title="Impostos no salário", icon="🧾"),
            st.Page("telas/orcamento.py", title="Orçamento familiar", icon="🛒"),
        ],
        # Módulos 2 (Carreira) e 3 (ENEM) entram aqui nas próximas etapas.
    }
)
menu.run()
