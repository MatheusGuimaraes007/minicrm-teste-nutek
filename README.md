# MiniCRM — Teste Técnico Nutek Software

Sistema simplificado de gestão de contatos com autenticação, painel web e automações via n8n.

## Arquitetura

```
┌──────────────────┐     ┌────────────────────┐     ┌──────────────────────┐
│  Frontend (SPA)  │────▶│  API Gateway       │────▶│  Auth Service        │
│  React + Vite    │     │  Cloudflare Worker  │     │  Node.js + Express   │
│  Cloudflare Pages│     │  (Hono)            │     │  Docker              │
└──────────────────┘     └────────┬───────────┘     └──────────┬───────────┘
                                  │                             │
                                  ▼                             ▼
                         ┌────────────────┐           ┌─────────────────┐
                         │  n8n           │           │  PostgreSQL     │
                         │  (Automações)  │           │  + Redis        │
                         └────────────────┘           └─────────────────┘
```

## Stack Tecnológica

| Camada | Tecnologias |
|--------|-------------|
| **Frontend** | React 19, Vite 6, TypeScript, Tailwind CSS, React Hook Form, Zod, Axios |
| **API Gateway** | Hono (Cloudflare Workers), jose (JWT) |
| **Auth Service** | Node.js 22, Express, TypeScript, Prisma ORM, bcrypt, jsonwebtoken, Zod |
| **Automações** | n8n (webhooks para CRUD de contatos) |
| **Banco de Dados** | PostgreSQL 15, Redis |
| **Infraestrutura** | Docker Compose, Traefik v2.11 |

## Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e rodando
- [Node.js 22+](https://nodejs.org/) (para o frontend em dev)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (para deploy do API Gateway)

## Setup Local

### 1. Clonar e configurar ambiente

```bash
git clone https://github.com/MatheusGuimaraes007/minicrm-teste-nutek.git
cd minicrm-teste-nutek
cp .env.example .env
# Edite o .env com suas credenciais (ou use os valores padrão para dev)
```

### 2. Subir todos os serviços

```bash
docker compose up -d
```

Isso sobe automaticamente:
- **Traefik** — reverse proxy (porta 80 e dashboard em 8080)
- **PostgreSQL** — banco de dados (porta 5432)
- **Redis** — cache de refresh tokens (porta 6379)
- **Auth Service** — autenticação (porta 8082, acessível via `http://auth.localhost`)
- **n8n** — automações (porta 5678, acessível via `http://n8n.localhost`)

As migrations do Prisma rodam automaticamente na inicialização do auth-service.

### 3. Configurar n8n

1. Acesse `http://n8n.localhost` e crie a conta de owner
2. Vá em **Credentials → Add → Postgres** e configure:
   - Host: `postgres` | Database: `minicrm_db` | User: `admin` | Password: `admin123` | Port: `5432`
3. Importe os 3 workflows de `n8n/workflows/` (menu ⋮ → Import from File)
4. Em cada workflow, conecte os nós Postgres à credencial criada
5. **Ative** cada workflow (toggle no canto superior direito)

Detalhes em [`n8n/README.md`](n8n/README.md).

### 4. Rodar o frontend

```bash
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:5173`.

## URLs de Acesso (Local)

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Auth Service | http://auth.localhost |
| n8n | http://n8n.localhost |
| Traefik Dashboard | http://traefik.localhost:8080 |

## URLs de Produção

| Serviço | URL |
|---------|-----|
| API Gateway | https://minicrm-api-gateway.minicrm-nutek-matheus.workers.dev |

## Estrutura do Projeto

```
├── auth-service/          # Serviço de autenticação (Node.js + Express + TS)
│   ├── prisma/            # Schema e migrations do Prisma
│   ├── src/
│   │   ├── config/        # Variáveis de ambiente, Prisma, Redis
│   │   ├── middlewares/    # Error handler, auth middleware
│   │   ├── modules/auth/  # Rotas, controllers, services, schemas
│   │   └── utils/         # JWT, password hashing
│   └── Dockerfile         # Multi-stage build
├── api-gateway/           # Cloudflare Worker (Hono)
│   └── src/
│       ├── middlewares/   # Validação JWT (jose)
│       └── routes/        # Proxy auth + contacts
├── frontend/              # SPA React + Vite + Tailwind
│   └── src/
│       ├── features/      # Organizado por feature (auth, contacts)
│       └── shared/        # API client, hooks, componentes compartilhados
├── n8n/
│   └── workflows/         # JSONs dos 3 workflows exportados
├── docker-compose.yml     # Orquestração de todos os serviços
└── .env.example           # Template de variáveis de ambiente
```

## Endpoints da API

### Auth Service (`/auth`)

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| POST | `/auth/register` | Criar usuário | Não |
| POST | `/auth/login` | Login (retorna JWT + refresh token) | Não |
| POST | `/auth/refresh` | Renovar JWT | Não |
| POST | `/auth/logout` | Invalidar refresh token | Não |

### Contatos via n8n (`/webhook/contacts`)

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| GET | `/webhook/contacts` | Listar contatos do usuário | Sim (x-user-id) |
| POST | `/webhook/contacts` | Criar contato | Sim (x-user-id) |
| DELETE | `/webhook/contacts?contactId=ID` | Deletar contato | Sim (x-user-id) |

## Decisões Técnicas

- **JWT em sessionStorage**: Access token (15min) em sessionStorage para evitar XSS via cookies. Refresh token (7 dias) em localStorage com invalidação no Redis.
- **Vite Proxy em dev**: O frontend usa proxy do Vite para rotear `/auth` para o auth-service e `/contacts` para o n8n, evitando problemas de CORS em desenvolvimento.
- **n8n para CRUD**: Os contatos são gerenciados via webhooks do n8n com queries SQL diretas no PostgreSQL, conforme especificado.
- **Banco separado para n8n**: O n8n usa `n8n_db` enquanto a aplicação usa `minicrm_db`, evitando conflitos de tabelas internas.
- **Prisma ORM**: Migrations versionadas no repositório para reprodutibilidade.