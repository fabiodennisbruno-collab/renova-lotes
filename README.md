# Renova Lotes — Integração com Supabase

Plataforma completa na nuvem para gestão de lotes, estoque, vendas e fotos, com acesso de múltiplos locais e autenticação de usuários.

## Funcionalidades

- ✅ **Autenticação** — login/logout com e-mail e senha via Supabase Auth
- ✅ **CRUD de Lotes** — criação, leitura, atualização e exclusão de lotes
- ✅ **CRUD de Estoque** — gestão completa do estoque por lote
- ✅ **CRUD de Vendas** — registro e histórico de vendas por lote
- ✅ **Upload de Fotos** — envio de imagens para o Supabase Storage
- ✅ **Dados na nuvem** — acesso sincronizado de qualquer navegador

---

## Estrutura do Projeto

```
renova-lotes/
├── index.html                    # Página principal (app CRM local)
├── css/
│   ├── crm-premium.css           # Estilos do CRM existente
│   └── style.css                 # Estilos base da integração Supabase
├── js/
│   ├── config/
│   │   └── supabase-config.js    # Configuração do cliente Supabase
│   ├── modules/
│   │   ├── auth.js               # Autenticação de usuários
│   │   ├── lotes.js              # Gestão de lotes
│   │   ├── estoque.js            # Gestão de estoque
│   │   ├── vendas.js             # Gestão de vendas
│   │   └── upload.js             # Upload de fotos
│   └── app.js                    # Orquestrador principal
├── .env.example                  # Modelo de variáveis de ambiente
└── README.md                     # Este arquivo
```

---

## Configuração

### 1. Criar projeto no Supabase

