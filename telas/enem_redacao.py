"""Redação do ENEM: temas, escrita, correção pela Cartilha 2026 e evolução."""

from datetime import date

import pandas as pd
import streamlit as st

from core.redacao import (COMPETENCIAS, MOTIVOS_ZERO, NIVEIS, O_QUE_AS_NOTAS_1000_TEM, analisar, nota_total,
                          prompt_correcao)
from core.enem import grafico_linhas
from db import banco_enem as be

st.title("✍️ Redação")

aba_escrever, aba_hist, aba_temas, aba_guia = st.tabs(
    ["Escrever e corrigir", "Minhas redações", "Temas", "Guia nota 1000"])

temas = be.listar_temas()
redacoes = be.listar_redacoes()


def formulario_correcao(prefixo: str, valores: dict) -> dict:
    """Seletores de nota por competência, mostrando o descritor do nível escolhido."""
    notas = {}
    for chave, comp in COMPETENCIAS.items():
        atual = valores.get(chave)
        atual = 120 if atual is None or pd.isna(atual) else int(atual)
        notas[chave] = st.select_slider(comp["nome"], options=NIVEIS, value=atual, key=f"{prefixo}_{chave}",
                                        help=comp["pergunta"])
        st.caption(comp["niveis"][notas[chave]])
    return notas


# ------------------------------------------------------------------------------
with aba_escrever:
    opcoes = temas["tema"].tolist()
    escolha = st.selectbox("Tema", opcoes, index=None, placeholder="Escolha um tema (ou vá na aba Temas)",
                           format_func=lambda t: t + (" (ENEM " + str(int(temas.set_index('tema').loc[t, 'ano'])) + ")"
                                                      if pd.notna(temas.set_index('tema').loc[t, 'ano']) else ""))
    texto = st.text_area("Sua redação", height=420, key="texto_redacao",
                         placeholder="Separe os parágrafos com uma linha em branco.")

    if texto.strip():
        a = analisar(texto, escolha or "")
        st.subheader("Pré-análise automática")
        st.caption("Sinais encontrados no texto — não é a nota. Use para revisar antes de corrigir.")
        c1, c2, c3, c4 = st.columns(4)
        c1.metric("Palavras", a["palavras"])
        c2.metric("Linhas (estimativa)", a["linhas_estimadas"], help="~10 palavras por linha da folha do ENEM")
        c3.metric("Parágrafos", a["paragrafos"])
        c4.metric("Conectivos diferentes", len(a["conectivos"]))
        st.write("**Proposta de intervenção (último parágrafo):** " + " · ".join(
            f"{'✅' if v else '❌'} {k}" for k, v in a["elementos_c5"].items()))
        for item in a["pontos_fortes"]:
            st.success(item)
        for item in a["alertas"]:
            st.warning(item)

        st.subheader("Correção")
        modo = st.radio("Como corrigir", ["Autocorreção (Cartilha 2026)", "Correção com IA (Claude)",
                                          "Nota de professor/cursinho"], horizontal=True)
        if modo == "Correção com IA (Claude)":
            st.markdown("Copie o texto abaixo (ícone de copiar no canto) e cole numa conversa em "
                        "[claude.ai](https://claude.ai). Depois lance aqui as notas que vierem.")
            st.code(prompt_correcao(escolha or "(sem tema)", texto), language=None)
        elif modo == "Autocorreção (Cartilha 2026)":
            st.caption("Leia seu texto como um corretor: para cada competência, escolha o nível que melhor descreve.")

        with st.container(border=True):
            notas = formulario_correcao("nova", {})
            total = nota_total(notas)
            st.metric("Nota total", total)
            comentarios = st.text_area("Comentários da correção")
            data = st.date_input("Data", value=date.today(), format="DD/MM/YYYY")
            if st.button("Salvar redação", type="primary"):
                if not escolha:
                    st.error("Escolha o tema.")
                else:
                    corretor = {"Autocorreção (Cartilha 2026)": "Eu", "Correção com IA (Claude)": "IA",
                                "Nota de professor/cursinho": "Professor"}[modo]
                    be.salvar_redacao(data.isoformat(), escolha, texto, notas, corretor, comentarios)
                    st.success("Redação salva! Veja a evolução na aba Minhas redações.")

