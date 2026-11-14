# Plano de Vida

Sistema pessoal do Davi para acompanhar **finanças, carreira e estudos para o ENEM**.
Roda no seu computador: nada vai para a internet, e os dados ficam num arquivo seu.

> Material de estudo, não recomendação de investimento. Taxas e impostos mudam: revise todo ano.

## O que já tem (Módulo 1 — Finanças)

| Tela | Para que serve |
|---|---|
| **Início** | Resumo: patrimônio, meta de liberdade financeira e quando cada cenário chega lá |
| **Finanças** | Lançar receitas, despesas e aportes por mês; cadastrar investimentos; conceitos (faturamento × lucro × renda × patrimônio) |
| **Liberdade financeira** | Simulador por fases da vida, 3 cenários (conservador, moderado, otimista), gráfico por idade, valores reais ou nominais |
| **Investimentos** | Tipos de investimento (risco, liquidez, IR, garantia), simulador comparativo com juros **e** IR, e por onde começar |
| **Impostos no salário** | Salário bruto → líquido com INSS e IR de 2026 (isenção até R$ 5 mil) e "quanto preciso ganhar bruto?" |
| **Orçamento familiar** | Estimativa de gastos por tópico (moradia, feira, transporte, saúde, lazer, viagens...) com base no IBGE, e a regra 50/30/20 |

Próximas etapas: **Módulo 2 — Carreira** (linha do tempo, metas, comparador de carreiras, diário de decisões) e
**Módulo 3 — ENEM** (matérias, sessões de estudo, simulados).

## Como instalar (uma vez só)

1. Instale o **Python 3.11 ou mais novo**: https://www.python.org/downloads/ (no Windows, marque *Add Python to PATH*).
2. Abra o terminal na pasta do projeto e rode:

```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Mac/Linux:
source .venv/bin/activate

pip install -r requirements.txt
```

## Como rodar

```bash
# (ative o ambiente antes, como acima)
streamlit run app.py
```

O navegador abre sozinho em http://localhost:8501. Para fechar, aperte `Ctrl+C` no terminal.

## Backup dos seus dados

Tudo fica em **um arquivo só: `dados/plano.db`**.

- **Fazer backup:** feche o app e copie `dados/plano.db` para um pendrive, Google Drive etc. (ex.: `plano-2026-11-14.db`).
- **Restaurar:** feche o app e coloque a cópia de volta em `dados/plano.db`.
- A pasta `dados/` **não vai para o GitHub** (está no `.gitignore`), porque são dados pessoais.

## Testes

```bash
python -m pytest
```

Testam juros compostos, inflação, meta de liberdade, INSS, IR 2026, IR dos investimentos e o orçamento.

## Organização do código

```
app.py              menu do app
telas/              uma tela por arquivo (o que aparece na tela)
core/               cálculos puros, sem tela — fáceis de testar
  calculos.py       juros compostos, inflação, meta de liberdade, simulação por fases
  impostos.py       INSS e IR 2026, tabela regressiva
  investimentos.py  catálogo de investimentos e simulação com IR
  orcamento.py      estimativa de gastos por tópico
  servicos.py       liga o banco aos cálculos
db/                 banco de dados (SQLite)
tests/              testes automáticos
```

## Fontes dos dados (nov/2026)

- Selic 13,75% — Copom, 04/11/2026
- IPCA e Selic futuros — Boletim Focus, 09/11/2026 (IPCA 2026 5,22%; 2027 4,90%; Selic fim de 2027 12,50%, 2028 11%, 2029 10,25%)
- INSS 2026 — Portaria Interministerial MPS/MF nº 13/2026 (teto R$ 8.475,55)
- IR 2026 — Lei 15.270/2025 e tabela da Receita Federal
- Gastos das famílias — POF/IBGE 2017-2018
- Renda dos médicos — Demografia Médica no Brasil 2025
