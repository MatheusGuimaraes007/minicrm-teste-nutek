# Configuração dos Workflows n8n

## 1. Acessar o n8n

Abra o navegador em: **http://n8n.localhost** (ou http://localhost:5678)

Na primeira vez, crie uma conta de owner (usuário administrador).

## 2. Criar Credenciais

### PostgreSQL

1. Vá em **Settings → Credentials → Add Credential**
2. Busque por **Postgres**
3. Configure:
   - **Name:** `Postgres MiniCRM`
   - **Host:** `postgres`
   - **Port:** `5432`
   - **Database:** `minicrm_db`
   - **User:** `admin`
   - **Password:** `admin123`
4. Clique em **Save**

### Redis (Cache)

1. Vá em **Settings → Credentials → Add Credential**
2. Busque por **Redis**
3. Configure:
   - **Name:** `Redis MiniCRM`
   - **Host:** `redis`
   - **Port:** `6379`
   - **Password:** *(deixe em branco)*
4. Clique em **Save**

## 3. Importar Workflows

Para cada arquivo JSON em `n8n/workflows/`:

1. Vá em **Workflows → Add Workflow** (ou importe)
2. Clique no menu **⋮** → **Import from File**
3. Selecione o arquivo JSON
4. **Importante:** Em cada nó "Postgres", selecione a credencial `Postgres MiniCRM`. Em cada nó "Redis", selecione `Redis MiniCRM`.
5. Salve o workflow

Repita para os 3 arquivos:
- `list-contacts.json` — GET /webhook/contacts
- `create-contact.json` — POST /webhook/contacts
- `delete-contact.json` — DELETE /webhook/contacts

## 4. Ativar os Workflows

Para cada workflow importado:
1. Abra o workflow
2. No canto superior direito, ative o toggle **Active**
3. Só quando ativo, o webhook de "produção" (`/webhook/contacts`) fica disponível

> **Nota:** Em modo de teste (workflow inativo), o webhook fica em `/webhook-test/contacts`. Para o frontend funcionar, os workflows devem estar **ativos**.

## 5. Testar

Após ativar, teste manualmente:

```bash
# Listar contatos (precisa de x-user-id válido)
curl http://n8n.localhost/webhook/contacts -H "x-user-id: SEU_USER_ID"

# Criar contato
curl -X POST http://n8n.localhost/webhook/contacts \
  -H "Content-Type: application/json" \
  -H "x-user-id: SEU_USER_ID" \
  -d '{"name": "João Silva", "email": "joao@email.com", "phone": "11999999999"}'

# Deletar contato
curl -X DELETE "http://n8n.localhost/webhook/contacts?contactId=ID_DO_CONTATO" \
  -H "x-user-id: SEU_USER_ID"
```

## Arquitetura dos Fluxos

### Listar Contatos (GET) — com Cache Redis
```
Webhook GET → Validar userId → Redis GET (contacts:userId)
  → Cache Hit? (IF)
    → ✅ Parse Cache → Responder 200 (cached)
    → ❌ Postgres SELECT → Responder 200 + Preparar Cache → Redis SET (TTL 5min)
```

### Criar Contato (POST) — com Invalidação de Cache
```
Webhook POST → Validar (nome obrigatório)
  → Postgres INSERT → Responder 201
                    → Redis DEL (contacts:userId)
```

### Deletar Contato (DELETE) — com Invalidação de Cache
```
Webhook DELETE → Validar UUIDs
  → Postgres DELETE → Responder 204
                   → Redis DEL (contacts:userId)
```

### Cache Redis (Diferencial)

- **Chave:** `contacts:${userId}` — uma entrada por usuário
- **TTL:** 300 segundos (5 minutos)
- **Leitura:** Ao listar contatos, verifica o cache antes de consultar o banco
- **Invalidação:** Ao criar ou deletar um contato, o cache do usuário é removido automaticamente
