# PhotoSelect

Sistema personalizado para fotógrafas gerenciarem a seleção de fotos dos clientes.

## Funcionalidades

- **Painel da fotógrafa**: criar sessões, fazer upload de fotos, gerar link do cliente
- **Área do cliente**: galeria responsiva, seleção visual com limite, confirmação final
- **Design minimalista**: preto, branco e cinza, mobile-first

---

## Tecnologias

| Camada | Tecnologia |
|--------|------------|
| Frontend + API | Next.js 14 (App Router) |
| Linguagem | TypeScript |
| Estilo | Tailwind CSS |
| Banco de dados | Supabase (PostgreSQL) |
| Storage de imagens | Supabase Storage |
| Autenticação | JWT (cookie httpOnly) |

---

## Configuração

### 1. Clone e instale

```bash
cd photo-selector
npm install
```

### 2. Configure o Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto gratuito
2. No **SQL Editor**, execute o conteúdo de `supabase/schema.sql`
3. Em **Storage**, crie um bucket chamado `photos` com visibilidade **pública**
4. Copie as chaves do projeto em **Settings → API**

### 3. Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```bash
cp .env.example .env.local
```

```env
# Supabase (Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Credenciais da fotógrafa
ADMIN_EMAIL=seu@email.com
ADMIN_PASSWORD=sua-senha

# JWT — gere uma string longa e aleatória
JWT_SECRET=string-aleatoria-minimo-32-caracteres

# URL pública do app
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Dica:** Para gerar um JWT_SECRET seguro:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### 4. Rode em desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) — você será redirecionada para o login.

---

## Como usar

### Fotógrafa (admin)

1. **Login** em `/login` com seu e-mail e senha
2. **Dashboard** — lista todas as sessões criadas
3. **Nova Sessão** — informe nome do cliente, data do ensaio e quantidade de fotos
4. **Upload** — arraste as fotos do ensaio para a zona de upload
5. **Copiar link** — copie o link exclusivo e envie para o cliente

### Cliente

1. Acessa o link recebido (ex: `https://seusite.com/session/uuid-aqui`)
2. Vê a galeria completa de fotos
3. Seleciona exatamente a quantidade contratada
4. Clica em **Finalizar seleção** → confirma no modal
5. Seleção fica bloqueada e a fotógrafa vê as fotos escolhidas no painel

---

## Deploy

### Vercel (recomendado)

```bash
npm install -g vercel
vercel
```

Adicione as variáveis de ambiente no dashboard da Vercel e atualize `NEXT_PUBLIC_APP_URL` com a URL de produção.

### Outras plataformas

```bash
npm run build
npm start
```

---

## Estrutura do projeto

```
src/
├── app/
│   ├── login/              # Página de login da fotógrafa
│   ├── dashboard/          # Painel admin
│   │   ├── page.tsx        # Lista de sessões
│   │   ├── new-session/    # Criar nova sessão
│   │   └── sessions/[id]/  # Detalhes + upload
│   ├── session/[token]/    # Área do cliente (pública)
│   └── api/                # Rotas da API
│       ├── auth/           # Login / logout
│       ├── sessions/       # CRUD de sessões
│       ├── upload/         # Upload de fotos
│       └── select/         # Finalizar seleção
├── components/
│   ├── SessionCard.tsx     # Card de sessão no dashboard
│   ├── UploadZone.tsx      # Drag & drop de fotos
│   ├── CopyLinkButton.tsx  # Botão copiar link
│   └── ConfirmModal.tsx    # Modal de confirmação
├── lib/
│   ├── supabase.ts         # Clientes Supabase
│   └── auth.ts             # JWT helpers
├── middleware.ts            # Proteção das rotas admin
└── types/index.ts           # Tipos TypeScript
```

---

## Banco de dados

| Tabela | Descrição |
|--------|-----------|
| `sessions` | Ensaios (cliente, data, limite, status, token) |
| `photos` | Fotos enviadas pela fotógrafa |
| `selections` | Fotos escolhidas pelo cliente |

---

## Segurança

- Links de cliente usam **UUID único** — impossível de adivinhar
- Admin protegido por **JWT em cookie httpOnly** — não acessível via JS
- Backend valida **quantidade exata** de fotos antes de aceitar a seleção
- Sessões finalizadas ficam **bloqueadas** no frontend e backend

---

## Dúvidas frequentes

**O cliente pode alterar a seleção depois de finalizar?**
Não. Após finalizar, o status muda para `completed` e qualquer nova tentativa retorna erro 409.

**Posso subir muitas fotos de uma vez?**
Sim, o upload é feito em lotes de 5 fotos paralelas. Não há limite de quantidade, apenas de tamanho de memória do servidor.

**Como faço backup das fotos?**
As fotos ficam no Supabase Storage. Você pode exportá-las pelo dashboard do Supabase a qualquer momento.
