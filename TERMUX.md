# IguaNews — Rodando no Termux (Android)

Guia específico para rodar o **backend** no Termux.

---

## Pré-requisitos

```bash
pkg update && pkg upgrade
pkg install nodejs git
node -v   # precisa ser v18+ para Brotli funcionar
```

---

## Instalação

```bash
git clone https://github.com/SEU_USUARIO/iguanews.git
cd iguanews/backend
npm install
```

---

## Configurar o .env

O arquivo `backend/.env` **já vem preenchido** com as credenciais do projeto.
Confirme que ele existe e está correto:

```bash
cat .env
```

Você deve ver algo como:
```
PORT=3001
MONGO_URI=mongodb+srv://iguanews:...
CLOUDINARY_CLOUD_NAME=dp1drcg8a
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
JWT_SECRET=iguanews_jwt_secret_troque_em_producao
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=admin@iguanews.com
ADMIN_SENHA=admin123
```

---

## 🐛 Erro "Variáveis de ambiente inválidas" mesmo com .env preenchido

**Este é o erro mais comum no Termux e tem causa conhecida.**

```
❌ Variáveis de ambiente inválidas:
   • MONGO_URI: Required
   • JWT_SECRET: Required
   • CLOUDINARY_CLOUD_NAME: Required
   ...
Failed running 'src/server.js'. Waiting for file changes before restarting...
```

### Por que acontece

O projeto usa ES Modules (`"type": "module"` no package.json). Em ES Modules,
**todos os `import` são hoistados** pelo Node.js antes de qualquer código rodar.

Isso significa que, em `server.js`, mesmo que você escreva:

```js
import './config/env.js'   // ← Zod valida process.env AQUI
import 'dotenv/config'     // ← .env é carregado AQUI — mas já é tarde!
```

O Node executa os dois imports *antes* de qualquer linha de código, na ordem
em que aparecem no arquivo. O `env.js` roda primeiro, o Zod tenta validar
`process.env` — que ainda está vazio — e o servidor aborta.

### Solução (já aplicada nesta versão)

O `import 'dotenv/config'` foi movido para **dentro do `src/config/env.js`**,
garantindo que o `.env` seja carregado antes da validação Zod.

Se você ainda ver o erro, verifique:

1. **Está na pasta certa?**
   ```bash
   pwd
   # deve mostrar .../iguanews/backend
   ```

2. **O .env existe?**
   ```bash
   ls -la .env
   ```

3. **Alguma variável tem espaço no valor?** (errado: `JWT_SECRET= abc`, correto: `JWT_SECRET=abc`)
   ```bash
   cat -A .env | grep "^ "
   # não deve retornar nada
   ```

4. **A versão do arquivo `src/config/env.js` tem o `import 'dotenv/config'` no topo?**
   ```bash
   head -5 src/config/env.js
   # deve mostrar: import 'dotenv/config'
   ```
   Se não mostrar, o arquivo está desatualizado — veja a seção de correção manual abaixo.

---

## Correção manual (se o arquivo env.js estiver desatualizado)

Edite `src/config/env.js` e adicione `import 'dotenv/config'` como **primeira linha**
do arquivo (antes de `import { z } from 'zod'`):

```bash
# Com sed (Termux tem sed instalado por padrão):
sed -i "1s|^|import 'dotenv/config'\n|" src/config/env.js

# Confirmar:
head -3 src/config/env.js
```

Resultado esperado:
```js
import 'dotenv/config'
import { z } from 'zod'
...
```

---

## Redis (opcional — não bloqueia o servidor)

O Termux não tem Redis disponível via `pkg`. O backend detecta isso automaticamente
e usa **cache em memória** como fallback. Você verá no log:

```
⚠️  Redis indisponível na inicialização — cache em memória ativo
```

Isso é normal e o servidor funciona normalmente. O cache em memória é reiniciado
quando o servidor reinicia.

---

## Rodando

```bash
# Primeira vez: popula o banco com admin + categorias
npm run seed

# Iniciar o servidor (com hot-reload)
npm run dev
```

Acesse no browser do celular: `http://localhost:3001/api/health`

Você deve ver:
```json
{ "ok": true, "env": "development", ... }
```

---

## Dicas Termux

- Use `tmux` ou `nohup npm run dev &` para manter o servidor rodando em background
- Para ver logs em tempo real: `npm run dev 2>&1 | tee server.log`
- O MongoDB Atlas aceita conexões externas (0.0.0.0/0 no Network Access), então
  funciona perfeitamente com o 4G/WiFi do celular
