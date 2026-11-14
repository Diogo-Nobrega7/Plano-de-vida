"""Ponto de entrada do app. Rode com:  streamlit run app.py

Este arquivo só monta o menu lateral. Cada tela fica em telas/.
"""

import hmac
import os

import streamlit as st

st.set_page_config(page_title="Plano de Vida", page_icon="🧭", layout="wide")


def segredo(nome: str) -> str | None:
    """Lê um segredo do Streamlit Cloud (Settings → Secrets) ou de uma variável de ambiente."""
    try:
        if nome in st.secrets:
            return str(st.secrets[nome])
    except Exception:  # sem arquivo de segredos (rodando no computador)
        pass
    return os.environ.get(nome)


# Versão online: o endereço do banco (Supabase) vem dos segredos.
if segredo("DATABASE_URL"):
    os.environ["DATABASE_URL"] = segredo("DATABASE_URL")

# Login: só pede senha se APP_PASSWORD estiver configurada (na versão online).
senha_certa = segredo("APP_PASSWORD")
if senha_certa and not st.session_state.get("logado"):
    st.title("🧭 Plano de Vida")
    with st.form("login"):
        senha = st.text_input("Senha", type="password")
        if st.form_submit_button("Entrar", type="primary"):
            if hmac.compare_digest(senha.encode(), senha_certa.encode()):
                st.session_state["logado"] = True
                st.rerun()
            st.error("Senha incorreta.")
    st.stop()

from db import banco  # noqa: E402  (depois de configurar o DATABASE_URL)


@st.cache_resource
def preparar_banco(destino: str, versao: str = "") -> bool:
    """Cria as tabelas e carrega os dados iniciais — uma vez para cada banco.
    `destino` faz o cache valer por banco: se o DATABASE_URL mudar, roda de novo."""
    banco.inicializar()
    return True


def versao_do_esquema() -> str:
    """Muda sempre que o esquema ou os dados iniciais mudam (ex.: um módulo novo),
    para as tabelas novas serem criadas logo após uma atualização do código."""
    import hashlib
    from pathlib import Path

    pasta = Path(__file__).parent / "db"
    conteudo = b"".join((pasta / n).read_bytes() for n in sorted(["esquema.sql", "dados_iniciais.py", "dados_enem.py"]))
    return hashlib.sha256(conteudo).hexdigest()[:12]


preparar_banco(os.environ.get("DATABASE_URL") or str(banco.CAMINHO_DB), versao_do_esquema())

if senha_certa and st.sidebar.button("Sair"):
    st.session_state["logado"] = False
    st.rerun()

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
