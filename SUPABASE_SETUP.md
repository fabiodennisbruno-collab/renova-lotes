# SUPABASE_SETUP.md — Configuração do Supabase para o Renova Lotes

Este guia explica como conectar o Renova Lotes ao Supabase para sincronizar dados em nuvem.

---

## O que você ganha

- ✅ Dados sincronizados automaticamente entre dispositivos
- ✅ App continua funcionando offline (localStorage como fallback)
- ✅ Layout e funções originais 100% intactos
- ✅ Estratégia *offline-first* com resolução last-write-wins

---

## Passo 1 — Criar projeto no Supabase

1. Acesse [https://app.supabase.com](https://app.supabase.com) e crie uma conta (gratuita).
2. Clique em **New project**.
3. Preencha nome, senha e região mais próxima.
4. Aguarde o projeto inicializar (~2 minutos).

---

## Passo 2 — Obter as credenciais

1. No painel do projeto, vá em **Settings → API**.
2. Copie:
   - **Project URL** → `https://xxxxxxxxxxxx.supabase.co`
   - **anon public** (Project API Keys) → `eyJ...`

---

## Passo 3 — Criar as tabelas no Supabase

No painel do projeto, vá em **SQL Editor** e execute o script abaixo:

```sql
-- Produtos / Estoque
CREATE TABLE IF NOT EXISTS products (
  id                  TEXT PRIMARY KEY,
  codigo              TEXT,
  nome_produto        TEXT,
  tipo_produto        TEXT,
  local_estoque       TEXT,
  lote_id             TEXT,
  custo_produto       FLOAT,
  valor_anuncio       FLOAT,
  canais_anuncio      JSONB,
  data_anuncio_iso    TEXT,
  vendido             BOOLEAN DEFAULT FALSE,
  valor_venda         FLOAT,
  canais_venda        JSONB,
  data_venda_iso      TEXT,
  quem_vendeu         TEXT,
  forma_entrega       TEXT,
  custo_entrega       FLOAT,
  pagamento           JSONB,
  observacoes         TEXT,
  photos              JSONB,
  data_sincronizacao  TIMESTAMP,
  deletado_em         TIMESTAMP,
  criado_em           TIMESTAMP DEFAULT NOW()
);

-- Configurações (canais, categorias, etc.)
CREATE TABLE IF NOT EXISTS configs (
  id            TEXT PRIMARY KEY,
  tipo          TEXT,
  valor         JSONB,
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Lotes de compra
CREATE TABLE IF NOT EXISTS lotes (
  id                  TEXT PRIMARY KEY,
  nome                TEXT,
  total               FLOAT,
  criado_em           TIMESTAMP DEFAULT NOW(),
  atualizado_em       TIMESTAMP,
  data_sincronizacao  TIMESTAMP
);
```

### Políticas de acesso (Row Level Security)

Para desenvolvimento/teste, você pode desativar o RLS temporariamente:

```sql
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE configs  DISABLE ROW LEVEL SECURITY;
ALTER TABLE lotes    DISABLE ROW LEVEL SECURITY;
```

> ⚠️ Para produção, configure políticas RLS adequadas conforme sua necessidade de segurança.

---

## Passo 4 — Configurar as credenciais no app

Abra o arquivo `js/config/supabase-init.js` e substitua os valores:

```js
var SUPABASE_URL      = 'https://qjkjtqioizvuqextiqch.supabase.co';  // ← seu Project URL
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqa2p0cWlvaXp2dXFleHRpcWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MDA1MDAsImV4cCI6MjA4NzE3NjUwMH0.WPHfYpvmk7V0JFNRsmdJIwJmQK_Mp0LGXSsNWQrdCIs';                  // ← sua anon key
```

**Alternativa via variável global** (útil para deploy automatizado):

Antes de carregar `supabase-init.js`, defina no HTML:

```html
<script>
  window.SUPABASE_URL      = 'https://xxxxxxxxxxxx.supabase.co';
  window.SUPABASE_ANON_KEY = 'eyJ...';
</script>
```

---

## Passo 5 — Deploy (opcional)

### Vercel

```bash
# Instala CLI
npm i -g vercel

# Faz deploy
vercel

# Define variáveis de ambiente
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
```

### Netlify

1. Faça o push do código para GitHub.
2. Crie um novo site no Netlify apontando para o repositório.
3. Em **Site settings → Environment variables**, adicione:
   - `SUPABASE_URL` → `https://xxxxxxxxxxxx.supabase.co`
   - `SUPABASE_ANON_KEY` → `eyJ...`

### GitHub Pages

Configure as credenciais diretamente em `js/config/supabase-init.js` (a anon key é pública).

---

## Como funciona a sincronização

| Situação | Comportamento |
|---|---|
| **Offline** | App usa localStorage normalmente, sem erros |
| **Online (abertura)** | Dados do Supabase são baixados para localStorage |
| **Online (gravação)** | Cada `localStorage.setItem` também grava no Supabase |
| **Reconexão** | Pull automático para atualizar dados locais |
| **Conflito** | Último a gravar vence (*last-write-wins*) |

### Tabelas sincronizadas

| localStorage key | Tabela Supabase |
|---|---|
| `renova_lotes_html_v6` | `products` |
| `renova_lotes_html_v6_config` | `configs` |

---

## Solução de problemas

| Problema | Solução |
|---|---|
| "CDN não carregado" | Verifique se o script do Supabase está no `index.html` |
| "Credenciais não configuradas" | Edite `supabase-init.js` com seu Project URL e anon key |
| Dados não aparecem | Verifique se as tabelas foram criadas e o RLS está configurado |
| Erro de CORS | Adicione seu domínio em **Supabase → Settings → API → Allowed Origins** |
