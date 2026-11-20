# Como publicar o Rumo (Supabase + GitHub Pages)

Resultado: um link `https://diogo-nobrega7.github.io/Plano-de-vida/` que abre em qualquer navegador,
com login por e-mail e senha. Os dados ficam no Supabase e **só a sua conta** consegue ler ou mudar
(regra de segurança no próprio banco, RLS).

Tempo: uns 15 minutos, uma vez só. Tudo grátis.

---

## Parte 1 — Banco (Supabase)

Pode usar o projeto que você já criou (`plano-de-vida`).

1. Supabase → seu projeto → **SQL Editor** → **New query**.
2. Abra o arquivo `supabase/migrations/0001_inicial.sql` deste repositório, copie **tudo**, cole e clique **Run**.
   Deve aparecer "Success". (Ele apaga as tabelas da versão antiga em Streamlit, que só tinham dados de teste,
   e cria as novas.)
   Depois, faça o mesmo com `supabase/migrations/0002_cronograma_sisu.sql` (cronograma e faculdades do SISU).
   **Já tinha rodado a 0001 antes?** Rode só a 0002. Cada arquivo roda uma vez só, na ordem.
3. **Bloquear cadastro aberto:** **Authentication → Sign In / Providers → Email** → desligue
   **Allow new users to sign up** → Save. Assim ninguém cria conta sozinho.
4. **Criar sua conta:** **Authentication → Users → Add user → Create new user**. Coloque seu e-mail e uma senha
   forte e marque **Auto Confirm User**.
5. **Pegar as chaves públicas:** **Project Settings → API Keys** (ou botão **Connect → App Frameworks**):
   - **Project URL** (ex.: `https://abcdefg.supabase.co`)
   - **Publishable key** (começa com `sb_publishable_`; em projetos antigos, a `anon public`)

   Essas duas podem ficar no site sem problema: quem protege os dados é o login + RLS.
   **Nunca** use a `service_role`/`secret` no site.

6. **Link de "Esqueci minha senha":** **Authentication → URL Configuration**:
   - **Site URL:** `https://diogo-nobrega7.github.io/Plano-de-vida/`
   - **Redirect URLs → Add URL:** `https://diogo-nobrega7.github.io/Plano-de-vida/**`
   Sem isso, o link do e-mail de recuperação não volta para o site.

## Parte 2 — Site (GitHub Pages)

1. No GitHub, repositório `Plano-de-vida` → **Settings → General** → lá embaixo, **Change visibility → Public**.
   (O GitHub Pages grátis só funciona com repositório público. O código fica visível; seus dados não.)
2. **Settings → Secrets and variables → Actions → aba Variables → New repository variable**, crie duas:
   - `VITE_SUPABASE_URL` = a Project URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = a publishable key
3. **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. **Actions → Publicar no GitHub Pages → Run workflow** (ou faça qualquer push na `main`). Em 1–2 minutos
   o site está no ar.
5. Abra o link, entre com o e-mail e a senha da Parte 1. Na primeira vez, o app cria sozinho os conteúdos
   do ENEM, temas de redação, cenários e metas.

## Depois

- **Atualizações:** todo push na `main` publica de novo sozinho.
- **Celular:** abra o link e use "Adicionar à tela inicial".
- **Supabase pausado:** o plano grátis pausa após 7 dias sem uso. Entre no supabase.com e clique em
  **Restore project** (os dados continuam lá).
- **Backup:** Supabase → **Table Editor** → tabela → **Export → CSV**.
- **Desligar a versão antiga:** share.streamlit.io → app → **⋮ → Delete** (não é mais usada).
