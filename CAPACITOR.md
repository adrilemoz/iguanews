# Setup Capacitor — IguaNews APK

O APK é gerado automaticamente pelo GitHub Actions a cada push na branch `main`.
Execute os passos abaixo **uma única vez** no seu computador para preparar o projeto.

---

## URLs de produção

| Serviço   | URL                                          |
|-----------|----------------------------------------------|
| Frontend  | https://iguanews.vercel.app                  |
| Backend   | https://iguanews-backend.onrender.com        |
| API       | https://iguanews-backend.onrender.com/api    |

---

## 1. Adicionar o Secret no GitHub (obrigatório antes do primeiro APK)

O workflow precisa saber a URL do backend na hora de compilar o app.

1. Acesse seu repositório no GitHub
2. Vá em **Settings → Secrets and variables → Actions**
3. Clique em **New repository secret**
4. Adicione:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://iguanews-backend.onrender.com/api`
5. Clique em **Add secret**

---

## 2. Instalar dependências Capacitor (uma vez)

```bash
cd frontend
npm install @capacitor/core @capacitor/cli @capacitor/android
```

## 3. Inicializar o projeto Android (uma vez)

```bash
# Gera a pasta android/ com o projeto Gradle
npx cap add android
```

> Se pedir confirmação, responda `y`.

## 4. Build e sincronização

```bash
npm run build        # gera o dist/
npx cap sync android # copia dist/ para android/app/src/main/assets/public
```

## 5. Commitar e fazer push

```bash
cd ..   # raiz do projeto
git add frontend/android frontend/capacitor.config.ts
git commit -m "feat: adiciona projeto Capacitor Android"
git push
```

Após o push, o workflow `CI — Build & APK` roda automaticamente.
O APK fica disponível em **Actions → seu run → Artifacts → iguanews-apk-N**.

---

## Como o app funciona

O `capacitor.config.ts` está configurado com `server.url: 'https://iguanews.vercel.app'`.
Isso significa que o APK carrega o site ao vivo pelo Vercel.

**Vantagem:** qualquer atualização feita no frontend e publicada no Vercel aparece
automaticamente no app — sem precisar gerar e redistribuir um novo APK.

---

## Gerar APK Release (para publicar na Play Store)

### 1. Gerar keystore (feito uma vez)

```bash
keytool -genkey -v \
  -keystore release.keystore \
  -alias iguanews \
  -keyalg RSA -keysize 2048 \
  -validity 10000
```

### 2. Adicionar secrets no GitHub

Vá em **Settings → Secrets and variables → Actions** e adicione:

| Secret             | Valor                                         |
|--------------------|-----------------------------------------------|
| `VITE_API_URL`     | `https://iguanews-backend.onrender.com/api`   |
| `KEYSTORE_BASE64`  | saída de: `base64 release.keystore`           |
| `KEYSTORE_PASSWORD`| senha escolhida no keytool                    |
| `KEY_ALIAS`        | `iguanews`                                    |
| `KEY_PASSWORD`     | senha da chave                                |

### 3. Atualizar o workflow para release

Substitua o step `Build APK debug` no arquivo `.github/workflows/ci.yml` por:

```yaml
- name: Decode keystore
  run: |
    echo "${{ secrets.KEYSTORE_BASE64 }}" | base64 -d > frontend/android/release.keystore

- name: Build APK release
  working-directory: frontend/android
  run: ./gradlew assembleRelease --no-daemon
  env:
    KEYSTORE_PATH: release.keystore
    KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
    KEY_ALIAS: ${{ secrets.KEY_ALIAS }}
    KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
```
