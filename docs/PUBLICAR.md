# Como colocar o Plano de Vida na internet

Resultado final:
- Um link do tipo `https://plano-de-vida-davi.streamlit.app`, que abre em qualquer navegador (computador ou celular).
- Pede **senha** para entrar. Sem a senha, ninguém vê nada.
- Os dados ficam guardados no **Supabase** (banco de dados online e grátis), não somem quando o site reinicia.

Tempo total: uns 15 minutos, uma vez só. Tudo é grátis.

---

## Parte 1 — Banco de dados (Supabase)

Se você já tem conta no Supabase (do Monte Trip), use a mesma conta, mas crie um **projeto novo**.

1. Entre em https://supabase.com → **New project**
   - Nome: `plano-de-vida`
   - **Database password:** crie uma senha forte **só com letras e números** (sem `@`, `#`, `/`, `:` etc.,
     porque esses símbolos atrapalham o endereço de conexão). Guarde essa senha.
   - Região: **South America (São Paulo)**
   - Plano: Free
2. Espere o projeto ficar pronto (1–2 min).
3. No topo da página do projeto, clique em **Connect**.
4. Na aba **Connection String**, escolha o tipo **URI** e procure **Session pooler**
   (*não* use a "Direct connection": o Streamlit Cloud não consegue usá-la).
5. Copie o endereço. Ele é parecido com:
   ```
   postgresql://postgres.abcdefghijk:[YOUR-PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
   ```
   Troque `[YOUR-PASSWORD]` (incluindo os colchetes) pela senha do passo 1. Guarde esse endereço para a Parte 2.

Não precisa rodar nenhum SQL: o próprio app cria as tabelas na primeira vez que abrir.
Ele também liga a proteção RLS em todas as tabelas, então a API pública do Supabase não consegue ler os dados —
só o app, que conecta com a senha do banco.

> O plano grátis do Supabase **pausa o projeto depois de 7 dias sem uso**. Se acontecer, entre no
> supabase.com e clique em **Restore project** (os dados não se perdem).

---

## Parte 2 — Site (Streamlit Community Cloud)

1. Entre em https://share.streamlit.io e clique em **Continue with GitHub** (conta `Diogo-Nobrega7`).
   Se pedir, autorize o acesso aos repositórios (inclusive privados).
2. Clique em **Create app** → **Deploy a public app from GitHub** (o nome é esse, mas o app fica protegido pela senha).
3. Preencha:
   - **Repository:** `Diogo-Nobrega7/plano-de-vida`
   - **Branch:** `main`
   - **Main file path:** `app.py`
   - **App URL:** escolha um nome, por exemplo `plano-de-vida-davi`
4. Clique em **Advanced settings**:
   - **Python version:** 3.12
   - Em **Secrets**, cole (trocando pelos seus valores):
     ```toml
     DATABASE_URL = "postgresql://postgres.abcdefghijk:SUASENHA@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"
     APP_PASSWORD = "a-senha-para-entrar-no-app"
     ```
   - Save.
5. Clique em **Deploy**. A primeira vez demora 2–3 minutos.
6. Pronto: abra o link, digite a senha do `APP_PASSWORD` e use.

### Depois de publicado

- **Atualizações:** toda vez que o código mudar no GitHub (branch `main`), o site se atualiza sozinho.
- **Trocar a senha ou o banco:** share.streamlit.io → no seu app, **⋮ → Settings → Secrets**.
- **Site "dormindo":** se ninguém abrir por alguns dias, aparece um botão *"Yes, get this app back up!"*.
  Clique e espere uns 30 segundos.
- **No celular:** abra o link no navegador e use "Adicionar à tela inicial" para virar um ícone, como um app.

---

## Usar no computador (sem internet)

Continua funcionando como antes (`streamlit run app.py`). Sem os segredos configurados, o app usa o arquivo
local `dados/plano.db` e não pede senha. Os dados do computador e os da internet são **separados**.

## Backup dos dados online

No Supabase: **Database → Backups** (o plano grátis guarda backups diários dos últimos dias).
Para uma cópia sua: **Table Editor** → escolha a tabela → **Export → CSV**.
