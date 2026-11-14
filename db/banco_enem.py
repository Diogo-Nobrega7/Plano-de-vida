"""Acesso ao banco de dados do Módulo 3 (ENEM)."""

from __future__ import annotations


import pandas as pd

from db.banco import conectar, ler_config
from db.dados_enem import CONTEUDOS, METAS_NOTA, TEMAS_ENEM, TEMAS_TREINO

AREAS = ["Linguagens", "Humanas", "Natureza", "Matemática", "Redação"]
STATUS = ["não estudado", "estudando", "revisado", "dominado"]


def semear(con: Conexao) -> None:
    """Dados iniciais (cada tabela só é preenchida se estiver vazia)."""
    if con.execute("SELECT COUNT(*) FROM materias").fetchone()[0] == 0:
        for area, materias in CONTEUDOS.items():
            for materia, conteudos in materias.items():
                mid = con.inserir("INSERT INTO materias (area, nome) VALUES (?, ?)", (area, materia))
                con.executemany("INSERT INTO conteudos (materia_id, nome, frequencia) VALUES (?, ?, ?)",
                                [(mid, n, f) for n, f in conteudos])
    if con.execute("SELECT COUNT(*) FROM temas_redacao").fetchone()[0] == 0:
        con.executemany("INSERT INTO temas_redacao (tema, ano, origem) VALUES (?, ?, 'ENEM')",
                        [(t, a) for a, t in TEMAS_ENEM])
        con.executemany("INSERT INTO temas_redacao (tema, origem) VALUES (?, 'Treino')",
                        [(t,) for t in TEMAS_TREINO])
    for chave, valor in METAS_NOTA.items():
        con.execute("INSERT INTO config (chave, valor) VALUES (?, ?) ON CONFLICT (chave) DO NOTHING", (chave, str(valor)))


# --- Matérias e conteúdos -----------------------------------------------------

def listar_materias() -> pd.DataFrame:
    with conectar() as con:
        return con.df("SELECT * FROM materias ORDER BY id")


def nome_materias() -> dict[int, str]:
    """id -> 'Área · Matéria' (para caixas de seleção)."""
    return {int(m.id): f"{m.area} · {m.nome}" for m in listar_materias().itertuples()}


def listar_conteudos(materia_id: int | None = None) -> pd.DataFrame:
    sql = ("SELECT c.id, m.area, m.nome AS materia, c.nome, c.frequencia, c.status, c.revisado_em, c.materia_id"
           " FROM conteudos c JOIN materias m ON m.id = c.materia_id")
    with conectar() as con:
        if materia_id is None:
            return con.df(sql + " ORDER BY m.id, c.id")
        return con.df(sql + " WHERE c.materia_id = ? ORDER BY c.id", (materia_id,))


def salvar_conteudos(materia_id: int, df: pd.DataFrame) -> None:
    """Atualiza/insere/apaga os conteúdos de uma matéria conforme a tabela editada.
    Quando o status muda para 'revisado' ou 'dominado', grava a data de hoje."""
    hoje = pd.Timestamp.today().strftime("%Y-%m-%d")
    with conectar() as con:
        antigos = dict(con.execute("SELECT id, status FROM conteudos WHERE materia_id = ?", (materia_id,)).fetchall())
        mantidos = set()
        for _, l in df.dropna(subset=["nome"]).iterrows():
            status = l.get("status") or "não estudado"
            freq = l.get("frequencia") or "Média"
            cid = l.get("id")
            if cid is not None and not pd.isna(cid) and int(cid) in antigos:
                cid = int(cid)
                mantidos.add(cid)
                revisado = hoje if status != antigos[cid] and status in ("revisado", "dominado") else None
                con.execute("UPDATE conteudos SET nome = ?, frequencia = ?, status = ?,"
                            " revisado_em = COALESCE(?, revisado_em) WHERE id = ?",
                            (l["nome"], freq, status, revisado, cid))
            else:
                con.execute("INSERT INTO conteudos (materia_id, nome, frequencia, status) VALUES (?, ?, ?, ?)",
                            (materia_id, l["nome"], freq, status))
        for cid in set(antigos) - mantidos:
            con.execute("DELETE FROM conteudos WHERE id = ?", (cid,))


# --- Videoaulas ----------------------------------------------------------------

