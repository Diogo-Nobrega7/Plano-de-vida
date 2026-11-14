"""Dados iniciais do Módulo 3 (ENEM).

Frequência ("Alta", "Média", "Baixa") = o quanto o assunto costuma aparecer nas
provas, com base em levantamentos de cursinhos sobre as provas de 2016-2025
(ex.: Matemática básica ~37% das questões de Matemática; Ecologia lidera em
Biologia; Eletrodinâmica/Mecânica lideram em Física). Use como guia de
prioridade, não como regra.
"""

A, M, B = "Alta", "Média", "Baixa"

CONTEUDOS = {
    "Linguagens": {
        "Interpretação de texto": [
            ("Leitura e interpretação de textos verbais e não verbais", A),
            ("Gêneros textuais e suas funções", A), ("Funções da linguagem", A),
            ("Variação linguística e preconceito linguístico", A), ("Intertextualidade", M),
            ("Figuras de linguagem", M), ("Textos publicitários, charges e tirinhas", A),
        ],
        "Gramática": [
            ("Coesão e coerência (conectivos e referenciação)", A), ("Classes de palavras", M),
            ("Sintaxe: período simples e composto", B), ("Concordância e regência", B),
            ("Pontuação e efeitos de sentido", M), ("Semântica: sinonímia, polissemia, ambiguidade", M),
        ],
        "Literatura": [
            ("Modernismo (1ª, 2ª e 3ª fases)", A), ("Literatura contemporânea e marginal", M),
            ("Romantismo", M), ("Realismo e Naturalismo", M), ("Barroco e Arcadismo", B),
            ("Parnasianismo e Simbolismo", B), ("Quinhentismo", B),
        ],
        "Língua estrangeira (Inglês/Espanhol)": [
            ("Interpretação de textos (estratégias de leitura)", A), ("Vocabulário em contexto e falsos cognatos", M),
            ("Gêneros: notícias, letras de música, cartuns", M),
        ],
        "Artes": [
            ("Vanguardas europeias e Semana de 22", M), ("Arte contemporânea e intervenções urbanas", M),
            ("Manifestações culturais populares brasileiras", M), ("Música e dança", B),
        ],
        "Educação Física e Tecnologias": [
            ("Corpo, saúde e práticas corporais", M), ("Esporte, mídia e sociedade", B),
            ("Tecnologias da informação e comunicação (TICs)", M),
        ],
    },
    "Humanas": {
        "História do Brasil": [
            ("Brasil Colônia (escravidão, ciclos econômicos)", A), ("Brasil Império", M),
            ("Era Vargas", A), ("Ditadura Militar", A), ("República Velha", M),
            ("Redemocratização e Constituição de 1988", M), ("Povos indígenas e cultura afro-brasileira", A),
        ],
        "História Geral": [
            ("Antiguidade clássica (Grécia e Roma)", M), ("Idade Média e feudalismo", M),
            ("Revoluções Industriais", A), ("Iluminismo e Revolução Francesa", M),
            ("Guerras Mundiais e Guerra Fria", M), ("Imperialismo e descolonização", M),
        ],
        "Geografia": [
            ("Questões ambientais e sustentabilidade", A), ("Urbanização e problemas urbanos", A),
            ("Globalização e geopolítica", A), ("Agropecuária e questão agrária", M),
            ("Climatologia e biomas brasileiros", M), ("Cartografia e escalas", M),
            ("Demografia e migrações", M), ("Geologia, relevo e solos", B), ("Energia e matrizes energéticas", M),
        ],
        "Filosofia": [
            ("Filosofia antiga (Sócrates, Platão, Aristóteles)", A), ("Ética e moral", A),
            ("Filosofia moderna (Descartes, empiristas, Kant)", M), ("Contratualistas (Hobbes, Locke, Rousseau)", A),
            ("Filosofia contemporânea (Nietzsche, Arendt, Foucault)", M),
        ],
        "Sociologia": [
            ("Clássicos: Durkheim, Weber e Marx", A), ("Cidadania, direitos e movimentos sociais", A),
            ("Cultura, identidade e indústria cultural", M), ("Trabalho e desigualdade social", M),
            ("Racismo, gênero e diversidade", A),
        ],
    },
    "Natureza": {
        "Biologia": [
            ("Ecologia (cadeias, ciclos, impactos ambientais)", A), ("Fisiologia humana", A),
            ("Citologia", M), ("Genética e hereditariedade", M), ("Evolução", M),
            ("Doenças: vírus, bactérias, parasitoses e vacinas", A), ("Bioenergética (fotossíntese e respiração)", M),
            ("Botânica", B), ("Zoologia", M), ("Biotecnologia", M),
        ],
        "Química": [
            ("Estequiometria e cálculos químicos", A), ("Química orgânica: funções e reações", A),
            ("Soluções e concentração", A), ("Eletroquímica (pilhas e eletrólise)", M),
            ("Termoquímica", M), ("Equilíbrio químico e pH", M), ("Ligações e polaridade (propriedades)", A),
            ("Química ambiental", A), ("Cinética química", B), ("Radioatividade", B),
            ("Separação de misturas", M),
        ],
        "Física": [
            ("Eletrodinâmica (circuitos, potência, consumo)", A), ("Mecânica: cinemática e leis de Newton", A),
            ("Energia, trabalho e potência", A), ("Ondulatória e acústica", A), ("Termologia e calorimetria", M),
            ("Óptica", M), ("Hidrostática", M), ("Eletromagnetismo", B),
        ],
    },
    "Matemática": {
        "Matemática": [
            ("Razão, proporção e porcentagem", A), ("Interpretação de gráficos e tabelas", A),
            ("Estatística (média, moda, mediana, desvio)", A), ("Geometria espacial (volumes)", A),
            ("Funções (1º e 2º grau, exponencial, log)", A), ("Geometria plana (áreas)", A),
            ("Probabilidade", A), ("Análise combinatória", M), ("Escalas e unidades de medida", A),
            ("Matemática financeira (juros)", M), ("Trigonometria", B), ("Progressões (PA e PG)", M),
            ("Geometria analítica", B),
        ],
    },
    "Redação": {
        "Redação": [
            ("Estrutura: introdução, desenvolvimento, conclusão", A), ("Tese e projeto de texto", A),
            ("Repertório sociocultural produtivo (não 'de bolso')", A), ("Conectivos e coesão", A),
            ("Proposta de intervenção completa (5 elementos)", A), ("Norma culta: desvios mais comuns", A),
            ("Eixos temáticos: saúde, educação, tecnologia, meio ambiente, cidadania", A),
        ],
    },
}

