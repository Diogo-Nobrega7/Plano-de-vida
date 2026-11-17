# CLAUDE.md — Rumo (antigo Plano de Vida)

Painel pessoal do Davi (16 anos, ENEM em 2028, Medicina em análise). Ler antes de alterar.

## Stack
Vite 5 + React 18 + TypeScript strict + Tailwind 3 · Recharts · lucide-react · Vitest · Supabase (Auth + Postgres + RLS) · GitHub Pages (`.github/workflows/deploy.yml`).
Sem `VITE_SUPABASE_*` o app roda em modo local (localStorage), mesma interface (`src/data/db.ts`).

## Regras
- Cálculos só em `src/lib/` como funções puras, sempre com teste (`npm test`).
- Telas nunca falam com o Supabase direto: usam `useTabela()` (`src/data/hooks.ts`).
- Banco: toda mudança é uma migração nova numerada; toda tabela tem `user_id default auth.uid()` + RLS "só o dono".
- Cores só por tokens (`src/index.css`); funciona em claro e escuro.
- Camadas de tela cheia (modal, onboarding, Modo Foco) usam portal (`Camada`/`Modal`), porque `main` tem animação.
- Textos em português, voz ativa, sem jargão. Nada de dado inventado mostrado como real.
- Dados de mercado (Selic, IR, INSS) são de nov/2026: revisar todo ano em `src/lib/impostos.ts` e `src/lib/investimentos.ts`.

## Comandos
`npm run dev` · `npm test` · `npm run typecheck` · `npm run build`