def listar_videos() -> pd.DataFrame:
    with conectar() as con:
        return con.df("SELECT v.*, m.area, m.nome AS materia FROM videoaulas v"
                           " JOIN materias m ON m.id = v.materia_id ORDER BY m.id, v.id")


def adicionar_video(materia_id: int, titulo: str, url: str, conteudo: str = "", canal: str = "") -> None:
    with conectar() as con:
        con.execute("INSERT INTO videoaulas (materia_id, titulo, url, conteudo, canal) VALUES (?, ?, ?, ?, ?)",
                    (materia_id, titulo.strip(), url.strip(), conteudo.strip(), canal.strip()))


def atualizar_video(video_id: int, assistido: bool, notas: str | None) -> None:
    with conectar() as con:
        con.execute("UPDATE videoaulas SET assistido = ?, notas = ? WHERE id = ?", (int(assistido), notas, video_id))


def apagar_video(video_id: int) -> None:
    with conectar() as con:
        con.execute("DELETE FROM videoaulas WHERE id = ?", (video_id,))


# --- Sessões de estudo e simulados --------------------------------------------

def adicionar_sessao(data: str, materia_id: int, minutos: int, observacoes: str = "") -> None:
    with conectar() as con:
        con.execute("INSERT INTO sessoes_estudo (data, materia_id, minutos, observacoes) VALUES (?, ?, ?, ?)",
                    (data, materia_id, minutos, observacoes.strip()))


def listar_sessoes() -> pd.DataFrame:
    with conectar() as con:
        return con.df("SELECT s.*, m.area, m.nome AS materia FROM sessoes_estudo s"
                           " JOIN materias m ON m.id = s.materia_id ORDER BY s.data DESC, s.id DESC")


def apagar_sessoes(ids: list[int]) -> None:
    with conectar() as con:
        con.executemany("DELETE FROM sessoes_estudo WHERE id = ?", [(i,) for i in ids])


def adicionar_simulado(data: str, nome: str, notas: dict[str, float | None]) -> None:
    with conectar() as con:
        con.execute("INSERT INTO simulados (data, nome, lc, ch, cn, mt, redacao) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (data, nome.strip(), notas.get("lc"), notas.get("ch"), notas.get("cn"),
                     notas.get("mt"), notas.get("redacao")))


def listar_simulados() -> pd.DataFrame:
    with conectar() as con:
        return con.df("SELECT * FROM simulados ORDER BY data, id")


def apagar_simulado(simulado_id: int) -> None:
    with conectar() as con:
        con.execute("DELETE FROM simulados WHERE id = ?", (simulado_id,))


def metas_nota() -> dict[str, float]:
    c = ler_config()
    return {k.removeprefix("meta_"): float(c.get(k, v)) for k, v in METAS_NOTA.items()}


# --- Redação -------------------------------------------------------------------

def listar_temas() -> pd.DataFrame:
    with conectar() as con:
        return con.df("SELECT * FROM temas_redacao ORDER BY origem, ano DESC, id")


def adicionar_tema(tema: str) -> None:
    with conectar() as con:
        con.execute("INSERT INTO temas_redacao (tema, origem) VALUES (?, 'Treino') ON CONFLICT (tema) DO NOTHING", (tema.strip(),))


def salvar_redacao(data: str, tema: str, texto: str, notas: dict[str, int | None],
                   corretor: str = "", comentarios: str = "", redacao_id: int | None = None) -> int:
    valores = (data, tema, texto, notas.get("c1"), notas.get("c2"), notas.get("c3"), notas.get("c4"),
               notas.get("c5"), corretor, comentarios)
    with conectar() as con:
        if redacao_id:
            con.execute("UPDATE redacoes SET data=?, tema=?, texto=?, c1=?, c2=?, c3=?, c4=?, c5=?,"
                        " corretor=?, comentarios=? WHERE id=?", (*valores, redacao_id))
            return redacao_id
        return con.inserir("INSERT INTO redacoes (data, tema, texto, c1, c2, c3, c4, c5, corretor, comentarios)"
                           " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", valores)


def listar_redacoes() -> pd.DataFrame:
    with conectar() as con:
        df = con.df("SELECT * FROM redacoes ORDER BY data, id")
    df["total"] = df[["c1", "c2", "c3", "c4", "c5"]].sum(axis=1, min_count=5)
    return df


def apagar_redacao(redacao_id: int) -> None:
    with conectar() as con:
        con.execute("DELETE FROM redacoes WHERE id = ?", (redacao_id,))