TEMAS_ENEM = [
    (2016, "Caminhos para combater a intolerância religiosa no Brasil"),
    (2017, "Desafios para a formação educacional de surdos no Brasil"),
    (2018, "Manipulação do comportamento do usuário pelo controle de dados na internet"),
    (2019, "Democratização do acesso ao cinema no Brasil"),
    (2020, "O estigma associado às doenças mentais na sociedade brasileira"),
    (2021, "Invisibilidade e registro civil: garantia de acesso à cidadania no Brasil"),
    (2022, "Desafios para a valorização de comunidades e povos tradicionais no Brasil"),
    (2023, "Desafios para o enfrentamento da invisibilidade do trabalho de cuidado realizado pela mulher no Brasil"),
    (2024, "Desafios para a valorização da herança africana no Brasil"),
    (2025, "Perspectivas acerca do envelhecimento na sociedade brasileira"),
    (2026, "A valorização do Sistema Único de Saúde (SUS) como direito universal"),
]

TEMAS_TREINO = [
    "Desafios para o combate à desinformação nas redes sociais no Brasil",
    "Os impactos da inteligência artificial no mercado de trabalho brasileiro",
    "Caminhos para enfrentar a crise de saúde mental entre jovens no Brasil",
    "Desafios para a garantia da segurança alimentar no Brasil",
    "O combate ao racismo ambiental no Brasil",
    "Os desafios da evasão escolar no ensino médio brasileiro",
    "Caminhos para ampliar o acesso à leitura no Brasil",
    "Desafios para a mobilidade urbana nas grandes cidades brasileiras",
    "O uso excessivo de telas por crianças e adolescentes",
    "Desafios para a inclusão de pessoas com deficiência no mercado de trabalho",
    "Caminhos para a valorização dos professores no Brasil",
    "O enfrentamento das apostas online (bets) e seus impactos sociais",
    "Desafios para a preservação da Amazônia",
    "A gravidez na adolescência como desafio social no Brasil",
    "Desafios para a doação de órgãos no Brasil",
]

# Metas de nota iniciais (média ~800 = faixa competitiva para Medicina em
# muitas federais pelo SISU; confira as notas de corte do curso que você quer).
METAS_NOTA = {"meta_lc": 720, "meta_ch": 760, "meta_cn": 780, "meta_mt": 850, "meta_redacao": 940}
