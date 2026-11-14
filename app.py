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
        "Módulo 2 — Vida e carreira": [
            st.Page("telas/linha_do_tempo.py", title="Linha do tempo", icon="🗺️"),
            st.Page("telas/metas.py", title="Metas", icon="🎯"),
            st.Page("telas/comparador.py", title="Comparador de carreiras", icon="⚖️"),
            st.Page("telas/decisoes.py", title="Diário de decisões", icon="📓"),
        ],
        "Módulo 3 — ENEM": [
            st.Page("telas/enem_painel.py", title="Painel do ENEM", icon="📊"),
            st.Page("telas/enem_conteudos.py", title="Conteúdos (checklist)", icon="✅"),
            st.Page("telas/enem_videos.py", title="Videoaulas", icon="🎬"),
            st.Page("telas/enem_redacao.py", title="Redação", icon="✍️"),
        ],
    }
)
menu.run()
