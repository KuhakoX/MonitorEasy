# Monitor Easy

O **Monitor Easy** é uma aplicação web desenvolvida em React com backend em Node.js e PostgreSQL hospedado no Supabase. O objetivo do projeto é facilitar o cadastro, login e gerenciamento de monitores, permitindo que alunos encontrem monitores por matéria e visualizem horários disponíveis para aulas.

## Tecnologias utilizadas

* React
* JavaScript
* CSS
* Node.js
* Express
* PostgreSQL
* Supabase
* CORS
* Dotenv
* `pg`
* `bcryptjs`

## Funcionalidades

* Página inicial com apresentação do projeto
* Tela de cadastro de usuários
* Tela de login
* Configurações de conta específicas para alunos e monitores
* Perfil do monitor com materiais, avisos e avaliações
* Exibição de nome, nota e matéria do monitor
* Calendário interativo para criar e editar aulas com título e descrição em um popup
* Popup com os detalhes da aula e botão para acessar o Google Meet
* Integração com banco de dados PostgreSQL no Supabase

As configurações permitem que alunos editem nome e biografia; monitores também
podem gerenciar as matérias ensinadas e o link do Google Meet. A troca de senha
é uma ação separada e opcional. As tabelas são criadas por migrações versionadas
em `supabase/migrations`, e as senhas são armazenadas com hash.
Cada aula tem título, descrição, data e horário; as descrições das aulas antigas
ficam vazias após a migração.
Materiais e avisos são privados para usuários autenticados. Os arquivos são
armazenados no Supabase Storage; alunos e monitores podem avaliar perfis com
nota de 1 a 5, e cada usuário tem uma avaliação por monitor.

## Estrutura do projeto

```txt
MonitorEasy/
├── src/
│   ├── backend/
│   ├── controller/
│   ├── models/
│   ├── pages/
│   └── routes/
├── supabase/
│   └── migrations/
└── .env
```

## Como executar o projeto

### 1. Clonar o repositório

```bash
git clone https://github.com/seu-usuario/monitor-easy.git
```

Depois entre na pasta do projeto:

```bash
cd monitor-easy
```

Na raiz do projeto, instale as dependências:

```bash
npm install
```

Crie `.env` a partir de `.env.example` e informe a connection string PostgreSQL
do projeto Supabase em `DATABASE_URL`. Essa variável é exclusiva do backend:
não a renomeie para `VITE_*` nem a exponha no frontend.

```env
DATABASE_URL=postgresql://...
PORT=3001
# Opcional, mas recomendado:
SESSION_SECRET=
FRONTEND_ORIGINS=http://localhost:5173
SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=
```

`SESSION_SECRET` assina os cookies de sessao. Se configurado, deve ser um valor
aleatorio com pelo menos 32 caracteres, mantido somente no ambiente do backend
e diferente em cada ambiente. Se estiver ausente, o servidor deriva a chave de
`DATABASE_URL` para manter compatibilidade com deploys existentes; configure
um segredo dedicado para isolar a sessao das credenciais do banco. Gere-o
localmente com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
e cadastre-o no `.env` local ou nas variaveis do provedor de deploy; nao
compartilhe nem versione esse valor.

`FRONTEND_ORIGINS` aceita uma lista de origens separadas por virgula quando o
frontend e a API estiverem em hosts diferentes; por padrao, o desenvolvimento
local usa `http://localhost:5173`. O cookie usa `SameSite=Lax` por padrao. Se
frontend e API estiverem em sites diferentes, configure
`SESSION_COOKIE_SAME_SITE=None` e use HTTPS.

Preencha `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` com as credenciais do
projeto Supabase somente no ambiente do backend para ativar uploads.

### Aplicar o esquema no Supabase

Instale/execute a Supabase CLI, autentique-se e vincule o projeto pelo project
ref encontrado no painel do Supabase:

```txt
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push
```

O comando aplica as migrações pendentes de `supabase/migrations`.

### Executar localmente

```bash
npm run api
```

Em outro terminal, inicie o frontend:

