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
* Perfil do monitor
* Exibição de nome, nota e matéria do monitor
* Calendário interativo para criação de horários de aula
* Botão para acessar aula pelo Google Meet
* Integração com banco de dados PostgreSQL no Supabase

As configurações permitem que alunos editem nome e biografia; monitores também
podem gerenciar as matérias ensinadas e o link do Google Meet. A troca de senha
é uma ação separada e opcional. As tabelas são criadas por migrações versionadas
em `supabase/migrations`, e as senhas são armazenadas com hash.

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
```

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
