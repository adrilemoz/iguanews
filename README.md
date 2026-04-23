# 📰 IguaNews — Portal de Notícias

Portal de notícias para cidades do interior do Brasil.  
Stack: **React + Vite + Tailwind** (frontend) · **Node.js + Express + MongoDB + Cloudinary** (backend)

---

## Estrutura do projeto

```
iguanews/
├── backend/          → Servidor Node.js (Express + MongoDB + Cloudinary)
│   ├── .env          → Credenciais (já preenchidas)
│   ├── seed.js       → Cria admin e dados iniciais
│   └── src/
│       ├── server.js
│       ├── config/   → MongoDB, Cloudinary, env (Zod)
│       ├── models/   → Mongoose schemas
│       ├── routes/   → auth, noticias, categorias, fontes, upload, extras...
│       ├── middleware/ → auth JWT, upload Cloudinary, audit log...
│       └── utils/    → cache Redis, logger pino
├── frontend/         → React + Vite + Tailwind
│   ├── .env          → VITE_API_URL
│   └── src/
│       ├── services/api.js  → cliente HTTP para o backend
│       ├── context/AuthContext.jsx
│       ├── pages/    → Home, NoticiaDetalhe, Login, Eventos, Ônibus
│       └── pages/admin/ → Dashboard, NoticiaForm, Categorias, Módulos...
├── TERMUX.md         → Guia específico para rodar no Android/Termux
├── README_MONGO.md   → Guia detalhado de setup e migração
└── README.md         → Este arquivo
```

---

## 🚀 Rodando local

### Pré-requisitos

- Node.js v18+
- Conta no [MongoDB Atlas](https://cloud.mongodb.com) (gratuita)
- Conta no [Cloudinary](https://cloudinary.com) (gratuita)

### 1. Backend

```bash
cd backend
npm install
npm run seed   # Popula banco com admin + categorias padrão
npm run dev    # Servidor em http://localhost:3001
```

O arquivo `backend/.env` já vem preenchido. Confirme que está correto antes de rodar.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev    # App em http://localhost:5173
```

### Credenciais padrão do admin

- **Email:** admin@iguanews.com
- **Senha:** admin123

> ⚠️ Troque a senha após o primeiro login em produção!

---

## 📱 Rodando no Termux (Android)

Veja o guia completo em [`TERMUX.md`](./TERMUX.md), incluindo a solução para o erro
`"Variáveis de ambiente inválidas"` que aparece no Termux.

```bash
pkg install nodejs git
git clone https://github.com/SEU_USUARIO/iguanews.git
cd iguanews/backend
npm install && npm run seed && npm run dev
```

---

## 🌐 Deploy em produção

### Backend (Railway, Render, VPS...)

1. Suba a pasta `backend/`
2. Configure as variáveis de ambiente no painel do host:
   - `MONGO_URI`
   - `JWT_SECRET` — gere com `openssl rand -hex 32`
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `FRONTEND_URL=https://seu-site.com` (CORS)
3. Execute `npm run seed` uma vez para criar o admin
4. Execute `npm start`

### Frontend (Vercel, Netlify...)

1. Suba a pasta `frontend/`
2. Configure: `VITE_API_URL=https://seu-backend.com/api`
3. Build command: `npm run build`
4. Publish directory: `dist`

> ⚠️ No GitHub Actions (CI), configure o secret `VITE_API_URL` no repositório
> (Settings → Secrets → Actions).

---

## 📡 Rotas da API

### Públicas
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /api/noticias | Lista notícias (paginação, filtros, busca) |
| GET | /api/noticias/:id | Notícia por ID (incrementa views) |
| GET | /api/categorias | Lista categorias |
| GET | /api/fontes | Lista fontes |
| GET | /api/configuracoes | Configurações da home |
| GET | /api/modulos | Módulos da home |
| GET | /api/topicos | Tópicos ativos |
| GET | /api/eventos | Eventos (paginação por cursor) |
| GET | /api/onibus | Linhas de ônibus |
| GET | /api/health | Status dos serviços (MongoDB, Redis, Cloudinary) |
| GET | /sitemap.xml | Sitemap dinâmico |
| GET | /rss | Feed RSS |
| GET | /api/docs | Swagger UI |

### Autenticadas (requer cookie JWT)
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /api/auth/login | Login → define cookie HttpOnly |
| POST | /api/auth/logout | Logout → limpa cookie |
| GET | /api/auth/me | Dados do usuário logado |
| POST/PUT/DELETE | /api/noticias | CRUD de notícias |
| POST | /api/upload | Upload de imagem → Cloudinary |
| ... | (categorias, fontes, módulos, eventos, ônibus, etc.) | CRUD completo |

---

## 🛠️ Variáveis de ambiente

### backend/.env
| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `MONGO_URI` | ✅ | String de conexão MongoDB Atlas |
| `JWT_SECRET` | ✅ | Segredo para tokens JWT (mín. 16 chars) |
| `CLOUDINARY_CLOUD_NAME` | ✅ | Cloud name do Cloudinary |
| `CLOUDINARY_API_KEY` | ✅ | API Key do Cloudinary |
| `CLOUDINARY_API_SECRET` | ✅ | API Secret do Cloudinary |
| `PORT` | — | Porta do servidor (padrão: 3001) |
| `JWT_EXPIRES_IN` | — | Validade do token (padrão: 7d) |
| `REDIS_URL` | — | URL do Redis (padrão: localhost:6379) |
| `FRONTEND_URL` | — | URL do frontend para CORS (padrão: localhost:5173) |

### frontend/.env
| Variável | Descrição |
|----------|-----------|
| `VITE_API_URL` | URL do backend (padrão: http://localhost:3001/api) |

---

## 📦 Stack completa

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6 |
| Backend | Node.js 18+, Express 4, ES Modules |
| Banco de dados | MongoDB Atlas (Mongoose) |
| Autenticação | JWT (cookie HttpOnly) + bcryptjs |
| Upload de imagens | Cloudinary via Multer |
| Cache | Redis (ioredis) com fallback em memória |
| Logs | Pino + pino-http |
| Métricas | Prometheus (prom-client) em /metrics |
| Documentação API | Swagger UI em /api/docs |
| Validação env | Zod |
| Migrações | migrate-mongo |
| Testes | Jest + Supertest |
| CI | GitHub Actions |

---

## 🗄️ Backup do banco de dados

O painel admin (`/admin/backup`) oferece gerenciamento completo de backups:

| Operação | Como funciona |
|---|---|
| **Criar** | Exporta todas as coleções para `backend/backups/backup_<timestamp>.json` |
| **Importar** | Envia um arquivo `.json` (exportado anteriormente) de volta ao servidor |
| **Download** | Baixa o arquivo JSON do backup para o computador local |
| **Restaurar** | Apaga os dados atuais e reinserere os dados do backup |
| **Excluir** | Remove os arquivos `.json` e `.manifest.json` do servidor |

> **Dica:** Combine "Download" com "Importar" para mover backups entre ambientes (ex.: produção → staging).