```bash
npm run dev
```

O frontend fica em `http://localhost:5173` e a API em
`http://localhost:3001/api`.

### Publicação

O frontend e a API Express podem ser publicados juntos na Vercel. Os arquivos
em `api/` encaminham as rotas `/api` para a mesma aplicação Express usada no
desenvolvimento local. Mantenha `VITE_API_URL` vazia quando frontend e API
estiverem no mesmo domínio.

Configure no projeto Vercel as variáveis de ambiente do backend:

* `DATABASE_URL`: URI PostgreSQL do Supabase; use o pooler recomendado pelo
  painel **Connect** para o ambiente de execução.
* `SUPABASE_CA_CERT`: conteúdo PEM do certificado CA oficial do Supabase,
  baixado em **Database → Settings → SSL Configuration**.
* `SUPABASE_URL`: URL do projeto Supabase, disponível em **Project Settings →
  API**.
* `SUPABASE_SERVICE_ROLE_KEY`: chave de serviço do projeto, usada somente no
  backend para criar URLs temporárias e gerenciar arquivos no bucket privado.
  Nunca use essa chave em variáveis `VITE_*` nem a exponha no navegador.
* `SESSION_SECRET` (recomendado): segredo aleatório de pelo menos 32 caracteres
  usado para assinar a sessão de login. Se omitido, a chave é derivada de
  `DATABASE_URL`.
* `FRONTEND_ORIGINS`: origens do frontend autorizadas quando ele não estiver no
  mesmo host da API.

Não configure `DATABASE_URL` como variável `VITE_*`. Ela e o certificado são
usados exclusivamente pela função Node.js. Após adicionar as funções e variáveis,
faça um novo deploy na Vercel.

### Materiais, avisos e avaliações

A migração `20261116150000_add_monitor_materials_reviews.sql` cria as tabelas
de materiais e avaliações e configura o bucket privado `monitor-materials`,
com limite de 10 MB e tipos de arquivo permitidos. Aplique as migrações com
`npx supabase db push` antes de usar esses recursos.

Configure `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` no ambiente local do
backend e nas variáveis do projeto Vercel. A chave de serviço não deve ser
compartilhada nem publicada no frontend. Somente o monitor dono pode publicar
ou remover materiais/avisos; todos os usuários autenticados podem visualizá-los.
Usuários autenticados podem enviar uma avaliação de 1 a 5 por monitor, editar a
própria avaliação e removê-la; o monitor pode remover avaliações do próprio
perfil.

## Rotas do backend

### Testar conexão com o banco

```http
GET /api/health
```

Essa rota verifica se a API está em execução. A conexão com o banco é validada
pelas operações que consultam o PostgreSQL.

### Cadastro de usuário

```http
POST /api/cadastro
```

Corpo da requisição:

```json
{
  "nome": "Caio",
  "email": "caio@email.com",
  "senha": "123456"
}
```

### Login de usuário

```http
POST /api/login
```

Corpo da requisição:

```json
{
  "email": "caio@email.com",
  "senha": "123456"
}
```

O login cria um cookie de sessão `HttpOnly`; as rotas da agenda exigem uma
sessão válida. Apenas o monitor dono do perfil pode criar, editar e excluir
aulas. Alunos e monitores autenticados podem ver as aulas e acessar o link da
sala.

## Fluxo da aplicação

```txt
React → Backend Node.js → PostgreSQL no Supabase
```

O React não se conecta diretamente ao banco de dados. Ele envia requisições para
o backend; a connection string fica somente no servidor.

## Migração dos dados existentes

O esquema PostgreSQL está preparado, mas aplicar a migração **não copia
automaticamente** os registros do banco MySQL antigo. Faça backup do banco
anterior e valide a migração dos dados em um projeto Supabase de teste antes de
trocar o ambiente utilizado pela aplicação. As senhas do novo esquema usam
hash; dados legados precisam ser convertidos para hash durante a transferência.

## Autor

Desenvolvido por **Caio Campos, Adriany Dantas, Michael Pascoal**.
