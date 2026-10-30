# Chirpy

API HTTP de uma rede social curta, feita em TypeScript com Express 5. Os utilizadores criam conta, publicam chirps até 140 caracteres, fazem login com JWT e podem ser promovidos a Chirpy Red através de um webhook.

## Stack

- Express 5 para as rotas e o middleware
- PostgreSQL com Drizzle ORM e migrações em `src/db/migrations`
- Argon2 para as passwords
- JSON Web Tokens para a sessão, mais refresh tokens guardados na base de dados

## Funcionalidades

- Ficheiros estáticos em `/app` e contagem de visitas em `/admin/metrics`
- Health check em `GET /api/healthz`
- Registo, login e atualização de email e password
- Access token com validade de 1 hora e refresh token com validade de 30 dias
- Revogação do refresh token
- Criação, listagem, consulta e apagar chirps
- Substituição das palavras `kerfuffle`, `sharbert` e `fornax` por `****`
- Filtro da lista por `authorId` e ordenação por `sort=asc` ou `sort=desc` (ascendente por omissão)
- Webhook da Polka que marca `isChirpyRed` quando o evento é `user.upgraded` e a API key é válida
- Reset da base de dados e do contador de visitas, apenas com `PLATFORM=dev`
- Erros da API com estado HTTP próprio: 400, 401, 403 e 404

## Endpoints

| Método | Caminho | Auth | Descrição |
| --- | --- | --- | --- |
| `GET` | `/api/healthz` | — | Responde `OK` |
| `GET` | `/app` | — | Site estático |
| `GET` | `/admin/metrics` | — | HTML com o número de visitas a `/app` |
| `POST` | `/admin/reset` | — | Apaga chirps, refresh tokens e utilizadores. Só em `dev` |
| `POST` | `/api/users` | — | Cria um utilizador. Body: `email`, `password` |
| `PUT` | `/api/users` | Bearer access token | Atualiza email e password do utilizador do token |
| `POST` | `/api/login` | — | Devolve o utilizador, `token` e `refreshToken` |
| `POST` | `/api/refresh` | Bearer refresh token | Devolve um access token novo |
| `POST` | `/api/revoke` | Bearer refresh token | Revoga o refresh token. Resposta `204` |
| `POST` | `/api/chirps` | Bearer access token | Cria um chirp. Body: `body` |
| `GET` | `/api/chirps` | — | Lista chirps. Query opcional: `authorId`, `sort` |
| `GET` | `/api/chirps/:id` | — | Devolve um chirp |
| `DELETE` | `/api/chirps/:chirpId` | Bearer access token | Apaga o chirp se pertencer ao autor |
| `POST` | `/api/polka/webhooks` | `Authorization: ApiKey <POLKA_KEY>` | Evento `user.upgraded` ativa o Chirpy Red. Outros eventos respondem `204` |

O access token vai no header `Authorization: Bearer <token>`. A resposta de erro tem a forma `{ "error": "..." }`.

## Configuração

Cria um ficheiro `.env` na raiz do projeto:

```env
DB_URL="postgres://wagslane:postgres@localhost:5432/chirpy?sslmode=disable"
PORT=8080
PLATFORM=dev
JWT_SECRET="uma-chave-longa"
POLKA_KEY="a-chave-que-a-polka-envia"
```

A base de dados `chirpy` tem de existir e pertencer ao utilizador usado em `DB_URL`. O Postgres escuta na porta `5432`. A `8080` é a porta do servidor HTTP.

## Como correr

Na raiz do projeto:

```bash
npm install
npx drizzle-kit generate
npx drizzle-kit migrate
npm run dev
```

`npm run dev` compila com `tsc` e arranca `dist/index.js`. O servidor fica em `http://localhost:8080`.

Outros scripts:

- `npm run build` compila para `dist`
- `npm start` corre o build já compilado
- `npm test` corre os testes com Vitest

## Estrutura

```text
src/
  index.ts              rotas e handlers
  config.ts             leitura do .env
  auth/auth.ts          passwords, JWT, refresh tokens e API key
  error/APIErrors.ts    erros HTTP
  app/                  ficheiros estáticos
  db/schema.ts          tabelas users, chirps e refresh_tokens
  db/queries/           acesso à base de dados
  db/migrations/        SQL gerado pelo Drizzle
```
