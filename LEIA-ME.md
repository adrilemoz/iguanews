# 📦 IguaNews — Instalador Web (estilo WordPress)

## O que foi alterado / criado

| Arquivo | Ação | Descrição |
|---|---|---|
| `backend/src/routes/setup.js` | **Substituir** | Rota de setup com suporte a seed e reset via HTTP |
| `frontend/src/pages/admin/AdminSetup.jsx` | **Substituir** | Tela de instalação completa (4 fases) |
| `frontend/src/services/setupService.patch.js` | **Patch** | Métodos novos no `setupService` do `api.js` |

---

## Como aplicar

### 1. Backend — substituir `setup.js`

```bash
cp backend/src/routes/setup.js  SEU_PROJETO/backend/src/routes/setup.js
```

### 2. Frontend — substituir `AdminSetup.jsx`

```bash
cp frontend/src/pages/admin/AdminSetup.jsx  SEU_PROJETO/frontend/src/pages/admin/AdminSetup.jsx
```

### 3. Frontend — atualizar `api.js`

No arquivo `frontend/src/services/api.js`, localize o objeto `setupService` e substitua pelo conteúdo de `setupService.patch.js`.

---

## Rotas do backend (novas/alteradas)

| Método | Caminho | Auth | Descrição |
|---|---|---|---|
| `GET` | `/api/setup/status` | Não | Estado do banco: vazio, instalado, contagens |
| `POST` | `/api/setup` | Não | **Instalação inicial** (só funciona com banco vazio) |
| `POST` | `/api/setup/seed` | ✅ Sim | Importar dados de exemplo |
| `POST` | `/api/setup/reset-db` | ✅ Sim | Resetar banco (requer confirmação) |

---

## Fluxo do instalador

```
Acessa /admin/setup
       │
       ▼
GET /api/setup/status
       │
  setup_needed?
  ┌────┴────┐
  Sim       Não
  │         │
  ▼         ▼
Tela de   Painel de
Instalação gerenciamento
           (banco / seed / reset)
  │
  ▼
Formulário:
  • Nome do site
  • Nome do admin
  • Email / Senha
  • ☑ Importar dados de exemplo
  │
  ▼
POST /api/setup
  → Cria perfis (Superadmin, Admin, Editor, Jornalista, Visualizador)
  → Cria usuário superadmin
  → (opcional) Importa seed: categorias, notícias, eventos, ônibus
  │
  ▼
Tela de sucesso → redireciona /login (5s)
```

---

## Painel pós-instalação (`/admin/setup`)

Após instalar, ao acessar `/admin/setup` o sistema detecta que já está configurado
e exibe o **painel de gerenciamento de banco**:

- **Estado atual**: contagem de usuários, notícias, categorias, eventos, ônibus
- **Importar seed**: escolhe nome do site + opção de limpar antes
- **Reset do banco**: apaga tudo (com opção de manter usuários); requer digitar `CONFIRMAR_RESET`

---

## Dados importados pelo seed

- **10 categorias**: Política, Saúde, Educação, Esportes, Cultura, Economia, Segurança, Meio Ambiente, Curiosidades, História
- **5 notícias** de exemplo (adaptadas ao nome do site)
- **3 notícias externas** (G1, UOL, BBC)
- **2 linhas de ônibus** com horários
- **3 eventos** futuros
- **Configuração da home** (nome do site, cores)
- **4 módulos da home**

---

## Por que o seed antigo rodava no `npm install`?

O `seed.js` original era executado via `"postinstall"` no `package.json`.
Isso causava limpeza automática do banco a cada `npm install`, o que é indesejável em produção.

**Com o novo instalador**, o seed só roda quando você clica em "Importar dados de exemplo"
na interface web — sem risco de apagar dados existentes por acidente.

> Para remover o seed do postinstall, edite `backend/package.json` e remova
> a linha `"postinstall": "node seed.js"` (ou similar) dos `scripts`.

---

## Caminho direto para o instalador

```
http://localhost:5173/admin/setup
```

Se o banco estiver vazio → tela de instalação  
Se já instalado → painel de banco (requer login ativo na sessão)
