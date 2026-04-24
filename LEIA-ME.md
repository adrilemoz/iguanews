# 📋 IguaNews — Changelog de Sprints

Histórico de refatorações e funcionalidades entregues por sprint.  
Para instruções de instalação consulte o [`README.md`](./README.md).

---

## Sprint 1 — Qualidade de código & Bugs críticos

**Foco:** eliminar duplicação de código no frontend admin e corrigir três bugs silenciosos.

### 🐛 Bugs corrigidos

| ID | Arquivo | Descrição |
|----|---------|-----------|
| B1 | `frontend/src/App.jsx` | Rota `/admin/categorias` renderizava `<AdminNoticias>` em vez de `<AdminCategorias>`; import lazy adicionado |
| B2 | `backend/src/models/Noticia.js` | Enum de `status` não incluía `'revisao'`; rotas e frontend já usavam esse valor |
| B3 | `frontend/src/App.jsx` | `<AdminSEO>` não estava envolto em `<AdminSuspense>`, causando crash no carregamento lazy |

### 🏗️ Novos arquivos

| Arquivo | Descrição |
|---------|-----------|
| `frontend/src/themes/tokens.js` | Fonte única de tokens de cor (CSS vars + fallbacks hardcoded) |
| `frontend/src/components/admin/ui/AdminIcon.jsx` | Biblioteca SVG centralizada — 50+ ícones nomeados |
| `frontend/src/components/admin/ui/ForcaSenha.jsx` | Indicador de força de senha unificado (5 níveis) |
| `frontend/src/utils/permissions.js` | `GRUPOS_PERMISSOES` — fonte única para AdminUsuarios e futuros consumidores |
| `frontend/src/styles/base.css` | Tailwind + reset global (extraído de `index.css`) |
| `frontend/src/styles/public.css` | Componentes do site público — `.btn`, `.card`, `.prose-news`… |
| `frontend/src/styles/admin.css` | Design system do painel — `.admin-shell`, `.adm-*` |

### ✏️ Arquivos modificados

| Arquivo | O que mudou |
|---------|-------------|
| `frontend/src/index.css` | Agora contém apenas 3 `@import` apontando para `styles/` |
| `frontend/src/App.jsx` | Bugs B1 e B3 corrigidos |
| `frontend/src/pages/admin/AdminDashboard.jsx` | `const C` e `const Ico` substituídos por imports de `tokens.js` e `AdminIcon` |
| `frontend/src/pages/admin/AdminNoticias.jsx` | Idem |
| `frontend/src/pages/admin/AdminSEO.jsx` | Idem |
| `frontend/src/pages/admin/AdminSetup.jsx` | Idem; `calcForca`/`BarraForca` removidos — usa `ForcaSenha` importado |
| `frontend/src/pages/admin/AdminInfraestrutura.jsx` | Idem; `Spin` local substituído por `AdminIcon name="spinSm"` |
| `frontend/src/pages/admin/AdminUsuarios.jsx` | `ForcaSenha` local e `GRUPOS_PERMISSOES` removidos — usa imports centralizados |
| `backend/src/models/Noticia.js` | Bug B2 corrigido — `'revisao'` adicionado ao enum |

### 🗑️ Arquivos removidos

| Arquivo | Motivo |
|---------|--------|
| `backend/src/routes/setup.js.patch` | Nota de uma linha sem conteúdo útil; rota já existia |
| `frontend/src/services/setupService.patch.js` | Todos os métodos já estavam integrados em `api.js` com mais funcionalidades |

---

## Pré-Sprint 1 — Instalador Web (estilo WordPress)

Funcionalidade entregue antes do Sprint 1. Documentada aqui para referência.

### Arquivos entregues

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `backend/src/routes/setup.js` | Substituído | Rota de setup com seed e reset via HTTP |
| `frontend/src/pages/admin/AdminSetup.jsx` | Substituído | Tela de instalação completa (4 fases) |

### Rotas do instalador

| Método | Caminho | Auth | Descrição |
|--------|---------|------|-----------|
| `GET` | `/api/setup/status` | Não | Estado do banco: vazio, instalado, contagens |
| `POST` | `/api/setup` | Não | Instalação inicial (banco vazio) |
| `POST` | `/api/setup/seed` | ✅ | Importar dados de exemplo |
| `POST` | `/api/setup/reset-db` | ✅ | Resetar banco (requer confirmação) |
| `GET` | `/api/setup/env-config` | ✅ | Ler variáveis de ambiente editáveis |
| `POST` | `/api/setup/env-config` | ✅ | Salvar variáveis de ambiente |
| `POST` | `/api/setup/test-mongo` | ✅ | Testar conexão MongoDB |
| `POST` | `/api/setup/test-cloudinary` | ✅ | Testar conexão Cloudinary |
| `POST` | `/api/setup/desativar` | ✅ | Desativar o modo setup |

