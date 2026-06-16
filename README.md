# Monitor Easy

O **Monitor Easy** é uma aplicação web desenvolvida em React com backend em Node.js e banco de dados MySQL. O objetivo do projeto é facilitar o cadastro, login e gerenciamento de monitores, permitindo que alunos encontrem monitores por matéria e visualizem horários disponíveis para aulas.

## Tecnologias utilizadas

* React
* JavaScript
* CSS
* Node.js
* Express
* MySQL
* Aiven MySQL
* CORS
* Dotenv
* MySQL2

## Funcionalidades

* Página inicial com apresentação do projeto
* Tela de cadastro de usuários
* Tela de login
* Perfil do monitor
* Exibição de nome, nota e matéria do monitor
* Calendário interativo para criação de horários de aula
* Botão para acessar aula pelo Google Meet
* Integração com banco de dados MySQL

## Estrutura do projeto

```txt
monitor-easy/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
└── backend/
    ├── server.js
    ├── db.js
    ├── .env
    ├── ca.pem
    └── package.json
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

## Configuração do frontend

Entre na pasta do frontend:

```bash
cd frontend
```

Instale as dependências:

```bash
npm install
```

Execute o projeto:

```bash
npm run dev
```

O frontend será iniciado em:

```txt
http://localhost:5173
```

## Configuração do backend

Entre na pasta do backend:

```bash
cd backend
```

Instale as dependências:

```bash
npm install
```

Instale os pacotes necessários:

```bash
npm install express mysql2 cors dotenv
```

Crie um arquivo `.env` dentro da pasta `backend` com as informações do banco de dados:

```env
DB_HOST=seu-host-do-aiven
DB_PORT=sua-porta
DB_USER=avnadmin
DB_PASSWORD=sua-senha
DB_NAME=defaultdb
PORT=3001
```

Também é necessário adicionar o certificado SSL do banco de dados Aiven.

Baixe o certificado no painel do Aiven e salve na pasta `backend` com o nome:

```txt
ca.pem
```

Execute o backend:

```bash
node server.js
```

O backend será iniciado em:

```txt
http://localhost:3001
```

## Banco de dados

O banco de dados utilizado é MySQL hospedado na plataforma Aiven.

Exemplo de tabela de usuários:

```sql
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  senha VARCHAR(100) NOT NULL
);
```

## Rotas do backend

### Testar conexão com o banco

```http
GET /teste-banco
```

Essa rota testa se o backend está conseguindo se conectar ao banco de dados.

### Cadastro de usuário

```http
POST /cadastro
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
POST /login
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
React → Backend Node.js → Banco de dados MySQL
```

O React não se conecta diretamente ao banco de dados. Ele envia requisições para o backend, e o backend é responsável por acessar o MySQL.

## Observação sobre senhas

Neste projeto, as senhas estão sendo salvas sem criptografia por se tratar de um projeto acadêmico simples.

Em projetos reais, o recomendado é utilizar criptografia de senhas com bibliotecas como `bcrypt`.

## Autor

Desenvolvido por **Caio Campos, Adriany Dantas, Michael Pascoal**.
