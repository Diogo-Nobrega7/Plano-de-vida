"""Videoaulas organizadas por matéria."""

import streamlit as st

from db import banco_enem as be

st.title("🎬 Videoaulas")
st.caption("Guarde links de videoaulas (YouTube ou outro site) separados por matéria e marque o que já assistiu.")

materias = be.nome_materias()
conteudos = be.listar_conteudos()

with st.expander("➕ Adicionar videoaula", expanded=False):
    materia = st.selectbox("Matéria", list(materias), format_func=materias.get, key="nova_materia")
    opcoes = [""] + conteudos.loc[conteudos["materia_id"] == materia, "nome"].tolist()
    with st.form("video", clear_on_submit=True):
        titulo = st.text_input("Título")
        url = st.text_input("Link (URL)", placeholder="https://www.youtube.com/watch?v=...")
        c1, c2 = st.columns(2)
        conteudo = c1.selectbox("Conteúdo (opcional)", opcoes)
        canal = c2.text_input("Canal/professor (opcional)")
        if st.form_submit_button("Salvar", type="primary"):
            if not titulo.strip() or not url.strip().startswith(("http://", "https://")):
                st.error("Preencha o título e um link começando com http:// ou https://")
            else:
                be.adicionar_video(materia, titulo, url, conteudo, canal)
                st.rerun()

videos = be.listar_videos()
if videos.empty:
    st.info("Nenhuma videoaula ainda. Dica: comece pelos conteúdos de frequência Alta do checklist.")
    st.stop()

c1, c2, c3 = st.columns(3)
c1.metric("Videoaulas", len(videos))
c2.metric("Assistidas", int(videos["assistido"].sum()))
c3.metric("Faltam", int((videos["assistido"] == 0).sum()))

filtro_area = st.segmented_control("Área", be.AREAS, selection_mode="single")
so_pendentes = st.toggle("Só as não assistidas")
vis = videos
if filtro_area:
    vis = vis[vis["area"] == filtro_area]
if so_pendentes:
    vis = vis[vis["assistido"] == 0]

for materia, grupo in vis.groupby("materia", sort=False):
    st.subheader(f"{materia} ({int(grupo['assistido'].sum())}/{len(grupo)})")
    for v in grupo.itertuples():
        marca = "✅" if v.assistido else "▶️"
        extra = " · ".join(x for x in [v.conteudo, v.canal] if x)
        with st.expander(f"{marca} {v.titulo}" + (f" — {extra}" if extra else "")):
            try:
                st.video(v.url)
            except Exception:
                pass
            st.link_button("Abrir no navegador", v.url)
            with st.form(f"v_{v.id}"):
                assistido = st.checkbox("Assisti", value=bool(v.assistido))
                notas = st.text_area("Anotações", value=v.notas or "", placeholder="Resumo, fórmulas, dúvidas...")
                c1, c2 = st.columns(2)
                if c1.form_submit_button("Salvar"):
                    be.atualizar_video(v.id, assistido, notas)
                    st.rerun()
                if c2.form_submit_button("Apagar vídeo"):
                    be.apagar_video(v.id)
                    st.rerun()
