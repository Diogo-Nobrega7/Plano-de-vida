-- Tabelas do Plano de Vida. "IF NOT EXISTS" deixa rodar várias vezes sem erro.

-- Configurações gerais (idade atual, inflação, meta...). Guardadas como texto.
CREATE TABLE IF NOT EXISTS config (
    chave TEXT PRIMARY KEY,
    valor TEXT NOT NULL
);

-- ===================== Módulo 1: Finanças =====================

-- Receitas, despesas e aportes de cada mês.
CREATE TABLE IF NOT EXISTS lancamentos (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    mes       TEXT NOT NULL,              -- formato AAAA-MM
    tipo      TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa', 'aporte')),
    categoria TEXT NOT NULL,
    descricao TEXT,
    valor     REAL NOT NULL CHECK (valor >= 0)
);

-- Seus investimentos e quanto valem hoje.
CREATE TABLE IF NOT EXISTS investimentos (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    nome           TEXT NOT NULL,
    tipo           TEXT NOT NULL,
    valor_aplicado REAL NOT NULL DEFAULT 0,
    saldo_atual    REAL NOT NULL DEFAULT 0,
    atualizado_em  TEXT                   -- data AAAA-MM-DD
);

-- Cenários de simulação (conservador, moderado, otimista...).
CREATE TABLE IF NOT EXISTS cenarios (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    nome      TEXT NOT NULL UNIQUE,
    taxa_real REAL NOT NULL,              -- rendimento acima da inflação, ex.: 0.05
    descricao TEXT
);

-- Fases da vida de cada cenário. Também serão a "linha do tempo" do Módulo 2.
CREATE TABLE IF NOT EXISTS fases (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    cenario_id    INTEGER NOT NULL REFERENCES cenarios(id) ON DELETE CASCADE,
    nome          TEXT NOT NULL,
    idade_inicio  REAL NOT NULL,
    idade_fim     REAL NOT NULL,
    renda_min     REAL NOT NULL DEFAULT 0,
    renda_max     REAL NOT NULL DEFAULT 0,
    aporte_mensal REAL NOT NULL DEFAULT 0
);

-- ===================== Módulo 2: Carreira =====================

-- Metas com prazo e status.
CREATE TABLE IF NOT EXISTS metas (
    id     INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    area   TEXT NOT NULL DEFAULT 'Pessoal',
    prazo  TEXT,                          -- data AAAA-MM-DD
    status TEXT NOT NULL DEFAULT 'não iniciada'
           CHECK (status IN ('não iniciada', 'em andamento', 'concluída')),
    notas  TEXT
);

-- Critérios do comparador de carreiras (nota 5 = melhor para você).
CREATE TABLE IF NOT EXISTS criterios (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    nome      TEXT NOT NULL UNIQUE,
    peso      REAL NOT NULL DEFAULT 1,
    descricao TEXT
);

CREATE TABLE IF NOT EXISTS carreiras (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    nome  TEXT NOT NULL UNIQUE,
    notas TEXT
);

-- Nota de cada carreira em cada critério (1 a 5).
CREATE TABLE IF NOT EXISTS notas_carreira (
    carreira_id INTEGER NOT NULL REFERENCES carreiras(id) ON DELETE CASCADE,
    criterio_id INTEGER NOT NULL REFERENCES criterios(id) ON DELETE CASCADE,
    nota        REAL NOT NULL CHECK (nota BETWEEN 1 AND 5),
    PRIMARY KEY (carreira_id, criterio_id)
);

-- Diário de decisões: o que decidi, com base em quê, e quando revisar.
CREATE TABLE IF NOT EXISTS decisoes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    data       TEXT NOT NULL,
    decisao    TEXT NOT NULL,
    premissas  TEXT,
    revisar_em TEXT,
    resultado  TEXT                       -- preenchido na revisão
);

-- ===================== Módulo 3: ENEM =====================

CREATE TABLE IF NOT EXISTS materias (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    area  TEXT NOT NULL,                  -- Linguagens, Humanas, Natureza, Matemática, Redação
    nome  TEXT NOT NULL,
    UNIQUE (area, nome)
);

-- Checklist de conteúdos. frequencia = o quanto costuma cair (Alta/Média/Baixa).
CREATE TABLE IF NOT EXISTS conteudos (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    materia_id  INTEGER NOT NULL REFERENCES materias(id) ON DELETE CASCADE,
    nome        TEXT NOT NULL,
    frequencia  TEXT NOT NULL DEFAULT 'Média',
    status      TEXT NOT NULL DEFAULT 'não estudado'
                CHECK (status IN ('não estudado', 'estudando', 'revisado', 'dominado')),
    revisado_em TEXT                      -- base para a futura revisão espaçada
);

CREATE TABLE IF NOT EXISTS videoaulas (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    materia_id INTEGER NOT NULL REFERENCES materias(id) ON DELETE CASCADE,
    conteudo   TEXT,
    titulo     TEXT NOT NULL,
    url        TEXT NOT NULL,
    canal      TEXT,
    assistido  INTEGER NOT NULL DEFAULT 0,
    notas      TEXT
);

CREATE TABLE IF NOT EXISTS sessoes_estudo (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    data        TEXT NOT NULL,
    materia_id  INTEGER NOT NULL REFERENCES materias(id) ON DELETE CASCADE,
    minutos     INTEGER NOT NULL CHECK (minutos > 0),
    observacoes TEXT
);

CREATE TABLE IF NOT EXISTS simulados (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    data    TEXT NOT NULL,
    nome    TEXT NOT NULL,
    lc      REAL, ch REAL, cn REAL, mt REAL, redacao REAL
);

CREATE TABLE IF NOT EXISTS temas_redacao (
    id     INTEGER PRIMARY KEY AUTOINCREMENT,
    tema   TEXT NOT NULL UNIQUE,
    ano    INTEGER,
    origem TEXT NOT NULL DEFAULT 'Treino'  -- 'ENEM' (prova oficial) ou 'Treino'
);

CREATE TABLE IF NOT EXISTS redacoes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    data        TEXT NOT NULL,
    tema        TEXT NOT NULL,
    texto       TEXT NOT NULL,
    c1 INTEGER, c2 INTEGER, c3 INTEGER, c4 INTEGER, c5 INTEGER,  -- 0 a 200 (de 40 em 40)
    corretor    TEXT,                     -- quem corrigiu: eu, professor, IA...
    comentarios TEXT
);