1. Acesse [https://app.supabase.com](https://app.supabase.com) e crie uma conta (gratuita).
2. Clique em **"New project"** e preencha nome, senha e região.
3. Aguarde a inicialização do projeto.

### 2. Obter as credenciais

1. No painel do projeto, vá em **Settings → API**.
2. Copie:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** (Project API Keys) → `SUPABASE_ANON_KEY`

### 3. Configurar as credenciais no projeto

Edite o arquivo `js/config/supabase-config.js` e substitua os valores:

```js
const SUPABASE_URL = 'https://SEU_PROJECT_ID.supabase.co';
const SUPABASE_KEY = 'SUA_ANON_PUBLIC_KEY';
```

### 4. Criar as tabelas no banco de dados

No painel do Supabase, vá em **SQL Editor** e execute o script abaixo:

```sql
-- Tabela de lotes
CREATE TABLE lotes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       TEXT NOT NULL,
  total      NUMERIC(12,2) NOT NULL DEFAULT 0,
  descricao  TEXT,
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Tabela de estoque
CREATE TABLE estoque (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id         UUID REFERENCES lotes(id) ON DELETE CASCADE,
  codigo          TEXT,
  nome_produto    TEXT NOT NULL,
  tipo_produto    TEXT,
  local_estoque   TEXT,
  custo_produto   NUMERIC(12,2) DEFAULT 0,
  valor_anuncio   NUMERIC(12,2) DEFAULT 0,
  canal_anuncio   TEXT,
  status          TEXT DEFAULT 'disponivel',
  foto_url        TEXT,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Tabela de vendas
CREATE TABLE vendas (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id        UUID REFERENCES lotes(id) ON DELETE CASCADE,
  estoque_id     UUID REFERENCES estoque(id) ON DELETE SET NULL,
  canal_venda    TEXT,
  valor_venda    NUMERIC(12,2) NOT NULL DEFAULT 0,
  data_venda     DATE NOT NULL DEFAULT CURRENT_DATE,
  comprador      TEXT,
  observacao     TEXT,
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Habilitar RLS (Row Level Security) em todas as tabelas
ALTER TABLE lotes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas  ENABLE ROW LEVEL SECURITY;

-- Políticas: cada usuário acessa apenas seus próprios dados
CREATE POLICY "lotes_proprio_usuario"   ON lotes   FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "estoque_proprio_usuario" ON estoque FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "vendas_proprio_usuario"  ON vendas  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### 5. Criar o bucket de fotos

1. No painel do Supabase, vá em **Storage**.
2. Clique em **"New bucket"**, nomeie como `fotos` e marque como **Public**.
3. (Opcional) Adicione políticas de acesso se quiser restringir uploads por usuário.

---

## Como usar os módulos

### Autenticação

```js
// Login
await Auth.login('usuario@email.com', 'senha123');

// Logout
await Auth.logout();

// Usuário atual
const user = await Auth.getCurrentUser();

// Observar mudanças de sessão
Auth.onAuthStateChange((user) => {
  if (user) console.log('Logado:', user.email);
  else console.log('Deslogado');
});
```

### Lotes

```js
// Listar todos os lotes
const lotes = await Lotes.getLotes();

// Criar lote
const novoLote = await Lotes.createLote({ nome: 'Lote Julho 2025', total: 6050.00, user_id: user.id });

// Atualizar lote
await Lotes.updateLote(lote.id, { nome: 'Lote Atualizado' });

// Excluir lote
await Lotes.deleteLote(lote.id);
```

### Estoque

```js
// Listar itens (todos ou filtrados por lote)
const itens = await Estoque.getEstoque();
const itensDeLote = await Estoque.getEstoque(lote.id);

// Criar item
const item = await Estoque.createEstoqueItem({
  lote_id: lote.id,
  nome_produto: 'Sofá 3 Lugares',
  custo_produto: 800,
  valor_anuncio: 1500,
  user_id: user.id
});

// Atualizar e excluir
await Estoque.updateEstoqueItem(item.id, { status: 'vendido' });
await Estoque.deleteEstoqueItem(item.id);
```

### Vendas

```js
// Registrar venda
const venda = await Vendas.createVenda({
  lote_id: lote.id,
  estoque_id: item.id,
  canal_venda: 'OLX',
  valor_venda: 1500,
  data_venda: '2025-07-15',
  user_id: user.id
});

// Listar vendas
const vendas = await Vendas.getVendas();
```

### Upload de Fotos

```js
// Upload a partir de um <input type="file">
const file = document.getElementById('fotoInput').files[0];
const url  = await Upload.uploadFoto(file, `lotes/${lote.id}/${file.name}`);

// Salvar a URL na tabela de estoque
await Estoque.updateEstoqueItem(item.id, { foto_url: url });

// Obter URL pública de uma foto já enviada
const fotoUrl = Upload.getFotoUrl(`lotes/${lote.id}/foto.jpg`);

// Excluir foto
await Upload.deleteFoto(`lotes/${lote.id}/foto.jpg`);
```

---

## Incluir scripts no HTML

Para usar a integração Supabase em uma página HTML, adicione os scripts na seguinte ordem:

```html
<!-- 1. Biblioteca Supabase (CDN) -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- 2. Configuração (credenciais) -->
<script src="js/config/supabase-config.js"></script>

<!-- 3. Módulos -->
<script src="js/modules/auth.js"></script>
<script src="js/modules/lotes.js"></script>
<script src="js/modules/estoque.js"></script>
<script src="js/modules/vendas.js"></script>
<script src="js/modules/upload.js"></script>

<!-- 4. Orquestrador principal -->
<script src="js/app.js"></script>
```

---

## Segurança

- A **chave anônima** (`anon key`) é segura para uso no front-end — ela é pública por design no Supabase.
- O acesso aos dados é controlado pelas **políticas de Row Level Security (RLS)** do Supabase, garantindo que cada usuário acesse apenas seus próprios registros.
- **Nunca exponha a `service_role` key** no código do front-end.

---

## Deploy

Por ser uma aplicação front-end estática, pode ser hospedada em qualquer serviço:

- [GitHub Pages](https://pages.github.com/)
- [Netlify](https://netlify.com/)
- [Vercel](https://vercel.com/)
- Qualquer servidor HTTP estático

Não é necessário servidor back-end — toda a lógica de dados é tratada pelo Supabase.