# ------------------------------------------------------------------------------
with aba_hist:
    if redacoes.empty:
        st.info("Nenhuma redação salva ainda. Meta sugerida: 1 redação por semana.")
    else:
        c1, c2, c3 = st.columns(3)
        c1.metric("Redações", len(redacoes))
        c2.metric("Média das notas", f"{redacoes['total'].mean():.0f}")
        c3.metric("Melhor nota", f"{redacoes['total'].max():.0f}")
        evol = redacoes.set_index("data")[list(COMPETENCIAS)]
        evol.columns = [COMPETENCIAS[c]["nome"].split(" · ")[0] for c in evol.columns]
        st.subheader("Evolução por competência")
        st.altair_chart(grafico_linhas(evol, "Nota (0-200)"), width="stretch")
        medias = redacoes[list(COMPETENCIAS)].mean()
        fraca = medias.idxmin()
        st.info(f"Sua competência mais fraca em média é **{COMPETENCIAS[fraca]['nome']}** "
                f"({medias[fraca]:.0f}). Foque nela nas próximas redações.")

        for r in redacoes.iloc[::-1].itertuples():
            with st.expander(f"{pd.Timestamp(r.data):%d/%m/%Y} · {r.tema[:70]} · **{r.total:.0f}** ({r.corretor or '—'})"):
                st.text(r.texto)
                with st.container(border=True):
                    notas = formulario_correcao(f"r{r.id}", r._asdict())
                    comentarios = st.text_area("Comentários", value=r.comentarios or "", key=f"com_{r.id}")
                    c1, c2 = st.columns(2)
                    if c1.button("Atualizar notas", key=f"upd_{r.id}"):
                        be.salvar_redacao(r.data, r.tema, r.texto, notas, r.corretor or "", comentarios, r.id)
                        st.rerun()
                    if c2.button("Apagar", key=f"del_{r.id}"):
                        be.apagar_redacao(r.id)
                        st.rerun()

# ------------------------------------------------------------------------------
with aba_temas:
    feitos = set(redacoes["tema"]) if not redacoes.empty else set()
    st.subheader("Temas das provas do ENEM")
    oficiais = temas[temas["origem"] == "ENEM"].assign(feito=lambda d: d["tema"].isin(feitos))
    st.dataframe(oficiais[["ano", "tema", "feito"]], hide_index=True, column_config={
        "ano": st.column_config.NumberColumn("Ano", format="%d"), "tema": "Tema",
        "feito": st.column_config.CheckboxColumn("Já escrevi")})
    st.subheader("Temas para treinar")
    treino = temas[temas["origem"] == "Treino"].assign(feito=lambda d: d["tema"].isin(feitos))
    st.dataframe(treino[["tema", "feito"]], hide_index=True,
                 column_config={"tema": "Tema", "feito": st.column_config.CheckboxColumn("Já escrevi")})
    with st.form("novo_tema", clear_on_submit=True):
        novo = st.text_input("Adicionar tema de treino")
        if st.form_submit_button("Adicionar") and novo.strip():
            be.adicionar_tema(novo)
            st.rerun()
    st.caption("Eixos que mais aparecem: saúde, educação, cidadania e direitos, tecnologia, cultura, "
               "meio ambiente e grupos invisibilizados.")

# ------------------------------------------------------------------------------
with aba_guia:
    st.subheader("O que as redações nota 1000 têm em comum")
    for item in O_QUE_AS_NOTAS_1000_TEM:
        st.markdown(f"- {item}")
    st.subheader("As 5 competências (Cartilha do Participante 2026)")
    for comp in COMPETENCIAS.values():
        with st.expander(comp["nome"]):
            st.write(comp["pergunta"])
            st.table(pd.DataFrame([{"Nota": n, "O que significa": d} for n, d in comp["niveis"].items()]))
    st.subheader("O que zera a redação")
    for m in MOTIVOS_ZERO:
        st.markdown(f"- {m}")
    st.subheader("Modelo de estrutura")
    st.markdown("""
1. **Introdução** — contextualização com repertório + apresentação do tema + **tese** + anúncio dos 2 argumentos.
2. **Desenvolvimento 1** — conectivo + tópico frasal (argumento 1) + repertório produtivo + análise (causa/consequência) + fechamento ligado à tese.
3. **Desenvolvimento 2** — mesma estrutura para o argumento 2.
4. **Conclusão** — retomada da tese + **proposta de intervenção completa**:
   *agente* (quem) + *ação* (o quê) + *meio/modo* (como) + *finalidade* (para quê) + *detalhamento* (explica um dos elementos).

> Leia a cartilha oficial no site do Inep (gov.br/inep → Enem → Cartilha do Participante): ela traz redações nota 1000 do ENEM 2025 comentadas.
""")
