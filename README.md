# Rumo — estudos e vida, num lugar só

Painel pessoal do Davi: **plano do dia, ENEM (disciplinas, aulas, foco, revisões, simulados), redação,
finanças e carreira**, com gamificação (XP, nível, sequência de dias, missões e conquistas).

- Site: `https://diogo-nobrega7.github.io/Plano-de-vida/` (depois de publicar, ver `docs/PUBLICAR.md`)
- Tecnologia: React + TypeScript + Tailwind (Vite), dados no Supabase, publicado no GitHub Pages
- Sem configurar o Supabase, roda em **modo local** (dados só no navegador), ótimo para testar

## Rodar no computador

```bash
npm install
npm run dev        # abre em http://localhost:5173
npm test           # testa os cálculos (juros, impostos, redação, gamificação…)
npm run build      # gera a versão final em dist/
```

Para usar o Supabase localmente: copie `.env.example` para `.env.local` e preencha.

## Telas

| Seção | Abas |
|---|---|
| **Hoje** | saudação, dias para o ENEM, plano do dia, nível/XP, sequência 🔥, conquistas, missões, questões, revisões, constância (12 semanas), rumo financeiro, metas |
| **Estudos** | Disciplinas (checklist do ENEM por frequência) · Aulas (player + Modo Foco + Pomodoro) · Foco (cronômetro e sessões) · Revisões (erros e flashcards com revisão espaçada) · Simulados |
| **Redação** | Escrever (pré-análise + correção C1–C5 da Cartilha 2026 + pedido de correção para o Claude) · Minhas redações · Temas · Guia nota 1000 |
| **Finanças** | Resumo (lançamentos e investimentos) · Liberdade financeira (3 cenários) · Investimentos (simulador com juros e IR) · Salário e impostos 2026 · Orçamento familiar |
| **Carreira** | Linha do tempo · Metas · Comparador de carreiras · Diário de decisões |

## Como o código está organizado

```
src/
  app/          rotas (routes.ts), perfil, tema
  components/   ui/ (botões, cartões, campos, modal…) e layout/ (topo, menu do celular)
  data/         db.ts (único lugar que fala com o banco), tipos, dados iniciais, hooks
  features/     uma pasta por seção: hoje, estudos, redacao, financas, carreira, perfil
  lib/          cálculos puros com testes (finanças, impostos, investimentos, redação, gamificação…)
supabase/migrations   esquema do banco (rodar no SQL Editor)
```

**Tela nova:** crie em `src/features/<secao>/`, registre a aba em `src/app/routes.ts` e a tela em `src/App.tsx`.
**Tabela nova:** nova migração em `supabase/migrations/` (nunca editar uma já rodada) + tipo em `src/data/tipos.ts`.
**Cores:** tokens em `src/index.css` (claro e escuro).

## Fontes (nov/2026)

Selic 13,75% (Copom 04/11/2026) · Focus 09/11/2026 · INSS 2026 (Portaria MPS/MF 13/2026) · IR 2026 (Lei 15.270/2025) ·
POF/IBGE 2017-2018 · Cartilha do Participante — Redação ENEM 2026 (Inep) · Demografia Médica no Brasil 2025.

> Material de estudo, não recomendação de investimento.