### Fluxo resumido

```
/admin/setup
    │
    ▼
GET /api/setup/status
    │
banco vazio?
┌───┴───┐
Sim     Não
│       │
▼       ▼
Tela de  Painel de gerenciamento
instalação (banco / seed / reset / env)
```

### Dados importados pelo seed

- 10 categorias, 5 notícias de exemplo, 3 notícias externas
- 2 linhas de ônibus com horários, 3 eventos futuros
- Configuração da home, 4 módulos da home

---

## Sprint 2 — Extração de hooks

**Foco:** mover lógica de fetch/CRUD para fora dos componentes, deixando apenas estado de UI neles.

### 🏗️ Novos arquivos

| Arquivo | Extraído de | O que encapsula |
|---------|-------------|-----------------|
| `frontend/src/hooks/useUsuarios.js` | `AdminUsuarios.jsx` | `usuarios`, `perfis`, `loading`, `busca`, CRUD completo, `usuariosFiltrados` |
| `frontend/src/hooks/useEventos.js` | `AdminEventos.jsx` | `eventos`, `loading`, `salvarEvento`, `excluirEvento`, `eventosDatas`, `futuros`, `passados` |
| `frontend/src/hooks/useRss.js` | `AdminRssImport.jsx` | `fontes`, `padrao`, `categorias`, todos os loading states, `adicionarPadrao`, `salvarFonte`, `excluirFonte`, `importarFonte`, `importarTodas`, `temFontesAtivas` |

### ✏️ Arquivos modificados

| Arquivo | O que mudou |
|---------|-------------|
| `frontend/src/pages/admin/AdminUsuarios.jsx` | Fetch/CRUD removido; usa `useUsuarios()`. Estado de UI restante: `modalUsr`, `modalPrf`, `excluindo` |
| `frontend/src/pages/admin/AdminEventos.jsx` | Fetch/CRUD removido; usa `useEventos()`. Estado de UI restante: `editando`, `editEvento`, `confirm` |
| `frontend/src/pages/admin/AdminRssImport.jsx` | Fetch/CRUD removido; usa `useRss()`. Estado de UI restante: `modal` (abertura do modal de edição) |

### 🧹 Imports removidos dos componentes

| Componente | Import removido |
|-----------|-----------------|
| `AdminEventos.jsx` | `useEffect`, `eventosService` |
| `AdminRssImport.jsx` | `useEffect`, `useCallback`, `categoriasService` |

---

## Sprint 3 — Backend: controller + service + limpeza

**Foco:** extrair a lógica de negócio de `routes/noticias.js` para camadas dedicadas e eliminar arquivo obsoleto.

### 🏗️ Novos arquivos

`backend/src/services/noticiaService.js` centraliza toda a lógica pura do domínio de notícias — sem dependência de `req`/`res`. Exporta: `TRANSICOES_VALIDAS`, `validarTransicao`, `popular`, `popularUm`, `buildFiltro` (monta o filtro MongoDB a partir dos query params, resolvendo slugs de categorias e regras de visibilidade por status), `buildSort` e `extrairCampos`.

`backend/src/controllers/noticiasController.js` contém os 9 handlers HTTP extraídos das rotas: `listar`, `contagemStatus`, `buscarUm`, `criar`, `atualizar`, `mudarStatus`, `excluir`, `adicionarGaleria` e `removerGaleria`. Cada função recebe `(req, res, next)` e delega a lógica ao service — pode ser testada isoladamente com mocks.

### ✏️ Arquivos modificados

`backend/src/routes/noticias.js` passou de 283 linhas para 83. Agora contém apenas imports e declarações de rota, sem nenhuma lógica inline.

### 🗑️ Arquivos removidos

`backend/src/routes/rssImport.js` — marcado como `⚠️ ARQUIVO DEPRECADO` desde a criação, nunca montado em `server.js`, com todas as suas funcionalidades já migradas para `rssAdmin.js` e `services/rssImporter.js`.
